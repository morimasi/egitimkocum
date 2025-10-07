
import { UserRole, AssignmentStatus, AcademicTrack, ResourceCategory, QuestionDifficulty, Question } from '../types';
import { examCategories } from './examCategories.js';

const uuid = () => crypto.randomUUID();

// --- USERS ---
const superAdminId = 'super-admin-id';
const mahmutHocaId = 'mahmut-hoca-id';
const ayseHocaId = 'ayse-hoca-id';

const student1Id = 'student-ahmet-id';
const student2Id = 'student-zeynep-id';
const student3Id = 'student-can-id';
const student4Id = 'student-elif-id';
const student5Id = 'student-mert-id';
const student6Id = 'student-ipek-id';
const studentIds = [student1Id, student2Id, student3Id, student4Id, student5Id, student6Id];
const coachIds = [mahmutHocaId, ayseHocaId];


const parent1Id = 'parent-yılmaz-id';
const parent2Id = 'parent-fatma-id';

const users = [
    // Admins & Coaches
    { id: superAdminId, name: 'Süper Admin', email: 'admin@mahmuthoca.com', password: 'password', role: UserRole.SuperAdmin, profilePicture: `https://i.pravatar.cc/150?u=admin`, childIds: [], parentIds: [], earnedBadgeIds: [] },
    { id: mahmutHocaId, name: 'Mahmut Hoca', email: 'mahmut@mahmuthoca.com', password: 'password', role: UserRole.Coach, profilePicture: `https://i.pravatar.cc/150?u=mahmut`, childIds: [], parentIds: [], earnedBadgeIds: [] },
    { id: ayseHocaId, name: 'Ayşe Yılmaz', email: 'ayse@mahmuthoca.com', password: 'password', role: UserRole.Coach, profilePicture: `https://i.pravatar.cc/150?u=ayse`, childIds: [], parentIds: [], earnedBadgeIds: [] },
    // Students
    { id: student1Id, name: 'Ahmet Yılmaz', email: 'ahmet@mahmuthoca.com', password: 'password', role: UserRole.Student, profilePicture: `https://i.pravatar.cc/150?u=ahmet`, assignedCoachId: mahmutHocaId, gradeLevel: '12', academicTrack: AcademicTrack.Sayisal, parentIds: [parent1Id], xp: 1250, streak: 5, earnedBadgeIds: ['first-assignment', 'on-time-submissions'] },
    { id: student2Id, name: 'Zeynep Kaya', email: 'zeynep@mahmuthoca.com', password: 'password', role: UserRole.Student, profilePicture: `https://i.pravatar.cc/150?u=zeynep`, assignedCoachId: mahmutHocaId, gradeLevel: '11', academicTrack: AcademicTrack.EsitAgirlik, parentIds: [parent2Id], xp: 850, streak: 2, earnedBadgeIds: ['first-assignment'] },
    { id: student3Id, name: 'Can Demir', email: 'can@mahmuthoca.com', password: 'password', role: UserRole.Student, profilePicture: `https://i.pravatar.cc/150?u=can`, assignedCoachId: mahmutHocaId, gradeLevel: 'mezun', academicTrack: AcademicTrack.Sozel, parentIds: [], xp: 2300, streak: 0, earnedBadgeIds: ['first-assignment', 'streak-starter', 'perfect-score'] },
    { id: student4Id, name: 'Elif Şahin', email: 'elif@mahmuthoca.com', password: 'password', role: UserRole.Student, profilePicture: `https://i.pravatar.cc/150?u=elif`, assignedCoachId: ayseHocaId, gradeLevel: '12', academicTrack: AcademicTrack.Sayisal, parentIds: [], xp: 1800, streak: 8, earnedBadgeIds: ['first-assignment', 'streak-master', 'high-achiever'] },
    { id: student5Id, name: 'Mert Öztürk', email: 'mert@mahmuthoca.com', password: 'password', role: UserRole.Student, profilePicture: `https://i.pravatar.cc/150?u=mert`, assignedCoachId: ayseHocaId, gradeLevel: '10', academicTrack: AcademicTrack.Sayisal, parentIds: [], xp: 450, streak: 1, earnedBadgeIds: [] },
    { id: student6Id, name: 'İpek Aydın', email: 'ipek@mahmuthoca.com', password: 'password', role: UserRole.Student, profilePicture: `https://i.pravatar.cc/150?u=ipek`, assignedCoachId: ayseHocaId, gradeLevel: '11', academicTrack: AcademicTrack.Dil, parentIds: [], xp: 950, streak: 0, earnedBadgeIds: ['first-assignment'] },
    // Parents
    { id: parent1Id, name: 'Yılmaz Bey', email: 'yilmaz@veli.com', password: 'password', role: UserRole.Parent, profilePicture: `https://i.pravatar.cc/150?u=yilmaz`, childIds: [student1Id], parentIds: [], earnedBadgeIds: [] },
    { id: parent2Id, name: 'Fatma Hanım', email: 'fatma@veli.com', password: 'password', role: UserRole.Parent, profilePicture: `https://i.pravatar.cc/150?u=fatma`, childIds: [student2Id], parentIds: [], earnedBadgeIds: [] },
];

