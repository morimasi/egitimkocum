// FIX: Use a namespace import for Express to prevent type conflicts with global types like `Response`.
// This also helps resolve module interop issues and ensures correct method overloads are used.
import * as express from 'express';
import cors from 'cors';

// FIX: Explicitly type `app` as `express.Application` to resolve type inference issues
// that can cause overload errors with middleware.
const app: express.Application = express();

app.use(cors());

// FIX: Replaced deprecated bodyParser.json() with the modern, built-in express.json() middleware.
// This resolves potential type conflicts and overload errors on `app.use`. A limit is also added
// to handle potentially large payloads (e.g., images for AI).
app.use(express.json({ limit: '50mb' }));

// A dummy handler for Vercel to confirm the function is working.
// FIX: Added explicit types for request and response objects for better type safety and to fix
// errors where properties like `status` were not found due to type collisions.
app.get('/api/health', (_req: express.Request, res: express.Response) => {
  res.status(200).json({ status: 'ok' });
});

// In a real application, other API routes would be defined here.
// For example, handlers for data persistence and Gemini API proxying.

export default app;
