// MÓDULO DE ESTADO (MEMÓRIA) v3

const estadoInicial = {
    etapa: 0,
    nome: "",
    consentimento: false,
    demografia: { idade: "", sexo: "", tipo_visita: "" },
    qp_real: "",
    sintomasGerais: [],
    regioesAfetadas: [],
    
    // Novos campos complexos
    detalhesSintomas: [], // Lista simples dos IDs (ex: "dor_ouvido")
    respostasQualificadores: {}, // Objeto complexo { "dor_ouvido": { "intensidade": 8 } }
    respostasDiscriminantes: [], // Lista de IDs (ex: ["agua", "trauma"])
    
    sinaisAlarme: [],
    algoMais: "",
    tempoEvolucao: "" 
};

let dadosAtuais = JSON.parse(JSON.stringify(estadoInicial));
let historico = [];

export const State = {
    get() { return JSON.parse(JSON.stringify(dadosAtuais)); },
    
    update(campo, valor) {
        this.pushHistory();
        if (campo.includes('.')) {
            const [pai, filho] = campo.split('.');
            if (!dadosAtuais[pai]) dadosAtuais[pai] = {};
            dadosAtuais[pai][filho] = valor;
        } else {
            dadosAtuais[campo] = valor;
        }
        console.log(`State Updated [${campo}]:`, valor); // Debug
    },
    
    // Salva resposta de qualificador (Drill Down)
    setQualificador(sintomaId, atributoId, valor) {
        // Não salva histórico a cada slider change para não poluir, só no final da etapa se quiser
        if (!dadosAtuais.respostasQualificadores[sintomaId]) {
            dadosAtuais.respostasQualificadores[sintomaId] = {};
        }
        dadosAtuais.respostasQualificadores[sintomaId][atributoId] = valor;
    },

    addToList(campo, item) {
        this.pushHistory();
        if (!dadosAtuais[campo].includes(item)) dadosAtuais[campo].push(item);
    },

    removeFromList(campo, item) {
        this.pushHistory();
        dadosAtuais[campo] = dadosAtuais[campo].filter(i => i !== item);
    },

    pushHistory() {
        historico.push(JSON.parse(JSON.stringify(dadosAtuais)));
        if (historico.length > 20) historico.shift();
    },

    undo() {
        if (historico.length === 0) return false;
        dadosAtuais = historico.pop();
        return true;
    },

    setEtapa(n) { dadosAtuais.etapa = n; },
    getEtapa() { return dadosAtuais.etapa; }
};