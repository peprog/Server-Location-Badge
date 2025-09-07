// popup.js
const toggle = document.getElementById("toggle");
const siteEl = document.getElementById("site");

// init toggle state
chrome.storage.sync.get({ enabled: true }, ({ enabled }) => {
  toggle.checked = !!enabled;
});

// reflect changes immediately
toggle.addEventListener("change", async () => {
  await chrome.storage.sync.set({ enabled: toggle.checked });
});

// show current site hostname
(async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) throw new Error("no tab url");
    const u = new URL(tab.url);
    if (u.protocol === "http:" || u.protocol === "https:") {
      siteEl.textContent = u.hostname;
    } else {
      siteEl.textContent = "Unavailable (non-web page)";
    }
  } catch {
    siteEl.textContent = "Unavailable";
  }
})();