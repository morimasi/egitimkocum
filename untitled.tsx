/*
İşte size özel olarak hazırladığım, adım adım ilerleyecek stratejik planım:
Stratejik Plan: Firebase Entegrasyonu ile Gerçek Zamanlı Veri Altyapısına Geçiş
Bu planın temel amacı, useMockData.ts dosyasını tamamen ortadan kaldırarak uygulamanın veri katmanını Cloud Firestore (veritabanı), Firebase Authentication (kullanıcı yönetimi) ve Firebase Storage (dosya depolama) servisleri üzerine inşa etmektir.
Adım 1: Proje Kurulumu ve Yapılandırma
Firebase Projesi Oluşturma: Google Firebase konsolunda sizin için yeni bir proje oluşturulacak.
Uygulama Entegrasyonu: Web uygulamanız bu Firebase projesine kaydedilecek ve gerekli konfigürasyon anahtarları (apiKey, authDomain vb.) güvenli bir şekilde projenize eklenecek.
Servisleri Aktif Etme: Proje içinde Authentication, Firestore Database ve Storage servislerini aktif hale getireceğiz.
Adım 2: Firebase Authentication ile Güvenli Kullanıcı Yönetimi
Mevcut sahte login ve register fonksiyonları, Firebase'in güvenli ve standartlaşmış signInWithEmailAndPassword ve createUserWithEmailAndPassword metotlarıyla değiştirilecek.
Kullanıcının oturum durumu (currentUser) artık useState veya localStorage ile değil, Firebase'in kendi onAuthStateChanged dinleyicisi ile anlık ve güvenli bir şekilde yönetilecek. Bu sayede bir kullanıcı giriş yaptığında veya çıktığında uygulama anında haberdar olacak.
Adım 3: Cloud Firestore ile Veri Modelleme ve Taşıma
Veri Yapısını Oluşturma: Mevcut veri tiplerimiz (Users, Assignments, Messages, Goals vb.) Firestore'un koleksiyon/döküman yapısına uygun olarak yeniden modellenecek. Örneğin, "users" adında bir koleksiyonumuz olacak ve her bir kullanıcı bu koleksiyon içinde bir döküman olarak yer alacak.
Başlangıç Verisini Yükleme: useMockData.ts dosyasındaki mevcut veriler, Firestore'a bir kerelik olmak üzere aktarılacak. Böylece uygulamayı ilk açtığımızda boş bir veritabanı ile karşılaşmayacağız.
Adım 4: Gerçek Zamanlı Veri Akışı (Real-time Listeners)
Bu, planın en heyecan verici kısmı. DataContext içerisindeki useState ile tutulan veriler (assignments, messages vb.) yerine Firestore'un onSnapshot dinleyicilerini kullanacağız.
onSnapshot Nasıl Çalışır? Bu dinleyici, veritabanındaki belirli bir koleksiyona (örneğin, "assignments" koleksiyonuna) abone olur. Bu koleksiyona yeni bir ödev eklendiğinde, var olan bir ödev güncellendiğinde veya silindiğinde, veritabanı bu değişikliği anında uygulamaya gönderir. React state'imiz otomatik olarak güncellenir ve arayüz yeniden render edilir. Sayfayı yenilemeye gerek kalmaz!
Bu sayede bir koç yeni bir ödev atadığında, öğrencinin ekranında anında belirecek. Bir öğrenci mesaj gönderdiğinde, koçun mesajlar ekranı anında güncellenecek.
Adım 5: Veri Ekleme, Güncelleme ve Silme İşlemleri
addAssignment, updateUser, sendMessage gibi mevcut fonksiyonlar, artık useState'i güncellemek yerine Firestore'a veri yazan komutlar (addDoc, updateDoc, deleteDoc) haline gelecek.
Bu işlemler atomik ve güvenli bir şekilde doğrudan Firebase sunucularında gerçekleşecek.
Adım 6: Firebase Storage ile Dosya Yüklemeleri
Öğrencilerin ödev tesliminde yüklediği dosyalar veya profil fotoğrafları gibi statik içerikler artık geçici blob URL'ler yerine Firebase Storage üzerinde güvenli bir şekilde saklanacak.
Her dosya için kalıcı ve güvenli bir URL oluşturulacak ve bu URL bilgisi ilgili dökümanın (örneğin, ilgili assignment dökümanının) içinde Firestore'da tutulacak.
Adım 7: Temizlik ve Kodun Yeniden Düzenlenmesi
Tüm veri işlemleri Firebase'e taşındıktan sonra, useMockData.ts dosyası projemizden tamamen kaldırılacak.
DataContext, Firebase ile iletişimi yöneten çok daha temiz ve sade bir yapıya kavuşacak.
Bu Planın Getireceği Avantajlar:
Gerçek Zamanlı Deneyim: Kullanıcılar arasındaki tüm etkileşimler (mesajlaşma, ödev notlandırma) anlık olarak tüm cihazlara yansır.
Kalıcı ve Paylaşılan Veri: Tüm veriler bulutta saklanır. Kullanıcılar farklı cihazlardan giriş yapsalar bile aynı verilere ulaşır.
Ölçeklenebilirlik: Uygulamanızın kullanıcı sayısı arttığında Firebase altyapısı bu yükü otomatik olarak karşılar.
Güvenlik: Firebase, kullanıcı kimlik doğrulama ve veritabanı güvenlik kuralları gibi konularda endüstri standardı çözümler sunar.
Hızlı Geliştirme: Karmaşık backend işlemleriyle uğraşmak yerine doğrudan ön yüz geliştirmesine odaklanmamızı sağlar.
*/
