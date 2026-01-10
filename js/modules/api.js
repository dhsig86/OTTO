// MÓDULO DE API (CONEXÃO COM CÉREBRO E IA)
// Centraliza todas as chamadas externas

// Endereço do seu Backend Python (Heroku)
const BASE_URL = "https://otto-api-dario-3a4d4f90581b.herokuapp.com";

export const API = {
    // 1. Busca o "Heart" (Protocolos Médicos)
    async getProtocolos() {
        try {
            const response = await fetch(`${BASE_URL}/api/heart/knowledge`);
            if (!response.ok) throw new Error("Falha ao carregar protocolos");
            return await response.json();
        } catch (error) {
            console.error("Erro API Heart:", error);
            return null; // Retorna nulo para a UI tratar (Modo Offline)
        }
    },

    // 2. Envia para o "Brain" (Processamento Clínico)
    async processarTriagem(dadosPaciente) {
        try {
            const response = await fetch(`${BASE_URL}/api/brain/process`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dadosPaciente)
            });
            return await response.json();
        } catch (error) {
            console.error("Erro API Brain:", error);
            return { hipoteses: [] }; // Retorno seguro em caso de erro
        }
    },

    // 3. O SLOT DA IA (LLM - GPT-5 Nano)
    // Futuramente, isso vai traduzir "fala do paciente" -> "JSON estruturado"
    async processarTextoComIA(textoUsuario, contexto = "triagem") {
        console.log(`[IA - GPT5Nano] Processando: "${textoUsuario}" no contexto: ${contexto}`);
        
        // --- TODO: FUTURA IMPLEMENTAÇÃO DA API ---
        // const apiKey = "SUA_CHAVE_AQUI";
        // const prompt = `Traduza para termos médicos: ${textoUsuario}`;
        // ... fetch para OpenAI ou API proprietária ...
        
        // POR ENQUANTO (MOCK): Apenas simula um delay de pensamento e devolve o texto
        // Isso garante que a UI já seja assíncrona (loading...) desde hoje.
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    textoOriginal: textoUsuario,
                    entidadesDetectadas: [], // A IA preencheria isso (ex: ["febre", "dor"])
                    sugestaoResposta: null
                });
            }, 800); // Simula 800ms de "pensamento"
        });
    }
};