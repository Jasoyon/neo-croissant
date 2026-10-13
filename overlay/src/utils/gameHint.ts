import { invoke } from "@tauri-apps/api/core";
import type { DrawShape } from "@lichess-org/chessground/draw";
import { makeSquare, parseUci } from "chessops";
import { castlingSide } from "chessops/chess";
import { makeSan } from "chessops/san";
import type { EngineConfig, EngineOption } from "@/bindings";
import type { LocalEngine } from "./engines";
import { positionFromFen } from "./chessops";

export function analysisOptions(engine: LocalEngine, config: EngineConfig): EngineOption[] {
    const values = new Map(
        (engine.settings ?? [])
            .filter(
                (o) =>
                    ![
                        "UCI_Elo",
                        "UCI_LimitStrength",
                        "Skill Level",
                        "MultiPV",
                        "Ponder",
                        "Threads",
                        "Hash",
                    ].includes(o.name),
            )
            .map((o) => [o.name, String(o.value ?? "")]),
    );
    for (const [name, value] of [
        ["UCI_LimitStrength", false],
        ["Ponder", false],
    ] as const)
        if (config.options.some((o) => o.value.name === name)) values.set(name, String(value));
    for (const [name, desired] of [
        ["Skill Level", Infinity],
        ["MultiPV", 1],
        ["Threads", 2],
        ["Hash", 64],
    ] as const) {
        const o = config.options.find((o) => o.type === "spin" && o.value.name === name);
        if (o?.type === "spin" && o.value.min != null && o.value.max != null)
            values.set(
                name,
                String(Math.max(Number(o.value.min), Math.min(Number(o.value.max), desired))),
            );
    }
    return [...values].map(([name, value]) => ({ name, value }));
}
export function hintShape(fen: string, uci: string): { shape: DrawShape; san: string } | null {
    const [pos] = positionFromFen(fen);
    const move = parseUci(uci);
    if (!pos || !move || !("from" in move) || !pos.isLegal(move)) return null;
    const castle = castlingSide(pos, move);
    const to = castle ? (pos.turn === "white" ? 0 : 56) + (castle === "h" ? 6 : 2) : move.to;
    return {
        shape: { orig: makeSquare(move.from), dest: makeSquare(to), brush: "green" },
        san: makeSan(pos, move),
    };
}
export function requestGameHint(engine: LocalEngine, config: EngineConfig, fen: string) {
    return invoke<string | null>("get_game_hint", {
        engine: engine.path,
        fen,
        options: analysisOptions(engine, config),
    });
}
