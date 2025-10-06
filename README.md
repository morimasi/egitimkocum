# Mahmut Hoca

## 🚀 Proje Açıklaması

Mahmut Hoca, öğrencilerle etkileşimi dijitalleştiren, ödev atama, takip, değerlendirme ve iletişim süreçlerini merkezileştiren modern ve reaktif bir web uygulamasıdır. Bu sürüm, **Vercel üzerinde yayınlanmak üzere** sunucusuz bir arka uç ve Vercel Postgres veritabanı ile çalışacak şekilde yapılandırılmıştır.

Uygulama, Google Gemini API'nin gücünü kullanarak akıllı özellikler sunar ve öğrenme sürecini daha verimli, kişiselleştirilmiş ve ilgi çekici hale getirir. Uygulama, üç farklı kullanıcı rolünü (Süper Admin, Koç, Öğrenci) destekleyerek her bir kullanıcının ihtiyacına yönelik özelleştirilmiş bir deneyim sunar.

## ✨ Temel Özellikler

- **☁️ Sunucusuz Mimari**: Vercel Functions üzerinde çalışan ölçeklenebilir ve yönetimi kolay bir arka uç.
- **💾 Kalıcı Veritabanı**: Tüm kullanıcı, ödev ve mesaj verileri için Vercel Postgres entegrasyonu.
- **🔐 Güvenli API Erişimi**: Gemini API anahtarı, ön uçtan gizlenerek güvenli bir şekilde arka uçta saklanır.
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

## 🛠️ Kullanılan Teknolojiler

- **Frontend**: React, TypeScript, Vite
- **Backend**: Node.js, Express.js on Vercel Functions
- **Veritabanı**: Vercel Postgres
- **Styling**: Tailwind CSS
- **Yapay Zeka**: Google Gemini API (`@google/genai`)
- **Grafikler**: Recharts
- **Dosya Yönetimi**: React Dropzone (Base64 olarak veritabanında saklanır)

## ⚙️ Vercel Üzerinde Kurulum ve Çalıştırma

### Adım 1: Projeyi Vercel'e Aktarma

1.  Bu projeyi kendi GitHub hesabınıza fork'layın veya klonlayın.
2.  Vercel hesabınıza giriş yapın ve "Add New... -> Project" seçeneğini seçin.
3.  GitHub reponuzu Vercel'e bağlayın. Vercel, projeyi otomatik olarak bir "Vite" projesi olarak tanıyacaktır.

### Adım 2: Veritabanı Kurulumu

1.  Proje ayarları sayfasında "Storage" sekmesine gidin.
2.  "Postgres" seçeneğini seçin ve projeniz için yeni bir veritabanı oluşturun.
3.  Oluşturduktan sonra ".env.local" sekmesine tıklayın. Vercel'in veritabanı için gerekli ortam değişkenlerini (`POSTGRES_*` ile başlayanlar) projenize otomatik olarak eklediğini göreceksiniz.

### Adım 3: Gemini API Anahtarını Ekleme

1.  Proje ayarlarında "Settings" -> "Environment Variables" bölümüne gidin.
2.  `API_KEY` adında yeni bir ortam değişkeni oluşturun.
3.  Değer olarak kendi Google Gemini API anahtarınızı yapıştırın.
4.  Kaydedin ve projenizi yeniden dağıtın ("Deployments" sekmesinden "Redeploy").

### Adım 4: Uygulamayı Başlatma

1.  Dağıtım tamamlandıktan sonra Vercel tarafından sağlanan domain adresine gidin.
2.  Uygulama ilk açıldığında veritabanı tablolarını ve örnek verileri otomatik olarak oluşturacaktır. Bu işlem birkaç saniye sürebilir.
3.  Ardından kayıt ekranı görünecektir. **İlk kayıt olan kullanıcı otomatik olarak Süper Admin olacaktır.**

### Adım 5: Giriş Yapma

-   Kayıt olduktan sonra oluşturduğunuz hesapla giriş yapabilirsiniz.
-   Süper Admin olarak giriş yaptıktan sonra "Süper Admin Paneli" üzerinden yeni koçlar ve öğrenciler oluşturabilirsiniz.