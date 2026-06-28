const DATA_KEY = "cluedo_local_v3";
const THEME_KEY = "cluedo_theme";
const TAB_KEY = "cluedo_tab";
const TAB_COUNT = 4;
const STATUS = { NEUTRAL: 0, ELIMINATED: 1, OWNED: 2 };

const categories = {
    Suspects: ["Mlle Rose", "Col. Moutarde", "Mme Pervenche", "Dr Olive", "Mme Leblanc", "Prof. Violet"],
    Armes: ["Poignard", "Chandelier", "Revolver", "Corde", "Matraque", "Clé Anglaise"],
    Lieux: ["Cuisine", "Salle de bal", "Salon", "Salle à Manger", "Billard", "Bibliothèque", "Bureau", "Hall", "Véranda"]
};

const shortNames = {
    "Mlle Rose": "Rose",
    "Col. Moutarde": "Moutarde",
    "Mme Pervenche": "Pervenche",
    "Dr Olive": "Olive",
    "Mme Leblanc": "Leblanc",
    "Prof. Violet": "Violet",
    "Clé Anglaise": "Clé angl.",
    "Salle de bal": "S. de bal",
    "Salle à Manger": "S. à manger"
};

let gameState = JSON.parse(localStorage.getItem(DATA_KEY)) || {};
let history = [];
let currentTab = Math.min(Math.max(parseInt(localStorage.getItem(TAB_KEY), 10) || 0, 0), TAB_COUNT - 1);
let touchStartX = 0;
let touchStartY = 0;

function getStatus(item) {
    return gameState[item] || STATUS.NEUTRAL;
}

function isVisibleInCategoryTab(status) {
    return status !== STATUS.ELIMINATED && status !== STATUS.OWNED;
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function displayName(item, full = false) {
    return full ? item : (shortNames[item] || item);
}

function save() {
    localStorage.setItem(DATA_KEY, JSON.stringify(gameState));
    document.getElementById("undoBtn").disabled = history.length === 0;
}

function toggleOwned(item) {
    history.push(JSON.stringify(gameState));
    const current = getStatus(item);
    gameState[item] = current === STATUS.OWNED ? STATUS.NEUTRAL : STATUS.OWNED;
    save();
    render();
}

function eliminate(item) {
    history.push(JSON.stringify(gameState));
    gameState[item] = STATUS.ELIMINATED;
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

function goToTab(index, persist = true) {
    currentTab = Math.max(0, Math.min(TAB_COUNT - 1, index));
    document.getElementById("tabsTrack").style.transform = `translateX(-${currentTab * 100}%)`;

    document.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.classList.toggle("is-active", parseInt(btn.dataset.tab, 10) === currentTab);
    });

    if (persist) {
        localStorage.setItem(TAB_KEY, String(currentTab));
    }
}

function initTabs() {
    const viewport = document.getElementById("tabsViewport");

    document.getElementById("tabsNav").addEventListener("click", (event) => {
        const btn = event.target.closest(".tab-btn");
        if (!btn) return;
        goToTab(parseInt(btn.dataset.tab, 10));
    });

    viewport.addEventListener("touchstart", (event) => {
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
    }, { passive: true });

    viewport.addEventListener("touchend", (event) => {
        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;

        if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY)) return;

        goToTab(currentTab + (deltaX < 0 ? 1 : -1));
    }, { passive: true });

    goToTab(currentTab, false);
}

function handleAppClick(event) {
    const target = event.target.closest("[data-action]");
    if (!target) return;

    event.stopPropagation();

    const { action, item } = target.dataset;
    if (action === "toggle-owned") toggleOwned(item);
    else if (action === "eliminate") eliminate(item);
    else if (action === "show-card") showCard(item);
}

function renderCardTile(item, status, { inHand = false } = {}) {
    const safeItem = escapeHtml(item);
    const label = escapeHtml(displayName(item, inHand));
    const isOwned = status === STATUS.OWNED;
    const tileClass = ["card-tile", isOwned && "owned"].filter(Boolean).join(" ");

    return `
        <div class="${tileClass}">
            <div class="card-tile__body" data-action="toggle-owned" data-item="${safeItem}">
                <span class="card-tile__label">${isOwned ? "🃏 " : ""}${label}</span>
            </div>
            ${
                inHand
                    ? `<button type="button" class="card-tile__action show-icon" data-action="show-card" data-item="${safeItem}" aria-label="Montrer ${safeItem}">👁️</button>`
                    : `<button type="button" class="card-tile__action delete-icon" data-action="eliminate" data-item="${safeItem}" aria-label="Éliminer ${safeItem}">✖</button>`
            }
        </div>
    `;
}

function renderCardGrid(items, emptyMessage, options = {}) {
    if (items.length === 0) {
        return `<p class="empty-state">${emptyMessage}</p>`;
    }

    let html = '<div class="card-grid">';
    items.forEach((item) => {
        html += renderCardTile(item, getStatus(item), options);
    });
    html += "</div>";
    return html;
}

function renderHandPanel() {
    const owned = [];

    for (const items of Object.values(categories)) {
        for (const item of items) {
            if (getStatus(item) === STATUS.OWNED) {
                owned.push(item);
            }
        }
    }

    return renderCardGrid(
        owned,
        "Aucune carte en main.<br>Appuyez sur une carte dans les autres onglets pour la marquer 🃏",
        { inHand: true }
    );
}

function renderCategoryPanel(categoryName, emptyMessage) {
    const visible = categories[categoryName].filter((item) => isVisibleInCategoryTab(getStatus(item)));
    return renderCardGrid(visible, emptyMessage);
}

function render() {
    document.getElementById("panel-hand").innerHTML = renderHandPanel();
    document.getElementById("panel-suspects").innerHTML = renderCategoryPanel("Suspects", "Aucun suspect disponible.");
    document.getElementById("panel-armes").innerHTML = renderCategoryPanel("Armes", "Aucune arme disponible.");
    document.getElementById("panel-lieux").innerHTML = renderCategoryPanel("Lieux", "Aucun lieu disponible.");
}

function getStoredTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
}

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
        meta.content = theme === "dark" ? "#1a1a1a" : "#f0f2f5";
    }

    const btn = document.getElementById("themeBtn");
    if (btn) {
        btn.textContent = theme === "dark" ? "☀️" : "🌙";
        btn.setAttribute("aria-label", theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre");
    }
}

function initTheme() {
    const stored = getStoredTheme();
    const theme = stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    applyTheme(theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
}

function init() {
    initTheme();
    initTabs();

    document.getElementById("themeBtn").addEventListener("click", toggleTheme);
    document.getElementById("undoBtn").addEventListener("click", undo);
    document.getElementById("resetBtn").addEventListener("click", resetGame);
    document.getElementById("show-card-overlay").addEventListener("click", closeOverlay);
    document.getElementById("tabsTrack").addEventListener("click", handleAppClick);

    render();
    save();
}

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js");
    });
}

init();
