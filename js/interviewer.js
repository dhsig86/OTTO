// THE INTERVIEWER v5 - Professional MVP
// Foco: UX, QP Real e Formatação de Prontuário

// SEU ENDEREÇO HEROKU AQUI (Mantenha o que você já descobriu)
const API_URL = "https://otto-api-dario-3a4d4f90581b.herokuapp.com"; 

let conhecimentoMedico = null;

// --- MEMÓRIA DO PACIENTE ---
let dadosPaciente = {
    demografia: { idade: "", sexo: "" },
    qp_real: "", // A fala do paciente ("tô com dor e ouvido abafado")
    sintomasGerais: [],
    regioesAfetadas: [],
    detalhesSintomas: [],
    tempoEvolucao: "" // "começou ontem"
};

let etapaAtual = 0; 
// 0=Intro, 1=Demo, 2=QP(Texto), 3=Geral, 4=Mapa, 5=Detalhes, 6=Tempo, 7=Fim

// INICIALIZAÇÃO
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const resposta = await fetch(`${API_URL}/api/heart/knowledge`);
        conhecimentoMedico = await resposta.json();
        console.log("Heart OK");
    } catch (erro) {
        console.error(erro);
        adicionarBalaoOtto("⚠️ Modo Offline. O servidor parece estar dormindo.");
    }
});

function iniciarTriagem() {
    const btn = document.getElementById('intro-btn');
    if(btn) btn.style.display = 'none';
    proximaEtapa();
}

// GERENCIADOR DE FLUXO
function proximaEtapa() {
    etapaAtual++;

    // Verifica carregamento
    if (!conhecimentoMedico && etapaAtual > 1) {
        adicionarBalaoOtto("Aguardando sistema médico...");
        setTimeout(proximaEtapa, 1000);
        return;
    }

    switch (etapaAtual) {
        case 1: fluxoDemografia(); break;
        case 2: fluxoQPReal(); break; // NOVA ETAPA
        case 3: fluxoGeral(); break;
        case 4: fluxoSelecaoRegioes(); break;
        case 5: fluxoInvestigacaoEspecifica(); break;
        case 6: fluxoTempoEvolucao(); break; // NOVA ETAPA
        case 7: finalizarTriagem(); break;
    }
}

// --- 1. DEMOGRAFIA ---
function fluxoDemografia() {
    adicionarBalaoOtto("Primeiro, preciso da identificação para o prontuário.");
    
    document.getElementById('input-area').innerHTML = `
        <div class="flex gap-2 items-end bg-white p-1">
            <div class="flex-1">
                <label class="text-xs font-bold text-slate-400 ml-1">Idade</label>
                <input type="number" id="input-idade" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold text-lg" placeholder="Ex: 30">
            </div>
            <div class="flex-1">
                <label class="text-xs font-bold text-slate-400 ml-1">Sexo</label>
                <select id="input-sexo" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold text-lg">
                    <option value="" disabled selected>-</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                </select>
            </div>
            <button onclick="salvarDemografia()" class="bg-blue-600 text-white h-[54px] w-[54px] rounded-xl flex items-center justify-center shadow-md hover:bg-blue-700 transition">
                ➔
            </button>
        </div>
    `;
    setTimeout(() => document.getElementById('input-idade').focus(), 300);
}

function salvarDemografia() {
    const idade = document.getElementById('input-idade').value;
    const sexo = document.getElementById('input-sexo').value;
    if(!idade || !sexo) return alert("Preencha idade e sexo.");
    
    dadosPaciente.demografia = { idade, sexo };
    adicionarBalaoUsuario(`${idade} anos, ${sexo}`);
    setTimeout(proximaEtapa, 400);
}

// --- 2. QUEIXA PRINCIPAL (TEXTO LIVRE) ---
function fluxoQPReal() {
    adicionarBalaoOtto("Em poucas palavras, o que você está sentindo hoje?");
    
    document.getElementById('input-area').innerHTML = `
        <div class="flex gap-2 w-full">
            <input type="text" id="input-qp" class="flex-1 p-3 border border-slate-300 rounded-xl outline-none focus:border-blue-500 shadow-sm" placeholder="Ex: Dor de ouvido forte...">
            <button onclick="salvarQP()" class="bg-blue-600 text-white px-6 rounded-xl font-bold hover:bg-blue-700 transition">Enviar</button>
        </div>
    `;
    document.getElementById('input-qp').focus();
}