// --- HELPERS ---
const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pastDate = (daysAgo: number) => new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
const futureDate = (daysFuture: number) => new Date(Date.now() + daysFuture * 24 * 60 * 60 * 1000);
function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// --- DATA GENERATION ---

// 1. TEMPLATES
const templates: any[] = [];
examCategories.forEach(category => {
  if (category.name === "Genel Deneme Sınavları") return;
  category.topics.forEach(topic => {
    for (let i = 1; i <= 5; i++) {
      templates.push({
        id: uuid(),
        title: `${topic} - Pratik Testi ${i}`,
        description: `Bu ödev şablonu, "${topic}" konusundaki anlama ve uygulama becerilerinizi geliştirmek için tasarlanmıştır. ${i}. pratik testini içerir.`,
        checklist: [
          { text: `"${topic}" konusuyla ilgili notları gözden geçir.` },
          { text: 'En az 20 soru çöz.' },
          { text: 'Yanlış yapılan soruların çözümlerini incele.' },
          { text: 'Anlaşılmayan noktaları belirle ve not al.' }
        ]
      });
    }
  });
});

// 2. QUESTIONS
const questions: any[] = [];
examCategories.forEach(category => {
    if (category.name === "Genel Deneme Sınavları") return;
    const resourceCategoryKey = Object.keys(ResourceCategory).find(key => key.toLowerCase() === category.name.toLowerCase().replace(' ', ''));
    const resourceCategory = resourceCategoryKey ? ResourceCategory[resourceCategoryKey as keyof typeof ResourceCategory] : ResourceCategory.Genel;

    category.topics.forEach(topic => {
        // Generate 2 easy, 2 medium, 1 hard question for each topic
        for (let i = 0; i < 5; i++) {
            let difficulty: QuestionDifficulty;
            if (i < 2) difficulty = QuestionDifficulty.Easy;
            else if (i < 4) difficulty = QuestionDifficulty.Medium;
            else difficulty = QuestionDifficulty.Hard;

            const q: Partial<Question> = {
                id: uuid(),
                creatorId: getRandomItem(coachIds),
                category: resourceCategory,
                topic: topic,
                questionText: `${topic} konusuyla ilgili olarak, aşağıdaki ifadelerden hangisi doğrudur? Bu, ${difficulty} seviyesinde bir sorudur.`,
                options: [`Seçenek A`, `Doğru Cevap (${topic})`, `Seçenek C`, `Seçenek D`],
                correctOptionIndex: 1,
                difficulty: difficulty,
                explanation: `Doğru cevap B'dir çünkü ${topic} ile ilgili temel bir kuraldır.`,
                imageUrl: null, videoUrl: null, audioUrl: null, documentUrl: null, documentName: null
            };

            const mediaRoll = Math.random();
            if (mediaRoll < 0.1) { // 10% chance for an image
                q.imageUrl = `https://picsum.photos/seed/${q.id}/400/300`;
            } else if (mediaRoll < 0.12) { // 2% chance for a document
                q.documentUrl = `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`;
                q.documentName = `${topic} Ek Belge.pdf`;
            }

            questions.push(q);
        }
    });
});

