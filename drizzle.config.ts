import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "sqlite",
  tablesFilter: [
    "personas",
    "evidence",
    "memories",
    "feedback_runs"
  ],
  dbCredentials: {
    url: "./data/persona.db"
  }
});
