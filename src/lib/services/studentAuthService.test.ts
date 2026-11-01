import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "./studentAuthService.ts";

test("hashPassword produces unique salt and hash", () => {
  const result1 = hashPassword("secret123");
  const result2 = hashPassword("secret123");

  assert.ok(result1.hash.length > 32);
  assert.ok(result1.salt.length >= 16);
  // Different salts each time
  assert.notEqual(result1.salt, result2.salt);
  assert.notEqual(result1.hash, result2.hash);
});

test("verifyPassword succeeds with matching password", () => {
  const { hash, salt } = hashPassword("MySecurePass#2026");
  const isValid = verifyPassword("MySecurePass#2026", hash, salt);
  assert.equal(isValid, true);
});

test("verifyPassword fails with incorrect password", () => {
  const { hash, salt } = hashPassword("MySecurePass#2026");
  const isValid = verifyPassword("WrongPassword", hash, salt);
  assert.equal(isValid, false);
});

test("verifyPassword fails with empty password or missing salt", () => {
  const { hash, salt } = hashPassword("MySecurePass#2026");
  assert.equal(verifyPassword("", hash, salt), false);
  assert.equal(verifyPassword("MySecurePass#2026", "", salt), false);
  assert.equal(verifyPassword("MySecurePass#2026", hash, ""), false);
});
