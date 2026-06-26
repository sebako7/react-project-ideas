import React from "react";
import { render, screen, act, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HomePage, {
  randomPos,
  recordScore,
  loadScores,
  isNewTopScore,
} from "./HomePage";

const STORAGE_KEY = "counter-game-highscores";

describe("randomPos", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns an object with numeric top and left fields", () => {
    const pos = randomPos();

    expect(pos).toEqual({
      top: expect.any(Number),
      left: expect.any(Number),
    });
    // exactly these two keys, nothing else
    expect(Object.keys(pos).sort()).toEqual(["left", "top"]);
  });

  it("keeps top within [15, 80] and left within [5, 75] across many samples", () => {
    for (let i = 0; i < 1000; i++) {
      const { top, left } = randomPos();
      expect(top).toBeGreaterThanOrEqual(15);
      expect(top).toBeLessThanOrEqual(80);
      expect(left).toBeGreaterThanOrEqual(5);
      expect(left).toBeLessThanOrEqual(75);
    }
  });

  it("returns the minimum bounds when Math.random() is 0", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);

    expect(randomPos()).toEqual({ top: 15, left: 5 });
  });

  it("approaches the maximum bounds when Math.random() ~ 1", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.999999);

    const { top, left } = randomPos();
    // top max is 15 + 65 = 80, left max is 5 + 70 = 75
    expect(top).toBeGreaterThan(79.9);
    expect(top).toBeLessThanOrEqual(80);
    expect(left).toBeGreaterThan(74.9);
    expect(left).toBeLessThanOrEqual(75);
  });
});

describe("recordScore", () => {
  it("inserts a score under a new key", () => {
    const next = recordScore({}, "10", 7, 5);

    expect(next).toEqual({ "10": [7] });
  });

  it("appends to an existing key and sorts descending", () => {
    const next = recordScore({ "10": [9, 4] }, "10", 6, 5);

    expect(next["10"]).toEqual([9, 6, 4]);
  });

  it("caps the list at `max`, keeping the highest scores", () => {
    const next = recordScore({ "10": [5, 4, 3, 2, 1] }, "10", 10, 5);

    expect(next["10"]).toEqual([10, 5, 4, 3, 2]);
    expect(next["10"]).toHaveLength(5);
  });

  it("drops the new score if it does not make the top `max`", () => {
    const next = recordScore({ "10": [100, 90, 80, 70, 60] }, "10", 1, 5);

    expect(next["10"]).toEqual([100, 90, 80, 70, 60]);
  });

  it("does not mutate the input object", () => {
    const input = { "10": [9] };
    const snapshot = JSON.parse(JSON.stringify(input));

    recordScore(input, "10", 5, 5);

    expect(input).toEqual(snapshot);
  });

  it("writes to a separate key without touching other keys", () => {
    const next = recordScore({ "10": [9] }, "fun-10", 3, 5);

    expect(next).toEqual({ "10": [9], "fun-10": [3] });
  });
});

describe("isNewTopScore", () => {
  it("is true for the first score under a key", () => {
    expect(isNewTopScore({}, "10", 1)).toBe(true);
    expect(isNewTopScore({ "10": [] }, "10", 1)).toBe(true);
  });

  it("is true when the count strictly beats the current best", () => {
    expect(isNewTopScore({ "10": [9, 4] }, "10", 10)).toBe(true);
  });

  it("is false when the count ties the current best", () => {
    expect(isNewTopScore({ "10": [9, 4] }, "10", 9)).toBe(false);
  });

  it("is false when the count does not beat the current best", () => {
    expect(isNewTopScore({ "10": [9, 4] }, "10", 5)).toBe(false);
  });

  it("is false for a non-positive count", () => {
    expect(isNewTopScore({}, "10", 0)).toBe(false);
  });

  it("compares only against the matching key", () => {
    expect(isNewTopScore({ "10": [50] }, "fun-10", 3)).toBe(true);
  });
});

describe("loadScores", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns an empty object when nothing is stored", () => {
    expect(loadScores()).toEqual({});
  });

  it("round-trips array-valued entries from localStorage", () => {
    const stored = { "10": [9, 4], "fun-5": [3] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    expect(loadScores()).toEqual(stored);
  });

  it("keeps only array-valued keys, dropping non-array entries", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ "10": [9], bogus: "nope", count: 42, nested: { a: 1 } })
    );

    expect(loadScores()).toEqual({ "10": [9] });
  });

  it("returns an empty object when stored JSON is malformed", () => {
    localStorage.setItem(STORAGE_KEY, "{not valid json");

    expect(loadScores()).toEqual({});
  });
});

