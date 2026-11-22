/* =========================================================
   WEDDING DETAILS — edit everything here, no need to touch
   the other files.
   ========================================================= */
window.WEDDING = {
  groom: "Aiman",
  bride: "Maira",
  groomFull: "Muhammad Aiman Azim Bin Roslan",
  brideFull: "Noorumaira Binti Mahmud",

  // Parents / hosts line shown under the opening greeting
  hosts: "Rosaini Bin Halil & Zalinah Binti Karim",

  greeting: "Dengan limpah kurnia dan keberkatan Allah SWT, kami dengan sukacitanya menjemput Dato'/Datin/Tuan/Puan/Encik/Cik ke majlis resepsi perkahwinan puteri kami.",

  // Event date & time (local time). Used for countdown + calendar.
  date: "2027-01-03T11:00:00+08:00",
  endDate: "2027-01-03T16:00:00+08:00",
  dateLabel: "Ahad, 03 Januari 2027",
  timeLabel: "11:00 AM – 4:00 PM",

  venueName: "Arjuna Melaka",
  venueAddress: "Lot 1341, Jalan Syed Ab. Aziz, 75000 Melaka, Malaysia",
  googleMaps: "https://maps.app.goo.gl/1wR6qpAVDZvjTpux5",
  waze: "https://ul.waze.com/ul?place=ChIJt9Dj7G7x0TERmFCf1T2QhVM&ll=2.18803760%2C102.24662630&navigate=yes&utm_campaign=live_map&utm_source=waze_app&utm_medium=lm_share_location",

  schedule: [
    { time: "11:00 AM", title: "Ketibaan Tetamu" },
    { time: "12:30 PM", title: "Majlis Bersanding" },
    { time: "1:00 PM",  title: "Sesi Makan Beradap" },
    { time: "4:00 PM",  title: "Majlis Tamat" },
  ],

  contacts: [
    { name: "Sanie/Unie", phone: "+60106605243" },
    { name: "Ina",   phone: "+60126141841" },
    { name: "Balqis",   phone: "+601111291305" },
  ],

  // Last day guests can RSVP (shown on the form). Set to "" to hide.
  rsvpDeadline: "15 Disember 2026",
  maxPax: 10,

  // Optional background music (mp3 path or URL). "" to disable.
  music: "audio.mp3",

  // Money gift (Salam Kaut). Shown as a small fold-out near the end of the card.
  // Put your bank / DuitNow QR image in the assets folder and set its path below.
  // Set enabled: false to hide the whole section.
  gift: {
    enabled: true,
    bankName: "Maybank",
    accountName: "Muhammad Aiman Azim Bin Roslan",
    accountNumber: "1560 7605 9053",
    qr: "assets/qr.jpeg",
  },
};
