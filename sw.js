// Service Worker —— 麻将趣味工具集 PWA
// 策略：缓存优先（cache-first），启动时预缓存所有静态资源，实现离线可用。
// 更新机制：修改 CACHE_VERSION 即可强制刷新客户端缓存。

const CACHE_VERSION = 'mj-tools-v2';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  // 各功能模块（iframe 沙盒）
  './module-skill.html',
  './module-wheel.html',
  './module-lottery.html',
  './module-jiasa.html',
  './module-horse.html',
  './module-tools.html',
  './season.html',
  // 转盘永久音效（仓库根目录）
  './music1.mp3',
  './music2.mp3',
  './music3.mp3',
  './music4.mp3',
  './music5.mp3',
  './music6.mp3',
];

// 安装：预缓存核心资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 激活：清理旧版本缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// 请求拦截：缓存优先，未命中则回源并在线更新
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          // 仅缓存同源、状态码正常的响应
          if (res && res.status === 200 && res.type === 'basic') {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => {
          // 离线且缓存未命中：回退到首页
          if (req.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
