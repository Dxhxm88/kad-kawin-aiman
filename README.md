# Digital Wedding Card

Plain HTML / CSS / JS wedding invitation with RSVP + wishes stored in Firebase Firestore.

## Files

| File | What it is |
|---|---|
| `config.js` | **All wedding details + Firebase config.** Edit this one. |
| `index.html` | The card (cover → names → greeting → countdown → venue → schedule → RSVP → wishes → contact) |
| `style.css` | Styling (colours are at the top in `:root`) |
| `app.js` | Card behaviour (countdown, RSVP form, wishes list, music) |
| `db.js` | Firestore read/write; falls back to browser storage when Firebase isn't set up |
| `admin.html` | RSVP list for the couple: totals, search, CSV download |
| `firestore.rules` | Security rules to paste into Firebase |
| `serve.py` | Local preview server |

## Preview locally

```powershell
python serve.py
```

Then open http://localhost:5500. (Opening `index.html` by double-click won't work because the JS uses modules.)

Until Firebase is configured the card runs in **demo mode**: RSVPs are saved only in your own browser.

## Personalised links

Add `?to=Name` to the link to show the guest's name on the cover and pre-fill the RSVP:

```
https://your-site.web.app/?to=Ahmad%20%26%20Family
```

## Set up Firebase (free Spark plan is enough)

1. Go to https://console.firebase.google.com → **Add project**.
2. **Build → Firestore Database → Create database** (production mode, region `asia-southeast1` for Malaysia).
3. **Firestore → Rules**: paste the contents of `firestore.rules` → **Publish**.
4. **Project settings (⚙) → Your apps → Web (`</>`)** → register an app → copy the `firebaseConfig` values into `firebase: { ... }` in `config.js`.
5. Reload the page — the demo-mode note disappears and RSVPs go to the `rsvps` collection.

The Firebase web config is not a secret; access is controlled by the rules.

## Deploy

Any static host works. Easiest options:

- **Firebase Hosting**: `npm i -g firebase-tools`, `firebase login`, `firebase init hosting` (public dir = `.`), `firebase deploy`.
- **Netlify / Vercel / GitHub Pages**: upload the folder as-is.

## Notes

- `admin.html` is not password-protected (it only shows what the card already shows publicly: names, attendance, wishes). Don't share its link widely. No phone numbers or emails are collected.
- Guests can't edit or delete RSVPs; remove spam from the Firebase console.
- Background music: put an mp3 in the folder and set `music: "song.mp3"` in `config.js`. It starts when the guest taps **Open Invitation**.
