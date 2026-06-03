// sw-notifications.js
// Handles notification click event to open or focus the installed PWA window.

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Focus existing window or open a new one
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Find active client if already open
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
            break;
          }
        }
        return client.focus();
      }
      
      // If not open, open a new window to the scope
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
