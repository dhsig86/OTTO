import json
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="OTTO API - The Brain",
    description="Backend de triagem otorrinolaringológica",
    version="0.2.0" # Atualizamos a versão
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- FUNÇÕES AUXILIARES ---
def carregar_conhecimento_medico():
    """Lê o arquivo JSON que atua como o 'Coração' do sistema"""
    # Caminho para backend/data/patologias.json
    caminho_arquivo = os.path.join(os.path.dirname(__file__), "data", "patologias.json")
    
    if not os.path.exists(caminho_arquivo):
        return {"erro": "Arquivo patologias.json não encontrado!"}
    
    with open(caminho_arquivo, "r", encoding="utf-8") as f:
        return json.load(f)

# --- ROTAS (ENDPOINTS) ---

@app.get("/")
def read_root():
    return {"status": "online", "message": "O Cérebro do OTTO está funcionando e conectado ao Coração."}

@app.get("/api/heart/knowledge")
def get_medical_knowledge():
    """Rota para o Frontend consultar quais doenças o OTTO conhece"""
    data = carregar_conhecimento_medico()
    if "erro" in data:
        raise HTTPException(status_code=500, detail=data["erro"])
    return data

@app.post("/api/triage")
def process_triage(data: dict):
    return {
        "received": data,
        "analysis": "Dados recebidos. Módulo de inteligência em construção."
    }