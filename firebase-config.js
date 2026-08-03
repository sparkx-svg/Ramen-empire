// Firebase project config for Ramen Empire, from Firebase Console →
// Project settings → "Your apps" → SDK setup and configuration.
// This is safe to expose publicly (it's not a secret key) — Firebase uses
// separate security rules to actually protect data.
const firebaseConfig = {
  apiKey: "AIzaSyCu1DcxwhqE1vdQX7Y_hfpjceAQvJcgUg8",
  authDomain: "ramen-empire.firebaseapp.com",
  projectId: "ramen-empire",
  storageBucket: "ramen-empire.firebasestorage.app",
  messagingSenderId: "125426906566",
  appId: "1:125426906566:web:40c98196190f434c14aec7",
  measurementId: "G-1CJQKQGJL1"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();
const analytics = firebase.analytics();
const db = firebase.firestore();
