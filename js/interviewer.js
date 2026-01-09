// THE INTERVIEWER v6 - Professional MVP + Consentimento
// Inovações: Nome do Paciente, LGPD Check, Print Layout, Reset Button

const API_URL = "https://otto-api-dario-3a4d4f90581b.herokuapp.com"; 

let conhecimentoMedico = null;

// --- MEMÓRIA DO PACIENTE ---
let dadosPaciente = {
    nome: "",           // NOVO
    consentimento: false, // NOVO
    demografia: { idade: "", sexo: "" },
    qp_real: "", 
    sintomasGerais: [],
    regioesAfetadas: [],
    detalhesSintomas: [],
    tempoEvolucao: ""
};

// CONTROLE DE ETAPAS
let etapaAtual = 0; 
// 0=Intro, 1=Consentimento/Nome, 2=Demo, 3=QP, 4=Geral, 5=Mapa, 6=Detalhes, 7=Tempo, 8=Relatório

// INICIALIZAÇÃO
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const resposta = await fetch(`${API_URL}/api/heart/knowledge`);
        conhecimentoMedico = await resposta.json();
        console.log("Heart OK");
    } catch (erro) {
        console.error(erro);
        adicionarBalaoOtto("⚠️ O sistema está offline (Erro de conexão com o Cérebro).");
    }
});

function iniciarTriagem() {
    const btn = document.getElementById('intro-btn');
    if(btn) btn.style.display = 'none';
    proximaEtapa();
}

function proximaEtapa() {
    etapaAtual++;

    // Verifica se Heart carregou
    if (!conhecimentoMedico && etapaAtual > 2) { // Deixa passar nome/demo sem heart
        adicionarBalaoOtto("Conectando ao banco de dados médico... Aguarde.");
        setTimeout(proximaEtapa, 1500);
        return;
    }

    switch (etapaAtual) {
        case 1: fluxoConsentimento(); break; // NOVA ETAPA
        case 2: fluxoDemografia(); break;
        case 3: fluxoQPReal(); break;
        case 4: fluxoGeral(); break;
        case 5: fluxoSelecaoRegioes(); break;
        case 6: fluxoInvestigacaoEspecifica(); break;
        case 7: fluxoTempoEvolucao(); break;
        case 8: finalizarTriagem(); break;
    }
}

// --- 1. CONSENTIMENTO & NOME ---
function fluxoConsentimento() {
    adicionarBalaoOtto("Para começarmos, por favor digite seu nome completo e confirme o uso dos dados.");
    
    document.getElementById('input-area').innerHTML = `
        <div class="flex flex-col gap-3 bg-white p-1">
            <input type="text" id="input-nome" class="w-full p-3 border border-slate-300 rounded-xl outline-none focus:border-blue-500 font-medium" placeholder="Seu Nome Completo">
            
            <label class="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                <input type="checkbox" id="check-consentimento" class="w-5 h-5 mt-0.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500">
                <span class="text-xs text-slate-600 leading-tight">
                    Concordo em fornecer meus dados de saúde para fins de triagem e atendimento médico com o Dr. Dario Hart.
                </span>
            </label>
            
            <button onclick="salvarConsentimento()" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 transition">
                Confirmar e Continuar
            </button>
        </div>
    `;
    setTimeout(() => document.getElementById('input-nome').focus(), 300);
}

function salvarConsentimento() {
    const nome = document.getElementById('input-nome').value.trim();
    const check = document.getElementById('check-consentimento').checked;
    
    if (nome.length < 3) return alert("Por favor, digite seu nome completo.");
    if (!check) return alert("É necessário aceitar o termo de consentimento para prosseguir.");
    
    dadosPaciente.nome = nome;
    dadosPaciente.consentimento = true;
    
    adicionarBalaoUsuario(`Sou ${nome}, aceito os termos.`);
    setTimeout(proximaEtapa, 400);
}

// --- 2. DEMOGRAFIA ---
function fluxoDemografia() {
    adicionarBalaoOtto(`Obrigado, ${dadosPaciente.nome.split(" ")[0]}. Agora, sua idade e sexo biológico.`);
    
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
}

function salvarDemografia() {
    const idade = document.getElementById('input-idade').value;
    const sexo = document.getElementById('input-sexo').value;
    if(!idade || !sexo) return alert("Preencha idade e sexo.");
    
    dadosPaciente.demografia = { idade, sexo };
    adicionarBalaoUsuario(`${idade} anos, ${sexo}`);
    setTimeout(proximaEtapa, 400);
}

// --- 3. QP REAL ---
function fluxoQPReal() {
    adicionarBalaoOtto("Em poucas palavras: o que você está sentindo?");
    document.getElementById('input-area').innerHTML = `
        <div class="flex gap-2 w-full">
            <input type="text" id="input-qp" class="flex-1 p-3 border border-slate-300 rounded-xl outline-none focus:border-blue-500 shadow-sm" placeholder="Ex: Dor no ouvido direito...">
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

// --- 4. GERAL ---
function fluxoGeral() {
    adicionarBalaoOtto("Você tem sentido algum destes sintomas gerais?");
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

// --- 5. MAPA ---
function fluxoSelecaoRegioes() {
    adicionarBalaoOtto("Toque nas regiões onde está o problema:");
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

// --- 6. DETALHES ---
function fluxoInvestigacaoEspecifica() {
    let lista = [];
    dadosPaciente.regioesAfetadas.forEach(r => {
        lista = lista.concat(conhecimentoMedico.dominios[r].sintomas_gatilho || []);
    });
    const unicos = [...new Set(lista)];
    
    adicionarBalaoOtto("Selecione os detalhes específicos:");
    
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

// --- 7. TEMPO ---
function fluxoTempoEvolucao() {
    adicionarBalaoOtto("Há quanto tempo isso está acontecendo?");
    document.getElementById('input-area').innerHTML = `
        <div class="flex gap-2 w-full">
            <input type="text" id="input-tempo" class="flex-1 p-3 border border-slate-300 rounded-xl outline-none focus:border-blue-500" placeholder="Ex: Começou ontem...">
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

// --- 8. FINALIZAÇÃO & REPORT ---
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
        adicionarBalaoOtto("Modo Offline. Gerando relatório local.");
        exibirProntuarioFormal([]);
    }
}

