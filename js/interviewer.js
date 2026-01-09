// THE INTERVIEWER v4 - Leitura Dinâmica do HEART (JSON v2)
// Autor: Dr. Dario & CTO Interino
// Data: Jan 2026

const API_URL = "https://otto-api-dario-3a4d4f90581b.herokuapp.com";
let conhecimentoMedico = null;

// --- MEMÓRIA DO PACIENTE (State) ---
let dadosPaciente = {
    demografia: { idade: "", sexo: "" },
    sintomasGerais: [],
    regioesAfetadas: [], // Ex: ['ouvido', 'nariz']
    detalhesSintomas: [],
    historiaLivre: "" // Opcional para o futuro
};

// --- CONTROLE DE FLUXO (Etapas) ---
let etapaAtual = 0; 
// 0 = Intro, 1 = Demografia, 2 = Geral, 3 = Regiões, 4 = Específica, 5 = Writer

// 1. INICIALIZAÇÃO
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const resposta = await fetch(`${API_URL}/api/heart/knowledge`);
        if (!resposta.ok) throw new Error("Falha na conexão");
        conhecimentoMedico = await resposta.json();
        console.log("Heart carregado:", conhecimentoMedico);
    } catch (erro) {
        console.error(erro);
        adicionarBalaoOtto("⚠️ Não consegui ler os protocolos médicos (Heart). Verifique se o Backend está rodando.");
    }
});

function iniciarTriagem() {
    // Esconde botão inicial
    const btnIntro = document.getElementById('intro-btn');
    if (btnIntro) btnIntro.style.display = 'none';
    
    proximaEtapa();
}

// 2. O CÉREBRO DO FLUXO (Gerente de Etapas)
function proximaEtapa() {
    etapaAtual++;

    // Verifica se o Heart carregou antes de tentar ler
    if (!conhecimentoMedico && etapaAtual > 0) {
        adicionarBalaoOtto("Aguardando carregamento dos protocolos...");
        setTimeout(proximaEtapa, 1000); // Tenta de novo em 1s
        return;
    }

    switch (etapaAtual) {
        case 1:
            fluxoDemografia();
            break;
        case 2:
            fluxoGeral();
            break;
        case 3:
            fluxoSelecaoRegioes();
            break;
        case 4:
            fluxoInvestigacaoEspecifica();
            break;
        case 5:
            finalizarTriagem();
            break;
        default:
            console.log("Fluxo encerrado");
    }
}

// --- ETAPA 1: IDADE E SEXO (Lê de anamnese_geral) ---
function fluxoDemografia() {
    adicionarBalaoOtto("Olá! Para preparar seu atendimento, preciso primeiro da sua identificação.");
    
    const inputArea = document.getElementById('input-area');
    inputArea.innerHTML = `
        <div class="flex flex-wrap gap-2 items-center justify-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <div class="flex flex-col">
                <label class="text-xs text-slate-500 mb-1 ml-1">Idade</label>
                <input type="number" id="input-idade" placeholder="Anos" class="w-24 p-3 border border-slate-300 rounded-lg text-center outline-none focus:border-blue-500">
            </div>
            <div class="flex flex-col">
                <label class="text-xs text-slate-500 mb-1 ml-1">Sexo Biológico</label>
                <select id="input-sexo" class="p-3 border border-slate-300 rounded-lg outline-none bg-white focus:border-blue-500">
                    <option value="" disabled selected>Selecione</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                </select>
            </div>
            <div class="flex flex-col justify-end">
                <button onclick="salvarDemografia()" class="mt-5 h-[46px] bg-blue-600 text-white px-6 rounded-lg font-medium hover:bg-blue-700 transition">OK</button>
            </div>
        </div>
    `;
    // Foca no input de idade
    setTimeout(() => document.getElementById('input-idade').focus(), 300);
}

function salvarDemografia() {
    const idade = document.getElementById('input-idade').value;
    const sexo = document.getElementById('input-sexo').value;
    
    if(!idade || !sexo) {
        alert("Por favor, preencha idade e sexo.");
        return;
    }

    dadosPaciente.demografia = { idade, sexo };
    adicionarBalaoUsuario(`${idade} anos, ${sexo}`);
    setTimeout(proximaEtapa, 500);
}

// --- ETAPA 2: GERAL (Lê de anamnese_geral.sintomas_sistemicos) ---
function fluxoGeral() {
    adicionarBalaoOtto("Você tem sentido algum destes sintomas gerais?");
    
    const inputArea = document.getElementById('input-area');
    // Leitura dinâmica do JSON novo
    const listaGerais = conhecimentoMedico.anamnese_geral.sintomas_sistemicos;
    
    let html = '<div class="flex flex-col gap-3">';
    html += '<div class="flex flex-wrap gap-2 justify-center">';
    
    listaGerais.forEach(s => {
        const label = formatarTexto(s);
        html += `<button id="btn-geral-${s}" onclick="toggleSintomaGeral('${s}')" class="px-4 py-2 border border-slate-300 rounded-full text-sm text-slate-600 hover:bg-slate-50 transition select-none">${label}</button>`;
    });
    
    html += '</div>';
    html += '<button onclick="proximaEtapa()" class="w-full max-w-xs mx-auto bg-blue-600 text-white py-3 rounded-xl font-bold shadow hover:bg-blue-700 transition">AVANÇAR ➔</button>';
    html += '</div>';
    
    inputArea.innerHTML = html;
}

