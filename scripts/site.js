var _a;
// Wires up navigation highlighting, theme toggling, and language persistence.
const themeKey = "hf-theme";
const langKey = "hf-lang";
const supportedLanguages = ["en", "sv"];
const labels = {
    en: {
        toDark: "Use dark mode",
        toLight: "Use light mode",
    },
    sv: {
        toDark: "Aktivera mörkt läge",
        toLight: "Aktivera ljust läge",
    },
};
const ensureFavicon = () => {
    const existing = document.querySelector("link[rel='icon']");
    if (existing) {
        return;
    }
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.href = "/favicon.svg";
    document.head.append(link);
};
const normalizeLanguage = (value) => {
    const lowered = (value !== null && value !== void 0 ? value : "en").toLowerCase();
    return supportedLanguages.includes(lowered)
        ? lowered
        : "en";
};
const root = document.documentElement;
const body = document.body;
const currentLang = normalizeLanguage(root.lang);
const themeToggle = document.querySelector("[data-theme-toggle]");
const langToggle = document.querySelector("[data-lang-toggle]");
const navLinks = document.querySelectorAll("[data-nav-item]");
const yearSlot = document.querySelector("[data-current-year]");
const prefersDark = window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;
const shareButtons = document.querySelectorAll("[data-share-url]");
const currentLabels = (_a = labels[currentLang]) !== null && _a !== void 0 ? _a : labels.en;
const applyTheme = (theme, persist = true) => {
    const normalized = theme === "dark" ? "dark" : "light";
    root.dataset.theme = normalized;
    if (persist) {
        try {
            window.localStorage.setItem(themeKey, normalized);
        }
        catch (error) {
            console.warn("Unable to persist theme preference", error);
        }
    }
    if (themeToggle) {
        themeToggle.textContent =
            normalized === "dark" ? currentLabels.toLight : currentLabels.toDark;
    }
};
const detectInitialTheme = () => {
    let storedTheme;
    try {
        storedTheme = window.localStorage.getItem(themeKey);
    }
    catch (error) {
        storedTheme = null;
    }
    if (storedTheme) {
        applyTheme(storedTheme, false);
        return true;
    }
    const shouldUseDark = prefersDark ? prefersDark.matches : false;
    applyTheme(shouldUseDark ? "dark" : "light", false);
    return false;
};
ensureFavicon();
detectInitialTheme();
if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
        applyTheme(nextTheme, true);
    });
}
if (prefersDark) {
    prefersDark.addEventListener("change", (event) => {
        let storedTheme;
        try {
            storedTheme = window.localStorage.getItem(themeKey);
        }
        catch (error) {
            storedTheme = null;
        }
        if (!storedTheme) {
            applyTheme(event.matches ? "dark" : "light", false);
        }
    });
}
if (langToggle) {
    langToggle.addEventListener("click", () => {
        const targetLang = normalizeLanguage(langToggle.dataset.langCode);
        try {
            window.localStorage.setItem(langKey, targetLang);
        }
        catch (error) {
            console.warn("Unable to persist language preference", error);
        }
    });
}
if (body && body.dataset.page) {
    const activePage = body.dataset.page;
    navLinks.forEach((link) => {
        if (link.dataset.navItem === activePage) {
            link.classList.add("is-active");
            link.setAttribute("aria-current", "page");
        }
    });
}
if (yearSlot) {
    yearSlot.textContent = new Date().getFullYear().toString();
}
const normalizeShareUrl = (value) => {
    const fallback = window.location.href;
    if (!value) {
        return fallback;
    }
    try {
        return new URL(value, window.location.href).toString();
    }
    catch (error) {
        console.warn("Unable to normalize share URL", value, error);
        return fallback;
    }
};
if (shareButtons.length > 0) {
    shareButtons.forEach((button) => {
        var _a, _b;
        const shareUrl = normalizeShareUrl(button.dataset.shareUrl);
        const shareTitle = (_a = button.dataset.shareTitle) !== null && _a !== void 0 ? _a : document.title;
        const shareText = (_b = button.dataset.shareText) !== null && _b !== void 0 ? _b : "";
        button.addEventListener("click", async () => {
            if (navigator.share) {
                try {
                    await navigator.share({ url: shareUrl, title: shareTitle, text: shareText });
                    return;
                }
                catch (error) {
                    if (error instanceof DOMException && error.name === "AbortError") {
                        return;
                    }
                }
            }
            window.prompt("Copy this link", shareUrl);
        });
    });
}
try {
    window.localStorage.setItem(langKey, currentLang);
}
catch (error) {
    console.warn("Unable to persist current language", error);
}
export {};
