import express, { RequestHandler } from 'express';
import cors from 'cors';
import { sql } from '@vercel/postgres';
// FIX: Changed import to fix Express middleware type errors.
import { GoogleGenAI, Type } from "@google/genai";
import {
  User, UserRole, Assignment, Message, Conversation, AppNotification, AssignmentTemplate, Resource, Goal, Badge, CalendarEvent, Exam, Question, ResourceCategory, AcademicTrack, BadgeID, AssignmentStatus
} from '../types';
import { seedData, generateDynamicSeedData } from '../services/seedData';

// Initialize Express App
const app = express();
// FIX: Explicitly provide path to resolve middleware type inference error.
app.use('/', cors());
app.use('/', express.json({ limit: '50mb' }));

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// --- GEMINI JSON SCHEMAS ---
const schemas = {
  checklist: {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: { text: { type: Type.STRING } },
      required: ['text']
    }
  },
  gradeSuggestion: {
    type: Type.OBJECT,
    properties: {
      suggestedGrade: { type: Type.NUMBER },
      rationale: { type: Type.STRING }
    },
    required: ['suggestedGrade', 'rationale']
  },
  assignmentTemplate: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      checklist: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: { text: { type: Type.STRING } },
          required: ['text']
        }
      }
    },
    required: ['title', 'description', 'checklist']
  },
  studyPlan: {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        date: { type: Type.STRING },
        startTime: { type: Type.STRING },
        endTime: { type: Type.STRING },
        description: { type: Type.STRING }
      },
      required: ['title', 'date', 'startTime', 'endTime', 'description']
    }
  },
  goalWithMilestones: {
    type: Type.OBJECT,
    properties: {
      description: { type: Type.STRING },
      milestones: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: { text: { type: Type.STRING } },
          required: ['text']
        }
      }
    },
    required: ['description', 'milestones']
  },
  examDetails: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      totalQuestions: { type: Type.NUMBER },
      dueDate: { type: Type.STRING },
    },
    required: ['title', 'description', 'totalQuestions', 'dueDate']
  },
  question: {
    type: Type.OBJECT,
    properties: {
      questionText: { type: Type.STRING },
      options: { type: Type.ARRAY, items: { type: Type.STRING } },
      correctOptionIndex: { type: Type.NUMBER },
      explanation: { type: Type.STRING }
    },
    required: ['questionText', 'options', 'correctOptionIndex', 'explanation']
  }
};

