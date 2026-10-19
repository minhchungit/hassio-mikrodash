"use strict";
(() => {
  // src/gen/appearance-tables.ts
  var FONTS = [
    {
      "id": "system",
      "family": 'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'
    },
    {
      "id": "syne",
      "family": "'Syne',sans-serif"
    },
    {
      "id": "geist",
      "family": "'Geist',sans-serif"
    },
    {
      "id": "inter",
      "family": "'Inter',sans-serif"
    },
    {
      "id": "plus-jakarta",
      "family": "'Plus Jakarta Sans',sans-serif"
    },
    {
      "id": "dm-sans",
      "family": "'DM Sans',sans-serif"
    },
    {
      "id": "outfit",
      "family": "'Outfit',sans-serif"
    },
    {
      "id": "space-grotesk",
      "family": "'Space Grotesk',sans-serif"
    },
    {
      "id": "sofia-sans",
      "family": "'Sofia Sans',sans-serif"
    },
    {
      "id": "nunito",
      "family": "'Nunito',sans-serif"
    },
    {
      "id": "poppins",
      "family": "'Poppins',sans-serif"
    },
    {
      "id": "montserrat",
      "family": "'Montserrat',sans-serif"
    },
    {
      "id": "raleway",
      "family": "'Raleway',sans-serif"
    },
    {
      "id": "manrope",
      "family": "'Manrope',sans-serif"
    },
    {
      "id": "roboto",
      "family": "'Roboto',sans-serif"
    },
    {
      "id": "open-sans",
      "family": "'Open Sans',sans-serif"
    },
    {
      "id": "lato",
      "family": "'Lato',sans-serif"
    },
    {
      "id": "source-sans",
      "family": "'Source Sans 3',sans-serif"
    },
    {
      "id": "work-sans",
      "family": "'Work Sans',sans-serif"
    },
    {
      "id": "fira-sans",
      "family": "'Fira Sans',sans-serif"
    },
    {
      "id": "jetbrains-mono",
      "family": "'JetBrains Mono',monospace"
    },
    {
      "id": "fira-code",
      "family": "'Fira Code',monospace"
    },
    {
      "id": "quicksand",
      "family": "'Quicksand',sans-serif"
    },
    {
      "id": "comfortaa",
      "family": "'Comfortaa',sans-serif"
    },
    {
      "id": "ibm-plex-sans",
      "family": "'IBM Plex Sans',sans-serif"
    },
    {
      "id": "oxanium",
      "family": "'Oxanium',sans-serif"
    },
    {
      "id": "orbitron",
      "family": "'Orbitron',sans-serif"
    }
  ];

  // src/branding.ts
  var DEFAULT_NAME = "MikroDash";
  var DEFAULT_ICON = "/logo.png";
  var DEFAULT_BRANDING = {
    name: "",
    displayName: DEFAULT_NAME,
    font: "",
    icon: DEFAULT_ICON,
    customIcon: false
  };
  var ICON_URL = /^\/(?:logo\.png|brand\/icon\.png\?v=\d+)$/;
  function normaliseBranding(raw) {
    if (!raw || typeof raw !== "object") return { ...DEFAULT_BRANDING };
    const r = raw;
    const name = typeof r.name === "string" ? r.name : "";
    const font = typeof r.font === "string" ? r.font : "";
    const icon = typeof r.icon === "string" && ICON_URL.test(r.icon) ? r.icon : DEFAULT_ICON;
    return { name, displayName: name || DEFAULT_NAME, font, icon, customIcon: icon !== DEFAULT_ICON };
  }
  function fontFamily(id) {
    if (!id) return "";
    const f = FONTS.find((x) => x.id === id);
    return f ? f.family : "";
  }
  function renderWordmark(target, name, font) {
    target.textContent = "";
    if (name) {
      target.appendChild(document.createTextNode(name));
    } else {
      target.appendChild(document.createTextNode("Mikro"));
      const accent = document.createElement("span");
      accent.textContent = "Dash";
      target.appendChild(accent);
    }
    const family = fontFamily(font);
    if (family) target.style.setProperty("font-family", family);
    else target.style.removeProperty("font-family");
  }
  function applyBranding(b, titleSuffix = "") {
    const top = document.getElementById("topbarLogo");
    if (top) renderWordmark(top, b.name, b.font);
    const loginName = document.querySelector(".login-brand-name");
    if (loginName) {
      loginName.textContent = b.displayName;
      const family = fontFamily(b.font);
      if (family) loginName.style.setProperty("font-family", family);
      else loginName.style.removeProperty("font-family");
    }
    document.querySelectorAll(".nav-logo img, .login-brand img").forEach((img) => {
      img.src = b.icon;
      img.alt = b.displayName;
    });
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) favicon.href = b.icon;
    document.title = b.displayName + titleSuffix;
  }
  function loadBranding(titleSuffix = "") {
    return fetch("/api/branding", { credentials: "same-origin" }).then((r) => r.ok ? r.json() : null).then((j) => {
      const b = normaliseBranding(j);
      applyBranding(b, titleSuffix);
      return b;
    }).catch(() => ({ ...DEFAULT_BRANDING }));
  }

  // src/entry/login.ts
  var byId = (id) => document.getElementById(id);
  function showError(elId, msg) {
    const el = byId(elId);
    if (!el) return;
    el.textContent = msg;
    el.classList.add("visible");
  }
  function clearError(elId) {
    const el = byId(elId);
    if (!el) return;
    el.textContent = "";
    el.classList.remove("visible");
  }
  function safeNext() {
    try {
      const raw = new URLSearchParams(window.location.search).get("next");
      if (!raw || /[\u0000-\u001f]/.test(raw)) return "/";
      const u = new URL(raw, window.location.origin);
      if (u.origin !== window.location.origin) return "/";
      const p = u.pathname + u.search + u.hash;
      if (p.charAt(0) !== "/" || p.charAt(1) === "/" || p.charAt(1) === "\\") return "/";
      return p;
    } catch {
    }
    return "/";
  }
  function enterApp() {
    sessionStorage.setItem("justLoggedIn", "1");
    document.body.style.transition = "opacity 1s ease";
    document.body.style.opacity = "0";
    setTimeout(() => {
      window.location.replace(safeNext());
    }, 1e3);
  }
  var SSO_ICON = /^\/brand\/sso\/[0-9a-f]{8,64}\.png\?v=\d+$/;
  function renderSSO() {
    const host = byId("ssoButtons");
    if (!host) return;
    void fetch("/api/auth/sso/providers", { credentials: "same-origin" }).then((r) => r.json()).then((d) => {
      const list = Array.isArray(d.providers) ? d.providers : [];
      if (!list.length) return;
      const next = new URLSearchParams(window.location.search).get("next") || "";
      host.innerHTML = '<div class="sso-sep">or</div>';
      list.forEach((p) => {
        if (!p || typeof p.id !== "string" || typeof p.name !== "string") return;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn-sso";
        if (typeof p.icon === "string" && SSO_ICON.test(p.icon)) {
          const img = document.createElement("img");
          img.src = p.icon;
          img.alt = "";
          btn.appendChild(img);
        }
        const label = document.createElement("span");
        label.textContent = "Sign in with " + p.name;
        btn.appendChild(label);
        btn.addEventListener("click", () => {
          window.location.href = "/api/auth/sso/" + encodeURIComponent(p.id) + "/start" + (next ? "?next=" + encodeURIComponent(next) : "");
        });
        host.appendChild(btn);
      });
    }).catch(() => {
    });
  }
  function showSSOError() {
    const q = new URLSearchParams(window.location.search);
    const code = q.get("err");
    if (!code) return;
    const said = {
      denied: "Your identity provider did not let you in, or you have no role here.",
      expired: "That sign-in took too long, or was already used. Please try again.",
      config: "This provider is not configured in a way that can work yet.",
      provider: "The identity provider could not be reached.",
      token: "The identity provider's answer could not be trusted."
    };
    const ref = q.get("ref");
    showError("loginError", (said[code] || "Sign in failed.") + (ref ? " (reference " + ref + ")" : ""));
  }
  function main() {
    void loadBranding(" - Sign In");
    const loginView = byId("loginView");
    const firstRunView = byId("firstRunView");
    const loadingView = byId("loadingView");
    void fetch("/api/auth/status").then((r) => r.json()).then((d) => {
      if (loadingView) loadingView.style.display = "none";
      if (d.firstRun) {
        if (firstRunView) firstRunView.style.display = "";
        byId("setupCode")?.focus();
      } else {
        if (loginView) loginView.style.display = "";
        if (new URLSearchParams(window.location.search).get("sso") === "1" && d.session) {
          enterApp();
          return;
        }
        showSSOError();
        renderSSO();
        byId("loginUser")?.focus();
      }
    }).catch(() => {
      if (loadingView) loadingView.style.display = "none";
      if (loginView) loginView.style.display = "";
    });
    function doLogin() {
      clearError("loginError");
      const username = byId("loginUser")?.value.trim() || "";
      const password = byId("loginPass")?.value || "";
      if (!username || !password) {
        showError("loginError", "Please enter username and password.");
        return;
      }
      const btn = byId("loginBtn");
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Signing in\u2026";
      }
      void fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      }).then((r) => r.json()).then((d) => {
        if (d.ok) {
          enterApp();
        } else {
          if (btn) {
            btn.disabled = false;
            btn.textContent = "Sign In";
          }
          showError("loginError", d.error || "Sign in failed.");
        }
      }).catch(() => {
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Sign In";
        }
        showError("loginError", "Network error. Please try again.");
      });
    }
    byId("loginBtn")?.addEventListener("click", doLogin);
    byId("loginPass")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") doLogin();
    });
    byId("loginUser")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") byId("loginPass")?.focus();
    });
    function doSetup() {
      clearError("setupError");
      const setupCode = byId("setupCode")?.value.trim() || "";
      const username = byId("setupUser")?.value.trim() || "";
      const password = byId("setupPass")?.value || "";
      const confirm = byId("setupPass2")?.value || "";
      if (!setupCode) {
        showError("setupError", "Enter the setup code from MikroDash's log.");
        return;
      }
      if (!username) {
        showError("setupError", "Username is required.");
        return;
      }
      if (password.length < 4) {
        showError("setupError", "Password must be at least 4 characters.");
        return;
      }
      if (password !== confirm) {
        showError("setupError", "Passwords do not match.");
        return;
      }
      const btn = byId("setupBtn");
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Creating account\u2026";
      }
      void fetch("/api/users/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, setupCode })
      }).then((r) => r.json()).then((d) => {
        if (d.ok) {
          if (firstRunView) firstRunView.style.display = "none";
          if (loginView) loginView.style.display = "";
          const u = byId("loginUser");
          if (u) u.value = username;
          byId("loginPass")?.focus();
        } else {
          if (btn) {
            btn.disabled = false;
            btn.textContent = "Create Account";
          }
          showError("setupError", d.error || "Setup failed.");
        }
      }).catch(() => {
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Create Account";
        }
        showError("setupError", "Network error. Please try again.");
      });
    }
    byId("setupBtn")?.addEventListener("click", doSetup);
    byId("setupPass2")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") doSetup();
    });
  }
  main();
})();
