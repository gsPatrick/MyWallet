// Service Worker for MyWallet PWA
const CACHE_NAME = 'mywallet-v2';
const IMAGE_CACHE_NAME = 'mywallet-images-v1';
const STATIC_ASSETS = [
    '/',
    '/dashboard',
    '/transactions',
    '/cards',
    '/goals',
    '/offline.html'
];

// Image extensions to cache
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'];

// Check if request is for an image
const isImageRequest = (request) => {
    const url = request.url.toLowerCase();
    return IMAGE_EXTENSIONS.some(ext => url.includes(ext)) ||
        request.destination === 'image' ||
        request.headers.get('accept')?.includes('image/');
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME && name !== IMAGE_CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip API requests (let them fail normally)
    if (event.request.url.includes('/api/')) return;

    // Handle image requests with cache-first strategy
    if (isImageRequest(event.request)) {
        event.respondWith(handleImageRequest(event.request));
        return;
    }

    // Handle other requests with network-first strategy
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Cache successful responses
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Fallback to cache
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // If HTML request, show offline page
                    if (event.request.headers.get('accept')?.includes('text/html')) {
                        return caches.match('/offline.html');
                    }
                    return new Response('Offline', { status: 503 });
                });
            })
    );
});

// Cache-first strategy for images
async function handleImageRequest(request) {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        // Update cache in background (stale-while-revalidate)
        fetchAndCacheImage(request);
        return cachedResponse;
    }

    // Not in cache, fetch and cache
    return fetchAndCacheImage(request);
}

// Fetch image and cache it
async function fetchAndCacheImage(request) {
    try {
        // For cross-origin images, we need to use no-cors mode
        const fetchRequest = request.mode === 'no-cors' ? request : new Request(request.url, {
            mode: 'cors',
            credentials: 'omit'
        });

        const response = await fetch(fetchRequest);

        // Only cache successful responses
        if (response.ok || response.type === 'opaque') {
            const cache = await caches.open(IMAGE_CACHE_NAME);
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        // Return cached version if available, otherwise placeholder
        const cached = await caches.match(request);
        if (cached) return cached;

        // Return a 1x1 transparent GIF as placeholder
        return new Response(
            Uint8Array.from(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), c => c.charCodeAt(0)),
            { headers: { 'Content-Type': 'image/gif' } }
        );
    }
}

// Push notifications
self.addEventListener('push', (event) => {
    const data = event.data?.json() || {};
    const title = data.title || 'MyWallet';
    const options = {
        body: data.body || 'Nova notificação',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: data.url || '/dashboard'
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data)
    );
});

