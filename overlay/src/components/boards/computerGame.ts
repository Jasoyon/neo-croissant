import type { EngineConfig, GameResult } from "@/bindings";
import type { LocalEngine } from "@/utils/engines";
import type { OpponentSettings } from "./OpponentForm";

export type ComputerSetup = {
    engineId: string | null;
    strength: "elo" | "skill" | "full";
    elo: number;
    skill: number;
    color: "white" | "black" | "random";
    time: "unlimited" | "3+2" | "5+3" | "10+0" | "15+10";
};
export const defaultComputerSetup: ComputerSetup = {
    engineId: null,
    strength: "elo",
    elo: 1320,
    skill: 0,
    color: "random",
    time: "unlimited",
};
export function strengthCapabilities(config?: EngineConfig) {
    function spin(name: string) {
        const option = config?.options.find((o) => o.type === "spin" && o.value.name === name);
        if (option?.type !== "spin" || option.value.min == null || option.value.max == null)
            return undefined;
        return { min: Number(option.value.min), max: Number(option.value.max) };
    }
    return {
        elo: config?.options.some((o) => o.type === "check" && o.value.name === "UCI_LimitStrength")
            ? spin("UCI_Elo")
            : undefined,
        skill: spin("Skill Level"),
    };
}
export function computerPlayers(
    setup: ComputerSetup,
    engine: LocalEngine,
    config: EngineConfig,
    random = Math.random,
) {
    const capabilities = strengthCapabilities(config);
    const optionValues = new Map(
        (engine.settings ?? [])
            .filter(
                (o) =>
                    !["Skill Level", "UCI_LimitStrength", "UCI_Elo", "MultiPV", "Ponder"].includes(
                        o.name,
                    ),
            )
            .map((o) => [o.name, o.value]),
    );
    const supports = (name: string) => config.options.some((o) => o.value.name === name);
    const set = (name: string, value: string | number | boolean) => {
        if (supports(name)) optionValues.set(name, value);
    };
    set("MultiPV", 1);
    set("Ponder", false);
    set("UCI_LimitStrength", false);
    if (capabilities.skill) set("Skill Level", capabilities.skill.max);
    let label = "完整棋力";
    if (setup.strength !== "full") {
        const range = capabilities[setup.strength];
        const value = setup.strength === "elo" ? setup.elo : setup.skill;
        if (!range || !Number.isInteger(value) || value < range.min || value > range.max)
            throw new Error("所选棋力超出此引擎支持的范围，请重新选择。");
        if (setup.strength === "elo") {
            set("UCI_LimitStrength", true);
            set("UCI_Elo", value);
            label = `引擎 Elo ${value}`;
        } else {
            set("Skill Level", value);
            label = `等级 ${value}`;
        }
    }
    const [minutes, increment] =
        setup.time === "unlimited" ? [] : setup.time.split("+").map(Number);
    const timeControl =
        minutes == null ? undefined : { seconds: minutes * 60_000, increment: increment * 1000 };
    const human: OpponentSettings = { type: "human", name: "你", timeControl };
    const computer: OpponentSettings = {
        type: "engine",
        engine: { ...engine, name: `${engine.name} · ${label}` },
        engineSettings: [...optionValues].map(([name, value]) => ({ name, value })),
        go: { t: "Time", c: 1000 },
        timeControl,
    };
    const color = setup.color === "random" ? (random() < 0.5 ? "white" : "black") : setup.color;
    return color === "white"
        ? { white: human, black: computer }
        : { white: computer, black: human };
}
export function resultDescription(result: GameResult | null, humanColor?: "white" | "black") {
    if (!result) return "对局已中止";
    const reasons = {
        checkmate: "将死",
        timeout: "超时",
        resignation: "认输",
        abandonment: "引擎中断",
        stalemate: "逼和",
        insufficientMaterial: "子力不足",
        threefoldRepetition: "三次重复局面",
        fiftyMoveRule: "五十回合规则",
        agreement: "双方同意和棋",
    };
    const winner =
        result.type === "whiteWins" ? "white" : result.type === "blackWins" ? "black" : undefined;
    const title = !winner
        ? "和棋"
        : humanColor
          ? winner === humanColor
              ? "你赢了"
              : "电脑获胜"
          : winner === "white"
            ? "白方获胜"
            : "黑方获胜";
    return `${title} · ${reasons[result.reason]}`;
}
