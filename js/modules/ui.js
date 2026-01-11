// MÓDULO DE INTERFACE (UI) v2 - Dual View
// Inclusão: Sistema de Abas (Paciente vs Médico) no Relatório Final

const chatContainer = document.getElementById('chat-container');
const inputArea = document.getElementById('input-area');
const introBtn = document.getElementById('intro-btn');

export const UI = {
    hideIntro() { if(introBtn) introBtn.style.display = 'none'; },

    renderInput(htmlContent) {
        inputArea.innerHTML = htmlContent;
        const firstInput = inputArea.querySelector('input, select, textarea');
        if (firstInput) setTimeout(() => firstInput.focus(), 300);
    },

    addOttoBubble(text) {
        const div = document.createElement('div');
        div.className = "flex gap-3 fade-in mb-4";
        div.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-lg shrink-0 border border-blue-50">🤖</div>
            <div class="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 text-sm text-slate-700 max-w-[85%] leading-relaxed">${text}</div>
        `;
        chatContainer.appendChild(div);
        this.scrollToBottom();
    },

    addUserBubble(text) {
        const div = document.createElement('div');
        div.className = "flex gap-3 flex-row-reverse fade-in mb-4";
        div.innerHTML = `<div class="bg-blue-600 text-white py-2 px-4 rounded-2xl rounded-tr-none shadow-sm text-sm max-w-[80%] break-words">${text}</div>`;
        chatContainer.appendChild(div);
        this.scrollToBottom();
    },

    showLoading() {
        const div = document.createElement('div');
        div.id = "ui-loading-indicator";
        div.className = "flex gap-3 fade-in mb-4";
        div.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-lg shrink-0">🤖</div>
            <div class="bg-slate-50 p-3 rounded-2xl rounded-tl-none text-slate-400 text-xs italic flex items-center gap-2">
                <span class="animate-pulse">●</span><span class="animate-pulse delay-75">●</span><span class="animate-pulse delay-150">●</span>
            </div>`;
        chatContainer.appendChild(div);
        this.scrollToBottom();
    },

    hideLoading() {
        const el = document.getElementById("ui-loading-indicator");
        if (el) el.remove();
    },

    scrollToBottom() {
        chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
    },

    formatText(str) {
        if (!str) return "";
        return str.replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase());
    },

    getEmoji(key) {
        const map = { "ouvido": "👂", "nariz": "👃", "garganta": "👄", "pescoco": "🧣", "zumbido": "🔔", "tontura": "🌀" };
        return map[key] || "📍";
    },

    // --- NOVA FUNÇÃO: RELATÓRIO DUAL VIEW ---
    renderFinalReport(dados, hipoteses) {
    // LINHA DE SEGURANÇA :
       if (!hipoteses) hipoteses = [];
        // 1. Gera Conteúdo da Via do Paciente 
        const htmlPaciente = `
            <div class="p-6 bg-white">
                <div class="mb-6 text-center">
                    <div class="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">✓</div>
                    <h3 class="text-lg font-bold text-slate-800">Triagem Concluída!</h3>
                    <p class="text-sm text-slate-500">Seus dados já estão organizados para o Dr. Dario.</p>
                </div>
                
                <div class="space-y-4">
                    <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p class="text-xs font-bold text-slate-400 uppercase mb-1">Você relatou:</p>
                        <p class="text-slate-800 font-medium">"${dados.qp_real}"</p>
                        <p class="text-xs text-slate-500 mt-2">Sintomas: ${dados.detalhesSintomas.map(this.formatText).join(", ")}.</p>
                    </div>

                    <div class="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <p class="text-xs font-bold text-blue-500 uppercase mb-2">Próximos Passos:</p>
                        <ul class="text-sm text-blue-800 space-y-2">
                            <li class="flex gap-2">📄 <span>Se tiver exames anteriores, deixe-os separados.</span></li>
                            <li class="flex gap-2">💊 <span>Tenha em mente os nomes dos remédios que usa.</span></li>
                            <li class="flex gap-2">🧘 <span>Aguarde ser chamado, o médico já analisará seu caso.</span></li>
                        </ul>
                    </div>
                </div>
                <div class="mt-8 text-center">
                    <button onclick="location.reload()" class="text-xs text-slate-400 underline hover:text-slate-600">Iniciar Novo Atendimento</button>
                </div>
            </div>
        `;

        // 2. Gera Conteúdo da Via Médica (Técnica e Completa)
        let blocoMedico = "<div class='text-slate-400 italic text-xs py-2'>Sem correlação clínica evidente.</div>";
        if (hipoteses.length > 0) {
            blocoMedico = hipoteses.map(h => {
                const isEmergencia = h.doenca.includes("EMERGÊNCIA") || h.doenca.includes("AVC") || h.doenca.includes("Abscesso");
                const cor = isEmergencia ? "red" : "blue";
                const questionario = h.questionario ? `<div class="mt-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-1 rounded inline-block">Aplicar: ${h.questionario}</div>` : "";

                return `
                <div class="mb-3 border-l-4 border-${cor}-500 pl-3 py-1 bg-slate-50">
                    <div class="flex justify-between">
                        <span class="font-bold text-sm text-slate-900">${h.doenca}</span>
                        <span class="text-xs font-mono font-bold bg-white border px-1 rounded">${h.probabilidade}%</span>
                    </div>
                    <div class="text-[10px] text-slate-500 mt-0.5">Base: ${h.baseado_em.join(", ")}</div>
                    ${h.condutas ? `<div class="mt-1 text-[10px] text-slate-600"><strong>Conduta:</strong> ${h.condutas.join(". ")}</div>` : ""}
                    ${questionario}
                </div>`;
            }).join("");
        }

        const textoCopia = `PACIENTE: ${dados.nome} (${dados.demografia.idade}a)\nQP: ${dados.qp_real}\nHDA: ${dados.detalhesSintomas.join(", ")} (${dados.respostasInvestigativas.join(". ")}). ${dados.tempoEvolucao}.\nIS: ${dados.sintomasGerais.join(", ")}.\nCDSS: ${hipoteses.map(h=>h.doenca).join(", ")}.`;

        const htmlMedico = `
            <div id="printable-area" class="p-4 bg-white font-mono text-sm">
                <div class="bg-slate-900 text-white p-3 mb-4 rounded flex justify-between items-center">
                    <span>${dados.nome}</span>
                    <span class="text-xs opacity-70">ID: ${dados.demografia.idade}a</span>
                </div>
                
                <div class="space-y-3 mb-4">
                    <p><strong>QP:</strong> ${dados.qp_real}</p>
                    <p><strong>HDA:</strong> ${dados.detalhesSintomas.map(this.formatText).join(", ")}. <br><em>Detalhes:</em> ${dados.respostasInvestigativas.join(". ")}.<br><em>Evolução:</em> ${dados.tempoEvolucao}.</p>
                    <p><strong>IS:</strong> ${dados.sintomasGerais.length ? dados.sintomasGerais.join(", ") : "Nega sintomas gerais."} ${dados.detalhesFebre ? `(Febre: ${dados.detalhesFebre})` : ""}</p>
                    ${dados.sinaisAlarme.length ? `<p class="text-red-600 font-bold">⚠️ ALARME: ${dados.sinaisAlarme.join(", ")}</p>` : ""}
                    ${dados.algoMais ? `<p class="bg-yellow-50 p-1 border-l-2 border-yellow-400">📝 OBS: ${dados.algoMais}</p>` : ""}
                </div>

                <div class="border-t pt-3">
                    <p class="text-xs font-bold text-slate-400 uppercase mb-2">Suporte à Decisão (IA OTTO)</p>
                    ${blocoMedico}
                </div>

                <div class="mt-6 flex gap-2 no-print">
                    <button onclick="window.print()" class="flex-1 bg-slate-800 text-white py-2 rounded font-bold hover:bg-black">Imprimir</button>
                    <button onclick="navigator.clipboard.writeText(\`${textoCopia}\`).then(()=>alert('Copiado!'))" class="flex-1 border border-slate-300 py-2 rounded font-bold hover:bg-slate-50">Copiar Texto</button>
                </div>
            </div>
        `;

        // 3. Monta a Estrutura de Abas
        const divContainer = document.createElement('div');
        divContainer.className = "fade-in mt-6 mx-auto w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden mb-20 relative";
        
        divContainer.innerHTML = `
            <div class="flex border-b border-slate-200 bg-slate-50">
                <button id="tab-patient-btn" class="flex-1 py-3 text-sm font-bold text-blue-600 border-b-2 border-blue-600 bg-white transition-colors">
                    👤 Para Você
                </button>
                <button id="tab-doctor-btn" class="flex-1 py-3 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
                    ⚕️ Área Médica
                </button>
            </div>

            <div id="tab-patient-content" class="block">
                ${htmlPaciente}
            </div>
            <div id="tab-doctor-content" class="hidden">
                ${htmlMedico}
            </div>
        `;

        chatContainer.appendChild(divContainer);
        this.scrollToBottom();

        // 4. Lógica de Troca de Abas
        const btnPat = divContainer.querySelector('#tab-patient-btn');
        const btnDoc = divContainer.querySelector('#tab-doctor-btn');
        const contentPat = divContainer.querySelector('#tab-patient-content');
        const contentDoc = divContainer.querySelector('#tab-doctor-content');

        btnPat.onclick = () => {
            contentPat.className = 'block';
            contentDoc.className = 'hidden';
            btnPat.className = 'flex-1 py-3 text-sm font-bold text-blue-600 border-b-2 border-blue-600 bg-white';
            btnDoc.className = 'flex-1 py-3 text-sm font-bold text-slate-400 hover:text-slate-600';
        };

        btnDoc.onclick = () => {
            // Pequena "trava" psicológica (opcional) ou acesso direto
            contentPat.className = 'hidden';
            contentDoc.className = 'block';
            btnDoc.className = 'flex-1 py-3 text-sm font-bold text-slate-800 border-b-2 border-slate-800 bg-white';
            btnPat.className = 'flex-1 py-3 text-sm font-bold text-slate-400 hover:text-slate-600';
        };
    }
};