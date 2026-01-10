// MÓDULO DE LÓGICA (CONTROLADOR)
// Orquestra o fluxo, conecta API, State e UI.

import { State } from './state.js';
import { API } from './api.js';
import { UI } from './ui.js';

let Heart = null; // Cache dos protocolos médicos

export const Logic = {
    // 1. Inicialização
    async init() {
        console.log("OTTO Logic Init...");
        UI.showLoading();
        
        // Carrega o "Coração" (JSON)
        Heart = await API.getProtocolos();
        
        UI.hideIntro();
        UI.hideLoading();

        if (!Heart) {
            UI.addOttoBubble("⚠️ Modo Offline (Cache). Funcionalidades limitadas.");
        }
        
        // Começa o fluxo
        this.nextStep();
    },

    // 2. Máquina de Estados (Roteador)
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
            case 8: this.flowInvestigate(); break; // Deep Research Logic
            case 9: this.flowTime(); break;
            case 10: this.flowRedFlags(); break;
            case 11: this.flowAnythingElse(); break;
            case 12: this.finishTriage(); break;
            default: console.warn("Fim do fluxo ou etapa inválida");
        }
    },

    // 3. Função Global de VOLTAR (A Mágica da Pilha)
    goBack() {
        const success = State.undo();
        if (success) {
            // Se conseguiu voltar o estado, descobrimos qual era a etapa e redesenhamos
            const step = State.get().etapa;
            // Hack: Decrementamos 1 no setEtapa pois o nextStep vai incrementar
            State.setEtapa(step - 1); 
            this.nextStep();
        } else {
            alert("Início da triagem. Não é possível voltar.");
        }
    },

    // --- FLUXOS ESPECÍFICOS ---

    flowConsent() {
        UI.addOttoBubble("Olá! Sou o assistente do Dr. Dario. Para começar, preciso do seu nome e consentimento.");
        UI.renderInput(`
            <div class="flex flex-col gap-3 bg-white p-1">
                <input type="text" id="inp-name" class="w-full p-3 border border-slate-300 rounded-xl outline-none focus:border-blue-500" placeholder="Nome Completo">
                <label class="flex items-center gap-2 p-2 bg-slate-50 rounded border cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" id="chk-consent" class="w-5 h-5 text-blue-600"> 
                    <span class="text-xs text-slate-600">Concordo com o processamento de dados para fins médicos.</span>
                </label>
                <button id="btn-next" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 transition">Confirmar</button>
            </div>
        `);
        
        document.getElementById('btn-next').onclick = () => {
            const name = document.getElementById('inp-name').value.trim();
            const check = document.getElementById('chk-consent').checked;
            
            if(name.length < 3 || !check) return alert("Por favor, preencha seu nome e aceite o termo.");
            
            State.update('nome', name);
            State.update('consentimento', true);
            UI.addUserBubble(`Sou ${name}, aceito os termos.`);
            this.nextStep();
        };
    },

    flowDemographics() {
        const nome = State.get().nome.split(" ")[0];
        UI.addOttoBubble(`Prazer, ${nome}. Qual sua idade e sexo biológico?`);
        UI.renderInput(`
            <div class="flex gap-2">
                <input type="number" id="inp-age" class="flex-1 p-3 border border-slate-300 rounded-xl outline-none focus:border-blue-500 text-lg" placeholder="Idade">
                <select id="inp-sex" class="flex-1 p-3 border border-slate-300 rounded-xl outline-none focus:border-blue-500 text-lg bg-white">
                    <option value="" disabled selected>Sexo</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                </select>
                <button id="btn-next" class="bg-blue-600 text-white px-5 rounded-xl font-bold shadow-md">➔</button>
            </div>
            ${this.getBackButtonHtml()} 
        `);

        document.getElementById('btn-next').onclick = () => {
            const age = document.getElementById('inp-age').value;
            const sex = document.getElementById('inp-sex').value;
            if(!age || !sex) return alert("Preencha idade e sexo.");
            
            State.update('demografia', { idade: age, sexo: sex });
            UI.addUserBubble(`${age} anos, ${sex}`);
            this.nextStep();
        };
        this.bindBackButton();
    },

    flowQP() {
        UI.addOttoBubble("Em poucas palavras, o que você está sentindo hoje?");
        UI.renderInput(`
            <div class="flex gap-2">
                <input id="inp-qp" type="text" class="flex-1 p-3 border border-slate-300 rounded-xl outline-none focus:border-blue-500 shadow-sm" placeholder="Ex: Dor de ouvido forte...">
                <button id="btn-next" class="bg-blue-600 text-white px-5 rounded-xl font-bold shadow-md">Enviar</button>
            </div>
            ${this.getBackButtonHtml()}
        `);
        
        document.getElementById('btn-next').onclick = async () => {
            const txt = document.getElementById('inp-qp').value;
            if(!txt) return;
            
            // Futuro slot para LLM aqui
            
            State.update('qp_real', txt);
            UI.addUserBubble(txt);
            this.nextStep();
        };
        this.bindBackButton();
    },

    flowGeneral() {
        UI.addOttoBubble("Você apresenta algum destes sintomas gerais?");
        const opts = Heart?.anamnese_geral?.sintomas_sistemicos || ["febre", "perda_peso"];
        
        let html = '<div class="flex flex-wrap gap-2 justify-center mb-2">';
        opts.forEach(s => html += `<button class="btn-toggle px-4 py-2 border border-slate-200 rounded-full text-sm text-slate-600 bg-white hover:bg-slate-50 transition" data-val="${s}">${UI.formatText(s)}</button>`);
        html += '</div><button id="btn-next" class="w-full bg-slate-800 text-white py-3 rounded-xl font-bold shadow-lg">Continuar</button>' + this.getBackButtonHtml();
        
        UI.renderInput(html);

        const selected = new Set();
        document.querySelectorAll('.btn-toggle').forEach(btn => {
            btn.onclick = () => {
                const val = btn.dataset.val;
                if(selected.has(val)) { 
                    selected.delete(val); 
                    btn.className = "btn-toggle px-4 py-2 border border-slate-200 rounded-full text-sm text-slate-600 bg-white hover:bg-slate-50 transition"; 
                } else { 
                    selected.add(val); 
                    btn.className = "btn-toggle px-4 py-2 bg-red-50 border-red-200 text-red-600 border rounded-full text-sm font-bold shadow-inner transition"; 
                }
            };
        });

        document.getElementById('btn-next').onclick = () => {
            State.update('sintomasGerais', Array.from(selected));
            this.nextStep();
        };
        this.bindBackButton();
    },

    flowDrillDownFever() {
        // Só pergunta se marcou febre antes
        const gerais = State.get().sintomasGerais;
        if (!gerais.includes('febre')) {
            this.nextStep(); // Pula
            return;
        }

        UI.addOttoBubble("Sobre a febre: você chegou a medir? Como ela é?");
        const opcoes = ["Não medi", "Baixa (< 38°C)", "Alta (> 38°C)", "Muito Alta (> 39.5°C)"];
        
        let html = '<div class="flex flex-wrap gap-2 justify-center">';
        opcoes.forEach(op => html += `<button class="btn-opt px-4 py-3 bg-white border border-red-100 text-red-700 rounded-xl font-medium hover:bg-red-50 transition shadow-sm" data-val="${op}">${op}</button>`);
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
        UI.addOttoBubble("Toque na região onde está o problema principal:");
        const domains = Object.keys(Heart.dominios);
        
        let html = '<div class="grid grid-cols-2 gap-2 mb-2">';
        domains.forEach(d => {
            const info = Heart.dominios[d];
            html += `<button class="btn-reg h-24 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 shadow-sm hover:shadow-md transition active:scale-95" data-val="${d}">
                <span class="text-3xl">${UI.getEmoji(d)}</span>
                <span class="text-xs font-bold uppercase text-slate-600 tracking-wide">${info.nome_exibicao}</span>
            </button>`;
        });
        html += '</div><button id="btn-next" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200">Avançar</button>' + this.getBackButtonHtml();
        UI.renderInput(html);

        const selected = new Set();
        document.querySelectorAll('.btn-reg').forEach(btn => {
            btn.onclick = () => {
                const val = btn.dataset.val;
                if(selected.has(val)) { 
                    selected.delete(val); 
                    btn.classList.remove('bg-blue-50', 'border-blue-500', 'ring-2', 'ring-blue-200'); 
                } else { 
                    selected.add(val); 
                    btn.classList.add('bg-blue-50', 'border-blue-500', 'ring-2', 'ring-blue-200'); 
                }
            };
        });

        document.getElementById('btn-next').onclick = () => {
            if(selected.size === 0) return alert("Por favor, selecione pelo menos uma região.");
            State.update('regioesAfetadas', Array.from(selected));
            UI.addUserBubble(Array.from(selected).map(UI.formatText).join(", "));
            this.nextStep();
        };
        this.bindBackButton();
    },

    flowSymptoms() {
        // Coleta sintomas das regiões escolhidas
        let list = [];
        const regs = State.get().regioesAfetadas;
        regs.forEach(r => list = list.concat(Heart.dominios[r].sintomas_gatilho || []));
        const unique = [...new Set(list)];

        UI.addOttoBubble("Selecione os detalhes do que você sente:");
        let html = '<div class="flex flex-wrap gap-2 justify-center mb-2">';
        unique.forEach(s => html += `<button class="btn-sym px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition" data-val="${s}">${UI.formatText(s)}</button>`);
        html += '</div><button id="btn-next" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg">Próximo</button>' + this.getBackButtonHtml();
        UI.renderInput(html);

        const selected = new Set();
        document.querySelectorAll('.btn-sym').forEach(btn => {
            btn.onclick = () => {
                const val = btn.dataset.val;
                if(selected.has(val)) { 
                    selected.delete(val); 
                    btn.className = "btn-sym px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition"; 
                } else { 
                    selected.add(val); 
                    btn.className = "btn-sym px-3 py-2 bg-blue-100 border-blue-300 text-blue-900 border rounded-lg text-sm font-bold shadow-sm transition"; 
                }
            };
        });

        document.getElementById('btn-next').onclick = () => {
            State.update('detalhesSintomas', Array.from(selected));
            this.nextStep();
        };
        this.bindBackButton();
    },

    flowInvestigate() {
        // Deep Research Logic: Drill Down Contextual
        const sintomas = State.get().detalhesSintomas;
        const investigacoes = Heart.fluxos_investigativos || {};
        
        let foundKey = null;
        // Prioridade de investigação
        if (sintomas.includes('tontura')) foundKey = 'tontura';
        else if (sintomas.includes('dor_de_garganta')) foundKey = 'dor_de_garganta';
        else if (sintomas.includes('nariz_entupido')) foundKey = 'nariz_entupido';
        else if (sintomas.includes('zumbido')) foundKey = 'zumbido';

        if (foundKey && investigacoes[foundKey]) {
            const data = investigacoes[foundKey];
            UI.addOttoBubble("🕵️ " + data.pergunta);
            
            let html = '<div class="flex flex-col gap-2">';
            data.opcoes.forEach(op => html += `<button class="btn-inv p-3 bg-white border border-slate-300 rounded-xl text-left text-sm text-slate-700 font-medium hover:bg-blue-50 hover:border-blue-300 active:bg-blue-100 transition shadow-sm" data-val="${op}">${op}</button>`);
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
            this.nextStep(); // Pula se não tiver o que investigar
        }
    },

    flowTime() {
        UI.addOttoBubble("Há quanto tempo isso está acontecendo?");
        UI.renderInput(`
            <div class="flex gap-2">
                <input id="inp-time" type="text" class="flex-1 p-3 border border-slate-300 rounded-xl outline-none focus:border-blue-500 shadow-sm" placeholder="Ex: Começou ontem...">
                <button id="btn-next" class="bg-blue-600 text-white px-6 rounded-xl font-bold shadow-md">OK</button>
            </div>
            ${this.getBackButtonHtml()}
        `);
        
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
        regs.forEach(r => {
            if(Heart.dominios[r].sinais_alarme) alarms = alarms.concat(Heart.dominios[r].sinais_alarme);
        });

        if(alarms.length === 0) { this.nextStep(); return; }

        UI.addOttoBubble("⚠️ Atenção: Você apresenta algum destes sinais de alerta?");
        let html = '<div class="flex flex-col gap-2 mb-2">';
        alarms.forEach(a => html += `<button class="btn-alarm p-3 border border-red-200 bg-red-50 rounded-lg text-red-800 text-left text-sm font-medium flex items-center gap-3 hover:bg-red-100 transition" data-val="${a.texto}"><span class="w-5 h-5 border-2 border-red-400 bg-white rounded flex items-center justify-center shrink-0"></span>${a.texto}</button>`);
        html += '</div><button id="btn-next" class="w-full bg-slate-800 text-white py-3 rounded-xl font-bold shadow-lg">Não / Continuar</button>' + this.getBackButtonHtml();
        UI.renderInput(html);

        document.querySelectorAll('.btn-alarm').forEach(btn => {
            btn.onclick = () => {
                State.addToList('sinaisAlarme', btn.dataset.val);
                UI.addUserBubble("Sim: " + btn.dataset.val);
                
                // Feedback visual de seleção
                btn.classList.add('ring-2', 'ring-red-500', 'bg-red-100');
                const check = btn.querySelector('span');
                check.innerHTML = '✓';
                check.classList.add('bg-red-500', 'border-red-500', 'text-white');
            };
        });

        document.getElementById('btn-next').onclick = () => this.nextStep();
        this.bindBackButton();
    },

    flowAnythingElse() {
        UI.addOttoBubble("Gostaria de acrescentar mais algum detalhe? (Remédios em uso, alergias, observações...)");
        UI.renderInput(`
            <div class="flex flex-col gap-2">
                <textarea id="inp-more" class="w-full p-3 border border-slate-300 rounded-xl outline-none focus:border-blue-500 h-24 text-sm shadow-inner" placeholder="Ex: Sou alérgico a dipirona..."></textarea>
                <div class="flex gap-2">
                    <button id="btn-skip" class="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold hover:bg-slate-200 transition">Não, encerrar</button>
                    <button id="btn-send" class="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold shadow-md hover:bg-green-700 transition">Adicionar e Finalizar</button>
                </div>
            </div>
            ${this.getBackButtonHtml()}
        `);

        document.getElementById('btn-send').onclick = () => {
            const txt = document.getElementById('inp-more').value;
            if(txt) { 
                State.update('algoMais', txt); 
                UI.addUserBubble("Obs: "+txt); 
                UI.addOttoBubble("Entendido.");
            }
            this.nextStep(); // Vai para o 12 (Finish)
        };
        
        document.getElementById('btn-skip').onclick = () => { 
            UI.addUserBubble("Não, obrigado."); 
            this.nextStep(); 
        };
        
        this.bindBackButton();
    },

    async finishTriage() {
        UI.addOttoBubble("Finalizando triagem e gerando relatórios... 📋");
        UI.renderInput('<div class="text-center text-xs text-slate-400 py-4 uppercase font-bold tracking-widest animate-pulse">Processando Dados</div>');
        
        UI.showLoading();
        
        // Pega os dados finais do State
        const dadosCompletos = State.get();
        
        // Manda pro cérebro (API)
        const resultado = await API.processarTriagem(dadosCompletos);
        
        UI.hideLoading();
        
        // Chama a nova UI de Abas (Dual View)
        UI.renderFinalReport(dadosCompletos, resultado.hipoteses);
    },

    // --- Helpers de Navegação ---
    getBackButtonHtml() {
        return `<div class="mt-3 text-center"><button id="btn-back-global" class="text-xs text-slate-400 underline hover:text-slate-600 py-2 px-4">Voltar Etapa</button></div>`;
    },
    
    bindBackButton() {
        const btn = document.getElementById('btn-back-global');
        if(btn) btn.onclick = () => this.goBack();
    }
};