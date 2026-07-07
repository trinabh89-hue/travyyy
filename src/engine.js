/*
 * Aura Board x Media Engine - pure runtime logic.
 *
 * This module contains the DOM-free logic that powers the media engine so it can
 * be unit tested in isolation and reused by the inline page script. It is
 * published as a UMD module: it attaches to `window.AuraEngine` in the browser
 * and exports via CommonJS under Node (for the test runner).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.AuraEngine = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // Default track catalogue shipped with the page.
  var tracksNetwork = [
    { title: "FE!N", artist: "Travis Scott ft. Playboi Carti", url: "https://actions.google.com/sounds/v1/science_fiction/ambient_space_machine.ogg", emoji: "🌵" },
    { title: "Magnolia", artist: "Playboi Carti", url: "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg", emoji: "🦋" },
    { title: "Bandit", artist: "Don Toliver", url: "https://actions.google.com/sounds/v1/ambiences/morning_birds.ogg", emoji: "🏴‍☠️" },
    { title: "Type Shit", artist: "Future x Metro Boomin", url: "https://actions.google.com/sounds/v1/cartoon/slide_whistle_up.ogg", emoji: "🦅" },
    { title: "After Hours", artist: "Don Toliver", url: "https://actions.google.com/sounds/v1/impacts/crash_metal_cinematic.ogg", emoji: "🔥" }
  ];

  var BACKGROUND_CARTI = "linear-gradient(180deg, #160000, #000000)";
  var BACKGROUND_SCOTT = "linear-gradient(180deg, #001c3d, #000a18)";
  var BACKGROUND_DEFAULT = "linear-gradient(180deg, #0b001a, #000000)";
  var DEFAULT_ART = "🎵";

  /**
   * Return the tracks whose title or artist contain the query (case-insensitive).
   * An empty/whitespace query matches every track.
   *
   * @param {Array<{title:string, artist:string}>} tracks
   * @param {string} query
   * @returns {Array} matching tracks (subset of the original array, order preserved)
   */
  function filterTracks(tracks, query) {
    if (!Array.isArray(tracks)) return [];
    var needle = String(query == null ? "" : query).toLowerCase();
    return tracks.filter(function (track) {
      if (!track) return false;
      var title = String(track.title == null ? "" : track.title).toLowerCase();
      var artist = String(track.artist == null ? "" : track.artist).toLowerCase();
      return title.indexOf(needle) !== -1 || artist.indexOf(needle) !== -1;
    });
  }

  /**
   * Resolve the phone-screen gradient based on the artist profile.
   *
   * @param {string} artist
   * @returns {string} a CSS gradient value
   */
  function resolvePhoneBackground(artist) {
    var name = String(artist == null ? "" : artist);
    if (name.indexOf("Carti") !== -1) return BACKGROUND_CARTI;
    if (name.indexOf("Scott") !== -1) return BACKGROUND_SCOTT;
    return BACKGROUND_DEFAULT;
  }

  /**
   * Compute the playback progress as a percentage (0-100).
   * Returns 0 for a missing/zero/invalid duration to avoid NaN/Infinity.
   *
   * @param {number} currentTime
   * @param {number} duration
   * @returns {number}
   */
  function computeProgressPercent(currentTime, duration) {
    var d = Number(duration);
    var t = Number(currentTime);
    if (!isFinite(d) || d <= 0 || !isFinite(t)) return 0;
    return (t / d) * 100;
  }

  /**
   * Resolve the artwork glyph for a track, falling back to a default note.
   *
   * @param {{emoji?:string}} track
   * @returns {string}
   */
  function resolveTrackArt(track) {
    if (track && track.emoji) return track.emoji;
    return DEFAULT_ART;
  }

  /**
   * Pick a random valid index for the "song of the day" match.
   * `rng` defaults to Math.random and must return a value in [0, 1).
   *
   * @param {number} length
   * @param {() => number} [rng]
   * @returns {number} an index in [0, length) or -1 when length <= 0
   */
  function pickSongOfTheDayIndex(length, rng) {
    var n = Number(length);
    if (!isFinite(n) || n <= 0) return -1;
    var random = typeof rng === "function" ? rng : Math.random;
    var r = Number(random());
    if (!isFinite(r) || r < 0) r = 0;
    if (r >= 1) r = 1 - 1e-12;
    return Math.floor(r * n);
  }

  /**
   * Whether the given catalogue index is the one currently on the deck.
   *
   * @param {number} originalIndex
   * @param {number} currentIndex
   * @returns {boolean}
   */
  function isTrackActive(originalIndex, currentIndex) {
    return originalIndex === currentIndex;
  }

  /**
   * Label shown on a search-result row depending on whether it is playing.
   *
   * @param {boolean} active
   * @returns {"ON DECK"|"STREAM"}
   */
  function rowStatusLabel(active) {
    return active ? "ON DECK" : "STREAM";
  }

  return {
    tracksNetwork: tracksNetwork,
    BACKGROUND_CARTI: BACKGROUND_CARTI,
    BACKGROUND_SCOTT: BACKGROUND_SCOTT,
    BACKGROUND_DEFAULT: BACKGROUND_DEFAULT,
    DEFAULT_ART: DEFAULT_ART,
    filterTracks: filterTracks,
    resolvePhoneBackground: resolvePhoneBackground,
    computeProgressPercent: computeProgressPercent,
    resolveTrackArt: resolveTrackArt,
    pickSongOfTheDayIndex: pickSongOfTheDayIndex,
    isTrackActive: isTrackActive,
    rowStatusLabel: rowStatusLabel
  };
});
