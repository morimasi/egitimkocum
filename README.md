# Mahmut Hoca: AI-Powered Educational Coaching Platform

_Yapay zeka ile güçlendirilmiş, yeni nesil eğitim koçluğu platformu._

[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-black?logo=nodedotjs)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-blue?logo=postgresql)](https://www.postgresql.org/)
[![Gemini API](https://img.shields.io/badge/Gemini%20API-blueviolet?logo=google&logoColor=white)](https://ai.google.dev/)

**Mahmut Hoca**, öğrenciler ve eğitim koçları için tasarlanmış, Google Gemini API'nin gücünü kullanarak öğrenme sürecini merkezileştiren, kişiselleştiren ve oyunlaştıran modern bir web uygulamasıdır. Ödev atama, takip, değerlendirme ve iletişim gibi temel işlevleri tek bir çatı altında toplarken, yapay zeka entegrasyonları ile hem öğrencilere hem de koçlara benzersiz araçlar sunar.

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
-   **Backend:** Node.js & Express.js
-   **Veritabanı:** Vercel Postgres
-   **Yapay Zeka:** Google Gemini API (`@google/genai`)

## 🚀 Hızlı Başlangıç: Yerelde Çalıştırma

Bu projeyi kendi bilgisayarınızda geliştirmeye başlamak için aşağıdaki adımları izleyin.

### Gereksinimler
- Node.js (v18 veya üstü)
- npm
- Bir Vercel hesabı (Postgres veritabanı için)
- Bir Google Gemini API anahtarı

### Kurulum

1.  **Projeyi Klonlayın:**
    ```bash
    git clone <proje-github-url>
    cd mahmut-hoca
    ```

2.  **Bağımlılıkları Yükleyin:**
    ```bash
    npm install
    ```

3.  **Veritabanı Oluşturun:**
    -   [Vercel](https://vercel.com/)'e gidin ve yeni bir proje oluşturun (bu repoyu bağlayabilirsiniz, ancak dağıtmanız gerekmez).
    -   Proje kontrol panelinde `Storage` sekmesine gidin ve bir **Postgres** veritabanı oluşturun.
    -   Veritabanını oluşturduktan sonra `.env` sekmesine gidin, "Show secret" diyerek `POSTGRES_URL` değerini kopyalayın.

4.  **Ortam Değişkenlerini Ayarlayın:**
    -   Projenin ana dizininde `.env.example` dosyasının bir kopyasını oluşturup `.env` olarak adlandırın.
    -   `.env` dosyasını açın ve Vercel'den kopyaladığınız `POSTGRES_URL` değerini ve kendi [Google Gemini API anahtarınızı](https://makersuite.google.com/app/apikey) `API_KEY` değişkenine yapıştırın.
    
    ```.env
    API_KEY="YOUR_GEMINI_API_KEY"
    POSTGRES_URL="YOUR_POSTGRES_CONNECTION_STRING"
    ```

5.  **Uygulamayı Başlatın:**
    -   Aşağıdaki komutla hem frontend (Vite) hem de backend (Express) sunucularını aynı anda başlatın:
    ```bash
    npm run dev
    ```
    -   Uygulamanız varsayılan olarak `http://localhost:5173` adresinde açılacaktır. API istekleri otomatik olarak backend sunucusuna yönlendirilecektir.

### Kurulum Sonrası

-   **İlk Kullanıcı Süper Admin'dir:** Platforma ilk kayıt olan kullanıcı, otomatik olarak **Süper Admin** yetkilerine sahip olur. Süper Admin paneli üzerinden yeni koçlar ve öğrenciler ekleyebilirsiniz.


## 📂 Proje Yapısı

```
.
├── api/          # Express.js backend sunucusu
├── components/   # Tekrar kullanılabilir React bileşenleri
├── contexts/     # Global state yönetimi (DataContext, UIContext)
├── pages/        # Ana sayfa bileşenleri
├── services/     # Harici servislerle iletişim (Gemini, seedData)
├── App.tsx       # Ana uygulama bileşeni ve yönlendirme
└── ...
```