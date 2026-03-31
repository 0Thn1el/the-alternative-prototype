// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBDCJE9y6gFSKyt7gI-TkRmSePemHsgFhw",
  authDomain: "the-alternative-prototype.firebaseapp.com",
  projectId: "the-alternative-prototype",
  storageBucket: "the-alternative-prototype.firebasestorage.app",
  messagingSenderId: "1029298579311",
  appId: "1:1029298579311:web:1c09521d12ca7c845c2a9a",
  measurementId: "G-6246P5ZFZ6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export default app;