function exibirProntuarioFormal(hipoteses) {
    const chat = document.getElementById('chat-container');
    
    let textoHipoteses = "Sem dados probabilísticos suficientes.";
    if (hipoteses.length > 0) {
        textoHipoteses = hipoteses.map(h => `• ${h.doenca} (${h.probabilidade}%)\n   Base: ${h.baseado_em.join(", ")}`).join("\n");
    }

    // Texto para cópia rápida
    const textoCopia = `PACIENTE: ${dadosPaciente.nome}\nID: ${dadosPaciente.demografia.idade}a, ${dadosPaciente.demografia.sexo}.\nQP: ${dadosPaciente.qp_real}\nHDA: ${dadosPaciente.detalhesSintomas.join(", ")}. Evolução: ${dadosPaciente.tempoEvolucao}.\nIS: ${dadosPaciente.sintomasGerais.join(", ")}.`;

    const div = document.createElement('div');
    div.className = "fade-in mt-6 mx-auto w-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-20";
    div.id = "printable-area"; // IMPORTANTE PARA O CSS @media print
    
    div.innerHTML = `
        <div class="bg-slate-800 px-5 py-4 border-b border-slate-700 flex justify-between items-start text-white">
            <div class="flex flex-col">
                <span class="text-xs font-bold uppercase opacity-80 tracking-wider">Otoclinica Hart</span>
                <span class="text-lg font-bold">${dadosPaciente.nome}</span>
                <span class="text-xs opacity-70 mt-1">ID: ${dadosPaciente.demografia.idade} anos, ${dadosPaciente.demografia.sexo}</span>
            </div>
            <div class="text-right">
                <span class="text-[10px] bg-slate-700 px-2 py-1 rounded border border-slate-600 block mb-1">Protocolo #${Math.floor(Math.random()*10000)}</span>
                <span class="text-xs opacity-70">${new Date().toLocaleDateString()}</span>
            </div>
        </div>
        
        <div class="p-6 text-sm text-slate-800 font-mono leading-relaxed bg-white">
            <div class="mb-5 pb-5 border-b border-dashed border-slate-200">
                <p class="text-xs text-slate-400 font-bold uppercase mb-1">Queixa Principal (Paciente)</p>
                <p class="text-lg font-medium">"${dadosPaciente.qp_real}"</p>
            </div>

            <div class="mb-5">
                <p class="text-xs text-slate-400 font-bold uppercase mb-1">HDA / Exame Físico Dirigido</p>
                <ul class="list-disc pl-5 space-y-1">
                    <li><strong>Sintomas Referidos:</strong> ${dadosPaciente.detalhesSintomas.map(s => formatarTexto(s)).join(", ")}</li>
                    <li><strong>Região Anatômica:</strong> ${dadosPaciente.regioesAfetadas.map(formatarTexto).join(", ")}</li>
                    <li><strong>Tempo de Evolução:</strong> ${dadosPaciente.tempoEvolucao}</li>
                </ul>
            </div>
            
            <div class="mb-5">
                 <p class="text-xs text-slate-400 font-bold uppercase mb-1">Interrogatório Sistêmico (IS)</p>
                 <p>${dadosPaciente.sintomasGerais.length ? dadosPaciente.sintomasGerais.map(formatarTexto).join(", ") : "Nega sintomas sistêmicos (febre, perda de peso, etc)."}</p>
            </div>
            
            <div class="mt-6 p-4 bg-slate-50 border border-slate-200 rounded">
                <p class="font-bold text-xs text-slate-500 uppercase mb-2">Hipóteses Diagnósticas (IA OTTO)</p>
                <details class="group">
                    <summary class="cursor-pointer text-xs text-blue-600 hover:underline list-none no-print">▶ Ver Análise</summary>
                    <pre class="whitespace-pre-wrap text-xs mt-2 text-slate-700">${textoHipoteses}</pre>
                </details>
                <div class="hidden print:block text-xs text-slate-700 whitespace-pre-wrap mt-2">
                    ${textoHipoteses}
                </div>
            </div>

            <div class="mt-8 pt-4 border-t border-slate-100 text-[10px] text-slate-400 text-center">
                <p>Consentimento informado obtido digitalmente em ${new Date().toLocaleString()}.</p>
                <p>Ferramenta de apoio à decisão clínica. Não substitui avaliação médica.</p>
            </div>
        </div>

        <div class="p-4 bg-slate-50 border-t border-slate-200 flex gap-3 no-print">
            <button onclick="window.print()" class="flex-1 py-3 bg-slate-800 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-slate-700 transition flex items-center justify-center gap-2">
                🖨️ Imprimir / PDF
            </button>
            <button onclick="copiarProntuario(\`${textoCopia}\`)" class="flex-1 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition">
                📋 Copiar Texto
            </button>
        </div>
    `;
    
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function copiarProntuario(texto) {
    navigator.clipboard.writeText(texto).then(() => alert("Prontuário copiado!"));
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