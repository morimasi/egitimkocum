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
            if (u.childids) u.childIds = u.childids.split(','); else u.childIds = [];
            if (u.parentids) u.parentIds = u.parentids.split(','); else u.parentIds = [];
            if (u.earnedbadgeids) u.earnedBadgeIds = u.earnedbadgeids.split(','); else u.earnedBadgeIds = [];
        });
         conversations.forEach(c => {
            if (c.participantids) c.participantIds = c.participantids.split(','); else c.participantIds = [];
        });
        assignments.forEach(a => {
            try {
                if (a.checklist) a.checklist = JSON.parse(a.checklist); else a.checklist = [];
            } catch (e) {
                a.checklist = [];
            }
        });
        messages.forEach(m => {
            try {
                if (m.readby) m.readBy = JSON.parse(m.readby); else m.readBy = [];
                if (m.reactions) m.reactions = JSON.parse(m.reactions); else m.reactions = undefined;
                if (m.poll) m.poll = JSON.parse(m.poll); else m.poll = undefined;
            } catch (e) {
                console.error(`Failed to parse message fields for id ${m.id}`, e);
                m.readBy = [];
                m.reactions = undefined;
                m.poll = undefined;
            }
        });
        goals.forEach(g => {
            try {
                if (g.milestones) g.milestones = JSON.parse(g.milestones); else g.milestones = [];
            } catch (e) { g.milestones = []; }
        });
        
        // Add more processing as needed for other tables

        res.status(200).json({
            users,
            assignments,
            messages,
            conversations,
            notifications,
            templates,
            resources,
            goals,
            calendarEvents,
            exams,
            questions
        });
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
            // Process arrays from text
            if (user.childids) user.childIds = user.childids.split(','); else user.childIds = [];
            if (user.parentids) user.parentIds = user.parentids.split(','); else user.parentIds = [];
            if (user.earnedbadgeids) user.earnedBadgeIds = user.earnedbadgeids.split(','); else user.earnedBadgeIds = [];
            res.status(200).json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Generic CREATE endpoint
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

// Generic UPDATE endpoint
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

// Generic BATCH DELETE endpoint
app.delete('/api/:collection', async (req, res) => {
    const { collection } = req.params;
    const { ids } = req.body; // Expect an array of IDs

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'Invalid request body, expected an array of IDs.' });
    }

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