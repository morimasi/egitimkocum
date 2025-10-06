// v5 - Added Gemini proxy endpoint to secure API key.
import express from 'express';
import { sql } from '@vercel/postgres';
import cors from 'cors';
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const router = express.Router(); // Use a router
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Initialize Gemini AI
let ai;
if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} else {
    console.warn("API_KEY environment variable not found. Gemini API features will be disabled.");
}


const createTables = async () => {
    await sql`
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255),
            email VARCHAR(255) UNIQUE,
            role VARCHAR(50),
            "profilePicture" TEXT,
            "isOnline" BOOLEAN DEFAULT false,
            notes TEXT,
            "assignedCoachId" VARCHAR(255),
            "gradeLevel" VARCHAR(50),
            "academicTrack" VARCHAR(50),
            "childIds" TEXT,
            "parentIds" TEXT,
            xp INT DEFAULT 0,
            streak INT DEFAULT 0,
            "lastSubmissionDate" TIMESTAMPTZ,
            "earnedBadgeIds" TEXT
        );
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS assignments (
            id VARCHAR(255) PRIMARY KEY,
            title VARCHAR(255),
            description TEXT,
            "dueDate" TIMESTAMPTZ,
            status VARCHAR(50),
            grade INT,
            feedback TEXT,
            "fileUrl" TEXT,
            "fileName" VARCHAR(255),
            "studentId" VARCHAR(255),
            "coachId" VARCHAR(255),
            "submittedAt" TIMESTAMPTZ,
            "gradedAt" TIMESTAMPTZ,
            "coachAttachments" TEXT,
            checklist TEXT,
            "audioFeedbackUrl" TEXT,
            "videoDescriptionUrl" TEXT,
            "videoFeedbackUrl" TEXT,
            "studentVideoSubmissionUrl" TEXT,
            "feedbackReaction" VARCHAR(10),
            "submissionType" VARCHAR(50),
            "textSubmission" TEXT,
            "studentAudioFeedbackResponseUrl" TEXT,
            "studentVideoFeedbackResponseUrl" TEXT,
            "studentTextFeedbackResponse" TEXT,
            "startTime" TIMESTAMPTZ,
            "endTime" TIMESTAMPTZ
        );
    `;

    // Corrected schema with quoted "readBy"
    await sql`
        CREATE TABLE IF NOT EXISTS messages (
            id VARCHAR(255) PRIMARY KEY,
            "senderId" VARCHAR(255),
            "conversationId" VARCHAR(255),
            text TEXT,
            timestamp TIMESTAMPTZ,
            type VARCHAR(50),
            "fileUrl" TEXT,
            "fileName" VARCHAR(255),
            "fileType" VARCHAR(100),
            "imageUrl" TEXT,
            "audioUrl" TEXT,
            "videoUrl" TEXT,
            "readBy" TEXT,
            reactions TEXT,
            "replyTo" VARCHAR(255),
            poll TEXT,
            priority VARCHAR(50)
        );
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS conversations (
            id VARCHAR(255) PRIMARY KEY,
            "participantIds" TEXT,
            "isGroup" BOOLEAN,
            "groupName" VARCHAR(255),
            "groupImage" TEXT,
            "adminId" VARCHAR(255),
            "isArchived" BOOLEAN DEFAULT false
        );
    `;

    await sql`CREATE TABLE IF NOT EXISTS notifications (id VARCHAR(255) PRIMARY KEY, "userId" VARCHAR(255), message TEXT, timestamp TIMESTAMPTZ, "isRead" BOOLEAN, priority VARCHAR(50), link TEXT)`;
    await sql`CREATE TABLE IF NOT EXISTS templates (id VARCHAR(255) PRIMARY KEY, title VARCHAR(255), description TEXT, checklist TEXT, "isFavorite" BOOLEAN)`;
    await sql`CREATE TABLE IF NOT EXISTS resources (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255), type VARCHAR(50), url TEXT, "isPublic" BOOLEAN, "uploaderId" VARCHAR(255), "assignedTo" TEXT, category VARCHAR(50))`;
    await sql`CREATE TABLE IF NOT EXISTS goals (id VARCHAR(255) PRIMARY KEY, "studentId" VARCHAR(255), title VARCHAR(255), description TEXT, "isCompleted" BOOLEAN, milestones TEXT)`;
    await sql`CREATE TABLE IF NOT EXISTS badges (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255), description TEXT)`;
    await sql`CREATE TABLE IF NOT EXISTS calendarEvents (id VARCHAR(255) PRIMARY KEY, "userId" VARCHAR(255), title VARCHAR(255), date TIMESTAMPTZ, type VARCHAR(50), color VARCHAR(50), "startTime" VARCHAR(50), "endTime" VARCHAR(50))`;
    await sql`CREATE TABLE IF NOT EXISTS exams (id VARCHAR(255) PRIMARY KEY, "studentId" VARCHAR(255), title VARCHAR(255), date TIMESTAMPTZ, "totalQuestions" INT, correct INT, incorrect INT, empty INT, "netScore" NUMERIC, subjects TEXT, "coachNotes" TEXT, "studentReflections" TEXT, category VARCHAR(255), topic VARCHAR(255), type VARCHAR(50))`;
    await sql`CREATE TABLE IF NOT EXISTS questions (id VARCHAR(255) PRIMARY KEY, "creatorId" VARCHAR(255), category VARCHAR(50), topic VARCHAR(255), "questionText" TEXT, options TEXT, "correctOptionIndex" INT, difficulty VARCHAR(50), explanation TEXT, "imageUrl" TEXT, "videoUrl" TEXT, "audioUrl" TEXT, "documentUrl" TEXT, "documentName" VARCHAR(255))`;
};

