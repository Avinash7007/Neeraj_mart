import test from "node:test";
import assert from "node:assert";
import { isUserAdmin } from "../server/db";

test("Admin check valid", async () => {
  // Test fallback if DB disconnected or no mock
  const isAdmin = await isUserAdmin("null");
  assert.strictEqual(isAdmin, false);
});
