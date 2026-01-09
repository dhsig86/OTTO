// THE INTERVIEWER v7 - Soft Landing & Fixes
// Melhorias: Botão Reset Visível, Etapa "Algo Mais" (Campo Livre)

const API_URL = "https://otto-api-dario-3a4d4f90581b.herokuapp.com"; 

let conhecimentoMedico = null;

let dadosPaciente = {
    nome: "",
    consentimento: false,
    demografia: { idade: "", sexo: "" },
    qp_real: "", 
    sintomasGerais: [],
    regioesAfetadas: [],
    detalhesSintomas: [],
    tempoEvolucao: "",
    algoMais: "" // NOVO CAMPO
};

let etapaAtual = 0; 
// 0=Intro, 1=Consent, 2=Demo, 3=QP, 4=Geral, 5=Mapa, 6=Detalhes, 7=Tempo, 8=AlgoMais, 9=Relatório

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const resposta = await fetch(`${API_URL}/api/heart/knowledge`);
        conhecimentoMedico = await resposta.json();
    } catch (erro) {
        console.error(erro);
        adicionarBalaoOtto("⚠️ Sistema Offline. Modo de contingência ativado.");
    }
});

function iniciarTriagem() {
    document.getElementById('intro-btn').style.display = 'none';
    proximaEtapa();
}

function proximaEtapa() {
    etapaAtual++;

    if (!conhecimentoMedico && etapaAtual > 2) {
        adicionarBalaoOtto("Carregando protocolos...");
        setTimeout(proximaEtapa, 1500);
        return;
    }

    switch (etapaAtual) {
        case 1: fluxoConsentimento(); break;
        case 2: fluxoDemografia(); break;
        case 3: fluxoQPReal(); break;
        case 4: fluxoGeral(); break;
        case 5: fluxoSelecaoRegioes(); break;
        case 6: fluxoInvestigacaoEspecifica(); break;
        case 7: fluxoTempoEvolucao(); break;
        case 8: fluxoAlgoMais(); break; // NOVA ETAPA
        case 9: finalizarTriagem(); break;
    }
}

// ... (Mantenha as funções fluxoConsentimento, fluxoDemografia, fluxoQPReal, fluxoGeral, fluxoSelecaoRegioes, fluxoInvestigacaoEspecifica IGUAIS) ...
// ... Copie elas do código anterior ou mantenha se não apagou ...

// VOU REPETIR AS FUNÇÕES CURTAS PARA GARANTIR QUE VOCÊ TENHA O ARQUIVO INTEIRO CORRETO:

function fluxoConsentimento() {
    adicionarBalaoOtto("Digite seu nome completo e confirme o uso dos dados.");
    document.getElementById('input-area').innerHTML = `
        <div class="flex flex-col gap-3 bg-white p-1">
            <input type="text" id="input-nome" class="w-full p-3 border border-slate-300 rounded-xl outline-none focus:border-blue-500 font-medium" placeholder="Nome Completo">
            <label class="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer"><input type="checkbox" id="check-consentimento" class="w-5 h-5 mt-0.5"><span class="text-xs text-slate-600">Li e aceito os termos de uso de dados.</span></label>
            <button onclick="salvarConsentimento()" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Continuar</button>
        </div>`;
    setTimeout(() => document.getElementById('input-nome').focus(), 300);
}
function salvarConsentimento() {
    const nome = document.getElementById('input-nome').value.trim();
    if (nome.length < 3 || !document.getElementById('check-consentimento').checked) return alert("Preencha nome e aceite os termos.");
    dadosPaciente.nome = nome;
    dadosPaciente.consentimento = true;
    adicionarBalaoUsuario(nome); setTimeout(proximaEtapa, 400);
}

function fluxoDemografia() {
    adicionarBalaoOtto(`Olá ${dadosPaciente.nome.split(" ")[0]}. Qual sua idade e sexo?`);
    document.getElementById('input-area').innerHTML = `
        <div class="flex gap-2 items-end bg-white p-1">
            <input type="number" id="input-idade" class="flex-1 p-3 border border-slate-200 rounded-xl outline-none text-lg" placeholder="Idade">
            <select id="input-sexo" class="flex-1 p-3 border border-slate-200 rounded-xl outline-none text-lg"><option value="" disabled selected>Sexo</option><option value="Masculino">Masculino</option><option value="Feminino">Feminino</option></select>
            <button onclick="salvarDemografia()" class="bg-blue-600 text-white w-14 rounded-xl shadow-md">➔</button>
        </div>`;
}
function salvarDemografia() {
    const idade = document.getElementById('input-idade').value;
    const sexo = document.getElementById('input-sexo').value;
    if(!idade || !sexo) return alert("Preencha idade e sexo.");
    dadosPaciente.demografia = { idade, sexo };
    adicionarBalaoUsuario(`${idade}a, ${sexo}`); setTimeout(proximaEtapa, 400);
}