const resetAndSeedDatabase = async () => {
    // Drop tables first to ensure a clean schema
    await sql`DROP TABLE IF EXISTS questions CASCADE;`;
    await sql`DROP TABLE IF EXISTS exams CASCADE;`;
    await sql`DROP TABLE IF EXISTS calendarEvents CASCADE;`;
    await sql`DROP TABLE IF EXISTS badges CASCADE;`;
    await sql`DROP TABLE IF EXISTS goals CASCADE;`;
    await sql`DROP TABLE IF EXISTS resources CASCADE;`;
    await sql`DROP TABLE IF EXISTS templates CASCADE;`;
    await sql`DROP TABLE IF EXISTS notifications CASCADE;`;
    await sql`DROP TABLE IF EXISTS conversations CASCADE;`;
    await sql`DROP TABLE IF EXISTS messages CASCADE;`;
    await sql`DROP TABLE IF EXISTS assignments CASCADE;`;
    await sql`DROP TABLE IF EXISTS users CASCADE;`;

    await createTables();

    // Seed data
    await sql`
        INSERT INTO users (id, name, email, role, "profilePicture", "isOnline", "assignedCoachId", "gradeLevel", "academicTrack", xp, streak, "parentIds", "childIds") VALUES
        ('user_admin', 'Mahmut Hoca', 'admin@egitim.com', 'superadmin', 'https://i.pravatar.cc/150?u=admin@egitim.com', true, null, null, null, 0, 0, null, null),
        ('user_coach_1', 'Ahmet Yılmaz', 'ahmet.yilmaz@egitim.com', 'coach', 'https://i.pravatar.cc/150?u=ahmet.yilmaz@egitim.com', true, null, null, null, 0, 0, null, null),
        ('user_student_1', 'Leyla Kaya', 'leyla.kaya@mail.com', 'student', 'https://i.pravatar.cc/150?u=leyla.kaya@mail.com', true, 'user_coach_1', '12', 'sayisal', 1250, 5, 'user_parent_1', null),
        ('user_student_2', 'Mehmet Öztürk', 'mehmet.ozturk@mail.com', 'student', 'https://i.pravatar.cc/150?u=mehmet.ozturk@mail.com', true, 'user_coach_1', '11', 'esit-agirlik', 800, 2, null, null),
        ('user_student_3', 'Ali Veli', 'ali.veli@mail.com', 'student', 'https://i.pravatar.cc/150?u=ali.veli@mail.com', false, 'user_coach_1', '12', 'sayisal', 1500, 0, null, null),
        ('user_coach_2', 'Zeynep Çelik', 'zeynep.celik@egitim.com', 'coach', 'https://i.pravatar.cc/150?u=zeynep.celik@egitim.com', true, null, null, null, 0, 0, null, null),
        ('user_student_4', 'Elif Naz', 'elif.naz@mail.com', 'student', 'https://i.pravatar.cc/150?u=elif.naz@mail.com', true, 'user_coach_2', '10', 'dil', 450, 0, null, null),
        ('user_parent_1', 'Sema Kaya', 'sema.kaya@mail.com', 'parent', 'https://i.pravatar.cc/150?u=sema.kaya@mail.com', true, null, null, null, 0, 0, null, 'user_student_1');
    `;
    await sql`
        INSERT INTO assignments (id, title, description, "dueDate", status, "studentId", "coachId", "submissionType", grade, feedback, "submittedAt", checklist) VALUES
        ('assign_1', 'Matematik: Türev Alma Kuralları Testi', 'Türev alma kurallarını içeren 20 soruluk testi çözün ve sonuçlarınızı yükleyin. Özellikle çarpım ve bölüm türevine odaklanın.', ${new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()}, 'pending', 'user_student_1', 'user_coach_1', 'file', null, '', null, '[{"text": "Konu tekrarı yapıldı."}, {"text": "20 soru çözüldü."}, {"text": "Yanlışlar kontrol edildi."}]'),
        ('assign_2', 'Türkçe: Paragraf Soru Çözümü', 'Verilen kaynaktan 50 paragraf sorusu çözülecek.', ${new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()}, 'graded', 'user_student_1', 'user_coach_1', 'completed', 95, 'Harika bir iş çıkardın Leyla! Paragraf anlama hızın ve doğruluğun gözle görülür şekilde artmış. Bu tempoyu koru!', ${new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()}, '[]'),
        ('assign_3', 'Fizik: Vektörler Konu Özeti', 'Fizik dersi vektörler konusunun özetini çıkarıp metin olarak gönderin. Bileşke vektör bulma yöntemlerine özellikle değinin.', ${new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()}, 'pending', 'user_student_2', 'user_coach_1', 'text', null, '', null, '[]'),
        ('assign_4', 'Kimya: Mol Kavramı Soru Bankası', 'Soru bankasındaki mol kavramı ile ilgili ilk 3 testi bitir.', ${new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()}, 'submitted', 'user_student_2', 'user_coach_1', 'completed', null, '', ${new Date().toISOString()}, '[]'),
        ('assign_5', 'İngilizce: Kelime Çalışması', 'Verilen 20 kelimeyi ezberle ve her biriyle birer cümle kur.', ${new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()}, 'submitted', 'user_student_4', 'user_coach_2', 'text', null, '', ${new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()}, '[]');
    `;
    await sql`
        INSERT INTO conversations (id, "participantIds", "isGroup", "groupName", "groupImage", "adminId") VALUES
        ('conv-1', 'user_coach_1,user_student_1', false, null, null, null),
        ('conv-2', 'user_coach_1,user_student_2', false, null, null, null),
        ('conv-3', 'user_coach_1,user_student_3', false, null, null, null),
        ('conv-4', 'user_coach_2,user_student_4', false, null, null, null),
        ('conv-announcements', 'user_admin,user_coach_1,user_coach_2,user_student_1,user_student_2,user_student_3,user_student_4', true, '📢 Duyurular', 'https://i.pravatar.cc/150?u=announcements', 'user_admin'),
        ('conv-group-1', 'user_coach_1,user_student_1,user_student_3', true, 'Sayısal Çalışma Grubu', 'https://i.pravatar.cc/150?u=sayisal', 'user_coach_1'),
        ('conv-teachers-lounge', 'user_admin,user_coach_1,user_coach_2', true, 'Öğretmenler Odası', 'https://i.pravatar.cc/150?u=teachers', 'user_admin');
    `;
    await sql`
        INSERT INTO messages (id, "senderId", "conversationId", text, timestamp, type, "readBy") VALUES
        ('msg-1', 'user_coach_1', 'conv-1', 'Merhaba Leyla, haftalık programını gözden geçirdim. Matematik netlerin yükselişte, tebrikler!', ${new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()}, 'text', '["user_coach_1"]'),
        ('msg-2', 'user_student_1', 'conv-1', 'Teşekkür ederim öğretmenim! Türev testinde biraz zorlandım ama halledeceğim.', ${new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()}, 'text', '["user_student_1"]'),
        ('msg-3', 'user_admin', 'conv-announcements', 'Arkadaşlar, yarınki deneme sınavı için son tekrar yapmayı unutmayın! Başarılar dilerim.', ${new Date().toISOString()}, 'announcement', '["user_admin"]');
    `;
    await sql`
        INSERT INTO badges (id, name, description) VALUES
        ('first-assignment', 'İlk Adım', 'İlk ödevini başarıyla tamamladın!'),
        ('high-achiever', 'Yüksek Başarı', 'Not ortalaman 90''ın üzerinde!'),
        ('perfect-score', 'Mükemmel Skor', 'Bir ödevden 100 tam puan aldın!'),
        ('goal-getter', 'Hedef Avcısı', 'Haftalık hedeflerinin hepsine ulaştın!'),
        ('streak-starter', 'Seri Başladı', '3 gün üst üste ödev teslim ettin.'),
        ('streak-master', 'Seri Ustası', '7 gün üst üste ödev teslim ettin.'),
        ('on-time-submissions', 'Dakik Oyuncu', '5 ödevi zamanında teslim ettin.');
    `;
    return 'Database reset and seeded successfully.';
};


