# Mahmut Hoca

## 🚀 Proje Açıklaması

Mahmut Hoca, öğrencilerle etkileşimi dijitalleştiren, ödev atama, takip, değerlendirme ve iletişim süreçlerini merkezileştiren modern ve reaktif bir web uygulamasıdır. Bu sürüm, Vercel üzerinde **canlı bir veritabanı (Vercel Postgres)** ve **sunucusuz fonksiyonlar (Serverless Functions)** kullanarak tam teşekküllü bir uygulama olarak çalışmaktadır. Veriler kalıcıdır ve uygulama gerçek zamanlı olarak çalışır.

Uygulama, Google Gemini API'nin gücünü kullanarak akıllı özellikler sunar ve öğrenme sürecini daha verimli, kişiselleştirilmiş ve ilgi çekici hale getirir. Uygulama, üç farklı kullanıcı rolünü (Süper Admin, Koç, Öğrenci) destekleyerek her bir kullanıcının ihtiyacına yönelik özelleştirilmiş bir deneyim sunar.

## ✨ Temel Özellikler

- **☁️ Full-Stack Mimarisi**: Vercel Postgres veritabanı ve sunucusuz API rotaları ile ölçeklenebilir bir altyapı.
- **💾 Kalıcı Veri Saklama**: Kullanıcı bilgileri, ödevler, mesajlar ve diğer tüm veriler veritabanında güvenli bir şekilde saklanır.
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
- **Backend**: Vercel Serverless Functions (Node.js, Express)
- **Veritabanı**: Vercel Postgres
- **Veri Yönetimi**: React Context API & `useReducer`
- **Styling**: Tailwind CSS
- **Yapay Zeka**: Google Gemini API (`@google/genai`)
- **Grafikler**: Recharts
- **Dosya Yönetimi**: React Dropzone

## ⚙️ Kurulum ve Çalıştırma

Uygulamayı yerel ortamınızda çalıştırmak veya Vercel'de yayınlamak için aşağıdaki adımları izleyin.

### Adım 1: Gerekli Ortam Değişkenleri

Uygulamanın çalışması için aşağıdaki ortam değişkenlerinin ayarlanması gerekmektedir. Vercel'de deploy ediyorsanız, bu değişkenleri projenizin "Environment Variables" ayarlarından eklemelisiniz.

1.  **Gemini API Anahtarı**:
    *   Google AI Studio veya Google Cloud Console üzerinden bir Gemini API anahtarı oluşturun.
    *   Bu anahtarı `API_KEY` adında bir ortam değişkeni olarak ayarlayın.

2.  **Vercel Postgres Veritabanı Değişkenleri**:
    *   Vercel'de projenize bir Postgres veritabanı bağladığınızda, aşağıdaki değişkenler Vercel tarafından otomatik olarak sağlanacaktır. Yerel geliştirme yapıyorsanız, bu bilgileri Vercel'deki veritabanı ayarlarınızdan alıp `.env` dosyasına eklemeniz gerekir.
        *   `POSTGRES_URL`
        *   `POSTGRES_PRISMA_URL`
        *   `POSTGRES_URL_NON_POOLING`
        *   `POSTGRES_USER`
        *   `POSTGRES_HOST`
        *   `POSTGRES_PASSWORD`
        *   `POSTGRES_DATABASE`

### Adım 2: Veritabanını Hazırlama

Uygulama ilk kez çalıştırıldığında veya deploy edildiğinde, veritabanını otomatik olarak hazırlamak için özel bir API rotası içerir.

1.  Uygulama canlıya alındıktan sonra, tarayıcınızda `[UYGULAMA_URL]/api/seed` adresine gidin.
2.  Bu işlem, gerekli tabloları oluşturacak ve uygulamayı başlangıçtaki örnek verilerle dolduracaktır. Bu işlemi sadece bir kez yapmanız yeterlidir.

### Adım 3: Uygulamayı Çalıştırma

1.  Ortam değişkenleri ayarlandıktan ve veritabanı hazırlandıktan sonra uygulamayı başlatın.
2.  Örnek kullanıcı bilgileriyle giriş yapabilirsiniz:
    *   **Mahmut Hoca (Süper Admin) Girişi:**
        *   **E-posta:** `admin@egitim.com`
        *   **Şifre:** Herhangi bir şey yazabilirsiniz (örn: `123456`)
    *   **Koç Girişi:**
        *   **E-posta:** `ahmet.yilmaz@egitim.com`
        *   **Şifre:** Herhangi bir şey yazabilirsiniz (örn: `123456`)
    *   **Öğrenci Girişi:**
        *   **E-posta:** `leyla.kaya@mail.com`
        *   **Şifre:** Herhangi bir şey yazabilirsiniz (örn: `123456`)