function salvarQP() {
    const texto = document.getElementById('input-qp').value;
    if(!texto) return;
    dadosPaciente.qp_real = texto;
    adicionarBalaoUsuario(texto);
    setTimeout(proximaEtapa, 400);
}

// --- 3. GERAL (IS) ---
function fluxoGeral() {
    adicionarBalaoOtto("Você apresenta algum destes sintomas gerais?");
    const gerais = conhecimentoMedico.anamnese_geral.sintomas_sistemicos;
    
    let html = '<div class="flex flex-wrap gap-2 justify-center pb-2">';
    gerais.forEach(s => {
        const label = formatarTexto(s);
        html += `<button id="btn-geral-${s}" onclick="toggleSintomaGeral('${s}')" class="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition">${label}</button>`;
    });
    html += '</div>';
    html += '<button onclick="proximaEtapa()" class="w-full bg-slate-800 text-white py-3 rounded-xl font-bold shadow-lg">Continuar</button>';
    
    document.getElementById('input-area').innerHTML = html;
}

function toggleSintomaGeral(sintoma) {
    const btn = document.getElementById(`btn-geral-${sintoma}`);
    const index = dadosPaciente.sintomasGerais.indexOf(sintoma);
    
    if (index === -1) {
        dadosPaciente.sintomasGerais.push(sintoma);
        btn.className = "px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-full text-sm font-bold shadow-inner ring-1 ring-red-200 transition";
    } else {
        dadosPaciente.sintomasGerais.splice(index, 1);
        btn.className = "px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition";
    }
}

// --- 4. MAPA (Regiões) ---
function fluxoSelecaoRegioes() {
    adicionarBalaoOtto("Toque nas regiões onde o problema está localizado:");
    const dominios = Object.keys(conhecimentoMedico.dominios);
    
    let html = '<div class="grid grid-cols-2 gap-2 mb-3">';
    dominios.forEach(key => {
        const info = conhecimentoMedico.dominios[key];
        const emoji = getEmoji(key);
        html += `<button id="reg-${key}" onclick="toggleRegiao('${key}')" class="h-20 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 shadow-sm hover:shadow-md transition active:scale-95">
            <span class="text-2xl">${emoji}</span>
            <span class="text-xs font-bold text-slate-600 uppercase tracking-wide">${info.nome_exibicao || key}</span>
        </button>`;
    });
    html += '</div>';
    html += '<button onclick="validarRegioes()" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200">Avançar</button>';
    
    document.getElementById('input-area').innerHTML = html;
}

function toggleRegiao(key) {
    const btn = document.getElementById(`reg-${key}`);
    const index = dadosPaciente.regioesAfetadas.indexOf(key);
    
    if (index === -1) {
        dadosPaciente.regioesAfetadas.push(key);
        btn.classList.add('bg-blue-50', 'border-blue-500', 'ring-1', 'ring-blue-500');
    } else {
        dadosPaciente.regioesAfetadas.splice(index, 1);
        btn.classList.remove('bg-blue-50', 'border-blue-500', 'ring-1', 'ring-blue-500');
    }
}

function validarRegioes() {
    if(dadosPaciente.regioesAfetadas.length === 0) return alert("Selecione pelo menos uma região.");
    adicionarBalaoUsuario(dadosPaciente.regioesAfetadas.map(r => formatarTexto(r)).join(" + "));
    setTimeout(proximaEtapa, 400);
}

