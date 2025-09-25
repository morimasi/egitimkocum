import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";
import "firebase/compat/functions";

// KENDİ PROJE AYARLARINIZDAN KOPYALADIĞINIZ BİLGİLER
const firebaseConfig = {
  apiKey: "AIzaSyBbUBvBSS4zrCbYt5CwCx7uUPRhLL2DQCk",
  authDomain: "egitimkocuplatformu-f5330.firebaseapp.com",
  projectId: "egitimkocuplatformu-f5330",
  storageBucket: "egitimkocuplatformu-f5330.appspot.com",
  messagingSenderId: "794855483517",
  appId: "1:794855483517:web:bf1b4a893355cca0192914"
};

// Initialize Firebase only if it hasn't been initialized yet.
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.firestore();
export const storage = firebase.storage();
export const functions = firebase.functions();