// --- DATABASE INITIALIZATION ---
app.post('/api/init', async (_req, res) => {
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS "users" (
                id TEXT PRIMARY KEY, name TEXT, email TEXT UNIQUE, password TEXT, role TEXT, "profilePicture" TEXT, notes TEXT,
                "assignedCoachId" TEXT, "gradeLevel" TEXT, "academicTrack" TEXT, "childIds" TEXT[], "parentIds" TEXT[],
                xp INTEGER, streak INTEGER, "lastSubmissionDate" TEXT, "earnedBadgeIds" TEXT[]
            );
        `;
        await sql`
            CREATE TABLE IF NOT EXISTS "assignments" (
                id TEXT PRIMARY KEY, title TEXT, description TEXT, "dueDate" TEXT, status TEXT, grade INTEGER, feedback TEXT,
                "fileUrl" TEXT, "fileName" TEXT, "studentId" TEXT, "coachId" TEXT, "submittedAt" TEXT, "gradedAt" TEXT,
                "coachAttachments" JSONB, checklist JSONB, "audioFeedbackUrl" TEXT, "videoDescriptionUrl" TEXT, "videoFeedbackUrl" TEXT,
                "studentVideoSubmissionUrl" TEXT, "feedbackReaction" TEXT, "submissionType" TEXT, "textSubmission" TEXT,
                "studentAudioFeedbackResponseUrl" TEXT, "studentVideoFeedbackResponseUrl" TEXT, "studentTextFeedbackResponse" TEXT,
                "startTime" TEXT, "endTime" TEXT
            );
        `;
        await sql`CREATE TABLE IF NOT EXISTS "messages" ( id TEXT PRIMARY KEY, "senderId" TEXT, "conversationId" TEXT, text TEXT, timestamp TEXT, type TEXT, "fileUrl" TEXT, "fileName" TEXT, "fileType" TEXT, "imageUrl" TEXT, "audioUrl" TEXT, "videoUrl" TEXT, "readBy" TEXT[], reactions JSONB, "replyTo" TEXT, poll JSONB, priority TEXT );`;
        await sql`CREATE TABLE IF NOT EXISTS "conversations" ( id TEXT PRIMARY KEY, "participantIds" TEXT[], "isGroup" BOOLEAN, "groupName" TEXT, "groupImage" TEXT, "adminId" TEXT, "isArchived" BOOLEAN );`;
        await sql`CREATE TABLE IF NOT EXISTS "notifications" ( id TEXT PRIMARY KEY, "userId" TEXT, message TEXT, timestamp TEXT, "isRead" BOOLEAN, priority TEXT, link JSONB );`;
        await sql`CREATE TABLE IF NOT EXISTS "templates" ( id TEXT PRIMARY KEY, title TEXT, description TEXT, checklist JSONB, "isFavorite" BOOLEAN );`;
        await sql`CREATE TABLE IF NOT EXISTS "resources" ( id TEXT PRIMARY KEY, name TEXT, type TEXT, url TEXT, "isPublic" BOOLEAN, "uploaderId" TEXT, "assignedTo" TEXT[], category TEXT );`;
        await sql`CREATE TABLE IF NOT EXISTS "goals" ( id TEXT PRIMARY KEY, "studentId" TEXT, title TEXT, description TEXT, "isCompleted" BOOLEAN, milestones JSONB );`;
        await sql`CREATE TABLE IF NOT EXISTS "badges" ( id TEXT PRIMARY KEY, name TEXT, description TEXT );`;
        await sql`CREATE TABLE IF NOT EXISTS "calendarEvents" ( id TEXT PRIMARY KEY, "userId" TEXT, title TEXT, date TEXT, type TEXT, color TEXT, "startTime" TEXT, "endTime" TEXT );`;
        await sql`CREATE TABLE IF NOT EXISTS "exams" ( id TEXT PRIMARY KEY, "studentId" TEXT, title TEXT, date TEXT, "totalQuestions" INTEGER, correct INTEGER, incorrect INTEGER, empty INTEGER, "netScore" REAL, subjects JSONB, "coachNotes" TEXT, "studentReflections" TEXT, category TEXT, topic TEXT, type TEXT );`;
        await sql`CREATE TABLE IF NOT EXISTS "questions" ( id TEXT PRIMARY KEY, "creatorId" TEXT, category TEXT, topic TEXT, "questionText" TEXT, options TEXT[], "correctOptionIndex" INTEGER, difficulty TEXT, explanation TEXT, "imageUrl" TEXT, "videoUrl" TEXT, "audioUrl" TEXT, "documentUrl" TEXT, "documentName" TEXT );`;

        res.status(200).json({ message: 'Database initialized' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- API ROUTES ---

// Generic GET all data
app.get('/api/data', async (_req, res) => {
    try {
        const [users, assignments, messages, conversations, notifications, templates, resources, goals, badges, calendarEvents, exams, questions] = await Promise.all([
            sql`SELECT id, name, email, role, "profilePicture", notes, "assignedCoachId", "gradeLevel", "academicTrack", "childIds", "parentIds", xp, streak, "lastSubmissionDate", "earnedBadgeIds" FROM "users";`,
            sql`SELECT * FROM "assignments";`,
            sql`SELECT * FROM "messages";`,
            sql`SELECT * FROM "conversations";`,
            sql`SELECT * FROM "notifications";`,
            sql`SELECT * FROM "templates";`,
            sql`SELECT * FROM "resources";`,
            sql`SELECT * FROM "goals";`,
            sql`SELECT * FROM "badges";`,
            sql`SELECT * FROM "calendarEvents";`,
            sql`SELECT * FROM "exams";`,
            sql`SELECT * FROM "questions";`
        ]);
        res.status(200).json({
            users: users.rows,
            assignments: assignments.rows,
            messages: messages.rows,
            conversations: conversations.rows,
            notifications: notifications.rows,
            templates: templates.rows,
            resources: resources.rows,
            goals: goals.rows,
            badges: badges.rows,
            calendarEvents: calendarEvents.rows,
            exams: exams.rows,
            questions: questions.rows,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Auth
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { rows } = await sql`SELECT * FROM "users" WHERE email = ${email};`;
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Kullanıcı bulunamadı.' });
        }
        const user = rows[0];
        if (user.password !== password) {
            return res.status(401).json({ error: 'Hatalı şifre.' });
        }
        const { password: _, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/register', async (req, res) => {
    const { id, name, email, password, role, profilePicture } = req.body;
    try {
        // The first user to register becomes a SuperAdmin
        const { rows: existingUsers } = await sql`SELECT id FROM "users";`;
        const userRole = existingUsers.length === 0 ? UserRole.SuperAdmin : role;

        const { rows } = await sql`INSERT INTO "users" (id, name, email, password, role, "profilePicture") VALUES (${id}, ${name}, ${email}, ${password}, ${userRole}, ${profilePicture}) RETURNING *;`;
        const { password: _, ...newUser } = rows[0];
        res.status(201).json(newUser);
    } catch (error: any) {
        if (error.code === '23505') { // unique_violation
            return res.status(409).json({ error: 'Bu e-posta adresi zaten kayıtlı.' });
        }
        res.status(500).json({ error: error.message });
    }
});


// Generic CRUD factory
const createCrudRoutes = (tableName: string) => {
    const router = express.Router();
    
    router.post('/', async (req, res) => {
        const item = req.body;
        const columns = Object.keys(item).map(k => `"${k}"`).join(', ');
        const values = Object.values(item);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        try {
            const { rows } = await sql.query(`INSERT INTO "${tableName}" (${columns}) VALUES (${placeholders}) RETURNING *;`, values);
            res.status(201).json(rows[0]);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    router.put('/:id', async (req, res) => {
        const { id } = req.params;
        const updates = req.body;
        const setClause = Object.keys(updates).map((key, i) => `"${key}" = $${i + 1}`).join(', ');
        const values = [...Object.values(updates), id];
        try {
            const { rows } = await sql.query(`UPDATE "${tableName}" SET ${setClause} WHERE id = $${values.length} RETURNING *;`, values);
            if (rows.length === 0) return res.status(404).json({ error: 'Item not found' });
            res.status(200).json(rows[0]);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    router.delete('/', async (req, res) => {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'IDs array is required' });
        }
        try {
            // FIX: Manually format array to string literal for postgres `ANY` clause to satisfy vercel/postgres primitive type constraint.
            await sql.query(`DELETE FROM "${tableName}" WHERE id = ANY($1)`, ['{' + ids.join(',') + '}']);
            res.status(204).send();
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });
    
    return router;
};

app.use('/api/users', createCrudRoutes('users'));
app.use('/api/assignments', createCrudRoutes('assignments'));
app.use('/api/messages', createCrudRoutes('messages'));
app.use('/api/conversations', createCrudRoutes('conversations'));
app.use('/api/notifications', createCrudRoutes('notifications'));
app.use('/api/templates', createCrudRoutes('templates'));
app.use('/api/resources', createCrudRoutes('resources'));
app.use('/api/goals', createCrudRoutes('goals'));
app.use('/api/badges', createCrudRoutes('badges'));
app.use('/api/calendarEvents', createCrudRoutes('calendarEvents'));
app.use('/api/exams', createCrudRoutes('exams'));
app.use('/api/questions', createCrudRoutes('questions'));


// Special Routes
app.post('/api/conversations/findOrCreate', async (req, res) => {
    const { userId1, userId2 } = req.body;
    try {
        const { rows } = await sql`SELECT * FROM "conversations" WHERE "participantIds" @> ARRAY[${userId1}, ${userId2}] AND "isGroup" = false AND array_length("participantIds", 1) = 2;`;
        if (rows.length > 0) {
            return res.status(200).json(rows[0]);
        }
        const newConversation = {
            id: `conv-${userId1}-${userId2}-${Date.now()}`,
            participantIds: [userId1, userId2],
            isGroup: false,
        };
        const { rows: newRows } = await sql`INSERT INTO "conversations" (id, "participantIds", "isGroup") VALUES (${newConversation.id}, ${newConversation.participantIds as any}, ${newConversation.isGroup}) RETURNING *;`;
        res.status(201).json(newRows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});


// --- GEMINI PROXY ROUTES ---
app.post('/api/gemini/generateText', async (req, res) => {
    try {
        const { prompt, temperature } = req.body;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature }
        });
        res.status(200).json({ result: response.text });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/gemini/generateWithImage', async (req, res) => {
    try {
        const { textPart, imagePart } = req.body;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] }
        });
        res.status(200).json({ result: response.text });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/gemini/generateJson', async (req, res) => {
    try {
        const { prompt, schema } = req.body;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: schemas[schema as keyof typeof schemas]
            }
        });
        res.status(200).json({ result: JSON.parse(response.text) });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/gemini/chat', async (req, res) => {
    try {
        const { history, systemInstruction } = req.body;
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            history,
            config: { systemInstruction }
        });
        const lastMessage = history[history.length - 1].parts[0].text;
        const response = await chat.sendMessage(lastMessage);
        res.status(200).json({ text: response.text });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- SEED ROUTE (USE WITH CAUTION) ---
app.post('/api/seed', async (_req, res) => {
     try {
        // Drop tables to ensure a clean slate
        await sql`DROP TABLE IF EXISTS "users", "assignments", "messages", "conversations", "notifications", "templates", "resources", "goals", "badges", "calendarEvents", "exams", "questions";`;

        // Re-create tables from /api/init
        await sql`CREATE TABLE IF NOT EXISTS "users" ( id TEXT PRIMARY KEY, name TEXT, email TEXT UNIQUE, password TEXT, role TEXT, "profilePicture" TEXT, notes TEXT, "assignedCoachId" TEXT, "gradeLevel" TEXT, "academicTrack" TEXT, "childIds" TEXT[], "parentIds" TEXT[], xp INTEGER, streak INTEGER, "lastSubmissionDate" TEXT, "earnedBadgeIds" TEXT[] );`;
        await sql`CREATE TABLE IF NOT EXISTS "assignments" ( id TEXT PRIMARY KEY, title TEXT, description TEXT, "dueDate" TEXT, status TEXT, grade INTEGER, feedback TEXT, "fileUrl" TEXT, "fileName" TEXT, "studentId" TEXT, "coachId" TEXT, "submittedAt" TEXT, "gradedAt" TEXT, "coachAttachments" JSONB, checklist JSONB, "audioFeedbackUrl" TEXT, "videoDescriptionUrl" TEXT, "videoFeedbackUrl" TEXT, "studentVideoSubmissionUrl" TEXT, "feedbackReaction" TEXT, "submissionType" TEXT, "textSubmission" TEXT, "studentAudioFeedbackResponseUrl" TEXT, "studentVideoFeedbackResponseUrl" TEXT, "studentTextFeedbackResponse" TEXT, "startTime" TEXT, "endTime" TEXT );`;
        await sql`CREATE TABLE IF NOT EXISTS "messages" ( id TEXT PRIMARY KEY, "senderId" TEXT, "conversationId" TEXT, text TEXT, timestamp TEXT, type TEXT, "fileUrl" TEXT, "fileName" TEXT, "fileType" TEXT, "imageUrl" TEXT, "audioUrl" TEXT, "videoUrl" TEXT, "readBy" TEXT[], reactions JSONB, "replyTo" TEXT, poll JSONB, priority TEXT );`;
        await sql`CREATE TABLE IF NOT EXISTS "conversations" ( id TEXT PRIMARY KEY, "participantIds" TEXT[], "isGroup" BOOLEAN, "groupName" TEXT, "groupImage" TEXT, "adminId" TEXT, "isArchived" BOOLEAN );`;
        await sql`CREATE TABLE IF NOT EXISTS "notifications" ( id TEXT PRIMARY KEY, "userId" TEXT, message TEXT, timestamp TEXT, "isRead" BOOLEAN, priority TEXT, link JSONB );`;
        await sql`CREATE TABLE IF NOT EXISTS "templates" ( id TEXT PRIMARY KEY, title TEXT, description TEXT, checklist JSONB, "isFavorite" BOOLEAN );`;
        await sql`CREATE TABLE IF NOT EXISTS "resources" ( id TEXT PRIMARY KEY, name TEXT, type TEXT, url TEXT, "isPublic" BOOLEAN, "uploaderId" TEXT, "assignedTo" TEXT[], category TEXT );`;
        await sql`CREATE TABLE IF NOT EXISTS "goals" ( id TEXT PRIMARY KEY, "studentId" TEXT, title TEXT, description TEXT, "isCompleted" BOOLEAN, milestones JSONB );`;
        await sql`CREATE TABLE IF NOT EXISTS "badges" ( id TEXT PRIMARY KEY, name TEXT, description TEXT );`;
        await sql`CREATE TABLE IF NOT EXISTS "calendarEvents" ( id TEXT PRIMARY KEY, "userId" TEXT, title TEXT, date TEXT, type TEXT, color TEXT, "startTime" TEXT, "endTime" TEXT );`;
        await sql`CREATE TABLE IF NOT EXISTS "exams" ( id TEXT PRIMARY KEY, "studentId" TEXT, title TEXT, date TEXT, "totalQuestions" INTEGER, correct INTEGER, incorrect INTEGER, empty INTEGER, "netScore" REAL, subjects JSONB, "coachNotes" TEXT, "studentReflections" TEXT, category TEXT, topic TEXT, type TEXT );`;
        await sql`CREATE TABLE IF NOT EXISTS "questions" ( id TEXT PRIMARY KEY, "creatorId" TEXT, category TEXT, topic TEXT, "questionText" TEXT, options TEXT[], "correctOptionIndex" INTEGER, difficulty TEXT, explanation TEXT, "imageUrl" TEXT, "videoUrl" TEXT, "audioUrl" TEXT, "documentUrl" TEXT, "documentName" TEXT );`;

        // Insert users
        for (const user of seedData.users) {
            // FIX: Cast user to any to access password property, which exists in seed data but not in the frontend User type.
            // FIX: Manually format array to string literal for postgres to satisfy vercel/postgres primitive type constraint.
            await sql`
                INSERT INTO "users" (id, name, email, password, role, "profilePicture", xp, streak, "childIds", "parentIds", "earnedBadgeIds", "assignedCoachId", "gradeLevel", "academicTrack")
                VALUES (${user.id}, ${user.name}, ${user.email}, ${(user as any).password}, ${user.role}, ${user.profilePicture}, ${user.xp}, ${user.streak}, ${Array.isArray(user.childIds) ? `{${user.childIds.join(',')}}` : null}, ${Array.isArray(user.parentIds) ? `{${user.parentIds.join(',')}}` : null}, ${Array.isArray(user.earnedBadgeIds) ? `{${user.earnedBadgeIds.join(',')}}` : null}, ${user.assignedCoachId}, ${user.gradeLevel}, ${user.academicTrack})
                ON CONFLICT (email) DO NOTHING;
            `;
        }
        
        // Insert conversations
        for (const conv of seedData.conversations) {
            // FIX: Manually format array to string literal for postgres to satisfy vercel/postgres primitive type constraint.
            await sql`
                INSERT INTO "conversations" (id, "participantIds", "isGroup", "groupName", "groupImage", "adminId")
                VALUES (${conv.id}, ${`{${conv.participantIds.join(',')}}`}, ${conv.isGroup}, ${conv.groupName}, ${conv.groupImage}, ${conv.adminId})
                ON CONFLICT (id) DO NOTHING;
            `;
        }

        const { templates, resources } = generateDynamicSeedData();
        for (const template of templates) {
             await sql`
                INSERT INTO "templates" (id, title, description, checklist, "isFavorite")
                VALUES (${template.id}, ${template.title}, ${template.description}, ${JSON.stringify(template.checklist)}, ${template.isFavorite})
                ON CONFLICT (id) DO NOTHING;
            `;
        }
        for (const resource of resources) {
            // FIX: Manually format array to string literal for postgres to satisfy vercel/postgres primitive type constraint.
            await sql`
                INSERT INTO "resources" (id, name, type, url, "isPublic", "uploaderId", category, "assignedTo")
                VALUES (${resource.id}, ${resource.name}, ${resource.type}, ${resource.url}, ${resource.isPublic}, ${resource.uploaderId}, ${resource.category}, ${Array.isArray(resource.assignedTo) ? `{${resource.assignedTo.join(',')}}` : null})
                ON CONFLICT (id) DO NOTHING;
            `;
        }
        
        const badgesData: Badge[] = [
            { id: BadgeID.FirstAssignment, name: 'İlk Adım', description: 'İlk ödevini başarıyla teslim et.' },
            { id: BadgeID.HighAchiever, name: 'Yüksek Başarı', description: 'Bir ödevden 90 ve üzeri not al.' },
            { id: BadgeID.PerfectScore, name: 'Mükemmel Skor', description: 'Bir ödevden 100 tam puan al.' },
            { id: BadgeID.GoalGetter, name: 'Hedef Avcısı', description: 'İlk hedefini tamamla.' },
            { id: BadgeID.StreakStarter, name: 'Seri Başlangıcı', description: '3 günlük ödev teslim serisi yakala.' },
            { id: BadgeID.StreakMaster, name: 'Seri Ustası', description: '7 günlük ödev teslim serisi yakala.' },
            { id: BadgeID.OnTimeSubmissions, name: 'Dakik', description: 'Arka arkaya 5 ödevi zamanında teslim et.' },
        ];
        for (const badge of badgesData) {
            await sql`
                INSERT INTO "badges" (id, name, description) VALUES (${badge.id}, ${badge.name}, ${badge.description}) ON CONFLICT (id) DO NOTHING;
            `;
        }

        // Add sample assignments, exams, goals for students
        const students = seedData.users.filter(u => u.role === 'student');
        for (const student of students) {
             // Add a goal
            await sql`INSERT INTO "goals" (id, "studentId", title, description, "isCompleted", milestones) VALUES (${`goal-${student.id}`}, ${student.id}, 'Haftada 5 gün tekrar yap.', 'Her gün en az 30 dakika tekrar yaparak konuları pekiştir.', false, '[]') ON CONFLICT (id) DO NOTHING;`;
            // Add an exam
            await sql`INSERT INTO "exams" (id, "studentId", title, date, "totalQuestions", correct, incorrect, empty, "netScore", subjects, category, topic, type) VALUES (${`exam-${student.id}`}, ${student.id}, 'TYT Deneme Sınavı 1', '2024-05-10', 120, 75, 20, 25, 70.0, '[]', 'Genel Deneme Sınavları', 'TYT', 'deneme') ON CONFLICT (id) DO NOTHING;`;
            // Add a pending assignment
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 5);
            await sql`INSERT INTO "assignments" (id, title, description, "dueDate", status, grade, feedback, "studentId", "coachId", "submissionType") VALUES (${`assign-pending-${student.id}`}, 'Matematik - Türev Testi', 'Türev alma kurallarını pekiştirmek için 50 soruluk testi çözün.', ${dueDate.toISOString()}, 'pending', null, '', ${student.id}, ${student.assignedCoachId}, 'file') ON CONFLICT (id) DO NOTHING;`;
            // Add a graded assignment
             const submittedAt = new Date();
            submittedAt.setDate(submittedAt.getDate() - 3);
            await sql`INSERT INTO "assignments" (id, title, description, "dueDate", status, grade, feedback, "studentId", "coachId", "submissionType", "submittedAt", "gradedAt") VALUES (${`assign-graded-${student.id}`}, 'Fizik - Vektörler', 'Vektörler konusundan 30 soru çözümü.', ${submittedAt.toISOString()}, 'graded', 85, 'Vektörler konusunda temel bilgilerin iyi. Bileşke vektör bulmada biraz daha pratik yapmalısın.', ${student.id}, ${student.assignedCoachId}, 'file', ${submittedAt.toISOString()}, ${new Date().toISOString()}) ON CONFLICT (id) DO NOTHING;`;
        }

        res.status(200).json({ message: "Database seeded successfully" });

    } catch (error: any) {
        res.status(500).json({ error: `Seeding failed: ${error.message}` });
    }
});

export default app;
