import json
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

# --- BIBLIOTECA DA OPENAI (Instalar: pip install openai) ---
from openai import OpenAI

app = FastAPI(title="OTTO Brain - AI Powered", version="4.0.0")

# --- CONFIGURAÇÃO DA CHAVE (Pegar do ambiente do Heroku para segurança) ---
# No Heroku, você vai configurar: KEY_OPENAI = "sk-..."
client = OpenAI(api_key=os.environ.get("KEY_OPENAI")) 

# Configuração CORS
origins = ["*"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

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

# --- CARREGA O HEART (JSON) ---
HEART = {}
try:
    path = os.path.join(os.path.dirname(__file__), "data", "patologias.json")
    with open(path, "r", encoding="utf-8") as f:
        HEART = json.load(f)
except Exception as e:
    print(f"Erro ao carregar JSON: {e}")

# --- NOVA ROTA: O TRADUTOR INTELIGENTE ---
@app.post("/api/brain/transcribe")
def traduzir_queixa_com_ia(entrada: EntradaTexto):
    """
    Recebe texto livre ("Dói meu ouvido quando deito")
    Devolve JSON estruturado ("dor_ouvido", "piora_com:Ao deitar")
    """
    if not client.api_key:
        return {"erro": "Sem chave de API configurada. Usando modo manual."}

    prompt = f"""
    Você é um assistente médico de triagem (Otorrino).
    
    CONTEXTO MÉDICO (SINTOMAS VÁLIDOS):
    {json.dumps(HEART.get('dominios', {}).keys())}
    
    PACIENTE DISSE: "{entrada.queixa_livre}"
    
    TAREFA:
    1. Identifique a Região Principal (ouvido, nariz, garganta).
    2. Identifique os Sintomas Gatilho exatos do nosso protocolo.
    3. Extraia detalhes (qualificadores) se o paciente já falou.
    
    RESPONDA APENAS UM JSON NESTE FORMATO:
    {{
        "regioes": ["ouvido"],
        "sintomas_detectados": ["dor_ouvido"],
        "detalhes_ja_informados": {{"dor_ouvido": {{"piora_com": "Ao deitar"}}}}
    }}
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini", # O modelo barato e inteligente
            messages=[{"role": "system", "content": "Responda apenas JSON."}, 
                      {"role": "user", "content": prompt}],
            temperature=0.0
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        print(f"Erro OpenAI: {e}")
        return {"erro": "Falha na IA", "raw": str(e)}

# --- ROTA DE PROCESSAMENTO CLÍNICO (Igual à anterior, mas mantida aqui) ---
@app.post("/api/brain/process")
def processar_triagem(dados: DadosPaciente):
    # ... (Mantenha a lógica de cálculo de score que fizemos no prompt anterior)
    # Vou resumir aqui para não ficar gigante, mas você usa o mesmo código do BRAIN 3.0
    # Se precisar que eu repita o código de cálculo, me avise.
    return {"status": "ok", "hipoteses": []} # Placeholder