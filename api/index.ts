import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());

// This addresses the TypeScript overload issue by using the modern, built-in express.json() middleware.
// Using this instead of the separate 'body-parser' can resolve type conflicts.
// A limit is also added to handle potentially large payloads (e.g., images for AI).
// FIX: Removed the explicit path '/' to resolve a TypeScript overload issue where types were incompatible. Applying the middleware globally without a path is a common pattern and helps the type checker.
app.use(express.json({ limit: '10mb' }));

// A dummy handler for Vercel to confirm the function is working.
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// In a real application, other API routes would be defined here.
// For example, handlers for data persistence and Gemini API proxying.

export default app;