function fluxoQPReal() {
    adicionarBalaoOtto("O que você está sentindo? (Resumo)");
    document.getElementById('input-area').innerHTML = `<div class="flex gap-2 w-full"><input type="text" id="input-qp" class="flex-1 p-3 border border-slate-300 rounded-xl outline-none" placeholder="Ex: Dor de ouvido..."><button onclick="salvarQP()" class="bg-blue-600 text-white px-6 rounded-xl font-bold">Enviar</button></div>`;
    document.getElementById('input-qp').focus();
}
function salvarQP() {
    const txt = document.getElementById('input-qp').value;
    if(!txt) return;
    dadosPaciente.qp_real = txt;
    adicionarBalaoUsuario(txt); setTimeout(proximaEtapa, 400);
}

function fluxoGeral() {
    adicionarBalaoOtto("Sintomas gerais (febre, perda de peso)?");
    const gerais = conhecimentoMedico.anamnese_geral.sintomas_sistemicos;
    let html = '<div class="flex flex-wrap gap-2 justify-center pb-2">';
    gerais.forEach(s => html += `<button id="btn-${s}" onclick="toggleGeral('${s}')" class="px-4 py-2 border rounded-full text-sm text-slate-600">${formatarTexto(s)}</button>`);
    html += '</div><button onclick="proximaEtapa()" class="w-full bg-slate-800 text-white py-3 rounded-xl font-bold">Continuar</button>';
    document.getElementById('input-area').innerHTML = html;
}
function toggleGeral(s) {
    const btn = document.getElementById(`btn-${s}`);
    const idx = dadosPaciente.sintomasGerais.indexOf(s);
    if(idx === -1) { dadosPaciente.sintomasGerais.push(s); btn.className = "px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-full text-sm font-bold"; }
    else { dadosPaciente.sintomasGerais.splice(idx, 1); btn.className = "px-4 py-2 border rounded-full text-sm text-slate-600"; }
}

function fluxoSelecaoRegioes() {
    adicionarBalaoOtto("Onde dói/incomoda?");
    let html = '<div class="grid grid-cols-2 gap-2 mb-3">';
    Object.keys(conhecimentoMedico.dominios).forEach(k => html += `<button id="reg-${k}" onclick="toggleReg('${k}')" class="h-20 border rounded-xl flex flex-col items-center justify-center"><span class="text-2xl">${getEmoji(k)}</span><span class="text-xs font-bold uppercase">${conhecimentoMedico.dominios[k].nome_exibicao || k}</span></button>`);
    html += '</div><button onclick="validarReg()" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Avançar</button>';
    document.getElementById('input-area').innerHTML = html;
}
function toggleReg(k) {
    const btn = document.getElementById(`reg-${k}`);
    const idx = dadosPaciente.regioesAfetadas.indexOf(k);
    if(idx === -1) { dadosPaciente.regioesAfetadas.push(k); btn.classList.add('bg-blue-50', 'border-blue-500'); }
    else { dadosPaciente.regioesAfetadas.splice(idx, 1); btn.classList.remove('bg-blue-50', 'border-blue-500'); }
}
function validarReg() {
    if(dadosPaciente.regioesAfetadas.length===0) return alert("Marque uma região.");
    adicionarBalaoUsuario(dadosPaciente.regioesAfetadas.map(formatarTexto).join("+")); setTimeout(proximaEtapa, 400);
}

function fluxoInvestigacaoEspecifica() {
    let lista = []; dadosPaciente.regioesAfetadas.forEach(r => lista = lista.concat(conhecimentoMedico.dominios[r].sintomas_gatilho||[]));
    const unicos = [...new Set(lista)];
    adicionarBalaoOtto("Detalhes do sintoma:");
    let html = '<div class="flex flex-wrap gap-2 justify-center pb-3">';
    unicos.forEach(s => html += `<button id="det-${s}" onclick="toggleDet('${s}')" class="px-3 py-2 bg-slate-100 border rounded-lg text-sm">${formatarTexto(s)}</button>`);
    html += '</div><button onclick="proximaEtapa()" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Próximo</button>';
    document.getElementById('input-area').innerHTML = html;
}
function toggleDet(s) {
    const btn = document.getElementById(`det-${s}`);
    const idx = dadosPaciente.detalhesSintomas.indexOf(s);
    if(idx === -1) { dadosPaciente.detalhesSintomas.push(s); btn.className = "px-3 py-2 bg-blue-100 border border-blue-300 text-blue-800 rounded-lg text-sm font-bold"; }
    else { dadosPaciente.detalhesSintomas.splice(idx, 1); btn.className = "px-3 py-2 bg-slate-100 border rounded-lg text-sm"; }
}

