# Versao do Backend: 0.3.1 (Fix Python Version)
import json
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="OTTO API - The Brain", version="0.3.0")

# Configuração de Segurança (Permite o Frontend acessar)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permite que qualquer site (incluindo seu GitHub Pages) acesse
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELOS DE DADOS (O que o paciente envia) ---
class DadosPaciente(BaseModel):
    idade: int
    sexo: str
    sintomas_gerais: List[str]
    regioes: List[str]
    sintomas_especificos: List[str]

# --- CARREGAR O HEART ---
def carregar_conhecimento():
    path = os.path.join(os.path.dirname(__file__), "data", "patologias.json")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

HEART = carregar_conhecimento()

# --- ALGORITMO DE DIAGNÓSTICO (A Lógica Médica) ---
def calcular_hipoteses(dados: DadosPaciente):
    hipoteses = []
    
    # 1. Varre apenas as regiões que o paciente marcou (ex: Ouvido)
    for regiao in dados.regioes:
        dominio = HEART["dominios"].get(regiao)
        if not dominio: continue
        
        # 2. Testa cada doença dessa região
        for doenca in dominio.get("patologias", []):
            score = doenca["regras_logicas"]["peso_base"]
            match_sintomas = []
            
            # A. Pontua por sintomas positivos (Gatilhos)
            for sintoma in dados.sintomas_especificos:
                # Normaliza strings (remove _ e minúsculas para comparar)
                s_clean = sintoma.lower().replace(" ", "_")
                
                # Se o sintoma está na lista chave da doença
                if any(chave in s_clean for chave in doenca["sinais_positivos_chave"]):
                    score += 0.15 # Peso fixo por sintoma chave
                    match_sintomas.append(sintoma)
            
            # B. Aplica Modificadores (Idade, Febre, etc)
            for mod in doenca["regras_logicas"].get("modificadores", []):
                # Regra de Idade
                if mod["criterio"] == "idade":
                    operador = mod["valor"][0] # < ou >
                    valor_corte = int(mod["valor"][1:])
                    if operador == "<" and dados.idade < valor_corte:
                        score += mod["peso_extra"]
                    elif operador == ">" and dados.idade > valor_corte:
                        score += mod["peso_extra"]
                
                # Regra de Febre Alta
                if mod["criterio"] == "febre_alta" and "febre" in dados.sintomas_gerais:
                    # Aqui simplificamos: se marcou "febre", assume risco
                    score += mod["peso_extra"]

            # C. Guarda se tiver pontuação relevante
            if score > 0.3:
                hipoteses.append({
                    "doenca": doenca["nome"],
                    "probabilidade": min(round(score * 100), 99), # Transforma 0.45 em 45%
                    "baseado_em": match_sintomas,
                    "alerta": doenca.get("alerta_medico")
                })
    
    # Ordena do mais provável para o menos provável
    hipoteses.sort(key=lambda x: x["probabilidade"], reverse=True)
    return hipoteses

# --- ROTAS ---
@app.get("/api/heart/knowledge")
def get_knowledge():
    return HEART

@app.post("/api/brain/process")
def processar_triagem(dados: DadosPaciente):
    """Recebe os dados da entrevista e devolve o raciocínio clínico"""
    print(f"Recebido: {dados}")
    
    resultados = calcular_hipoteses(dados)
    
    return {
        "status": "sucesso",
        "hipoteses": resultados,
        "resumo_clinico": f"Paciente {dados.idade}a, {dados.sexo}. Queixa em {', '.join(dados.regioes)}."
    }