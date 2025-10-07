
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { sql } from '@vercel/postgres';
import { GoogleGenAI, Type } from "@google/genai";
import { seedData } from '../services/seedData.js';

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- DATABASE SCHEMA AND INIT ---

const createTables = async () => {
    await sql`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role VARCHAR(50) NOT NULL,
            profilePicture TEXT,
            isOnline BOOLEAN DEFAULT false,
            notes TEXT,
            assignedCoachId TEXT,
            gradeLevel VARCHAR(50),
            academicTrack VARCHAR(50),
            childIds TEXT[],
            parentIds TEXT[],
            xp INT DEFAULT 0,
            streak INT DEFAULT 0,
            lastSubmissionDate TIMESTAMP,
            earnedBadgeIds TEXT[]
        );`;
    await sql`
        CREATE TABLE IF NOT EXISTS assignments (
            id TEXT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            dueDate TIMESTAMP NOT NULL,
            status VARCHAR(50) NOT NULL,
            grade INT,
            feedback TEXT,
            fileUrl TEXT,
            fileName VARCHAR(255),
            studentId TEXT NOT NULL,
            coachId TEXT NOT NULL,
            submittedAt TIMESTAMP,
            gradedAt TIMESTAMP,
            coachAttachments JSONB,
            checklist JSONB,
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
            startTime TIMESTAMP,
            endTime TIMESTAMP
        );`;
    await sql`
        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            participantIds TEXT[] NOT NULL,
            isGroup BOOLEAN NOT NULL,
            groupName VARCHAR(255),
            groupImage TEXT,
            adminId TEXT,
            isArchived BOOLEAN DEFAULT false
        );`;
    await sql`
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            senderId TEXT NOT NULL,
            conversationId TEXT NOT NULL,
            text TEXT,
            timestamp TIMESTAMP NOT NULL,
            type VARCHAR(50) NOT NULL,
            fileUrl TEXT,
            fileName VARCHAR(255),
            fileType VARCHAR(100),
            imageUrl TEXT,
            audioUrl TEXT,
            videoUrl TEXT,
            readBy TEXT[] NOT NULL,
            reactions JSONB,
            replyTo TEXT,
            poll JSONB,
            priority VARCHAR(50)
        );`;
    await sql`
        CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            userId TEXT NOT NULL,
            message TEXT NOT NULL,
            timestamp TIMESTAMP NOT NULL,
            isRead BOOLEAN DEFAULT false,
            priority VARCHAR(50) NOT NULL,
            link JSONB
        );`;
    await sql`
        CREATE TABLE IF NOT EXISTS templates (
            id TEXT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            checklist JSONB,
            isFavorite BOOLEAN DEFAULT false
        );`;
    await sql`
        CREATE TABLE IF NOT EXISTS resources (
            id TEXT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            type VARCHAR(50) NOT NULL,
            url TEXT NOT NULL,
            isPublic BOOLEAN NOT NULL,
            uploaderId TEXT NOT NULL,
            assignedTo TEXT[],
            category VARCHAR(50)
        );`;
    await sql`
        CREATE TABLE IF NOT EXISTS goals (
            id TEXT PRIMARY KEY,
            studentId TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            isCompleted BOOLEAN DEFAULT false,
            milestones JSONB
        );`;
    await sql`
        CREATE TABLE IF NOT EXISTS calendarEvents (
            id TEXT PRIMARY KEY,
            userId TEXT NOT NULL,
            title VARCHAR(255) NOT NULL,
            date DATE NOT NULL,
            type VARCHAR(50) NOT NULL,
            color VARCHAR(50),
            startTime TIME,
            endTime TIME
        );`;
    await sql`
        CREATE TABLE IF NOT EXISTS exams (
            id TEXT PRIMARY KEY,
            studentId TEXT NOT NULL,
            title VARCHAR(255) NOT NULL,
            date DATE NOT NULL,
            totalQuestions INT,
            correct INT,
            incorrect INT,
            empty INT,
            netScore REAL,
            subjects JSONB,
            coachNotes TEXT,
            studentReflections TEXT,
            category VARCHAR(100),
            topic VARCHAR(100),
            type VARCHAR(50)
        );`;
    await sql`
        CREATE TABLE IF NOT EXISTS questions (
            id TEXT PRIMARY KEY,
            creatorId TEXT NOT NULL,
            category VARCHAR(50) NOT NULL,
            topic VARCHAR(255) NOT NULL,
            questionText TEXT NOT NULL,
            options TEXT[] NOT NULL,
            correctOptionIndex INT NOT NULL,
            difficulty VARCHAR(50) NOT NULL,
            explanation TEXT,
            imageUrl TEXT,
            videoUrl TEXT,
            audioUrl TEXT,
            documentUrl TEXT,
            documentName VARCHAR(255)
        );`;
    await sql`
        CREATE TABLE IF NOT EXISTS badges (
            id TEXT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT NOT NULL
        );
    `;
};


