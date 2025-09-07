// contentScript.js

(function () {
  if (window.top !== window) return; // only act on top frame

  const ID = "__server_location_badge__";
  const TEXT_ID = "__server_location_badge_text__";
  const BTN_ID = "__server_location_close__";
  const IP_ID = "__server_location_ip__";
  const TOAST_ID = "__server_location_toast__";
  const DISMISS_KEY = (host) => `dismissed_${host}`;

  // Normalize any Arabic-Indic digits to ASCII 0-9 to avoid localized numeral glyphs
  function toLatinDigits(str = "") {
    return String(str)
      // Arabic-Indic (U+0660–U+0669)
      .replace(/[\u0660-\u0669]/g, d => d.charCodeAt(0) - 0x0660)
      // Extended Arabic-Indic (Persian) (U+06F0–U+06F9)
      .replace(/[\u06F0-\u06F9]/g, d => d.charCodeAt(0) - 0x06F0);
  }

  function ccToFlagEmoji(cc) {
    if (!cc || cc.length !== 2) return "🌐";
    const A = 0x1F1E6;
    const base = "A".charCodeAt(0);
    const chars = cc.toUpperCase().split("").map(c => String.fromCodePoint(A + (c.charCodeAt(0) - base)));
    return chars.join("");
  }

  function ensureBadge() {
    let el = document.getElementById(ID);
    if (el) return el;

    el = document.createElement("div");
    el.id = ID;

    // Force English/LTR independent of page
    el.setAttribute("dir", "ltr");
    el.setAttribute("lang", "en");
    el.style.direction = "ltr";
    el.style.unicodeBidi = "isolate"; // isolate bidi context

    el.style.position = "fixed";
    el.style.left = "10px";
    el.style.bottom = "10px";
    el.style.zIndex = "2147483647";
    el.style.pointerEvents = "auto"; // allow clicks
    el.style.userSelect = "none";
    el.style.textAlign = "left";
    el.style.isolation = "isolate";

    // Visuals
    el.style.padding = "6px 8px 6px 10px";
    el.style.borderRadius = "12px";
    el.style.fontFamily =
      "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif"; // Latin-first stack
    el.style.fontSize = "12px";
    el.style.fontVariantNumeric = "tabular-nums lining-nums";
    el.style.lineHeight = "1";
    el.style.boxShadow = "0 4px 12px rgba(0,0,0,.2)";
    el.style.background = "rgba(0,0,0,.72)";
    el.style.color = "#fff";
    el.style.backdropFilter = "blur(4px)";
    el.style.display = "inline-flex";
    el.style.alignItems = "center";
    el.style.gap = "8px";
    el.style.maxWidth = "60vw";
    el.style.whiteSpace = "nowrap";
    el.style.overflow = "hidden";
    el.style.textOverflow = "ellipsis";

    // Text container
    const textWrap = document.createElement("span");
    textWrap.id = TEXT_ID;
    textWrap.style.display = "inline-flex";
    textWrap.style.alignItems = "center";
    textWrap.style.gap = "6px";
    textWrap.style.overflow = "hidden";
    textWrap.style.textOverflow = "ellipsis";
    textWrap.setAttribute("dir", "ltr");
    textWrap.setAttribute("lang", "en");
    el.appendChild(textWrap);

    // Close button
    const btn = document.createElement("button");
    btn.id = BTN_ID;
    btn.textContent = "×";
    btn.setAttribute("aria-label", "Close server location badge");
    btn.style.all = "unset";
    btn.style.cursor = "pointer";
    btn.style.width = "18px";
    btn.style.height = "18px";
    btn.style.display = "inline-flex";
    btn.style.alignItems = "center";
    btn.style.justifyContent = "center";
    btn.style.borderRadius = "50%";
    btn.style.fontSize = "14px";
    btn.style.lineHeight = "1";
    btn.style.opacity = "0.85";
    btn.style.padding = "0";
    btn.style.marginLeft = "2px";
    btn.style.transition = "background .15s ease, opacity .15s ease";
    btn.onmouseenter = () => (btn.style.opacity = "1");
    btn.onmouseleave = () => (btn.style.opacity = "0.85");
    btn.onmousedown = (e) => e.stopPropagation();
    btn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const host = location.hostname;
      try {
        await chrome.storage.session.set({ [DISMISS_KEY(host)]: true });
      } catch {}
      clearBadge();
    };
    btn.onmouseover = () => (btn.style.background = "rgba(255,255,255,.15)");
    btn.onmouseout  = () => (btn.style.background = "transparent");
    el.appendChild(btn);

    document.documentElement.appendChild(el);
    return el;
  }

  function ensureToast() {
    let t = document.getElementById(TOAST_ID);
    if (t) return t;
    t = document.createElement("div");
    t.id = TOAST_ID;

    // Force English/LTR
    t.setAttribute("dir", "ltr");
    t.setAttribute("lang", "en");
    t.style.direction = "ltr";
    t.style.unicodeBidi = "isolate";

    t.style.position = "fixed";
    t.style.left = "12px";
    t.style.bottom = "42px";
    t.style.zIndex = "2147483647";
    t.style.padding = "6px 8px";
    t.style.borderRadius = "8px";
    t.style.fontFamily = "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
    t.style.fontSize = "12px";
    t.style.fontVariantNumeric = "tabular-nums lining-nums";
    t.style.background = "rgba(0,0,0,.85)";
    t.style.color = "#fff";
    t.style.boxShadow = "0 4px 12px rgba(0,0,0,.2)";
    t.style.opacity = "0";
    t.style.transition = "opacity .18s ease, transform .18s ease";
    t.style.transform = "translateY(6px)";
    t.style.pointerEvents = "none";
    t.textContent = "";
    document.documentElement.appendChild(t);
    return t;
  }

  function showToast(msg) {
    const t = ensureToast();
    t.textContent = toLatinDigits(msg);
    requestAnimationFrame(() => {
      t.style.opacity = "1";
      t.style.transform = "translateY(0)";
      setTimeout(() => {
        t.style.opacity = "0";
        t.style.transform = "translateY(6px)";
      }, 1200);
    });
  }

  function clearBadge() {
    const el = document.getElementById(ID);
    if (el) el.style.display = "none";
  }

  function setBadgeEmpty(text = "🌐") {
    const el = ensureBadge();
    const container = el.querySelector(`#${TEXT_ID}`);
    container.innerHTML = "";
    const span = document.createElement("span");
    span.textContent = toLatinDigits(text);
    span.setAttribute("dir", "ltr");
    span.setAttribute("lang", "en");
    container.appendChild(span);
    el.style.display = "inline-flex";
  }

  function setBadgeData({ flag, ip, country, city }) {
    const el = ensureBadge();
    const container = el.querySelector(`#${TEXT_ID}`);
    container.innerHTML = "";

    // Flag
    const flagEl = document.createElement("span");
    flagEl.textContent = flag || "🌐";
    flagEl.setAttribute("dir", "ltr");
    flagEl.setAttribute("lang", "en");
    container.appendChild(flagEl);

    // IP (clickable)
    const ipBtn = document.createElement("button");
    ipBtn.id = IP_ID;
    ipBtn.textContent = toLatinDigits(ip || "");
    ipBtn.title = "Click to copy IP";
    ipBtn.style.all = "unset";
    ipBtn.style.cursor = ip ? "pointer" : "default";
    ipBtn.style.fontWeight = "600";
    ipBtn.style.padding = "1px 2px";
    ipBtn.style.borderRadius = "4px";
    ipBtn.style.transition = "background .15s ease, color .15s ease";
    ipBtn.style.whiteSpace = "nowrap";
    ipBtn.setAttribute("dir", "ltr");
    ipBtn.setAttribute("lang", "en");
    if (ip) {
      ipBtn.onmouseover = () => { ipBtn.style.background = "rgba(255,255,255,.15)"; };
      ipBtn.onmouseout  = () => { ipBtn.style.background = "transparent"; };
      ipBtn.onclick = async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(ip);
          showToast("IP copied");
        } catch {
          // Fallback
          const ta = document.createElement("textarea");
          ta.value = ip;
          ta.style.position = "fixed";
          ta.style.left = "-9999px";
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand("copy"); showToast("IP copied"); } catch {}
          document.body.removeChild(ta);
        }
      };
      ipBtn.onkeydown = async (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          ipBtn.click();
        }
      };
    }
    container.appendChild(ipBtn);

    // Country / City
    const meta = [];
    if (country) meta.push(toLatinDigits(country));
    if (city)    meta.push(toLatinDigits(city));
    if (meta.length) {
      const metaEl = document.createElement("span");
      metaEl.textContent = "· " + meta.join(" · ");
      metaEl.style.opacity = "0.9";
      metaEl.style.whiteSpace = "nowrap";
      metaEl.setAttribute("dir", "ltr");
      metaEl.setAttribute("lang", "en");
      container.appendChild(metaEl);
    }

    el.style.display = "inline-flex";
  }

  async function isDismissed() {
    try {
      const key = DISMISS_KEY(location.hostname);
      const obj = await chrome.storage.session.get(key);
      return !!obj[key];
    } catch {
      return false;
    }
  }

  // ----- Kick off: ask background to resolve the current hostname -----
  async function requestResolve() {
    if (await isDismissed()) {
      clearBadge();
      return;
    }

    const { enabled } = await chrome.storage.sync.get({ enabled: true });
    if (!enabled) {
      clearBadge();
      return;
    }

    setBadgeEmpty("🌐 resolving…");
    try {
      const hostname = location.hostname;
      chrome.runtime.sendMessage({ type: "RESOLVE_HOST", hostname });
    } catch {
      setBadgeEmpty("🌐");
    }
  }

  // Initial run
  requestResolve();

  // Re-run on traditional nav and SPA route changes
  window.addEventListener("pageshow", () => requestResolve());
  (function hookHistory() {
    const origPush = history.pushState;
    const origReplace = history.replaceState;
    function wrap(fn) {
      return function () {
        const before = location.href;
        const r = fn.apply(this, arguments);
        if (before !== location.href) requestResolve();
        return r;
      };
    }
    history.pushState = wrap(origPush);
    history.replaceState = wrap(origReplace);
    window.addEventListener("popstate", () => requestResolve());
  })();

  // Listen to background responses
  chrome.runtime.onMessage.addListener(async (msg) => {
    if (!msg || !msg.type) return;

    if (msg.type === "SERVER_LOCATION_CLEAR") {
      clearBadge();
      return;
    }

    if (msg.type === "SERVER_LOCATION_DATA") {
      if (await isDismissed()) {
        clearBadge();
        return;
      }
      const p = msg.payload;
      if (!p) {
        setBadgeEmpty("🌐");
        return;
      }
      const flag = ccToFlagEmoji(p.country_code);
      const country = p.country || p.country_code || "";
      const ip = p.ip || "";
      const city = p.city || "";
      setBadgeData({ flag, ip, country, city });
    }
  });
})();