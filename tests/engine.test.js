"use strict";

const engine = require("../src/engine.js");

describe("tracksNetwork catalogue", () => {
  test("ships five well-formed tracks", () => {
    expect(Array.isArray(engine.tracksNetwork)).toBe(true);
    expect(engine.tracksNetwork).toHaveLength(5);
    engine.tracksNetwork.forEach((track) => {
      expect(typeof track.title).toBe("string");
      expect(track.title.length).toBeGreaterThan(0);
      expect(typeof track.artist).toBe("string");
      expect(typeof track.url).toBe("string");
      expect(track.url).toMatch(/^https:\/\//);
      expect(typeof track.emoji).toBe("string");
    });
  });
});

describe("filterTracks", () => {
  const tracks = [
    { title: "FE!N", artist: "Travis Scott" },
    { title: "Magnolia", artist: "Playboi Carti" },
    { title: "Bandit", artist: "Don Toliver" }
  ];

  test("returns every track for an empty query", () => {
    expect(filterTitles(engine.filterTracks(tracks, ""))).toEqual([
      "FE!N",
      "Magnolia",
      "Bandit"
    ]);
  });

  test("matches on title, case-insensitively", () => {
    expect(filterTitles(engine.filterTracks(tracks, "magno"))).toEqual(["Magnolia"]);
    expect(filterTitles(engine.filterTracks(tracks, "MAGNO"))).toEqual(["Magnolia"]);
  });

  test("matches on artist", () => {
    expect(filterTitles(engine.filterTracks(tracks, "carti"))).toEqual(["Magnolia"]);
  });

  test("returns an empty array when nothing matches", () => {
    expect(engine.filterTracks(tracks, "zzz-nope")).toEqual([]);
  });

  test("preserves original order and returns only matching entries", () => {
    const catalogue = [
      { title: "Alpha", artist: "Red" },
      { title: "Beta", artist: "Blue" },
      { title: "Gamma", artist: "Red" }
    ];
    // "red" matches indexes 0 and 2 only, and must keep their original order.
    const result = engine.filterTracks(catalogue, "red");
    expect(filterTitles(result)).toEqual(["Alpha", "Gamma"]);
  });

  test("treats null/undefined query as match-all", () => {
    expect(engine.filterTracks(tracks, null)).toHaveLength(3);
    expect(engine.filterTracks(tracks, undefined)).toHaveLength(3);
  });

  test("is defensive against non-array input", () => {
    expect(engine.filterTracks(null, "x")).toEqual([]);
    expect(engine.filterTracks(undefined, "x")).toEqual([]);
  });

  test("skips falsy entries and missing fields without throwing", () => {
    const messy = [null, { title: "Solo" }, { artist: "OnlyArtist" }, {}];
    expect(() => engine.filterTracks(messy, "")).not.toThrow();
    const result = engine.filterTracks(messy, "solo");
    expect(result).toEqual([{ title: "Solo" }]);
  });

  function filterTitles(list) {
    return list.map((t) => t.title);
  }
});

describe("resolvePhoneBackground", () => {
  test("returns the Carti gradient when the artist contains 'Carti'", () => {
    expect(engine.resolvePhoneBackground("Playboi Carti")).toBe(engine.BACKGROUND_CARTI);
  });

  test("prefers Carti over Scott when both appear", () => {
    expect(engine.resolvePhoneBackground("Travis Scott ft. Playboi Carti")).toBe(
      engine.BACKGROUND_CARTI
    );
  });

  test("returns the Scott gradient when the artist contains 'Scott'", () => {
    expect(engine.resolvePhoneBackground("Travis Scott")).toBe(engine.BACKGROUND_SCOTT);
  });

  test("returns the default gradient for anyone else", () => {
    expect(engine.resolvePhoneBackground("Don Toliver")).toBe(engine.BACKGROUND_DEFAULT);
  });

  test("returns the default gradient for null/undefined/empty", () => {
    expect(engine.resolvePhoneBackground(null)).toBe(engine.BACKGROUND_DEFAULT);
    expect(engine.resolvePhoneBackground(undefined)).toBe(engine.BACKGROUND_DEFAULT);
    expect(engine.resolvePhoneBackground("")).toBe(engine.BACKGROUND_DEFAULT);
  });

  test("is case-sensitive to match the original substring behavior", () => {
    // The original page used String.includes("Carti"); lowercase should NOT match.
    expect(engine.resolvePhoneBackground("carti")).toBe(engine.BACKGROUND_DEFAULT);
  });
});

describe("computeProgressPercent", () => {
  test("computes a normal percentage", () => {
    expect(engine.computeProgressPercent(30, 120)).toBe(25);
    expect(engine.computeProgressPercent(60, 120)).toBe(50);
  });

  test("returns 0 at the start", () => {
    expect(engine.computeProgressPercent(0, 120)).toBe(0);
  });

  test("returns 100 at the end", () => {
    expect(engine.computeProgressPercent(120, 120)).toBe(100);
  });

  test("returns 0 for a zero or missing duration (no divide-by-zero)", () => {
    expect(engine.computeProgressPercent(10, 0)).toBe(0);
    expect(engine.computeProgressPercent(10, undefined)).toBe(0);
    expect(engine.computeProgressPercent(10, null)).toBe(0);
  });

  test("returns 0 for negative or non-finite duration", () => {
    expect(engine.computeProgressPercent(10, -5)).toBe(0);
    expect(engine.computeProgressPercent(10, Infinity)).toBe(0);
    expect(engine.computeProgressPercent(10, NaN)).toBe(0);
  });

  test("returns 0 for a non-finite currentTime", () => {
    expect(engine.computeProgressPercent(NaN, 120)).toBe(0);
    expect(engine.computeProgressPercent(Infinity, 120)).toBe(0);
  });
});

describe("resolveTrackArt", () => {
  test("returns the track emoji when present", () => {
    expect(engine.resolveTrackArt({ emoji: "🔥" })).toBe("🔥");
  });

  test("falls back to the default note when emoji is missing/empty", () => {
    expect(engine.resolveTrackArt({})).toBe(engine.DEFAULT_ART);
    expect(engine.resolveTrackArt({ emoji: "" })).toBe(engine.DEFAULT_ART);
  });

  test("falls back to the default note for null/undefined tracks", () => {
    expect(engine.resolveTrackArt(null)).toBe(engine.DEFAULT_ART);
    expect(engine.resolveTrackArt(undefined)).toBe(engine.DEFAULT_ART);
  });
});

describe("pickSongOfTheDayIndex", () => {
  test("uses the injected rng and floors into range", () => {
    expect(engine.pickSongOfTheDayIndex(5, () => 0)).toBe(0);
    expect(engine.pickSongOfTheDayIndex(5, () => 0.99)).toBe(4);
    expect(engine.pickSongOfTheDayIndex(5, () => 0.5)).toBe(2);
  });

  test("never returns an out-of-range index even when rng returns >= 1", () => {
    expect(engine.pickSongOfTheDayIndex(5, () => 1)).toBe(4);
    expect(engine.pickSongOfTheDayIndex(5, () => 1.5)).toBe(4);
  });

  test("clamps negative rng output to the first index", () => {
    expect(engine.pickSongOfTheDayIndex(5, () => -0.5)).toBe(0);
  });

  test("returns -1 for an empty or invalid catalogue length", () => {
    expect(engine.pickSongOfTheDayIndex(0)).toBe(-1);
    expect(engine.pickSongOfTheDayIndex(-3)).toBe(-1);
    expect(engine.pickSongOfTheDayIndex(NaN)).toBe(-1);
  });

  test("defaults to Math.random and stays within range across many draws", () => {
    for (let i = 0; i < 500; i++) {
      const idx = engine.pickSongOfTheDayIndex(engine.tracksNetwork.length);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(engine.tracksNetwork.length);
      expect(Number.isInteger(idx)).toBe(true);
    }
  });
});

describe("isTrackActive", () => {
  test("is true only when indexes match", () => {
    expect(engine.isTrackActive(2, 2)).toBe(true);
    expect(engine.isTrackActive(2, 3)).toBe(false);
  });
});

describe("rowStatusLabel", () => {
  test("labels the active row 'ON DECK' and others 'STREAM'", () => {
    expect(engine.rowStatusLabel(true)).toBe("ON DECK");
    expect(engine.rowStatusLabel(false)).toBe("STREAM");
  });
});
