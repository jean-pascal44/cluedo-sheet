const DATA_KEY = "cluedo_local_v3";

const categories = {
    "Suspects": ["Mlle Rose", "Col. Moutarde", "Mme Pervenche", "Dr Olive", "Mme Leblanc", "Prof. Violet"],
    "Armes": ["Poignard", "Chandelier", "Revolver", "Corde", "Matraque", "Clé Anglaise"],
    "Lieux": ["Cuisine", "Salle de bal", "Salon", "Salle à Manger", "Billard", "Bibliothèque", "Bureau", "Hall", "Véranda"]
};

let gameState = JSON.parse(localStorage.getItem(DATA_KEY)) || {};
let history = [];

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playDiceSound() {
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(150 - i * 20, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
        }, i * 150);
    }
}

function rollDice() {
    const result = Math.floor(Math.random() * 11) + 2;
    playDiceSound();

    setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(String(result));
        utterance.lang = "fr-FR";
        utterance.rate = 1.1;

        const voices = window.speechSynthesis.getVoices();
        const maleVoice = voices.find(
            (v) =>
                v.lang.startsWith("fr") &&
                (v.name.toLowerCase().includes("thomas") ||
                    v.name.toLowerCase().includes("paul") ||
                    v.name.toLowerCase().includes("male"))
        );

        if (maleVoice) utterance.voice = maleVoice;

        window.speechSynthesis.speak(utterance);
    }, 600);
}

function save() {
    localStorage.setItem(DATA_KEY, JSON.stringify(gameState));
    document.getElementById("undoBtn").disabled = history.length === 0;
}

function toggleOwned(item) {
    history.push(JSON.stringify(gameState));
    const current = gameState[item] || 0;
    gameState[item] = current === 2 ? 0 : 2;
    save();
    render();
}

function eliminate(item) {
    history.push(JSON.stringify(gameState));
    gameState[item] = 1;
    save();
    render();
}

function showCard(item) {
    document.getElementById("card-display-name").innerText = item;
    document.getElementById("show-card-overlay").style.display = "flex";
}

function closeOverlay() {
    document.getElementById("show-card-overlay").style.display = "none";
}

function undo() {
    if (history.length > 0) {
        gameState = JSON.parse(history.pop());
        save();
        render();
    }
}

function resetGame() {
    if (confirm("Tout réinitialiser ?")) {
        history.push(JSON.stringify(gameState));
        gameState = {};
        save();
        render();
    }
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function handleAppClick(event) {
    const target = event.target.closest("[data-action]");
    if (!target) return;

    const { action, item } = target.dataset;
    if (action === "toggle-owned") toggleOwned(item);
    else if (action === "eliminate") eliminate(item);
    else if (action === "show-card") showCard(item);
}

function render() {
    const app = document.getElementById("app");
    let html = "";

    for (const [category, items] of Object.entries(categories)) {
        html += `<div class="section-title">${escapeHtml(category)}</div>`;
        items.forEach((item) => {
            const status = gameState[item] || 0;
            if (status === 1) return;

            const isOwned = status === 2;
            const safeItem = escapeHtml(item);

            html += `
                <div class="row ${isOwned ? "owned" : ""}">
                    <div class="item-name" data-action="toggle-owned" data-item="${safeItem}">
                        ${isOwned ? "🃏 " : ""}<span>${safeItem}</span>
                    </div>
                    ${
                        isOwned
                            ? `<div class="action-btn show-icon" data-action="show-card" data-item="${safeItem}">👁️</div>`
                            : `<div class="action-btn delete-icon" data-action="eliminate" data-item="${safeItem}">✖</div>`
                    }
                </div>
            `;
        });
    }
    app.innerHTML = html;
}

function init() {
    document.getElementById("diceBtn").addEventListener("click", rollDice);
    document.getElementById("undoBtn").addEventListener("click", undo);
    document.getElementById("resetBtn").addEventListener("click", resetGame);
    document.getElementById("show-card-overlay").addEventListener("click", closeOverlay);
    document.getElementById("app").addEventListener("click", handleAppClick);

    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };

    render();
    save();
}

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
}

init();
