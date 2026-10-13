import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, test, vi } from "vitest";
import { INITIAL_FEN } from "chessops/fen";
import { useGameHint } from "@/components/boards/useGameHint";
const mocks = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("@/bindings", () => ({
  commands: {
    getEngineConfig: vi.fn(async () => ({ status: "ok", data: { name: "sf", options: [] } })),
  },
}));
vi.mock("@/utils/gameHint", async (original) => ({
  ...(await original<any>()),
  requestGameHint: mocks.request,
}));
let root: Root;
let state: ReturnType<typeof useGameHint>;
const engine = { id: "sf", type: "local" as const, name: "sf", version: "18", path: "/sf" };
function Harness({ fen, scope, enabled }: { fen: string; scope: string; enabled: boolean }) {
  state = useGameHint(engine, fen, scope, enabled);
  return <div>{state.hint?.san}</div>;
}
async function render(fen = INITIAL_FEN, scope = "one", enabled = true) {
  if (!root) {
    document.body.innerHTML = '<div id="root"/>';
    root = createRoot(document.getElementById("root")!);
  }
  await act(async () => root.render(<Harness fen={fen} scope={scope} enabled={enabled} />));
}
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  root = undefined as any;
  vi.clearAllMocks();
  document.body.replaceChildren();
});
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
test("hint runs only on request, can be hidden, and clears after a move", async () => {
  mocks.request.mockResolvedValue("e2e4");
  await render();
  expect(mocks.request).not.toHaveBeenCalled();
  await act(async () => state.request());
  expect(state.hint?.shape).toMatchObject({ orig: "e2", dest: "e4" });
  await act(async () => state.request());
  expect(state.hint).toBeNull();
  expect(mocks.request).toHaveBeenCalledTimes(1);
  await act(async () => state.request());
  await render(INITIAL_FEN, "one", false);
  expect(state.hint).toBeNull();
});
test("late reply from a previous game or turn cannot draw on the current board", async () => {
  let finish!: (value: string) => void;
  mocks.request.mockImplementation(() => new Promise((resolve) => (finish = resolve)));
  await render();
  let pending!: Promise<void>;
  await act(async () => {
    pending = state.request();
  });
  await render(INITIAL_FEN, "two");
  await act(async () => {
    finish("e2e4");
    await pending;
  });
  expect(state.hint).toBeNull();
  expect(state.loading).toBe(false);
});
test("errors clear the loading state and allow retry", async () => {
  mocks.request.mockRejectedValueOnce(Error("引擎中断")).mockResolvedValue("d2d4");
  await render();
  await act(async () => state.request());
  expect(state.error).toContain("引擎中断");
  expect(state.loading).toBe(false);
  await act(async () => state.request());
  expect(state.hint?.san).toBe("d4");
  expect(state.error).toBeNull();
});
