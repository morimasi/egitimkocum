# Mahmut Hoca

## 🚀 Proje Açıklaması

Mahmut Hoca, öğrencilerle etkileşimi dijitalleştiren, ödev atama, takip, değerlendirme ve iletişim süreçlerini merkezileştiren modern ve reaktif bir web uygulamasıdır. Bu sürüm, **tamamen yerel olarak** çalışacak şekilde yapılandırılmıştır. Veriler, tarayıcınızın **Local Storage**'ında saklanır, bu da sayfayı yenilediğinizde bilgilerinizin kaybolmamasını sağlar.

Uygulama, Google Gemini API'nin gücünü kullanarak akıllı özellikler sunar ve öğrenme sürecini daha verimli, kişiselleştirilmiş ve ilgi çekici hale getirir. Uygulama, üç farklı kullanıcı rolünü (Süper Admin, Koç, Öğrenci) destekleyerek her bir kullanıcının ihtiyacına yönelik özelleştirilmiş bir deneyim sunar.

## ✨ Temel Özellikler

- **💻 Tamamen Yerel Çalışma**: Herhangi bir sunucu veya veritabanı bağımlılığı olmadan doğrudan tarayıcıda çalışır.
- **💾 Tarayıcıda Veri Saklama**: Kullanıcı bilgileri, ödevler, mesajlar ve diğer tüm veriler Local Storage'da saklanır ve oturumlar arasında kalıcıdır.
- **🎭 Rol Bazlı Deneyim**: Süper Admin, Koç ve Öğrenci olmak üzere üç farklı kullanıcı rolü için özelleştirilmiş arayüzler ve yetkiler.
- **📊 Dinamik Paneller (Dashboard)**: Her role özel, önemli metrikleri ve yapay zeka destekli içgörüleri gösteren ana sayfalar.
- **📚 Gelişmiş Ödev Yönetimi**: Koçlar için kolayca ödev oluşturma, farklı teslimat türleri belirleme ve yapay zeka destekli geri bildirimler sağlama.
- **💬 Akıllı Mesajlaşma Sistemi**: Birebir ve grup mesajlaşması, duyurular, anketler, dosya/sesli mesaj gönderme ve mesajlara reaksiyon verme.
- **🎯 Odak Modu**: Pomodoro tekniği ile öğrencilerin çalışma verimini artırmalarına yardımcı olan özelleştirilebilir bir zamanlayıcı.
- **🏆 Motivasyon ve Oyunlaştırma**: Seviye, XP, seriler ve kazanılabilir rozetler ile öğrenci motivasyonunu artırma.
- ** Görüntüleme Seçenekleri**: Öğrenciler sayfasında **Izgara** ve **Liste** görünümü arasında geçiş yapma ve sıralama özelliği.

### 🤖 Gemini API Entegrasyonları

- **✍️ Akıllı Ödev Açıklaması**: Ödev başlığına göre otomatik olarak açıklama metinleri oluşturur.
- **💯 Akıllı Not Önerisi**: Öğrencinin teslim ettiği çalışmayı analiz ederek bir not ve gerekçe önerir.
- **🗣️ Akıllı Geri Bildirim**: Verilen nota göre motive edici ve yapıcı geri bildirimler üretir.
- **✅ Otomatik Kontrol Listesi**: Ödev başlığı ve açıklamasına göre öğrencilere yol gösterecek adımlar oluşturur.
- **🎯 Akıllı Hedef Önerileri**: Öğrencinin performansına göre S.M.A.R.T. hedefler önerir.
- **🧠 Akıllı Çalışma Planı**: Haftalık müsait zamanlara, hedef sınavlara ve odak derslerine göre kişiselleştirilmiş bir çalışma programı oluşturur.
- **📈 Sınav Performans Analizi**: Öğrencinin genel performansını analiz eder, güçlü ve zayıf yönlerini belirler ve kişiselleştirilmiş eylem planları sunar.
- **📅 Haftalık Özetler ve İçgörüler**: Hem öğrenciler hem de koçlar için haftalık performans verilerini analiz edip özetler sunar.

## 🛠️ Kullanılan Teknolojiler

- **Frontend**: React, TypeScript
- **Veri Yönetimi**: React Context API & `useReducer` with Local Storage
- **Styling**: Tailwind CSS
- **Yapay Zeka**: Google Gemini API (`@google/genai`)
- **Grafikler**: Recharts
- **Dosya Yönetimi**: React Dropzone

## ⚙️ Kurulum ve Çalıştırma

### Adım 1: Gerekli Ortam Değişkenleri

Uygulamanın yapay zeka özelliklerinin çalışması için bir Gemini API anahtarına ihtiyacınız vardır.

1.  Google AI Studio veya Google Cloud Console üzerinden bir Gemini API anahtarı oluşturun.
2.  Projenin ana dizininde `.env` adında bir dosya oluşturun.
3.  Dosyanın içine API anahtarınızı aşağıdaki formatta ekleyin:
    ```
    VITE_API_KEY=YAPAY_ZEKA_ANAHTARINIZI_BURAYA_YAPISTIRIN
    ```
    *Not: Vite ile çalıştığımız için değişkenin `VITE_` önekiyle başlaması zorunludur.*

### Adım 2: Uygulamayı Başlatma

1.  Gerekli paketleri yükleyin:
    ```bash
    npm install
    ```
2.  Yerel geliştirme sunucusunu başlatın:
    ```bash
    npm run dev
    ```
3.  Uygulama tarayıcıda açıldığında, ilk kurulum ekranı belirecektir. **"Kurulumu Başlat"** butonuna tıklayarak örnek verilerin yüklenmesini sağlayın. Bu işlem, uygulamayı test edebileceğiniz örnek kullanıcılar, ödevler ve mesajlarla dolduracaktır.

### Adım 3: Giriş Yapma

Kurulum tamamlandıktan sonra giriş ekranına yönlendirileceksiniz. Aşağıdaki örnek kullanıcı bilgileriyle giriş yapabilirsiniz (şifre her kullanıcı için `123456` olarak ayarlanmıştır, ancak giriş ekranı şifreyi kontrol etmez, sadece e-postayı kontrol eder):

-   **Mahmut Hoca (Süper Admin) Girişi:**
    -   **E-posta:** `admin@egitim.com`
-   **Koç Girişi:**
    -   **E-posta:** `ahmet.yilmaz@egitim.com`
-   **Öğrenci Girişi:**
    -   **E-posta:** `leyla.kaya@mail.com`
