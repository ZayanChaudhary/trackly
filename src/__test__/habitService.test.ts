import {
  calcLevel,
  getXPRequiredForLevel,
  calcXPearned,
  getCurrentLevelProgress,
} from "../../src/services/habitService";

describe("getXPRequiredForLevel", () => {
  test("Level 1 requires 100 XP", () => {
    expect(getXPRequiredForLevel(1)).toBe(100);
  });
  test("Level 5 requires 500 XP", () => {
    expect(getXPRequiredForLevel(5)).toBe(500);
  });
  test("Level 10 requires 1000 XP", () => {
    expect(getXPRequiredForLevel(10)).toBe(1000);
  });
});

describe("calcLevel", () => {
  test("0 XP returns level 1", () => {
    expect(calcLevel(0)).toBe(1);
  });
  test("100 XP exactly reaches level 2", () => {
    expect(calcLevel(100)).toBe(2);
  });
  test("300 XP reaches level 3", () => {
    expect(calcLevel(300)).toBe(3);
  });
});

describe("calcXPearned", () => {
  test("Streak 0 returns XP between 8 and 15", () => {
    for (let i = 0; i < 50; i++) {
      const xp = calcXPearned(0);
      expect(xp).toBeGreaterThanOrEqual(8);
      expect(xp).toBeLessThanOrEqual(15);
    }
  });
  test("Streak 7 returns XP between 15 and 35", () => {
    for (let i = 0; i < 50; i++) {
      const xp = calcXPearned(7);
      expect(xp).toBeGreaterThanOrEqual(15);
      expect(xp).toBeLessThanOrEqual(35);
    }
  });
  test("Streak 30 returns XP between 30 and 70", () => {
    for (let i = 0; i < 50; i++) {
      const xp = calcXPearned(30);
      expect(xp).toBeGreaterThanOrEqual(30);
      expect(xp).toBeLessThanOrEqual(70);
    }
  });
  test("Streak 100 returns XP between 50 and 120", () => {
    for (let i = 0; i < 50; i++) {
      const xp = calcXPearned(100);
      expect(xp).toBeGreaterThanOrEqual(50);
      expect(xp).toBeLessThanOrEqual(120);
    }
  });
});

describe("getCurrentLevelProgress", () => {
  test("50 XP shows correct progress within level 1", () => {
    const { currentXP, neededXP } = getCurrentLevelProgress(50);
    expect(currentXP).toBe(50);
    expect(neededXP).toBe(100);
  });
  test("Progress resets correctly after level up", () => {
    const { currentXP, neededXP } = getCurrentLevelProgress(150);
    expect(currentXP).toBe(50);
    expect(neededXP).toBe(200);
  });
});
