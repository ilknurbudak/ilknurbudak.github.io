import { PAGES } from "./stages.js";

export function mountNav(activeHref) {
  const nav = document.createElement("nav");
  nav.className = "book";
  for (const p of PAGES) {
    const a = document.createElement("a");
    a.href = p.href;
    a.textContent = p.label;
    if (p.href === activeHref) a.className = "here";
    nav.appendChild(a);
  }
  document.body.prepend(nav);
  mountKunye(activeHref);
}

// Künye: sitedeki diğer işlerle aynı — difference ile zemine göre terslenir.
function mountKunye(activeHref) {
  const page = PAGES.find((p) => p.href === activeHref);
  const k = document.createElement("div");
  k.className = "kunye";
  k.innerHTML =
    '<span class="ad">İLKNUR BUDAK</span>' +
    '<span class="eser">The Recursive Human</span>' +
    '<span class="model">' + (page ? page.label : "") + "</span>";
  document.body.appendChild(k);
}
