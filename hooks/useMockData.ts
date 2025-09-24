import { User, Assignment, Message, UserRole, AssignmentStatus, AppNotification, AssignmentTemplate, Resource, Goal } from '../types';

// Helper to create downloadable dummy files for the demo
const createDummyBlobUrl = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    // This is a bit of a hack to associate a filename with the blob URL for download
    // In a real app, this would be handled by server headers.
    // We can't store the blob itself in useState easily, so we'll just use the URL.
    // The download attribute on the anchor tag will use the fileName property.
    return url;
};


const initialUsers: User[] = [
  { id: 'superadmin-1', name: 'Admin User', email: 'admin@app.com', role: UserRole.SuperAdmin, profilePicture: 'https://i.pravatar.cc/150?u=superadmin-1' },
  { id: 'coach-1', name: 'Ayşe Yılmaz', email: 'ayse.yilmaz@koc.com', role: UserRole.Coach, profilePicture: 'https://i.pravatar.cc/150?u=coach-1' },
  { id: 'student-1', name: 'Ali Veli', email: 'ali.veli@ogrenci.com', role: UserRole.Student, profilePicture: 'https://i.pravatar.cc/150?u=student-1' },
  { id: 'student-2', name: 'Zeynep Kaya', email: 'zeynep.kaya@ogrenci.com', role: UserRole.Student, profilePicture: 'https://i.pravatar.cc/150?u=student-2' },
  { id: 'student-3', name: 'Mehmet Öztürk', email: 'mehmet.ozturk@ogrenci.com', role: UserRole.Student, profilePicture: 'https://i.pravatar.cc/150?u=student-3' },
  { id: 'student-4', name: 'Fatma Demir', email: 'fatma.demir@ogrenci.com', role: UserRole.Student, profilePicture: 'https://i.pravatar.cc/150?u=student-4' },
];

