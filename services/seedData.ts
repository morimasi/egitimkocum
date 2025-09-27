
import { UserRole, AssignmentStatus, BadgeID, AcademicTrack } from '../types';

export const seedData = {
  assignments: [
    {
      title: "Matematik: Türev Alma Kuralları Testi",
      description: "Türev alma kurallarını içeren 20 soruluk testi çözün ve sonuçlarınızı yükleyin.",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: AssignmentStatus.Pending,
      studentId: "STUDENT_1_ID",
      coachId: "COACH_ID",
      submissionType: 'file',
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
      grade: 95, feedback: 'Harika bir iş çıkardın Leyla! Paragraf anlama hızın ve doğruluğun gözle görülür şekilde artmış.', fileUrl: null, submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: "Fizik: Vektörler Konu Özeti",
      description: "Fizik dersi vektörler konusunun özetini çıkarıp metin olarak gönderin.",
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
    }
  ],
  conversations: [
    {
      id: "conv-1",
      participantIds: ["COACH_ID", "STUDENT_1_ID"],
      isGroup: false,
    },
    {
      id: "conv-2",
      participantIds: ["COACH_ID", "STUDENT_2_ID"],
      isGroup: false,
    },
    {
      id: 'conv-announcements',
      participantIds: ["COACH_ID", "STUDENT_1_ID", "STUDENT_2_ID"],
      isGroup: true,
      groupName: "📢 Duyurular",
      adminId: "COACH_ID",
    }
  ],
  messages: [
    {
      senderId: "COACH_ID",
      conversationId: "conv-1",
      text: "Merhaba Leyla, haftalık programını gözden geçirdim. Matematik netlerin yükselişte, tebrikler!",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      readBy: [],
    },
    {
      senderId: "STUDENT_1_ID",
      conversationId: "conv-1",
      text: "Teşekkür ederim öğretmenim! Türev testinde biraz zorlandım ama halledeceğim.",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      readBy: [],
    },
     {
      senderId: "COACH_ID",
      conversationId: "conv-announcements",
      text: "Arkadaşlar, yarınki deneme sınavı için son tekrar yapmayı unutmayın! Başarılar dilerim.",
      timestamp: new Date().toISOString(),
      type: 'announcement',
      readBy: [],
    }
  ],
  goals: [
    { studentId: "STUDENT_1_ID", text: "Haftada 200 matematik sorusu çözmek.", isCompleted: true },
    { studentId: "STUDENT_1_ID", text: "Türkçe deneme netini 35'in üzerine çıkarmak.", isCompleted: false },
    { studentId: "STUDENT_2_ID", text: "Fizik Vektörler konusunu tamamen bitirmek.", isCompleted: false },
  ],
  resources: [
    {
      name: "Türev Konu Anlatımı PDF",
      type: 'pdf',
      url: "#",
      isPublic: true,
      uploaderId: "COACH_ID",
    },
    {
      name: "Paragraf Çözme Taktikleri Videosu",
      type: 'video',
      url: "#",
      isPublic: true,
      uploaderId: "COACH_ID",
    },
    {
      name: "Organik Kimya Özel Notları",
      type: 'document',
      url: "#",
      isPublic: false,
      uploaderId: "COACH_ID",
      assignedTo: ["STUDENT_2_ID"]
    }
  ],
  templates: [
    {
      title: "Matematik: Haftalık Tekrar Testi",
      description: "Bu haftanın konularını içeren tekrar testini çöz.",
      checklist: [{ text: "Konu tekrarı yapıldı." }, { text: "20 soru çözüldü." }, { text: "Yanlışlar kontrol edildi." }]
    },
    {
      title: "Türkçe: Kitap Özeti",
      description: "Belirtilen kitabı oku ve bir sayfalık özetini çıkar.",
      checklist: [{ text: "Kitap okundu." }, { text: "Ana fikir belirlendi." }, { text: "Özet yazıldı." }]
    }
  ],
  badges: [
    { id: BadgeID.FirstAssignment, name: "İlk Adım", description: "İlk ödevini başarıyla tamamladın!" },
    { id: BadgeID.HighAchiever, name: "Yüksek Başarı", description: "Not ortalaman 90'ın üzerinde!" },
    { id: BadgeID.PerfectScore, name: "Mükemmel Skor", description: "Bir ödevden 100 tam puan aldın!" },
    { id: BadgeID.GoalGetter, name: "Hedef Avcısı", description: "Haftalık hedeflerinin hepsine ulaştın!" },
    { id: BadgeID.StreakStarter, name: "Seri Başladı", description: "3 gün üst üste ödev teslim ettin." },
    { id: BadgeID.StreakMaster, name: "Seri Ustası", description: "7 gün üst üste ödev teslim ettin." },
    { id: BadgeID.OnTimeSubmissions, name: "Dakik Oyuncu", description: "5 ödevi zamanında teslim ettin." },
  ]
};
