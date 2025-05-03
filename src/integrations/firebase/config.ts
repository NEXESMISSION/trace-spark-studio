// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDXHJZ9W7fa6qwcQg6-4LcQP9jQyTPYnXs",
  authDomain: "tracemateweb.firebaseapp.com",
  projectId: "tracemateweb",
  storageBucket: "tracemateweb.appspot.com",
  messagingSenderId: "678008224294",
  appId: "1:678008224294:web:9a8b1b9b9b9b9b9b9b9b9b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { auth, googleProvider };
