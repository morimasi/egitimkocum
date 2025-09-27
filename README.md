# Eğitim Koçu Platformu v2 (Firebase Entegreli)

## 🚀 Proje Açıklaması

Eğitim Koçu Platformu, eğitim koçları ve öğrenciler arasındaki etkileşimi dijitalleştiren, ödev atama, takip, değerlendirme ve iletişim süreçlerini merkezileştiren modern ve reaktif bir web uygulamasıdır. Bu sürüm, **tamamen Firebase'e entegre** çalışacak şekilde tasarlanmıştır ve canlı verilerle kullanıcı yönetimi, veri depolama ve dosya saklama işlemlerini gerçekleştirir.

Uygulama, Google Gemini API'nin gücünü kullanarak akıllı özellikler sunar ve öğrenme sürecini daha verimli, kişiselleştirilmiş ve ilgi çekici hale getirir. Uygulama, üç farklı kullanıcı rolünü (Süper Admin, Koç, Öğrenci) destekleyerek her bir kullanıcının ihtiyacına yönelik özelleştirilmiş bir deneyim sunar.

## ✨ Temel Özellikler

- **🔥 Tam Firebase Entegrasyonu**: Gerçek zamanlı kullanıcı kimlik doğrulaması (Authentication), veritabanı (Firestore) ve dosya depolama (Storage) altyapısı ile çalışır.
- **🎭 Rol Bazlı Deneyim**: Süper Admin, Koç ve Öğrenci olmak üzere üç farklı kullanıcı rolü için özelleştirilmiş arayüzler ve yetkiler.
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
- **Backend & Veritabanı**: Firebase (Authentication, Firestore, Storage)
- **Styling**: Tailwind CSS
- **Yapay Zeka**: Google Gemini API (`@google/genai`)
- **Grafikler**: Recharts
- **Veri Yönetimi**: React Context API

## ⚙️ Kurulum ve Çalıştırma

### Adım 1: Gerekli API Anahtarları

1.  **Gemini API Anahtarı**: Google AI Studio veya Google Cloud Console üzerinden bir Gemini API anahtarı oluşturun. Bu anahtar, uygulamanın çalıştığı ortamda `API_KEY` adında bir ortam değişkeni olarak ayarlanmalıdır.
2.  **Firebase Projesi**:
    *   [Firebase Konsolu](https://console.firebase.google.com/)'na gidin ve yeni bir proje oluşturun.
    *   Projenizin ana sayfasında, web uygulaması (`</>`) seçeneğine tıklayarak yeni bir web uygulaması kaydedin.
    *   **Authentication** bölümüne gidin, "Sign-in method" sekmesini açın ve **E-posta/Şifre** sağlayıcısını etkinleştirin.
    *   **Firestore Database** bölümüne gidin ve **test modunda** yeni bir veritabanı oluşturun.
    *   **Storage** bölümüne gidin ve bir depolama kovası (bucket) oluşturun.

### Adım 2: Proje Yapılandırması

1.  Proje dosyalarını bir klasöre indirin.
2.  `services/firebase.ts` dosyasını açın.
3.  Firebase projenizi oluştururken size verilen `firebaseConfig` nesnesini bu dosyada belirtilen yere yapıştırın. `YOUR_API_KEY`, `YOUR_AUTH_DOMAIN` gibi alanları kendi proje bilgilerinizle doldurun.

### Adım 3: Uygulamayı Çalıştırma

1.  `index.html` dosyasını modern bir web tarayıcısında (Chrome, Firefox, Edge vb.) açın.
2.  Uygulama açıldığında, ekrandaki **Kurulum Sihirbazı**'nı takip ederek 2. Adım'da aldığınız Firebase bilgilerini ilgili dosyaya ekleyin.
3.  Sayfayı yeniledikten sonra, uygulama Firebase'e bağlanarak başlayacaktır. İlk olarak yeni bir hesap oluşturun. **Oluşturulan ilk hesap otomatik olarak Süper Admin olacaktır.**
4.  Giriş yaptıktan sonra platformu keşfetmeye başlayabilirsiniz.