// MÓDULO UI v3 - Templates CDSS

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

    // Helpers de Seleção
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

    // TEMPLATES HTML (Componentes Reutilizáveis)
    templates: {
        consent: () => `
            <div class="space-y-3">
                <input id="inp-name" type="text" class="w-full p-3 border rounded-xl" placeholder="Seu Nome Completo">
                <button id="btn-next" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Aceitar e Iniciar</button>
            </div>`,
        
        demographics: () => `
            <div class="flex gap-2 mb-3">
                <input id="inp-age" type="number" class="flex-1 p-3 border rounded-xl" placeholder="Idade">
                <select id="inp-sex" class="flex-1 p-3 border rounded-xl bg-white"><option value="M">Masc</option><option value="F">Fem</option></select>
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
                html += `<button class="btn-reg p-4 border rounded-xl flex flex-col items-center gap-2 bg-white" data-val="${k}">
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

        // FORMULÁRIO COMPLEXO (Sliders e Selects)
        qualifiersForm: (queue) => {
            let html = '<div class="space-y-4 mb-4">';
            queue.forEach(q => {
                html += `<div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p class="text-xs font-bold text-blue-600 uppercase mb-2">${q.config.pergunta}</p>`;
                
                q.config.atributos.forEach(attr => {
                    const id = `qualif-${q.sintomaId}-${attr.id}`;
                    if(attr.tipo === "escala_0_10") {
                        html += `
                        <div class="mb-2">
                            <label class="text-xs text-slate-500">Intensidade (0 a 10)</label>
                            <input type="range" id="${id}" min="0" max="10" value="5" class="w-full accent-blue-600" oninput="this.nextElementSibling.value = this.value">
                            <output class="text-sm font-bold block text-center">5</output>
                        </div>`;
                    } else {
                        html += `
                        <div class="mb-2">
                            <select id="${id}" class="w-full p-2 text-sm border rounded bg-white">
                                <option value="" disabled selected>${attr.id}...</option>
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
                <button class="btn-binary w-full p-3 border border-slate-200 rounded-xl bg-white text-left text-sm text-slate-700 flex items-center gap-2 transition" data-id="${f.id}">
                    <span class="check-icon w-6 font-bold text-white"></span>
                    <span>${f.texto}</span>
                </button>`;
            });
            return html + `</div><button id="btn-next" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Concluir</button>${UI.backBtn()}`;
        }
    },

    backBtn: () => `<div class="mt-2 text-center"><button id="btn-back" class="text-xs text-slate-400 underline py-2">Voltar</button></div>`,
    
    // RELATÓRIO FINAL (DUAL VIEW)
    renderFinalReport(dados, hipoteses) {
        // ... (Mesma estrutura de Abas do prompt anterior, mas com o conteúdo abaixo atualizado) ...
        
        // CONTEÚDO MÉDICO (WRITER 3.0)
        let htmlMedico = `
        <div class="p-4 bg-white font-mono text-xs leading-relaxed">
            <div class="bg-slate-900 text-white p-2 rounded mb-3 flex justify-between">
                <span>${dados.nome}</span> <span>${dados.demografia.idade}a | ${dados.demografia.sexo}</span>
            </div>

            <div class="mb-3">
                <p class="font-bold text-slate-400">QUEIXA PRINCIPAL (QP)</p>
                <p>"${dados.qp_real}"</p>
            </div>

            <div class="mb-3">
                <p class="font-bold text-slate-400">HISTÓRIA DA DOENÇA ATUAL (HDA)</p>
                <ul class="list-disc pl-4 space-y-1">
        `;
        
        // Renderiza sintomas com seus qualificadores
            dados.detalhesSintomas.forEach(s => {
            let texto = `<strong>${UI.formatText(s)}</strong>`;
            const qualifs = dados.respostas_qualificadores[s];
            if(qualifs) {
                const detalhes = Object.entries(qualifs).map(([k,v]) => `${k}: ${v}`).join(", ");
                texto += ` (${detalhes})`;
            }
            htmlMedico += `<li>${texto}</li>`;
        });
        
        // Renderiza discriminadores positivos
        if(dados.respostas_discriminantes.length > 0) {
            htmlMedico += `<li>FATORES POSITIVOS: ${dados.respostas_discriminantes.join(", ")}</li>`;
        }
        
        htmlMedico += `</ul></div>`;
        
        if(dados.sinais_alarme.length > 0) {
            htmlMedico += `<div class="bg-red-50 border-l-4 border-red-500 p-2 mb-3 text-red-800 font-bold">ALERTA: ${dados.sinais_alarme.join(", ")}</div>`;
        }

        htmlMedico += `<div class="border-t pt-2 mt-2"><p class="font-bold text-slate-400 mb-2">SUPORTE À DECISÃO CLÍNICA (CDSS)</p>`;
        
        if(hipoteses.length === 0) {
            htmlMedico += `<p class="italic text-slate-400">Sem correlação algorítmica específica.</p>`;
        } else {
            hipoteses.forEach(h => {
                htmlMedico += `
                <div class="mb-3 bg-slate-50 p-2 rounded border border-slate-200">
                    <div class="flex justify-between font-bold text-slate-700">
                        <span>${h.doenca}</span> <span>${h.probabilidade}%</span>
                    </div>
                    <div class="text-[10px] text-slate-500 mb-1">Base: ${h.baseado_em.join(", ")}</div>
                    
                    <div class="mt-2 space-y-1">
                        ${h.condutas.map(c => {
                            if(c.includes("[Dx]")) return `<p class="text-blue-700">🔍 ${c.replace("[Dx]", "")}</p>`;
                            if(c.includes("[Tx]")) return `<p class="text-green-700">💊 ${c.replace("[Tx]", "")}</p>`;
                            if(c.includes("[ALERTA]")) return `<p class="text-red-600 font-bold">⚠️ ${c.replace("[ALERTA]", "")}</p>`;
                            return `<p class="text-slate-600">• ${c}</p>`;
                        }).join("")}
                    </div>
                </div>`;
            });
        }
        
        htmlMedico += `</div></div>`; // Fim médico
        
        // Renderiza Abas (Reutilize o código de abas do prompt anterior para htmlPaciente + htmlMedico)
        // ...
        
        // (Por brevidade, apenas chame a função de desenhar abas aqui, passando htmlMedico)
        UI.renderTabs(htmlMedico); 
    },
    
    renderTabs(htmlMedico) {
        // Função auxiliar para desenhar o container de abas
        const div = document.createElement('div');
        div.className = "mt-4 bg-white rounded-xl shadow border overflow-hidden";
        div.innerHTML = `
            <div class="flex border-b bg-slate-50">
                <button class="flex-1 py-3 font-bold text-blue-600 bg-white border-b-2 border-blue-600" id="tab-pat">👤 Paciente</button>
                <button class="flex-1 py-3 font-bold text-slate-400" id="tab-doc">⚕️ Médico</button>
            </div>
            <div id="content-pat" class="p-6 text-center">
                <div class="text-4xl mb-2">✅</div>
                <h3 class="font-bold text-slate-800">Pronto!</h3>
                <p class="text-sm text-slate-500 mb-4">Seus dados foram organizados.</p>
                <div class="bg-blue-50 p-3 rounded text-blue-800 text-sm">Aguarde ser chamado.</div>
            </div>
            <div id="content-doc" class="hidden">${htmlMedico}</div>
        `;
        chatContainer.appendChild(div);
        
        // Lógica simples de troca
        const t1 = div.querySelector('#tab-pat');
        const t2 = div.querySelector('#tab-doc');
        const c1 = div.querySelector('#content-pat');
        const c2 = div.querySelector('#content-doc');
        
        t2.onclick = () => { c1.classList.add('hidden'); c2.classList.remove('hidden'); t2.classList.add('text-blue-600','border-blue-600','bg-white'); t1.classList.remove('text-blue-600','border-blue-600','bg-white'); };
        t1.onclick = () => { c2.classList.add('hidden'); c1.classList.remove('hidden'); t1.classList.add('text-blue-600','border-blue-600','bg-white'); t2.classList.remove('text-blue-600','border-blue-600','bg-white'); };
        
        UI.scrollToBottom();
    },

    addOttoBubble(text) { /* ... Igual anterior ... */ 
        const div = document.createElement('div');
        div.className = "flex gap-3 fade-in mb-4";
        div.innerHTML = `<div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">🤖</div><div class="bg-white p-3 rounded-2xl rounded-tl-none border text-sm shadow-sm">${text}</div>`;
        chatContainer.appendChild(div);
        this.scrollToBottom();
    },
    addUserBubble(text) { /* ... Igual anterior ... */ 
        const div = document.createElement('div');
        div.className = "flex gap-3 flex-row-reverse fade-in mb-4";
        div.innerHTML = `<div class="bg-blue-600 text-white py-2 px-4 rounded-2xl rounded-tr-none text-sm shadow-sm">${text}</div>`;
        chatContainer.appendChild(div);
        this.scrollToBottom();
    },
    showLoading() { /* ... Igual anterior ... */ },
    hideLoading() { /* ... Igual anterior ... */ },
    scrollToBottom() { chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' }); },
    formatText(str) { return str.replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase()); }
};