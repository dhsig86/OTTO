// ARQUIVO BOOTSTRAP
// Apenas inicializa os módulos

import { Logic } from './modules/logic.js';

// No HTML, certifique-se de usar <script type="module" src="js/interviewer.js"></script>
document.addEventListener("DOMContentLoaded", () => {
    Logic.init();
});

// Expõe globalmente apenas o que o HTML precisa (Botão Reset do Header)
window.resetApp = () => {
    if(confirm('Reiniciar atendimento?')) location.reload();
}