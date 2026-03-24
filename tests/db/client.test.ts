import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../src/db/client";

describe("createDatabaseClient", () => {
  it("creates a SQLite database inside the workspace data directory", () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), "persona-lm-db-client-"));

    try {
      const client = createDatabaseClient(tempDir);

      expect(client.dbPath).toBe(path.join(tempDir, "data", "persona.db"));
      expect(existsSync(client.dbPath)).toBe(true);

      client.sqlite.close();
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
