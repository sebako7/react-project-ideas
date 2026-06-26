import React, { useEffect, useRef, useState } from "react";
import "./HomePage.css";

const STORAGE_KEY = "counter-game-highscores";
const DURATIONS = [5, 10, 20];
const MAX_SCORES = 5;
const COOLDOWN_MS = 3000; // start button stays locked this long after a round

// Emoji rain shown when a new first-place high score is set.
const CONFETTI = ["🎉", "🎊", "⭐", "🏆", "✨", "🥳", "💥", "🎉", "⭐", "✨", "🎊", "🥳"];

// Random on-screen position (in %) for the runaway button in fun mode.
export function randomPos() {
  return { top: 15 + Math.random() * 65, left: 5 + Math.random() * 70 };
}

// Insert `count` into the score list at `key`, keep it sorted descending and
// capped at `max`. Returns a new scores object (pure; does not mutate input).
export function recordScore(scores, key, count, max) {
  return {
    ...scores,
    [key]: [...(scores[key] ?? []), count]
      .sort((a, b) => b - a)
      .slice(0, max),
  };
}

// True when `count` would take the very top of the `key` leaderboard, i.e. it
// strictly beats the current best (or there is no score for that key yet).
// Ties do not count as a new record.
export function isNewTopScore(scores, key, count) {
  return count > 0 && count > ((scores[key] ?? [])[0] ?? -Infinity);
}

export function loadScores() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const scores = {};
    // Keep any array-valued entries (keys like "5", "10", "fun-10", ...).
    for (const key of Object.keys(parsed)) {
      if (Array.isArray(parsed[key])) scores[key] = parsed[key];
    }
    return scores;
  } catch {
    return {};
  }
}

function saveScores(scores) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch {
    // ignore storage errors (e.g. private mode)
  }
}

function HomePage() {
  const [count, setCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const [duration, setDuration] = useState(10);
  const [funMode, setFunMode] = useState(false);
  const [pos, setPos] = useState(null); // {top, left} in %, or null
  const [scores, setScores] = useState(loadScores);
  const [celebrating, setCelebrating] = useState(false); // new-#1 animation
  const [cooldown, setCooldown] = useState(false); // start locked after a round
  const isRunning = timer !== 0;
  const roaming = isRunning && funMode;
  const scoreKey = funMode ? `fun-${duration}` : `${duration}`;
  const prevTimerRef = useRef(timer);
  const currentScores = scores[scoreKey] ?? [];

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isRunning]);

  // Record a score under its mode key when a round counts down to 0. At the
  // 1 -> 0 edge `scores` still holds the pre-insertion leaderboard, so it is
  // the right thing to compare against for a new first-place record.
  useEffect(() => {
    if (prevTimerRef.current === 1 && timer === 0) {
      // The round ran out of time (not a manual reset). Lock the start button
      // briefly so clicks still in flight don't immediately kick off a new round.
      setCooldown(true);
      if (count > 0) {
        if (isNewTopScore(scores, scoreKey, count)) setCelebrating(true);
        setScores((prev) => recordScore(prev, scoreKey, count, MAX_SCORES));
      }
    }
    prevTimerRef.current = timer;
  }, [timer, count, scoreKey, scores]);

  // Auto-dismiss the celebration once it has played through.
  useEffect(() => {
    if (!celebrating) return;
    const t = setTimeout(() => setCelebrating(false), 2600);
    return () => clearTimeout(t);
  }, [celebrating]);

  // Re-enable the start button once the post-round cooldown elapses.
  useEffect(() => {
    if (!cooldown) return;
    const t = setTimeout(() => setCooldown(false), COOLDOWN_MS);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Persist the high scores whenever they change.
  useEffect(() => {
    saveScores(scores);
  }, [scores]);

  return (
    <div className="home-container">
      {celebrating && (
        <div className="home-celebration" aria-live="polite">
          {CONFETTI.map((emoji, i) => (
            <span
              key={i}
              className="home-confetti"
              style={{
                left: `${(i + 0.5) * (100 / CONFETTI.length)}%`,
                animationDelay: `${i * 0.12}s`,
              }}
              aria-hidden="true"
            >
              {emoji}
            </span>
          ))}
          <div className="home-celebration-banner">🏆 New High Score! 🏆</div>
        </div>
      )}
      <div className="home-leaderboard">
        <div className="home-leaderboard-title">High Scores</div>
        <div className="home-leaderboard-subtitle">
          {duration}s {funMode ? "🎯" : ""}
        </div>
        {currentScores.length === 0 ? (
          <div className="home-leaderboard-empty">no scores yet</div>
        ) : (
          <ol className="home-leaderboard-list">
            {currentScores.map((score, i) => (
              <li key={i} className={celebrating && i === 0 ? "is-new" : ""}>
                <span className="home-leaderboard-rank">{i + 1}.</span>
                <span className="home-leaderboard-score">{score}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
      <div className="home-timer">timer:{timer}</div>
      <div className="home-count">{count}</div>
      <button
        type="button"
        role="switch"
        aria-checked={funMode}
        className={`home-fun-toggle ${funMode ? "is-on" : ""}`}
        onClick={() => setFunMode((v) => !v)}
        disabled={isRunning}
        title="Fun mode: the click-me button runs away on every click!"
      >
        <span className="home-fun-toggle-label">🎯 Fun Mode</span>
        <span className="home-fun-toggle-switch" aria-hidden="true">
          <span className="home-fun-toggle-knob" />
        </span>
      </button>
      <div className="home-durations">
        {DURATIONS.map((d) => (
          <button
            key={d}
            className={`home-btn-duration btn ${
              d === duration ? "is-active" : ""
            }`}
            onClick={() => setDuration(d)}
            disabled={isRunning}
          >
            {d}s
          </button>
        ))}
      </div>
      {/* Invisible spacer holds the layout steady while the button roams. */}
      {roaming && <div className="home-btn-spacer btn" aria-hidden="true" />}
      <button
        className={`${isRunning ? "home-btn-click" : "home-btn-start"} btn ${
          roaming ? "home-btn-roaming" : ""
        }`}
        disabled={!isRunning && cooldown}
        title={
          !isRunning && cooldown ? "hold on a sec…" : undefined
        }
        style={
          roaming && pos ? { top: `${pos.top}%`, left: `${pos.left}%` } : undefined
        }
        onClick={() => {
          if (isRunning) {
            setCount((prev) => prev + 1);
            if (funMode) setPos(randomPos());
          } else {
            setTimer(duration);
            setCount(0);
            setPos(funMode ? randomPos() : null);
            setCelebrating(false);
          }
        }}
      >
        {isRunning ? "click me" : "start"}
      </button>
      <button
        className="home-btn-reset btn"
        onClick={() => {
          setCount(0);
          setTimer(0);
          setPos(null);
          setCelebrating(false);
          setCooldown(false);
        }}
      >
        reset
      </button>
    </div>
  );
}

export default HomePage;
