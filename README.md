# Eğitim Koçu Platformu v2 (Firebase Entegrasyonu)

## 🚀 Proje Açıklaması

Eğitim Koçu Platformu, eğitim koçları ve öğrenciler arasındaki etkileşimi dijitalleştiren, ödev atama, takip, değerlendirme ve iletişim süreçlerini merkezileştiren modern ve reaktif bir web uygulamasıdır. Bu sürüm, tam **Firebase entegrasyonu** ile güçlendirilmiştir; kullanıcı kimlik doğrulaması, veritabanı işlemleri ve dosya depolama için Firebase servislerini kullanır. Platform, Google Gemini API'nin gücünü kullanarak akıllı özellikler sunar ve öğrenme sürecini daha verimli, kişiselleştirilmiş ve ilgi çekici hale getirir.

Uygulama, üç farklı kullanıcı rolünü (Süper Admin, Koç, Öğrenci) destekleyerek her bir kullanıcının ihtiyacına yönelik özelleştirilmiş bir deneyim sunar.

## ✨ Temel Özellikler

- **☁️ Tam Firebase Entegrasyonu**:
  - **Authentication**: E-posta/Şifre ile güvenli kullanıcı kaydı, girişi ve **Custom Claims** ile sunucu taraflı rol yönetimi.
  - **Cloud Firestore**: Tüm uygulama verileri (kullanıcılar, ödevler, mesajlar vb.) için gerçek zamanlı, NoSQL veritabanı.
  - **Cloud Storage**: Ödev dosyaları, profil fotoğrafları ve sesli geri bildirimler gibi tüm medya dosyaları için güvenli depolama.
  - **Cloud Functions**: Rol ataması ve ilk kullanıcı kurulumu gibi hassas işlemleri gerçekleştirmek için güvenli sunucu tarafı mantığı.
- **🔒 Rol Bazlı Erişim**: Süper Admin, Koç ve Öğrenci olmak üzere üç farklı kullanıcı rolü ve her role özel yetkilendirme. Firestore Güvenlik Kuralları, bu rolleri sunucu tarafında zorunlu kılar.
- **🚀 Otomatik Kurulum**:
  - **Otomatik Admin Ataması**: Sisteme kaydolan ilk kullanıcı, bir Cloud Function sayesinde otomatik olarak "Süper Admin" rolünü ve yetkilerini alır.
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
- **Backend & Veritabanı**: Firebase (Authentication, Cloud Firestore, Cloud Storage, Cloud Functions)
- **Styling**: Tailwind CSS
- **Yapay Zeka**: Google Gemini API (`@google/genai`)
- **Grafikler**: Recharts
- **Veri Yönetimi**: React Context API

## ⚙️ Kurulum ve Çalıştırma

Bu projenin çalışabilmesi için bir Firebase projesine ve Gemini API anahtarına ihtiyacınız vardır.

### Adım 1: Firebase Projesi Oluşturma
1.  **Firebase Projesi Oluşturun**:
    -   [Firebase Console](https://console.firebase.google.com/)'a gidin ve yeni bir proje oluşturun.
    -   Projenizi **Blaze (Kullandıkça Öde)** planına yükseltin. Bu, Cloud Functions'ı dağıtabilmek için gereklidir.
    -   Projenize bir Web uygulaması ekleyin.
    -   Proje ayarlarından Firebase SDK yapılandırma (configuration) nesnesini kopyalayın.

2.  **Firebase Servislerini Etkinleştirin**:
    -   **Authentication**: "Authentication" bölümüne gidin, "Sign-in method" sekmesini seçin ve **Email/Password** sağlayıcısını etkinleştirin.
    -   **Firestore Database**: "Firestore Database" bölümüne gidin ve test modunda (test mode) yeni bir veritabanı oluşturun.
    -   **Storage**: "Storage" bölümüne gidin ve başlayın.

3.  **Projeyi Yapılandırın**:
    -   Proje dosyalarını bir klasöre indirin.
    -   `services/firebase.ts` dosyasını bulun ve 1. adımda kopyaladığınız Firebase yapılandırma bilgilerinizi `firebaseConfig` nesnesinin içine yapıştırın.

### Adım 2: Gemini API Anahtarı
1. Google AI Studio veya Google Cloud Console üzerinden bir Gemini API anahtarı oluşturun.
2. Bu API anahtarının, uygulamanın çalıştığı ortamda `API_KEY` adında bir ortam değişkeni olarak ayarlandığından emin olun.

### Adım 3: Firebase CLI Kurulumu ve Dağıtım (Deployment)
1.  **Firebase CLI'yi Yükleyin**: Eğer yüklü değilse, terminalde `npm install -g firebase-tools` komutu ile yükleyin.
2.  **Firebase'e Giriş Yapın**: `firebase login` komutu ile hesabınıza giriş yapın.
3.  **Proje Klasöründe Firebase'i Başlatın**: Projenin ana dizininde `firebase use --add` komutunu çalıştırın ve oluşturduğunuz Firebase projesini seçin.
4.  **Cloud Functions Bağımlılıklarını Yükleyin**: Terminalde `functions` klasörüne gidin (`cd functions`) ve `npm install` komutunu çalıştırın.
5.  **Tüm Servisleri Dağıtın (Deploy)**: Projenin ana dizinine geri dönün (`cd ..`) ve `firebase deploy` komutunu çalıştırın. Bu komut, `setUserRole` ve `onUserCreate` Cloud Function'larını ve `firestore.rules` dosyasındaki yeni güvenlik kurallarınızı projenize yükleyecektir.

### Adım 4: Uygulamayı Çalıştırma ve Kurulum
1.  **Tarayıcıda Açın**: `index.html` dosyasını modern bir web tarayıcısında (Chrome, Firefox, Edge vb.) açın.
2.  **İlk Kullanıcıyı Kaydedin (Otomatik Admin Kurulumu)**:
    -   Uygulama açıldığında "Kayıt Ol" ekranına gidin.
    -   İlk hesabınızı oluşturun. **Bu ilk hesap, arka planda çalışan bir Cloud Function sayesinde otomatik olarak Süper Admin yetkilerine sahip olacaktır.** Manuel bir işlem yapmanıza gerek yoktur.
3.  **Kurulum Sihirbazını Tamamlayın**:
    -   Süper Admin olarak giriş yaptıktan sonra sizi bir **Kurulum Sihirbazı** karşılayacaktır.
    -   Sihirbazdaki adımları takip ederek demo kullanıcıları Firebase Authentication paneline ekleyin ve UID'lerini sihirbazdaki ilgili alanlara yapıştırarak kurulumu tamamlayın.
4.  **Platformu Keşfedin!** Kurulum tamamlandıktan sonra platform tamamen hazır hale gelir. Sol menüdeki "Kullanıcı Değiştir" menüsünü kullanarak farklı roller arasında anında geçiş yapabilirsiniz.