app.post('/api/init', async (req, res) => {
    try {
        await createTables();
        
        const { rows } = await sql`SELECT COUNT(*) FROM users;`;
        if (rows[0].count > 0) {
            return res.status(200).json({ message: 'Database already initialized.' });
        }
        
        const badges = [
            { id: 'first-assignment', name: "İlk Adım", description: "İlk ödevini başarıyla tamamladın!" },
            { id: 'high-achiever', name: "Yüksek Başarı", description: "Not ortalaman 90'ın üzerinde!" },
            { id: 'perfect-score', name: "Mükemmel Skor", description: "Bir ödevden 100 tam puan aldın!" },
            { id: 'goal-getter', name: "Hedef Avcısı", description: "Haftalık hedeflerinin hepsine ulaştın!" },
            { id: 'streak-starter', name: "Seri Başladı", description: "3 gün üst üste ödev teslim ettin." },
            { id: 'streak-master', name: "Seri Ustası", description: "7 gün üst üste ödev teslim ettin." },
            { id: 'on-time-submissions', name: "Dakik Oyuncu", description: "5 ödevi zamanında teslim ettin." },
        ];

        for (const badge of badges) {
            await sql`INSERT INTO badges (id, name, description) VALUES (${badge.id}, ${badge.name}, ${badge.description}) ON CONFLICT (id) DO NOTHING;`;
        }

        await sql`
            INSERT INTO conversations (id, participantIds, isGroup, groupName, groupImage, adminId) 
            VALUES ('conv-announcements', '{}', true, '📢 Duyurular', 'https://i.pravatar.cc/150?u=announcements', null)
            ON CONFLICT (id) DO NOTHING;
        `;


        res.status(200).json({ message: 'Database initialized successfully.' });
    } catch (error) {
        console.error('Database initialization error:', error);
        res.status(500).json({ error: 'Failed to initialize database.', details: error.message });
    }
});


app.post('/api/register', async (req, res) => {
    const { id, name, email, password, role, profilePicture } = req.body;
    try {
        const { rows: existingUsers } = await sql`SELECT id FROM users WHERE email = ${email}`;
        if (existingUsers.length > 0) {
            return res.status(409).json({ error: 'This email is already registered.' });
        }
        
        const { rows: allUsers } = await sql`SELECT COUNT(*) FROM users`;
        const finalRole = allUsers[0].count === '0' ? 'superadmin' : role;

        await sql`
            INSERT INTO users (id, name, email, password, role, profilePicture, childIds, parentIds, earnedBadgeIds)
            VALUES (${id}, ${name}, ${email}, ${password}, ${finalRole}, ${profilePicture}, '{}', '{}', '{}');
        `;
        
        await sql`
            UPDATE conversations
            SET participantIds = array_append(participantIds, ${id})
            WHERE id = 'conv-announcements';
        `;
        
        const { rows: [newUser] } = await sql`SELECT * FROM users WHERE id = ${id}`;
        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ error: 'Registration failed.', details: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { rows: [user] } = await sql`SELECT * FROM users WHERE email = ${email}`;
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid password.' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: 'Login failed.', details: error.message });
    }
});

