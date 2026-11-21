# Digital Wedding Card

Plain HTML / CSS / JS wedding invitation, hosted on **Netlify**. RSVPs and wishes are stored as JSON in **Netlify Blobs** (Netlify's built-in storage) by a small Netlify Function.

## Files

| File | What it is |
|---|---|
| `config.js` | **All wedding details.** Edit this one. |
| `index.html` | The card (cover, names, greeting, countdown, venue, schedule, RSVP, wishes, contact) |
| `style.css` | Styling (colours are at the top in `:root`) |
| `app.js` | Card behaviour (countdown, RSVP form, wishes list, music) |
| `effects.js` | Petals, confetti and hearts |
| `db.js` | Talks to the RSVP API (`/api/rsvp`) |
| `netlify/functions/rsvp.mjs` | The RSVP API on Netlify: saves/reads RSVPs as JSON in Netlify Blobs |
| `netlify.toml`, `package.json` | Tell Netlify where the site and function are, and install `@netlify/blobs` |
| `admin.html` | RSVP list for the couple: totals, search, CSV download |
| `serve.py` | Local preview server; also fakes the API and saves to `rsvps.json` |
| `assets/` | Flower and divider artwork |

## Preview on your PC

```powershell
python serve.py
```

Open http://localhost:5500. RSVPs you send locally are saved to `rsvps.json` in this folder (it isn't uploaded to GitHub or Netlify).

## Deploy on Netlify

The site must be deployed **from GitHub** (or with the Netlify CLI) so Netlify builds the function. Drag-and-drop deploys don't include functions.

1. Push this folder to GitHub.
2. Netlify: **Add new site → Import an existing project → GitHub** → pick the repo.
3. Build settings: leave **Build command** empty; **Publish directory** is `.` (already set in `netlify.toml`).
4. Deploy. Every `git push` redeploys automatically.

Netlify Blobs needs no setup; the storage is created the first time someone sends an RSVP.

Check it works: open your site in two different browsers/phones, send an RSVP from one, and it should appear in the wishes list on the other (it refreshes every 15 seconds).

## Seeing the RSVPs

- **`/admin.html`** on your site: totals, search, and **Download CSV** (opens in Excel).
- **Netlify dashboard → your site → Blobs → `rsvps`**: every RSVP is one JSON entry; you can delete spam here.

## Personalised links

Add `?to=Name` to the link to show the guest's name on the cover and pre-fill the RSVP:

```
https://your-site.netlify.app/?to=Ahmad%20%26%20Family
```

## Notes

- If the API can't be reached (for example the page is opened from a plain file server), the card falls back to **demo mode** and RSVPs are saved only in that browser. A note under the form says so.
- `admin.html` is not password-protected (it shows the same names and wishes the card shows publicly). Don't share its link widely. No phone numbers or emails are collected.
- A hidden "website" field in the form catches simple spam bots.
- Background music: put an mp3 in the folder and set `music: "song.mp3"` in `config.js`. It starts when the guest taps **Buka Jemputan**.