const initialAssignments: Assignment[] = [
  { id: 'asg-1', studentId: 'student-1', coachId: 'coach-1', title: 'Matematik Problemleri', description: 'Limit ve Türev konularında 20 problem çözülecek.', dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Pending, grade: null, feedback: '', fileUrl: null, submittedAt: null, coachAttachments: [], feedbackReaction: null, submissionType: 'file' },
  { id: 'asg-2', studentId: 'student-1', coachId: 'coach-1', title: 'Fizik Deney Raporu', description: 'Basit sarkaç deneyi raporu hazırlanacak.', dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Graded, grade: 85, feedback: 'Raporun gayet başarılı, özellikle sonuç bölümünü çok iyi analiz etmişsin. Bir dahaki sefere hipotez kısmını daha detaylı yazabilirsin.', fileUrl: createDummyBlobUrl('report.pdf', 'Bu bir örnek fizik raporu dosyasıdır.'), fileName: 'report.pdf', submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), coachAttachments: [{name: 'Fizik-Deney-Notlandirma-Anahtari.pdf', url: createDummyBlobUrl('Fizik-Deney-Notlandirma-Anahtari.pdf', 'Bu bir örnek notlandırma anahtarıdır.')}], feedbackReaction: '👍', submissionType: 'file' },
  { id: 'asg-3', studentId: 'student-2', coachId: 'coach-1', title: 'Kompozisyon Yazımı', description: 'Küresel ısınmanın etkileri üzerine bir kompozisyon yazılacak.', dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Submitted, grade: null, feedback: '', fileUrl: createDummyBlobUrl('composition.docx', 'Bu bir örnek kompozisyon dosyasıdır.'), fileName: 'composition.docx', submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), coachAttachments: [], audioFeedbackUrl: 'blob:https://example.com/mock-audio-123', feedbackReaction: null, submissionType: 'file' },
  { id: 'asg-4', studentId: 'student-3', coachId: 'coach-1', title: 'Tarih Araştırması', description: 'Osmanlı İmparatorluğu\'nun duraklama dönemi nedenleri araştırılacak.', dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Graded, grade: 92, feedback: 'Harika bir araştırma olmuş. Kaynakçan çok zengin ve argümanların çok tutarlı. Eline sağlık!', fileUrl: createDummyBlobUrl('tarih.pdf', 'Bu bir örnek tarih araştırmasıdır.'), fileName: 'tarih.pdf', submittedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), coachAttachments: [], feedbackReaction: null, submissionType: 'file' },
  { id: 'asg-5', studentId: 'student-4', coachId: 'coach-1', title: 'Biyoloji Projesi', description: 'Hücre bölünmesi modelleri hazırlanacak.', dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Pending, grade: null, feedback: '', fileUrl: null, submittedAt: null, coachAttachments: [], checklist: [{id: 'chk-1', text: 'Araştırma yap', isCompleted: false}, {id: 'chk-2', text: 'Modeli tasarla', isCompleted: false}, {id: 'chk-3', text: 'Sunumu hazırla', isCompleted: false}], feedbackReaction: null, submissionType: 'file' },
  { id: 'asg-6', studentId: 'student-2', coachId: 'coach-1', title: 'İngilizce Sunum', description: 'İngilizce bir kitap özeti sunumu yapılacak.', dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Graded, grade: 78, feedback: 'Sunumun akıcıydı, tebrikler. Gramer konusunda biraz daha pratik yapman faydalı olacaktır.', fileUrl: createDummyBlobUrl('presentation.pptx', 'Bu bir örnek sunum dosyasıdır.'), fileName: 'presentation.pptx', submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), coachAttachments: [{name: 'Sunum-Degerlendirme-Formu.pdf', url: createDummyBlobUrl('Sunum-Degerlendirme-Formu.pdf', 'Bu bir örnek değerlendirme formudur.')}], feedbackReaction: '🤔', submissionType: 'file' },
  { id: 'asg-7', studentId: 'student-1', coachId: 'coach-1', title: 'Yaklaşan Ödev', description: 'Bu ödevin teslim tarihi çok yakın.', dueDate: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Pending, grade: null, feedback: '', fileUrl: null, submittedAt: null, coachAttachments: [], feedbackReaction: null, submissionType: 'file' },
  { id: 'asg-8', studentId: 'student-1', coachId: 'coach-1', title: 'Metin Cevaplı Ödev', description: 'Verilen makaleyi oku ve ana fikrini 2 paragrafta özetle.', dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Submitted, grade: null, feedback: '', fileUrl: null, submittedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), submissionType: 'text', textSubmission: 'Makale, yapay zekanın eğitimdeki rolünün giderek arttığını ve kişiselleştirilmiş öğrenme deneyimleri sunduğunu vurguluyor. Özellikle, AI tabanlı platformların öğrencilerin zayıf yönlerini tespit ederek onlara özel materyaller sunması büyük bir avantaj olarak gösteriliyor. Bununla birlikte, teknolojinin getirdiği etik sorunlara ve öğretmen-öğrenci etkileşiminin önemine de dikkat çekiliyor.'},
  { id: 'asg-9', studentId: 'student-2', coachId: 'coach-1', title: 'Konu Tekrarı', description: 'Kimya dersindeki "Maddenin Halleri" konusunu tekrar et.', dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Pending, grade: null, feedback: '', fileUrl: null, submittedAt: null, submissionType: 'completed' },
];

