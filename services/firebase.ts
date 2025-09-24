import firebase from 'firebase/compat/app';
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Bu konfigürasyon bilgilerini kendi Firebase projenizden alın.
// Firebase Console > Proje Ayarları > Genel sekmesinde bulabilirsiniz.
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBd5aLLCH2sIn1xni3Y2RZkJA_9DMnUfwU",
  authDomain: "egitimkocuplatformu.firebaseapp.com",
  projectId: "egitimkocuplatformu",
  storageBucket: "egitimkocuplatformu.appspot.com",
  messagingSenderId: "744196055341",
  appId: "1:744196055341:web:8c28a388b3233bdc12b3a4",
  measurementId: "G-E2QKPK5J65"
};

// Firebase uygulamasını başlat
const app = firebase.initializeApp(firebaseConfig);

// İhtiyaç duyulan Firebase servislerini başlat ve dışa aktar
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Bu dosya, uygulamanızın Firebase ile iletişim kurması için gereken temel kurulumu sağlar.
// Sonraki adımlarda bu 'auth', 'db' ve 'storage' nesnelerini kullanarak
// kimlik doğrulama, veritabanı işlemleri ve dosya depolama gibi özellikleri entegre edeceğiz.