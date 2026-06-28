const DATA_KEY = "cluedo_local_v3";
const THEME_KEY = "cluedo_theme";
const TAB_KEY = "cluedo_tab";
const MODE_KEY = "cluedo_mode";
const TAB_COUNT = 4;
const TAB_SUSPECTS = 1;
const STATUS = { NEUTRAL: 0, ELIMINATED: 1, OWNED: 2, SUSPECT: 3 };
const MODE = { SELECTION: "selection", GAME: "game" };

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
let appMode = getInitialMode();
let currentTab = getInitialTab();
let touchStartX = 0;
let touchStartY = 0;

function getInitialMode() {
    const stored = localStorage.getItem(MODE_KEY);
    if (stored === MODE.SELECTION || stored === MODE.GAME) return stored;
    return Object.keys(gameState).length > 0 ? MODE.GAME : MODE.SELECTION;
}

function getInitialTab() {
    const stored = localStorage.getItem(TAB_KEY);
    if (stored !== null) {
        const n = parseInt(stored, 10);
        if (n >= 0 && n < TAB_COUNT) return n;
    }
    return appMode === MODE.SELECTION ? TAB_SUSPECTS : 0;
}

function getStatus(item) {
    return gameState[item] || STATUS.NEUTRAL;
}

function isVisibleInCategoryTab(status) {
    if (status === STATUS.OWNED) return false;
    if (status === STATUS.ELIMINATED) return isGameMode();
    return true;
}

function isSelectionMode() {
    return appMode === MODE.SELECTION;
}

function isGameMode() {
    return appMode === MODE.GAME;
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
    localStorage.setItem(MODE_KEY, appMode);
}

function updateAppMode() {
    document.body.dataset.mode = appMode;
    document.getElementById("validateBtn").hidden = !isSelectionMode();
}

function render() {
    updateAppMode();
    document.getElementById("panel-hand").innerHTML = renderHandPanel();
    document.getElementById("panel-suspects").innerHTML = renderCategoryPanel("Suspects", "Aucun suspect disponible.");
    document.getElementById("panel-armes").innerHTML = renderCategoryPanel("Armes", "Aucune arme disponible.");
    document.getElementById("panel-lieux").innerHTML = renderCategoryPanel("Lieux", "Aucun lieu disponible.");
}

function toggleOwned(item) {
    if (!isSelectionMode()) return;

    const current = getStatus(item);
    if (current === STATUS.OWNED) {
        delete gameState[item];
    } else {
        gameState[item] = STATUS.OWNED;
    }
    save();
    render();
}

function toggleSuspect(item) {
    if (!isGameMode()) return;

    const current = getStatus(item);
    if (current === STATUS.NEUTRAL) {
        gameState[item] = STATUS.SUSPECT;
    } else if (current === STATUS.SUSPECT) {
        delete gameState[item];
    }
    save();
    render();
}

function eliminate(item) {
    if (!isGameMode()) return;

    gameState[item] = STATUS.ELIMINATED;
    save();
    render();
}

function restoreCard(item) {
    if (!isGameMode()) return;

    delete gameState[item];
    save();
    render();
}