const initialMessages: Message[] = [
    { id: 'msg-1', senderId: 'student-1', receiverId: 'coach-1', text: 'Hocam merhaba, matematik ödevindeki 5. soruda takıldım. Yardımcı olabilir misiniz?', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), type: 'text', readBy: ['coach-1', 'student-1'] },
    { id: 'msg-2', senderId: 'coach-1', receiverId: 'student-1', text: 'Merhaba Ali, tabii ki. Hangi adımı anlamadığını söylersen oradan devam edelim.', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), type: 'text', readBy: ['student-1', 'coach-1'], reactions: {'👍': ['student-1']} },
    { id: 'msg-3', senderId: 'student-2', receiverId: 'coach-1', text: 'Kompozisyon ödevimi teslim ettim öğretmenim.', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), type: 'text', readBy: ['coach-1', 'student-2'] },
    { id: 'msg-4', senderId: 'student-1', receiverId: 'coach-1', text: 'Bu da sesli mesaj örneği.', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), type: 'audio', audioUrl: 'blob:https://example.com/mock-audio-456', readBy: ['student-1'] },
    { id: 'announcement-1', senderId: 'coach-1', receiverId: 'all', text: 'Arkadaşlar merhaba, yarınki etüt saati 15:00\'e alınmıştır. Herkesin katılımını bekliyorum.', timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), type: 'announcement', readBy: ['coach-1', 'student-1'] },
    { id: 'msg-5', senderId: 'coach-1', receiverId: 'student-1', text: 'Ayrıca, geçen haftaki deneme sonuçların gayet iyiydi, tebrikler!', timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(), type: 'text', readBy: ['student-1', 'coach-1'] },
    { id: 'msg-6', senderId: 'student-1', receiverId: 'coach-1', text: 'Teşekkür ederim hocam!', timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString(), type: 'text', readBy: ['student-1'], replyTo: 'msg-5'},

];

const initialNotifications: AppNotification[] = [
    { id: 'notif-1', userId: 'coach-1', message: "Zeynep Kaya 'Kompozisyon Yazımı' ödevini teslim etti.", timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(), isRead: false, link: { page: 'assignments', filter: { studentId: 'student-2' } } },
    { id: 'notif-2', userId: 'coach-1', message: "Ali Veli'den yeni bir sesli mesajınız var.", timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), isRead: false, link: { page: 'messages', filter: { contactId: 'student-1' } } },
    { id: 'notif-3', userId: 'coach-1', message: "Mehmet Öztürk'ten yeni bir mesajınız var.", timestamp: new Date().toISOString(), isRead: true, link: { page: 'messages', filter: { contactId: 'student-3' } } },
];

