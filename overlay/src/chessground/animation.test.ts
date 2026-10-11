import { afterEach, expect, test, vi } from "vitest";
import { anim } from "@lichess-org/chessground/anim";
import { defaults, type State } from "@lichess-org/chessground/state";
import { read } from "@lichess-org/chessground/fen";

function setup(fen: string) {
  let frame: FrameRequestCallback = () => {};
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => { frame = cb; return 1; });
  vi.spyOn(performance, "now").mockReturnValue(100);
  const state = { ...defaults(), pieces: read(fen), dom: { redraw: vi.fn(), redrawNow: vi.fn(), destroyed: false } } as unknown as State;
  state.animation.duration = 180;
  return { state, tick: (time: number) => frame(time) };
}
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
test("move is 50% complete at halfway and finishes exactly at 180ms", () => {
  const {state, tick} = setup("8/8/8/8/8/8/4P3/8");
  anim(s => { s.pieces = read("8/8/8/8/4P3/8/8/8"); }, state);
  expect(state.animation.current?.plan.anims.get("e4")?.[3]).toBe(-2);
  tick(190);
  expect(state.animation.current?.plan.anims.get("e4")?.[3]).toBeCloseTo(-1);
  tick(280);
  expect(state.animation.current).toBeUndefined();
  expect(state.pieces.has("e4")).toBe(true);
});
test("capture retains correct board and captured-piece plan", () => {
  const {state, tick} = setup("8/8/8/3p4/4P3/8/8/8");
  anim(s => { s.pieces = read("8/8/8/3P4/8/8/8/8"); }, state);
  expect(state.animation.current?.plan.fadings.get("d5")?.color).toBe("black");
  tick(280);
  expect(state.pieces.size).toBe(1);
  expect(state.pieces.get("d5")?.color).toBe("white");
});
test("king and rook animate together when castling", () => {
  const {state} = setup("8/8/8/8/8/8/8/4K2R");
  anim(s => { s.pieces = read("8/8/8/8/8/8/8/5RK1"); }, state);
  expect([...state.animation.current!.plan.anims.keys()].sort()).toEqual(["f1", "g1"]);
});
test("disabled animation respects board editing", () => {
  const {state} = setup("8/8/8/8/8/8/4P3/8");
  state.animation.enabled = false;
  anim(s => { s.pieces = read("8/8/8/8/4P3/8/8/8"); }, state);
  expect(state.animation.current).toBeUndefined();
});
