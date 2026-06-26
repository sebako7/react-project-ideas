import React, { useEffect, useRef, useState } from "react";
import "./HomePage.css";

const STORAGE_KEY = "counter-game-highscores";
const DURATIONS = [5, 10, 20];
const MAX_SCORES = 5;

function emptyScores() {
  return DURATIONS.reduce((acc, d) => ({ ...acc, [d]: [] }), {});
}

function loadScores() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const scores = emptyScores();
    for (const d of DURATIONS) {
      if (Array.isArray(parsed[d])) scores[d] = parsed[d];
    }
    return scores;
  } catch {
    return emptyScores();
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
  const [scores, setScores] = useState(loadScores);
  const isRunning = timer !== 0;
  const prevTimerRef = useRef(timer);
  const currentScores = scores[duration] ?? [];

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isRunning]);

  // Record a score under its duration when a round counts down to 0.
  useEffect(() => {
    if (prevTimerRef.current === 1 && timer === 0 && count > 0) {
      setScores((prev) => ({
        ...prev,
        [duration]: [...prev[duration], count]
          .sort((a, b) => b - a)
          .slice(0, MAX_SCORES),
      }));
    }
    prevTimerRef.current = timer;
  }, [timer, count, duration]);

  // Persist the high scores whenever they change.
  useEffect(() => {
    saveScores(scores);
  }, [scores]);

  return (
    <div className="home-container">
      <div className="home-leaderboard">
        <div className="home-leaderboard-title">High Scores</div>
        <div className="home-leaderboard-subtitle">{duration}s</div>
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
      <button
        className={`${isRunning ? "home-btn-click" : "home-btn-start"} btn`}
        onClick={() => {
          if (isRunning) {
            setCount((prev) => prev + 1);
          } else {
            setTimer(duration);
            setCount(0);
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
        }}
      >
        reset
      </button>
    </div>
  );
}

export default HomePage;
