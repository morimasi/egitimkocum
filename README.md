# Mahmut Hoca - AI-Powered Educational Coaching Platform

**Mahmut Hoca, öğrenciler ve eğitim koçları için tasarlanmış, yapay zeka destekli modern bir web uygulamasıdır. Öğrenme sürecini merkezileştirir, kişiselleştirir ve oyunlaştırır.**

---

## 📜 Proje Açıklaması

Mahmut Hoca, eğitim koçluğu ve öğrenci yönetimi süreçlerini dijitalleştiren, Google Gemini API'nin gücünü kullanarak akıllı özellikler sunan yenilikçi bir platformdur. Ödev atama, takip, değerlendirme ve iletişim gibi temel işlevleri tek bir çatı altında toplarken, yapay zeka entegrasyonları ile hem öğrencilere hem de koçlara benzersiz araçlar sunar.

Bu proje, Vercel üzerinde kolayca dağıtılabilen, sunucusuz (serverless) bir mimari ve Vercel Postgres veritabanı ile geliştirilmiştir. Bu sayede ölçeklenebilir, güvenli ve bakımı kolay bir yapıya sahiptir.

## ✨ Temel Özellikler

Uygulama, farklı kullanıcı rollerine göre özelleştirilmiş zengin bir özellik seti sunar:

### 👨‍🏫 Koçlar ve Süper Adminler için

-   **Öğrenci Yönetimi:** Öğrencileri davet etme, profillerini görüntüleme, özel notlar tutma.
-   **AI Destekli Ödev Oluşturma:** Tek bir başlıkla ödev açıklamaları ve kontrol listeleri oluşturma.
-   **Akıllı Değerlendirme:** Öğrenci teslimatlarına göre AI'dan not ve geri bildirim önerileri alma.
-   **Kapsamlı Analitik:** Sınıfın ve bireysel öğrencilerin performansını görsel grafiklerle ve AI özetleriyle izleme.
-   **Kaynak Kütüphanesi:** PDF, video, link gibi ders materyallerini yönetme ve öğrencilere atama.
-   **Şablon Yöneticisi:** Tekrar eden ödevler için şablonlar oluşturma ve kullanma.
-   **İletişim Araçları:** Birebir/grup mesajlaşması, anketler ve tüm öğrencilere yönelik duyurular yapma.
-   **Süper Admin Paneli:** Tüm kullanıcıları yönetme, rozetleri düzenleme ve veritabanını test verileriyle doldurma.

### 🎓 Öğrenciler için

-   **Kişiselleştirilmiş Anasayfa:** Bekleyen ödevler, not ortalaması ve AI'dan günlük tavsiyeler.
-   **Kolay Ödev Teslimi:** Metin, dosya, ses veya video kaydı ile ödev teslim etme.
-   **AI Çalışma Arkadaşı:** Takıldığı konularda 7/24 soru sorabileceği yapay zeka sohbet botu.
-   **Motivasyon ve Oyunlaştırma:** Görevleri tamamlayarak XP, seviye ve başarı rozetleri kazanma.
-   **Hedef Belirleme:** AI önerileriyle kişisel ve akademik hedefler oluşturma ve takip etme.
-   **Performans Takibi:** Ders bazında başarı grafikleri ve AI destekli performans analizleri.
-   **Odak Modu:** Pomodoro tekniği ile verimli ders çalışma seansları düzenleme.
-   **Akıllı Planlayıcı:** Hedeflere ve boş zamanlara göre kişiselleştirilmiş haftalık ders programı oluşturma.

## 🤖 Gemini API Entegrasyonları

Platformun kalbinde yer alan Google Gemini API, aşağıdaki akıllı özellikleri mümkün kılar:

-   **İçerik Üretimi:** Ödev açıklamaları, kontrol listeleri, sınav detayları ve haftalık özetler.
-   **Akıllı Geri Bildirim:** Öğrencinin notuna ve geçmiş performansına göre kişiselleştirilmiş, yapıcı geri bildirimler.
-   **Veri Analizi ve Yorumlama:** Öğrenci ve sınıf performans verilerini analiz ederek eyleme geçirilebilir içgörüler ve raporlar sunma.
-   **JSON Modu ve Fonksiyon Çağırma:** Yapılandırılmış veriler (örn. kontrol listesi, not önerisi) üretme.
-   **Multimodal Yetenekler:** Öğrencilerin yüklediği görselleri (örn. çözemedikleri bir soru) analiz edip ipuçları verme.
-   **Sohbet Yeteneği:** "Çalışma Arkadaşım" botu ile akıcı ve bağlama duyarlı sohbetler gerçekleştirme.

## 📸 Ekran Görüntüleri

*Bu bölüme uygulamanın arayüzünden görseller eklenebilir.*

`[Anasayfa (Dashboard) Ekran Görüntüsü]`
`[Ödev Detayı ve AI Geri Bildirim Ekran Görüntüsü]`
`[Öğrenci Detay Sayfası Ekran Görüntüsü]`
`[Mesajlaşma Arayüzü Ekran Görüntüsü]`

