// This script is responsible for handling background notifications
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyC0Sg-KJYG-0DnGY-QkMUOuZ7bApneWIa4",
  authDomain: "oluxy-app.firebaseapp.com",
  projectId: "oluxy-app",
  storageBucket: "oluxy-app.firebasestorage.app",
  messagingSenderId: "390599149635",
  appId: "1:390599149635:web:35e8c70760e816babdecf6"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/pwa-icon-512.png',
    badge: '/pwa-icon-512.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
