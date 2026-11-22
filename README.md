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
| `admin.html` | RSVP list for the couple (needs the admin PIN): totals, search, CSV download |
| `scripts/site-url.mjs` | Runs on Netlify at deploy: puts the site's address into the WhatsApp link preview |
| `serve.py` | Local preview server; also fakes the API and saves to `rsvps.json` |
| `assets/` | Wood, flower and divider artwork, `og.jpg` (link preview image), bank QR |

## Preview on your PC

```powershell
python serve.py
```

Open http://localhost:5500. The local admin PIN is `1234`. RSVPs you send locally are saved to `rsvps.json` in this folder (it isn't uploaded to GitHub or Netlify).

## Deploy on Netlify

The site must be deployed **from GitHub** (or with the Netlify CLI) so Netlify builds the function. Drag-and-drop deploys don't include functions.

1. Push this folder to GitHub.
2. Netlify: **Add new site → Import an existing project → GitHub** → pick the repo.
3. Build settings: leave **Build command** empty; **Publish directory** is `.` (already set in `netlify.toml`).
4. Deploy. Every `git push` redeploys automatically.

Netlify Blobs needs no setup; the storage is created the first time someone sends an RSVP.

**Set the admin PIN (once):** Netlify → your site → **Site configuration → Environment variables → Add a variable**: key `ADMIN_PIN`, value your PIN (use 6+ digits, or a word). Then **Deploys → Trigger deploy**. Until it's set, `admin.html` won't open.

Check it works: open your site in two different browsers/phones, send an RSVP from one, and it should appear in the wishes list on the other (it refreshes every 15 seconds).

## Seeing the RSVPs

- **`/admin.html`** on your site: enter the PIN, then totals, search, and **Download CSV** (opens in Excel). The PIN is checked by the server; the card itself only receives the totals and the wishes, not the full list.
- **Netlify dashboard → your site → Blobs → `rsvps`**: every RSVP is one JSON entry; you can delete spam here.

## Personalised links

Add `?to=Name` to the link to show the guest's name on the cover and pre-fill the RSVP:

```
https://your-site.netlify.app/?to=Ahmad%20%26%20Family
```

## Wedding day mode

The countdown card changes by itself (Malaysia time):
- **On 3 Jan 2027:** "Hari Ini!" with an extra confetti burst when the card is opened.
- **After the wedding:** "Terima Kasih" message.

Preview them with `?hari=ini` or `?hari=selepas` at the end of the link.

## Hidden surprises (easter eggs)

- Tap **#AimanMairaEVERAFTER** in the footer: hearts, a sweet note, and the hashtag is copied.
- Press and hold the **&** between the big names: the wedding date in the Hijri calendar.
- Tap the **Saat** box in the countdown 5 times quickly.
- **Shake the phone** (Android): a shower of petals. iPhones would ask for motion permission first, so it's off there.

## Link preview (WhatsApp)

`assets/og.jpg` is the picture shown when the link is shared. Netlify fills in the site address automatically on deploy. WhatsApp remembers a preview for a while, so if you've already shared the link, a new preview may only show for new chats or after adding something like `?v=2` to the link.

## Notes

- If the API can't be reached (for example the page is opened from a plain file server), the card falls back to **demo mode** and RSVPs are saved only in that browser. A note under the form says so.
- `admin.html` is protected by the `ADMIN_PIN`. Wrong guesses are slowed down, but keep the PIN longer than 4 digits. No phone numbers or emails are collected.
- A hidden "website" field in the form catches simple spam bots.
- Money gift (Salam Kaut): save your bank / DuitNow QR as `assets/qr.png` (or change `gift.qr` in `config.js`) and fill in the bank details there. It shows as a small fold-out above the contacts. If the QR image is missing, only the account details are shown. Set `gift.enabled: false` to hide it.
- Background music: put an mp3 in the folder and set `music: "song.mp3"` in `config.js`. It starts when the guest taps **Buka Jemputan**.