function fluxoTempoEvolucao() {
    adicionarBalaoOtto("Há quanto tempo?");
    document.getElementById('input-area').innerHTML = `<div class="flex gap-2 w-full"><input type="text" id="input-tempo" class="flex-1 p-3 border border-slate-300 rounded-xl outline-none" placeholder="Ex: 2 dias..."><button onclick="salvarTempo()" class="bg-blue-600 text-white px-6 rounded-xl font-bold">OK</button></div>`;
    document.getElementById('input-tempo').focus();
}
function salvarTempo() {
    const txt = document.getElementById('input-tempo').value;
    if(!txt) return;
    dadosPaciente.tempoEvolucao = txt;
    adicionarBalaoUsuario(txt); setTimeout(proximaEtapa, 400);
}

// --- 8. NOVO: ALGO MAIS? (Suaviza o fim) ---
function fluxoAlgoMais() {
    adicionarBalaoOtto("Gostaria de acrescentar mais algum detalhe? (Medicamentos, alergias, ou observações)");
    
    document.getElementById('input-area').innerHTML = `
        <div class="flex flex-col gap-2 w-full bg-white p-1">
            <textarea id="input-algo-mais" class="w-full p-3 border border-slate-300 rounded-xl outline-none focus:border-blue-500 h-20 text-sm" placeholder="Ex: Estou tomando dipirona, sou alérgico a penicilina..."></textarea>
            <div class="flex gap-2">
                <button onclick="salvarAlgoMais(false)" class="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold">Não, encerrar</button>
                <button onclick="salvarAlgoMais(true)" class="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold shadow-md">Adicionar e Finalizar</button>
            </div>
        </div>
    `;
    // Não foca automaticamente para não abrir teclado no mobile se a pessoa não quiser
}

function salvarAlgoMais(temDado) {
    const texto = document.getElementById('input-algo-mais').value;
    
    if (temDado && texto) {
        dadosPaciente.algoMais = texto;
        adicionarBalaoUsuario("Obs: " + texto);
        adicionarBalaoOtto("Entendido. Registrado.");
    } else {
        adicionarBalaoUsuario("Não, obrigado.");
    }
    
    setTimeout(finalizarTriagem, 800);
}

// --- FINALIZAÇÃO ---
async function finalizarTriagem() {
    adicionarBalaoOtto("Analisando dados e gerando prontuário... ⏳");
    document.getElementById('input-area').innerHTML = '<div class="text-center text-xs text-slate-400 py-4 uppercase font-bold tracking-widest">Triagem Completa</div>';
    
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
        adicionarBalaoOtto("Gerando relatório local (Offline).");
        exibirProntuarioFormal([]);
    }
}

