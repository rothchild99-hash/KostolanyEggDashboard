/* 서비스워커 v3
 * 모바일(홈 화면 바로가기/PWA)에서 옛 화면이 남는 문제 수정:
 *  - HTML·manifest·sw는 network-first + cache:"no-store" (브라우저 HTTP 캐시까지 우회)
 *  - 오프라인일 때만 캐시 사용
 *  - 새 버전 설치 시 열려 있는 페이지를 자동 새로고침(index.html의 controllerchange 처리)
 */
const CACHE = "kostolany-egg-v3";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.all(ASSETS.map((u) => fetch(u, { cache: "no-store" }).then((r) => c.put(u, r)).catch(() => {})))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // CDN 등 외부 자원은 브라우저에 맡김

  // 같은 출처 자원은 전부 network-first (no-store), 실패 시에만 캐시
  e.respondWith(
    fetch(req, { cache: "no-store" })
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match("./index.html")))
  );
});

self.addEventListener("message", (e) => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});
