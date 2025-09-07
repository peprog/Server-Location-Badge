// background.js — Stable-safe: DNS over HTTPS (dns.google) -> ipwho.is

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get({ enabled: true }, (v) => {
    if (v.enabled === undefined) chrome.storage.sync.set({ enabled: true });
  });
});

// hostname -> { ip, country, country_code, city, ts }
const cache = new Map();
const TTL_MS = 5 * 60 * 1000;

// Resolve hostname to IP (A first, then AAAA) using Google DoH
async function resolveHost(hostname) {
  // A record
  try {
    const aRes = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=A`);
    const aJson = await aRes.json();
    const a = (aJson && Array.isArray(aJson.Answer)) ? aJson.Answer.find(r => r.type === 1) : null; // 1 = A
    if (a && a.data) return a.data.trim();
  } catch {}

  // AAAA record
  try {
    const aaaaRes = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=AAAA`);
    const aaaaJson = await aaaaRes.json();
    const aaaa = (aaaaJson && Array.isArray(aaaaJson.Answer)) ? aaaaJson.Answer.find(r => r.type === 28) : null; // 28 = AAAA
    if (aaaa && aaaa.data) return aaaa.data.trim();
  } catch {}

  return null;
}

async function geoIp(ip) {
  try {
    const r = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`);
    const j = await r.json();
    if (!j || j.success === false) return null;
    return {
      ip,
      country: j.country || "",
      country_code: (j.country_code || "").toUpperCase(),
      city: j.city || ""
    };
  } catch {
    return null;
  }
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  (async () => {
    if (!msg || msg.type !== "RESOLVE_HOST") return;
    const { hostname } = msg;
    const tabId = sender?.tab?.id;
    if (!hostname || tabId == null) return;

    const { enabled } = await chrome.storage.sync.get({ enabled: true });
    if (!enabled) {
      chrome.tabs.sendMessage(tabId, { type: "SERVER_LOCATION_CLEAR" }).catch(() => {});
      return;
    }

    const now = Date.now();
    const cached = cache.get(hostname);
    if (cached && (now - cached.ts) < TTL_MS) {
      chrome.tabs.sendMessage(tabId, { type: "SERVER_LOCATION_DATA", payload: cached }).catch(() => {});
      return;
    }

    // 1) Resolve host -> IP via DoH
    const ip = await resolveHost(hostname);
    if (!ip) {
      chrome.tabs.sendMessage(tabId, { type: "SERVER_LOCATION_DATA", payload: null }).catch(() => {});
      return;
    }

    // 2) Geo lookup
    const g = await geoIp(ip);
    const payload = g ? { ...g, ts: now } : { ip, country: "", country_code: "", city: "", ts: now };

    cache.set(hostname, payload);
    chrome.tabs.sendMessage(tabId, { type: "SERVER_LOCATION_DATA", payload }).catch(() => {});
  })();

  return false; // not using sendResponse
});

// Optional: react to toggle changes if you have a popup switch
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync" || !changes.enabled) return;
  const enabled = changes.enabled.newValue;
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (!tab.id) continue;
      chrome.tabs.sendMessage(tab.id, {
        type: enabled ? "SERVER_LOCATION_DATA" : "SERVER_LOCATION_CLEAR",
        payload: null
      }).catch(() => {});
    }
  });
});