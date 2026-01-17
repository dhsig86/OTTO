import json
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

# Biblioteca da OpenAI
from openai import OpenAI

app = FastAPI(title="OTTO Brain v4.2 - Production", version="4.2.0")

# --- 1. CONFIGURAÇÃO DE SEGURANÇA (CORS) ---
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. CONFIGURAÇÃO DA IA ---
# Se não houver chave, o sistema avisa mas não trava (fallback manual)
client = OpenAI(api_key=os.environ.get("KEY_OPENAI"))

# --- 3. CARREGAMENTO DO HEART (JSON) ---
HEART = {}
try:
    path = os.path.join(os.path.dirname(__file__), "data", "patologias.json")
    with open(path, "r", encoding="utf-8") as f:
        HEART = json.load(f)
    print(">>> HEART carregado com sucesso!")
except Exception as e:
    print(f">>> ERRO CRÍTICO JSON: {e}")
    HEART = {"dominios": {}, "anamnese_geral": {"sintomas_sistemicos": []}}

# --- MODELOS DE DADOS ---
class EntradaTexto(BaseModel):
    queixa_livre: str

class DadosPaciente(BaseModel):
    idade: int = 0
    sexo: str = "Indefinido"
    sintomas_gerais: List[str] = []
    regioes: List[str] = []
    sintomas_especificos: List[str] = []
    respostas_qualificadores: Dict[str, Any] = {}
    respostas_discriminantes: List[str] = []
    sinais_alarme: List[str] = []
    historico: str = ""

# ==========================================
#              ROTAS DA API
# ==========================================

@app.get("/api/heart/knowledge")
def get_knowledge():
    return HEART

@app.post("/api/brain/transcribe")
def traduzir_queixa_com_ia(entrada: EntradaTexto):
    if not client.api_key:
        return {"erro": "Sem chave API", "regioes": []}

    # Extrai listas válidas do JSON para 'guiar' a IA
    dominios_validos = list(HEART.get('dominios', {}).keys())
    sintomas_validos = []
    for d in dominios_validos:
        sintomas_validos.extend(HEART['dominios'][d].get('sintomas_gatilho', []))

    prompt = f"""
    Atue como triagem médica Otorrino.
    SINTOMAS VÁLIDOS NO SISTEMA: {json.dumps(sintomas_validos)}
    DOMÍNIOS: {json.dumps(dominios_validos)}
    
    PACIENTE DISSE: "{entrada.queixa_livre}"
    
    TAREFA:
    1. Identifique a Região (ouvido, nariz, garganta).
    2. Identifique quais 'sintomas_gatilho' da lista acima correspondem à queixa. Use EXATAMENTE a ID da lista.
    3. Se o paciente já deu detalhes (ex: "dói nota 8", "piora ao deitar"), extraia para 'detalhes_ja_informados'.
    
    RESPONDA APENAS JSON:
    {{
        "regioes": ["ouvido"],
        "sintomas_detectados": ["dor_ouvido"],
        "detalhes_ja_informados": {{"dor_ouvido": {{"intensidade": "8", "piora_com": "Ao deitar"}}}}
    }}
    """
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Responda apenas JSON válido."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.0
        )
        content = response.choices[0].message.content
        content = content.replace("```json", "").replace("```", "").strip()
        return json.loads(content)
    except Exception as e:
        print(f"Erro OpenAI: {e}")
        return {"erro": str(e), "regioes": []}

@app.post("/api/brain/process")
def processar_triagem(dados: DadosPaciente):
    """
    Esta é a função que estava vazia no seu arquivo anterior.
    Aqui restauramos a lógica de cálculo de pontuação.
    """
    hipoteses = []
    
    # Normaliza inputs para minúsculo para evitar erros de digitação
    sintomas_paciente = set([s.lower() for s in dados.sintomas_especificos])
    discriminantes_paciente = set([d.lower() for d in dados.respostas_discriminantes])
    
    # Varre as regiões afetadas
    for regiao in dados.regioes:
        dominio = HEART.get("dominios", {}).get(regiao)
        if not dominio: continue
        
        for doenca in dominio.get("patologias", []):
            matches = 0
            evidencias = []
            
            # 1. Match de Sintomas e Qualificadores
            for sinal in doenca.get("sinais_chave", []):
                # Caso complexo: "coriza:Amarela"
                if ":" in sinal:
                    chave_sintoma, valor_esperado = sinal.split(":")
                    chave_sintoma = chave_sintoma.lower()
                    
                    # Verifica se temos qualificadores para este sintoma
                    respostas_user = dados.respostas_qualificadores.get(chave_sintoma)
                    
                    if respostas_user:
                        # Varre todas as respostas desse sintoma (intensidade, tipo, etc)
                        # Se ALGUMA delas contiver o valor esperado
                        if any(str(v).lower() == valor_esperado.lower() for v in respostas_user.values()):
                            matches += 1.5
                            evidencias.append(f"{chave_sintoma} ({valor_esperado})")
                
                # Caso simples: "dor_ouvido"
                elif sinal.lower() in sintomas_paciente:
                    matches += 1.0
                    evidencias.append(sinal)
            
            # Se não bateu nenhum sintoma principal, ignora a doença
            if matches == 0: continue

            # Score Base (Proporção de sintomas encontrados)
            total_sinais = len(doenca["sinais_chave"])
            if total_sinais == 0: total_sinais = 1
            score = (matches / total_sinais) * 50
            
            # 2. Fatores Discriminantes (Multiplicadores)
            for fator, peso in doenca.get("fatores_peso", {}).items():
                if fator.lower() in discriminantes_paciente:
                    score *= peso
                    evidencias.append(f"Fator: {fator}")

            # 3. Negativos Pertinentes (Bônus por não ter)
            for neg in doenca.get("negativos_pertinentes", []):
                sneg = neg.replace("sem_", "").lower()
                # Se paciente não marcou esse sintoma E não marcou nos gerais
                if sneg not in sintomas_paciente and sneg not in [sg.lower() for sg in dados.sintomas_gerais]:
                    score += 5
            
            # Trava de segurança 99%
            prob = min(round(score), 99)
            
            # Corte de exibição (apenas > 20%)
            if prob > 20:
                hipoteses.append({
                    "doenca": doenca["nome"],
                    "probabilidade": prob,
                    "baseado_em": evidencias,
                    "condutas": doenca.get("condutas", [])
                })

    # Ordena por probabilidade (maior primeiro)
    hipoteses.sort(key=lambda x: x["probabilidade"], reverse=True)
    
    return {
        "status": "calculado",
        "paciente": dados.idade,
        "hipoteses": hipoteses
    }