router.get('/seed', async (req, res) => {
    try {
        const message = await resetAndSeedDatabase();
        res.status(200).send(message);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/data', async (req, res) => {
    try {
        // A simple check to see if the main table exists and has the correct schema.
        await sql`SELECT id, "readBy" FROM messages LIMIT 1`;
        
        // Fetch all data
        const { rows: users } = await sql`SELECT * FROM users;`;
        const { rows: assignments } = await sql`SELECT * FROM assignments;`;
        const { rows: messages } = await sql`SELECT * FROM messages;`;
        const { rows: conversations } = await sql`SELECT * FROM conversations;`;
        const { rows: notifications } = await sql`SELECT * FROM notifications`;
        const { rows: templates } = await sql`SELECT * FROM templates`;
        const { rows: resources } = await sql`SELECT * FROM resources`;
        const { rows: goals } = await sql`SELECT * FROM goals`;
        const { rows: badges } = await sql`SELECT * FROM badges`;
        const { rows: calendarEvents } = await sql`SELECT * FROM calendarEvents`;
        const { rows: exams } = await sql`SELECT * FROM exams`;
        const { rows: questions } = await sql`SELECT * FROM questions`;

        // Process arrays from text
        users.forEach(u => {
            u.childIds = typeof u.childIds === 'string' && u.childIds ? u.childIds.split(',') : [];
            u.parentIds = typeof u.parentIds === 'string' && u.parentIds ? u.parentIds.split(',') : [];
            u.earnedBadgeIds = typeof u.earnedBadgeIds === 'string' && u.earnedBadgeIds ? u.earnedBadgeIds.split(',') : [];
        });
         conversations.forEach(c => {
            c.participantIds = typeof c.participantIds === 'string' && c.participantIds ? c.participantIds.split(',') : [];
        });
        assignments.forEach(a => {
            try { a.checklist = typeof a.checklist === 'string' ? JSON.parse(a.checklist) : (a.checklist || []); } catch (e) { a.checklist = []; }
            try { a.coachAttachments = typeof a.coachAttachments === 'string' ? JSON.parse(a.coachAttachments) : (a.coachAttachments || []); } catch (e) { a.coachAttachments = []; }
        });
        messages.forEach(m => {
            try { m.readBy = typeof m.readBy === 'string' ? JSON.parse(m.readBy) : (m.readBy || []); } catch (e) { m.readBy = []; }
            try { m.reactions = typeof m.reactions === 'string' ? JSON.parse(m.reactions) : (m.reactions || undefined); } catch (e) { m.reactions = undefined; }
            try { m.poll = typeof m.poll === 'string' ? JSON.parse(m.poll) : (m.poll || undefined); } catch (e) { m.poll = undefined; }
        });
        goals.forEach(g => {
            try { g.milestones = typeof g.milestones === 'string' ? JSON.parse(g.milestones) : (g.milestones || []); } catch (e) { g.milestones = []; }
        });
         exams.forEach(ex => {
            try { ex.subjects = typeof ex.subjects === 'string' ? JSON.parse(ex.subjects) : (ex.subjects || []); } catch (e) { ex.subjects = []; }
        });
         questions.forEach(q => {
            try { q.options = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []); } catch (e) { q.options = []; }
        });
        
        res.status(200).json({ users, assignments, messages, conversations, notifications, templates, resources, goals, badges, calendarEvents, exams, questions });
    } catch (error) {
        // If the query fails, it means setup is needed.
        if (error.message.includes('relation "messages" does not exist')) {
             return res.status(503).json({ code: 'DB_NOT_INITIALIZED', message: 'Database tables do not exist. Please run the setup.' });
        }
        if (error.message.includes('column "readBy" of relation "messages" does not exist')) {
             return res.status(503).json({ code: 'DB_SCHEMA_OLD', message: 'Database schema is outdated. Please run the setup.' });
        }
        console.error("Error fetching data:", error);
        res.status(500).json({ error: error.message });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    const { email } = req.body;
    try {
        const { rows } = await sql`SELECT * FROM users WHERE email = ${email.toLowerCase()};`;
        if (rows.length > 0) {
            const user = rows[0];
            user.childIds = typeof user.childIds === 'string' && user.childIds ? user.childIds.split(',') : [];
            user.parentIds = typeof user.parentIds === 'string' && user.parentIds ? user.parentIds.split(',') : [];
            user.earnedBadgeIds = typeof user.earnedBadgeIds === 'string' && user.earnedBadgeIds ? user.earnedBadgeIds.split(',') : [];
            res.status(200).json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- CUSTOM ENDPOINTS ---
router.post('/conversations/:id/mark-as-read', async (req, res) => {
    const { id: conversationId } = req.params;
    const { userId } = req.body;
    try {
        const { rows: messages } = await sql`SELECT id, "readBy" FROM messages WHERE "conversationId" = ${conversationId}`;
        const updates = [];
        for (const message of messages) {
            const readBy = (typeof message.readBy === 'string' && message.readBy) ? JSON.parse(message.readBy) : [];
            if (!readBy.includes(userId)) {
                readBy.push(userId);
                updates.push(sql`UPDATE messages SET "readBy" = ${JSON.stringify(readBy)} WHERE id = ${message.id}`);
            }
        }
        if (updates.length > 0) await Promise.all(updates);
        res.status(200).json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/notifications/mark-as-read', async (req, res) => {
    const { userId } = req.body;
    try {
        await sql`UPDATE notifications SET "isRead" = true WHERE "userId" = ${userId} AND "isRead" = false`;
        res.status(200).json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/calendarEvents/batch', async (req, res) => {
    const events = req.body;
    if (!Array.isArray(events) || events.length === 0) return res.status(400).json({ message: 'Invalid body.' });
    try {
        const client = await sql.connect();
        try {
            await client.query('BEGIN');
            for (const event of events) {
                await client.query( `INSERT INTO calendarEvents (id, "userId", title, date, type, color, "startTime", "endTime") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [event.id, event.userId, event.title, event.date, event.type, event.color, event.startTime, event.endTime]);
            }
            await client.query('COMMIT');
        } catch(e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
        res.status(201).json(events);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- GENERIC CRUD ENDPOINTS ---
router.post('/:collection', async (req, res) => {
    const { collection } = req.params;
    const data = req.body;
    try {
        const columns = Object.keys(data).map(k => `"${k}"`).join(', ');
        const values = Object.values(data);
        const placeholders = Object.keys(data).map((_, i) => `$${i + 1}`).join(', ');
        await sql.query(`INSERT INTO ${collection} (${columns}) VALUES (${placeholders})`, values);
        res.status(201).json(data);
    } catch (error) {
        console.error(`Error inserting into ${collection}:`, error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/:collection/:id', async (req, res) => {
    const { collection, id } = req.params;
    const data = req.body;
    try {
        const setClause = Object.keys(data).map((key, i) => `"${key}" = $${i + 1}`).join(', ');
        const values = [...Object.values(data), id];
        await sql.query(`UPDATE ${collection} SET ${setClause} WHERE id = $${values.length}`, values);
        res.status(200).json(data);
    } catch (error) {
        console.error(`Error updating ${collection}:`, error);
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:collection', async (req, res) => {
    const { collection } = req.params;
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'Invalid body, expected array of IDs.' });
    try {
        const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
        await sql.query(`DELETE FROM ${collection} WHERE id IN (${placeholders})`, ids);
        res.status(204).send();
    } catch (error) {
        console.error(`Error deleting from ${collection}:`, error);
        res.status(500).json({ error: error.message });
    }
});

// --- GEMINI PROXY ENDPOINTS ---

const getSubject = (title) => {
    const SUBJECT_KEYWORDS = {
        'Matematik': ['matematik', 'türev', 'limit', 'problem', 'geometri'], 'Fizik': ['fizik', 'deney', 'sarkaç', 'vektörler', 'optik', 'elektrik'], 'Kimya': ['kimya', 'formül', 'organik', 'mol'], 'Biyoloji': ['biyoloji', 'hücre', 'bölünme', 'çizim'], 'Türkçe': ['türkçe', 'kompozisyon', 'paragraf', 'özet', 'makale', 'kitap', 'edebiyat'], 'Tarih': ['tarih', 'ihtilal', 'araştırma', 'savaş'], 'Coğrafya': ['coğrafya', 'iklim', 'sunum', 'göller'], 'İngilizce': ['ingilizce', 'kelime', 'essay'], 'Felsefe': ['felsefe']
    };
    for (const subject in SUBJECT_KEYWORDS) {
        if (SUBJECT_KEYWORDS[subject].some(keyword => title.toLowerCase().includes(keyword))) {
            return subject;
        }
    }
    return 'Diğer';
};

router.post('/gemini-chat', async (req, res) => {
    if (!ai) return res.status(500).json({ message: 'Gemini API is not configured.' });
    try {
        const { history, systemInstruction } = req.body;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: history,
            config: { systemInstruction }
        });
        res.json({ text: response.text });
    } catch (error) {
        console.error('Gemini Chat error:', error);
        res.status(500).json({ message: error.message });
    }
});

router.post('/gemini', async (req, res) => {
    if (!ai) return res.status(500).json({ message: 'Gemini API is not configured.' });
    
    try {
        const { task, payload } = req.body;
        let response;
        let prompt;

        switch (task) {
            // Cases returning { text: '...' }
            case 'generateAssignmentDescription':
                prompt = `Bir eğitim koçu olarak, "${payload.title}" başlıklı bir ödev için öğrencilere yol gösterecek, motive edici ve net bir açıklama metni oluştur. Açıklama, ödevin amacını, beklentileri ve teslimat kriterlerini içermeli.`;
                response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.7 } });
                return res.json({ text: response.text });

            case 'generateSmartFeedback':
                const { assignmentToGrade, allStudentAssignments } = payload;
                const currentSubject = getSubject(assignmentToGrade.title);
                const previousAssignmentsInSubject = allStudentAssignments.filter(a => a.id !== assignmentToGrade.id && getSubject(a.title) === currentSubject && a.status === 'graded' && a.grade !== null);
                let subjectContext = "";
                if (previousAssignmentsInSubject.length > 0) {
                    const previousAvg = Math.round(previousAssignmentsInSubject.reduce((sum, a) => sum + a.grade, 0) / previousAssignmentsInSubject.length);
                    subjectContext = `Öğrencinin bu dersteki önceki not ortalaması yaklaşık ${previousAvg}.`;
                }
                prompt = `Bir öğrencinin "${assignmentToGrade.title}" ödevinden 100 üzerinden ${assignmentToGrade.grade} aldığını varsayarak, hem yapıcı hem de motive edici bir geri bildirim yaz. Ek Bilgi: ${subjectContext}. Bu ek bilgiyi kullanarak geri bildirimini kişiselleştir: Eğer not yüksekse (85+), öğrencinin güçlü yönlerini vurgula. Eğer not ortalamaysa (60-84), hem iyi yaptığı noktaları belirt hem de geliştirmesi gereken alanlara odaklan. Eğer not düşükse (<60), öğrenciyi kırmadan, temel eksikliklere odaklan.`;
                response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.8 } });
                return res.json({ text: response.text });

            case 'getVisualAssignmentHelp':
                const textPart = { text: `Sen yardımsever bir öğretmen asistanısın. Bir öğrenci, "${payload.assignment.title}" başlıklı ödevde zorlanıyor ve aşağıdaki resimle ilgili yardım istiyor. Ödevin açıklaması: "${payload.assignment.description}". Lütfen görseli analiz ederek öğrenciye soruyu çözmesi için adım adım ipuçları ver. Cevabı doğrudan verme, düşünmesini sağla.` };
                const imagePart = { inlineData: { mimeType: payload.image.mimeType, data: payload.image.base64Data } };
                response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [textPart, imagePart] } });
                return res.json({ text: response.text });
            
            case 'suggestStudentGoal':
                prompt = `Öğrenci ${payload.studentName} için bir S.M.A.R.T. (Belirli, Ölçülebilir, Ulaşılabilir, İlgili, Zamanında) hedef öner. Mevcut durumu: Ortalama notu ${payload.averageGrade}, teslimi gecikmiş ödev sayısı ${payload.overdueAssignments}. Önerin tek bir cümlelik bir hedef başlığı olmalı.`;
                response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.9 } });
                return res.json({ text: response.text });

            case 'generateWeeklySummary':
                 prompt = `Öğrenci ${payload.studentName} için bu haftaki performansını özetleyen kısa, motive edici bir mesaj yaz. İstatistikler: ${payload.stats.completed} ödev tamamlandı, not ortalaması ${payload.stats.avgGrade}, ${payload.stats.goals} hedefe ulaşıldı. Başarılarını kutla ve bir sonraki hafta için küçük bir tavsiye ver.`;
                 response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.8 } });
                 return res.json({ text: response.text });

            case 'generateStudentFocusSuggestion':
                const pending = payload.assignments.filter(a => a.status === 'pending').length;
                const overdue = payload.assignments.filter(a => a.status === 'pending' && new Date(a.dueDate) < new Date()).length;
                prompt = `Öğrenci ${payload.studentName}'e güne başlaması için kısa ve motive edici bir tavsiye ver. Şu an ${pending} bekleyen ödevi var ve bunlardan ${overdue} tanesinin tarihi geçmiş. Bu durumu göz önünde bulundurarak onu teşvik et.`;
                response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.9 } });
                return res.json({ text: response.text });
            
            case 'suggestFocusAreas':
                const subjects = {};
                payload.assignments.forEach(a => {
                    const subject = getSubject(a.title);
                    if (!subjects[subject]) subjects[subject] = { grades: [], count: 0 };
                    subjects[subject].count++;
                    if (a.grade !== null) subjects[subject].grades.push(a.grade);
                });
                const subjectStats = Object.entries(subjects).map(([name, data]) => ({ name, avg: data.grades.length > 0 ? data.grades.reduce((s, g) => s + g, 0) / data.grades.length : null })).filter(s => s.avg !== null).sort((a, b) => a.avg - b.avg);
                const weakSubjects = subjectStats.slice(0, 2).map(s => s.name).join(', ');
                prompt = `Öğrenci ${payload.studentName} için bu haftaki odaklanması gereken 1-2 dersi veya konuyu öner. Düşük performans gösterdiği alanlar şunlar olabilir: ${weakSubjects || 'henüz yok'}. Önerini kısa ve eyleme geçirilebilir bir şekilde ifade et.`;
                response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                return res.json({ text: response.text });

            case 'generatePersonalCoachSummary':
                 const studentCount = payload.students.length;
                 const toGradeCount = payload.assignments.filter(a => a.status === 'submitted').length;
                 const overdueCount = payload.assignments.filter(a => a.status === 'pending' && new Date(a.dueDate) < new Date()).length;
                 prompt = `Eğitim koçu ${payload.coachName} için haftalık bir özet oluştur. Toplam ${studentCount} öğrencisi var. Şu an ${toGradeCount} ödevi notlandırmayı bekliyor ve öğrencilerinin toplam ${overdueCount} gecikmiş ödevi var. Bu bilgilere dayanarak ona önceliklerini belirlemesinde yardımcı olacak kısa bir özet ve teşvik edici bir mesaj yaz.`;
                 response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.7 } });
                 return res.json({ text: response.text });

            case 'generateStudentAnalyticsInsight':
                prompt = `Öğrenci ${payload.studentName}'in analitik verilerini yorumla ve ona özel bir içgörü sun. Veriler: Not ortalaması ${payload.data.avgGrade}, ödev tamamlama oranı %${payload.data.completionRate.toFixed(0)}, en başarılı olduğu ders ${payload.data.topSubject}, en çok zorlandığı ders ${payload.data.lowSubject}. Güçlü yönlerini öv ve zayıf yönleri için somut bir tavsiye ver.`;
                response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                return res.json({ text: response.text });

            case 'generateCoachAnalyticsInsight':
                const { studentsData } = payload;
                const statsSummary = `Toplam ${studentsData.length} öğrenci. Genel not ortalaması ${ (studentsData.reduce((sum, s) => sum + s.avgGrade, 0) / studentsData.length).toFixed(1) }.`;
                const highAchievers = studentsData.filter(s => s.avgGrade > 85).map(s => s.name).join(', ');
                const needsAttention = studentsData.filter(s => s.avgGrade < 60 || s.overdue > 2).map(s => s.name).join(', ');
                prompt = `Bir koçun sınıfının genel performansını analiz et ve stratejik bir özet sun. Veriler: ${statsSummary}. Yüksek başarılı öğrenciler: ${highAchievers || 'yok'}. İlgi gerektiren öğrenciler: ${needsAttention || 'yok'}. Koçun nelere odaklanması gerektiği konusunda 2-3 maddelik bir eylem planı öner.`;
                response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.8 } });
                return res.json({ text: response.text });
                
            case 'generateExamPerformanceInsight':
                const subjectAvgsText = payload.performanceData.subjectAvgs.map(s => `${s.subject}: ${s.average}`).join(', ');
                prompt = `Öğrenci ${payload.studentName}'in sınav performansını analiz et. Genel ortalaması ${payload.performanceData.overallAvg}. Ders bazında ortalamaları: ${subjectAvgsText}. Bu verilere göre öğrencinin güçlü ve zayıf yönlerini "### Güçlü Yönler" ve "### Geliştirilmesi Gereken Yönler" başlıkları altında madde madde listele. Son olarak "### Eylem Planı" başlığı altında 2-3 somut öneride bulun. Cevabını markdown formatında başlıklarla ver.`;
                response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.5 } });
                return res.json({ text: response.text });

            case 'generateExamAnalysis':
                const subjectsSummary = payload.exam.subjects.map(s => `${s.name}: ${s.netScore} net`).join(', ');
                prompt = `Öğrenci ${payload.studentName}'in "${payload.exam.title}" sınav sonucunu analiz et. Genel net: ${payload.exam.netScore}. Ders bazında netler: ${subjectsSummary}. Bu sonuçlara göre, öğrencinin performansını özetleyen, güçlü olduğu ve zorlandığı konuları belirten ve gelecek için 1-2 tavsiye veren bir analiz metni oluştur. Cevabını markdown formatında, ### başlıklar kullanarak ver.`;
                response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                return res.json({ text: response.text });

            case 'generateComprehensiveStudentReport':
                prompt = `Öğrenci ${payload.student.name} için kapsamlı bir performans raporu oluştur. Raporu markdown formatında, aşağıdaki başlıkları kullanarak hazırla: ### Genel Durum, ### Akademik Performans (Ödevler ve Sınavlar), ### Hedeflere Ulaşma Durumu, ### Güçlü Yönler, ### Geliştirilmesi Gereken Yönler, ### Öneriler. Analizini aşağıdaki verilere dayandır: Ödevler: ${payload.assignments.length} adet, Sınavlar: ${payload.exams.length} adet, Hedefler: ${payload.goals.length} adet.`;
                response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.6 } });
                return res.json({ text: response.text });


            // Cases returning JSON objects
            case 'generateAssignmentChecklist':
                prompt = `Bir eğitim koçu olarak, "${payload.title}" başlıklı ve "${payload.description}" açıklamalı bir ödev için öğrencilerin takip etmesi gereken 3 ila 5 adımlık bir kontrol listesi oluştur.`;
                response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash', contents: prompt,
                    config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING } }, required: ['text'] } } },
                });
                return res.json(JSON.parse(response.text.trim()));

            case 'suggestGrade':
                 prompt = `Bir öğrencinin "${payload.assignment.title}" başlıklı ödevine yaptığı teslimatı analiz et ve 100 üzerinden bir not öner. Ayrıca notu neden önerdiğini 'rationale' alanında kısaca açıkla. Teslimat içeriği: "${payload.assignment.submissionType === 'text' ? payload.assignment.textSubmission : 'Dosya yüklendi (içeriği analiz edilemiyor, başlığa ve açıklamaya göre tahmin yürüt)'}". Ödev açıklaması: "${payload.assignment.description}".`;
                 response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash', contents: prompt,
                    config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { suggestedGrade: { type: Type.INTEGER }, rationale: { type: Type.STRING } }, required: ['suggestedGrade', 'rationale'] } }
                });
                return res.json(JSON.parse(response.text.trim()));

            case 'generateAiTemplate':
                prompt = `Bir ödev şablonu oluştur. Konu: "${payload.topic}", seviye: "${payload.level}", ve süresi: "${payload.duration}". Şablon için uygun bir 'title', 'description' ve 3-5 adımlık bir 'checklist' oluştur. Checklist maddeleri 'text' alanına sahip objelerden oluşmalı.`;
                response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash', contents: prompt,
                    config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, checklist: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING } }, required: ['text'] } } }, required: ['title', 'description', 'checklist'] } }
                });
                return res.json(JSON.parse(response.text.trim()));

            case 'generateStudyPlan':
                const { params } = payload;
                prompt = `Bir öğrenci için haftalık ders çalışma planı oluştur. Bilgiler: Hedef sınavlar: ${params.targetExams.join(', ')}. Odak dersler: ${params.focusSubjects.join(', ')}. Haftalık müsait zamanlar: ${JSON.stringify(params.weeklyAvailability)}. Bir ders süresi ${params.sessionDuration} dakika, mola süresi ${params.breakDuration} dakika. Bu bilgilere göre, önümüzdeki 7 gün için bir plan oluştur. Her plan öğesi için 'title', 'date' (YYYY-MM-DD formatında, bugünden başlayarak), 'startTime', 'endTime', ve 'description' alanlarını içeren bir JSON dizisi döndür.`;
                response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash', contents: prompt,
                    config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, date: { type: Type.STRING }, startTime: { type: Type.STRING }, endTime: { type: Type.STRING }, description: { type: Type.STRING } }, required: ['title', 'date', 'startTime', 'endTime'] } } }
                });
                return res.json(JSON.parse(response.text.trim()));
            
            case 'generateGoalWithMilestones':
                 prompt = `"${payload.goalTitle}" hedefi için motive edici bir 'description' ve bu hedefe ulaşmayı sağlayacak 3-4 adımlık 'milestones' (kilometre taşları) oluştur. Kilometre taşları 'text' alanına sahip objelerden oluşmalı.`;
                 response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash', contents: prompt,
                    config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { description: { type: Type.STRING }, milestones: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING } }, required: ['text'] } } }, required: ['description', 'milestones'] } }
                });
                return res.json(JSON.parse(response.text.trim()));

            case 'generateExamDetails':
                 prompt = `${payload.studentGrade}. sınıf öğrencisi için, "${payload.category}" dersinin "${payload.topic}" konusuyla ilgili bir konu tarama testi için AI tarafından oluşturulmuş bir başlık ('title'), kısa bir açıklama ('description'), toplam soru sayısı ('totalQuestions', 10 ile 25 arası) ve 1 hafta sonrası için teslim tarihi ('dueDate', YYYY-MM-DD formatında) oluştur.`;
                 response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash', contents: prompt,
                    config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, totalQuestions: { type: Type.INTEGER }, dueDate: { type: Type.STRING } }, required: ['title', 'description', 'totalQuestions', 'dueDate'] } }
                });
                return res.json(JSON.parse(response.text.trim()));
            
            case 'generateQuestion':
                prompt = `"${payload.category}" dersi ve "${payload.topic}" konusu için, "${payload.difficulty}" zorluk seviyesinde, 4 seçenekli bir çoktan seçmeli soru oluştur. Cevabı JSON formatında, 'questionText' (soru metni), 'options' (4 elemanlı string dizisi), 'correctOptionIndex' (0-3 arası sayı) ve 'explanation' (doğru cevabın açıklaması) alanlarını içerecek şekilde ver.`;
                response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash', contents: prompt,
                    config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { questionText: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctOptionIndex: { type: Type.INTEGER }, explanation: { type: Type.STRING } }, required: ['questionText', 'options', 'correctOptionIndex', 'explanation'] } }
                });
                return res.json(JSON.parse(response.text.trim()));

            default:
                return res.status(400).json({ message: 'Invalid task' });
        }
    } catch (error) {
        console.error('Gemini API error:', error);
        res.status(500).json({ message: error.message });
    }
});

app.use('/backend', router);

export default app;
