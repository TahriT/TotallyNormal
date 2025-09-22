// Service Worker for TotallyNormal
const APP_VERSION = '1.3.3';
const CACHE_NAME = `totallynormal-v${APP_VERSION}`;
const MATERIALS_CACHE = 'totallynormal-materials-v1';
const EXTERNAL_CACHE = 'totallynormal-external-v1';

// External resources that can be cached permanently
const EXTERNAL_RESOURCES = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
    // Additional font and icon resources that might be loaded
    'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZhrib2Bg-4.woff2',
    'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZhrib2Bg-4.woff2'
];

// App resources that should use cache validation
const APP_RESOURCES = [
    './',
    './index.html',
    './styles.css',
    './js/app.js',
    './js/textureGenerator.js',
    './js/materialViewer3D.js',
    './js/googleDrive.js',
    './debug.js',
    './manifest.json',
    './favicon.svg',
    './favicon.ico',
    './cache-test.html',
    './version.json'
];

// Assets and media files
const STATIC_RESOURCES = [
    './docs/images/albedo-example.svg',
    './docs/images/height-example.svg',
    './docs/images/metallic-example.svg',
    './docs/images/normal-example.svg',
    './docs/images/roughness-example.svg',
    './docs/images/occlusion-example.svg',
    './docs/images/source-material.png',
    './docs/images/normal-laplacian.png',
    './docs/images/normal-prewitt.png',
    './docs/images/normal-roberts.png',
    './docs/images/normal-scharr.png',
    './docs/images/normal-sobel.png'
];

// Utility functions
function isNavigationRequest(request) {
    return request.mode === 'navigate' || 
           (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

function shouldCacheRequest(request) {
    const url = new URL(request.url);
    return url.protocol === 'https:' || url.protocol === 'http:' || url.protocol === 'chrome-extension:';
}

// Install event
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        Promise.all([
            // Cache app resources
            caches.open(CACHE_NAME).then(cache => {
                console.log('Caching app resources...');
                return cache.addAll(APP_RESOURCES.concat(STATIC_RESOURCES))
                    .catch(error => {
                        console.warn('Failed to cache some app resources:', error);
                        // Try to cache them individually
                        return Promise.allSettled(
                            APP_RESOURCES.concat(STATIC_RESOURCES).map(url => 
                                cache.add(url).catch(err => console.warn(`Failed to cache ${url}:`, err))
                            )
                        );
                    });
            }),
            
            // Cache external resources
            caches.open(EXTERNAL_CACHE).then(cache => {
                console.log('Caching external resources...');
                return Promise.allSettled(
                    EXTERNAL_RESOURCES.map(url => 
                        cache.add(url).catch(err => console.warn(`Failed to cache external ${url}:`, err))
                    )
                );
            })
        ]).then(() => {
            console.log('Service Worker installation completed');
            // Force activation of new service worker
            return self.skipWaiting();
        }).catch(error => {
            console.error('Service Worker installation failed:', error);
        })
    );
});

