// MÓDULO DE LÓGICA (CONTROLADOR) v2
// Fix: Case Sensitivity no Drill Down e Logs de Debug

import { State } from './state.js';
import { API } from './api.js';
import { UI } from './ui.js';

let Heart = null; 

export const Logic = {
    async init() {
        console.log("OTTO Logic Init...");
        UI.showLoading();
        Heart = await API.getProtocolos();
        UI.hideIntro();
        UI.hideLoading();

        if (!Heart) UI.addOttoBubble("⚠️ Modo Offline (Cache).");
        this.nextStep();
    },

    nextStep() {
        const currentStep = State.getEtapa();
        const nextStep = currentStep + 1;
        State.setEtapa(nextStep);

        console.log(`Navegando para etapa: ${nextStep}`);

        switch (nextStep) {
            case 1: this.flowConsent(); break;
            case 2: this.flowDemographics(); break;
            case 3: this.flowQP(); break;
            case 4: this.flowGeneral(); break;
            case 5: this.flowDrillDownFever(); break;
            case 6: this.flowRegions(); break;
            case 7: this.flowSymptoms(); break;
            case 8: this.flowInvestigate(); break; // O PULO DO GATO ESTÁ AQUI
            case 9: this.flowTime(); break;
            case 10: this.flowRedFlags(); break;
            case 11: this.flowAnythingElse(); break;
            case 12: this.finishTriage(); break;
            default: console.warn("Fim do fluxo");
        }
    },

    goBack() {
        if (State.undo()) {
            const step = State.get().etapa;
            State.setEtapa(step - 1); 
            this.nextStep();
        } else {
            alert("Início da triagem.");
        }
    },

    // --- FLUXOS ---

    flowConsent() {
        UI.addOttoBubble("Olá! Sou o assistente do Dr. Dario. Para começar, preciso do seu nome e consentimento.");
        UI.renderInput(`
            <div class="flex flex-col gap-3 bg-white p-1">
                <input type="text" id="inp-name" class="w-full p-3 border border-slate-300 rounded-xl outline-none focus:border-blue-500" placeholder="Nome Completo">
                <label class="flex items-center gap-2 p-2 bg-slate-50 rounded border cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" id="chk-consent" class="w-5 h-5 text-blue-600"> 
                    <span class="text-xs text-slate-600">Concordo com o processamento de dados.</span>
                </label>
                <button id="btn-next" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-md">Confirmar</button>
            </div>
        `);
        
        document.getElementById('btn-next').onclick = () => {
            const name = document.getElementById('inp-name').value.trim();
            const check = document.getElementById('chk-consent').checked;
            if(name.length < 3 || !check) return alert("Preencha nome e aceite.");
            State.update('nome', name);
            State.update('consentimento', true);
            UI.addUserBubble(`Sou ${name}, aceito.`);
            this.nextStep();
        };
    },

    flowDemographics() {
        const nome = State.get().nome.split(" ")[0];
        UI.addOttoBubble(`Prazer, ${nome}. Qual sua idade e sexo?`);
        UI.renderInput(`
            <div class="flex gap-2">
                <input type="number" id="inp-age" class="flex-1 p-3 border border-slate-300 rounded-xl outline-none text-lg" placeholder="Idade">
                <select id="inp-sex" class="flex-1 p-3 border border-slate-300 rounded-xl outline-none text-lg bg-white">
                    <option value="" disabled selected>Sexo</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                </select>
                <button id="btn-next" class="bg-blue-600 text-white px-5 rounded-xl font-bold">➔</button>
            </div>
            ${this.getBackButtonHtml()} 
        `);
        document.getElementById('btn-next').onclick = () => {
            const age = document.getElementById('inp-age').value;
            const sex = document.getElementById('inp-sex').value;
            if(!age || !sex) return alert("Preencha tudo.");
            State.update('demografia', { idade: age, sexo: sex });
            UI.addUserBubble(`${age} anos, ${sex}`);
            this.nextStep();
        };
        this.bindBackButton();
    },

    flowQP() {
        UI.addOttoBubble("Em poucas palavras, o que você sente?");
        UI.renderInput(`
            <div class="flex gap-2">
                <input id="inp-qp" type="text" class="flex-1 p-3 border border-slate-300 rounded-xl outline-none" placeholder="Ex: Tontura forte...">
                <button id="btn-next" class="bg-blue-600 text-white px-5 rounded-xl font-bold">OK</button>
            </div>
            ${this.getBackButtonHtml()}
        `);
        document.getElementById('btn-next').onclick = () => {
            const txt = document.getElementById('inp-qp').value;
            if(!txt) return;
            State.update('qp_real', txt);
            UI.addUserBubble(txt);
            this.nextStep();
        };
        this.bindBackButton();
    },

    flowGeneral() {
        UI.addOttoBubble("Sente algo no corpo todo?");
        const opts = Heart?.anamnese_geral?.sintomas_sistemicos || [];
        let html = '<div class="flex flex-wrap gap-2 justify-center mb-2">';
        opts.forEach(s => html += `<button class="btn-toggle px-4 py-2 border rounded-full text-sm text-slate-600 bg-white" data-val="${s}">${UI.formatText(s)}</button>`);
        html += '</div><button id="btn-next" class="w-full bg-slate-800 text-white py-3 rounded-xl font-bold">Continuar</button>' + this.getBackButtonHtml();
        UI.renderInput(html);

        const selected = new Set();
        document.querySelectorAll('.btn-toggle').forEach(btn => {
            btn.onclick = () => {
                const val = btn.dataset.val;
                if(selected.has(val)) { selected.delete(val); btn.className = "btn-toggle px-4 py-2 border rounded-full text-sm text-slate-600 bg-white"; } 
                else { selected.add(val); btn.className = "btn-toggle px-4 py-2 bg-red-50 border-red-200 text-red-600 border rounded-full text-sm font-bold"; }
            };
        });
        document.getElementById('btn-next').onclick = () => {
            State.update('sintomasGerais', Array.from(selected));
            this.nextStep();
        };
        this.bindBackButton();
    },

    flowDrillDownFever() {
        const gerais = State.get().sintomasGerais;
        if (!gerais.includes('febre')) { this.nextStep(); return; }

        UI.addOttoBubble("Você mediu a febre?");
        const opcoes = ["Não medi", "Baixa (< 38°C)", "Alta (> 38°C)", "Muito Alta (> 39.5°C)"];
        let html = '<div class="flex flex-wrap gap-2 justify-center">';
        opcoes.forEach(op => html += `<button class="btn-opt px-4 py-3 bg-white border border-red-100 text-red-700 rounded-xl font-medium" data-val="${op}">${op}</button>`);
        html += '</div>' + this.getBackButtonHtml();
        UI.renderInput(html);

        document.querySelectorAll('.btn-opt').forEach(btn => {
            btn.onclick = () => {
                State.update('detalhesFebre', btn.dataset.val);
                UI.addUserBubble(btn.dataset.val);
                this.nextStep();
            };
        });
        this.bindBackButton();
    },

    flowRegions() {
        UI.addOttoBubble("Onde está o problema?");
        const domains = Object.keys(Heart.dominios);
        let html = '<div class="grid grid-cols-2 gap-2 mb-2">';
        domains.forEach(d => {
            const info = Heart.dominios[d];
            html += `<button class="btn-reg h-24 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95" data-val="${d}"><span class="text-3xl">${UI.getEmoji(d)}</span><span class="text-xs font-bold uppercase text-slate-600">${info.nome_exibicao}</span></button>`;
        });
        html += '</div><button id="btn-next" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Avançar</button>' + this.getBackButtonHtml();
        UI.renderInput(html);

        const selected = new Set();
        document.querySelectorAll('.btn-reg').forEach(btn => {
            btn.onclick = () => {
                const val = btn.dataset.val;
                if(selected.has(val)) { selected.delete(val); btn.classList.remove('bg-blue-50', 'border-blue-500', 'ring-2', 'ring-blue-200'); } 
                else { selected.add(val); btn.classList.add('bg-blue-50', 'border-blue-500', 'ring-2', 'ring-blue-200'); }
            };
        });
        document.getElementById('btn-next').onclick = () => {
            if(selected.size === 0) return alert("Selecione uma região.");
            State.update('regioesAfetadas', Array.from(selected));
            UI.addUserBubble(Array.from(selected).map(UI.formatText).join(", "));
            this.nextStep();
        };
        this.bindBackButton();
    },

    flowSymptoms() {
        let list = [];
        const regs = State.get().regioesAfetadas;
        regs.forEach(r => list = list.concat(Heart.dominios[r].sintomas_gatilho || []));
        const unique = [...new Set(list)];

        UI.addOttoBubble("Selecione os detalhes:");
        let html = '<div class="flex flex-wrap gap-2 justify-center mb-2">';
        unique.forEach(s => html += `<button class="btn-sym px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700" data-val="${s}">${UI.formatText(s)}</button>`);
        html += '</div><button id="btn-next" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg">Próximo</button>' + this.getBackButtonHtml();
        UI.renderInput(html);

        const selected = new Set();
        document.querySelectorAll('.btn-sym').forEach(btn => {
            btn.onclick = () => {
                const val = btn.dataset.val;
                if(selected.has(val)) { selected.delete(val); btn.className = "btn-sym px-3 py-2 bg-slate-50 border rounded-lg text-sm text-slate-700"; } 
                else { selected.add(val); btn.className = "btn-sym px-3 py-2 bg-blue-100 border-blue-300 text-blue-900 border rounded-lg text-sm font-bold shadow-sm"; }
            };
        });
        document.getElementById('btn-next').onclick = () => {
            State.update('detalhesSintomas', Array.from(selected));
            this.nextStep();
        };
        this.bindBackButton();
    },

    // --- CORREÇÃO CRÍTICA AQUI ---
    flowInvestigate() {
        const sintomasRaw = State.get().detalhesSintomas;
        // Normaliza para minúsculo para garantir o match
        const sintomas = sintomasRaw.map(s => s.toLowerCase());
        const investigacoes = Heart.fluxos_investigativos || {};
        
        console.log("Investigando sintomas:", sintomas); // Debug

        let foundKey = null;
        if (sintomas.includes('tontura')) foundKey = 'tontura';
        else if (sintomas.includes('dor_de_garganta')) foundKey = 'dor_de_garganta';
        else if (sintomas.includes('nariz_entupido')) foundKey = 'nariz_entupido';
        else if (sintomas.includes('zumbido')) foundKey = 'zumbido';

        if (foundKey && investigacoes[foundKey]) {
            console.log("Gatilho acionado:", foundKey); // Debug
            const data = investigacoes[foundKey];
            UI.addOttoBubble("🕵️ " + data.pergunta);
            
            let html = '<div class="flex flex-col gap-2">';
            data.opcoes.forEach(op => html += `<button class="btn-inv p-3 bg-white border border-slate-300 rounded-xl text-left text-sm text-slate-700 font-medium hover:bg-blue-50 transition" data-val="${op}">${op}</button>`);
            html += '</div>' + this.getBackButtonHtml();
            UI.renderInput(html);

            document.querySelectorAll('.btn-inv').forEach(btn => {
                btn.onclick = () => {
                    State.addToList('respostasInvestigativas', btn.dataset.val);
                    UI.addUserBubble(btn.dataset.val);
                    this.nextStep();
                };
            });
            this.bindBackButton();
        } else {
            console.log("Nenhum gatilho investigativo encontrado.");
            this.nextStep(); 
        }
    },

    flowTime() {
        UI.addOttoBubble("Há quanto tempo?");
        UI.renderInput(`<div class="flex gap-2"><input id="inp-time" type="text" class="flex-1 p-3 border rounded-xl" placeholder="Ex: 2 dias..."><button id="btn-next" class="bg-blue-600 text-white px-4 rounded-xl font-bold">OK</button></div>` + this.getBackButtonHtml());
        document.getElementById('btn-next').onclick = () => {
            const val = document.getElementById('inp-time').value;
            if(!val) return;
            State.update('tempoEvolucao', val);
            UI.addUserBubble(val);
            this.nextStep();
        };
        this.bindBackButton();
    },

    flowRedFlags() {
        let alarms = [];
        const regs = State.get().regioesAfetadas;
        regs.forEach(r => { if(Heart.dominios[r].sinais_alarme) alarms = alarms.concat(Heart.dominios[r].sinais_alarme); });

        if(alarms.length === 0) { this.nextStep(); return; }

        UI.addOttoBubble("⚠️ Você tem algum destes sinais de alerta?");
        let html = '<div class="flex flex-col gap-2 mb-2">';
        alarms.forEach(a => html += `<button class="btn-alarm p-3 border border-red-200 bg-red-50 rounded-lg text-red-800 text-left text-sm font-medium flex items-center gap-3" data-val="${a.texto}"><span class="w-5 h-5 border-2 border-red-400 bg-white rounded flex items-center justify-center shrink-0"></span>${a.texto}</button>`);
        html += '</div><button id="btn-next" class="w-full bg-slate-800 text-white py-3 rounded-xl font-bold">Não / Continuar</button>' + this.getBackButtonHtml();
        UI.renderInput(html);

        document.querySelectorAll('.btn-alarm').forEach(btn => {
            btn.onclick = () => {
                State.addToList('sinaisAlarme', btn.dataset.val);
                UI.addUserBubble("Sim: " + btn.dataset.val);
                btn.classList.add('ring-2', 'ring-red-500', 'bg-red-100');
                btn.querySelector('span').innerHTML = '✓';
            };
        });
        document.getElementById('btn-next').onclick = () => this.nextStep();
        this.bindBackButton();
    },

    flowAnythingElse() {
        UI.addOttoBubble("Algo mais? (Remédios, alergias...)");
        UI.renderInput(`
            <div class="flex flex-col gap-2">
                <textarea id="inp-more" class="w-full p-3 border rounded-xl h-24 text-sm" placeholder="Ex: Alérgico a penicilina..."></textarea>
                <div class="flex gap-2">
                    <button id="btn-skip" class="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold">Não</button>
                    <button id="btn-send" class="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold">Finalizar</button>
                </div>
            </div>
            ${this.getBackButtonHtml()}
        `);
        document.getElementById('btn-send').onclick = () => {
            const txt = document.getElementById('inp-more').value;
            if(txt) { State.update('algoMais', txt); UI.addUserBubble("Obs: "+txt); }
            this.nextStep();
        };
        document.getElementById('btn-skip').onclick = () => { UI.addUserBubble("Não."); this.nextStep(); };
        this.bindBackButton();
    },

    async finishTriage() {
        UI.addOttoBubble("Gerando relatório... 📋");
        UI.renderInput('<div class="text-center text-xs text-slate-400 py-4 uppercase font-bold tracking-widest animate-pulse">Processando</div>');
        UI.showLoading();
        
        const d = State.get();
        // Payload Seguro
        const payload = {
            idade: parseInt(d.demografia.idade) || 0,
            sexo: d.demografia.sexo || "Indefinido",
            sintomas_gerais: d.sintomasGerais || [],
            detalhes_febre: d.detalhesFebre || null,
            regioes: d.regioesAfetadas || [],
            sinais_alarme: d.sinaisAlarme || [],
            sintomas_especificos: d.detalhesSintomas || [],
            respostas_investigativas: d.respostasInvestigativas || []
        };

        try {
            const resultado = await API.processarTriagem(payload);
            UI.hideLoading();
            const hipoteses = resultado && resultado.hipoteses ? resultado.hipoteses : [];
            UI.renderFinalReport(d, hipoteses);
        } catch (error) {
            console.error("Erro fatal:", error);
            UI.hideLoading();
            UI.renderFinalReport(d, []);
        }
    },

    getBackButtonHtml() { return `<div class="mt-3 text-center"><button id="btn-back-global" class="text-xs text-slate-400 underline hover:text-slate-600 py-2 px-4">Voltar Etapa</button></div>`; },
    bindBackButton() { const btn = document.getElementById('btn-back-global'); if(btn) btn.onclick = () => this.goBack(); }
};