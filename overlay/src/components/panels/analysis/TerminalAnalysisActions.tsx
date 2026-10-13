import { Button, Group, Stack, Text } from "@mantine/core";
import { useSetAtom } from "jotai";
import { useContext } from "react";
import { useStore } from "zustand";
import { TreeStateContext } from "@/components/common/TreeStateContext";
import { currentAnalysisTabAtom } from "@/state/atoms";
import { positionFromFen } from "@/utils/chessops";

export default function TerminalAnalysisActions() {
  const store = useContext(TreeStateContext)!;
  const fen = useStore(store, (s) => s.currentNode().fen);
  const canGoBack = useStore(store, (s) => s.position.length > 0);
  const hasMoves = useStore(store, (s) => s.root.children.length > 0);
  const setTab = useSetAtom(currentAnalysisTabAtom);
  const [pos] = positionFromFen(fen);
  return (
    <Stack align="center" my="lg" gap="sm">
      <Text>{pos?.isCheckmate() ? "将死" : pos?.isStalemate() ? "逼和" : "对局结束"}</Text>
      <Group gap="xs">
        {canGoBack && (
          <Button size="xs" variant="default" onClick={() => store.getState().goToPrevious()}>
            回看上一步
          </Button>
        )}
        {hasMoves && (
          <Button size="xs" variant="default" onClick={() => setTab("report")}>
            整盘分析
          </Button>
        )}
      </Group>
    </Stack>
  );
}