app.get('/api/data', async (req, res) => {
    try {
        const [
            users, assignments, messages, conversations, notifications, 
            templates, resources, goals, badges, calendarEvents, exams, questions
        ] = await Promise.all([
            sql`SELECT * FROM users`,
            sql`SELECT * FROM assignments`,
            sql`SELECT * FROM messages`,
            sql`SELECT * FROM conversations`,
            sql`SELECT * FROM notifications`,
            sql`SELECT * FROM templates`,
            sql`SELECT * FROM resources`,
            sql`SELECT * FROM goals`,
            sql`SELECT * FROM badges`,
            sql`SELECT * FROM calendarEvents`,
            sql`SELECT * FROM exams`,
            sql`SELECT * FROM questions`,
        ]);
        
        res.json({
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
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch data.", details: error.message });
    }
});

const createCrudEndpoints = (tableName, idField = 'id') => {
    app.post(`/api/${tableName}`, async (req, res) => {
        try {
            const columns = Object.keys(req.body);
            const values = Object.values(req.body).map(v => (typeof v === 'object' && v !== null) ? JSON.stringify(v) : v);
            const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
            const query = `INSERT INTO ${tableName} (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders}) RETURNING *`;
            const { rows: [newItem] } = await sql.query(query, values);
            res.status(201).json(newItem);
        } catch (error) {
            res.status(500).json({ error: `Failed to create ${tableName}.`, details: error.message });
        }
    });

    app.put(`/api/${tableName}/:id`, async (req, res) => {
        try {
            const { id } = req.params;
            const fields = Object.keys(req.body).filter(key => key !== idField);
            const setClause = fields.map((field, i) => `"${field}" = $${i + 2}`).join(', ');
            const values = [id, ...fields.map(field => {
                const value = req.body[field];
                return (typeof value === 'object' && value !== null) ? JSON.stringify(value) : value;
            })];
            const query = `UPDATE ${tableName} SET ${setClause} WHERE ${idField} = $1 RETURNING *`;
            const { rows: [updatedItem] } = await sql.query(query, values);
            res.status(200).json(updatedItem);
        } catch (error) {
            res.status(500).json({ error: `Failed to update ${tableName}.`, details: error.message });
        }
    });

    app.delete(`/api/${tableName}`, async (req, res) => {
        try {
            const { ids } = req.body; 
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                 return res.status(400).json({ error: "IDs array is required." });
            }
            await sql.query(`DELETE FROM ${tableName} WHERE id = ANY($1::text[])`, [ids]);
            res.status(204).send();
        } catch (error) {
             res.status(500).json({ error: `Failed to delete from ${tableName}.`, details: error.message });
        }
    });
};

['users', 'assignments', 'messages', 'conversations', 'notifications', 'templates', 'resources', 'goals', 'badges', 'calendarEvents', 'exams', 'questions'].forEach(table => createCrudEndpoints(table));


app.post('/api/conversations/findOrCreate', async (req, res) => {
    const { userId1, userId2 } = req.body;
    try {
        const { rows: [existing] } = await sql`
            SELECT * FROM conversations 
            WHERE isGroup = false 
            AND participantIds @> ARRAY[${userId1}, ${userId2}] 
            AND array_length(participantIds, 1) = 2;
        `;
        if (existing) {
            return res.json(existing);
        }
        const newId = `conv_${Date.now()}${Math.random()}`;
        const { rows: [newConversation] } = await sql`
            INSERT INTO conversations (id, participantIds, isGroup) 
            VALUES (${newId}, ARRAY[${userId1}, ${userId2}], false) RETURNING *;
        `;
        res.status(201).json(newConversation);
    } catch (error) {
        res.status(500).json({ error: 'Failed to find or create conversation', details: error.message });
    }
});

app.post('/api/seed', async (req, res) => {
    try {
        console.log("Seeding process started...");

        // Drop all tables
        await sql`DROP TABLE IF EXISTS users, assignments, conversations, messages, notifications, templates, resources, goals, badges, calendarEvents, exams, questions CASCADE;`;
        console.log("Old tables dropped.");

        // Re-create tables
        await createTables();
        console.log("Tables re-created.");

        // Insert Data from seedData.ts
        const { users, assignments, exams, goals, resources, templates, questions, conversations, messages } = seedData;

        // Badges and Announcements Conversation (base data)
        const badges = [
            { id: 'first-assignment', name: "İlk Adım", description: "İlk ödevini başarıyla tamamladın!" },
            { id: 'high-achiever', name: "Yüksek Başarı", description: "Not ortalaman 90'ın üzerinde!" },
            { id: 'perfect-score', name: "Mükemmel Skor", description: "Bir ödevden 100 tam puan aldın!" },
            { id: 'goal-getter', name: "Hedef Avcısı", description: "Haftalık hedeflerinin hepsine ulaştın!" },
            { id: 'streak-starter', name: "Seri Başladı", description: "3 gün üst üste ödev teslim ettin." },
            { id: 'streak-master', name: "Seri Ustası", description: "7 gün üst üste ödev teslim ettin." },
            { id: 'on-time-submissions', name: "Dakik Oyuncu", description: "5 ödevi zamanında teslim ettin." },
        ];
        for (const badge of badges) {
            await sql`INSERT INTO badges (id, name, description) VALUES (${badge.id}, ${badge.name}, ${badge.description}) ON CONFLICT (id) DO NOTHING;`;
        }
        console.log("Badges seeded.");

        // Users
        for (const user of users) {
            await sql`INSERT INTO users (id, name, email, password, role, profilePicture, assignedCoachId, gradeLevel, academicTrack, childIds, parentIds, xp, streak, earnedBadgeIds) VALUES (${user.id}, ${user.name}, ${user.email}, ${user.password}, ${user.role}, ${user.profilePicture}, ${user.assignedCoachId}, ${user.gradeLevel}, ${user.academicTrack}, ${user.childIds}, ${user.parentIds}, ${user.xp}, ${user.streak}, ${user.earnedBadgeIds});`;
        }
        console.log(`${users.length} users seeded.`);
        
        // Conversations
        for (const conv of conversations) {
             await sql`INSERT INTO conversations (id, participantIds, isGroup, groupName, groupImage, adminId) VALUES (${conv.id}, ${conv.participantIds}, ${conv.isGroup}, ${conv.groupName}, ${conv.groupImage}, ${conv.adminId});`;
        }
        console.log(`${conversations.length} conversations seeded.`);

        // Assignments
        for (const assignment of assignments) {
            await sql`INSERT INTO assignments (id, title, description, dueDate, status, grade, feedback, fileUrl, studentId, coachId, submittedAt, checklist, submissionType) VALUES (${assignment.id}, ${assignment.title}, ${assignment.description}, ${assignment.dueDate}, ${assignment.status}, ${assignment.grade}, ${assignment.feedback}, ${assignment.fileUrl}, ${assignment.studentId}, ${assignment.coachId}, ${assignment.submittedAt}, ${JSON.stringify(assignment.checklist)}, ${assignment.submissionType});`;
        }
        console.log(`${assignments.length} assignments seeded.`);

        // Exams
        for (const exam of exams) {
            await sql`INSERT INTO exams (id, studentId, title, date, totalQuestions, correct, incorrect, empty, netScore, subjects, category, topic, type) VALUES (${exam.id}, ${exam.studentId}, ${exam.title}, ${exam.date}, ${exam.totalQuestions}, ${exam.correct}, ${exam.incorrect}, ${exam.empty}, ${exam.netScore}, ${JSON.stringify(exam.subjects)}, ${exam.category}, ${exam.topic}, ${exam.type});`;
        }
        console.log(`${exams.length} exams seeded.`);

        // Goals
        for (const goal of goals) {
            await sql`INSERT INTO goals (id, studentId, title, description, isCompleted, milestones) VALUES (${goal.id}, ${goal.studentId}, ${goal.title}, ${goal.description}, ${goal.isCompleted}, ${JSON.stringify(goal.milestones)});`;
        }
        console.log(`${goals.length} goals seeded.`);
        
        // Resources
        for (const resource of resources) {
             await sql`INSERT INTO resources (id, name, type, url, isPublic, uploaderId, assignedTo, category) VALUES (${resource.id}, ${resource.name}, ${resource.type}, ${resource.url}, ${resource.isPublic}, ${resource.uploaderId}, ${resource.assignedTo}, ${resource.category});`;
        }
        console.log(`${resources.length} resources seeded.`);

        // Templates
        for (const template of templates) {
             await sql`INSERT INTO templates (id, title, description, checklist) VALUES (${template.id}, ${template.title}, ${template.description}, ${JSON.stringify(template.checklist)});`;
        }
        console.log(`${templates.length} templates seeded.`);

        // Questions
        for (const q of questions) {
             await sql`INSERT INTO questions (id, creatorId, category, topic, questionText, options, correctOptionIndex, difficulty, explanation, imageUrl) VALUES (${q.id}, ${q.creatorId}, ${q.category}, ${q.topic}, ${q.questionText}, ${q.options}, ${q.correctOptionIndex}, ${q.difficulty}, ${q.explanation}, ${q.imageUrl});`;
        }
        console.log(`${questions.length} questions seeded.`);
        
        // Messages
        for (const msg of messages) {
             await sql`INSERT INTO messages (id, senderId, conversationId, text, timestamp, type, readBy) VALUES (${msg.id}, ${msg.senderId}, ${msg.conversationId}, ${msg.text}, ${msg.timestamp}, ${msg.type}, ${msg.readBy});`;
        }
        console.log(`${messages.length} messages seeded.`);


        res.status(200).json({ message: 'Database reset and seeded successfully.' });

    } catch (error) {
        console.error('Database seed error:', error);
        res.status(500).json({ error: 'Failed to seed database.', details: error.message });
    }
});


// --- GEMINI PROXY ---
const schemas = {
    checklist: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING } }, required: ['text'] } },
    gradeSuggestion: { type: Type.OBJECT, properties: { suggestedGrade: { type: Type.INTEGER }, rationale: { type: Type.STRING } }, required: ['suggestedGrade', 'rationale'] },
    assignmentTemplate: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, checklist: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING } }, required: ['text'] } } }, required: ['title', 'description', 'checklist'] },
    studyPlan: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, date: { type: Type.STRING }, startTime: { type: Type.STRING }, endTime: { type: Type.STRING }, description: { type: Type.STRING } }, required: ['title', 'date', 'startTime', 'endTime'] } },
    goalWithMilestones: { type: Type.OBJECT, properties: { description: { type: Type.STRING }, milestones: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING } }, required: ['text'] } } }, required: ['description', 'milestones'] },
    examDetails: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, totalQuestions: { type: Type.INTEGER }, dueDate: { type: Type.STRING } }, required: ['title', 'description', 'totalQuestions', 'dueDate'] },
    question: { type: Type.OBJECT, properties: { questionText: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctOptionIndex: { type: Type.INTEGER }, explanation: { type: Type.STRING } }, required: ['questionText', 'options', 'correctOptionIndex', 'explanation'] },
};


