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
    Lieux: ["Cuisine", "Salle de bal", "Salon", "Salle à manger", "Salle de billard", "Bibliothèque", "Bureau", "Hall", "Véranda"]
};

const weaponIcons = {
    "Poignard": "pictures/armes/poignard.svg",
    "Chandelier": "pictures/armes/chandelier.svg",
    "Revolver": "pictures/armes/revolver.svg",
    "Corde": "pictures/armes/corde.svg",
    "Matraque": "pictures/armes/matraque.svg",
    "Clé Anglaise": "pictures/armes/cle-anglaise.svg"
};

const locationIcons = {
    "Cuisine": "pictures/lieux/cuisine.svg",
    "Salle de bal": "pictures/lieux/salle-de-bal.svg",
    "Salon": "pictures/lieux/salon.svg",
    "Salle à manger": "pictures/lieux/salle-a-manger.svg",
    "Salle de billard": "pictures/lieux/salle-de-billard.svg",
    "Bibliothèque": "pictures/lieux/bibliotheque.svg",
    "Bureau": "pictures/lieux/bureau.svg",
    "Hall": "pictures/lieux/hall.svg",
    "Véranda": "pictures/lieux/veranda.svg"
};

const suspectSwatches = {
    "Mlle Rose": "rose",
    "Col. Moutarde": "moutarde",
    "Mme Pervenche": "pervenche",
    "Dr Olive": "olive",
    "Mme Leblanc": "leblanc",
    "Prof. Violet": "violet"
};

const shortNames = {
    "Mlle Rose": "Rose",
    "Col. Moutarde": "Moutarde",
    "Mme Pervenche": "Pervenche",
    "Dr Olive": "Olive",
    "Mme Leblanc": "Leblanc",
    "Prof. Violet": "Violet",
    "Clé Anglaise": "Clé angl.",
    "Salle de bal": "Salle de bal",
    "Salle à Manger": "Salle à manger"
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

function getCardIcon(item) {
    return weaponIcons[item] || locationIcons[item];
}

function hasCardVisual(item) {
    return Boolean(getCardIcon(item) || suspectSwatches[item]);
}

function cardVisualHtml(item) {
    const iconSrc = getCardIcon(item);
    if (iconSrc) {
        return `<img class="card-tile__icon" src="${iconSrc}" alt="" aria-hidden="true">`;
    }

    const swatch = suspectSwatches[item];
    if (swatch) {
        return `<span class="card-tile__swatch card-tile__swatch--${swatch}" aria-hidden="true"></span>`;
    }

    return "";
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
    const iconSrc = getCardIcon(item);
    const swatchKey = suspectSwatches[item];
    const overlayIcon = document.getElementById("card-display-icon");
    const overlaySwatch = document.getElementById("card-display-swatch");
    const detectiveSvg = document.querySelector(".detective-svg");

    overlayIcon.hidden = true;
    overlaySwatch.hidden = true;
    overlaySwatch.className = "card-display-swatch";
    detectiveSvg.hidden = false;

    if (iconSrc) {
        overlayIcon.src = iconSrc;
        overlayIcon.hidden = false;
        detectiveSvg.hidden = true;
    } else if (swatchKey) {
        overlaySwatch.classList.add(`card-display-swatch--${swatchKey}`);
        overlaySwatch.hidden = false;
        detectiveSvg.hidden = true;
    }

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
    const visual = cardVisualHtml(item);
    const bodyClass = ["card-tile__body", hasCardVisual(item) && "card-tile__body--with-icon"].filter(Boolean).join(" ");
    const isSuspect = status === STATUS.SUSPECT;
    const tileClass = ["card-tile", !inHand && status === STATUS.OWNED && "owned", isSuspect && "suspect"].filter(Boolean).join(" ");

    if (inHand && isGameMode()) {
        return `
            <div class="${tileClass}">
                <div class="${bodyClass}" data-action="show-card" data-item="${safeItem}">
                    ${visual}
                    <span class="card-tile__label">${label}</span>
                </div>
            </div>
        `;
    }

    if (inHand && isSelectionMode()) {
        return `
            <div class="${tileClass}">
                <div class="${bodyClass}" data-action="toggle-owned" data-item="${safeItem}">
                    ${visual}
                    <span class="card-tile__label">${label}</span>
                </div>
            </div>
        `;
    }

    if (isSelectionMode()) {
        return `
            <div class="${tileClass}">
                <div class="${bodyClass}" data-action="toggle-owned" data-item="${safeItem}">
                    ${visual}
                    <span class="card-tile__label">${label}</span>
                </div>
            </div>
        `;
    }

    if (status === STATUS.ELIMINATED) {
        return `
            <div class="card-tile card-tile--ghost">
                <div class="${bodyClass}" data-action="restore" data-item="${safeItem}" aria-label="Restaurer ${safeItem}">
                    ${visual}
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
            <div class="${bodyClass}" data-action="toggle-suspect" data-item="${safeItem}">
                ${visual}
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

function openAbout() {
    closeMenu();
    document.getElementById("about-overlay").hidden = false;
}

function closeAbout() {
    document.getElementById("about-overlay").hidden = true;
}

function toggleMenu() {
    const isOpen = !document.getElementById("burgerMenu").hidden;
    if (isOpen) closeMenu();
    else openMenu();
}

function initMenu() {
    document.getElementById("menuBtn").addEventListener("click", toggleMenu);
    document.getElementById("menuBackdrop").addEventListener("click", closeMenu);
    document.getElementById("aboutBtn").addEventListener("click", openAbout);
    document.getElementById("aboutCloseBtn").addEventListener("click", closeAbout);

    document.getElementById("about-overlay").addEventListener("click", (event) => {
        if (event.target.id === "about-overlay") closeAbout();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        if (!document.getElementById("about-overlay").hidden) {
            closeAbout();
            return;
        }
        closeMenu();
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
