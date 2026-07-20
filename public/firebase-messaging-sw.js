/* Firebase Messaging service worker — served from /public for Vercel */
importScripts("https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyA69_MjbZ22YnkFxPqLWOGSOfuJPB44Ni0",
  authDomain: "tradehub-b7b28.firebaseapp.com",
  projectId: "tradehub-b7b28",
  storageBucket: "tradehub-b7b28.firebasestorage.app",
  messagingSenderId: "42547333485",
  appId: "1:42547333485:web:5c4dbbdc1ee9f95cb6b264",
});
firebase.messaging();
