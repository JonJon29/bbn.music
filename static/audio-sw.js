self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

const authTokens = new Map();

self.addEventListener('message', (event) => {
    if (event.data.type === 'SET_AUTH_TOKEN') {
        authTokens.set(event.data.pattern, event.data.token);
    } else if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (url.pathname.includes('/api/@bbn/music/songs/') && url.pathname.endsWith('/download')) {
        let authToken = null;
        for (const [ pattern, token ] of authTokens.entries()) {
            if (url.pathname.includes(pattern)) {
                authToken = token;
                break;
            }
        }

        if (authToken) {
            const headers = new Headers(event.request.headers);
            headers.set('Authorization', `Bearer ${authToken}`);

            event.respondWith(
                fetch(new Request(event.request.url, {
                    method: event.request.method,
                    headers,
                    mode: 'cors',
                    credentials: 'same-origin',
                    cache: event.request.cache,
                    redirect: event.request.redirect,
                    referrer: event.request.referrer,
                }))
            );
        }
    }
});