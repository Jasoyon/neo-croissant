import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { Provider } from "jotai";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { INITIAL_FEN } from "chessops/fen";
import BoardGame from "@/components/boards/BoardGame";
import { TreeStateProvider } from "@/components/common/TreeStateContext";

const backend = vi.hoisted(() => ({
  listeners: new Map<string, Function>(),
  state: null as any,
  config: null as any,
}));
vi.mock("@tauri-apps/plugin-log", () => ({ error: vi.fn() }));
vi.mock("@/utils/sound", () => ({ playSound: vi.fn() }));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (s: string) => s }) }));
vi.mock("swr/immutable", () => ({
  default: () => ({
    data: {
      name: "Stockfish",
      options: [
        { type: "spin", value: { name: "Skill Level", min: 0, max: 20, default: 20 } },
        { type: "spin", value: { name: "UCI_Elo", min: 1320, max: 3190, default: 1320 } },
        { type: "check", value: { name: "UCI_LimitStrength", default: false } },
        { type: "spin", value: { name: "MultiPV", min: 1, max: 256, default: 1 } },
      ],
    },
    isLoading: false,
  }),
}));
vi.mock("@/state/atoms", async () => {
  const { atom } = await import("jotai");
  const human = { type: "human", name: "Player" };
  return {
    activeTabAtom: atom("test"),
    enginesAtom: atom([
      {
        type: "local",
        id: "sf",
        name: "Stockfish",
        version: "18",
        path: "/test/stockfish",
        settings: [{ name: "Skill Level", value: 0 }],
      },
    ]),
    currentGameIdAtom: atom(null),
    currentGameStateAtom: atom("settingUp"),
    currentPlayersAtom: atom({ white: human, black: human }),
    gameInputColorAtom: atom("white"),
    gameOpeningBookEnabledAtom: atom(false),
    gameOpeningBookMaxPlyAtom: atom(20),
    gameOpeningBookPathAtom: atom(null),
    gamePlayer1SettingsAtom: atom(human),
    gamePlayer2SettingsAtom: atom(human),
    gameSameTimeControlAtom: atom(true),
    tabsAtom: atom([{ value: "test", type: "play", name: "test" }]),
  };
});
vi.mock("@/bindings", () => ({
  commands: {
    startGame: vi.fn(async (id, config) => {
      backend.config = config;
      backend.state = {
        gameId: id,
        status: "playing",
        initialFen: config.initialFen ?? "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves: [],
        whiteTime: config.whiteTimeControl?.initialTime ?? null,
        blackTime: config.blackTimeControl?.initialTime ?? null,
        whitePlayer: config.white.name,
        blackPlayer: config.black.name,
      };
      return { status: "ok", data: backend.state };
    }),
    getGameState: vi.fn(async () => ({ status: "ok", data: backend.state })),
    makeGameMove: vi.fn(async () => ({ status: "ok", data: backend.state })),
    takeBackGameMove: vi.fn(async () => ({ status: "ok", data: { ...backend.state, moves: [] } })),
    abortGame: vi.fn(async () => ({ status: "ok", data: null })),
    resignGame: vi.fn(async (id, color) => {
      const result = { type: color === "white" ? "blackWins" : "whiteWins", reason: "resignation" };
      backend.listeners.get("over")?.({ payload: { gameId: id, moves: backend.state.moves, result } });
      return { status: "ok", data: backend.state };
    }),
  },
  events: Object.fromEntries(
    [
      ["gameMoveEvent", "move"],
      ["clockUpdateEvent", "clock"],
      ["gameOverEvent", "over"],
    ].map(([name, key]) => [
      name,
      {
        listen: async (fn: Function) => {
          backend.listeners.set(key, fn);
          return () => backend.listeners.delete(key);
        },
      },
    ]),
  ),
}));
vi.mock("@/components/boards/Board", () => ({ default: () => <div>棋盘</div> }));
vi.mock("@/components/common/GameInfo", () => ({ default: () => null }));
vi.mock("@/components/common/GameNotation", () => ({ default: () => null }));
vi.mock("@/components/common/MoveControls", () => ({ default: () => null }));
vi.mock("@/components/boards/BoardControls", () => ({ default: () => null }));
vi.mock("@/components/boards/EditingCard", () => ({ default: () => null }));
vi.mock("@/components/boards/OpponentForm", () => ({ OpponentForm: () => null }));
vi.mock("@/components/common/EngineLogsView", () => ({ default: () => null }));
vi.mock("@/components/common/FileInput", () => ({ default: () => null }));
let root: Root;
async function click(text: string) {
  const button = [...document.querySelectorAll("button")].find((b) => b.textContent === text);
  expect(button, `Missing ${text}`).toBeTruthy();
  await act(async () => {
    button!.click();
    await new Promise((r) => setTimeout(r, 10));
  });
}
beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  }));
  for (const name of ["localStorage", "sessionStorage"]) {
    const data = new Map<string, string>();
    vi.stubGlobal(name, {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
      removeItem: (key: string) => data.delete(key),
      clear: () => data.clear(),
    });
  }
  backend.listeners.clear();
  vi.clearAllMocks();
  localStorage.setItem(
    "neo-computer-setup",
    JSON.stringify({
      engineId: "sf",
      strength: "elo",
      elo: 1500,
      skill: 0,
      color: "white",
      time: "5+3",
    }),
  );
  document.body.innerHTML =
    '<div id="left"></div><div id="topRight"></div><div id="bottomRight"></div><div id="root"></div>';
  root = createRoot(document.getElementById("root")!);
  await act(async () =>
    root.render(
      <Provider>
        <MantineProvider>
          <TreeStateProvider
            initial={{
              root: { fen: INITIAL_FEN, children: [], move: null } as any,
              headers: {} as any,
              position: [],
              dirty: false,
              report: {} as any,
            }}
          >
            <BoardGame />
          </TreeStateProvider>
        </MantineProvider>
      </Provider>,
    ),
  );
});
afterEach(async () => {
  await act(async () => root?.unmount());
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});
test("start applies Elo and clocks; resign leads to result, review and same-color rematch", async () => {
  const { commands } = await import("@/bindings");
  await click("Board.Opponent.StartGame");
  expect(backend.config.white.type).toBe("human");
  expect(backend.config.black.options).toEqual(
    expect.arrayContaining([
      { name: "UCI_Elo", value: "1500" },
      { name: "UCI_LimitStrength", value: "true" },
    ]),
  );
  expect(backend.config.blackTimeControl).toEqual({ initialTime: 300000, increment: 3000 });
  expect(backend.config.black.go).toEqual({ t: "Time", c: 1000 });
  expect(document.body.textContent).toContain("轮到你走棋");
  expect(document.body.textContent).not.toContain("复盘");
  const first = backend.state.gameId;
  await click("认输");
  expect(document.body.textContent).toContain("电脑获胜 · 认输");
  expect(document.body.textContent).toContain("复盘");
  await click("再来一局");
  expect(backend.state.gameId).not.toBe(first);
  expect(backend.config.initialMoves).toEqual([]);
  expect(backend.config.white.type).toBe("human");
  expect(commands.abortGame).toHaveBeenCalledWith(first);
  await click("认输");
  await click("交换黑白");
  expect(backend.config.white.type).toBe("engine");
  expect(backend.config.black.type).toBe("human");
});
test("failed engine launch stays on setup and exposes the error", async () => {
  const { commands } = await import("@/bindings");
  vi.mocked(commands.startGame).mockResolvedValueOnce({ status: "error", error: "无法启动引擎" });
  await click("Board.Opponent.StartGame");
  expect(document.body.textContent).toContain("无法启动引擎");
  expect(document.body.textContent).toContain("与电脑对弈");
  expect(document.body.textContent).not.toContain("认输");
});

test("takeback is available after moves and a rematch keeps the completed game", async () => {
  const {commands} = await import('@/bindings');
  await click('Board.Opponent.StartGame');
  async function moves() {
    backend.state.moves=[{uci:'e2e4',clock:null},{uci:'e7e5',clock:null}];
    await act(async()=>{backend.listeners.get('move')?.({payload:{...backend.state}});await new Promise(r=>setTimeout(r,180));});
  }
  await moves(); await click('悔棋');expect(commands.takeBackGameMove).toHaveBeenCalledWith(backend.state.gameId);
  await moves();await click('认输');
  const save = vi.spyOn(sessionStorage,'setItem');await click('再来一局');
  const preserved=save.mock.calls.map(([,value])=>JSON.parse(value)).find(v=>v.state?.root?.children?.length);
  expect(preserved.state.headers.result).toBe('0-1');expect(preserved.state.root.children[0].children).toHaveLength(1);
});
