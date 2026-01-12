// MÓDULO DE LÓGICA (INTERVIEWER) v3.0
// Responsável por conduzir a entrevista baseada no Super JSON

import { State } from './state.js';
import { API } from './api.js';
import { UI } from './ui.js';

let Heart = null; // Cache dos protocolos

export const Logic = {
    // 1. Inicialização
    async init() {
        console.log("OTTO Interviewer Init...");
        UI.showLoading();
        
        // Carrega o "Super JSON"
        Heart = await API.getProtocolos();
        
        UI.hideIntro();
        UI.hideLoading();

        if (!Heart) {
            UI.addOttoBubble("⚠️ Modo Offline (Cache). Protocolos desatualizados.");
        }
        
        // Começa a entrevista
        this.nextStep();
    },

    // 2. O Roteador (Máquina de Estados)
    nextStep() {
        const currentStep = State.getEtapa();
        const nextStep = currentStep + 1;
        State.setEtapa(nextStep);

        console.log(`>> Navegando para etapa: ${nextStep}`);

        switch (nextStep) {
            case 1: this.flowConsent(); break;
            case 2: this.flowDemographics(); break;
            case 3: this.flowQP(); break;      // Queixa Principal
            case 4: this.flowGeneral(); break; // Sintomas Sistêmicos
            case 5: this.flowRegions(); break; // Escolha da Região (Ouvido, Nariz...)
            case 6: this.flowSymptoms(); break;// Sintomas iniciais (Gatilhos)
            
            // --- AS NOVAS ETAPAS DE INTELIGÊNCIA ---
            case 7: this.flowQualifiers(); break;     // Drill Down (Detalhes profundos)
            case 8: this.flowDiscriminators(); break; // Pivôs (Sim/Não decisivos)
            case 9: this.flowRedFlags(); break;       // Sinais de Alarme
            
            case 10: this.flowAnythingElse(); break;
            case 11: this.finishTriage(); break;
            default: console.warn("Fim do fluxo ou etapa inválida");
        }
    },

    // 3. Função de Voltar (Undo)
    goBack() {
        const success = State.undo();
        if (success) {
            // Recua o contador para re-executar a etapa anterior
            const step = State.getEtapa(); // O undo já atualizou o state interno
            // Hack visual: Voltamos 1 no contador para o nextStep avançar para o correto
            State.setEtapa(step - 1); 
            this.nextStep();
        } else {
            alert("Início da triagem. Não é possível voltar.");
        }
    },

    // --- FLUXOS DA ENTREVISTA ---

    flowConsent() {
        UI.addOttoBubble("Olá! Sou o assistente inteligente do Dr. Dario. Vou organizar seu atendimento.");
        UI.renderInput(UI.templates.consent());
        
        UI.bind('btn-next', () => {
            const nome = document.getElementById('inp-name').value;
            if(nome.length < 3) return alert("Por favor, digite seu nome.");
            State.update('nome', nome);
            UI.addUserBubble(nome);
            this.nextStep();
        });
    },

    flowDemographics() {
        UI.addOttoBubble("Para começar, confirme seus dados:");
        UI.renderInput(UI.templates.demographics());
        
        UI.bind('btn-next', () => {
            const idade = document.getElementById('inp-age').value;
            const sexo = document.getElementById('inp-sex').value;
            const visita = document.getElementById('inp-visit').value;
            
            if(!idade || !sexo) return alert("Idade e sexo são obrigatórios.");
            
            State.update('demografia', { idade, sexo, tipo_visita: visita });
            this.nextStep();
        });
        this.bindBack();
    },

    flowQP() {
        UI.addOttoBubble("Em poucas palavras, qual o motivo da sua visita hoje?");
        UI.renderInput(UI.templates.textInput("Ex: Dor de ouvido forte desde ontem...", false));
        
        UI.bind('btn-next', () => {
            const txt = document.getElementById('inp-text').value;
            if(!txt) return; // Opcional: Validar vazio
            State.update('qp_real', txt);
            UI.addUserBubble(txt);
            this.nextStep();
        });
        this.bindBack();
    },

    flowGeneral() {
        UI.addOttoBubble("Você apresenta algum sintoma geral no corpo?");
        // Pega do JSON ou usa padrão
        const options = Heart?.anamnese_geral?.sintomas_sistemicos || ["febre", "perda_peso"];
        UI.renderInput(UI.templates.multiSelect(options));
        
        UI.bindSelectButtons((selected) => State.update('sintomasGerais', selected));
        UI.bind('btn-next', () => this.nextStep());
        this.bindBack();
    },

    flowRegions() {
        UI.addOttoBubble("Toque na região onde está o problema principal:");
        UI.renderInput(UI.templates.regions(Heart.dominios));
        
        UI.bindRegionButtons((selected) => {
            if(selected.length === 0) return alert("Selecione pelo menos uma região.");
            State.update('regioesAfetadas', selected);
            this.nextStep();
        });
        this.bindBack();
    },

    flowSymptoms() {
        // Agrega sintomas de todas as regiões selecionadas
        let options = [];
        State.get().regioesAfetadas.forEach(r => {
            if(Heart.dominios[r]) options = options.concat(Heart.dominios[r].sintomas_gatilho);
        });
        options = [...new Set(options)]; // Remove duplicatas

        UI.addOttoBubble("Selecione o que você sente:");
        UI.renderInput(UI.templates.multiSelect(options));
        
        UI.bindSelectButtons((selected) => State.update('detalhesSintomas', selected));
        UI.bind('btn-next', () => this.nextStep());
        this.bindBack();
    },

    // --- O PULO DO GATO: QUALIFICADORES (Drill Down) ---
    flowQualifiers() {
        const sintomasMarcados = State.get().detalhesSintomas;
        const regioes = State.get().regioesAfetadas;
        let queue = [];

        // Verifica no JSON: Para cada sintoma marcado, existe uma pergunta detalhada?
        regioes.forEach(r => {
            const dominio = Heart.dominios[r];
            if(!dominio.qualificadores) return;
            
            sintomasMarcados.forEach(sintoma => {
                // Se existe qualificador para este sintoma (Ex: "dor_ouvido")
                if(dominio.qualificadores[sintoma]) {
                    queue.push({
                        sintomaId: sintoma,
                        config: dominio.qualificadores[sintoma]
                    });
                }
            });
        });

        // Se não tem nada para detalhar, pula esta etapa
        if (queue.length === 0) { this.nextStep(); return; }

        UI.addOttoBubble("Preciso de alguns detalhes específicos sobre os sintomas:");
        // Renderiza o formulário complexo (Sliders, Selects)
        UI.renderInput(UI.templates.qualifiersForm(queue));
        
        UI.bind('btn-next', () => {
            // Coleta as respostas do HTML
            queue.forEach(q => {
                q.config.atributos.forEach(attr => {
                    const inputId = `qualif-${q.sintomaId}-${attr.id}`;
                    const el = document.getElementById(inputId);
                    if(el) {
                        State.setQualificador(q.sintomaId, attr.id, el.value);
                    }
                });
            });
            UI.addUserBubble("Detalhes informados.");
            this.nextStep();
        });
        this.bindBack();
    },

    // --- O PULO DO GATO 2: DISCRIMINADORES (Fatores Pivô) ---
    flowDiscriminators() {
        const regioes = State.get().regioesAfetadas;
        let factors = [];
        
        // Coleta todos os fatores discriminantes das regiões selecionadas
        regioes.forEach(r => {
            if(Heart.dominios[r].fatores_discriminantes) {
                factors = factors.concat(Heart.dominios[r].fatores_discriminantes);
            }
        });

        if(factors.length === 0) { this.nextStep(); return; }

        UI.addOttoBubble("Para finalizar a análise, responda Sim ou Não:");
        UI.renderInput(UI.templates.binaryQuestions(factors));
        
        // Lógica visual dos botões Sim/Não
        const answers = new Set();
        document.querySelectorAll('.btn-binary').forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                if(answers.has(id)) {
                    answers.delete(id); // Desmarcar
                    btn.classList.remove('bg-blue-600', 'text-white', 'border-transparent');
                    btn.classList.add('bg-white', 'text-slate-700', 'border-slate-200');
                    btn.querySelector('.check-icon').textContent = '';
                } else {
                    answers.add(id); // Marcar
                    btn.classList.remove('bg-white', 'text-slate-700', 'border-slate-200');
                    btn.classList.add('bg-blue-600', 'text-white', 'border-transparent');
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

        UI.addOttoBubble("⚠️ Atenção: Algum destes sinais de ALERTA está presente?");
        UI.renderInput(UI.templates.multiSelect(alarms.map(a => a.id), alarms)); // Passa objetos completos para pegar o texto
        
        UI.bindSelectButtons((selected) => State.update('sinaisAlarme', selected), true); // true = estilo vermelho
        UI.bind('btn-next', () => this.nextStep());
        this.bindBack();
    },

    flowAnythingElse() {
        UI.addOttoBubble("Algo mais? (Alergias, remédios em uso, observações...)");
        UI.renderInput(UI.templates.textInput("Ex: Sou alérgico a Dipirona...", true));
        
        UI.bind('btn-finish', () => {
            const txt = document.getElementById('inp-text').value;
            if(txt) State.update('algoMais', txt);
            this.nextStep();
        });
        UI.bind('btn-skip', () => {
            this.nextStep();
        });
        this.bindBack();
    },

    async finishTriage() {
        UI.addOttoBubble("Gerando documentação clínica e analisando protocolos... 📋");
        UI.showLoading();
        
        const d = State.get();
        
        // Constrói o pacote exato que o BRAIN (Python) espera
        const payload = {
            idade: parseInt(d.demografia.idade) || 0,
            sexo: d.demografia.sexo || "Indefinido",
            sintomas_gerais: d.sintomasGerais || [],
            regioes: d.regioesAfetadas || [],
            sintomas_especificos: d.detalhesSintomas || [],
            respostas_qualificadores: d.respostasQualificadores || {},
            respostas_discriminantes: d.respostasDiscriminantes || [],
            sinais_alarme: d.sinaisAlarme || [],
            historico: d.algoMais || ""
        };

        try {
            // Envia para o Cérebro
            const res = await API.processarTriagem(payload);
            
            UI.hideLoading();
            
            // Renderiza o Relatório Final (Dual View)
            UI.renderFinalReport(d, res.hipoteses || []);
            
        } catch (e) {
            console.error("Erro na comunicação com a API:", e);
            UI.hideLoading();
            UI.addOttoBubble("Houve um erro de conexão. Gerando relatório offline.");
            UI.renderFinalReport(d, []); // Gera relatório vazio, mas não trava
        }
    },

    // Atalho para ligar o botão voltar do UI
    bindBack() {
        const btn = document.getElementById('btn-back');
        if(btn) btn.onclick = () => this.goBack();
    }
};