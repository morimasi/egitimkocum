import { sql } from '@vercel/postgres';

export async function createTables() {
    console.log("Attempting to create tables...");
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                role TEXT NOT NULL,
                "profilePicture" TEXT,
                notes TEXT,
                "assignedCoachId" TEXT,
                "gradeLevel" TEXT,
                "academicTrack" TEXT,
                "childIds" TEXT[],
                "parentIds" TEXT[],
                xp INTEGER DEFAULT 0,
                streak INTEGER DEFAULT 0,
                "lastSubmissionDate" TIMESTAMPTZ,
                "earnedBadgeIds" TEXT[]
            );
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS assignments (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                "dueDate" TIMESTAMPTZ NOT NULL,
                status TEXT NOT NULL,
                grade INTEGER,
                feedback TEXT,
                "fileUrl" TEXT,
                "fileName" TEXT,
                "studentId" TEXT NOT NULL,
                "coachId" TEXT NOT NULL,
                "submittedAt" TIMESTAMPTZ,
                "gradedAt" TIMESTAMPTZ,
                "coachAttachments" JSONB,
                checklist JSONB,
                "audioFeedbackUrl" TEXT,
                "videoDescriptionUrl" TEXT,
                "videoFeedbackUrl" TEXT,
                "studentVideoSubmissionUrl" TEXT,
                "feedbackReaction" TEXT,
                "submissionType" TEXT,
                "textSubmission" TEXT,
                "studentAudioFeedbackResponseUrl" TEXT,
                "studentVideoFeedbackResponseUrl" TEXT,
                "studentTextFeedbackResponse" TEXT,
                "startTime" TEXT,
                "endTime" TEXT
            );
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                "senderId" TEXT NOT NULL,
                "conversationId" TEXT NOT NULL,
                text TEXT NOT NULL,
                timestamp TIMESTAMPTZ NOT NULL,
                type TEXT NOT NULL,
                "fileUrl" TEXT,
                "fileName" TEXT,
                "fileType" TEXT,
                "imageUrl" TEXT,
                "audioUrl" TEXT,
                "videoUrl" TEXT,
                "readBy" TEXT[],
                reactions JSONB,
                "replyTo" TEXT,
                poll JSONB,
                priority TEXT
            );
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                "participantIds" TEXT[] NOT NULL,
                "isGroup" BOOLEAN NOT NULL,
                "groupName" TEXT,
                "groupImage" TEXT,
                "adminId" TEXT,
                "isArchived" BOOLEAN DEFAULT false
            );
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS notifications (
                id TEXT PRIMARY KEY,
                "userId" TEXT NOT NULL,
                message TEXT NOT NULL,
                timestamp TIMESTAMPTZ NOT NULL,
                "isRead" BOOLEAN NOT NULL,
                priority TEXT NOT NULL,
                link JSONB
            );
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS templates (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                checklist JSONB,
                "isFavorite" BOOLEAN DEFAULT false
            );
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS resources (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                url TEXT NOT NULL,
                "isPublic" BOOLEAN NOT NULL,
                "uploaderId" TEXT NOT NULL,
                "assignedTo" TEXT[],
                category TEXT NOT NULL
            );
        `;
        
        await sql`
            CREATE TABLE IF NOT EXISTS questions (
                id TEXT PRIMARY KEY,
                "creatorId" TEXT NOT NULL,
                category TEXT NOT NULL,
                topic TEXT NOT NULL,
                "questionText" TEXT NOT NULL,
                options TEXT[] NOT NULL,
                "correctOptionIndex" INTEGER NOT NULL,
                difficulty TEXT NOT NULL,
                explanation TEXT,
                "imageUrl" TEXT,
                "videoUrl" TEXT,
                "audioUrl" TEXT,
                "documentUrl" TEXT,
                "documentName" TEXT
            );
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS goals (
                id TEXT PRIMARY KEY,
                "studentId" TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                "isCompleted" BOOLEAN NOT NULL,
                milestones JSONB
            );
        `;
        
        await sql`
            CREATE TABLE IF NOT EXISTS badges (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL
            );
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS "calendarEvents" (
                id TEXT PRIMARY KEY,
                "userId" TEXT NOT NULL,
                title TEXT NOT NULL,
                date DATE NOT NULL,
                type TEXT NOT NULL,
                color TEXT NOT NULL,
                "startTime" TEXT,
                "endTime" TEXT
            );
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS exams (
                id TEXT PRIMARY KEY,
                "studentId" TEXT NOT NULL,
                title TEXT NOT NULL,
                date DATE NOT NULL,
                "totalQuestions" INTEGER NOT NULL,
                correct INTEGER NOT NULL,
                incorrect INTEGER NOT NULL,
                empty INTEGER NOT NULL,
                "netScore" REAL NOT NULL,
                subjects JSONB,
                "coachNotes" TEXT,
                "studentReflections" TEXT,
                category TEXT NOT NULL,
                topic TEXT NOT NULL,
                type TEXT NOT NULL
            );
        `;

        console.log("Tables created successfully (if they didn't exist).");
        return true;
    } catch (error) {
        console.error('Error creating tables:', error);
        throw error;
    }
}