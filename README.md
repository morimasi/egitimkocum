# Eğitim Koçu Platformu v2 (Lokal Demo)

## 🚀 Proje Açıklaması

Eğitim Koçu Platformu, eğitim koçları ve öğrenciler arasındaki etkileşimi dijitalleştiren, ödev atama, takip, değerlendirme ve iletişim süreçlerini merkezileştiren modern ve reaktif bir web uygulamasıdır. Bu sürüm, **herhangi bir sunucu veya veritabanı kurulumu gerektirmeden** tamamen yerel olarak çalışacak şekilde tasarlanmıştır.

Uygulama, sahte (mock) verilerle çalışır ve tüm veri işlemlerini (kullanıcı girişi, ödev ekleme, mesaj gönderme vb.) doğrudan tarayıcıda yönetir. Bu, platformun özelliklerini hızlıca denemek ve test etmek için ideal bir ortam sunar.

Platform, Google Gemini API'nin gücünü kullanarak akıllı özellikler sunar ve öğrenme sürecini daha verimli, kişiselleştirilmiş ve ilgi çekici hale getirir. Uygulama, üç farklı kullanıcı rolünü (Süper Admin, Koç, Öğrenci) destekleyerek her bir kullanıcının ihtiyacına yönelik özelleştirilmiş bir deneyim sunar.

## ✨ Temel Özellikler

- **💻 Sunucusuz Çalışma**: Herhangi bir veritabanı veya backend kurulumu gerektirmez. `index.html` dosyasını tarayıcıda açarak anında çalıştırabilirsiniz.
- **🎭 Rol Bazlı Deneyim**: Süper Admin, Koç ve Öğrenci olmak üzere üç farklı kullanıcı rolü arasında demo amacıyla kolayca geçiş yapma imkanı.
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
- **Styling**: Tailwind CSS
- **Yapay Zeka**: Google Gemini API (`@google/genai`)
- **Grafikler**: Recharts
- **Veri Yönetimi**: React Context API (Yerel State Yönetimi için)

## ⚙️ Kurulum ve Çalıştırma

Bu projenin çalışabilmesi için sadece bir Gemini API anahtarına ihtiyacınız vardır.

### Adım 1: Gemini API Anahtarı
1. Google AI Studio veya Google Cloud Console üzerinden bir Gemini API anahtarı oluşturun.
2. Bu API anahtarının, uygulamanın çalıştığı ortamda `API_KEY` adında bir ortam değişkeni olarak ayarlandığından emin olun. Geliştirme ortamları, bu değişkeni ayarlamanıza olanak tanır.

### Adım 2: Uygulamayı Çalıştırma
1.  Proje dosyalarını bir klasöre indirin.
2.  `index.html` dosyasını modern bir web tarayıcısında (Chrome, Firefox, Edge vb.) açın.
3.  Uygulama, demo verileriyle birlikte otomatik olarak başlayacaktır. Giriş ekranındaki demo kullanıcı butonlarını kullanarak veya yeni bir hesap oluşturarak platformu keşfetmeye başlayabilirsiniz.

**Not**: Bu lokal versiyonda yaptığınız değişiklikler (yeni ödevler, mesajlar vb.) kalıcı değildir ve sayfa yenilendiğinde sıfırlanır.