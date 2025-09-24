# Eğitim Koçu Platformu v2

## Açıklama

Eğitim Koçu Platformu, eğitim koçları ve öğrenciler arasındaki etkileşimi dijitalleştiren, ödev atama, takip, değerlendirme ve iletişim süreçlerini merkezileştiren modern ve reaktif bir web uygulamasıdır. Bu platform, Gemini API'nin gücünü kullanarak akıllı özellikler sunar ve öğrenme sürecini daha verimli ve kişiselleştirilmiş hale getirir.

## Temel Özellikler

- **Rol Bazlı Erişim**: Süper Admin, Koç ve Öğrenci olmak üzere üç farklı kullanıcı rolü.
- **Dinamik Paneller (Dashboard)**: Her role özel, önemli metrikleri (bekleyen ödevler, not ortalaması, öğrenci sayısı vb.) ve içgörüleri gösteren ana sayfalar.
- **Gelişmiş Ödev Yönetimi**:
  - Koçlar için kolayca ödev oluşturma ve birden fazla öğrenciye atama.
  - Farklı teslimat türleri: Dosya yükleme, metin cevabı veya sadece "tamamlandı" olarak işaretleme.
  - Öğrenciler için ödev teslim etme ve takip etme.
  - Koçlar için ödevleri notlandırma ve geri bildirim sağlama.
- **Akıllı Mesajlaşma Sistemi**:
  - Birebir ve anlık mesajlaşma.
  - Duyuru gönderme, anket oluşturma.
  - Dosya ve sesli mesaj gönderme özellikleri.
  - Mesajlara emoji ile tepki verme ve yanıtlama.
- **Öğrenci ve Performans Takibi**:
  - Koçlar için öğrenci listesi ve detaylı performans analizi.
  - Not gelişim grafikleri ve ödev tamamlama istatistikleri.
- **Analitik ve Raporlama**: Rol bazlı, ödev durumları ve öğrenci performansı üzerine görselleştirilmiş veriler.
- **Kaynak Kütüphanesi**: Koçların öğrencilerle PDF, video veya link gibi kaynaklar paylaşabilmesi ve öğrencilere özel kaynaklar önerebilmesi.
- **Hedef Belirleme**: Koçların öğrenciler için hedefler belirlemesi ve öğrencilerin bu hedefleri takip etmesi.

### ✨ Gemini API Entegrasyonları

Platform, öğrenme deneyimini zenginleştirmek için Google Gemini API'yi aktif olarak kullanır:

- **Akıllı Ödev Açıklaması**: Ödev başlığına göre otomatik olarak açıklama metinleri oluşturur.
- **Akıllı Geri Bildirim**: Verilen nota göre motive edici ve yapıcı geri bildirimler üretir.
- **Otomatik Kontrol Listesi**: Ödev başlığı ve açıklamasına göre öğrencilere yol gösterecek adımlar oluşturur.
- **Akıllı Hedef Önerileri**: Öğrencinin performansına göre S.M.A.R.T. hedefler önerir.
- **Haftalık Özetler ve İçgörüler**: Hem öğrenciler hem de koçlar için haftalık performans verilerini analiz edip özetler sunar.

## Teknolojiler

- **Frontend**: React, TypeScript
- **Styling**: Tailwind CSS
- **Yapay Zeka**: Google Gemini API (@google/genai)
- **Grafikler**: Recharts
- **Veri Yönetimi**: React Context API (Mock data ile)

## Kurulum ve Çalıştırma

Bu proje, bir sunucuya ihtiyaç duymadan doğrudan tarayıcıda çalışacak şekilde tasarlanmıştır.

1. Proje dosyalarını bir klasöre indirin.
2. `index.html` dosyasını bir tarayıcıda açın.
3. Uygulama, gerekli `API_KEY`'in ortam değişkeni olarak ayarlandığını varsayar.

## Kullanım

Uygulama açıldığında bir giriş ekranı sizi karşılar. Demo için aşağıdaki hazır kullanıcılarla giriş yapabilirsiniz:

- **Süper Admin**: `admin@app.com`
- **Koç**: `ayse.yilmaz@koc.com`
- **Öğrenci**: `ali.veli@ogrenci.com`

Ayrıca, "Kullanıcı Değiştir" menüsünden farklı roller arasında kolayca geçiş yapabilirsiniz.
