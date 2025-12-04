// Wires up navigation highlighting, theme toggling, and language persistence.
const themeKey = "hf-theme";
const langKey = "hf-lang";

const supportedLanguages = ["en", "sv"] as const;
type SupportedLanguage = (typeof supportedLanguages)[number];

type Theme = "light" | "dark";

interface ThemeLabels {
  toDark: string;
  toLight: string;
}

const labels: Record<SupportedLanguage, ThemeLabels> = {
  en: {
    toDark: "Use dark mode",
    toLight: "Use light mode",
  },
  sv: {
    toDark: "Aktivera mörkt läge",
    toLight: "Aktivera ljust läge",
  },
};

const ensureFavicon = (): void => {
  const existing = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (existing) {
    return;
  }
  const link = document.createElement("link");
  link.rel = "icon";
  link.type = "image/svg+xml";
  link.href = "/favicon.svg";
  document.head.append(link);
};

const normalizeLanguage = (value: string | null | undefined): SupportedLanguage => {
  const lowered = (value ?? "en").toLowerCase();
  return supportedLanguages.includes(lowered as SupportedLanguage)
    ? (lowered as SupportedLanguage)
    : "en";
};

const root = document.documentElement;
const body = document.body;
const currentLang = normalizeLanguage(root.lang);

const themeToggle = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
const langToggle = document.querySelector<HTMLElement>("[data-lang-toggle]");
const navLinks = document.querySelectorAll<HTMLAnchorElement>("[data-nav-item]");
const yearSlot = document.querySelector<HTMLElement>("[data-current-year]");
const prefersDark = window.matchMedia
  ? window.matchMedia("(prefers-color-scheme: dark)")
  : null;
const shareButtons = document.querySelectorAll<HTMLButtonElement>("[data-share-url]");

const currentLabels = labels[currentLang] ?? labels.en;

const applyTheme = (theme: Theme | string, persist = true): void => {
  const normalized: Theme = theme === "dark" ? "dark" : "light";
  root.dataset.theme = normalized;
  if (persist) {
    try {
      window.localStorage.setItem(themeKey, normalized);
    } catch (error) {
      console.warn("Unable to persist theme preference", error);
    }
  }
  if (themeToggle) {
    themeToggle.textContent =
      normalized === "dark" ? currentLabels.toLight : currentLabels.toDark;
  }
};

const detectInitialTheme = (): boolean => {
  let storedTheme: string | null;
  try {
    storedTheme = window.localStorage.getItem(themeKey);
  } catch (error) {
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
    const nextTheme: Theme = root.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme, true);
  });
}

if (prefersDark) {
  prefersDark.addEventListener("change", (event: MediaQueryListEvent) => {
    let storedTheme: string | null;
    try {
      storedTheme = window.localStorage.getItem(themeKey);
    } catch (error) {
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
    } catch (error) {
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

const normalizeShareUrl = (value: string | undefined | null): string => {
  const fallback = window.location.href;
  if (!value) {
    return fallback;
  }
  try {
    return new URL(value, window.location.href).toString();
  } catch (error) {
    console.warn("Unable to normalize share URL", value, error);
    return fallback;
  }
};

if (shareButtons.length > 0) {
  shareButtons.forEach((button) => {
    const shareUrl = normalizeShareUrl(button.dataset.shareUrl);
    const shareTitle = button.dataset.shareTitle ?? document.title;
    const shareText = button.dataset.shareText ?? "";

    button.addEventListener("click", async () => {
      if (navigator.share) {
        try {
          await navigator.share({ url: shareUrl, title: shareTitle, text: shareText });
          return;
        } catch (error) {
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
} catch (error) {
  console.warn("Unable to persist current language", error);
}

export {};
