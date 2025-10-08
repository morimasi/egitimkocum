import {
  UserRole, AssignmentTemplate, Resource, ResourceCategory, Conversation, AcademicTrack, BadgeID, Assignment, Message, AppNotification, Goal, Badge, CalendarEvent, Exam, Question
} from '../types';
import { examCategories } from './examCategories';

const uuid = () => crypto.randomUUID();

const user1 = {
    id: 'user-superadmin',
    name: 'Süper Admin',
    email: 'admin@mahmuthoca.com',
    password: 'password',
    role: UserRole.SuperAdmin,
    profilePicture: 'https://i.pravatar.cc/150?u=admin',
    assignedCoachId: null,
    gradeLevel: undefined,
    academicTrack: undefined,
    childIds: [] as string[],
    parentIds: [] as string[],
    xp: 0,
    streak: 0,
    earnedBadgeIds: [] as BadgeID[]
};
const user2 = {
    id: 'user-coach-1',
    name: 'Ayşe Yılmaz',
    email: 'ayse@mahmuthoca.com',
    password: 'password',
    role: UserRole.Coach,
    profilePicture: 'https://i.pravatar.cc/150?u=ayse',
    assignedCoachId: null,
    gradeLevel: undefined,
    academicTrack: undefined,
    childIds: [] as string[],
    parentIds: [] as string[],
    xp: 1500,
    streak: 5,
    earnedBadgeIds: [] as BadgeID[]
};
const user3 = {
    id: 'user-coach-2',
    name: 'Mehmet Öztürk',
    email: 'mehmet@mahmuthoca.com',
    password: 'password',
    role: UserRole.Coach,
    profilePicture: 'https://i.pravatar.cc/150?u=mehmet',
    assignedCoachId: null,
    gradeLevel: undefined,
    academicTrack: undefined,
    childIds: [] as string[],
    parentIds: [] as string[],
    xp: 800,
    streak: 2,
    earnedBadgeIds: [] as BadgeID[]
};

const student1 = {
    id: 'user-student-1',
    name: 'Ali Veli',
    email: 'ali@mahmuthoca.com',
    password: 'password',
    role: UserRole.Student,
    profilePicture: 'https://i.pravatar.cc/150?u=ali',
    assignedCoachId: 'user-coach-1',
    gradeLevel: '12',
    academicTrack: AcademicTrack.Sayisal,
    childIds: [] as string[],
    parentIds: ['user-parent-1'] as string[],
    xp: 250,
    streak: 3,
    earnedBadgeIds: [BadgeID.FirstAssignment] as BadgeID[]
};
const student2 = {
    id: 'user-student-2',
    name: 'Zeynep Kaya',
    email: 'zeynep@mahmuthoca.com',
    password: 'password',
    role: UserRole.Student,
    profilePicture: 'https://i.pravatar.cc/150?u=zeynep',
    assignedCoachId: 'user-coach-1',
    gradeLevel: 'mezun',
    academicTrack: AcademicTrack.EsitAgirlik,
    childIds: [] as string[],
    parentIds: [] as string[],
    xp: 1200,
    streak: 10,
    earnedBadgeIds: [BadgeID.FirstAssignment, BadgeID.HighAchiever, BadgeID.StreakStarter] as BadgeID[]
};
const student3 = {
    id: 'user-student-3',
    name: 'Mustafa Can',
    email: 'mustafa@mahmuthoca.com',
    password: 'password',
    role: UserRole.Student,
    profilePicture: 'https://i.pravatar.cc/150?u=mustafa',
    assignedCoachId: 'user-coach-2',
    gradeLevel: '11',
    academicTrack: AcademicTrack.Sozel,
    childIds: [] as string[],
    parentIds: [] as string[],
    xp: 50,
    streak: 0,
    earnedBadgeIds: [] as BadgeID[]
};
const parent1 = {
    id: 'user-parent-1',
    name: 'Hasan Veli',
    email: 'hasan@veli.com',
    password: 'password',
    role: UserRole.Parent,
    profilePicture: 'https://i.pravatar.cc/150?u=hasan',
    assignedCoachId: null,
    gradeLevel: undefined,
    academicTrack: undefined,
    childIds: ['user-student-1'] as string[],
    parentIds: [] as string[],
    xp: 0,
    streak: 0,
    earnedBadgeIds: [] as BadgeID[]
};


const users = [user1, user2, user3, student1, student2, student3, parent1];
const allUserIds = users.map(u => u.id);

const conversations: Conversation[] = [
    {
        id: 'conv-announcements',
        participantIds: allUserIds,
        isGroup: true,
        groupName: '📢 Duyurular',
        groupImage: 'https://i.pravatar.cc/150?u=announcements',
        adminId: user1.id
    },
    {
        id: `conv-${user2.id}-${student1.id}`,
        participantIds: [user2.id, student1.id, parent1.id], // Coach, Student, Parent
        isGroup: true,
        groupName: `${student1.name} Aile Grubu`,
        groupImage: student1.profilePicture,
        adminId: user2.id,
    }
];

export function generateDynamicSeedData() {
    const templates: AssignmentTemplate[] = [];
    const resources: Resource[] = [];
    
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

    examCategories.forEach(category => {
        const resourceCategory = categoryMap[category.name] || ResourceCategory.Genel;

        category.topics.slice(0, 2).forEach(topic => { // Limit to 2 topics per category for faster seeding
            // Generate 2 templates for each topic
            for (let i = 1; i <= 2; i++) {
                const templateType = i % 2 === 0 ? 'Soru Çözümü' : 'Konu Tekrarı';
                templates.push({
                    id: uuid(),
                    title: `${topic} - ${templateType}`,
                    description: `Bu şablon, "${topic}" konusundaki bilgileri pekiştirmek için tasarlanmış bir ${templateType.toLowerCase()} ödevidir.`,
                    checklist: [
                        { text: 'İlgili konu anlatımını gözden geçir.' },
                        { text: 'En az 20 soru çöz.' },
                        { text: 'Yanlış yapılan soruların çözümlerini öğren.' }
                    ],
                    isFavorite: Math.random() > 0.8
                });
            }
            
            // Generate 2 resources for each topic
            for (let i = 1; i <= 2; i++) {
                const resourceTypes: Resource['type'][] = ['video', 'pdf'];
                const type = resourceTypes[i % resourceTypes.length];
                const topicSlug = encodeURIComponent(topic.replace(/\s+/g, '-').toLowerCase());
                const name = `${topic} - ${type === 'video' ? 'Video Ders' : 'Konu Föyü'} ${i}`;
                const url = type === 'video' ? `https://www.youtube.com/results?search_query=${encodeURIComponent(topic)}` : `https://example.com/resources/${topicSlug}-${i}.pdf`;

                resources.push({
                    id: uuid(),
                    name, type, url,
                    isPublic: true,
                    uploaderId: user1.id, // Super Admin
                    category: resourceCategory,
                    assignedTo: []
                });
            }
        });
    });

    return { templates, resources };
}


export const seedData = {
    users,
    assignments: [] as Assignment[],
    messages: [] as Message[],
    conversations,
    notifications: [] as AppNotification[],
    templates: [] as AssignmentTemplate[],
    resources: [] as Resource[],
    goals: [] as Goal[],
    badges: [] as Badge[],
    calendarEvents: [] as CalendarEvent[],
    exams: [] as Exam[],
    questions: [] as Question[],
};