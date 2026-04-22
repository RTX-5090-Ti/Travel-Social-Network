import test from "node:test";
import assert from "node:assert/strict";

import { __testables as feedTestables } from "../src/controllers/feed.controller.js";

test("encodeLatestCursor and decodeFeedCursor round-trip latest mode", () => {
  const trip = {
    _id: "abc123",
    createdAt: new Date("2026-04-22T10:00:00.000Z"),
  };

  const cursor = feedTestables.encodeLatestCursor(trip);
  const decoded = feedTestables.decodeFeedCursor(
    cursor,
    feedTestables.FEED_MODE.LATEST,
  );

  assert.equal(cursor, "latest__2026-04-22T10:00:00.000Z__abc123");
  assert.equal(decoded.mode, feedTestables.FEED_MODE.LATEST);
  assert.equal(decoded.id, "abc123");
  assert.equal(decoded.createdAt.toISOString(), "2026-04-22T10:00:00.000Z");
});

test("encodeTrendingCursor and decodeFeedCursor round-trip recent trending mode", () => {
  const trip = {
    _id: "trip789",
    createdAt: new Date("2026-04-20T08:30:00.000Z"),
    trendScore: 17,
  };

  const cursor = feedTestables.encodeTrendingCursor(trip);
  const decoded = feedTestables.decodeFeedCursor(
    cursor,
    feedTestables.FEED_MODE.TRENDING,
  );

  assert.equal(
    cursor,
    "trending__recent__17__2026-04-20T08:30:00.000Z__trip789",
  );
  assert.equal(decoded.mode, feedTestables.FEED_MODE.TRENDING);
  assert.equal(decoded.phase, feedTestables.TRENDING_PHASE.RECENT);
  assert.equal(decoded.trendScore, 17);
  assert.equal(decoded.id, "trip789");
});

test("decodeFeedCursor supports fallback trending cursor", () => {
  const decoded = feedTestables.decodeFeedCursor(
    "trending__fallback__2026-04-10T00:00:00.000Z__trip555",
    feedTestables.FEED_MODE.TRENDING,
  );

  assert.equal(decoded.mode, feedTestables.FEED_MODE.TRENDING);
  assert.equal(decoded.phase, feedTestables.TRENDING_PHASE.FALLBACK);
  assert.equal(decoded.id, "trip555");
  assert.equal(decoded.createdAt.toISOString(), "2026-04-10T00:00:00.000Z");
});

test("buildBaseFeedFilter builds privacy-aware filter with following and hidden trips", () => {
  const filter = feedTestables.buildBaseFeedFilter({
    userId: "owner-1",
    followingIds: ["owner-2", "owner-3"],
    hiddenTripIds: ["trip-hidden-1", "trip-hidden-2"],
  });

  assert.deepEqual(filter, {
    deletedAt: null,
    _id: { $nin: ["trip-hidden-1", "trip-hidden-2"] },
    $or: [
      { ownerId: "owner-1" },
      {
        ownerId: { $in: ["owner-2", "owner-3"] },
        privacy: { $in: ["public", "followers"] },
      },
      {
        ownerId: { $nin: ["owner-1", "owner-2", "owner-3"] },
        privacy: "public",
      },
    ],
  });
});

test("buildLatestCursorFilter uses createdAt + id tie-break when id exists", () => {
  const createdAt = new Date("2026-04-18T12:00:00.000Z");
  const filter = feedTestables.buildLatestCursorFilter({
    createdAt,
    id: "trip-22",
  });

  assert.deepEqual(filter, {
    $or: [
      { createdAt: { $lt: createdAt } },
      {
        createdAt,
        _id: { $lt: "trip-22" },
      },
    ],
  });
});

test("decodeFeedCursor returns null for malformed cursor", () => {
  assert.equal(
    feedTestables.decodeFeedCursor("invalid-cursor", feedTestables.FEED_MODE.TRENDING),
    null,
  );
});
