import requests
import json

# URL da sua API (Troque pela do Heroku se quiser testar a nuvem)
# URL = "https://otto-api-dario-3a4d4f90581b.herokuapp.com/api/brain/process"
URL = "https://otto-api-dario-3a4d4f90581b.herokuapp.com/api/brain/process" # Teste local

# --- SEUS CASOS CLÍNICOS (GABARITO) ---
casos = [
    {
        "nome": "Caso 1 - Otite Externa Clássica",
        "entrada": {
            "idade": 25,
            "sexo": "M",
            "regioes": ["ouvido"],
            "sintomas_especificos": ["dor_ouvido"],
            "respostas_discriminantes": ["agua", "trauma"], # Entrou na piscina
            "respostas_qualificadores": {"dor_ouvido": {"piora_com": "Ao mexer na orelha"}}
        },
        "esperado": "Otite Externa Aguda"
    },
    {
        "nome": "Caso 2 - VPPB (Cristais)",
        "entrada": {
            "idade": 60,
            "sexo": "F",
            "regioes": ["ouvido"],
            "sintomas_especificos": ["tontura"],
            "respostas_qualificadores": {"tontura": {"duracao": "Segundos (<1 min)", "gatilho": "Posicional (Ao virar na cama)"}},
            "respostas_discriminantes": []
        },
        "esperado": "VPPB"
    },
    {
        "nome": "Caso 3 - Amigdalite Bacteriana",
        "entrada": {
            "idade": 10,
            "sexo": "F",
            "regioes": ["garganta"],
            "sintomas_especificos": ["dor_garganta", "febre"],
            "sintomas_gerais": ["febre"],
            "respostas_discriminantes": ["febre"],
            # Negativo pertinente: NÃO tem tosse
        },
        "esperado": "Amigdalite Bacteriana"
    }
]

print(f"--- INICIANDO BATERIA DE TESTES NO OTTO ---")
print(f"Alvo: {URL}\n")

acertos = 0

for i, caso in enumerate(casos):
    print(f"Testando: {caso['nome']}...")
    try:
        resp = requests.post(URL, json=caso['entrada'], timeout=10)
        data = resp.json()
        
        hipoteses = data.get("hipoteses", [])
        
        if not hipoteses:
            print(f"❌ FALHA: Nenhuma hipótese gerada.\n")
            continue

        top_diagnostico = hipoteses[0]['doenca']
        probabilidade = hipoteses[0]['probabilidade']
        
        # Verifica se o diagnóstico esperado está no Top 1 ou contém o nome
        if caso['esperado'].lower() in top_diagnostico.lower():
            print(f"✅ SUCESSO! Diagnosticou: {top_diagnostico} ({probabilidade}%)")
            acertos += 1
        else:
            print(f"⚠️ DIVERGÊNCIA. Esperado: '{caso['esperado']}' | Veio: '{top_diagnostico}' ({probabilidade}%)")
            # Mostra o top 3 para análise
            print(f"   Top 3: {[h['doenca'] for h in hipoteses[:3]]}")

    except Exception as e:
        print(f"❌ ERRO DE CONEXÃO: {e}")
    
    print("-" * 30)

print(f"\nRESULTADO FINAL: {acertos}/{len(casos)} acertos.")