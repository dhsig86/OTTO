// MÓDULO DE ESTADO (MEMÓRIA & HISTÓRICO)
// Responsável por gerenciar os dados do paciente e a navegação (Undo/Redo)

const estadoInicial = {
    etapa: 0,
    nome: "",
    consentimento: false,
    demografia: { idade: "", sexo: "" },
    qp_real: "",
    sintomasGerais: [],
    detalhesFebre: "",
    regioesAfetadas: [],
    sinaisAlarme: [],
    detalhesSintomas: [],
    respostasInvestigativas: [],
    tempoEvolucao: "",
    algoMais: ""
};

// Dados atuais (Mutável)
let dadosAtuais = JSON.parse(JSON.stringify(estadoInicial));

// Pilha de Histórico (Para o botão Voltar)
let historico = [];

export const State = {
    // Retorna uma cópia segura dos dados
    get() {
        return JSON.parse(JSON.stringify(dadosAtuais));
    },

    // Atualiza um campo específico
    update(campo, valor) {
        // Antes de mudar, salva o estado atual no histórico (Snapshot)
        this.pushHistory();
        
        // Lógica para campos aninhados (ex: demografia.idade) ou diretos
        if (campo.includes('.')) {
            const [pai, filho] = campo.split('.');
            dadosAtuais[pai][filho] = valor;
        } else {
            dadosAtuais[campo] = valor;
        }
    },

    // Adiciona item em listas (ex: sintomas) sem duplicar
    addToList(campo, item) {
        this.pushHistory();
        if (!dadosAtuais[campo].includes(item)) {
            dadosAtuais[campo].push(item);
        }
    },

    // Remove item de listas
    removeFromList(campo, item) {
        this.pushHistory();
        dadosAtuais[campo] = dadosAtuais[campo].filter(i => i !== item);
    },

    // Salva o momento atual na pilha
    pushHistory() {
        // Clona o estado atual e joga na pilha
        historico.push(JSON.parse(JSON.stringify(dadosAtuais)));
        // Limite de segurança (últimos 50 passos)
        if (historico.length > 50) historico.shift();
    },

    // A Mágica do Botão Voltar
    undo() {
        if (historico.length === 0) return false; // Não tem pra onde voltar
        
        const estadoAnterior = historico.pop();
        dadosAtuais = estadoAnterior;
        return true; // Sucesso
    },

    // Reinicia tudo (Botão Reset)
    reset() {
        dadosAtuais = JSON.parse(JSON.stringify(estadoInicial));
        historico = [];
    },
    
    // Controle de Etapa (Avançar/Voltar Etapa)
    setEtapa(novaEtapa) {
        // Não salvamos histórico apenas por mudança de etapa visual, 
        // mas podemos salvar se quisermos que "Voltar" retorne à tela anterior
        // Por enquanto, vamos atualizar direto.
        dadosAtuais.etapa = novaEtapa;
    },
    
    getEtapa() {
        return dadosAtuais.etapa;
    }
};