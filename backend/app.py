import json
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

app = FastAPI(title="OTTO CDSS - Brain 3.0", version="3.0.0")

# Configuração CORS (Permite acesso do Frontend)
origins = ["http://localhost", "http://127.0.0.1:8000", "https://dhsig86.github.io", "*"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# Modelo de Dados Robusto (Espelha o que o Frontend envia)
class DadosPaciente(BaseModel):
    idade: int = 0
    sexo: str = "Indefinido"
    sintomas_gerais: List[str] = []
    regioes: List[str] = []
    # Novos campos estruturados
    sintomas_especificos: List[str] = [] # Lista simples para busca rápida
    respostas_qualificadores: Dict[str, Any] = {} # Ex: {"dor_ouvido": {"intensidade": 8, "tipo": "pulsatil"}}
    respostas_discriminantes: List[str] = [] # IDs dos fatores marcados (ex: ["agua", "trauma"])
    sinais_alarme: List[str] = []
    historico: str = ""

HEART = {}

def carregar_conhecimento():
    global HEART
    try:
        path = os.path.join(os.path.dirname(__file__), "data", "patologias.json")
        with open(path, "r", encoding="utf-8") as f:
            HEART = json.load(f)
            print("HEART 3.0 carregado com sucesso.")
    except Exception as e:
        print(f"Erro ao carregar JSON: {e}")

carregar_conhecimento()

@app.get("/api/heart/knowledge")
def get_knowledge(): return HEART

@app.post("/api/brain/process")
def processar_triagem_clinica(dados: DadosPaciente):
    hipoteses = []
    
    # Normalização para busca (lowercase)
    sintomas_paciente = set([s.lower() for s in dados.sintomas_especificos])
    discriminantes_paciente = set([d.lower() for d in dados.respostas_discriminantes])
    
    # Loop por região afetada
    for regiao in dados.regioes:
        dominio = HEART.get("dominios", {}).get(regiao)
        if not dominio: continue
        
        for doenca in dominio.get("patologias", []):
            score_base = 0
            evidencias = []
            
            # 1. Análise de Sintomas Chave (Matching)
            matches = 0
            for sinal in doenca.get("sinais_chave", []):
                # Lógica para qualificador específico (ex: "coriza:Transparente")
                if ":" in sinal:
                    chave, valor_esperado = sinal.split(":")
                    # Verifica se o paciente tem essa chave nos qualificadores e se o valor bate
                    resposta_user = dados.respostas_qualificadores.get(chave, {})
                    # Procura em todos os atributos
                    encontrou = False
                    for k, v in resposta_user.items():
                         if str(v).lower() == valor_esperado.lower():
                             encontrou = True
                             break
                    if encontrou:
                        matches += 1.5 # Peso maior para sintoma qualificado exato
                        evidencias.append(f"{chave} ({valor_esperado})")
                
                # Sintoma simples
                elif sinal.lower() in sintomas_paciente:
                    matches += 1.0
                    evidencias.append(sinal)

            if matches == 0: continue # Se não tem nenhum sintoma da doença, pula
            
            # Cálculo inicial: % de sintomas preenchidos
            total_sinais = len(doenca["sinais_chave"])
            score = (matches / total_sinais) * 50 # Base até 50 pontos
            
            # 2. Aplicação dos Fatores Discriminantes (Multiplicadores)
            fatores_peso = doenca.get("fatores_peso", {})
            for fator_id, peso in fatores_peso.items():
                if fator_id.lower() in discriminantes_paciente:
                    score *= peso # Multiplica o score (Pivô)
                    evidencias.append(f"Fator: {fator_id}")
            
            # 3. Negativos Pertinentes (Bônus por ausência)
            negativos = doenca.get("negativos_pertinentes", [])
            for neg in negativos:
                # Ex: "sem_febre_alta". Verifica se paciente NÃO marcou febre.
                sintoma_negado = neg.replace("sem_", "")
                if sintoma_negado not in sintomas_paciente and "febre" not in str(dados.sintomas_gerais):
                    score += 5
            
            # 4. Red Flags (Score Máximo Imediato)
            if doenca.get("tipo") == "RedFlag" or doenca.get("tipo") == "Urgencia":
                # Se tiver match forte em redflag, sobe prioridade
                if matches >= 1: score += 30

            # Trava de segurança (0 a 99%)
            probabilidade = min(round(score), 99)
            
            if probabilidade > 20: # Corte mínimo
                hipoteses.append({
                    "doenca": doenca["nome"],
                    "tipo": doenca.get("tipo", "Geral"),
                    "probabilidade": probabilidade,
                    "baseado_em": evidencias,
                    "condutas": doenca.get("condutas", []),
                    "questionario": doenca.get("questionario", None),
                    "referencia": doenca.get("referencia", "")
                })

    # Ordena por probabilidade decrescente
    hipoteses.sort(key=lambda x: x["probabilidade"], reverse=True)
    
    return {
        "status": "sucesso_cdss",
        "paciente": dados.idade,
        "hipoteses": hipoteses
    }