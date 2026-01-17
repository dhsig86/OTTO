// MÓDULO DE API v4 - Com Integração LLM
const BASE_URL = "https://otto-api-dario-3a4d4f90581b.herokuapp.com";

export const API = {
    // 1. Busca Protocolos (Heart)
    async getProtocolos() {
        try {
            const res = await fetch(`${BASE_URL}/api/heart/knowledge`);
            if (!res.ok) throw new Error("Falha Heart");
            return await res.json();
        } catch (e) {
            console.error("Erro API Heart:", e);
            return null;
        }
    },

    // 2. Processa Triagem Final (Brain Clássico)
    async processarTriagem(payload) {
        try {
            const res = await fetch(`${BASE_URL}/api/brain/process`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            return await res.json();
        } catch (e) {
            console.error("Erro API Brain:", e);
            throw e; // Joga erro para ativar o modo offline
        }
    },

    // 3. NOVO: Transcrição Inteligente (Brain AI)
    async transcreverQueixa(textoLivre) {
        try {
            console.log("🤖 Chamando GPT-4o-mini...");
            const res = await fetch(`${BASE_URL}/api/brain/transcribe`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ queixa_livre: textoLivre })
            });
            
            if (!res.ok) throw new Error("Erro na IA");
            
            const jsonIA = await res.json();
            console.log("🤖 Resposta IA:", jsonIA);
            return jsonIA;
        } catch (e) {
            console.warn("IA indisponível ou erro:", e);
            return null; // Retorna nulo para seguir fluxo manual
        }
    }
};