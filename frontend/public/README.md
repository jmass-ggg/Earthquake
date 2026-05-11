QuakeGuard assets

Place these files in /public/ before testing:

1. /public/alarm.mp3
   - Looping alarm/siren sound used during emergency.
   - Any short MP3 will work; it loops automatically.

2. /public/icons/icon-192.png
3. /public/icons/icon-512.png
   - PWA icons referenced by manifest.json and sw.js.

Run:
  npm install   (or: bun install)
  npm run dev

Backend base URL is http://127.0.0.1:8000
To override at runtime, set window.__QUAKEGUARD_API__ before the app loads.
To set a VAPID public key for web push, set window.__QUAKEGUARD_VAPID__.
