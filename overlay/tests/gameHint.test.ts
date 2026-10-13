import { expect, test } from "vitest";
import { INITIAL_FEN } from "chessops/fen";
import { analysisOptions, hintShape } from "@/utils/gameHint";
import type { EngineConfig } from "@/bindings";
import type { LocalEngine } from "@/utils/engines";
const config: EngineConfig = {
    name: "Stockfish",
    options: [
        { type: "spin", value: { name: "Skill Level", min: 0n, max: 20n } },
        { type: "spin", value: { name: "Threads", min: 1n, max: 1024n } },
        { type: "spin", value: { name: "Hash", min: 1n, max: 1024n } },
        { type: "spin", value: { name: "MultiPV", min: 1n, max: 256n } },
        { type: "check", value: { name: "UCI_LimitStrength" } },
    ],
};
test("hints and review use full strength without changing opponent or global settings", () => {
    const engine: LocalEngine = {
        id: "sf",
        type: "local",
        name: "Stockfish",
        version: "18",
        path: "/sf",
        settings: [
            { name: "Skill Level", value: 0 },
            { name: "UCI_LimitStrength", value: true },
            { name: "UCI_Elo", value: 1320 },
        ],
    };
    const original = JSON.stringify(engine);
    expect(
        Object.fromEntries(analysisOptions(engine, config).map((o) => [o.name, o.value])),
    ).toMatchObject({
        "Skill Level": "20",
        UCI_LimitStrength: "false",
        MultiPV: "1",
        Threads: "2",
        Hash: "64",
    });
    expect(analysisOptions(engine, config).some((o) => o.name === "UCI_Elo")).toBe(false);
    expect(JSON.stringify(engine)).toBe(original);
});
test("arrow uses legal board squares, including castling and promotion", () => {
    expect(hintShape(INITIAL_FEN, "e2e4")).toEqual({
        shape: { orig: "e2", dest: "e4", brush: "green" },
        san: "e4",
    });
    expect(hintShape(INITIAL_FEN, "e7e5")).toBeNull();
    expect(hintShape(INITIAL_FEN, "bad")).toBeNull();
    expect(hintShape("4k3/8/8/8/8/8/8/4K2R w K - 0 1", "e1h1")?.shape.dest).toBe("g1");
    expect(hintShape("4k3/P7/8/8/8/8/8/4K3 w - - 0 1", "a7a8q")?.san).toContain("=Q");
});
