import { sql, VercelPoolClient } from '@vercel/postgres';
import { initialData } from '../services/seedData';

// This function checks if tables have data and seeds them if they are empty.
export async function seedDatabase() {
    let client: VercelPoolClient | undefined;
    try {
        client = await sql.connect();
        
        // Check if users table is empty
        const { rows } = await client.query('SELECT COUNT(*) FROM users');
        const userCount = parseInt(rows[0].count, 10);

        if (userCount > 0) {
            console.log("Database already seeded. Skipping.");
            return;
        }

        console.log("Seeding database with initial data...");

        // Use a transaction to ensure all or no data is inserted.
        await client.query('BEGIN');

        for (const user of initialData.users) {
            await client.query(`
                INSERT INTO users (id, name, email, role, "profilePicture", notes, "assignedCoachId", "gradeLevel", "academicTrack", "childIds", "parentIds", xp, streak, "lastSubmissionDate", "earnedBadgeIds")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15);
            `, [user.id, user.name, user.email, user.role, user.profilePicture, user.notes || null, user.assignedCoachId || null, user.gradeLevel || null, user.academicTrack || null, user.childIds ? user.childIds : null, user.parentIds ? user.parentIds : null, user.xp || 0, user.streak || 0, user.lastSubmissionDate || null, user.earnedBadgeIds ? user.earnedBadgeIds : null]);
        }

        for (const assignment of initialData.assignments) {
            await client.query(`
                INSERT INTO assignments (id, title, description, "dueDate", status, grade, feedback, "fileUrl", "fileName", "studentId", "coachId", "submittedAt", "gradedAt", "coachAttachments", checklist, "audioFeedbackUrl", "videoDescriptionUrl", "videoFeedbackUrl", "studentVideoSubmissionUrl", "feedbackReaction", "submissionType", "textSubmission", "studentAudioFeedbackResponseUrl", "studentVideoFeedbackResponseUrl", "studentTextFeedbackResponse", "startTime", "endTime")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27);
            `, [assignment.id, assignment.title, assignment.description, assignment.dueDate, assignment.status, assignment.grade, assignment.feedback, assignment.fileUrl, assignment.fileName || null, assignment.studentId, assignment.coachId, assignment.submittedAt, assignment.gradedAt || null, assignment.coachAttachments ? JSON.stringify(assignment.coachAttachments) : null, assignment.checklist ? JSON.stringify(assignment.checklist) : null, assignment.audioFeedbackUrl || null, assignment.videoDescriptionUrl || null, assignment.videoFeedbackUrl || null, assignment.studentVideoSubmissionUrl || null, assignment.feedbackReaction || null, assignment.submissionType || null, assignment.textSubmission || null, assignment.studentAudioFeedbackResponseUrl || null, assignment.studentVideoFeedbackResponseUrl || null, assignment.studentTextFeedbackResponse || null, assignment.startTime || null, assignment.endTime || null]);
        }

        for (const message of initialData.messages) {
            await client.query(`
                INSERT INTO messages (id, "senderId", "conversationId", text, timestamp, type, "fileUrl", "fileName", "fileType", "imageUrl", "audioUrl", "videoUrl", "readBy", reactions, "replyTo", poll, priority)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17);
            `, [message.id, message.senderId, message.conversationId, message.text, message.timestamp, message.type, message.fileUrl || null, message.fileName || null, message.fileType || null, message.imageUrl || null, message.audioUrl || null, message.videoUrl || null, message.readBy, message.reactions ? JSON.stringify(message.reactions) : null, message.replyTo || null, message.poll ? JSON.stringify(message.poll) : null, message.priority || null]);
        }
        
        for (const conversation of initialData.conversations) {
            await client.query(`
                INSERT INTO conversations (id, "participantIds", "isGroup", "groupName", "groupImage", "adminId", "isArchived")
                VALUES ($1, $2, $3, $4, $5, $6, $7);
            `, [conversation.id, conversation.participantIds, conversation.isGroup, conversation.groupName || null, conversation.groupImage || null, conversation.adminId || null, conversation.isArchived || false]);
        }

        for (const notification of initialData.notifications) {
            await client.query(`
                INSERT INTO notifications (id, "userId", message, timestamp, "isRead", priority, link)
                VALUES ($1, $2, $3, $4, $5, $6, $7);
            `, [notification.id, notification.userId, notification.message, notification.timestamp, notification.isRead, notification.priority, notification.link ? JSON.stringify(notification.link) : null]);
        }

        for (const template of initialData.templates) {
            await client.query(`
                INSERT INTO templates (id, title, description, checklist, "isFavorite")
                VALUES ($1, $2, $3, $4, $5);
            `, [template.id, template.title, template.description, JSON.stringify(template.checklist), template.isFavorite || false]);
        }

        for (const resource of initialData.resources) {
            await client.query(`
                INSERT INTO resources (id, name, type, url, "isPublic", "uploaderId", "assignedTo", category)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
            `, [resource.id, resource.name, resource.type, resource.url, resource.isPublic, resource.uploaderId, resource.assignedTo ? resource.assignedTo : null, resource.category]);
        }
        
        for (const question of initialData.questions) {
            await client.query(`
                INSERT INTO questions (id, "creatorId", category, topic, "questionText", options, "correctOptionIndex", difficulty, explanation, "imageUrl", "videoUrl", "audioUrl", "documentUrl", "documentName")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);
            `, [question.id, question.creatorId, question.category, question.topic, question.questionText, question.options, question.correctOptionIndex, question.difficulty, question.explanation || null, question.imageUrl || null, question.videoUrl || null, question.audioUrl || null, question.documentUrl || null, question.documentName || null]);
        }

        for (const goal of initialData.goals) {
            await client.query(`
                INSERT INTO goals (id, "studentId", title, description, "isCompleted", milestones)
                VALUES ($1, $2, $3, $4, $5, $6);
            `, [goal.id, goal.studentId, goal.title, goal.description, goal.isCompleted, JSON.stringify(goal.milestones)]);
        }

        for (const badge of initialData.badges) {
            await client.query(`
                INSERT INTO badges (id, name, description) VALUES ($1, $2, $3);
            `, [badge.id, badge.name, badge.description]);
        }

        for (const event of initialData.calendarEvents) {
            await client.query(`
                INSERT INTO "calendarEvents" (id, "userId", title, date, type, color, "startTime", "endTime")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
            `, [event.id, event.userId, event.title, event.date, event.type, event.color, event.startTime || null, event.endTime || null]);
        }

        for (const exam of initialData.exams) {
            await client.query(`
                INSERT INTO exams (id, "studentId", title, date, "totalQuestions", correct, incorrect, empty, "netScore", subjects, "coachNotes", "studentReflections", category, topic, type)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15);
            `, [exam.id, exam.studentId, exam.title, exam.date, exam.totalQuestions, exam.correct, exam.incorrect, exam.empty, exam.netScore, JSON.stringify(exam.subjects), exam.coachNotes || null, exam.studentReflections || null, exam.category, exam.topic, exam.type]);
        }
        
        await client.query('COMMIT');
        console.log("Database seeded successfully.");

    } catch (error) {
        console.error("Error seeding database:", error);
        if (client) {
            await client.query('ROLLBACK');
        }
        throw error;
    } finally {
        if (client) {
            client.release();
        }
    }
}