const initialTemplates: AssignmentTemplate[] = [
  // Görev Bazlı Şablonlar
  { id: 'temp-task-1', title: 'Soru Çözümü', description: 'Belirtilen konularda veya kaynaklardan belirli sayıda soru çözülecektir. Çözüm adımlarınızı göstermeniz ve anlamadığınız noktaları belirtmeniz beklenmektedir.', checklist: [{text: 'Belirtilen sayıda soruyu çöz'}, {text: 'Yanlışlarını ve boşlarını kontrol et'}, {text: 'Anlamadığın soruları not al'}] },
  { id: 'temp-task-2', title: 'Konu Tekrarı', description: 'Belirtilen dersin konusu tekrar edilecek ve konuyla ilgili özet çıkarılacaktır. Önemli gördüğünüz formül veya kavramları not alınız.', checklist: [{text: 'Konu anlatımını oku/izle'}, {text: 'Kendi cümlelerinle özet çıkar'}, {text: 'Önemli kavramları listele'}] },
  { id: 'temp-task-3', title: 'Deneme Çözümü', description: 'Belirtilen deneme sınavı, süre tutularak çözülecektir. Sınav sonrası doğru ve yanlış sayılarınızı not ediniz.', checklist: [{text: 'Süre tutarak denemeyi çöz'}, {text: 'Cevaplarını kontrol et'}, {text: 'Net sayını hesapla'}] },
  { id: 'temp-task-4', title: 'Yanlış Analizi', description: 'Çözdüğünüz deneme veya testteki yanlış ve boş bıraktığınız soruların nedenlerini analiz ediniz. Doğru çözümlerini öğrenerek not alınız.', checklist: [{text: 'Yanlış/boş soruları belirle'}, {text: 'Her bir sorunun doğru çözümünü öğren'}, {text: 'Neden yanlış yaptığını (bilgi eksiği, dikkat hatası vb.) not al'}] },
  { id: 'temp-task-5', title: 'Kitap Okuma ve Özet', description: 'Belirtilen kitabı okuyup, ana fikrini ve karakter analizlerini içeren bir özet hazırlayınız.', checklist: [{text: 'Kitabın belirtilen bölümünü oku'}, {text: 'Önemli olayları not al'}, {text: 'Ana fikri ve karakterleri analiz et'}, {text: 'Özeti yaz'}] },

  // Ders Bazlı Şablonlar
  { id: 'temp-ders-1', title: 'Matematik', description: 'Matematik dersi için verilecek olan ödevin açıklaması.', checklist: [{text: 'Konuyu tekrar et'}, {text: 'Verilen alıştırmaları çöz'}, {text: 'Sonuçları kontrol et'}] },
  // FIX: Removed malformed line from array
  { id: 'temp-ders-2', title: 'Türkçe', description: 'Türkçe dersi için verilecek olan ödevin açıklaması.', checklist: [{text: 'Metni oku ve anla'}, {text: 'Soruları cevapla'}, {text: 'Yazım ve dilbilgisi kurallarına dikkat et'}] },
  { id: 'temp-ders-3', title: 'Fizik', description: 'Fizik dersi için verilecek olan ödevin açıklaması.', checklist: [{text: 'Konuyu ve formülleri gözden geçir'}, {text: 'Problemleri çöz'}, {text: 'Birim dönüşümlerine dikkat et'}] },
  { id: 'temp-ders-4', title: 'Kimya', description: 'Kimya dersi için verilecek olan ödevin açıklaması.', checklist: [{text: 'Konuyu ve reaksiyonları incele'}, {text: 'Soruları yanıtla'}, {text: 'Denklemleri doğru yazdığından emin ol'}] },
  { id: 'temp-ders-5', title: 'Biyoloji', description: 'Biyoloji dersi için verilecek olan ödevin açıklaması.', checklist: [{text: 'Konuyu ve terimleri öğren'}, {text: 'Soruları cevapla'}, {text: 'Şemaları ve görselleri incele'}] },
  { id: 'temp-ders-6', title: 'Tarih', description: 'Tarih dersi için verilecek olan ödevin açıklaması.', checklist: [{text: 'Dönemi ve olayları araştır'}, {text: 'Kronolojik sıraya dikkat et'}, {text: 'Neden-sonuç ilişkisi kur'}] },
  { id: 'temp-ders-7', title: 'Coğrafya', description: 'Coğrafya dersi için verilecek olan ödevin açıklaması.', checklist: [{text: 'Konuyu ve haritaları incele'}, {text: 'Soruları yanıtla'}, {text: 'Beşeri ve fiziki özellikleri analiz et'}] },
  { id: 'temp-ders-8', title: 'Felsefe', description: 'Felsefe dersi için verilecek olan ödevin açıklaması.', checklist: [{text: 'Felsefi metni oku'}, {text: 'Temel argümanları belirle'}, {text: 'Kendi yorumunu kat'}] },
];


const initialResources: Resource[] = [
  { id: 'res-1', name: 'Türev Konu Anlatımı.pdf', type: 'pdf', url: createDummyBlobUrl('Türev-Konu-Anlatımı.pdf', 'Bu bir örnek Türev PDF dosyasıdır.'), recommendedTo: ['student-1'] },
  { id: 'res-2', name: 'Khan Academy - İntegral Videoları', type: 'link', url: 'https://www.khanacademy.org/', recommendedTo: [] },
  { id: 'res-3', name: 'Kimyasal Tepkimeler.pdf', type: 'pdf', url: createDummyBlobUrl('Kimyasal-Tepkimeler.pdf', 'Bu bir örnek Kimya PDF dosyasıdır.'), recommendedTo: ['student-2', 'student-3'] },
];

const initialGoals: Goal[] = [
    {id: 'goal-1', studentId: 'student-1', text: 'Haftada 200 paragraf sorusu çöz.', isCompleted: false},
    {id: 'goal-2', studentId: 'student-1', text: 'Matematik not ortalamasını 85\'e yükselt.', isCompleted: false},
    {id: 'goal-3', studentId: 'student-2', text: 'Her gün 30 dakika kitap oku.', isCompleted: true},
];


export const useMockData = () => {
  const getInitialData = () => {
    return {
      users: initialUsers,
      assignments: initialAssignments,
      messages: initialMessages,
      notifications: initialNotifications,
      templates: initialTemplates,
      resources: initialResources,
      goals: initialGoals,
    }
  }

  return { getInitialData };
};