import test from "node:test";
import assert from "node:assert/strict";

import { __testables as authTestables } from "../src/controllers/auth.controller.js";

test("normalizeEmail trims spaces and lowercases email", () => {
  assert.equal(
    authTestables.normalizeEmail("  QuocV@example.COM "),
    "quocv@example.com",
  );
});

test("sha256 returns a deterministic 64-character hash", () => {
  const hashA = authTestables.sha256("refresh-token-value");
  const hashB = authTestables.sha256("refresh-token-value");
  const hashC = authTestables.sha256("another-value");

  assert.equal(hashA, hashB);
  assert.notEqual(hashA, hashC);
  assert.equal(hashA.length, 64);
});

test("buildAuthUserPayload keeps the expected auth-safe fields", () => {
  const fakeUser = {
    _id: "user-123",
    name: "Quoc V",
    email: "quocv@example.com",
    role: "user",
    avatarUrl: "avatar.png",
    coverUrl: "cover.png",
    bio: "Traveler",
    location: "Da Nang",
    travelStyle: "Backpacking",
    pinnedTripId: "trip-1",
    password: "must-not-leak",
  };

  assert.deepEqual(authTestables.buildAuthUserPayload(fakeUser), {
    _id: "user-123",
    id: "user-123",
    name: "Quoc V",
    email: "quocv@example.com",
    role: "user",
    avatarUrl: "avatar.png",
    coverUrl: "cover.png",
    bio: "Traveler",
    location: "Da Nang",
    travelStyle: "Backpacking",
    pinnedTripId: "trip-1",
  });
});

test("formatDeletionRemainingLabel returns less-than-24h label for near deadline", () => {
  const nearDeadline = new Date(Date.now() + 6 * 60 * 60 * 1000);

  assert.equal(
    authTestables.formatDeletionRemainingLabel(nearDeadline),
    "Less than 24 hours remaining",
  );
});

test("formatDeletionRemainingLabel rounds remaining days upward", () => {
  const twoDaysLater = new Date(Date.now() + 1.2 * 24 * 60 * 60 * 1000);

  assert.equal(
    authTestables.formatDeletionRemainingLabel(twoDaysLater),
    "2 days remaining",
  );
});
