# 🌍 Server Location Badge

A lightweight Chrome extension that shows the **server IP address and location** (country, city, flag) of the website you are visiting.

🔗 **Install from Chrome Web Store**: [Chrome Store Link](https://chromewebstore.google.com/detail/server-location-badge/ndmhhcgpgchjiilmmlhfamopafcncdfg?authuser=0&hl=en)


---

## ✨ Features
- 🌍 Instant server details — see IP, country, city, and flag at the bottom-left of each page
- 📋 One-click copy — click the IP to copy it to clipboard with a toast
- ❌ Hide anytime — close the badge with the × button per site
- ⚙️ Easy toggle — enable/disable from the extension popup
- 🎨 Consistent design — always English, LTR, Latin numerals even on RTL sites

---

## 🔒 Privacy
This extension:
- Does not collect, track, or store any personal data.
- Resolves hostnames using `dns.google` (DNS-over-HTTPS).
- Uses `ipwho.is` to retrieve geolocation for IPs.
- All data is used only transiently to show the badge.

See [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) for details.

---

## 🛠 Development
1. Clone this repo
2. Go to `chrome://extensions` → enable **Developer mode**
3. Click **Load unpacked** → select `/extension`
4. Enjoy 🎉