// --- 5. DETALHES ---
function fluxoInvestigacaoEspecifica() {
    let lista = [];
    dadosPaciente.regioesAfetadas.forEach(r => {
        lista = lista.concat(conhecimentoMedico.dominios[r].sintomas_gatilho || []);
    });
    const unicos = [...new Set(lista)];
    
    adicionarBalaoOtto("Selecione os detalhes:");
    
    let html = '<div class="flex flex-wrap gap-2 justify-center pb-3">';
    unicos.forEach(s => {
        const label = formatarTexto(s);
        html += `<button id="det-${s}" onclick="toggleDetalhe('${s}')" class="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-200 transition">${label}</button>`;
    });
    html += '</div>';
    html += '<button onclick="proximaEtapa()" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg">Próximo</button>';
    document.getElementById('input-area').innerHTML = html;
}

function toggleDetalhe(s) {
    const btn = document.getElementById(`det-${s}`);
    const index = dadosPaciente.detalhesSintomas.indexOf(s);
    if(index === -1) {
        dadosPaciente.detalhesSintomas.push(s);
        btn.className = "px-3 py-2 bg-blue-100 border border-blue-300 text-blue-800 rounded-lg text-sm font-bold shadow-sm";
    } else {
        dadosPaciente.detalhesSintomas.splice(index, 1);
        btn.className = "px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-200 transition";
    }
}

// --- 6. TEMPO DE EVOLUÇÃO (HDA) ---
function fluxoTempoEvolucao() {
    adicionarBalaoOtto("Há quanto tempo isso está acontecendo?");
    
    document.getElementById('input-area').innerHTML = `
        <div class="flex gap-2 w-full">
            <input type="text" id="input-tempo" class="flex-1 p-3 border border-slate-300 rounded-xl outline-none focus:border-blue-500" placeholder="Ex: Começou ontem à noite...">
            <button onclick="salvarTempo()" class="bg-green-600 text-white px-6 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200">Finalizar</button>
        </div>
    `;
    document.getElementById('input-tempo').focus();
}

function salvarTempo() {
    const txt = document.getElementById('input-tempo').value;
    if(!txt) return;
    dadosPaciente.tempoEvolucao = txt;
    adicionarBalaoUsuario(txt);
    setTimeout(proximaEtapa, 400);
}

// --- 7. FINALIZAÇÃO & WRITER (THE REPORT) ---
async function finalizarTriagem() {
    adicionarBalaoOtto("Gerando prontuário e analisando dados... ⏳");
    document.getElementById('input-area').innerHTML = '<div class="text-center text-xs text-slate-400 py-4 uppercase font-bold tracking-widest">Atendimento Finalizado</div>';
    
    const payload = {
        idade: parseInt(dadosPaciente.demografia.idade),
        sexo: dadosPaciente.demografia.sexo,
        sintomas_gerais: dadosPaciente.sintomasGerais,
        regioes: dadosPaciente.regioesAfetadas,
        sintomas_especificos: dadosPaciente.detalhesSintomas
    };

    try {
        const res = await fetch(`${API_URL}/api/brain/process`, {
            method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload)
        });
        const resultado = await res.json();
        
        exibirProntuarioFormal(resultado.hipoteses);
        
    } catch (e) {
        console.error(e);
        adicionarBalaoOtto("Erro de conexão. Gerando relatório offline.");
        exibirProntuarioFormal([]);
    }
}

