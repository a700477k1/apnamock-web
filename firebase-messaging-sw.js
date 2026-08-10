// Import Firebase scripts for the service worker
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyCogq2tAevJuaw9dZBtLD-x7CZl3qk1sHw",
  authDomain: "apnamock-frontend.firebaseapp.com",
  projectId: "apnamock-frontend",
  storageBucket: "apnamock-frontend.firebasestorage.app",
  messagingSenderId: "810269605444",
  appId: "1:810269605444:web:0ec54e30a467e0cde88611",
  measurementId: "G-R21VE8R481"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
