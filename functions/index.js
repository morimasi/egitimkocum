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
            profilePicture TEXT,
            isOnline BOOLEAN DEFAULT false,
            notes TEXT,
            assignedCoachId VARCHAR(255),
            gradeLevel VARCHAR(50),
            academicTrack VARCHAR(50),
            childIds TEXT,
            parentIds TEXT,
            xp INT DEFAULT 0,
            streak INT DEFAULT 0,
            lastSubmissionDate TIMESTAMPTZ,
            earnedBadgeIds TEXT
        );
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS assignments (
            id VARCHAR(255) PRIMARY KEY,
            title VARCHAR(255),
            description TEXT,
            dueDate TIMESTAMPTZ,
            status VARCHAR(50),
            grade INT,
            feedback TEXT,
            fileUrl TEXT,
            fileName VARCHAR(255),
            studentId VARCHAR(255),
            coachId VARCHAR(255),
            submittedAt TIMESTAMPTZ,
            gradedAt TIMESTAMPTZ,
            coachAttachments TEXT,
            checklist TEXT,
            audioFeedbackUrl TEXT,
            videoDescriptionUrl TEXT,
            videoFeedbackUrl TEXT,
            studentVideoSubmissionUrl TEXT,
            feedbackReaction VARCHAR(10),
            submissionType VARCHAR(50),
            textSubmission TEXT,
            studentAudioFeedbackResponseUrl TEXT,
            studentVideoFeedbackResponseUrl TEXT,
            studentTextFeedbackResponse TEXT,
            startTime TIMESTAMPTZ,
            endTime TIMESTAMPTZ
        );
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS messages (
            id VARCHAR(255) PRIMARY KEY,
            senderId VARCHAR(255),
            conversationId VARCHAR(255),
            text TEXT,
            timestamp TIMESTAMPTZ,
            type VARCHAR(50),
            fileUrl TEXT,
            fileName VARCHAR(255),
            fileType VARCHAR(100),
            imageUrl TEXT,
            audioUrl TEXT,
            videoUrl TEXT,
            readBy TEXT,
            reactions TEXT,
            replyTo VARCHAR(255),
            poll TEXT,
            priority VARCHAR(50)
        );
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS conversations (
            id VARCHAR(255) PRIMARY KEY,
            participantIds TEXT,
            isGroup BOOLEAN,
            groupName VARCHAR(255),
            groupImage TEXT,
            adminId VARCHAR(255),
            isArchived BOOLEAN DEFAULT false
        );
    `;

    await sql`CREATE TABLE IF NOT EXISTS notifications (id VARCHAR(255) PRIMARY KEY, userId VARCHAR(255), message TEXT, timestamp TIMESTAMPTZ, isRead BOOLEAN, priority VARCHAR(50), link TEXT)`;
    await sql`CREATE TABLE IF NOT EXISTS templates (id VARCHAR(255) PRIMARY KEY, title VARCHAR(255), description TEXT, checklist TEXT, isFavorite BOOLEAN)`;
    await sql`CREATE TABLE IF NOT EXISTS resources (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255), type VARCHAR(50), url TEXT, isPublic BOOLEAN, uploaderId VARCHAR(255), assignedTo TEXT, category VARCHAR(50))`;
    await sql`CREATE TABLE IF NOT EXISTS goals (id VARCHAR(255) PRIMARY KEY, studentId VARCHAR(255), title VARCHAR(255), description TEXT, isCompleted BOOLEAN, milestones TEXT)`;
    await sql`CREATE TABLE IF NOT EXISTS calendarEvents (id VARCHAR(255) PRIMARY KEY, userId VARCHAR(255), title VARCHAR(255), date TIMESTAMPTZ, type VARCHAR(50), color VARCHAR(50), startTime VARCHAR(50), endTime VARCHAR(50))`;
    await sql`CREATE TABLE IF NOT EXISTS exams (id VARCHAR(255) PRIMARY KEY, studentId VARCHAR(255), title VARCHAR(255), date TIMESTAMPTZ, totalQuestions INT, correct INT, incorrect INT, empty INT, netScore NUMERIC, subjects TEXT, coachNotes TEXT, studentReflections TEXT, category VARCHAR(255), topic VARCHAR(255), type VARCHAR(50))`;
    await sql`CREATE TABLE IF NOT EXISTS questions (id VARCHAR(255) PRIMARY KEY, creatorId VARCHAR(255), category VARCHAR(50), topic VARCHAR(255), questionText TEXT, options TEXT, correctOptionIndex INT, difficulty VARCHAR(50), explanation TEXT, imageUrl TEXT, videoUrl TEXT, audioUrl TEXT, documentUrl TEXT, documentName VARCHAR(255))`;
};


// Helper to run migrations/seeding
app.get('/api/seed', async (req, res) => {
    try {
        await ensureTablesExist();

        // Simple check to prevent re-seeding
        const { rows: users } = await sql`SELECT * FROM users;`;
        if (users.length === 0) {
            // Seed data here (simplified)
            // In a real app, you would import and process your seedData file
            await sql`
                INSERT INTO users (id, name, email, role, profilePicture, isOnline) VALUES
                ('user_admin', 'Mahmut Hoca', 'admin@egitim.com', 'superadmin', 'https://i.pravatar.cc/150?u=admin@egitim.com', true),
                ('user_coach_1', 'Ahmet Yılmaz', 'ahmet.yilmaz@egitim.com', 'coach', 'https://i.pravatar.cc/150?u=ahmet.yilmaz@egitim.com', true),
                ('user_student_1', 'Leyla Kaya', 'leyla.kaya@mail.com', 'student', 'https://i.pravatar.cc/150?u=leyla.kaya@mail.com', true);
            `;
             await sql`
                INSERT INTO assignments (id, title, description, dueDate, status, studentId, coachId, submissionType) VALUES
                ('assign_1', 'Matematik: Türev Alma Kuralları Testi', 'Türev alma kurallarını içeren 20 soruluk testi çözün.', ${new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()}, 'pending', 'user_student_1', 'user_coach_1', 'file');
            `;
             res.status(200).send('Database seeded successfully.');
        } else {
             res.status(200).send('Database already contains data. No seeding performed.');
        }

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
        const { rows: calendarEvents } = await sql`SELECT * FROM calendarEvents`;
        const { rows: exams } = await sql`SELECT * FROM exams`;
        const { rows: questions } = await sql`SELECT * FROM questions`;

        // Process arrays from text
        users.forEach(u => {
            u.childIds = u.childids ? u.childids.split(',') : [];
            u.parentIds = u.parentids ? u.parentids.split(',') : [];
            u.earnedBadgeIds = u.earnedbadgeids ? u.earnedbadgeids.split(',') : [];
        });
         conversations.forEach(c => {
            c.participantIds = c.participantids ? c.participantids.split(',') : [];
        });
        assignments.forEach(a => {
            try { a.checklist = a.checklist ? JSON.parse(a.checklist) : []; } catch (e) { a.checklist = []; }
            try { a.coachAttachments = a.coachattachments ? JSON.parse(a.coachattachments) : []; } catch (e) { a.coachAttachments = []; }
        });
        messages.forEach(m => {
            try { m.readBy = m.readby ? JSON.parse(m.readby) : []; } catch (e) { m.readBy = []; }
            try { m.reactions = m.reactions ? JSON.parse(m.reactions) : undefined; } catch (e) { m.reactions = undefined; }
            try { m.poll = m.poll ? JSON.parse(m.poll) : undefined; } catch (e) { m.poll = undefined; }
        });
        goals.forEach(g => {
            try { g.milestones = g.milestones ? JSON.parse(g.milestones) : []; } catch (e) { g.milestones = []; }
        });
         exams.forEach(ex => {
            try { ex.subjects = ex.subjects ? JSON.parse(ex.subjects) : []; } catch (e) { ex.subjects = []; }
        });
         questions.forEach(q => {
            try { q.options = q.options ? JSON.parse(q.options) : []; } catch (e) { q.options = []; }
        });
        
        res.status(200).json({ users, assignments, messages, conversations, notifications, templates, resources, goals, calendarEvents, exams, questions });
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
            user.childIds = user.childids ? user.childids.split(',') : [];
            user.parentIds = user.parentids ? user.parentids.split(',') : [];
            user.earnedBadgeIds = user.earnedbadgeids ? user.earnedbadgeids.split(',') : [];
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
            const readBy = message.readby ? JSON.parse(message.readby) : [];
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
        const columns = Object.keys(data).map(k => `"${k.toLowerCase()}"`).join(', ');
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
        const setClause = Object.keys(data).map((key, i) => `"${key.toLowerCase()}" = $${i + 1}`).join(', ');
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