import { initializeApp, getApps, getApp } from "firebase/app";
// FIX: The named imports below were causing errors. Switched to a namespace import to resolve the issue.
import * as firebaseAuth from "firebase/auth";

import { 
    initializeFirestore,
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
export const auth = firebaseAuth.getAuth(app);
// Firestore bağlantı hatalarını (code=unavailable) önlemek için long-polling'i zorla.
// Bu, kısıtlayıcı ağ ortamlarında (firewall, proxy vb.) bağlantı sorunlarını çözebilir.
export const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    useFetchStreams: false,
});
export const storage = getStorage(app);

// Auth ve Firestore fonksiyonlarını da buradan dışa aktararak kullanımı kolaylaştıralım
export const onAuthStateChanged = firebaseAuth.onAuthStateChanged;
export const createUserWithEmailAndPassword = firebaseAuth.createUserWithEmailAndPassword;
export const signInWithEmailAndPassword = firebaseAuth.signInWithEmailAndPassword;
export const signOut = firebaseAuth.signOut;
export const updateProfile = firebaseAuth.updateProfile;
export {
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