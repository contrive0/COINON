/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Service Worker for 코인온 (CoinOn) PWA
 */

const CACHE_NAME = 'coinon-pwa-v1.0';

// Relative static assets for app shell caching
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

// Domains/Protocols that must never be cached (live API, WebSocket, TradingView)
const BYPASS_DOMAINS = [
  'api.upbit.com',
  'api.binance.com',
  'fchart.stock.naver.com',
  'm.search.naver.com',
  'tradingview.com',
  's3.tradingview.com'
];

// 1. Install event: Cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use catch on addAll so individual asset issues don't prevent install
      return Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[Service Worker] Failed to cache asset:', url, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate event: Clean up old caches and take immediate control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch event: Stale-while-revalidate for static assets, network-first for navigation, bypass for live market APIs
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Bypass non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Bypass WebSockets and chrome extensions
  if (url.protocol === 'ws:' || url.protocol === 'wss:' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Bypass live cryptocurrency and exchange rate APIs
  if (BYPASS_DOMAINS.some((domain) => url.hostname.includes(domain))) {
    return;
  }

  // Handle navigation requests (HTML page loads) - Network First with Cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If valid response, update cache
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(async () => {
          // Offline fallback
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const fallback = await caches.match('./index.html');
          if (fallback) return fallback;
          return caches.match('./');
        })
    );
    return;
  }

  // Handle static assets (JS, CSS, fonts, images) - Cache First with Network Fallback & Revalidation
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache for next time
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
          })
          .catch(() => {
            // Network failure is fine since cached response is already returned
          });
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            // Only cache valid http/https requests
            if (url.protocol.startsWith('http')) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
            }
          }
          return networkResponse;
        })
        .catch(() => {
          // If image fails offline, return a fallback if needed
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
    })
  );
});
