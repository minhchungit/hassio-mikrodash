"use strict";
(() => {
  // src/entry/preflight.ts
  if (sessionStorage.getItem("justLoggedIn")) {
    document.documentElement.style.opacity = "0";
  }
  try {
    const nav = JSON.parse(localStorage.getItem("mkd_nav_prefs") || "null") || {};
    const root = document.documentElement;
    root.setAttribute("data-nav", nav.grouped === false ? "flat" : "grouped");
    const open = (Array.isArray(nav.expanded) ? nav.expanded : []).filter((k) => typeof k === "string" && /^[a-z]{2,20}$/.test(k));
    if (open.length) {
      const st = document.createElement("style");
      st.id = "navBoot";
      st.textContent = open.map((k) => '.nav-group[data-cat="' + k + '"]>.nav-group-body{display:flex}').join("");
      document.head.appendChild(st);
    }
  } catch {
  }
})();