function exibirProntuarioFormal(hipoteses) {
    const chat = document.getElementById('chat-container');
    
    let textoHipoteses = "Sem dados suficientes.";
    if (hipoteses.length > 0) {
        textoHipoteses = hipoteses.map(h => `• ${h.doenca} (${h.probabilidade}%)\n   Base: ${h.baseado_em.join(", ")}`).join("\n");
    }
    
    // Inclui o campo "Algo Mais" no texto
    const obsTexto = dadosPaciente.algoMais ? `OBSERVAÇÕES: ${dadosPaciente.algoMais}` : "";

    const textoCopia = `PACIENTE: ${dadosPaciente.nome}\nID: ${dadosPaciente.demografia.idade}a, ${dadosPaciente.demografia.sexo}.\nQP: ${dadosPaciente.qp_real}\nHDA: ${dadosPaciente.detalhesSintomas.join(", ")} em ${dadosPaciente.regioesAfetadas.join("/")}. Tempo: ${dadosPaciente.tempoEvolucao}.\nIS: ${dadosPaciente.sintomasGerais.join(", ")}.\n${obsTexto}`;

    const div = document.createElement('div');
    div.className = "fade-in mt-6 mx-auto w-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-20";
    div.id = "printable-area";
    
    div.innerHTML = `
        <div class="bg-slate-800 px-5 py-4 border-b border-slate-700 flex justify-between items-start text-white">
            <div class="flex flex-col">
                <span class="text-xs font-bold uppercase opacity-80 tracking-wider">Otoclinica Hart</span>
                <span class="text-lg font-bold">${dadosPaciente.nome}</span>
                <span class="text-xs opacity-70 mt-1">ID: ${dadosPaciente.demografia.idade}a, ${dadosPaciente.demografia.sexo}</span>
            </div>
            <div class="text-right">
                <span class="text-[10px] bg-slate-700 px-2 py-1 rounded border border-slate-600 block mb-1">Ref #${Math.floor(Math.random()*10000)}</span>
                <span class="text-xs opacity-70">${new Date().toLocaleDateString()}</span>
            </div>
        </div>
        
        <div class="p-6 text-sm text-slate-800 font-mono leading-relaxed bg-white">
            <div class="mb-5 pb-5 border-b border-dashed border-slate-200">
                <p class="text-xs text-slate-400 font-bold uppercase mb-1">Queixa Principal</p>
                <p class="text-lg font-medium">"${dadosPaciente.qp_real}"</p>
            </div>

            <div class="mb-5">
                <p class="text-xs text-slate-400 font-bold uppercase mb-1">HDA / Exame Dirigido</p>
                <ul class="list-disc pl-5 space-y-1">
                    <li><strong>Sintomas:</strong> ${dadosPaciente.detalhesSintomas.map(formatarTexto).join(", ")}</li>
                    <li><strong>Região:</strong> ${dadosPaciente.regioesAfetadas.map(formatarTexto).join(", ")}</li>
                    <li><strong>Evolução:</strong> ${dadosPaciente.tempoEvolucao}</li>
                    ${dadosPaciente.algoMais ? `<li class="text-blue-800 font-bold bg-blue-50 p-1 rounded mt-2">OBS: ${dadosPaciente.algoMais}</li>` : ''}
                </ul>
            </div>
            
            <div class="mb-5">
                 <p class="text-xs text-slate-400 font-bold uppercase mb-1">Sistêmico (IS)</p>
                 <p>${dadosPaciente.sintomasGerais.length ? dadosPaciente.sintomasGerais.map(formatarTexto).join(", ") : "Nega sintomas gerais."}</p>
            </div>
            
            <div class="mt-6 p-4 bg-slate-50 border border-slate-200 rounded">
                <p class="font-bold text-xs text-slate-500 uppercase mb-2">Hipóteses Diagnósticas (IA)</p>
                <details class="group">
                    <summary class="cursor-pointer text-xs text-blue-600 hover:underline list-none no-print">▶ Ver Análise</summary>
                    <pre class="whitespace-pre-wrap text-xs mt-2 text-slate-700">${textoHipoteses}</pre>
                </details>
                <div class="hidden print:block text-xs text-slate-700 whitespace-pre-wrap mt-2">${textoHipoteses}</div>
            </div>

            <div class="mt-8 pt-4 border-t border-slate-100 text-[10px] text-slate-400 text-center">
                <p>Dados coletados via Triagem OTTO em ${new Date().toLocaleString()}.</p>
            </div>
        </div>

        <div class="p-4 bg-slate-50 border-t border-slate-200 flex gap-3 no-print">
            <button onclick="window.print()" class="flex-1 py-3 bg-slate-800 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-slate-700 transition flex items-center justify-center gap-2">🖨️ Imprimir</button>
            <button onclick="copiarProntuario(\`${textoCopia}\`)" class="flex-1 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition">📋 Copiar</button>
        </div>
    `;
    
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function copiarProntuario(texto) { navigator.clipboard.writeText(texto).then(() => alert("Copiado!")); }
function formatarTexto(str) { return str ? str.replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase()) : ""; }
function getEmoji(key) { const m = { "ouvido": "👂", "nariz": "👃", "garganta": "👄", "pescoco": "🧣" }; return m[key] || "📍"; }
function adicionarBalaoUsuario(texto) { const chat = document.getElementById('chat-container'); const div = document.createElement('div'); div.className = "flex gap-2 flex-row-reverse fade-in"; div.innerHTML = `<div class="bg-blue-600 text-white py-2 px-4 rounded-2xl rounded-tr-sm shadow-sm text-sm max-w-[80%] break-words">${texto}</div>`; chat.appendChild(div); chat.scrollTop = chat.scrollHeight; }
function adicionarBalaoOtto(texto) { const chat = document.getElementById('chat-container'); const div = document.createElement('div'); div.className = "flex gap-2 fade-in"; div.innerHTML = `<div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-lg shrink-0 border border-blue-50">🤖</div><div class="bg-white py-3 px-4 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100 text-sm text-slate-700 max-w-[85%]">${texto}</div>`; chat.appendChild(div); chat.scrollTop = chat.scrollHeight; }