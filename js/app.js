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
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(150 - (i * 20), audioCtx.currentTime);
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
        const utterance = new SpeechSynthesisUtterance(result);
        utterance.lang = 'fr-FR';
        utterance.rate = 1.1;

        const voices = window.speechSynthesis.getVoices();
        const maleVoice = voices.find(v =>
            v.lang.startsWith('fr') &&
            (v.name.toLowerCase().includes('thomas') ||
             v.name.toLowerCase().includes('paul') ||
             v.name.toLowerCase().includes('male'))
        );

        if (maleVoice) utterance.voice = maleVoice;

        window.speechSynthesis.speak(utterance);
    }, 600);
}

window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };

function save() {
    localStorage.setItem(DATA_KEY, JSON.stringify(gameState));
    document.getElementById('undoBtn').disabled = history.length === 0;
}

function toggleOwned(item) {
    history.push(JSON.stringify(gameState));
    const current = gameState[item] || 0;
    gameState[item] = (current === 2) ? 0 : 2;
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
    document.getElementById('card-display-name').innerText = item;
    document.getElementById('show-card-overlay').style.display = 'flex';
}

function closeOverlay() {
    document.getElementById('show-card-overlay').style.display = 'none';
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

function render() {
    const app = document.getElementById('app');
    let html = '';

    for (const [category, items] of Object.entries(categories)) {
        html += `<div class="section-title">${category}</div>`;
        items.forEach(item => {
            const status = gameState[item] || 0;
            if (status === 1) return;

            const safeItem = item.replace(/'/g, "\\'");
            const isOwned = status === 2;

            html += `
                <div class="row ${isOwned ? 'owned' : ''}">
                    <div class="item-name" onclick="toggleOwned('${safeItem}')">
                        ${isOwned ? '🃏 ' : ''}<span>${item}</span>
                    </div>
                    ${isOwned ?
                        `<div class="action-btn show-icon" onclick="showCard('${safeItem}')">👁️</div>` :
                        `<div class="action-btn delete-icon" onclick="eliminate('${safeItem}')">✖</div>`
                    }
                </div>
            `;
        });
    }
    app.innerHTML = html;
}

render();

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js");
    });
}
