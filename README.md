# Eğitim Koçu Platformu v2 (Firebase Entegrasyonu)

## 🚀 Proje Açıklaması

Eğitim Koçu Platformu, eğitim koçları ve öğrenciler arasındaki etkileşimi dijitalleştiren, ödev atama, takip, değerlendirme ve iletişim süreçlerini merkezileştiren modern ve reaktif bir web uygulamasıdır. Bu sürüm, tam **Firebase entegrasyonu** ile güçlendirilmiştir; kullanıcı kimlik doğrulaması, veritabanı işlemleri ve dosya depolama için Firebase servislerini kullanır. Platform, Google Gemini API'nin gücünü kullanarak akıllı özellikler sunar ve öğrenme sürecini daha verimli, kişiselleştirilmiş ve ilgi çekici hale getirir.

Uygulama, üç farklı kullanıcı rolünü (Süper Admin, Koç, Öğrenci) destekleyerek her bir kullanıcının ihtiyacına yönelik özelleştirilmiş bir deneyim sunar.

## ✨ Temel Özellikler

- **☁️ Tam Firebase Entegrasyonu**:
  - **Authentication**: E-posta/Şifre ile güvenli kullanıcı kaydı ve girişi.
  - **Cloud Firestore**: Tüm uygulama verileri (kullanıcılar, ödevler, mesajlar vb.) için gerçek zamanlı, NoSQL veritabanı.
  - **Cloud Storage**: Ödev dosyaları, profil fotoğrafları ve sesli geri bildirimler gibi tüm medya dosyaları için güvenli depolama.
- **🔒 Rol Bazlı Erişim**: Süper Admin, Koç ve Öğrenci olmak üzere üç farklı kullanıcı rolü ve her role özel yetkilendirme.
- **🚀 Otomatik Kurulum**:
  - **Otomatik Admin Ataması**: Sisteme kaydolan ilk kullanıcı otomatik olarak "Süper Admin" rolünü alır.
  - **Kurulum Sihirbazı**: Süper Admin'i ilk girişinde karşılayan, demo verilerini sisteme doğru ve senkronize bir şekilde yüklemesi için yönlendiren arayüz.
- **📊 Dinamik Paneller (Dashboard)**: Her role özel, önemli metrikleri ve yapay zeka destekli içgörüleri gösteren ana sayfalar.
- **📚 Gelişmiş Ödev Yönetimi**: Koçlar için kolayca ödev oluşturma, farklı teslimat türleri belirleme ve yapay zeka destekli geri bildirimler sağlama.
- **💬 Akıllı Mesajlaşma Sistemi**: Birebir ve grup mesajlaşması, duyurular, anketler, dosya/sesli mesaj gönderme ve mesajlara reaksiyon verme.

### 🤖 Gemini API Entegrasyonları

- **✍️ Akıllı Ödev Açıklaması**: Ödev başlığına göre otomatik olarak açıklama metinleri oluşturur.
- **💯 Akıllı Not Önerisi**: Öğrencinin teslim ettiği çalışmayı analiz ederek bir not ve gerekçe önerir.
- **🗣️ Akıllı Geri Bildirim**: Verilen nota göre motive edici ve yapıcı geri bildirimler üretir.
- **✅ Otomatik Kontrol Listesi**: Ödev başlığı ve açıklamasına göre öğrencilere yol gösterecek adımlar oluşturur.
- **🎯 Akıllı Hedef Önerileri**: Öğrencinin performansına göre S.M.A.R.T. hedefler önerir.
- **📅 Haftalık Özetler ve İçgörüler**: Hem öğrenciler hem de koçlar için haftalık performans verilerini analiz edip özetler sunar.

## 🛠️ Kullanılan Teknolojiler

- **Frontend**: React, TypeScript
- **Backend & Veritabanı**: Firebase (Authentication, Cloud Firestore, Cloud Storage)
- **Styling**: Tailwind CSS
- **Yapay Zeka**: Google Gemini API (`@google/genai`)
- **Grafikler**: Recharts
- **Veri Yönetimi**: React Context API

