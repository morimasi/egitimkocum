# Eğitim Koçu Platformu v3 (Standalone Demo)

## 🚀 Proje Açıklaması

Eğitim Koçu Platformu, eğitim koçları ve öğrenciler arasındaki etkileşimi dijitalleştiren, ödev atama, takip, değerlendirme ve iletişim süreçlerini merkezileştiren modern ve reaktif bir web uygulamasıdır. Bu sürüm, **herhangi bir backend veya veritabanı kurulumu gerektirmeden**, tamamen tarayıcı içinde çalışan bir demo olarak tasarlanmıştır. Uygulama, başlangıçta örnek verilerle yüklenir ve yaptığınız değişiklikler sayfa yenilenene kadar oturumda saklanır.

Uygulama, Google Gemini API'nin gücünü kullanarak akıllı özellikler sunar ve öğrenme sürecini daha verimli, kişiselleştirilmiş ve ilgi çekici hale getirir. Uygulama, üç farklı kullanıcı rolünü (Süper Admin, Koç, Öğrenci) destekleyerek her bir kullanıcının ihtiyacına yönelik özelleştirilmiş bir deneyim sunar.

## ✨ Temel Özellikler

- **🌐 Bağımsız Çalışma**: Harici veritabanı veya backend kurulumu gerektirmez.
- **💾 Örnek Veri Seti**: Uygulama, zengin bir örnek veri setiyle (kullanıcılar, ödevler, mesajlar vb.) başlar.
- **🎭 Rol Bazlı Deneyim**: Süper Admin, Koç ve Öğrenci olmak üzere üç farklı kullanıcı rolü için özelleştirilmiş arayüzler ve yetkiler.
- **📊 Dinamik Paneller (Dashboard)**: Her role özel, önemli metrikleri ve yapay zeka destekli içgörüleri gösteren ana sayfalar.
- **📚 Gelişmiş Ödev Yönetimi**: Koçlar için kolayca ödev oluşturma, farklı teslimat türleri belirleme ve yapay zeka destekli geri bildirimler sağlama.
- **💬 Akıllı Mesajlaşma Sistemi**: Birebir ve grup mesajlaşması, duyurular, anketler, dosya/sesli mesaj gönderme ve mesajlara reaksiyon verme.
- **🎯 Odak Modu**: Pomodoro tekniği ile öğrencilerin çalışma verimini artırmalarına yardımcı olan özelleştirilebilir bir zamanlayıcı.
- **🏆 Motivasyon ve Oyunlaştırma**: Seviye, XP, seriler ve kazanılabilir rozetler ile öğrenci motivasyonunu artırma.

### 🤖 Gemini API Entegrasyonları

- **✍️ Akıllı Ödev Açıklaması**: Ödev başlığına göre otomatik olarak açıklama metinleri oluşturur.
- **💯 Akıllı Not Önerisi**: Öğrencinin teslim ettiği çalışmayı analiz ederek bir not ve gerekçe önerir.
- **🗣️ Akıllı Geri Bildirim**: Verilen nota göre motive edici ve yapıcı geri bildirimler üretir.
- **✅ Otomatik Kontrol Listesi**: Ödev başlığı ve açıklamasına göre öğrencilere yol gösterecek adımlar oluşturur.
- **🎯 Akıllı Hedef Önerileri**: Öğrencinin performansına göre S.M.A.R.T. hedefler önerir.
- **📅 Haftalık Özetler ve İçgörüler**: Hem öğrenciler hem de koçlar için haftalık performans verilerini analiz edip özetler sunar.

## 🛠️ Kullanılan Teknolojiler

- **Frontend**: React, TypeScript
- **Veri Yönetimi**: React Context API & `useReducer` (Bellek içi örnek veri)
- **Styling**: Tailwind CSS
- **Yapay Zeka**: Google Gemini API (`@google/genai`)
- **Grafikler**: Recharts
- **Dosya Yönetimi**: React Dropzone

## ⚙️ Kurulum ve Çalıştırma

Uygulamayı yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin.

### Adım 1: Gemini API Anahtarı

1.  **Gemini API Anahtarı Oluşturun**:
    *   Google AI Studio veya Google Cloud Console üzerinden bir Gemini API anahtarı oluşturun.
    *   Bu anahtar, uygulamanın çalıştığı ortamda `API_KEY` adında bir ortam değişkeni olarak ayarlanmalıdır. Proje, bu değişkene erişebildiğini varsayarak çalışır.

### Adım 2: Uygulamayı Çalıştırma

1.  API anahtarını ayarladıktan sonra uygulamayı başlatın veya tarayıcıda sayfayı yenileyin.
2.  Uygulama, önceden tanımlanmış örnek kullanıcılar ve verilerle başlayacaktır. Aşağıdaki örnek kullanıcı bilgileriyle giriş yapabilirsiniz:
    *   **Koç Girişi:**
        *   **E-posta:** `ahmet.yilmaz@egitim.com`
        *   **Şifre:** Herhangi bir şey yazabilirsiniz (örn: `123456`)
    *   **Öğrenci Girişi:**
        *   **E-posta:** `leyla.kaya@mail.com`
        *   **Şifre:** Herhangi bir şey yazabilirsiniz (örn: `123456`)
3.  Platformu test etmek için yeni kullanıcılar da kaydedebilirsiniz.
4.  **Süper Admin Paneli'nde** bulunan "Deneme Verisi Ekle" butonu ile verileri istediğiniz zaman başlangıç durumuna sıfırlayabilirsiniz.
