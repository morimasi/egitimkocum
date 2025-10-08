import express, { Request, Response } from 'express';
import cors from 'cors';

// FIX: Explicitly typing `app` as `express.Application` resolves type inference issues
// that can cause overload errors with middleware like `express.json()`.
const app: express.Application = express();

app.use(cors());

// This addresses the TypeScript overload issue by using the modern, built-in express.json() middleware.
// Using this instead of the separate 'body-parser' can resolve type conflicts.
// A limit is also added to handle potentially large payloads (e.g., images for AI).
// FIX: Replaced deprecated bodyParser.json() with express.json()
app.use(express.json({ limit: '10mb' }));

// A dummy handler for Vercel to confirm the function is working.
// FIX: Added explicit types for request and response objects for better type safety and consistency.
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// In a real application, other API routes would be defined here.
// For example, handlers for data persistence and Gemini API proxying.

export default app;
