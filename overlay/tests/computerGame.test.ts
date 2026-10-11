import { expect, test } from "vitest";
import type { EngineConfig } from "@/bindings";
import type { LocalEngine } from "@/utils/engines";
import {
    computerPlayers,
    defaultComputerSetup,
    resultDescription,
    strengthCapabilities,
} from "@/components/boards/computerGame";

const engine: LocalEngine = {
    id: "sf",
    type: "local",
    name: "Stockfish",
    version: "18",
    path: "/test/stockfish",
    settings: [
        { name: "Skill Level", value: 0 },
        { name: "UCI_LimitStrength", value: false },
        { name: "MultiPV", value: 3 },
        { name: "Hash", value: 64 },
    ],
};
const config: EngineConfig = {
    name: "Stockfish 18",
    options: [
        { type: "spin", value: { name: "Skill Level", min: 0n, max: 20n, default: 20n } },
        { type: "spin", value: { name: "UCI_Elo", min: 1320n, max: 3190n, default: 1320n } },
        { type: "check", value: { name: "UCI_LimitStrength", default: false } },
        { type: "spin", value: { name: "MultiPV", min: 1n, max: 256n, default: 1n } },
        { type: "check", value: { name: "Ponder", default: false } },
    ],
};
function computer(strength: "elo" | "skill" | "full", elo = 1320, skill = 0) {
    const players = computerPlayers(
        { ...defaultComputerSetup, color: "white", strength, elo, skill },
        engine,
        config,
    );
    if (players.black.type !== "engine") throw Error("Expected computer");
    return Object.fromEntries(players.black.engineSettings!.map((o) => [o.name, o.value]));
}
test("reads advertised engine bounds and does not invent an Elo range", () => {
    expect(strengthCapabilities(config)).toEqual({
        elo: { min: 1320, max: 3190 },
        skill: { min: 0, max: 20 },
    });
    expect(strengthCapabilities({ name: "Other engine", options: [] })).toEqual({
        elo: undefined,
        skill: undefined,
    });
});
test("Elo difficulty enables actual limit strength and clears a stale skill setting", () => {
    expect(computer("elo", 1600)).toMatchObject({
        UCI_LimitStrength: true,
        UCI_Elo: 1600,
        "Skill Level": 20,
        MultiPV: 1,
        Ponder: false,
        Hash: 64,
    });
});
test("skill and full strength cannot inherit an Elo limit", () => {
    expect(computer("skill", 1320, 3)).toMatchObject({
        UCI_LimitStrength: false,
        "Skill Level": 3,
    });
    expect(computer("full")).toMatchObject({ UCI_LimitStrength: false, "Skill Level": 20 });
    expect(computer("skill")).not.toHaveProperty("UCI_Elo");
});
test("invalid and unsupported strengths are rejected before launching a game", () => {
    for (const elo of [600, 1319, 3191, NaN, 1400.5]) expect(() => computer("elo", elo)).toThrow();
    expect(() => computer("skill", 1320, -9)).toThrow();
    expect(() =>
        computerPlayers(defaultComputerSetup, engine, { name: "Other", options: [] }),
    ).toThrow();
});
test("computer settings are isolated from analysis settings", () => {
    const original = JSON.stringify(engine);
    computer("elo", 1600);
    computer("full");
    expect(JSON.stringify(engine)).toBe(original);
});
test("color and clocks apply to both players; unlimited still gives the engine a bounded search", () => {
    const players = computerPlayers(
        { ...defaultComputerSetup, color: "random", time: "15+10" },
        engine,
        config,
        () => 0.9,
    );
    expect(players.white.type).toBe("engine");
    expect(players.black.type).toBe("human");
    expect(players.white.timeControl).toEqual({ seconds: 900000, increment: 10000 });
    expect(players.black.timeControl).toEqual(players.white.timeControl);
    const unlimited = computerPlayers({ ...defaultComputerSetup, color: "white" }, engine, config);
    expect(unlimited.white.timeControl).toBeUndefined();
    expect(unlimited.black.timeControl).toBeUndefined();
    expect(unlimited.black).toMatchObject({ go: { t: "Time", c: 1000 } });
});
test("results explain mate, timeout, draw and abort", () => {
    expect(resultDescription({ type: "blackWins", reason: "checkmate" }, "white")).toBe(
        "电脑获胜 · 将死",
    );
    expect(resultDescription({ type: "whiteWins", reason: "timeout" }, "white")).toBe(
        "你赢了 · 超时",
    );
    expect(resultDescription({ type: "draw", reason: "stalemate" }, "black")).toBe("和棋 · 逼和");
    expect(resultDescription(null)).toBe("对局已中止");
});