function validateGame() {
    appMode = MODE.GAME;
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

function resetGame() {
    if (confirm("Tout réinitialiser ?")) {
        gameState = {};
        appMode = MODE.SELECTION;
        save();
        goToTab(TAB_SUSPECTS);
        render();
        closeMenu();
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
    else if (action === "toggle-suspect") toggleSuspect(item);
    else if (action === "eliminate") eliminate(item);
    else if (action === "restore") restoreCard(item);
    else if (action === "show-card") showCard(item);
}

function renderCardTile(item, status, { inHand = false } = {}) {
    const safeItem = escapeHtml(item);
    const label = escapeHtml(displayName(item, false));
    const isSuspect = status === STATUS.SUSPECT;
    const tileClass = ["card-tile", !inHand && status === STATUS.OWNED && "owned", isSuspect && "suspect"].filter(Boolean).join(" ");

    if (inHand && isGameMode()) {
        return `
            <div class="${tileClass}">
                <div class="card-tile__body" data-action="show-card" data-item="${safeItem}">
                    <span class="card-tile__label">${label}</span>
                </div>
            </div>
        `;
    }

    if (inHand && isSelectionMode()) {
        return `
            <div class="${tileClass}">
                <div class="card-tile__body" data-action="toggle-owned" data-item="${safeItem}">
                    <span class="card-tile__label">${label}</span>
                </div>
            </div>
        `;
    }

    if (isSelectionMode()) {
        return `
            <div class="${tileClass}">
                <div class="card-tile__body" data-action="toggle-owned" data-item="${safeItem}">
                    <span class="card-tile__label">${label}</span>
                </div>
            </div>
        `;
    }

    if (status === STATUS.ELIMINATED) {
        return `
            <div class="card-tile card-tile--ghost">
                <div class="card-tile__body" data-action="restore" data-item="${safeItem}" aria-label="Restaurer ${safeItem}">
                    <span class="card-tile__label">${label}</span>
                </div>
                <div class="card-tile__action card-tile__action--ghost" aria-hidden="true">✖</div>
            </div>
        `;
    }

    const labelHtml = isSuspect
        ? `<span class="card-tile__label card-tile__label--suspect">${label}</span>`
        : `<span class="card-tile__label">${label}</span>`;

    return `
        <div class="${tileClass}">
            <div class="card-tile__body" data-action="toggle-suspect" data-item="${safeItem}">
                ${labelHtml}
            </div>
            <button type="button" class="card-tile__action delete-icon" data-action="eliminate" data-item="${safeItem}" aria-label="Éliminer ${safeItem}">✖</button>
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

    const emptyMessage = isSelectionMode()
        ? "Aucune carte en main.<br>Appuyez sur une carte dans les onglets pour la sélectionner 🃏"
        : "Aucune carte en main.";

    return renderCardGrid(owned, emptyMessage, { inHand: true });
}

function renderCategoryPanel(categoryName, emptyMessage) {
    const items = categories[categoryName].filter((item) => isVisibleInCategoryTab(getStatus(item)));
    const active = items.filter((item) => getStatus(item) !== STATUS.ELIMINATED);
    if (active.length === 0 && items.length === 0) {
        return `<p class="empty-state">${emptyMessage}</p>`;
    }
    return renderCardGrid(items);
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
        btn.textContent = theme === "dark" ? "☀️ Mode clair" : "🌙 Mode sombre";
    }
}

function openMenu() {
    document.getElementById("burgerMenu").hidden = false;
    document.getElementById("menuBackdrop").hidden = false;
    document.getElementById("menuBtn").classList.add("is-open");
    document.getElementById("menuBtn").setAttribute("aria-expanded", "true");
    document.getElementById("menuBtn").setAttribute("aria-label", "Fermer le menu");
}

function closeMenu() {
    document.getElementById("burgerMenu").hidden = true;
    document.getElementById("menuBackdrop").hidden = true;
    document.getElementById("menuBtn").classList.remove("is-open");
    document.getElementById("menuBtn").setAttribute("aria-expanded", "false");
    document.getElementById("menuBtn").setAttribute("aria-label", "Ouvrir le menu");
}

function toggleMenu() {
    const isOpen = !document.getElementById("burgerMenu").hidden;
    if (isOpen) closeMenu();
    else openMenu();
}

function initMenu() {
    document.getElementById("menuBtn").addEventListener("click", toggleMenu);
    document.getElementById("menuBackdrop").addEventListener("click", closeMenu);

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeMenu();
    });
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
    closeMenu();
}

function init() {
    initTheme();
    initTabs();
    initMenu();

    document.getElementById("themeBtn").addEventListener("click", toggleTheme);
    document.getElementById("validateBtn").addEventListener("click", validateGame);
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