// Fetch event with comprehensive offline support
self.addEventListener('fetch', event => {
    const requestURL = new URL(event.request.url);
    
    // Handle navigation requests (for offline page support)
    if (isNavigationRequest(event.request)) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    if (response && response.ok) {
                        // Update cache with fresh version
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, response.clone());
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Serve cached version when offline
                    return caches.match('./index.html').then(cachedResponse => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // Fallback offline page
                        return new Response(`
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <title>TotallyNormal - Offline</title>
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                <style>
                                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #0d0d1e; color: white; }
                                    .logo { font-size: 2em; color: #00d4ff; margin-bottom: 20px; }
                                    .message { font-size: 1.2em; margin: 20px 0; }
                                    .retry { background: #00d4ff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 1em; }
                                </style>
                            </head>
                            <body>
                                <div class="logo">🎨 TotallyNormal</div>
                                <h1>You're Offline</h1>
                                <p class="message">The app is cached and ready to work offline!</p>
                                <p>You can still create PBR materials without an internet connection.</p>
                                <button class="retry" onclick="location.reload()">Try Again</button>
                            </body>
                            </html>
                        `, {
                            headers: { 'Content-Type': 'text/html' },
                            status: 200,
                            statusText: 'OK'
                        });
                    });
                })
        );
        return;
    }
    
    // Handle saved materials - keep aggressive caching for user data
    if (requestURL.pathname.includes('material-') || 
        requestURL.pathname.includes('texture-') ||
        requestURL.searchParams.has('material-data')) {
        event.respondWith(
            caches.open(MATERIALS_CACHE).then(cache => {
                return cache.match(event.request).then(response => {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request).then(fetchResponse => {
                        if (fetchResponse && fetchResponse.ok) {
                            cache.put(event.request, fetchResponse.clone());
                        }
                        return fetchResponse;
                    }).catch(() => {
                        return new Response('Material not available offline', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
                });
            })
        );
        return;
    }
    
    // Handle external resources - cache first strategy
    if (EXTERNAL_RESOURCES.some(url => event.request.url.startsWith(url) || 
        event.request.url.includes(new URL(url).hostname))) {
        event.respondWith(
            caches.match(event.request).then(response => {
                if (response) {
                    // Serve from cache immediately, update in background
                    fetch(event.request).then(fetchResponse => {
                        if (fetchResponse && fetchResponse.ok) {
                            caches.open(EXTERNAL_CACHE).then(cache => {
                                cache.put(event.request, fetchResponse.clone());
                            });
                        }
                    }).catch(() => {});
                    return response;
                }
                // Not in cache, try to fetch and cache
                return fetch(event.request).then(fetchResponse => {
                    if (fetchResponse && fetchResponse.ok) {
                        const responseClone = fetchResponse.clone();
                        caches.open(EXTERNAL_CACHE).then(cache => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return fetchResponse;
                }).catch(() => {
                    console.warn('External resource failed to load:', event.request.url);
                    return new Response('Resource unavailable offline', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                });
            })
        );
        return;
    }
    
    // Handle app resources - network first with cache fallback
    if (APP_RESOURCES.some(resource => {
        const resourcePath = resource === './' ? '/' : resource;
        return requestURL.pathname === resourcePath || 
               requestURL.pathname.endsWith(resourcePath.substring(1)) ||
               STATIC_RESOURCES.includes(requestURL.pathname);
    })) {
        event.respondWith(
            fetch(event.request).then(response => {
                // If fetch succeeds, update cache and return response
                if (response && response.ok) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            }).catch(() => {
                // If fetch fails, try cache
                return caches.match(event.request).then(cachedResponse => {
                    if (cachedResponse) {
                        console.log('Serving from cache (offline):', event.request.url);
                        return cachedResponse;
                    }
                    // If not in cache either, return a basic response
                    return new Response('Offline - resource not available', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                });
            })
        );
        return;
    }
    
    // For all other requests, try network first, then cache
    if (shouldCacheRequest(event.request)) {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match(event.request);
            })
        );
    } else {
        event.respondWith(fetch(event.request));
    }
});

// Activate event
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        Promise.all([
            // Clean up old app caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        // Keep materials cache, external cache, and current app cache
                        if (cacheName !== CACHE_NAME && 
                            cacheName !== MATERIALS_CACHE && 
                            cacheName !== EXTERNAL_CACHE &&
                            !cacheName.startsWith('totallynormal-')) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Take control of all clients immediately
            self.clients.claim()
        ]).then(() => {
            console.log('Service Worker activation completed');
            // Notify clients that the service worker is ready
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'SW_ACTIVATED',
                        version: APP_VERSION
                    });
                });
            });
        })
    );
});

// Background sync for when network becomes available
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(
            // Perform background sync tasks
            console.log('Background sync triggered')
        );
    }
});

// Message handler for version checking and cache management
self.addEventListener('message', event => {
    const { type, version } = event.data;
    
    if (type === 'VERSION_CHECK') {
        if (version !== APP_VERSION) {
            console.log(`Version mismatch detected. SW: ${APP_VERSION}, App: ${version}`);
            // Clear app cache to force fresh fetch on next reload
            caches.delete(CACHE_NAME).then(() => {
                console.log('Cleared app cache due to version mismatch');
            });
        } else {
            console.log(`✓ Version sync: ${APP_VERSION}`);
        }
    }
    
    if (type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (type === 'GET_CACHE_STATUS') {
        caches.keys().then(cacheNames => {
            const status = {
                caches: cacheNames,
                version: APP_VERSION,
                timestamp: new Date().toISOString()
            };
            event.source.postMessage({
                type: 'CACHE_STATUS',
                data: status
            });
        });
    }
});

// Push notification support (for future updates)
self.addEventListener('push', event => {
    if (event.data) {
        const options = {
            body: event.data.text(),
            icon: './favicon.svg',
            badge: './favicon.svg',
            tag: 'totallynormal-notification',
            requireInteraction: false
        };
        
        event.waitUntil(
            self.registration.showNotification('TotallyNormal Update', options)
        );
    }
});

console.log('Service Worker script loaded - TotallyNormal v' + APP_VERSION);