## 🛠️ Kullanılan Teknolojiler

-   **Frontend:**
    -   **React & TypeScript:** Modern, tip güvenli bir kullanıcı arayüzü için.
    -   **Vite:** Hızlı ve verimli geliştirme ortamı.
    -   **Tailwind CSS:** Hızlı ve özelleştirilebilir stilizasyon.
    -   **Recharts:** Etkileşimli veri görselleştirme ve grafikler.
-   **Backend (Sunucusuz):**
    -   **Vercel Functions (Node.js & Express.js):** Ölçeklenebilir ve yönetimi kolay API endpoint'leri.
-   **Veritabanı:**
    -   **Vercel Postgres:** Güvenilir ve tam entegre bir SQL veritabanı.
-   **Yapay Zeka:**
    -   **Google Gemini API (`@google/genai`):** Platformun tüm akıllı özellikleri için.

## 🏗️ Proje Mimarisi

Proje, modern bir web uygulaması mimarisi üzerine kurulmuştur:

1.  **Frontend (React):** Kullanıcının tarayıcısında çalışan ve arayüzü oluşturan kısımdır.
2.  **Backend API (Vercel Functions):** `api/` dizini altındaki sunucusuz fonksiyonlar, veritabanı işlemleri ve güvenli Gemini API çağrıları gibi mantıksal işlemleri yürütür. Bu yapı, ön uçtan hassas bilgileri (API anahtarı gibi) soyutlar.
3.  **Veritabanı (Vercel Postgres):** Tüm uygulama verileri (kullanıcılar, ödevler, mesajlar vb.) bu veritabanında kalıcı olarak saklanır.

**Veri Akışı:** Kullanıcı arayüzünden yapılan bir istek (örn. yeni ödev oluşturma) React bileşeninden Vercel Function'a gönderilir. Fonksiyon, isteği işler, Vercel Postgres veritabanında gerekli değişiklikleri yapar ve sonucu tekrar arayüze döndürür.

## 🚀 Vercel Üzerinde Kurulum ve Çalıştırma

Bu projeyi Vercel'de canlıya almak oldukça basittir:

### Adım 1: Projeyi Vercel'e Aktarma

1.  Bu projeyi kendi GitHub hesabınıza **fork**'layın.
2.  Vercel hesabınıza giriş yapın ve `Add New... -> Project` seçeneğini seçin.
3.  GitHub reponuzu Vercel'e bağlayın. Vercel, projeyi otomatik olarak bir "Vite" projesi olarak tanıyacaktır.

### Adım 2: Veritabanı Kurulumu

1.  Vercel proje ayarları sayfasında `Storage` sekmesine gidin.
2.  `Postgres` seçeneğini seçin ve projeniz için yeni bir veritabanı oluşturun.
3.  Oluşturduktan sonra `.env.local` sekmesine tıklayın. Vercel'in veritabanı için gerekli ortam değişkenlerini (`POSTGRES_*` ile başlayanlar) projenize otomatik olarak eklediğini göreceksiniz. Bu değişkenler dağıtım sırasında projenize enjekte edilecektir.

### Adım 3: Gemini API Anahtarını Ekleme

1.  Proje ayarlarında `Settings -> Environment Variables` bölümüne gidin.
2.  `API_KEY` adında yeni bir ortam değişkeni oluşturun.
3.  Değer olarak kendi Google Gemini API anahtarınızı yapıştırın.
4.  Kaydedin.

### Adım 4: Dağıtma ve Başlatma

1.  Yaptığınız değişikliklerin ardından Vercel, projenizi otomatik olarak yeniden dağıtacaktır. Dilerseniz `Deployments` sekmesinden manuel olarak da tetikleyebilirsiniz.
2.  Dağıtım tamamlandıktan sonra Vercel tarafından sağlanan domain adresine gidin.
3.  Uygulama ilk açıldığında veritabanı tablolarını otomatik olarak oluşturacaktır.
4.  **Önemli:** Platforma **ilk kayıt olan kullanıcı**, otomatik olarak **Süper Admin** yetkilerine sahip olacaktır. Sonraki kayıtlar varsayılan olarak "Öğrenci" rolüyle oluşturulur.
5.  Süper Admin olarak giriş yaptıktan sonra `Süper Admin Paneli` üzerinden yeni koçlar ve öğrenciler oluşturabilirsiniz.

## 📂 Dosya Yapısı

```
.
├── api/                  # Vercel sunucusuz fonksiyonları (Backend)
│   └── index.js          # Express.js ile API yönlendirmesi
├── components/           # Tekrar kullanılabilir React bileşenleri
├── contexts/             # Global state yönetimi (DataContext, UIContext)
├── pages/                # Ana sayfa bileşenleri (Dashboard, Assignments vb.)
├── services/             # Harici servislerle iletişim (geminiService, seedData)
├── App.tsx               # Ana uygulama bileşeni ve sayfa yönlendirmesi
├── index.tsx             # React uygulamasının başlangıç noktası
├── index.html            # Ana HTML dosyası
└── README.md             # Bu dosya
```