function toggleSintomaGeral(sintoma) {
    const btn = document.getElementById(`btn-geral-${sintoma}`);
    const index = dadosPaciente.sintomasGerais.indexOf(sintoma);
    
    if (index === -1) {
        dadosPaciente.sintomasGerais.push(sintoma);
        // Estilo visual "Ativado" (Vermelho claro para alerta)
        btn.classList.remove('border-slate-300', 'text-slate-600');
        btn.classList.add('bg-red-50', 'border-red-400', 'text-red-700', 'font-medium');
    } else {
        dadosPaciente.sintomasGerais.splice(index, 1);
        // Estilo visual "Desativado"
        btn.classList.remove('bg-red-50', 'border-red-400', 'text-red-700', 'font-medium');
        btn.classList.add('border-slate-300', 'text-slate-600');
    }
}

// --- ETAPA 3: MAPA DO CORPO (Lê as chaves de 'dominios') ---
function fluxoSelecaoRegioes() {
    adicionarBalaoOtto("Onde está o problema principal? (Pode marcar mais de um)");
    
    const inputArea = document.getElementById('input-area');
    // Pega as chaves do JSON: ['ouvido', 'nariz', 'garganta', 'pescoco']
    const dominiosDisponiveis = Object.keys(conhecimentoMedico.dominios);
    
    let html = '<div class="flex flex-col gap-3">';
    html += '<div class="grid grid-cols-2 gap-2">';
    
    dominiosDisponiveis.forEach(key => {
        const info = conhecimentoMedico.dominios[key]; // Pega o objeto interno
        const label = info.nome_exibicao || formatarTexto(key);
        // Adiciona emoji baseado na chave (hardcoded para visual, mas o texto vem do JSON)
        const emoji = getEmoji(key); 
        
        html += `<button id="btn-reg-${key}" onclick="toggleRegiao('${key}')" class="card-btn flex flex-col items-center justify-center gap-1 h-24">
                    <span class="text-2xl">${emoji}</span>
                    <span class="font-medium">${label}</span>
                 </button>`;
    });
    
    html += '</div>';
    html += '<button onclick="confirmarRegioes()" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow hover:bg-blue-700 transition">AVANÇAR ➔</button>';
    html += '</div>';

    inputArea.innerHTML = html;
}

function toggleRegiao(regiaoKey) {
    const btn = document.getElementById(`btn-reg-${regiaoKey}`);
    const index = dadosPaciente.regioesAfetadas.indexOf(regiaoKey);
    
    if (index === -1) {
        dadosPaciente.regioesAfetadas.push(regiaoKey);
        // Estilo Ativado (Azul)
        btn.classList.add('bg-blue-50', 'border-blue-400', 'text-blue-700', 'ring-2', 'ring-blue-100');
    } else {
        dadosPaciente.regioesAfetadas.splice(index, 1);
        // Estilo Desativado
        btn.classList.remove('bg-blue-50', 'border-blue-400', 'text-blue-700', 'ring-2', 'ring-blue-100');
    }
}

function confirmarRegioes() {
    if (dadosPaciente.regioesAfetadas.length === 0) {
        alert("Por favor, selecione pelo menos uma região.");
        return;
    }
    // Formatação bonita para o balão do usuário
    const nomes = dadosPaciente.regioesAfetadas.map(r => conhecimentoMedico.dominios[r].nome_exibicao).join(" e ");
    adicionarBalaoUsuario("Incomoda em: " + nomes);
    setTimeout(proximaEtapa, 500);
}

// --- ETAPA 4: INVESTIGAÇÃO (Lê 'sintomas_gatilho' das regiões escolhidas) ---
function fluxoInvestigacaoEspecifica() {
    let listaConsolidada = [];
    
    // Loop nas regiões marcadas pelo paciente
    dadosPaciente.regioesAfetadas.forEach(regiaoKey => {
        const dominioData = conhecimentoMedico.dominios[regiaoKey];
        if (dominioData && dominioData.sintomas_gatilho) {
            listaConsolidada = listaConsolidada.concat(dominioData.sintomas_gatilho);
        }
    });
    
    // Remove duplicatas (Set)
    const sintomasUnicos = [...new Set(listaConsolidada)];

    adicionarBalaoOtto("Selecione os detalhes do que você sente nessas regiões:");
    
    const inputArea = document.getElementById('input-area');
    let html = '<div class="flex flex-col gap-3">';
    html += '<div class="flex flex-wrap gap-2 justify-center">';
    
    sintomasUnicos.forEach(s => {
        const label = formatarTexto(s);
        html += `<button id="btn-detalhe-${s}" onclick="toggleDetalhe('${s}')" class="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm hover:bg-blue-50 transition select-none">${label}</button>`;
    });
    
    html += '</div>';
    html += '<button onclick="proximaEtapa()" class="w-full max-w-xs mx-auto bg-green-600 text-white py-3 rounded-xl font-bold shadow hover:bg-green-700 transition">FINALIZAR TRIAGEM ✅</button>';
    html += '</div>';
    
    inputArea.innerHTML = html;
}

