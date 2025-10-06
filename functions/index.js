const express = require('express');
const { sql } = require('@vercel/postgres');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const ensureTablesExist = async () => {
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


// Helper to run migrations/seeding
app.get('/api/seed', async (req, res) => {
    try {
        await ensureTablesExist();

        let messages = [];

        const { rows: users } = await sql`SELECT * FROM users;`;
        if (users.length === 0) {
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
            messages.push('Users seeded.');
        } else {
            messages.push('Users table already has data.');
        }

        const { rows: assignments } = await sql`SELECT * FROM assignments;`;
        if (assignments.length === 0) {
             await sql`
                INSERT INTO assignments (id, title, description, "dueDate", status, "studentId", "coachId", "submissionType", grade, feedback, "submittedAt", checklist) VALUES
                ('assign_1', 'Matematik: Türev Alma Kuralları Testi', 'Türev alma kurallarını içeren 20 soruluk testi çözün ve sonuçlarınızı yükleyin. Özellikle çarpım ve bölüm türevine odaklanın.', ${new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()}, 'pending', 'user_student_1', 'user_coach_1', 'file', null, '', null, '[{"text": "Konu tekrarı yapıldı."}, {"text": "20 soru çözüldü."}, {"text": "Yanlışlar kontrol edildi."}]'),
                ('assign_2', 'Türkçe: Paragraf Soru Çözümü', 'Verilen kaynaktan 50 paragraf sorusu çözülecek.', ${new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()}, 'graded', 'user_student_1', 'user_coach_1', 'completed', 95, 'Harika bir iş çıkardın Leyla! Paragraf anlama hızın ve doğruluğun gözle görülür şekilde artmış. Bu tempoyu koru!', ${new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()}, '[]'),
                ('assign_3', 'Fizik: Vektörler Konu Özeti', 'Fizik dersi vektörler konusunun özetini çıkarıp metin olarak gönderin. Bileşke vektör bulma yöntemlerine özellikle değinin.', ${new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()}, 'pending', 'user_student_2', 'user_coach_1', 'text', null, '', null, '[]'),
                ('assign_4', 'Kimya: Mol Kavramı Soru Bankası', 'Soru bankasındaki mol kavramı ile ilgili ilk 3 testi bitir.', ${new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()}, 'submitted', 'user_student_2', 'user_coach_1', 'completed', null, '', ${new Date().toISOString()}, '[]'),
                ('assign_5', 'İngilizce: Kelime Çalışması', 'Verilen 20 kelimeyi ezberle ve her biriyle birer cümle kur.', ${new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()}, 'submitted', 'user_student_4', 'user_coach_2', 'text', null, '', ${new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()}, '[]');
            `;
            messages.push('Assignments seeded.');
        }

        const { rows: conversations } = await sql`SELECT * FROM conversations;`;
        if (conversations.length === 0) {
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
            messages.push('Conversations seeded.');
        } else {
             messages.push('Conversations table already has data.');
        }

        const { rows: dbMessages } = await sql`SELECT * FROM messages;`;
        if (dbMessages.length === 0) {
            await sql`
                INSERT INTO messages (id, "senderId", "conversationId", text, timestamp, type, "readBy") VALUES
                ('msg-1', 'user_coach_1', 'conv-1', 'Merhaba Leyla, haftalık programını gözden geçirdim. Matematik netlerin yükselişte, tebrikler!', ${new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()}, 'text', '["user_coach_1"]'),
                ('msg-2', 'user_student_1', 'conv-1', 'Teşekkür ederim öğretmenim! Türev testinde biraz zorlandım ama halledeceğim.', ${new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()}, 'text', '["user_student_1"]'),
                ('msg-3', 'user_admin', 'conv-announcements', 'Arkadaşlar, yarınki deneme sınavı için son tekrar yapmayı unutmayın! Başarılar dilerim.', ${new Date().toISOString()}, 'announcement', '["user_admin"]');
            `;
            messages.push('Messages seeded.');
        } else {
            messages.push('Messages table already has data.');
        }

        const { rows: badges } = await sql`SELECT * FROM badges;`;
        if (badges.length === 0) {
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
            messages.push('Badges seeded.');
        } else {
            messages.push('Badges table already has data.');
        }
        
        res.status(200).send(messages.join(' '));

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});


app.get('/api/data', async (req, res) => {
    try {
        await ensureTablesExist();

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
        console.error("Error fetching data:", error);
        res.status(500).json({ error: error.message });
    }
});

// LOGIN
app.post('/api/login', async (req, res) => {
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
app.post('/api/conversations/:id/mark-as-read', async (req, res) => {
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

app.post('/api/notifications/mark-as-read', async (req, res) => {
    const { userId } = req.body;
    try {
        await sql`UPDATE notifications SET "isRead" = true WHERE "userId" = ${userId} AND "isRead" = false`;
        res.status(200).json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/calendarEvents/batch', async (req, res) => {
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

// --- GENERIC ENDPOINTS ---
app.post('/api/:collection', async (req, res) => {
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

app.put('/api/:collection/:id', async (req, res) => {
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

app.delete('/api/:collection', async (req, res) => {
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


module.exports = app;