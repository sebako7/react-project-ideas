import React, { useEffect, useState } from "react";
import "./HomePage.css";

function HomePage() {
  const [count, setCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const isRunning = timer !== 0;

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isRunning]);

  return (
    <div className="home-container">
      <div className="home-timer">timer:{timer}</div>
      <div className="home-count">{count}</div>
      <button
        className={`${isRunning ? "home-btn-click" : "home-btn-start"} btn`}
        onClick={() => {
          if (isRunning) {
            setCount((prev) => prev + 1);
          } else {
            setTimer(10);
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
