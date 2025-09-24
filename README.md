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
- **📊 Dinamik Paneller (Dashboard)**: Her role özel, önemli metrikleri (bekleyen ödevler, not ortalaması, öğrenci sayısı vb.) ve yapay zeka destekli içgörüleri gösteren ana sayfalar.
- **📚 Gelişmiş Ödev Yönetimi**:
  - Koçlar için kolayca ödev oluşturma ve birden fazla öğrenciye atama.
  - **Farklı Teslimat Türleri**: Dosya yükleme, metin cevabı veya sadece "tamamlandı" olarak işaretleme.
  - Öğrenciler için ödev teslim etme ve ilerleme takibi.
  - Koçlar için ödevleri notlandırma, dosya ekleme ve sesli geri bildirim sağlama.
- **💬 Akıllı Mesajlaşma Sistemi**:
  - Birebir ve anlık mesajlaşma.
  - Koçlar için tüm öğrencilere duyuru gönderme ve anket oluşturma.
  - **Zengin Medya Desteği**: Dosya, resim (önizlemeli) ve sesli mesaj gönderme.
  - Mesajlara emoji ile tepki verme ve alıntı yaparak yanıtlama.
- **🚀 Veritabanı Hazırlama (Seeding)**: Süper Admin paneli üzerinden tek tıkla tüm demo verilerini Firestore'a yükleme özelliği.

### 🤖 Gemini API Entegrasyonları

Platform, öğrenme deneyimini zenginleştirmek ve koçların iş yükünü azaltmak için Google Gemini API'yi aktif olarak kullanır:

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

Bu projenin çalışabilmesi için bir Firebase projesine ihtiyacınız vardır.

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

4.  **Uygulamayı Çalıştırın**:
    -   `index.html` dosyasını modern bir web tarayıcısında (Chrome, Firefox, Edge vb.) açın.
    -   Uygulama, gerekli `API_KEY`'in bir ortam değişkeni olarak ayarlandığını ve erişilebilir olduğunu varsayar.

## 🕹️ Kullanım

Uygulama ilk açıldığında boş bir veritabanı ile başlayacaktır.

1.  **Admin Olarak Kayıt Olun**: "Kayıt Ol" ekranını kullanarak `admin@app.com` e-postası ve seçeceğiniz bir şifre ile sisteme ilk kullanıcı olarak kayıt olun.
2.  **Demo Verilerini Yükleyin**: Kayıt olduktan sonra Süper Admin Paneli'ne yönlendirileceksiniz. **"Demo Verilerini Yükle"** butonuna tıklayarak veritabanını hazır verilerle doldurun. Bu işlem, diğer demo kullanıcılarını da oluşturacaktır.
3.  **Diğer Kullanıcılarla Giriş Yapın**: Artık aşağıdaki demo kullanıcıları ve **`password123`** şifresi ile giriş yapabilirsiniz:
    -   **Koç**: `ayse.yilmaz@koc.com`
    -   **Öğrenci**: `ali.veli@ogrenci.com`
    -   Sol menüdeki "Kullanıcı Değiştir" dropdown'ı, farklı roller arasında hızlıca geçiş yapmanızı sağlar.