app.post('/api/gemini/generateText', async (req, res) => {
    try {
        const { prompt, temperature = 0.7 } = req.body;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature } });
        res.json({ result: response.text });
    } catch (error) {
        res.status(500).json({ error: 'Gemini API text generation failed.', details: error.message });
    }
});

app.post('/api/gemini/generateWithImage', async (req, res) => {
    try {
        const { textPart, imagePart } = req.body;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });
        res.json({ result: response.text });
    } catch (error) {
        res.status(500).json({ error: 'Gemini API image generation failed.', details: error.message });
    }
});

app.post('/api/gemini/generateJson', async (req, res) => {
    try {
        const { prompt, schema } = req.body;
        if (!schemas[schema]) {
            return res.status(400).json({ error: 'Invalid schema specified.' });
        }
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: schemas[schema] },
        });
        res.json({ result: JSON.parse(response.text.trim()) });
    } catch (error) {
        res.status(500).json({ error: 'Gemini API JSON generation failed.', details: error.message });
    }
});

app.post('/api/gemini/chat', async (req, res) => {
    try {
        const { history, systemInstruction } = req.body;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: history,
            config: {
                systemInstruction: systemInstruction,
            },
        });
        res.json({ text: response.text });
    } catch (error) {
        res.status(500).json({ error: 'Gemini API chat failed.', details: error.message });
    }
});


export default app;