// 3. RESOURCES
const resources: any[] = [];
const resourceSamples = {
    video: [ { name: "Konu Anlatım Videosu", url: "https://www.youtube.com/results?search_query=" } ],
    link: [ { name: "Wikipedia Makalesi", url: "https://tr.wikipedia.org/wiki/" } ],
    pdf: [ { name: "Konu Özeti PDF", url: "https://www.africau.edu/images/default/sample.pdf" } ]
};
examCategories.forEach(category => {
    const resourceCategoryKey = Object.keys(ResourceCategory).find(key => key.toLowerCase() === category.name.toLowerCase().replace(' ', ''));
    const resourceCategory = resourceCategoryKey ? ResourceCategory[resourceCategoryKey as keyof typeof ResourceCategory] : ResourceCategory.Genel;

    category.topics.forEach(topic => {
        resources.push({ id: uuid(), name: `${topic} - ${resourceSamples.video[0].name}`, type: 'video', url: resourceSamples.video[0].url + encodeURIComponent(topic), isPublic: true, uploaderId: getRandomItem(coachIds), assignedTo: [], category: resourceCategory });
        resources.push({ id: uuid(), name: `${topic} - ${resourceSamples.link[0].name}`, type: 'link', url: resourceSamples.link[0].url + encodeURIComponent(topic), isPublic: true, uploaderId: getRandomItem(coachIds), assignedTo: [], category: resourceCategory });
        resources.push({ id: uuid(), name: `${topic} - ${resourceSamples.pdf[0].name}`, type: 'pdf', url: resourceSamples.pdf[0].url, isPublic: true, uploaderId: getRandomItem(coachIds), assignedTo: [], category: resourceCategory });
    });
});

// 4. ASSIGNMENTS
const assignments: any[] = [];
studentIds.forEach(studentId => {
    examCategories.forEach(category => {
        if (category.name === "Genel Deneme Sınavları") return;
        const randomTopics = shuffleArray(category.topics).slice(0, 2); // 2 random topics per category
        
        randomTopics.forEach((topic, index) => {
            const status = [AssignmentStatus.Pending, AssignmentStatus.Submitted, AssignmentStatus.Graded][Math.floor(Math.random() * 3)];
            assignments.push({
                id: uuid(), studentId, coachId: getRandomItem(coachIds), title: `${category.name} - ${topic} Çalışması`,
                description: `${topic} konusu ile ilgili verilen kaynakları inceleyip 10 soruluk testi çözünüz.`,
                dueDate: status === 'pending' ? futureDate(Math.floor(Math.random() * 10) + 1) : pastDate(Math.floor(Math.random() * 10) + 1),
                status: status, submissionType: 'file',
                grade: status === 'graded' ? Math.floor(Math.random() * 50) + 50 : null,
                feedback: status === 'graded' ? 'İyi iş çıkardın, bazı noktalarda daha dikkatli olabilirsin.' : '',
                fileUrl: null, submittedAt: status !== 'pending' ? pastDate(Math.floor(Math.random() * 10) + 2) : null,
                checklist: []
            });
        });
    });
});

