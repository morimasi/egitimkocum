import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type as GenAIType } from '@google/genai';
import { createTables } from './index';
import { seedDatabase } from './initialData';
import { sql } from '@vercel/postgres';
import serverless from 'serverless-http';
import { 
    generateToken, 
    hashPassword, 
    comparePassword, 
    authMiddleware, 
    requireRole,
    AuthRequest 
} from './auth';

// --- Environment Variable Validation ---
// Fail fast if critical environment variables are missing or invalid.
if (!process.env.POSTGRES_URL || process.env.POSTGRES_URL.trim() === '') {
    console.error("🔴 FATAL: POSTGRES_URL environment variable is not set or is empty.");
    console.error("Please ensure it is defined in your .env file and holds a valid Vercel Postgres connection string.");
    throw new Error("Server startup failed: Missing POSTGRES_URL.");
}

try {
    // The @vercel/postgres library will try to construct a URL from this string.
    // We do it here to catch the error early and provide a more helpful message.
    new URL(process.env.POSTGRES_URL);
} catch (error) {
    console.error("🔴 FATAL: Invalid POSTGRES_URL format.");
    if (error instanceof TypeError) {
        console.error("Error details: " + error.message);
    }
    console.error(`The provided POSTGRES_URL was: "${process.env.POSTGRES_URL}"`);
    console.error("Please ensure it is a complete and valid connection string, starting with 'postgres://...'.");
    throw new Error("Server startup failed: Invalid POSTGRES_URL.");
}

if (!process.env.API_KEY || process.env.API_KEY.trim() === '') {
    console.error("🔴 FATAL: API_KEY environment variable is not set or is empty.");
    console.error("It is required for Gemini AI functionality. Please check your .env file.");
    throw new Error("Server startup failed: Missing API_KEY.");
}
// --- End Validation ---


const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- Database Setup Route ---
app.post('/api/setup', async (req, res) => {
    try {
        await createTables();
        await seedDatabase();
        res.status(200).json({ success: true, message: 'Database setup and seeding completed successfully.' });
    } catch (error) {
        console.error("Setup failed:", error);
        res.status(500).json({ success: false, error: 'Database setup failed.' });
    }
});

// --- Gemini AI Setup ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';


