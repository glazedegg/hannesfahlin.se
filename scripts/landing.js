// Handles language selection and redirection from the landing page.
const langKey = "hf-lang";
const supportedLanguages = ["en", "sv"];
const languageRoutes = {
    en: "en/",
    sv: "sv/",
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
const isSupportedLanguage = (value) => supportedLanguages.includes(value);
const resolveBasePath = () => {
    const { pathname } = window.location;
    if (!pathname || pathname === "/") {
        return "/";
    }
    if (pathname.endsWith("/")) {
        return pathname;
    }
    const lastSlash = pathname.lastIndexOf("/");
    return lastSlash === -1 ? "/" : pathname.slice(0, lastSlash + 1);
};
const buildDestination = (lang) => {
    const base = resolveBasePath();
    const segment = languageRoutes[lang];
    if (!segment) {
        return null;
    }
    return base.endsWith("/") ? `${base}${segment}` : `${base}/${segment}`;
};
const attemptRedirect = (storedLang) => {
    if (!storedLang || !isSupportedLanguage(storedLang)) {
        return false;
    }
    const destination = buildDestination(storedLang);
    if (!destination) {
        return false;
    }
    window.location.replace(destination);
    return true;
};
(function bootstrap() {
    ensureFavicon();
    let storedLang = null;
    try {
        storedLang = window.localStorage.getItem(langKey);
    }
    catch (error) {
        storedLang = null;
    }
    if (storedLang && attemptRedirect(storedLang)) {
        return;
    }
    const links = document.querySelectorAll("[data-choose-lang]");
    links.forEach((link) => {
        link.addEventListener("click", () => {
            const langCode = link.dataset.chooseLang;
            if (!langCode || !isSupportedLanguage(langCode)) {
                return;
            }
            try {
                window.localStorage.setItem(langKey, langCode);
            }
            catch (error) {
                console.warn("Unable to persist language preference", error);
            }
        });
    });
})();
export {};