## ⚙️ Kurulum ve Çalıştırma

Bu projenin çalışabilmesi için bir Firebase projesine ve Gemini API anahtarına ihtiyacınız vardır.

### Adım 1: Firebase Projesi Oluşturma
1.  **Firebase Projesi Oluşturun**:
    -   [Firebase Console](https://console.firebase.google.com/)'a gidin ve yeni bir proje oluşturun.
    -   Projenize bir Web uygulaması ekleyin.
    -   Proje ayarlarından Firebase SDK yapılandırma (configuration) nesnesini kopyalayın.

2.  **Firebase Servislerini Etkinleştirin**:
    -   **Authentication**: "Authentication" bölümüne gidin, "Sign-in method" sekmesini seçin ve **Email/Password** sağlayıcısını etkinleştirin.
    -   **Firestore Database**: "Firestore Database" bölümüne gidin ve test modunda (test mode) yeni bir veritabanı oluşturun.
    -   **Storage**: "Storage" bölümüne gidin ve başlayın. Güvenlik kurallarını başlangıç için test moduna ayarlayabilirsiniz (`allow read, write: if true;`).

3.  **Projeyi Yapılandırın**:
    -   Proje dosyalarını bir klasöre indirin.
    -   `services/firebase.ts` dosyasını bulun.
    -   1. adımda kopyaladığınız Firebase yapılandırma bilgilerinizi bu dosyadaki `firebaseConfig` nesnesinin içine yapıştırın.

### Adım 2: Gemini API Anahtarı
1. Google AI Studio veya Google Cloud Console üzerinden bir Gemini API anahtarı oluşturun.
2. Bu API anahtarının, uygulamanın çalıştığı ortamda `API_KEY` adında bir ortam değişkeni olarak ayarlandığından emin olun.

### Adım 3: Uygulamayı Çalıştırma ve Kurulum
1.  **Tarayıcıda Açın**: `index.html` dosyasını modern bir web tarayıcısında (Chrome, Firefox, Edge vb.) açın.

2.  **İlk Kullanıcıyı Kaydedin (Admin Kurulumu)**:
    -   Uygulama açıldığında "Kayıt Ol" ekranına gidin.
    -   İstediğiniz bir e-posta ve şifre ile ilk hesabınızı oluşturun. **Bu ilk hesap, otomatik olarak Süper Admin yetkilerine sahip olacaktır.**

3.  **Kurulum Sihirbazını Tamamlayın**:
    -   Admin olarak giriş yaptıktan sonra sizi bir **Kurulum Sihirbazı** karşılayacaktır.
    -   **Adım 1**: Sihirbazın belirttiği demo kullanıcıları (koç ve öğrenciler) Firebase projenizin **Authentication** paneline, `password123` şifresiyle manuel olarak ekleyin.
    -   **Adım 2**: Her kullanıcıyı oluşturduktan sonra Firebase'in verdiği benzersiz **User UID**'yi kopyalayın.
    -   **Adım 3**: Kopyaladığınız UID'leri, uygulama arayüzündeki sihirbazda ilgili kullanıcının giriş alanına yapıştırın.
    -   **Adım 4**: "Kurulumu Tamamla" butonuna tıklayın. Bu işlem, tüm demo verilerini (ödevler, mesajlar vb.) veritabanınıza doğru UID'lerle senkronize ederek yükleyecektir.

4.  **Platformu Keşfedin!**
    -   Kurulum tamamlandıktan sonra platform tamamen hazır hale gelir.
    -   Çıkış yapıp demo kullanıcı bilgileri (`ayse.yilmaz@koc.com` vb.) ve `password123` şifresiyle giriş yapabilir veya sol menüdeki "Kullanıcı Değiştir" menüsünü kullanarak farklı roller arasında anında geçiş yapabilirsiniz.
