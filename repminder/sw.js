const cacheName = "repminder-v27";
const assets = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./assets/SINEDITOR_1080-1920.png",
  "./assets/sineditor-live-wallpaper.mp4",
  "./assets/mermaid-1080-1920.jpg",
  "./assets/mermaid-live-wallpaper.mp4",
  "./assets/lilian-1080-1920.png",
  "./assets/lilian-live-wallpaper.mp4",
  "./assets/voice-hello.m4a",
  "./assets/voice-done.m4a",
  "./assets/voice-complete.m4a",
  "./assets/voice-reminder.m4a",
  "./assets/voice-mermaid-hello.m4a",
  "./assets/voice-mermaid-done.m4a",
  "./assets/voice-mermaid-complete.m4a",
  "./assets/voice-mermaid-reminder.m4a",
  "./assets/voice-lilian-hello.m4a",
  "./assets/voice-lilian-done.m4a",
  "./assets/voice-lilian-complete.m4a",
  "./assets/voice-lilian-reminder.m4a",
  "./assets/voice-day-1.m4a",
  "./assets/voice-day-2.m4a",
  "./assets/voice-day-3.m4a",
  "./assets/voice-day-4.m4a",
  "./assets/voice-day-5.m4a",
  "./assets/voice-day-6.m4a",
  "./assets/voice-day-7.m4a",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-192.svg",
  "./icons/icon-512.svg"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(assets)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== cacheName).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(cacheName).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
