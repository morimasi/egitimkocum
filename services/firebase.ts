import { initializeApp, getApps, getApp } from "firebase/app";
// FIX: Changed to namespace import for firebase/auth to avoid potential issues with named exports in some environments.
import * as fbAuth from "firebase/auth";
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
    arrayRemove 
} from "firebase/firestore";
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL, 
    deleteObject 
} from "firebase/storage";


// --- ÖNEMLİ KURULUM ADIMI ---
// Bu bölümü kendi Firebase projenizin bilgileriyle DOLDURMANIZ GEREKMEKTEDİR.
//
// Bu bilgileri almak için:
// 1. Firebase Konsolu'na gidin: https://console.firebase.google.com/
// 2. Projenizi seçin.
// 3. Sol üstteki dişli çark simgesine (⚙️) tıklayıp "Proje ayarları"nı seçin.
// 4. "Genel" sekmesinde, sayfanın altına "Uygulamalarınız" bölümüne kaydırın.
// 5. "SDK kurulumu ve yapılandırması" başlığı altından "Yapılandırma"yı seçin.
// 6. `firebaseConfig` nesnesini kopyalayıp aşağıdaki nesnenin yerine yapıştırın.
//
// UYARI: Eğer bu bilgileri doldurmazsanız, uygulama "Kurulum Sihirbazı" ekranında kalacaktır.
export const firebaseConfig = {
  apiKey: "AIzaSyBbUBvBSS4zrCbYt5CwCx7uUPRhLL2DQCk",
  authDomain: "egitimkocuplatformu-f5330.firebaseapp.com",
  projectId: "egitimkocuplatformu-f5330",
  storageBucket: "egitimkocuplatformu-f5330.firebasestorage.app",
  messagingSenderId: "794855483517",
  appId: "1:794855483517:web:f40e35f487dedb18192914"
};

// Firebase'i başlat
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Servisleri dışa aktar
export const auth = fbAuth.getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// FIX: Destructure auth functions from namespace import to make them available for re-export.
const { 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    updateProfile 
} = fbAuth;

// Auth ve Firestore fonksiyonlarını da buradan dışa aktararak kullanımı kolaylaştıralım
export {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
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
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
};