import React, { useEffect, useRef, useState } from "react";
import "./HomePage.css";

const STORAGE_KEY = "counter-game-highscores";
const DURATIONS = [5, 10, 20];
const MAX_SCORES = 5;

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

  // Record a score under its mode key when a round counts down to 0.
  useEffect(() => {
    if (prevTimerRef.current === 1 && timer === 0 && count > 0) {
      setScores((prev) => recordScore(prev, scoreKey, count, MAX_SCORES));
    }
    prevTimerRef.current = timer;
  }, [timer, count, scoreKey]);

  // Persist the high scores whenever they change.
  useEffect(() => {
    saveScores(scores);
  }, [scores]);

  return (
    <div className="home-container">
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
              <li key={i}>
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
        }}
      >
        reset
      </button>
    </div>
  );
}

export default HomePage;
