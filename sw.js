// キャッシュバージョン - 更新時はこれを変更してください
const CACHE_VERSION = "v1.1";
const CACHE_NAME = `mood-calendar-${CACHE_VERSION}`;

const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./fortune.json",
  "./icons/icon-192x192.png",
  "./icons/icon-512x512.png"
];

// インストール時に新しいService Workerをすぐに有効化
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }).then(() => {
      return self.skipWaiting(); // 新しいSWをすぐに有効化
    })
  );
});

// フェッチ戦略: HTMLとJSONは常に最新版を取得、その他はキャッシュ優先（バックグラウンド更新付き）
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  
  // HTMLとJSONファイルは常に最新版を取得（Network First）
  if (event.request.url.endsWith(".html") || 
      event.request.url.endsWith(".json") || 
      url.pathname === "/" || 
      url.pathname.endsWith("/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // 成功したらキャッシュも更新
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // ネットワークエラー時はキャッシュから返す
          return caches.match(event.request);
        })
    );
  } else {
    // CSSやJSなどはキャッシュ優先だが、バックグラウンドで更新を確認
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // バックグラウンドでキャッシュを更新
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });
        
        // キャッシュがあればすぐに返し、なければネットワークを待つ
        return cachedResponse || fetchPromise;
      })
    );
  }
});

// アクティベート時に古いキャッシュを削除し、既存のページを即座に制御
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim(); // 既存のページをすぐに制御
    })
  );
});
