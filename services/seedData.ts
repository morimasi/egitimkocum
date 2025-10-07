

import {
  UserRole, AssignmentTemplate, Resource, ResourceCategory, Conversation
} from '../types';
import { examCategories } from './examCategories';

const uuid = () => crypto.randomUUID();

// FIX: Removed `: User` type annotation as seed data includes a `password` property not present in the frontend User type.
const user1 = { id: 'user-superadmin', name: 'Süper Admin', email: 'admin@mahmuthoca.com', password: 'password', role: UserRole.SuperAdmin, profilePicture: 'https://i.pravatar.cc/150?u=admin' };
// FIX: Removed `: User` type annotation as seed data includes a `password` property not present in the frontend User type.
const user2 = { id: 'user-coach-1', name: 'Ayşe Yılmaz', email: 'ayse@mahmuthoca.com', password: 'password', role: UserRole.Coach, profilePicture: 'https://i.pravatar.cc/150?u=ayse' };
// FIX: Removed `: User` type annotation as seed data includes a `password` property not present in the frontend User type.
const user3 = { id: 'user-coach-2', name: 'Mehmet Öztürk', email: 'mehmet@mahmuthoca.com', password: 'password', role: UserRole.Coach, profilePicture: 'https://i.pravatar.cc/150?u=mehmet' };

// FIX: Removed `: User[]` type annotation to allow objects with the `password` property.
const users = [user1, user2, user3];

const conversations: Conversation[] = [
    {
        id: 'conv-announcements',
        participantIds: users.map(u => u.id),
        isGroup: true,
        groupName: '📢 Duyurular',
        groupImage: 'https://i.pravatar.cc/150?u=announcements',
        adminId: user1.id
    },
];

const categoryMap: { [key: string]: ResourceCategory } = {
    "Matematik": ResourceCategory.Matematik,
    "Geometri": ResourceCategory.Matematik,
    "Fizik": ResourceCategory.Fizik,
    "Kimya": ResourceCategory.Kimya,
    "Biyoloji": ResourceCategory.Biyoloji,
    "Türkçe": ResourceCategory.Turkce,
    "Edebiyat": ResourceCategory.Turkce,
    "Tarih": ResourceCategory.Tarih,
    "Coğrafya": ResourceCategory.Cografya,
    "Felsefe": ResourceCategory.Felsefe,
    "Genel Deneme Sınavları": ResourceCategory.Genel,
};

const templates: AssignmentTemplate[] = [];
const resources: Resource[] = [];

examCategories.forEach(category => {
    const resourceCategory = categoryMap[category.name] || ResourceCategory.Genel;

    category.topics.forEach(topic => {
        // Generate 10 templates for each topic
        for (let i = 1; i <= 10; i++) {
            const templateType = i % 3 === 0 ? 'Soru Çözümü' : (i % 3 === 1 ? 'Konu Tekrarı' : 'Genel Alıştırma');
            templates.push({
                id: uuid(),
                title: `${topic} - ${templateType} ${i}`,
                description: `Bu şablon, "${topic}" konusundaki bilgileri pekiştirmek için tasarlanmış bir ${templateType.toLowerCase()} ödevidir. Öğrencinin konudaki eksiklerini görmesi ve pratik yapması hedeflenmektedir.`,
                checklist: [
                    { text: 'İlgili konu anlatımını gözden geçir.' },
                    { text: 'En az 20 soru çöz.' },
                    { text: 'Yanlış yapılan soruların çözümlerini öğren.' },
                    { text: 'Anlaşılmayan noktaları koçuna sor.' }
                ],
                isFavorite: Math.random() > 0.8 // Randomly make some favorite
            });
        }
        
        // Generate 10 resources for each topic
        for (let i = 1; i <= 10; i++) {
            const resourceTypes: Resource['type'][] = ['video', 'pdf', 'link', 'document'];
            const type = resourceTypes[i % resourceTypes.length];
            let name = '';
            let url = '';
            const topicSlug = encodeURIComponent(topic.replace(/\s+/g, '-').toLowerCase());

            switch(type) {
                case 'video':
                    name = `${topic} - Video Ders Anlatımı ${i}`;
                    url = `https://www.youtube.com/results?search_query=${encodeURIComponent(topic)}`;
                    break;
                case 'pdf':
                    name = `${topic} - Konu Anlatım Föyü ${i}`;
                    url = `https://example.com/resources/${topicSlug}-${i}.pdf`;
                    break;
                case 'link':
                    name = `${topic} - Etkileşimli Alıştırma ${i}`;
                    url = `https://example.com/exercises/${topicSlug}`;
                    break;
                case 'document':
                    name = `${topic} - Özet Notlar ${i}`;
                    url = `https://example.com/docs/${topicSlug}-${i}.docx`;
                    break;
            }

            resources.push({
                id: uuid(),
                name,
                type,
                url,
                isPublic: true,
                uploaderId: user1.id, // Super Admin
                category: resourceCategory,
                assignedTo: []
            });
        }
    });
});


export const seedData = {
    users,
    assignments: [],
    messages: [],
    conversations,
    notifications: [],
    templates,
    resources,
    goals: [],
    badges: [],
    calendarEvents: [],
    exams: [],
    questions: [],
};