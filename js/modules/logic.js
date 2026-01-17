// MÓDULO DE LÓGICA (INTERVIEWER + LOCAL BRAIN) v3.1
// Inclui motor de cálculo offline

import { State } from './state.js';
import { API } from './api.js';
import { UI } from './ui.js';

let Heart = null; 

export const Logic = {
    async init() {
        console.log("OTTO Init...");
        UI.showLoading();
        Heart = await API.getProtocolos();
        UI.hideIntro();
        UI.hideLoading();
        if (!Heart) UI.addOttoBubble("⚠️ Modo Offline.");
        this.nextStep();
    },

    nextStep() {
        const step = State.getEtapa() + 1;
        State.setEtapa(step);
        console.log(`>> Etapa: ${step}`);

        switch (step) {
            case 1: this.flowConsent(); break;
            case 2: this.flowDemographics(); break;
            case 3: this.flowQP(); break;
            case 4: this.flowGeneral(); break;
            case 5: this.flowRegions(); break;
            case 6: this.flowSymptoms(); break;
            case 7: this.flowQualifiers(); break;
            case 8: this.flowDiscriminators(); break;
            case 9: this.flowRedFlags(); break;
            case 10: this.flowAnythingElse(); break;
            case 11: this.finishTriage(); break;
            default: console.warn("Fim");
        }
    },

    goBack() {
        if (State.undo()) {
            State.setEtapa(State.getEtapa() - 1);
            const step = State.getEtapa() + 1;
            State.setEtapa(step - 1); 
            this.nextStep();
        } else alert("Início.");
    },

    // --- FLUXOS (Mantidos iguais, resumidos aqui) ---
    
    flowConsent() {
        UI.addOttoBubble("Olá! Sou o assistente do Dr. Dario.");
        UI.renderInput(UI.templates.consent());
        UI.bind('btn-next', () => {
            const nome = document.getElementById('inp-name').value;
            if(nome.length < 3) return alert("Nome necessário.");
            State.update('nome', nome);
            this.nextStep();
        });
    },

    flowDemographics() {
        UI.addOttoBubble("Confirme seus dados:");
        UI.renderInput(UI.templates.demographics());
        UI.bind('btn-next', () => {
            State.update('demografia', {
                idade: document.getElementById('inp-age').value,
                sexo: document.getElementById('inp-sex').value,
                tipo_visita: document.getElementById('inp-visit').value
            });
            this.nextStep();
        });
        this.bindBack();
    },

    flowQP() {
        UI.addOttoBubble("Motivo da visita?");
        UI.renderInput(UI.templates.textInput("Ex: Dor de ouvido...", false));
        UI.bind('btn-next', () => {
            const txt = document.getElementById('inp-text').value;
            if(txt) State.update('qp_real', txt);
            this.nextStep();
        });
        this.bindBack();
    },

    flowGeneral() {
        UI.addOttoBubble("Sintomas gerais?");
        const opts = Heart?.anamnese_geral?.sintomas_sistemicos || [];
        UI.renderInput(UI.templates.multiSelect(opts));
        UI.bindSelectButtons((s) => State.update('sintomasGerais', s));
        UI.bind('btn-next', () => this.nextStep());
        this.bindBack();
    },

    flowRegions() {
        UI.addOttoBubble("Região principal:");
        UI.renderInput(UI.templates.regions(Heart.dominios));
        UI.bindRegionButtons((s) => {
            if(s.length===0) return alert("Selecione uma região.");
            State.update('regioesAfetadas', s);
            this.nextStep();
        });
        this.bindBack();
    },

    flowSymptoms() {
        let opts = [];
        State.get().regioesAfetadas.forEach(r => {
            if(Heart.dominios[r]) opts = opts.concat(Heart.dominios[r].sintomas_gatilho);
        });
        UI.addOttoBubble("O que você sente?");
        UI.renderInput(UI.templates.multiSelect([...new Set(opts)]));
        UI.bindSelectButtons((s) => State.update('detalhesSintomas', s));
        UI.bind('btn-next', () => this.nextStep());
        this.bindBack();
    },

    flowQualifiers() {
        const sintomas = State.get().detalhesSintomas;
        const regioes = State.get().regioesAfetadas;
        let queue = [];

        regioes.forEach(r => {
            const dom = Heart.dominios[r];
            if(!dom.qualificadores) return;
            sintomas.forEach(s => {
                if(dom.qualificadores[s]) queue.push({ sId: s, cfg: dom.qualificadores[s] });
            });
        });

        if (queue.length === 0) { this.nextStep(); return; }

        UI.addOttoBubble("Detalhes específicos:");
        UI.renderInput(UI.templates.qualifiersForm(queue)); // Adapte templates.qualifiersForm para usar sId/cfg
        
        UI.bind('btn-next', () => {
            queue.forEach(q => {
                q.cfg.atributos.forEach(attr => {
                    const el = document.getElementById(`qualif-${q.sId}-${attr.id}`);
                    if(el) State.setQualificador(q.sId, attr.id, el.value);
                });
            });
            this.nextStep();
        });
        this.bindBack();
    },

    flowDiscriminators() {
        const regioes = State.get().regioesAfetadas;
        let factors = [];
        regioes.forEach(r => {
            if(Heart.dominios[r].fatores_discriminantes) factors = factors.concat(Heart.dominios[r].fatores_discriminantes);
        });

        if(factors.length === 0) { this.nextStep(); return; }

        UI.addOttoBubble("Responda Sim ou Não:");
        UI.renderInput(UI.templates.binaryQuestions(factors));
        
        const answers = new Set();
        document.querySelectorAll('.btn-binary').forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                if(answers.has(id)) {
                    answers.delete(id);
                    btn.classList.remove('bg-blue-600', 'text-white');
                    btn.classList.add('bg-white', 'text-slate-700');
                    btn.querySelector('.check-icon').textContent = '';
                } else {
                    answers.add(id);
                    btn.classList.add('bg-blue-600', 'text-white');
                    btn.classList.remove('bg-white', 'text-slate-700');
                    btn.querySelector('.check-icon').textContent = '✓ ';
                }
            }
        });

        UI.bind('btn-next', () => {
            State.update('respostasDiscriminantes', Array.from(answers));
            this.nextStep();
        });
        this.bindBack();
    },

    flowRedFlags() {
        let alarms = [];
        State.get().regioesAfetadas.forEach(r => {
            if(Heart.dominios[r].sinais_alarme) alarms = alarms.concat(Heart.dominios[r].sinais_alarme);
        });
        if(alarms.length === 0) { this.nextStep(); return; }

        UI.addOttoBubble("Algum sinal de alerta?");
        UI.renderInput(UI.templates.multiSelect(alarms.map(a=>a.id), alarms));
        UI.bindSelectButtons((s) => State.update('sinaisAlarme', s), true);
        UI.bind('btn-next', () => this.nextStep());
        this.bindBack();
    },

    flowAnythingElse() {
        UI.addOttoBubble("Algo mais?");
        UI.renderInput(UI.templates.textInput("Obs...", true));
        UI.bind('btn-finish', () => {
            const txt = document.getElementById('inp-text').value;
            if(txt) State.update('algoMais', txt);
            this.nextStep();
        });
        UI.bind('btn-skip', () => this.nextStep());
        this.bindBack();
    },

    async finishTriage() {
        UI.addOttoBubble("Processando dados... 🧠");
        UI.showLoading();
        const d = State.get();
        
        // Prepara Payload
        const payload = {
            idade: d.demografia.idade,
            sintomas_especificos: d.detalhesSintomas,
            respostas_qualificadores: d.respostasQualificadores,
            respostas_discriminantes: d.respostasDiscriminantes,
            regioes: d.regioesAfetadas,
            sintomas_gerais: d.sintomasGerais,
            sinais_alarme: d.sinaisAlarme
        };

        try {
            // Tenta API Python
            const res = await API.processarTriagem(payload);
            UI.hideLoading();
            UI.renderFinalReport(d, res.hipoteses || []);
        } catch (e) {
            console.warn("API Offline. Usando Motor Local.", e);
            
            // --- MOTOR LOCAL (FALLBACK) ---
            // Executa a lógica do Python direto no navegador
            const hipotesesLocais = this.runLocalBrain(d);
            
            UI.hideLoading();
            UI.addOttoBubble("Modo Offline Ativado. Análise local concluída.");
            UI.renderFinalReport(d, hipotesesLocais);
        }
    },

    // --- CÉREBRO LOCAL (Réplica do Logic Python) ---
    runLocalBrain(dados) {
        let hipoteses = [];
        const sintomasUser = new Set(dados.detalhesSintomas);
        const discrimUser = new Set(dados.respostasDiscriminantes);

        dados.regioesAfetadas.forEach(regiao => {
            const dominio = Heart.dominios[regiao];
            if(!dominio) return;

            dominio.patologias.forEach(doenca => {
                let matches = 0;
                let evidencias = [];
                let score = 0;

                // 1. Sintomas Chave
                doenca.sinais_chave.forEach(sinal => {
                    // Lógica de Qualificador (Ex: "coriza:Amarela")
                    if(sinal.includes(":")) {
                        const [key, val] = sinal.split(":");
                        // Verifica se o usuário respondeu esse qualificador com esse valor
                        const resposta = dados.respostasQualificadores[key];
                        if(resposta) {
                            // resposta é um objeto {cor: "Amarela", ...}
                            // Verifica se algum valor bate
                            if(Object.values(resposta).includes(val)) {
                                matches += 1.5;
                                evidencias.append(`${key} (${val})`);
                            }
                        }
                    } else {
                        // Sintoma simples
                        if(sintomasUser.has(sinal)) {
                            matches += 1.0;
                            evidencias.push(sinal);
                        }
                    }
                });

                if(matches === 0) return; // Pula se nada bater

                score = (matches / doenca.sinais_chave.length) * 50;

                // 2. Discriminantes (Pesos)
                if(doenca.fatores_peso) {
                    Object.entries(doenca.fatores_peso).forEach(([fator, peso]) => {
                        if(discrimUser.has(fator)) {
                            score *= peso;
                            evidencias.push(`Fator: ${fator}`);
                        }
                    });
                }

                // 3. Negativos Pertinentes
                if(doenca.negativos_pertinentes) {
                    doenca.negativos_pertinentes.forEach(neg => {
                        const sNeg = neg.replace("sem_", "");
                        if(!sintomasUser.has(sNeg) && !dados.sintomasGerais.includes(sNeg)) {
                            score += 5;
                        }
                    });
                }

                let prob = Math.min(Math.round(score), 99);
                
                if(prob > 20) {
                    hipoteses.push({
                        doenca: doenca.nome,
                        probabilidade: prob,
                        baseado_em: evidencias,
                        condutas: doenca.condutas || []
                    });
                }
            });
        });

        return hipoteses.sort((a,b) => b.probabilidade - a.probabilidade);
    },

    bindBack() {
        const btn = document.getElementById('btn-back');
        if(btn) btn.onclick = () => this.goBack();
    }
};