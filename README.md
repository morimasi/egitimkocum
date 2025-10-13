# Mahmut Hoca: AI-Powered Educational Coaching Platform

_Yapay zeka ile güçlendirilmiş, yeni nesil eğitim koçluğu platformu._

[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
[![Vercel](https://img.shields.io/badge/Vercel-black?logo=vercel)](https://vercel.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-blue?logo=postgresql)](https://www.postgresql.org/)
[![Gemini API](https://img.shields.io/badge/Gemini%20API-blueviolet?logo=google&logoColor=white)](https://ai.google.dev/)

**Mahmut Hoca**, öğrenciler ve eğitim koçları için tasarlanmış, Google Gemini API'nin gücünü kullanarak öğrenme sürecini merkezileştiren, kişiselleştiren ve oyunlaştıran modern bir web uygulamasıdır. Ödev atama, takip, değerlendirme ve iletişim gibi temel işlevleri tek bir çatı altında toplarken, yapay zeka entegrasyonları ile hem öğrencilere hem de koçlara benzersiz araçlar sunar.

Vercel üzerinde kolayca dağıtılabilen, sunucusuz (serverless) mimari ve Vercel Postgres veritabanı ile geliştirilmiştir. Bu sayede ölçeklenebilir, güvenli ve bakımı kolay bir yapıya sahiptir.

## ✨ Ana Özellikler

Platform, her kullanıcı rolü için özenle tasarlanmış zengin bir deneyim sunar.

### 👨‍🏫 Koçlar & Adminler için

-   **🤖 AI Destekli İçerik:** Tek başlıkla ödev açıklamaları, sınavlar ve kontrol listeleri oluşturun.
-   **✍️ Akıllı Değerlendirme:** Öğrenci teslimatlarına göre AI'dan not ve geri bildirim önerileri alın.
-   **📊 Kapsamlı Analitik:** Sınıf ve öğrenci performansını görsel grafikler ve AI özetleriyle izleyin.
-   **📚 Zengin Kaynaklar:** Kütüphane, Soru Bankası ve Şablon Yöneticisi ile kaynaklarınızı yönetin.
-   **💬 Etkili İletişim:** Birebir/grup mesajlaşması, anketler ve duyurular yapın.
-   **🛡️ Süper Admin Paneli:** Tüm kullanıcıları yönetin ve tek tıkla platformu zengin test verileriyle doldurun.

### 🎓 Öğrenciler için

-   **🚀 Kişiselleştirilmiş Panel:** Ödevler, notlar ve AI'dan günlük motivasyon tavsiyeleri.
-   **💡 AI Çalışma Arkadaşı:** 7/24 soru sorabileceğiniz, takıldığınız konularda size yol gösteren yapay zeka asistanı.
-   **🎮 Oyunlaştırma & Motivasyon:** Görevleri tamamlayarak XP, seviyeler ve başarı rozetleri kazanın.
-   **🎯 Hedef Belirleme:** AI önerileriyle kişisel ve akademik hedefler oluşturun ve takip edin.
-   **📈 Performans Takibi:** Ders bazında başarı grafikleri ve AI destekli performans analizleri.
-   **⏳ Odak Modu:** Pomodoro tekniği ile verimli ders çalışma seansları düzenleyin.
-   **📅 Akıllı Planlayıcı:** Hedeflerinize göre kişiselleştirilmiş haftalık ders programı oluşturun.

## 🤖 Gemini API'nin Gücü

Platformumuzun zekası, Google Gemini API'nin gelişmiş yeteneklerinden gelir:

-   **İçerik Üretimi:** Ödev açıklamaları, sınav detayları ve haftalık özetler gibi metin tabanlı içerikleri saniyeler içinde oluşturur.
-   **Akıllı Geri Bildirim:** Öğrencinin notunu ve geçmiş performansını analiz ederek kişiselleştirilmiş, yapıcı geri bildirimler sunar.
-   **Veri Analizi:** Karmaşık performans verilerini yorumlayarak hem öğrenci hem de koç için eyleme geçirilebilir, anlaşılır içgörüler sağlar.
-   **Multimodal Yetenekler:** Öğrencilerin yüklediği görselleri (örn. çözemedikleri bir soru) analiz edip adım adım çözüm ipuçları verir.
-   **Doğal Sohbet:** "Çalışma Arkadaşım" botu ile akıcı ve bağlama duyarlı, öğretici sohbetler gerçekleştirir.

## 🛠️ Teknoloji Mimarisi

-   **Frontend:** React, TypeScript, Vite, Tailwind CSS, Recharts
-   **Backend:** Vercel Functions (Node.js & Express.js)
-   **Veritabanı:** Vercel Postgres
-   **Yapay Zeka:** Google Gemini API (`@google/genai`)

## 🚀 Hızlı Başlangıç: Vercel'de Dağıtma

Bu projeyi Vercel üzerinde dakikalar içinde canlıya alabilirsiniz.

1.  **Projeyi Fork'layın:** Bu repoyu kendi GitHub hesabınıza fork'layın.
2.  **Vercel Projesi Oluşturun:**
    -   Vercel'e gidin ve `Add New... -> Project` seçeneğiyle GitHub reponuzu içeri aktarın.
    -   Framework olarak "Vite" seçildiğinden emin olun.
3.  **Veritabanı Oluşturun:**
    -   Proje ayarlarında `Storage` sekmesine gidin ve bir **Postgres** veritabanı oluşturun.
    -   Veritabanını projenize bağlayın. Vercel, gerekli `POSTGRES_*` ortam değişkenlerini otomatik olarak ekleyecektir.
4.  **API Anahtarını Ekleyin:**
    -   Proje ayarlarında `Settings -> Environment Variables` bölümüne gidin.
    -   `API_KEY` adında yeni bir değişken oluşturun ve değer olarak kendi Google Gemini API anahtarınızı yapıştırın.
5.  **Dağıtın (Deploy):**
    -   Vercel, bu ayarlardan sonra projenizi otomatik olarak dağıtacaktır. `Deploy` butonuna basarak işlemi manuel de başlatabilirsiniz.
    -   Dağıtım tamamlandıktan sonra Vercel'in size verdiği domain adresine gidin.

### Kurulum Sonrası

-   **İlk Kullanıcı Süper Admin'dir:** Platforma ilk kayıt olan kullanıcı, otomatik olarak **Süper Admin** yetkilerine sahip olur. Süper Admin paneli üzerinden yeni koçlar ve öğrenciler ekleyebilirsiniz.

## 📂 Proje Yapısı

```
.
├── api/          # Vercel sunucusuz fonksiyonları (Backend)
├── components/   # Tekrar kullanılabilir React bileşenleri
├── contexts/     # Global state yönetimi (DataContext, UIContext)
├── pages/        # Ana sayfa bileşenleri
├── services/     # Harici servislerle iletişim (Gemini, seedData)
├── App.tsx       # Ana uygulama bileşeni ve yönlendirme
└── ...
```