import { UserRole, AssignmentStatus, BadgeID, AcademicTrack, ResourceCategory, QuestionDifficulty } from '../types';

export const seedData = {
  assignments: [
    // --- LEYLA'NIN ÖDEVLERİ ---
    {
      title: "Matematik: Türev Alma Kuralları Testi",
      description: "Türev alma kurallarını içeren 20 soruluk testi çözün ve sonuçlarınızı yükleyin. Özellikle çarpım ve bölüm türevine odaklanın.",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: AssignmentStatus.Pending,
      studentId: "STUDENT_1_ID",
      coachId: "COACH_ID",
      submissionType: 'file',
      checklist: [ { text: "Konu tekrarı yapıldı." }, { text: "20 soru çözüldü." }, { text: "Yanlışlar kontrol edildi." } ],
      grade: null, feedback: '', fileUrl: null, submittedAt: null,
    },
    {
      title: "Türkçe: Paragraf Soru Çözümü",
      description: "Verilen kaynaktan 50 paragraf sorusu çözülecek.",
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: AssignmentStatus.Graded,
      studentId: "STUDENT_1_ID",
      coachId: "COACH_ID",
      submissionType: 'completed',
      grade: 95, feedback: 'Harika bir iş çıkardın Leyla! Paragraf anlama hızın ve doğruluğun gözle görülür şekilde artmış. Bu tempoyu koru!', fileUrl: null, submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
     {
      title: "Biyoloji: Hücre Bölünmeleri Karşılaştırma",
      description: "Mitoz ve Mayoz bölünmenin evrelerini Venn şeması kullanarak karşılaştırın. Farklılıkları ve ortak yönleri belirtin.",
      dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      status: AssignmentStatus.Pending,
      studentId: "STUDENT_1_ID",
      coachId: "COACH_ID",
      submissionType: 'file',
      grade: null, feedback: '', fileUrl: null, submittedAt: null,
    },
    // --- MEHMET'İN ÖDEVLERİ ---
    {
      title: "Fizik: Vektörler Konu Özeti",
      description: "Fizik dersi vektörler konusunun özetini çıkarıp metin olarak gönderin. Bileşke vektör bulma yöntemlerine özellikle değinin.",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: AssignmentStatus.Pending,
      studentId: "STUDENT_2_ID",
      coachId: "COACH_ID",
      submissionType: 'text',
      grade: null, feedback: '', fileUrl: null, submittedAt: null,
    },
    {
      title: "Kimya: Mol Kavramı Soru Bankası",
      description: "Soru bankasındaki mol kavramı ile ilgili ilk 3 testi bitir.",
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: AssignmentStatus.Submitted,
      studentId: "STUDENT_2_ID",
      coachId: "COACH_ID",
      submissionType: 'completed',
      grade: null, feedback: '', fileUrl: null, submittedAt: new Date().toISOString(),
    },
    {
      title: "Tarih: Kurtuluş Savaşı Cepheler Sunumu",
      description: "Kurtuluş Savaşı cephelerini özetleyen kısa bir sunum hazırla. Her cephe için önemli bir olayı vurgula.",
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: AssignmentStatus.Graded,
      studentId: "STUDENT_2_ID",
      coachId: "COACH_ID",
      submissionType: 'file',
      grade: 88, feedback: 'Mehmet, sunumun içeriği gayet iyiydi. Görsel kullanımı ve sadelik konuyu daha anlaşılır kılmış. Zaman yönetimi konusunda biraz daha pratik yapabilirsin. Eline sağlık.', fileUrl: null, submittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    // --- ALİ'NİN ÖDEVLERİ ---
     {
      title: "Geometri: Üçgenlerde Alan Formülleri",
      description: "Tüm üçgenlerde alan formüllerini bir kağıda yaz ve örnek birer soru çözümü ekle.",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: AssignmentStatus.Pending,
      studentId: "STUDENT_3_ID",
      coachId: "COACH_ID",
      submissionType: 'file',
      grade: null, feedback: '', fileUrl: null, submittedAt: null,
    },
     {
      title: "Edebiyat: Divan Edebiyatı Sanatçıları",
      description: "17. Yüzyıl Divan Edebiyatı'nın 3 önemli şairini ve eserlerini araştırarak kısa bir metin hazırla.",
      dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: AssignmentStatus.Graded,
      studentId: "STUDENT_3_ID",
      coachId: "COACH_ID",
      submissionType: 'text',
      grade: 92, feedback: "Ali, araştrman çok detaylı ve bilgilendirici olmuş. Özellikle Nabi'nin üslubunu iyi yakalamışsın. Böyle devam et!", fileUrl: null, submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    // --- ELİF'İN ÖDEVLERİ ---
    {
      title: "Coğrafya: Türkiye'nin Gölleri",
      description: "Türkiye'nin tektonik, karstik ve volkanik göllerine 3'er örnek vererek harita üzerinde göster.",
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      status: AssignmentStatus.Pending,
      studentId: "STUDENT_4_ID",
      coachId: "COACH_2_ID",
      submissionType: 'file',
      grade: null, feedback: '', fileUrl: null, submittedAt: null,
    },
    {
      title: "İngilizce: Kelime Çalışması",
      description: "Verilen 20 kelimeyi ezberle ve her biriyle birer cümle kur.",
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: AssignmentStatus.Submitted,
      studentId: "STUDENT_4_ID",
      coachId: "COACH_2_ID",
      submissionType: 'text',
      grade: null, feedback: '', fileUrl: null, submittedAt: new Date(Date.now() - 1 * 12 * 60 * 60 * 1000).toISOString(),
    },
  ],
  conversations: [
    { id: "conv-1", participantIds: ["COACH_ID", "STUDENT_1_ID"], isGroup: false },
    { id: "conv-2", participantIds: ["COACH_ID", "STUDENT_2_ID"], isGroup: false },
    { id: "conv-3", participantIds: ["COACH_ID", "STUDENT_3_ID"], isGroup: false },
    { id: "conv-4", participantIds: ["COACH_2_ID", "STUDENT_4_ID"], isGroup: false },
    {
      id: 'conv-announcements',
      participantIds: ["COACH_ID", "STUDENT_1_ID", "STUDENT_2_ID", "STUDENT_3_ID"],
      isGroup: true,
      groupName: "📢 Ahmet Hoca Duyurular",
      groupImage: "https://i.pravatar.cc/150?u=announcements",
      adminId: "COACH_ID",
    },
    {
      id: 'conv-group-1',
      participantIds: ["COACH_ID", "STUDENT_1_ID", "STUDENT_3_ID"],
      isGroup: true,
      groupName: "Sayısal Çalışma Grubu",
      groupImage: "https://i.pravatar.cc/150?u=sayisal",
      adminId: "COACH_ID",
    },
    {
      id: 'conv-teachers-lounge',
      participantIds: ["SUPER_ADMIN_ID", "COACH_ID", "COACH_2_ID"],
      isGroup: true,
      groupName: "Öğretmenler Odası",
      groupImage: "https://i.pravatar.cc/150?u=teachers",
      adminId: "SUPER_ADMIN_ID",
    }
  ],
  messages: [
    {
      senderId: "COACH_ID",
      conversationId: "conv-1",
      text: "Merhaba Leyla, haftalık programını gözden geçirdim. Matematik netlerin yükselişte, tebrikler!",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      type: 'text', readBy: [],
    },
    {
      senderId: "STUDENT_1_ID",
      conversationId: "conv-1",
      text: "Teşekkür ederim öğretmenim! Türev testinde biraz zorlandım ama halledeceğim.",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      type: 'text', readBy: [],
    },
    {
      senderId: "COACH_ID",
      conversationId: "conv-announcements",
      text: "Arkadaşlar, yarınki deneme sınavı için son tekrar yapmayı unutmayın! Başarılar dilerim.",
      timestamp: new Date().toISOString(),
      type: 'announcement', readBy: [],
    },
     {
      senderId: "COACH_2_ID",
      conversationId: "conv-4",
      text: "Elif merhaba, platforma hoş geldin! İlk ödevlerini atadım, takıldığın bir yer olursa çekinme sorabilirsin.",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      type: 'text', readBy: [],
    },
     {
      senderId: "STUDENT_4_ID",
      conversationId: "conv-4",
      text: "Hoş buldum hocam, teşekkür ederim. Kelime ödevini teslim ettim.",
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      type: 'text', readBy: [],
    },
    {
      senderId: "COACH_ID",
      conversationId: "conv-group-1",
      text: "Bu hafta sonu hangi konudan ortak bir soru çözüm saati yapalım?",
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      type: 'poll',
      poll: {
        question: "Hafta sonu soru çözüm konusu:",
        options: [ { text: "Limit ve Süreklilik", votes: ["STUDENT_1_ID"] }, { text: "Organik Kimya", votes: [] }, { text: "Modern Fizik", votes: ["STUDENT_3_ID"] } ]
      },
      readBy: [],
    },
    {
      senderId: "SUPER_ADMIN_ID",
      conversationId: "conv-teachers-lounge",
      text: "Merhaba değerli hocalarım, öğretmenler odası sohbet grubumuza hoş geldiniz. Buradan genel konuları ve işbirliğini konuşabiliriz.",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      type: 'text', readBy: [],
    },
  ],
  goals: [
    { studentId: "STUDENT_1_ID", title: "Haftada 200 matematik sorusu çöz.", description: "Matematik becerilerini geliştirmek için haftalık 200 soru hedefi.", isCompleted: true, milestones: [{id: 'm1', text: 'Pazartesi 50 soru çöz', isCompleted: true}, {id: 'm2', text: 'Çarşamba 50 soru çöz', isCompleted: true}, {id: 'm3', text: 'Cuma 50 soru çöz', isCompleted: true}] },
    { studentId: "STUDENT_1_ID", title: "Türkçe deneme netini 35'in üzerine çıkar.", description: "Paragraf ve dil bilgisi pratiği yaparak net artışı sağla.", isCompleted: false, milestones: [{id: 'm4', text: 'Haftada 2 Türkçe denemesi çöz', isCompleted: false}, {id: 'm5', text: 'Yanlış yapılan dil bilgisi konularını tekrar et', isCompleted: false}] },
    { studentId: "STUDENT_1_ID", title: "Biyoloji kalıtım konusunu bitir.", description: "Kalıtım konusunu tüm alt başlıklarıyla tamamla.", isCompleted: false, milestones: [{id: 'm6', text: 'Konu anlatımını tamamla', isCompleted: false}, {id: 'm7', text: 'En az 100 soru çöz', isCompleted: false}] },
    { studentId: "STUDENT_2_ID", title: "Fizik Vektörler konusunu tamamen bitir.", description: "Vektörler konusunu tekrar edip soru bankasından temizle.", isCompleted: false, milestones: [] },
    { studentId: "STUDENT_2_ID", title: "Her gün 20 paragraf sorusu çöz.", description: "Okuma hızını ve anlama becerini geliştirmek için günlük pratik yap.", isCompleted: true, milestones: [] },
    { studentId: "STUDENT_3_ID", title: "Geometri katı cisimler konusuna başla.", description: "Katı cisimler ünitesine başlayarak temel formülleri öğren.", isCompleted: false, milestones: [] },
    { studentId: "STUDENT_4_ID", title: "Günde 10 yeni İngilizce kelime öğren.", description: "Kelime dağarcığını genişletmek için günlük çalışma yap.", isCompleted: false, milestones: [] },
  ],
  resources: [
    // Matematik
    { name: "Türev Konu Anlatımı (Khan Academy)", type: 'link', url: "https://tr.khanacademy.org/math/differential-calculus", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Matematik },
    { name: "İntegral Video Serisi (Khan Academy)", type: 'link', url: "https://tr.khanacademy.org/math/integral-calculus", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Matematik },
    { name: "Limit ve Süreklilik Ders Notları (ODTÜ)", type: 'link', url: "https://ocw.metu.edu.tr/course/view.php?id=25", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Matematik },
    { name: "Problemler Soru Çözümü (Rehber Matematik)", type: 'video', url: "https://www.youtube.com/playlist?list=PLVo92i6E5h-m_G-5k63Y-3n73n4a-cvX8", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Matematik },
    { name: "Trigonometri Formülleri (PDF)", type: 'link', url: "https://www.matematikkolay.net/wp-content/uploads/2019/01/trigonometri_formulleri.pdf", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Matematik },
    { name: "Polinomlar Video Serisi (Bıyıklı Matematik)", type: 'video', url: "https://www.youtube.com/playlist?list=PL_XPE7Sj-wYF3L3g1_uFIEjLJQ2f-bO3z", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Matematik },
    { name: "Geometri Temel Kavramlar (Kenan Kara)", type: 'video', url: "https://www.youtube.com/playlist?list=PL_prevY-34qEFp_2M_P_w5-qgOCgS-yI-", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Matematik },
    
    // Fizik
    { name: "Elektrik ve Manyetizma Serisi (Umut Öncül)", type: 'video', url: "https://www.youtube.com/playlist?list=PL2-f2gXQo-2D8mCj_o-0-z6_TzU-m3oUa", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Fizik },
    { name: "Optik Detaylı Anlatım (Fizikle Barış)", type: 'video', url: "https://www.youtube.com/playlist?list=PL-kC-zVde_h9a5Wj-YxlO_X_J8Z1d-D3T", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Fizik },
    { name: "Dinamik ve Newton'un Yasaları (Fizikle Barış)", type: 'video', url: "https://www.youtube.com/watch?v=Zt_3m7y-3fI", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Fizik },
    { name: "Modern Fizik Konu Anlatımı (Khan Academy)", type: 'link', url: "https://tr.khanacademy.org/science/physics/quantum-physics", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Fizik },
    { name: "Fizik Formülleri Özeti (PDF)", type: 'link', url: "http://www.formulsayfasi.com/uploads/1/2/4/3/12439160/fizik_formlleri.pdf", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Fizik },

    // Kimya
    { name: "Periyodik Cetvel (TÜBİTAK)", type: 'link', url: "https://bilimgenc.tubitak.gov.tr/periyodik-tablo", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Kimya },
    { name: "Kimyasal Hesaplamalar (Kimya Adası)", type: 'video', url: "https://www.youtube.com/playlist?list=PL10GgL6g3lM2gP6dZQ5mC5_tH9qB9zN-t", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Kimya },
    { name: "Asitler, Bazlar ve Tuzlar (Benim Hocam)", type: 'video', url: "https://www.youtube.com/watch?v=U2StC8-kh-s", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Kimya },
    { name: "Elektrokimya Konu Anlatımı (Khan Academy)", type: 'link', url: "https://tr.khanacademy.org/science/chemistry/oxidation-reduction", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Kimya },
    { name: "Organik Kimya Notları (Ankara Üni.)", type: 'link', url: "https://acikders.ankara.edu.tr/course/view.php?id=3888", isPublic: false, uploaderId: "COACH_ID", assignedTo: ["STUDENT_2_ID", "STUDENT_3_ID"], category: ResourceCategory.Kimya },

    // Biyoloji
    { name: "Kalıtım Konu Anlatımı (Selin Hoca)", type: 'video', url: "https://www.youtube.com/watch?v=O-JJv-1KO-s", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Biyoloji },
    { name: "Hücre ve Organelleri (Dr. Biyoloji)", type: 'video', url: "https://www.youtube.com/watch?v=L2vK8J-a-9Y", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Biyoloji },
    { name: "Ekosistem Ekolojisi Video Serisi (Selin Hoca)", type: 'video', url: "https://www.youtube.com/playlist?list=PL35s0f5_fhXf0fXyA8dK_S7eE2gY263Gz", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Biyoloji },
    { name: "Genden Proteine (Khan Academy)", type: 'link', url: "https://tr.khanacademy.org/science/biology/gene-expression-central-dogma", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Biyoloji },

    // Türkçe & Edebiyat
    { name: "Paragraf Çözme Taktikleri (Rüştü Hoca)", type: 'video', url: "https://www.youtube.com/watch?v=i9yY_i_b-yQ", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Turkce },
    { name: "Yazım Kuralları (TDK)", type: 'link', url: "https://www.tdk.gov.tr/kategori/yazim-kurallari/", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Turkce },
    { name: "Divan Edebiyatı (Benim Hocam)", type: 'video', url: "https://www.youtube.com/playlist?list=PL2f-3TV2y22_yv-CI-Zt_b0z9L3x4cW-z", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Turkce },
    { name: "Cümlenin Öğeleri (Türkçenin Matematiği)", type: 'video', url: "https://www.youtube.com/watch?v=7M-X-P_H-vI", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Turkce },
    { name: "Edebi Sanatlar Anlatımı (Rüştü Hoca)", type: 'video', url: "https://www.youtube.com/watch?v=7uD1DviwUTk", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Turkce },
    
    // Tarih
    { name: "Kurtuluş Savaşı Belgeseli (TRT Arşiv)", type: 'video', url: "https://www.youtube.com/watch?v=JgfGz-zN-sY", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Tarih },
    { name: "Osmanlı Tarihi Kronolojisi (TTK)", type: 'link', url: "https://www.ttk.gov.tr/tarih/osmanli-tarihi-kronolojisi/", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Tarih },
    { name: "İnkılap Tarihi Ders Notları (PDF)", type: 'link', url: "https://www.sadikuygun.com.tr/Assets/uploads/22022021-174151.pdf", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Tarih },
    { name: "Çağdaş Türk ve Dünya Tarihi (Benim Hocam)", type: 'video', url: "https://www.youtube.com/playlist?list=PLDB083FD2DBC0458C", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Tarih },

    // Coğrafya
    { name: "Türkiye Fiziki Haritası (Harita Genel Md.)", type: 'link', url: "https://www.harita.gov.tr/turkiye-fiziki-haritasi", isPublic: true, uploaderId: "COACH_2_ID", category: ResourceCategory.Cografya },
    { name: "Nüfus ve Yerleşme (Coğrafyanın Kodları)", type: 'video', url: "https://www.youtube.com/playlist?list=PLXyA-5N3cT9A3H-nSkIB-I6oK-a7j7YtD", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Cografya },
    { name: "Türkiye'nin Gölleri (Coğrafyanın Kodları)", type: 'video', url: "https://www.youtube.com/watch?v=h_5g3LgX8c0", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Cografya },

    // Felsefe
    { name: "Bilgi Felsefesi (Felsefece)", type: 'video', url: "https://www.youtube.com/watch?v=T_s-Xk-s-Yc", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Felsefe },
    { name: "20. Yüzyıl Felsefesi (Khan Academy)", type: 'link', url: "https://tr.khanacademy.org/humanities/philosophy-in-english/philosophy-in-the-20th-century-english", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Felsefe },
    
    // İngilizce
    { name: "İngilizce Gramer Alıştırmaları (British Council)", type: 'link', url: "https://learnenglish.britishcouncil.org/grammar", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Ingilizce },
    { name: "Kelime Öğrenme Platformu (Quizlet)", type: 'link', url: "https://quizlet.com/", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Ingilizce },
    { name: "İngilizce Okuma Parçaları (BBC Learning English)", type: 'link', url: "https://www.bbc.co.uk/learningenglish/english/features/6-minute-english", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Ingilizce },

    // Genel
    { name: "Verimli Ders Çalışma Teknikleri (Gri Koç)", type: 'video', url: "https://www.youtube.com/watch?v=i_w9-sN6y-w", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Genel },
    { name: "YÖK Atlas Tercih Robotu", type: 'link', url: "https://yokatlas.yok.gov.tr/", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Genel },
    { name: "MEB Örnek Sorular", type: 'link', url: "https://odsgm.meb.gov.tr/www/ornek-soru-ve-cozumleri/kategori/19", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Genel },
    { name: "Pomodoro Zamanlayıcı (Online)", type: 'link', url: "https://pomofocus.io/", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Genel },
    { name: "Zihin Haritası Oluşturma Aracı (MindMeister)", type: 'link', url: "https://www.mindmeister.com/tr", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Genel },
    { name: "Bilim ve Teknik Dergisi Arşivi (TÜBİTAK)", type: 'link', url: "https://bilimteknik.tubitak.gov.tr/arsiv", isPublic: true, uploaderId: "COACH_ID", category: ResourceCategory.Genel }
  ],
  templates: [
    { title: "Matematik: Haftalık Tekrar Testi", description: "Bu haftanın konularını içeren tekrar testini çöz.", checklist: [{ text: "Konu tekrarı yapıldı." }, { text: "20 soru çözüldü." }, { text: "Yanlışlar kontrol edildi." }] },
    { title: "Matematik: Logaritma Fonksiyonu", description: "Logaritma fonksiyonunun tanımını, özelliklerini ve kullanım alanlarını öğren. Bol bol soru çözerek konuyu pekiştir.", checklist: [{ text: "Logaritma ve üstel fonksiyon arasındaki ilişkiyi tekrar et." }, { text: "Logaritma özelliklerini (toplama, çıkarma, taban değiştirme) not al." }, { text: "En az 50 logaritma sorusu çöz." }, { text: "Logaritmik denklemler ve eşitsizlikler konusunu çalış." }] },
    { title: "Matematik: Trigonometri Temel Kavramlar", description: "Birim çember, trigonometrik fonksiyonlar (sin, cos, tan, cot), temel özdeşlikler ve trigonometrik denklemler konularını kapsayan bir çalışma yap.", checklist: [{ text: "Birim çember üzerindeki açıların trigonometrik değerlerini ezberle." }, { text: "Toplam-fark ve yarım açı formüllerini kullanarak 20 soru çöz." }, { text: "Trigonometrik denklemlerin çözüm kümelerini bulma alıştırması yap." }] },
    { title: "Geometri: Katı Cisimler", description: "Katı cisimlerin (Prizma, Piramit, Silindir, Koni, Küre) alan ve hacim formüllerini öğren ve bu formülleri kullanarak çeşitli problemleri çöz.", checklist: [{ text: "Her bir katı cismin formülünü bir formül kağıdına çıkar." }, { text: "Her cisimle ilgili en az 10'ar tane alan ve hacim sorusu çöz." }, { text: "Cisimlerin birleşiminden oluşan sorulara odaklan." }, { text: "Çıkmış soruları analiz et." }] },
    { title: "Türkçe: Kitap Özeti", description: "Belirtilen kitabı oku ve bir sayfalık özetini çıkar.", checklist: [{ text: "Kitap okundu." }, { text: "Ana fikir belirlendi." }, { text: "Özet yazıldı." }] },
    { title: "Türkçe: Yazım Kuralları ve Noktalama", description: "TDK'nin güncel yazım kılavuzuna göre yazım kurallarını ve noktalama işaretlerinin kullanımını tekrar et. Bu kurallarla ilgili en az 100 soru çözerek pratik yap.", checklist: [{ text: "Büyük harflerin kullanımı tekrar edildi." }, { text: "Sayıların, kısaltmaların ve 'ki', 'de', 'mi' eklerinin yazımı çalışıldı." }, { text: "Nokta, virgül, noktalı virgül ve diğer işaretlerin kullanım alanları incelendi." }, { text: "En az 100 soru çözüldü ve yanlışlar analiz edildi." }] },
    { title: "Edebiyat: Şiir Tahlili", description: "Belirtilen şiiri; ölçü, uyak, redif, tema, dil ve üslup gibi açılardan inceleyerek bir tahlil metni oluştur.", checklist: [{ text: "Şiirin ölçüsü ve uyak şeması çıkarıldı." }, { text: "Şiirdeki söz sanatları (edebi sanatlar) bulundu." }, { text: "Şiirin teması ve ana duygusu belirlendi." }, { text: "Şairin üslubu ve şiirin ait olduğu dönem hakkında kısa bir yorum yapıldı." }] },
    { title: "Fizik: Optik Konu Tekrarı", description: "Optik ünitesindeki (Gölge, Aydınlanma, Düzlem Ayna, Küresel Aynalar) konularını tekrar et ve ilgili konulardan en az 40 soru çöz.", checklist: [{ text: "Konu anlatım videosu izlendi veya notlar tekrar edildi." }, { text: "En az 40 adet karışık optik sorusu çözüldü." }, { text: "Yapılamayan soruların çözümleri öğrenildi." }, { text: "Önemli formüller ve kurallar not defterine yazıldı." }] },
    { title: "Fizik: Elektrik ve Manyetizma", description: "Elektrik akımı, potansiyel fark, direnç ve Ohm Yasası konularını tekrar et. Manyetik alan ve manyetik kuvvet konularına giriş yap.", checklist: [{ text: "Ohm Yasası ile ilgili 10 adet problem çöz." }, { text: "Seri ve paralel bağlı devrelerde eşdeğer direnci hesapla." }, { text: "Sağ el kuralını ve kullanım alanlarını öğren." }, { text: "Manyetik alan kaynaklarını (düz tel, halka, bobin) çalış." }] },
    { title: "Fizik: Dinamik (Newton'un Hareket Yasaları)", description: "Newton'un üç hareket yasasını anla ve sürtünmeli/sürtünmesiz yüzeyler, eğik düzlem gibi farklı senaryolarda problem çözme pratiği yap.", checklist: [{ text: "Newton'un 3 yasasını kendi cümlelerinle açıkla." }, { text: "Serbest cisim diyagramı çizmeyi öğren." }, { text: "En az 30 adet dinamik problemi çöz." }, { text: "Eylemsizlik ve etki-tepki prensipleri arasındaki farkı anla." }] },
    { title: "Kimya: Organik Kimyaya Giriş", description: "Organik Kimya ünitesinin başlangıç konularını (Basit formül, molekül formülü, hibritleşme, molekül geometrisi) çalış ve temel alıştırmaları yap.", checklist: [{ text: "Konu anlatımı tamamlandı." }, { text: "Hibritleşme (sp, sp2, sp3) türleri tekrar edildi." }, { text: "VSEPR gösterimleri ve molekül geometrileri ezberlendi." }, { text: "En az 20 alıştırma sorusu çözüldü." }] },
    { title: "Kimya: Asitler, Bazlar ve Tuzlar", description: "Asit ve bazların genel özelliklerini, pH kavramını, nötralleşme tepkimelerini ve tuzların özelliklerini öğren.", checklist: [{ text: "Arrhenius, Brønsted-Lowry asit-baz tanımlarını tekrar et." }, { text: "pH ve pOH kavramları ile ilgili hesaplamalar yap." }, { text: "Bir titrasyon deneyinin adımlarını incele." }, { text: "En az 40 soru çözerek konuyu pekiştir." }] },
    { title: "Biyoloji: Hücre Bölünmeleri", description: "Mitoz ve Mayoz bölünmenin evrelerini karşılaştırmalı olarak çalış. Farklılıkları ve ortak yönleri belirten bir tablo hazırla.", checklist: [{ text: "Mitoz bölünme evreleri ve özellikleri çalışıldı." }, { text: "Mayoz bölünme evreleri ve özellikleri çalışıldı." }, { text: "Karşılaştırma tablosu oluşturuldu." }, { text: "İki bölünme türüyle ilgili 20 soru çözüldü." }] },
    { title: "Biyoloji: Kalıtımın Genel İlkeleri", description: "Mendel'in yasalarını, monohibrit, dihibrit çaprazlamaları ve soyağacı analizlerini çalış.", checklist: [{ text: "Mendel'in ilkelerini (benzerlik, ayrılma, bağımsız dağılım) tekrar et." }, { text: "Çaprazlama ile ilgili 20 problem çöz." }, { text: "Kan grupları kalıtımı konusunu çalış." }, { text: "5 farklı soyağacı problemini analiz et." }] },
    { title: "Tarih: Kurtuluş Savaşı Cepheler", description: "Kurtuluş Savaşı'ndaki Doğu, Güney ve Batı cephelerini, önemli komutanları, yapılan savaşları ve sonuçlarını detaylı bir şekilde çalış.", checklist: [{ text: "Doğu ve Güney cepheleri çalışıldı." }, { text: "Batı cephesi savaşları (I. İnönü, II. İnönü, vb.) sırasıyla öğrenildi." }, { text: "Savaşların sonuçları ve imzalanan antlaşmalar not alındı." }, { text: "Konuyla ilgili zaman çizelgesi oluşturuldu." }] },
    { title: "Tarih: Osmanlı Yükselme Dönemi", description: "Fatih Sultan Mehmet'ten Sokullu Mehmet Paşa'nın ölümüne kadar olan dönemin siyasi olaylarını, önemli padişahlarını ve yapılan ıslahatları çalış.", checklist: [{ text: "Dönemin padişahlarını ve önemli olaylarını kronolojik olarak listele." }, { text: "İstanbul'un Fethi'nin neden ve sonuçlarını analiz et." }, { text: "Kanuni Sultan Süleyman dönemindeki seferleri ve antlaşmaları harita üzerinden incele." }, { text: "Coğrafi Keşiflerin Osmanlı'ya etkilerini araştır." }] },
    { title: "Coğrafya: Türkiye'nin İklimi", description: "Türkiye'de görülen iklim tiplerini, etkileyen faktörleri ve bu iklimlerin bitki örtüsü üzerindeki etkilerini harita üzerinden inceleyerek çalış.", checklist: [{ text: "Türkiye'nin iklimini etkileyen faktörler tekrar edildi." }, { text: "İklim tipleri (Akdeniz, Karadeniz, Karasal) ve dağılışları incelendi." }, { text: "İklim ve bitki örtüsü ilişkisi kuruldu." }, { text: "Dilsiz harita üzerine iklim tipleri ve bitki örtüleri işlendi." }] },
    { title: "Coğrafya: Nüfus ve Yerleşme", description: "Türkiye'de nüfusun dağılışını etkileyen faktörleri, nüfus piramitlerini ve yerleşme tiplerini öğren.", checklist: [{ text: "Nüfus sayımları ve demografik verileri incele." }, { text: "Türkiye nüfus piramidini yorumla." }, { text: "Kırsal ve kentsel yerleşme arasındaki farkları analiz et." }, { text: "Göçlerin neden ve sonuçlarını çalış." }] },
    { title: "Felsefe: Bilgi Felsefesi (Epistemoloji)", description: "Bilginin kaynağı, imkanı, sınırları ve doğruluğu hakkındaki temel felsefi akımları (Rasyonalizm, Empirizm, Kritisizm, Pozitivizm vb.) araştırarak özet çıkar.", checklist: [{ text: "Doğru bilgi mümkün müdür? sorusuna verilen cevaplar incelendi." }, { text: "Bilginin kaynakları (akıl, deney, sezgi, vahiy) hakkında notlar alındı." }, { text: "Her bir felsefi akımın ana temsilcileri ve görüşleri listelendi." }, { text: "Konuyla ilgili en az 20 felsefe sorusu çözüldü." }] },
    { title: "İngilizce: Essay Yazma Pratiği (Argumentative)", description: "Verilen konu hakkında argümanlar geliştirerek, giriş, gelişme ve sonuç bölümlerinden oluşan bir 'argumentative essay' yaz.", checklist: [{ text: "Tez cümlesi (thesis statement) oluşturuldu." }, { text: "Her paragraf için ana fikir ve destekleyici fikirler belirlendi." }, { text: "Geçiş kelimeleri (transition words) kullanılarak paragraflar arası bağlantı sağlandı." }, { text: "Yazım ve dil bilgisi kontrolü (proofreading) yapıldı." }] },
    { title: "Genel: TYT Deneme Sınavı Analizi", description: "Son çözdüğün TYT deneme sınavının detaylı analizini yap. Yanlış ve boş bıraktığın soruların konularını belirle ve bu konular için bir tekrar planı oluştur.", checklist: [{ text: "Deneme sınavındaki tüm yanlışlar incelendi." }, { text: "Boş bırakılan soruların nedenleri analiz edildi." }, { text: "Yanlış ve boşların konu dağılımı çıkarıldı." }, { text: "Eksik konular için haftalık bir tekrar programı hazırlandı." }] },
    { title: "Genel: AYT Deneme Sınavı Analizi", description: "Son çözdüğün AYT deneme sınavının detaylı analizini yap. Özellikle kendi alanındaki (Sayısal, Eşit Ağırlık, Sözel, Dil) derslerdeki yanlış ve boşlarını belirle.", checklist: [{ text: "Her ders için doğru, yanlış ve boş sayıları not edildi." }, { text: "Yanlış yapılan soruların konuları tespit edildi." }, { text: "Boş bırakılan soruların nedenleri (bilgi eksikliği, süre yetmemesi vb.) analiz edildi." }, { text: "Eksik konular için bir haftalık yoğunlaştırılmış bir tekrar programı hazırlandı." }] },
  ],
  badges: [
    { id: BadgeID.FirstAssignment, name: "İlk Adım", description: "İlk ödevini başarıyla tamamladın!" },
    { id: BadgeID.HighAchiever, name: "Yüksek Başarı", description: "Not ortalaman 90'ın üzerinde!" },
    { id: BadgeID.PerfectScore, name: "Mükemmel Skor", description: "Bir ödevden 100 tam puan aldın!" },
    { id: BadgeID.GoalGetter, name: "Hedef Avcısı", description: "Haftalık hedeflerinin hepsine ulaştın!" },
    { id: BadgeID.StreakStarter, name: "Seri Başladı", description: "3 gün üst üste ödev teslim ettin." },
    { id: BadgeID.StreakMaster, name: "Seri Ustası", description: "7 gün üst üste ödev teslim ettin." },
    { id: BadgeID.OnTimeSubmissions, name: "Dakik Oyuncu", description: "5 ödevi zamanında teslim ettin." },
  ],
  exams: [
    {
        studentId: "STUDENT_1_ID",
        title: "TYT Deneme Sınavı - 1",
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        category: "Genel Deneme Sınavları",
        topic: "TYT",
        type: "deneme",
        totalQuestions: 120, correct: 95, incorrect: 15, empty: 10,
        netScore: 91.25,
        subjects: [
            { name: "Türkçe", totalQuestions: 40, correct: 32, incorrect: 5, empty: 3, netScore: 30.75 },
            { name: "Sosyal", totalQuestions: 20, correct: 15, incorrect: 3, empty: 2, netScore: 14.25 },
            { name: "Matematik", totalQuestions: 40, correct: 33, incorrect: 4, empty: 3, netScore: 32.00 },
            { name: "Fen", totalQuestions: 20, correct: 15, incorrect: 3, empty: 2, netScore: 14.25 }
        ]
    },
    {
        studentId: "STUDENT_1_ID",
        title: "AYT Deneme Sınavı - 1 (Sayısal)",
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        category: "Genel Deneme Sınavları",
        topic: "AYT",
        type: "deneme",
        totalQuestions: 80, correct: 62, incorrect: 12, empty: 6,
        netScore: 59,
        subjects: [
            { name: "Matematik", totalQuestions: 40, correct: 30, incorrect: 6, empty: 4, netScore: 28.5 },
            { name: "Fizik", totalQuestions: 14, correct: 9, incorrect: 3, empty: 2, netScore: 8.25 },
            { name: "Kimya", totalQuestions: 13, correct: 11, incorrect: 1, empty: 1, netScore: 10.75 },
            { name: "Biyoloji", totalQuestions: 13, correct: 12, incorrect: 2, empty: -1, netScore: 11.5 }
        ]
    },
     {
        studentId: "STUDENT_2_ID",
        title: "TYT Deneme Sınavı - 1",
        date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        category: "Genel Deneme Sınavları",
        topic: "TYT",
        type: "deneme",
        totalQuestions: 120, correct: 80, incorrect: 25, empty: 15,
        netScore: 73.75,
        subjects: [
            { name: "Türkçe", totalQuestions: 40, correct: 28, incorrect: 8, empty: 4, netScore: 26.00 },
            { name: "Sosyal", totalQuestions: 20, correct: 12, incorrect: 5, empty: 3, netScore: 10.75 },
            { name: "Matematik", totalQuestions: 40, correct: 29, incorrect: 8, empty: 3, netScore: 27.00 },
            { name: "Fen", totalQuestions: 20, correct: 11, incorrect: 4, empty: 5, netScore: 10.00 }
        ]
    },
    {
        studentId: "STUDENT_3_ID",
        title: "Matematik - Türev Konu Tarama",
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        category: "Matematik",
        topic: "Türev",
        type: "konu-tarama",
        totalQuestions: 25, correct: 20, incorrect: 3, empty: 2,
        netScore: 19.25,
        subjects: [
            { name: "Türev", totalQuestions: 25, correct: 20, incorrect: 3, empty: 2, netScore: 19.25 }
        ]
    }
  ],
  questions: [
    {
      creatorId: "COACH_ID",
      category: ResourceCategory.Matematik,
      topic: "Türev",
      questionText: "f(x) = 3x² + 5x - 2 fonksiyonunun x=1 noktasındaki türevi nedir?",
      options: ["8", "11", "9", "13"],
      correctOptionIndex: 1,
      difficulty: QuestionDifficulty.Easy,
      explanation: "f'(x) = 6x + 5. f'(1) = 6(1) + 5 = 11."
    },
    {
      creatorId: "COACH_ID",
      category: ResourceCategory.Fizik,
      topic: "Vektörler",
      questionText: "Aşağıdakilerden hangisi vektörel bir büyüklük değildir?",
      options: ["Hız", "Kuvvet", "Sürat", "İvme"],
      correctOptionIndex: 2,
      difficulty: QuestionDifficulty.Easy,
      explanation: "Sürat, skaler bir büyüklüktür. Yönü yoktur, sadece büyüklüğü vardır. Diğer seçenekler (hız, kuvvet, ivme) ise yönlü yani vektörel büyüklüklerdir."
    },
    {
      creatorId: "COACH_ID",
      category: ResourceCategory.Matematik,
      topic: "Logaritma",
      questionText: "log₂(16) + log₃(27) işleminin sonucu kaçtır?",
      options: ["5", "6", "7", "8"],
      correctOptionIndex: 2,
      difficulty: QuestionDifficulty.Medium,
      explanation: "log₂(16) = 4 çünkü 2⁴ = 16. log₃(27) = 3 çünkü 3³ = 27. Toplamları 4 + 3 = 7'dir."
    },
    {
      creatorId: "COACH_2_ID",
      category: ResourceCategory.Turkce,
      topic: "Yazım Kuralları",
      questionText: "Aşağıdaki cümlelerin hangisinde bir yazım yanlışı yapılmıştır?",
      options: [
        "Herşey yolunda gibiydi.",
        "TBMM'nin açılışı coşkuyla kutlandı.",
        "Sen de mi bizimle geleceksin?",
        "Ankara Kalesi'ni ziyaret ettik."
      ],
      correctOptionIndex: 0,
      difficulty: QuestionDifficulty.Medium,
      explanation: "'Her şey' kelimesi her zaman ayrı yazılır. Bu nedenle 'Herşey' kullanımı yanlıştır."
    },
     {
      creatorId: "COACH_2_ID",
      category: ResourceCategory.Biyoloji,
      topic: "Hücre",
      questionText: "Aşağıdaki organellerden hangisi hem bitki hem de hayvan hücrelerinde ortak olarak bulunur?",
      options: ["Kloroplast", "Sentrozom", "Hücre Duvarı", "Ribozom"],
      correctOptionIndex: 3,
      difficulty: QuestionDifficulty.Easy,
      explanation: "Ribozom, protein sentezinden sorumlu zarsız bir organeldir ve tüm canlı hücrelerde (prokaryot ve ökaryot, bitki ve hayvan) bulunur."
    }
  ]
};