describe("HomePage component", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Flush any pending timers and restore real timers between tests.
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  // user-event v13 exposes top-level click() (no setup()). Wrap clicks in act()
  // so React state updates flush while fake timers are active.
  function click(el) {
    act(() => {
      userEvent.click(el);
    });
  }

  // Click the main button `clicks` times, then let the round time out.
  function playRound({ duration, clicks }) {
    // The main start/click button is the one labelled "start" while idle.
    let startBtn = screen.getByRole("button", { name: "start" });
    // After a previous round the start button is locked for a cooldown; wait it
    // out so a fresh round can begin.
    if (startBtn.disabled) {
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      startBtn = screen.getByRole("button", { name: "start" });
    }
    click(startBtn); // timer = duration, count = 0, label -> "click me"

    const clickBtn = screen.getByRole("button", { name: "click me" });
    for (let i = 0; i < clicks; i++) {
      click(clickBtn);
    }
    // Advance one tick at a time so each 1s decrement renders separately.
    // This matters: the score-recording effect watches a ref for the exact
    // 1 -> 0 edge, which is only observable if ticks are not batched together.
    for (let i = 0; i < duration; i++) {
      act(() => {
        jest.advanceTimersByTime(1000);
      });
    }
  }

  function getLeaderboardScores() {
    const list = screen.queryByRole("list");
    if (!list) return [];
    return within(list)
      .getAllByRole("listitem")
      .map((li) =>
        Number(li.querySelector(".home-leaderboard-score").textContent)
      );
  }

  it("renders the idle UI with no scores", () => {
    render(<HomePage />);

    expect(screen.getByText("timer:0")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "start" })).toBeInTheDocument();
    expect(screen.getByText("no scores yet")).toBeInTheDocument();
  });

  it("records the final count under the duration key when a round ends", () => {
    render(<HomePage />);

    // default duration is 10
    playRound({ duration: 10, clicks: 3 });

    expect(getLeaderboardScores()).toEqual([3]);

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(persisted).toEqual({ "10": [3] });
  });

  it("sorts recorded scores descending across multiple rounds", () => {
    render(<HomePage />);

    playRound({ duration: 10, clicks: 2 });
    playRound({ duration: 10, clicks: 5 });
    playRound({ duration: 10, clicks: 4 });

    expect(getLeaderboardScores()).toEqual([5, 4, 2]);
  });

  it("caps the leaderboard at 5, keeping the top 5", () => {
    render(<HomePage />);

    for (const clicks of [1, 2, 3, 4, 5, 6]) {
      playRound({ duration: 10, clicks });
    }

    expect(getLeaderboardScores()).toEqual([6, 5, 4, 3, 2]);
    expect(getLeaderboardScores()).toHaveLength(5);
  });

  it("does NOT record a round that ends with a count of 0", () => {
    render(<HomePage />);

    playRound({ duration: 10, clicks: 0 });

    expect(getLeaderboardScores()).toEqual([]);
    expect(screen.getByText("no scores yet")).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBe(
      JSON.stringify({}) // saveScores persisted the (empty) scores object
    );
  });

  it("celebrates when a round sets a new first-place high score", () => {
    render(<HomePage />);

    // First score of the session is, by definition, a new #1.
    playRound({ duration: 10, clicks: 3 });

    expect(
      screen.getByText(/new high score/i)
    ).toBeInTheDocument();
  });

  it("does NOT celebrate a round that fails to beat the current best", () => {
    render(<HomePage />);

    playRound({ duration: 10, clicks: 5 }); // sets the record
    playRound({ duration: 10, clicks: 3 }); // doesn't beat it

    expect(screen.queryByText(/new high score/i)).not.toBeInTheDocument();
  });

  it("locks the start button for a cooldown after a round ends, then re-enables it", () => {
    render(<HomePage />);

    playRound({ duration: 10, clicks: 2 });

    // Immediately after the round the start button is disabled...
    expect(screen.getByRole("button", { name: "start" })).toBeDisabled();

    // ...and comes back after the cooldown elapses.
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(screen.getByRole("button", { name: "start" })).toBeEnabled();
  });

  it("applies the cooldown even when the round scored zero", () => {
    render(<HomePage />);

    playRound({ duration: 10, clicks: 0 });

    expect(screen.getByRole("button", { name: "start" })).toBeDisabled();
  });

  it("clears the cooldown immediately when reset is pressed", () => {
    render(<HomePage />);

    playRound({ duration: 10, clicks: 2 });
    expect(screen.getByRole("button", { name: "start" })).toBeDisabled();

    click(screen.getByRole("button", { name: "reset" }));
    expect(screen.getByRole("button", { name: "start" })).toBeEnabled();
  });

  it("stores fun-mode scores under a separate key without polluting the normal list", () => {
    render(<HomePage />);

    // Normal round at duration 10.
    playRound({ duration: 10, clicks: 3 });
    expect(getLeaderboardScores()).toEqual([3]);

    // Turn on fun mode (only allowed while idle) and play another round.
    click(screen.getByRole("switch", { name: /fun mode/i }));
    playRound({ duration: 10, clicks: 7 });

    // The visible leaderboard now reflects the fun-10 key.
    expect(getLeaderboardScores()).toEqual([7]);

    // Persistence keeps the two keys separate.
    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(persisted).toEqual({ "10": [3], "fun-10": [7] });
  });
});
