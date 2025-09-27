import { initializeApp } from 'firebase/app';
// FIX: The v9 modular auth imports are failing, likely due to a version mismatch.
// Replaced with the v8 compatibility layer and created v9-style wrapper functions below.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  writeBatch,
  getDocs,
  getDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';

// UYARI: BU BİLGİLERİ KENDİ FIREBASE PROJE BİLGİLERİNİZLE DEĞİŞTİRİN!
// Bu bilgileri Firebase Console -> Proje Ayarları -> Genel sekmesinde bulabilirsiniz.
export const firebaseConfig = {
  apiKey: "AIzaSyBFj6qiPWkkdIfgJ6ddZRwZAKilH_yXlTw",
  authDomain: "kocumbenim-ed862.firebaseapp.com",
  projectId: "kocumbenim-ed862",
  storageBucket: "kocumbenim-ed862.appspot.com",
  messagingSenderId: "225009318677",
  appId: "1:225009318677:web:c028c6459272c34ef0c71c"
};

// Firebase'i başlat
// Initialize V9 app for non-auth services
const app = initializeApp(firebaseConfig);
// Initialize V8 compat app for auth service.
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}


// Servisleri başlat ve dışa aktar
const db = getFirestore(app);
// Use the v8-compat auth object.
const auth = firebase.auth();
const storage = getStorage(app);

// FIX: Create v9-style wrapper functions for auth to be used by other parts of the app.
const onAuthStateChanged = (authInstance, callback) => authInstance.onAuthStateChanged(callback);
const createUserWithEmailAndPassword = (authInstance, email, password) => authInstance.createUserWithEmailAndPassword(email, password);
const signInWithEmailAndPassword = (authInstance, email, password) => authInstance.signInWithEmailAndPassword(email, password);
const signOut = (authInstance) => authInstance.signOut();
const updateProfile = (user, profileData) => user.updateProfile(profileData);


// Firestore ve Auth fonksiyonlarını DataContext'te kullanmak için dışa aktar
export {
  app,
  db,
  auth,
  storage,
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  writeBatch,
  getDocs,
  getDoc,
  arrayUnion,
  arrayRemove,
  // Auth functions are now the direct modular functions (our wrappers)
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  // Storage functions
  ref,
  uploadBytes,
  getDownloadURL,
};
