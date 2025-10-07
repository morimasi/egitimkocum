import { UserRole } from '../types';
import { examCategories } from './examCategories.js';

const uuid = () => crypto.randomUUID();

// --- USERS ---
const superAdminId = 'super-admin-id';
const mahmutHocaId = 'mahmut-hoca-id';
const ayseHocaId = 'ayse-hoca-id';

const users = [
    // Admins & Coaches
    { id: superAdminId, name: 'Süper Admin', email: 'admin@mahmuthoca.com', password: 'password', role: UserRole.SuperAdmin, profilePicture: `https://i.pravatar.cc/150?u=admin`, childIds: [], parentIds: [], earnedBadgeIds: [] },
    { id: mahmutHocaId, name: 'Mahmut Hoca', email: 'mahmut@mahmuthoca.com', password: 'password', role: UserRole.Coach, profilePicture: `https://i.pravatar.cc/150?u=mahmut`, childIds: [], parentIds: [], earnedBadgeIds: [] },
    { id: ayseHocaId, name: 'Ayşe Yılmaz', email: 'ayse@mahmuthoca.com', password: 'password', role: UserRole.Coach, profilePicture: `https://i.pravatar.cc/150?u=ayse`, childIds: [], parentIds: [], earnedBadgeIds: [] },
];

// --- TEMPLATES ---
const templates: any[] = [];
examCategories.forEach(category => {
  category.topics.forEach(topic => {
    for (let i = 1; i <= 10; i++) {
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

// --- CONVERSATIONS & MESSAGES ---
const conversations = [
    { id: 'conv-announcements', participantIds: users.map(u => u.id), isGroup: true, groupName: '📢 Duyurular', groupImage: 'https://i.pravatar.cc/150?u=announcements', adminId: superAdminId },
    { id: 'conv-ogretmenler', participantIds: [mahmutHocaId, ayseHocaId, superAdminId], isGroup: true, groupName: 'Öğretmenler Odası', groupImage: 'https://i.pravatar.cc/150?u=teachers', adminId: superAdminId },
];

export const seedData = {
    users,
    assignments: [],
    exams: [],
    goals: [],
    resources: [],
    templates,
    questions: [],
    conversations,
    messages: []
};