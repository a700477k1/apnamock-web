// Firebase Configuration and Initialization
const firebaseConfig = {
  apiKey: "AIzaSyCogq2tAevJuaw9dZBtLD-x7CZl3qk1sHw",
  authDomain: "apnamock-frontend.firebaseapp.com",
  projectId: "apnamock-frontend",
  storageBucket: "apnamock-frontend.firebasestorage.app",
  messagingSenderId: "810269605444",
  appId: "1:810269605444:web:0ec54e30a467e0cde88611",
  measurementId: "G-R21VE8R481"
};

// Initialize Firebase only once (FIXED syntax)
if (!window.firebase || !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Initialize Messaging globally
window.messaging = firebase.messaging();
