# Privacy Policy — Server Location Badge

This extension shows the IP address and country/city/flag of the server for each website you visit.

It works by:
- Sending the hostname of the active site to Google's DNS-over-HTTPS service (`dns.google`) to resolve the IP.
- Sending that IP to `ipwho.is` to retrieve location data.

## Data Collection
- We do **not** collect, log, or share any personal data.
- All lookups are transient and only used to show the badge.
- Preferences (enable/disable, per-site dismissal) are stored locally using Chrome `storage`.

## Contact
If you have any questions, open an issue on this repository.