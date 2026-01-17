import json
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from openai import OpenAI

app = FastAPI(title="OTTO Brain v4.3 - Robust", version="4.3.0")

# --- CONFIGURAÇÃO DE SEGURANÇA (CORS) ---
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIGURAÇÃO DA IA (SEGURA) ---
# Tenta pegar a chave. Se não tiver, define client como None.
api_key = os.environ.get("KEY_OPENAI")
client = OpenAI(api_key=api_key) if api_key else None

if not client:
    print(">>> AVISO: Chave OpenAI não encontrada. Modo IA desativado.")

# --- CARREGAMENTO DO HEART (JSON) ---
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

# --- ROTAS ---

@app.get("/api/heart/knowledge")
def get_knowledge():
    return HEART

@app.post("/api/brain/transcribe")
def traduzir_queixa_com_ia(entrada: EntradaTexto):
    # Se o cliente não foi iniciado (falta de chave), retorna erro tratado
    if not client:
        return {"erro": "Servidor sem chave API configurada", "regioes": []}

    dominios_validos = list(HEART.get('dominios', {}).keys())
    sintomas_validos = []
    for d in dominios_validos:
        sintomas_validos.extend(HEART['dominios'][d].get('sintomas_gatilho', []))

    prompt = f"""
    Aja como Triageiro Médico (ORL).
    CONTEXTO: {json.dumps(sintomas_validos)}
    QUEIXA: "{entrada.queixa_livre}"
    
    1. Região: [ouvido, nariz, garganta].
    2. Sintomas (IDs exatos da lista): ex: "dor_ouvido".
    3. Detalhes: Se houver (ex: "intensidade": "8").
    
    JSON OBRIGATÓRIO:
    {{
        "regioes": ["ouvido"],
        "sintomas_detectados": ["dor_ouvido"],
        "detalhes_ja_informados": {{"dor_ouvido": {{"intensidade": "8"}}}}
    }}
    """
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0
        )
        content = response.choices[0].message.content.replace("```json", "").replace("```", "").strip()
        return json.loads(content)
    except Exception as e:
        print(f"Erro OpenAI: {e}")
        return {"erro": str(e), "regioes": []}

@app.post("/api/brain/process")
def processar_triagem(dados: DadosPaciente):
    hipoteses = []
    sintomas_paciente = set([s.lower() for s in dados.sintomas_especificos])
    discriminantes_paciente = set([d.lower() for d in dados.respostas_discriminantes])
    
    for regiao in dados.regioes:
        dominio = HEART.get("dominios", {}).get(regiao)
        if not dominio: continue
        
        for doenca in dominio.get("patologias", []):
            matches = 0
            evidencias = []
            
            for sinal in doenca.get("sinais_chave", []):
                if ":" in sinal:
                    chave, valor = sinal.split(":")
                    resp = dados.respostas_qualificadores.get(chave.lower(), {})
                    if any(str(v).lower() == valor.lower() for v in resp.values()):
                        matches += 1.5
                        evidencias.append(f"{chave} ({valor})")
                elif sinal.lower() in sintomas_paciente:
                    matches += 1.0
                    evidencias.append(sinal)
            
            if matches == 0: continue

            total = len(doenca["sinais_chave"]) or 1
            score = (matches / total) * 50
            
            for fator, peso in doenca.get("fatores_peso", {}).items():
                if fator.lower() in discriminantes_paciente:
                    score *= peso
                    evidencias.append(f"Fator: {fator}")

            for neg in doenca.get("negativos_pertinentes", []):
                if neg.replace("sem_", "").lower() not in sintomas_paciente:
                    score += 5
            
            prob = min(round(score), 99)
            if prob > 20:
                hipoteses.append({
                    "doenca": doenca["nome"],
                    "probabilidade": prob,
                    "baseado_em": evidencias,
                    "condutas": doenca.get("condutas", [])
                })

    hipoteses.sort(key=lambda x: x["probabilidade"], reverse=True)
    return {"status": "ok", "hipoteses": hipoteses}