// 5. EXAMS
const exams: any[] = [];
studentIds.forEach(studentId => {
    // 2 general mock exams
    ['TYT', 'AYT'].forEach((type, i) => {
        const totalQ = type === 'TYT' ? 120 : 160;
        const correct = Math.floor(Math.random() * (totalQ * 0.6)) + (totalQ * 0.2); // 20%-80% correct
        const incorrect = Math.floor(Math.random() * (totalQ - correct));
        const empty = totalQ - correct - incorrect;
        exams.push({
            id: uuid(), studentId, title: `${type} Deneme Sınavı - ${i + 1}`, date: pastDate((i + 1) * 20),
            totalQuestions: totalQ, correct, incorrect, empty, netScore: correct - incorrect / 4,
            subjects: [
                { name: 'Matematik', totalQuestions: 40, correct: Math.floor(correct / 4), incorrect: Math.floor(incorrect / 4), empty: 0, netScore: 0 },
                { name: 'Türkçe', totalQuestions: 40, correct: Math.floor(correct / 4), incorrect: Math.floor(incorrect / 4), empty: 0, netScore: 0 }
            ],
            category: 'Genel Deneme Sınavları', topic: type, type: 'deneme'
        });
    });

    // Topic-specific exams
    examCategories.filter(c => c.name !== "Genel Deneme Sınavları").forEach(category => {
        const topic = getRandomItem(category.topics);
        const correct = Math.floor(Math.random() * 15) + 5;
        const incorrect = Math.floor(Math.random() * (20 - correct));
        const empty = 20 - correct - incorrect;
        exams.push({
            id: uuid(), studentId, title: `${topic} Konu Taraması`, date: pastDate(Math.floor(Math.random() * 30)),
            totalQuestions: 20, correct, incorrect, empty, netScore: correct - incorrect / 4,
            subjects: [], category: category.name, topic: topic, type: 'konu-tarama'
        });
    });
});

// 6. GOALS
const goals: any[] = [];
studentIds.forEach(studentId => {
    goals.push(
        { id: uuid(), studentId, title: 'Haftada 2 deneme sınavı çözmek', description: '', isCompleted: Math.random() > 0.5, milestones: [{id: uuid(), text: '1. Deneme', isCompleted: true}, {id: uuid(), text: '2. Deneme', isCompleted: false}] },
        { id: uuid(), studentId, title: 'Matematik - Türev konusunu tamamen bitirmek', description: '', isCompleted: Math.random() > 0.8, milestones: [] },
        { id: uuid(), studentId, title: 'Günde 50 paragraf sorusu çözme alışkanlığı kazanmak', description: '', isCompleted: false, milestones: [] },
        { id: uuid(), studentId, title: 'Fizik - Dinamik konusundan 100 soru çözmek', description: '', isCompleted: false, milestones: [] }
    );
});

// --- CONVERSATIONS & MESSAGES ---
const conversations = [
    { id: 'conv-announcements', participantIds: users.map(u => u.id), isGroup: true, groupName: '📢 Duyurular', groupImage: 'https://i.pravatar.cc/150?u=announcements', adminId: superAdminId },
    { id: 'conv-mahmut-ahmet', participantIds: [mahmutHocaId, student1Id], isGroup: false },
    { id: 'conv-mahmut-zeynep', participantIds: [mahmutHocaId, student2Id], isGroup: false },
    { id: 'conv-ayse-elif', participantIds: [ayseHocaId, student4Id], isGroup: false },
    { id: 'conv-ogretmenler', participantIds: [mahmutHocaId, ayseHocaId, superAdminId], isGroup: true, groupName: 'Öğretmenler Odası', groupImage: 'https://i.pravatar.cc/150?u=teachers', adminId: superAdminId },
];

const messages = [
    { id: uuid(), conversationId: 'conv-announcements', senderId: mahmutHocaId, text: 'Merhaba arkadaşlar, haftalık deneme sınavı sonuçları sisteme yüklenmiştir. Kontrol edebilirsiniz.', type: 'announcement', timestamp: pastDate(1), readBy: [] },
    { id: uuid(), conversationId: 'conv-mahmut-ahmet', senderId: mahmutHocaId, text: 'Ahmet, türev ödevindeki ilerlemen nasıl gidiyor?', type: 'text', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), readBy: [mahmutHocaId] },
    { id: uuid(), conversationId: 'conv-mahmut-ahmet', senderId: student1Id, text: 'İyi gidiyor hocam, son testteyim.', type: 'text', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), readBy: [student1Id] },
    { id: uuid(), conversationId: 'conv-ogretmenler', senderId: ayseHocaId, text: '12. sınıflar için ek bir etüt planlayalım mı?', type: 'text', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), readBy: [ayseHocaId] },
];

export const seedData = {
    users,
    assignments,
    exams,
    goals,
    resources,
    templates,
    questions,
    conversations,
    messages
};
