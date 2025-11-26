// @ts-nocheck
import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, normalize } from "node:path";
import { JSDOM } from "jsdom";

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = normalize(join(TEST_DIR, ".."));

async function loadDom(relativePath: string) {
  const filePath = join(ROOT_DIR, relativePath);
  const html = await readFile(filePath, "utf8");
  return new JSDOM(html);
}

describe("landing page", () => {
  test("offers both language options", async () => {
    const dom = await loadDom("index.html");
    const document = dom.window.document;

    expect(document.documentElement.lang).toBe("en");
    const links = Array.from(
      document.querySelectorAll<HTMLAnchorElement>("[data-choose-lang]")
    );
    expect(links).toHaveLength(2);
    expect(links.map((link) => link.getAttribute("data-choose-lang"))).toEqual([
      "en",
      "sv",
    ]);
  });
});

const REQUIRED_NAV_ITEMS = ["home", "resume", "projects", "blog", "about"] as const;

async function assertNavStructure(relativePath: string) {
  const dom = await loadDom(relativePath);
  const document = dom.window.document;

  const nav = document.querySelector("nav.site-nav");
  expect(nav, `${relativePath} missing site navigation`).toBeTruthy();

  for (const item of REQUIRED_NAV_ITEMS) {
    const selector = `a[data-nav-item="${item}"]`;
    expect(
      document.querySelector(selector),
      `${relativePath} missing nav item ${selector}`
    ).toBeTruthy();
  }

  expect(
    document.querySelector("button[data-theme-toggle]"),
    `${relativePath} missing theme toggle`
  ).toBeTruthy();

  expect(
    document.querySelector("[data-lang-toggle]")
  ).toBeTruthy();
}

describe("English pages", () => {
  const englishPages = [
    "en/index.html",
    "en/about.html",
    "en/projects.html",
    "en/resume.html",
    "en/blog/index.html",
  ];

  for (const page of englishPages) {
    test(`${page} has expected structure`, async () => {
      const dom = await loadDom(page);
      const document = dom.window.document;
      expect(document.documentElement.lang).toBe("en");
      await assertNavStructure(page);
      const heroTitle = document.querySelector(".hero h1, .hero .hero-title");
      expect(heroTitle, `${page} missing hero title`).toBeTruthy();
    });
  }
});

describe("Swedish pages", () => {
  const swedishPages = [
    "sv/index.html",
    "sv/om.html",
    "sv/projekt.html",
    "sv/cv.html",
    "sv/blogg/index.html",
  ];

  for (const page of swedishPages) {
    test(`${page} has expected structure`, async () => {
      const dom = await loadDom(page);
      const document = dom.window.document;
      expect(document.documentElement.lang).toBe("sv");
      await assertNavStructure(page);
      const heroTitle = document.querySelector(".hero h1, .hero .hero-title");
      expect(heroTitle, `${page} saknar hero-rubrik`).toBeTruthy();
    });
  }
});

describe("Blog placeholders", () => {
  const englishPlaceholders = [
    "en/blog/placeholder-1.html",
    "en/blog/placeholder-2.html",
    "en/blog/placeholder-3.html",
  ];

  const swedishPlaceholders = [
    "sv/blogg/platshallare-1.html",
    "sv/blogg/platshallare-2.html",
    "sv/blogg/platshallare-3.html",
  ];

  for (const page of [...englishPlaceholders, ...swedishPlaceholders]) {
    test(`${page} marked as noindex`, async () => {
      const dom = await loadDom(page);
      const document = dom.window.document;
      const robotsMeta = document.querySelector('meta[name="robots"]');
      expect(robotsMeta, `${page} missing robots meta`).toBeTruthy();
      expect(robotsMeta?.getAttribute("content")).toBe("noindex, follow");
    });

    test(`${page} links back to blog index`, async () => {
      const dom = await loadDom(page);
      const document = dom.window.document;
      const backLink = document.querySelector('.article-nav a[href="./"]');
      expect(backLink, `${page} missing return link`).toBeTruthy();
    });
  }
});
