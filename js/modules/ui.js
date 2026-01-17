// MÓDULO UI v4.0 - Interface Blindada e Dual View
// Inclui correção de variáveis para evitar tela branca

const chatContainer = document.getElementById('chat-container');
const inputArea = document.getElementById('input-area');
const introBtn = document.getElementById('intro-btn');

export const UI = {
    hideIntro() { if(introBtn) introBtn.style.display = 'none'; },
    
    renderInput(html) {
        inputArea.innerHTML = html;
        const input = inputArea.querySelector('input');
        if(input) setTimeout(()=>input.focus(), 300);
    },

    bind(id, callback) {
        const el = document.getElementById(id);
        if(el) el.onclick = callback;
    },

    // --- TEMPLATES DE SELEÇÃO ---
    bindSelectButtons(callback, isRed = false) {
        const selected = new Set();
        document.querySelectorAll('.btn-select').forEach(btn => {
            btn.onclick = () => {
                const val = btn.dataset.val;
                const baseClass = "btn-select px-4 py-3 border rounded-xl text-sm text-left w-full mb-2 transition ";
                const activeClass = isRed ? "bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500 font-bold" : "bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500 font-bold";
                const inactiveClass = "bg-white border-slate-200 text-slate-600 hover:bg-slate-50";

                if(selected.has(val)) {
                    selected.delete(val);
                    btn.className = baseClass + inactiveClass;
                } else {
                    selected.add(val);
                    btn.className = baseClass + activeClass;
                }
                callback(Array.from(selected));
            };
        });
    },

    bindRegionButtons(callback) {
        const selected = new Set();
        document.querySelectorAll('.btn-reg').forEach(btn => {
            btn.onclick = () => {
                const val = btn.dataset.val;
                if(selected.has(val)) {
                    selected.delete(val);
                    btn.classList.remove('ring-2', 'ring-blue-400', 'bg-blue-50');
                } else {
                    selected.add(val);
                    btn.classList.add('ring-2', 'ring-blue-400', 'bg-blue-50');
                }
                callback(Array.from(selected));
            };
        });
    },

    // --- BIBLIOTECA DE HTML (TEMPLATES) ---
    templates: {
        consent: () => `
            <div class="space-y-3">
                <input id="inp-name" type="text" class="w-full p-3 border rounded-xl" placeholder="Seu Nome Completo">
                <button id="btn-next" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Aceitar e Iniciar</button>
            </div>`,
        
        demographics: () => `
            <div class="flex gap-2 mb-3">
                <input id="inp-age" type="number" class="flex-1 p-3 border rounded-xl" placeholder="Idade">
                <select id="inp-sex" class="flex-1 p-3 border rounded-xl bg-white"><option value="Masculino">Masc</option><option value="Feminino">Fem</option></select>
            </div>
            <select id="inp-visit" class="w-full p-3 border rounded-xl bg-white mb-3"><option value="Primeira">Primeira vez</option><option value="Retorno">Retorno</option></select>
            <button id="btn-next" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Continuar</button>
            ${UI.backBtn()}`,

        textInput: (placeholder, twoBtns=false) => `
            <textarea id="inp-text" class="w-full p-3 border rounded-xl h-24 mb-3" placeholder="${placeholder}"></textarea>
            ${twoBtns ? 
                `<div class="flex gap-2"><button id="btn-skip" class="flex-1 py-3 bg-slate-100 rounded-xl">Pular</button><button id="btn-finish" class="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold">Finalizar</button></div>` : 
                `<button id="btn-next" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Enviar</button>`
            }
            ${UI.backBtn()}`,

        regions: (dominios) => {
            let html = '<div class="grid grid-cols-2 gap-2 mb-3">';
            Object.keys(dominios).forEach(k => {
                html += `<button class="btn-reg p-4 border rounded-xl flex flex-col items-center gap-2 bg-white transition" data-val="${k}">
                    <span class="text-2xl">📍</span><span class="font-bold text-sm uppercase text-slate-600">${dominios[k].nome_exibicao}</span>
                </button>`;
            });
            return html + `</div>${UI.backBtn()}`;
        },

        multiSelect: (options, objects=null) => {
            let html = '<div class="max-h-60 overflow-y-auto mb-3">';
            options.forEach((opt, idx) => {
                const label = objects ? objects[idx].texto : UI.formatText(opt);
                const val = objects ? objects[idx].id : opt;
                html += `<button class="btn-select px-4 py-3 border rounded-xl text-sm text-left w-full mb-2 bg-white text-slate-600" data-val="${val}">${label}</button>`;
            });
            return html + `</div><button id="btn-next" class="w-full bg-slate-800 text-white py-3 rounded-xl font-bold">Confirmar</button>${UI.backBtn()}`;
        },

        qualifiersForm: (queue) => {
            let html = '<div class="space-y-4 mb-4">';
            queue.forEach(q => {
                html += `<div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p class="text-xs font-bold text-blue-600 uppercase mb-2">${q.config.pergunta}</p>`;
                
                q.config.atributos.forEach(attr => {
                    const id = `qualif-${q.sId}-${attr.id}`;
                    if(attr.tipo === "escala_0_10") {
                        html += `
                        <div class="mb-2">
                            <label class="text-xs text-slate-500">Intensidade (0 a 10)</label>
                            <div class="flex items-center gap-2">
                                <input type="range" id="${id}" min="0" max="10" value="5" class="flex-1 accent-blue-600" oninput="this.nextElementSibling.value = this.value">
                                <output class="text-sm font-bold w-6 text-center">5</output>
                            </div>
                        </div>`;
                    } else {
                        html += `
                        <div class="mb-2">
                            <select id="${id}" class="w-full p-2 text-sm border rounded bg-white">
                                <option value="" disabled selected>Selecione...</option>
                                ${attr.opcoes.map(o => `<option value="${o}">${o}</option>`).join('')}
                            </select>
                        </div>`;
                    }
                });
                html += `</div>`;
            });
            return html + `</div><button id="btn-next" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Salvar Detalhes</button>${UI.backBtn()}`;
        },

        binaryQuestions: (factors) => {
            let html = '<div class="space-y-2 mb-4">';
            factors.forEach(f => {
                html += `
                <button class="btn-binary w-full p-3 border border-slate-200 rounded-xl bg-white text-left text-sm text-slate-700 flex items-center gap-2 transition hover:bg-slate-50" data-id="${f.id}">
                    <span class="check-icon w-6 h-6 flex items-center justify-center rounded-full border border-slate-300 font-bold text-xs"></span>
                    <span>${f.texto}</span>
                </button>`;
            });
            return html + `</div><button id="btn-next" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Concluir</button>${UI.backBtn()}`;
        }
    },

    backBtn: () => `<div class="mt-2 text-center"><button id="btn-back" class="text-xs text-slate-400 underline py-2 hover:text-slate-600">Voltar</button></div>`,
    
    // --- RELATÓRIO FINAL ---
    renderFinalReport(dados, hipoteses) {
        // CORREÇÃO CRÍTICA: Proteção contra lista nula e uso da variável correta 'detalhesSintomas'
        const listaSintomas = dados.detalhesSintomas || []; 
        const respostasQualif = dados.respostasQualificadores || {};
        const respostasDiscrim = dados.respostasDiscriminantes || [];
        const listaHipoteses = hipoteses || [];

        // HTML VIA MÉDICA
        let htmlMedico = `
        <div class="p-4 bg-white font-mono text-xs leading-relaxed text-slate-800">
            <div class="bg-slate-900 text-white p-2 rounded mb-3 flex justify-between items-center">
                <span class="font-bold uppercase">${dados.nome}</span> 
                <span class="opacity-75">${dados.demografia.idade} anos | ${dados.demografia.sexo}</span>
            </div>

            <div class="mb-3">
                <p class="font-bold text-slate-400 text-[10px] mb-1">QUEIXA PRINCIPAL</p>
                <p class="bg-slate-50 p-2 rounded border border-slate-100">"${dados.qp_real}"</p>
            </div>

            <div class="mb-3">
                <p class="font-bold text-slate-400 text-[10px] mb-1">HISTÓRIA DA DOENÇA ATUAL (HDA)</p>
                <ul class="list-disc pl-4 space-y-1">
        `;
        
        // Loop seguro pelos sintomas
        listaSintomas.forEach(s => {
            let texto = `<strong>${UI.formatText(s)}</strong>`;
            const qualifs = respostasQualif[s];
            if(qualifs) {
                // Formata os detalhes bonitinhos
                const detalhes = Object.entries(qualifs)
                    .map(([k,v]) => `<span class="italic text-slate-500">${k}: ${v}</span>`)
                    .join(", ");
                texto += ` <span class="text-[10px]">(${detalhes})</span>`;
            }
            htmlMedico += `<li>${texto}</li>`;
        });
        
        if(respostasDiscrim.length > 0) {
            htmlMedico += `<li class="mt-2 text-blue-700 font-bold">Fatores Positivos: ${respostasDiscrim.join(", ")}</li>`;
        }
        
        if(dados.algoMais) {
             htmlMedico += `<li class="mt-2 text-orange-700">Obs: ${dados.algoMais}</li>`;
        }

        htmlMedico += `</ul></div>`;
        
        // Alertas Vermelhos
        if(dados.sinaisAlarme && dados.sinaisAlarme.length > 0) {
            htmlMedico += `<div class="bg-red-50 border-l-4 border-red-500 p-2 mb-3 text-red-800 font-bold flex items-center gap-2"><span>⚠️</span> ALERTA: ${dados.sinaisAlarme.join(", ")}</div>`;
        }

        // CDSS (IA)
        htmlMedico += `<div class="border-t pt-2 mt-4">
            <p class="font-bold text-slate-400 text-[10px] mb-2 uppercase tracking-wider">Suporte à Decisão Clínica (CDSS)</p>`;
        
        if(listaHipoteses.length === 0) {
            htmlMedico += `<p class="italic text-slate-400 p-2 text-center">Sem correlação algorítmica específica para protocolos de urgência.</p>`;
        } else {
            listaHipoteses.forEach(h => {
                // Condutas Coloridas
                const condutasHTML = h.condutas ? h.condutas.map(c => {
                    if(c.includes("[Dx]")) return `<p class="text-blue-700 pl-2 border-l-2 border-blue-200 mb-1">🔍 ${c.replace("[Dx]", "")}</p>`;
                    if(c.includes("[Tx]")) return `<p class="text-green-700 pl-2 border-l-2 border-green-200 mb-1">💊 ${c.replace("[Tx]", "")}</p>`;
                    if(c.includes("[ALERTA]")) return `<p class="text-red-600 font-bold pl-2 border-l-2 border-red-200 mb-1">🚨 ${c.replace("[ALERTA]", "")}</p>`;
                    return `<p class="text-slate-600 pl-2 mb-1">• ${c}</p>`;
                }).join("") : "";

                htmlMedico += `
                <div class="mb-3 bg-slate-50 p-3 rounded border border-slate-200 shadow-sm">
                    <div class="flex justify-between font-bold text-slate-800 border-b border-slate-200 pb-1 mb-2">
                        <span>${h.doenca}</span> 
                        <span class="bg-white px-2 rounded border text-xs flex items-center">${h.probabilidade}%</span>
                    </div>
                    
                    <div class="text-[10px] text-slate-500 mb-2">Base: ${h.baseado_em.join(", ")}</div>
                    <div class="space-y-1 text-[11px] leading-tight">${condutasHTML}</div>
                </div>`;
            });
        }
        
        htmlMedico += `</div></div>`; // Fim
        
        UI.renderTabs(htmlMedico); 
    },
    
    renderTabs(htmlMedico) {
        const div = document.createElement('div');
        div.className = "mt-4 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden mb-20 fade-in";
        div.innerHTML = `
            <div class="flex border-b bg-slate-50">
                <button class="flex-1 py-4 font-bold text-blue-600 bg-white border-b-2 border-blue-600 transition" id="tab-pat">👤 Para Você</button>
                <button class="flex-1 py-4 font-bold text-slate-400 hover:text-slate-600 transition" id="tab-doc">⚕️ Área Médica</button>
            </div>
            
            <div id="content-pat" class="p-8 text-center animate-slide-in">
                <div class="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 shadow-sm">✓</div>
                <h3 class="text-xl font-bold text-slate-800 mb-2">Triagem Concluída!</h3>
                <p class="text-slate-500 mb-6">Seus dados já foram organizados para o Dr. Dario.</p>
                
                <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 text-left">
                    <p class="text-xs font-bold text-blue-500 uppercase mb-2">Próximos Passos:</p>
                    <ul class="text-sm text-blue-900 space-y-2">
                        <li class="flex gap-2">🧘 <span>Aguarde ser chamado pelo painel.</span></li>
                        <li class="flex gap-2">📱 <span>Mantenha o celular próximo.</span></li>
                    </ul>
                </div>
                
                <button onclick="location.reload()" class="mt-8 text-sm text-slate-400 underline hover:text-slate-600">Iniciar Novo Atendimento</button>
            </div>
            
            <div id="content-doc" class="hidden animate-slide-in">
                ${htmlMedico}
                <div class="p-4 bg-slate-50 border-t flex gap-2">
                    <button onclick="window.print()" class="flex-1 bg-slate-800 text-white py-3 rounded-lg font-bold shadow hover:bg-black transition">Imprimir PDF</button>
                    <button onclick="navigator.clipboard.writeText(document.getElementById('content-doc').innerText).then(()=>alert('Copiado!'))" class="flex-1 bg-white border py-3 rounded-lg font-bold shadow-sm hover:bg-slate-50">Copiar</button>
                </div>
            </div>
        `;
        chatContainer.appendChild(div);
        
        const t1 = div.querySelector('#tab-pat');
        const t2 = div.querySelector('#tab-doc');
        const c1 = div.querySelector('#content-pat');
        const c2 = div.querySelector('#content-doc');
        
        t2.onclick = () => { c1.classList.add('hidden'); c2.classList.remove('hidden'); t2.classList.add('text-blue-600','border-blue-600','bg-white','text-slate-400'); t1.classList.remove('text-blue-600','border-blue-600','bg-white'); t1.classList.add('text-slate-400'); };
        t1.onclick = () => { c2.classList.add('hidden'); c1.classList.remove('hidden'); t1.classList.add('text-blue-600','border-blue-600','bg-white'); t2.classList.remove('text-blue-600','border-blue-600','bg-white'); t2.classList.add('text-slate-400'); };
        
        UI.scrollToBottom();
    },

    addOttoBubble(text) { 
        const div = document.createElement('div');
        div.className = "flex gap-3 fade-in mb-4";
        div.innerHTML = `<div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-lg border border-blue-50 shadow-sm shrink-0">🤖</div><div class="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 text-sm text-slate-700 shadow-sm leading-relaxed max-w-[85%]">${text}</div>`;
        chatContainer.appendChild(div);
        this.scrollToBottom();
    },

    addUserBubble(text) { 
        const div = document.createElement('div');
        div.className = "flex gap-3 flex-row-reverse fade-in mb-4";
        div.innerHTML = `<div class="bg-blue-600 text-white py-2 px-4 rounded-2xl rounded-tr-none text-sm shadow-md max-w-[85%]">${text}</div>`;
        chatContainer.appendChild(div);
        this.scrollToBottom();
    },

    showLoading() {
        const div = document.createElement('div');
        div.id = "ui-loading";
        div.className = "flex gap-3 fade-in mb-4";
        div.innerHTML = `<div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">🤖</div><div class="bg-slate-50 p-3 rounded-2xl rounded-tl-none text-slate-400 text-xs flex items-center gap-1"><span class="animate-bounce">●</span><span class="animate-bounce delay-75">●</span><span class="animate-bounce delay-150">●</span></div>`;
        chatContainer.appendChild(div);
        this.scrollToBottom();
    },

    hideLoading() { const el = document.getElementById("ui-loading"); if(el) el.remove(); },
    
    scrollToBottom() { chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' }); },
    
    formatText(str) { return str ? str.replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase()) : ""; }
};