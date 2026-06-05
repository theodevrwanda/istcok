import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyC0Sg-KJYG-0DnGY-QkMUOuZ7bApneWIa4",
  authDomain: "oluxy-app.firebaseapp.com",
  projectId: "oluxy-app",
  storageBucket: "oluxy-app.firebasestorage.app",
  messagingSenderId: "390599149635",
  appId: "1:390599149635:web:35e8c70760e816babdecf6",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const messaging = getMessaging(app);
