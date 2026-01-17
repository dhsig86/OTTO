// MÓDULO UI v5.0 - HDA Profissional e CDSS Separado

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

    // --- TEMPLATES ---
    templates: {
        consent: () => `<div class="space-y-3"><input id="inp-name" type="text" class="w-full p-3 border rounded-xl" placeholder="Nome Completo"><button id="btn-next" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Iniciar Triagem</button></div>`,
        demographics: () => `<div class="flex gap-2 mb-3"><input id="inp-age" type="number" class="flex-1 p-3 border rounded-xl" placeholder="Idade"><select id="inp-sex" class="flex-1 p-3 border rounded-xl bg-white"><option value="M">Masc</option><option value="F">Fem</option></select></div><select id="inp-visit" class="w-full p-3 border rounded-xl bg-white mb-3"><option value="Primeira">Primeira vez</option><option value="Retorno">Retorno</option></select><button id="btn-next" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Continuar</button>`,
        textInput: (ph, twoBtns=false) => `<textarea id="inp-text" class="w-full p-3 border rounded-xl h-24 mb-3" placeholder="${ph}"></textarea>${twoBtns ? `<div class="flex gap-2"><button id="btn-skip" class="flex-1 py-3 bg-slate-100 rounded-xl">Pular</button><button id="btn-finish" class="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold">Finalizar</button></div>` : `<button id="btn-next" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Enviar</button>`}`,
        
        regions: (dominios) => {
            let html = '<div class="grid grid-cols-2 gap-2 mb-3">';
            Object.keys(dominios).forEach(k => html += `<button class="btn-reg p-4 border rounded-xl flex flex-col items-center gap-2 bg-white transition" data-val="${k}"><span class="text-2xl">📍</span><span class="font-bold text-sm uppercase text-slate-600">${dominios[k].nome_exibicao}</span></button>`);
            return html + `</div><div class="mt-2 text-center"><button id="btn-back" class="text-xs text-slate-400 underline py-2">Voltar</button></div>`;
        },
        multiSelect: (opts) => {
            let html = '<div class="max-h-60 overflow-y-auto mb-3">';
            opts.forEach(o => html += `<button class="btn-select px-4 py-3 border rounded-xl text-sm text-left w-full mb-2 bg-white text-slate-600" data-val="${o}">${UI.formatText(o)}</button>`);
            return html + `</div><button id="btn-next" class="w-full bg-slate-800 text-white py-3 rounded-xl font-bold">Confirmar</button>`;
        },
        qualifiersForm: (queue) => {
            let html = '<div class="space-y-4 mb-4">';
            queue.forEach(q => {
                html += `<div class="bg-slate-50 p-3 rounded-xl border border-slate-200"><p class="text-xs font-bold text-blue-600 uppercase mb-2">${q.config.pergunta}</p>`;
                q.config.atributos.forEach(attr => {
                    const id = `qualif-${q.sId}-${attr.id}`;
                    if(attr.tipo === "escala_0_10") {
                        html += `<div class="mb-2"><label class="text-xs text-slate-500">Intensidade (0-10)</label><div class="flex items-center gap-2"><input type="range" id="${id}" min="0" max="10" value="5" class="flex-1 accent-blue-600" oninput="this.nextElementSibling.value = this.value"><output class="text-sm font-bold w-6 text-center">5</output></div></div>`;
                    } else {
                        html += `<div class="mb-2"><select id="${id}" class="w-full p-2 text-sm border rounded bg-white"><option value="" disabled selected>Selecione...</option>${attr.opcoes.map(o => `<option value="${o}">${o}</option>`).join('')}</select></div>`;
                    }
                });
                html += `</div>`;
            });
            return html + `</div><button id="btn-next" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Salvar</button>`;
        },
        binaryQuestions: (factors) => {
            let html = '<div class="space-y-2 mb-4">';
            factors.forEach(f => html += `<button class="btn-binary w-full p-3 border border-slate-200 rounded-xl bg-white text-left text-sm text-slate-700 flex items-center gap-2 transition hover:bg-slate-50" data-id="${f.id}"><span class="check-icon w-6 h-6 flex items-center justify-center rounded-full border border-slate-300 font-bold text-xs"></span><span>${f.texto}</span></button>`);
            return html + `</div><button id="btn-next" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Concluir</button>`;
        }
    },

    bindSelectButtons(callback, isRed=false) {
        const selected = new Set();
        document.querySelectorAll('.btn-select').forEach(btn => {
            btn.onclick = () => {
                const val = btn.dataset.val;
                if(selected.has(val)) { selected.delete(val); btn.className = "btn-select px-4 py-3 border rounded-xl text-sm text-left w-full mb-2 bg-white text-slate-600"; }
                else { selected.add(val); btn.className = `btn-select px-4 py-3 border rounded-xl text-sm text-left w-full mb-2 font-bold ring-1 ${isRed ? 'bg-red-50 border-red-500 text-red-700 ring-red-500' : 'bg-blue-50 border-blue-500 text-blue-700 ring-blue-500'}`; }
                callback(Array.from(selected));
            };
        });
    },
    bindRegionButtons(callback) {
        const selected = new Set();
        document.querySelectorAll('.btn-reg').forEach(btn => {
            btn.onclick = () => {
                const val = btn.dataset.val;
                if(selected.has(val)) { selected.delete(val); btn.classList.remove('ring-2', 'ring-blue-400', 'bg-blue-50'); }
                else { selected.add(val); btn.classList.add('ring-2', 'ring-blue-400', 'bg-blue-50'); }
                callback(Array.from(selected));
            };
        });
    },

    // --- RELATÓRIO FINAL V5 (HDA + CDSS) ---
    renderFinalReport(dados, hipoteses) {
        const sintomas = dados.detalhesSintomas || [];
        const qualifs = dados.respostasQualificadores || {};
        const discriminantes = dados.respostasDiscriminantes || [];
        const listaHipoteses = hipoteses || [];

        // 1. GERAÇÃO DA HDA (Texto Corrido)
        let hda = `Paciente ${dados.demografia.sexo === 'M' ? 'masculino' : 'feminino'}, ${dados.demografia.idade} anos, em consulta de ${dados.demografia.tipo_visita}. \n`;
        hda += `Refere: **"${dados.qp_real}"**. \n\n`;
        
        if(sintomas.length > 0) {
            hda += `Ao interrogatório dirigido, confirma `;
            const partes = sintomas.map(s => {
                let txt = UI.formatText(s);
                if(qualifs[s]) {
                    const dets = Object.entries(qualifs[s]).map(([k,v]) => `${k}: ${v}`).join(", ");
                    if(dets) txt += ` (${dets})`;
                }
                return txt;
            });
            hda += partes.join(" e ") + ". ";
        }

        if(discriminantes.length > 0) {
            hda += `Relata fatores associados: ${discriminantes.map(d => UI.formatText(d)).join(", ")}. `;
        }

        if(dados.algoMais && dados.algoMais.length > 1) {
            hda += `\n\n**Observações:** ${dados.algoMais}.`;
        }

        if(dados.sintomasGerais.length > 0) hda += `\nSintomas sistêmicos: ${dados.sintomasGerais.join(", ")}.`;
        else hda += `\nNega sintomas sistêmicos.`;

        // 2. HTML DO RELATÓRIO
        let html = `
        <div class="p-5 bg-white font-sans text-sm text-slate-800">
            <div class="bg-slate-900 text-white p-3 rounded mb-4 flex justify-between items-center">
                <span class="font-bold uppercase tracking-wide">${dados.nome}</span>
                <span class="text-xs opacity-75">${new Date().toLocaleDateString()}</span>
            </div>

            <div class="mb-6">
                <h3 class="text-xs font-bold text-slate-400 uppercase mb-2">Anamnese (HDA)</h3>
                <div class="bg-slate-50 p-4 rounded border border-slate-200 whitespace-pre-wrap text-slate-700 leading-relaxed font-medium">${hda}</div>
                ${dados.sinaisAlarme && dados.sinaisAlarme.length > 0 ? `<div class="mt-2 bg-red-50 border-l-4 border-red-500 p-3 text-red-800 font-bold">🚨 ALERTA: ${dados.sinaisAlarme.join(", ")}</div>` : ''}
            </div>

            <div>
                <h3 class="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2"><span>⚡</span> Suporte à Decisão</h3>
        `;

        if(listaHipoteses.length === 0) {
            html += `<p class="text-slate-400 italic text-center p-4 bg-gray-50 rounded">Sem correlação algorítmica específica.</p>`;
        } else {
            listaHipoteses.forEach(h => {
                const condutas = h.condutas ? h.condutas.map(c => {
                    if(c.includes("[Dx]")) return `<li class="text-blue-700 mb-1 pl-2 border-l-2 border-blue-200"><span class="font-bold">Exame:</span> ${c.replace("[Dx]", "")}</li>`;
                    if(c.includes("[Tx]")) return `<li class="text-green-700 mb-1 pl-2 border-l-2 border-green-200"><span class="font-bold">Conduta:</span> ${c.replace("[Tx]", "")}</li>`;
                    if(c.includes("[ALERTA]")) return `<li class="text-red-600 font-bold mb-1 pl-2 border-l-2 border-red-500">⚠️ ${c.replace("[ALERTA]", "")}</li>`;
                    return `<li class="text-slate-600">• ${c}</li>`;
                }).join("") : "";

                html += `
                <div class="mb-4 border rounded shadow-sm bg-white overflow-hidden">
                    <div class="bg-slate-100 px-4 py-2 flex justify-between items-center border-b">
                        <span class="font-bold text-slate-800">${h.doenca}</span>
                        <div class="flex items-center gap-2"><span class="text-xs text-slate-500">Probabilidade:</span><span class="bg-white px-2 py-0.5 rounded border text-xs font-bold">${h.probabilidade}%</span></div>
                    </div>
                    <div class="p-4">
                        <p class="text-xs text-slate-400 mb-2 uppercase">Baseado em: ${h.baseado_em.join(", ")}</p>
                        <ul class="list-none text-xs space-y-1">${condutas}</ul>
                    </div>
                </div>`;
            });
        }
        html += `</div></div>`;

        UI.renderTabs(html);
    },

    renderTabs(htmlMedico) {
        const div = document.createElement('div');
        div.className = "mt-4 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden mb-20 fade-in";
        div.innerHTML = `
            <div class="flex border-b bg-slate-50">
                <button class="flex-1 py-4 font-bold text-blue-600 bg-white border-b-2 border-blue-600 transition" id="tab-pat">👤 Para Você</button>
                <button class="flex-1 py-4 font-bold text-slate-400 hover:text-slate-600 transition" id="tab-doc">⚕️ Médico</button>
            </div>
            <div id="content-pat" class="p-8 text-center animate-slide-in">
                <div class="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">✓</div>
                <h3 class="text-xl font-bold text-slate-800 mb-2">Triagem Concluída!</h3>
                <p class="text-slate-500 mb-6">Aguarde ser chamado pelo painel.</p>
                <button onclick="location.reload()" class="mt-4 text-sm text-slate-400 underline">Novo Atendimento</button>
            </div>
            <div id="content-doc" class="hidden animate-slide-in bg-slate-100">
                ${htmlMedico}
                <div class="p-4 bg-white border-t flex gap-2 sticky bottom-0">
                    <button onclick="window.print()" class="flex-1 bg-slate-800 text-white py-3 rounded font-bold shadow">Imprimir</button>
                    <button onclick="UI.copyToClipboard()" class="flex-1 bg-white border py-3 rounded font-bold text-slate-700">Copiar HDA</button>
                </div>
            </div>
        `;
        chatContainer.appendChild(div);
        
        const t1 = div.querySelector('#tab-pat'), t2 = div.querySelector('#tab-doc');
        const c1 = div.querySelector('#content-pat'), c2 = div.querySelector('#content-doc');
        
        t2.onclick = () => { c1.classList.add('hidden'); c2.classList.remove('hidden'); t2.classList.replace('text-slate-400', 'text-blue-600'); t2.classList.add('border-blue-600', 'bg-white'); t1.classList.replace('text-blue-600', 'text-slate-400'); t1.classList.remove('border-blue-600', 'bg-white'); };
        t1.onclick = () => { c2.classList.add('hidden'); c1.classList.remove('hidden'); t1.classList.replace('text-slate-400', 'text-blue-600'); t1.classList.add('border-blue-600', 'bg-white'); t2.classList.replace('text-blue-600', 'text-slate-400'); t2.classList.remove('border-blue-600', 'bg-white'); };
        
        UI.scrollToBottom();
    },

    copyToClipboard() {
        const text = document.querySelector('#content-doc .bg-slate-50.whitespace-pre-wrap')?.innerText || "";
        navigator.clipboard.writeText(text).then(() => alert("HDA copiada!"));
    },

    addOttoBubble(text) { 
        const div = document.createElement('div'); div.className = "flex gap-3 fade-in mb-4";
        div.innerHTML = `<div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-lg shadow-sm shrink-0">🤖</div><div class="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 text-sm text-slate-700 shadow-sm max-w-[85%]">${text}</div>`;
        chatContainer.appendChild(div); this.scrollToBottom();
    },
    addUserBubble(text) { 
        const div = document.createElement('div'); div.className = "flex gap-3 flex-row-reverse fade-in mb-4";
        div.innerHTML = `<div class="bg-blue-600 text-white py-2 px-4 rounded-2xl rounded-tr-none text-sm shadow-md max-w-[85%]">${text}</div>`;
        chatContainer.appendChild(div); this.scrollToBottom();
    },
    showLoading() {
        const div = document.createElement('div'); div.id = "ui-loading"; div.className = "flex gap-3 fade-in mb-4";
        div.innerHTML = `<div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">🤖</div><div class="bg-slate-50 p-3 rounded-2xl rounded-tl-none text-slate-400 text-xs flex items-center gap-1"><span class="animate-bounce">●</span><span class="animate-bounce delay-75">●</span><span class="animate-bounce delay-150">●</span></div>`;
        chatContainer.appendChild(div); this.scrollToBottom();
    },
    hideLoading() { const el = document.getElementById("ui-loading"); if(el) el.remove(); },
    scrollToBottom() { chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' }); },
    formatText(str) { return str ? str.replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase()) : ""; }
};