// --- VISUALIZAÇÃO DO PRONTUÁRIO (ESTILO ANAMNESE) ---
function exibirProntuarioFormal(hipoteses) {
    const chat = document.getElementById('chat-container');
    
    // Converte lista de hipóteses em texto formatado, mas escondido
    let textoHipoteses = "Sem dados suficientes.";
    if (hipoteses.length > 0) {
        textoHipoteses = hipoteses.map(h => `• ${h.doenca} (${h.probabilidade}%)\n   Base: ${h.baseado_em.join(", ")}`).join("\n");
    }

    // Formatação de Prontuário Médico Padrão
    const textoProntuario = `
ANAMNESE OTORRINOLARINGOLÓGICA (Triagem OTTO)
Data: ${new Date().toLocaleString('pt-BR')}

ID: ${dadosPaciente.demografia.idade} anos, ${dadosPaciente.demografia.sexo}.

QP: "${dadosPaciente.qp_real}"

HDA: Paciente refere queixa localizada em ${dadosPaciente.regioesAfetadas.map(formatarTexto).join(" e ")}.
Sintomas específicos: ${dadosPaciente.detalhesSintomas.map(formatarTexto).join(", ")}.
Evolução/Tempo: ${dadosPaciente.tempoEvolucao}.

IS (Geral): ${dadosPaciente.sintomasGerais.length ? dadosPaciente.sintomasGerais.map(formatarTexto).join(", ") : "Nega febre ou perda de peso."}

HIPÓTESES DIAGNÓSTICAS (Sugestão IA):
${textoHipoteses}
    `.trim();

    // Criação do Card Visual
    const div = document.createElement('div');
    div.className = "fade-in mt-6 mx-auto w-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-20";
    
    div.innerHTML = `
        <div class="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
            <span class="text-xs font-bold text-slate-500 uppercase">Resumo de Triagem</span>
            <span class="text-[10px] bg-white border px-2 py-0.5 rounded text-slate-400">#OTTO</span>
        </div>
        
        <div class="p-4 text-sm text-slate-700 font-mono whitespace-pre-wrap leading-relaxed bg-slate-50" id="area-texto-copiar">
ID: ${dadosPaciente.demografia.idade}a, ${dadosPaciente.demografia.sexo}.
QP: "${dadosPaciente.qp_real}"
HDA: ${dadosPaciente.detalhesSintomas.map(formatarTexto).join(", ")} em ${dadosPaciente.regioesAfetadas.join("/")}. ${dadosPaciente.tempoEvolucao}.
IS: ${dadosPaciente.sintomasGerais.length ? dadosPaciente.sintomasGerais.join(", ") : "Nega gerais"}.
        </div>

        <details class="border-t border-slate-200 group">
            <summary class="cursor-pointer px-4 py-3 bg-slate-50 hover:bg-yellow-50 transition flex items-center justify-between">
                <span class="text-xs font-bold text-slate-500 group-hover:text-yellow-700">🔒 ÁREA MÉDICA (DIAGNÓSTICO)</span>
                <span class="text-slate-400 text-xs">▼</span>
            </summary>
            <div class="p-4 bg-yellow-50 text-xs font-mono text-slate-800 border-t border-yellow-100">
                ${textoHipoteses.replace(/\n/g, '<br>')}
                <div class="mt-2 text-[10px] text-yellow-700 opacity-70">*Sugestão probabilística baseada em protocolo. Necessita validação clínica.*</div>
            </div>
        </details>

        <div class="p-3 bg-white border-t border-slate-200 flex gap-2">
            <button onclick="copiarProntuario(\`${textoProntuario}\`)" class="flex-1 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-100 transition flex items-center justify-center gap-2">
                📋 Copiar Tudo
            </button>
            <button onclick="location.reload()" class="px-4 py-2 text-slate-400 hover:text-red-500 transition text-sm font-bold">
                Novo
            </button>
        </div>
    `;
    
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function copiarProntuario(texto) {
    navigator.clipboard.writeText(texto).then(() => {
        alert("Prontuário copiado! Pode colar no seu sistema.");
    });
}

// Auxiliares
function formatarTexto(str) { return str ? str.replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase()) : ""; }
function getEmoji(key) { const m = { "ouvido": "👂", "nariz": "👃", "garganta": "👄", "pescoco": "🧣" }; return m[key] || "📍"; }

function adicionarBalaoUsuario(texto) {
    const chat = document.getElementById('chat-container');
    const div = document.createElement('div');
    div.className = "flex gap-2 flex-row-reverse fade-in";
    div.innerHTML = `<div class="bg-blue-600 text-white py-2 px-4 rounded-2xl rounded-tr-sm shadow-sm text-sm max-w-[80%] break-words">${texto}</div>`;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function adicionarBalaoOtto(texto) {
    const chat = document.getElementById('chat-container');
    const div = document.createElement('div');
    div.className = "flex gap-2 fade-in";
    div.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-lg shrink-0 border border-blue-50">🤖</div>
        <div class="bg-white py-3 px-4 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100 text-sm text-slate-700 max-w-[85%]">${texto}</div>
    `;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}