function toggleDetalhe(sintoma) {
    const btn = document.getElementById(`btn-detalhe-${sintoma}`);
    const index = dadosPaciente.detalhesSintomas.indexOf(sintoma);
    
    if (index === -1) {
        dadosPaciente.detalhesSintomas.push(sintoma);
        btn.classList.remove('bg-slate-50', 'border-slate-300');
        btn.classList.add('bg-blue-100', 'border-blue-400', 'text-blue-800', 'font-medium');
    } else {
        dadosPaciente.detalhesSintomas.splice(index, 1);
        btn.classList.remove('bg-blue-100', 'border-blue-400', 'text-blue-800', 'font-medium');
        btn.classList.add('bg-slate-50', 'border-slate-300');
    }
}

// --- ETAPA 5: THE WRITER (Gera o Resumo) ---
// Substitua a função finalizarTriagem por esta versão conectada:

async function finalizarTriagem() {
    adicionarBalaoOtto("Processando dados clínicos... Conectando ao Brain 🧠");
    
    // 1. Prepara o pacote de dados
    const payload = {
        idade: parseInt(dadosPaciente.demografia.idade),
        sexo: dadosPaciente.demografia.sexo,
        sintomas_gerais: dadosPaciente.sintomasGerais,
        regioes: dadosPaciente.regioesAfetadas,
        // Limpa o nome dos sintomas para mandar pro backend (tira espaços e acentos se precisar, ou manda raw)
        sintomas_especificos: dadosPaciente.detalhesSintomas
    };

    try {
        // 2. Envia para o Python (Brain)
        const response = await fetch(`${API_URL}/api/brain/process`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const resultado = await response.json();
        
        // 3. Formata a resposta do Python para o Writer
        let textoHipoteses = "";
        
        if (resultado.hipoteses.length > 0) {
            textoHipoteses = resultado.hipoteses.map(h => 
                `• ${h.doenca} (${h.probabilidade}%)\n  (Base: ${h.baseado_em.join(", ")})`
            ).join("\n");
        } else {
            textoHipoteses = "• Quadro inespecífico. Necessário exame físico detalhado.";
        }

        const relatorio = `
ID: ${payload.idade} anos, ${payload.sexo}.
QP: ${payload.regioes.join(" + ")}.
HDA: ${payload.sintomas_gerais.length ? payload.sintomas_gerais.join(", ") : "Sem sintomas gerais"}.
Sintomas: ${payload.sintomas_especificos.join(", ")}.

HIPÓTESES DO OTTO:
${textoHipoteses}
        `.trim();

        exibirRelatorioMedico(relatorio);

    } catch (erro) {
        console.error(erro);
        adicionarBalaoOtto("⚠️ Erro ao calcular diagnóstico. Mostrando dados brutos.");
        // Fallback se der erro
        exibirRelatorioMedico(`ERRO NO BRAIN.\nDados: ${JSON.stringify(payload)}`);
    }
}

// --- UTILITÁRIOS E UI ---

function formatarTexto(str) {
    // Transforma "dor_de_ouvido" em "Dor de ouvido"
    if (!str) return "";
    return str.replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase());
}

function getEmoji(key) {
    const mapa = { "ouvido": "👂", "nariz": "👃", "garganta": "👄", "pescoco": "🧣" };
    return mapa[key] || "📍";
}

function adicionarBalaoUsuario(texto) {
    const chat = document.getElementById('chat-container');
    const div = document.createElement('div');
    div.className = "flex gap-3 flex-row-reverse fade-in mb-4";
    div.innerHTML = `<div class="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none shadow-md max-w-[85%] text-sm"><p>${texto}</p></div>`;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function adicionarBalaoOtto(texto) {
    const chat = document.getElementById('chat-container');
    const div = document.createElement('div');
    div.className = "flex gap-3 fade-in mb-4";
    div.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xl shrink-0">🤖</div>
        <div class="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 max-w-[85%] text-sm text-slate-700"><p>${texto}</p></div>
    `;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function exibirRelatorioMedico(texto) {
    const chat = document.getElementById('chat-container');
    const div = document.createElement('div');
    div.className = "fade-in mt-6 mx-auto w-full max-w-md bg-yellow-50 border border-yellow-200 p-4 rounded-lg shadow-sm";
    div.innerHTML = `
        <div class="flex justify-between items-center mb-2">
            <h3 class="text-xs font-bold text-yellow-800 uppercase tracking-wide">Visão do Médico (Writer)</h3>
            <span class="text-[10px] text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">PROTOCOLO #OTTO-${Math.floor(Math.random()*1000)}</span>
        </div>
        <pre class="text-sm text-slate-800 whitespace-pre-wrap font-mono bg-white p-3 rounded border border-yellow-100 select-all">${texto}</pre>
        <div class="mt-2 text-center">
            <p class="text-xs text-slate-400">Copie este texto para o prontuário</p>
        </div>
    `;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;


    
}