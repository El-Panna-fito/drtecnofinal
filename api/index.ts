import app, { startServer } from "../server.js";
import { initDb } from "../server/db.js";

// Ensure DB is initialized for serverless invocations
let dbInitialized = false;

export default async function handler(req: any, res: any) {
  if (!dbInitialized) {
    try {
      await initDb();
      dbInitialized = true;
    } catch (err) {
      console.error("Database initialization error in serverless handler:", err);
    }
  }
  return app(req, res);
}