// --- Auth Routes ---
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    
    try {
        const { rows } = await sql`SELECT * FROM users WHERE email = ${email};`;
        const user = rows[0];
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isPasswordValid = user.password 
            ? await comparePassword(password, user.password)
            : password === 'demo'; // Fallback for legacy users without password

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role
        });

        // Return user data without password
        const { password: _, ...userWithoutPassword } = user;
        
        res.json({ 
            user: userWithoutPassword, 
            token 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/register', async (req, res) => {
    const { id, name, email, password, role, profilePicture } = req.body;
    
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    try {
        // Check if any user exists
        const { rows: countRows } = await sql`SELECT COUNT(*) FROM users;`;
        const userCount = parseInt(countRows[0].count, 10);

        // If no users, make this one superadmin, otherwise use provided role.
        const finalRole = userCount === 0 ? 'superadmin' : role;

        // Hash password
        const hashedPassword = await hashPassword(password);

        const { rows } = await sql`
            INSERT INTO users (id, name, email, password, role, "profilePicture")
            VALUES (${id}, ${name}, ${email}, ${hashedPassword}, ${finalRole}, ${profilePicture})
            RETURNING *;
        `;
        
        const user = rows[0];
        
        // Generate JWT token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role
        });

        // Return user data without password
        const { password: _, ...userWithoutPassword } = user;
        
        res.status(201).json({ 
            user: userWithoutPassword, 
            token 
        });
    } catch (error: any) {
        if (error.code === '23505') { // Unique constraint violation
            return res.status(400).json({ error: 'Email already exists' });
        }
        console.error('Register error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify token endpoint
app.get('/api/auth/verify', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { rows } = await sql`SELECT * FROM users WHERE id = ${req.user!.userId};`;
        const user = rows[0];
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Return user data without password
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Verify token error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// --- Generic CRUD Routes ---
const entityToTableMap: Record<string, string> = {
    users: 'users',
    assignments: 'assignments',
    messages: 'messages',
    conversations: 'conversations',
    notifications: 'notifications',
    templates: 'templates',
    resources: 'resources',
    goals: 'goals',
    badges: 'badges',
    calendarEvents: 'calendarEvents',
    exams: 'exams',
    questions: 'questions'
};


Object.entries(entityToTableMap).forEach(([entity, tableName]) => {

    // GET all (protected)
    app.get(`/api/${entity}`, authMiddleware, async (req: AuthRequest, res) => {
        try {
            const { rows } = await sql.query(`SELECT * FROM "${tableName}";`);
            res.json(rows);
        } catch (e) {
            res.status(500).json({ error: `Failed to fetch ${entity}` });
        }
    });

    // GET by ID (protected)
    app.get(`/api/${entity}/:id`, authMiddleware, async (req: AuthRequest, res) => {
        try {
            const { rows } = await sql.query(`SELECT * FROM "${tableName}" WHERE id = $1;`, [req.params.id]);
            if (rows.length > 0) res.json(rows[0]);
            else res.status(404).json({ error: 'Not found' });
        } catch (e) {
            res.status(500).json({ error: `Failed to fetch ${entity}` });
        }
    });

    // POST new (protected)
    app.post(`/api/${entity}`, authMiddleware, async (req: AuthRequest, res) => {
        try {
            const newItem = req.body;
            const columns = Object.keys(newItem).map(k => `"${k}"`);
            const values = Object.values(newItem);
            
            const { rows } = await sql.query(
                `INSERT INTO "${tableName}" (${columns.join(', ')}) VALUES (${values.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *;`,
                values
            );
            res.status(201).json(rows[0]);
        } catch (e) {
            console.error(`POST /${entity} Error:`, e);
            res.status(500).json({ error: `Failed to create ${entity}` });
        }
    });

    // PUT update (protected)
    app.put(`/api/${entity}/:id`, authMiddleware, async (req: AuthRequest, res) => {
        try {
            const { id } = req.params;
            const updates = req.body;
            
            delete updates.id;

            const columns = Object.keys(updates);
            if (columns.length === 0) {
                return res.status(400).json({ error: 'No fields to update' });
            }
            
            const setClause = columns.map((col, i) => `"${col}" = $${i + 1}`).join(', ');
            const values = Object.values(updates);
            
            const { rows } = await sql.query(
                `UPDATE "${tableName}" SET ${setClause} WHERE id = $${columns.length + 1} RETURNING *;`,
                [...values, id]
            );
            
            if (rows.length === 0) {
                return res.status(404).json({ error: 'Not found' });
            }
            
            res.json(rows[0]);
        } catch (e) {
            console.error(`PUT /${entity} Error:`, e);
            res.status(500).json({ error: `Failed to update ${entity}` });
        }
    });

    // DELETE multiple (protected, admin only)
    app.delete(`/api/${entity}`, authMiddleware, requireRole('superadmin', 'coach'), async (req: AuthRequest, res) => {
        try {
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids)) {
                return res.status(400).json({ error: 'Invalid request body, expected { ids: [...] }' });
            }
            await sql.query(`DELETE FROM "${tableName}" WHERE id = ANY($1);`, [ids]);
            res.status(204).send();
        } catch (e) {
             res.status(500).json({ error: `Failed to delete ${entity}` });
        }
    });
});

// Custom conversation route (protected)
app.post('/api/conversations/findOrCreate', authMiddleware, async (req: AuthRequest, res) => {
    const { userId1, userId2 } = req.body;
    try {
        const { rows } = await sql`
            SELECT * FROM conversations 
            WHERE "isGroup" = false 
            AND "participantIds" @> ARRAY[${userId1}, ${userId2}] 
            AND "participantIds" <@ ARRAY[${userId1}, ${userId2}];
        `;
        
        if (rows.length > 0) {
            return res.json(rows[0]);
        }

        const newId = `conv-${userId1.substring(0,4)}-${userId2.substring(0,4)}-${Date.now()}`;
        const newConversation = {
            id: newId,
            participantIds: [userId1, userId2],
            isGroup: false,
        };

        const { rows: insertedRows } = await sql.query(
            `INSERT INTO conversations (id, "participantIds", "isGroup") 
            VALUES ($1, $2, $3) RETURNING *;`,
            [newConversation.id, newConversation.participantIds, newConversation.isGroup]
        );
        res.status(201).json(insertedRows[0]);

    } catch (e) {
        res.status(500).json({ error: 'Failed to find or create conversation' });
    }
});


// --- Gemini API Proxy Routes ---
const getJsonSchema = (schemaName: string) => {
    const schemas: Record<string, any> = {
        checklist: { type: GenAIType.ARRAY, items: { type: GenAIType.OBJECT, properties: { text: { type: GenAIType.STRING } } } },
        gradeSuggestion: { type: GenAIType.OBJECT, properties: { suggestedGrade: { type: GenAIType.NUMBER }, rationale: { type: GenAIType.STRING } } },
        assignmentTemplate: { type: GenAIType.OBJECT, properties: { title: { type: GenAIType.STRING }, description: { type: GenAIType.STRING }, checklist: { type: GenAIType.ARRAY, items: { type: GenAIType.OBJECT, properties: { text: { type: GenAIType.STRING } } } } } },
        studyPlan: { type: GenAIType.ARRAY, items: { type: GenAIType.OBJECT, properties: { title: { type: GenAIType.STRING }, date: { type: GenAIType.STRING }, startTime: { type: GenAIType.STRING }, endTime: { type: GenAIType.STRING }, description: { type: GenAIType.STRING } } } },
        goalWithMilestones: { type: GenAIType.OBJECT, properties: { description: { type: GenAIType.STRING }, milestones: { type: GenAIType.ARRAY, items: { type: GenAIType.OBJECT, properties: { text: { type: GenAIType.STRING } } } } } },
        examDetails: { type: GenAIType.OBJECT, properties: { title: { type: GenAIType.STRING }, description: { type: GenAIType.STRING }, totalQuestions: { type: GenAIType.NUMBER }, dueDate: { type: GenAIType.STRING } } },
        question: { type: GenAIType.OBJECT, properties: { questionText: { type: GenAIType.STRING }, options: { type: GenAIType.ARRAY, items: { type: GenAIType.STRING } }, correctOptionIndex: { type: GenAIType.NUMBER }, explanation: { type: GenAIType.STRING } } }
    };
    return schemas[schemaName];
}

app.post('/api/gemini/generateText', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { prompt, temperature } = req.body;
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: { temperature: temperature || 0.2 }
        });
        res.json({ result: response.text });
    } catch (error: any) {
        console.error('Gemini generateText error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/gemini/generateWithImage', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { textPart, imagePart } = req.body;
        const response = await ai.models.generateContent({
            model,
            contents: { parts: [textPart, imagePart] }
        });
        res.json({ result: response.text });
    } catch (error: any) {
        console.error('Gemini generateWithImage error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/gemini/generateJson', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { prompt, schema } = req.body;
        const responseSchema = getJsonSchema(schema);
        if (!responseSchema) {
            return res.status(400).json({ error: 'Invalid schema name' });
        }
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema
            }
        });
        res.json({ result: JSON.parse(response.text) });
    } catch (error: any) {
        console.error('Gemini generateJson error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/gemini/chat', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { history, systemInstruction } = req.body;
        const response = await ai.models.generateContent({
            model,
            contents: history,
            config: {
                systemInstruction: systemInstruction,
            }
        });
        res.json({ text: response.text });
    } catch (error: any) {
        console.error('Gemini chat error:', error);
        res.status(500).json({ error: error.message });
    }
});


const PORT = process.env.PORT || 3001;
// Only listen on a port when running directly for local development, not in a serverless environment
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log('To setup the database for the first time, send a POST request to /api/setup');
    });
}

// Export for serverless functions (Netlify, etc.)
export const handler = serverless(app);