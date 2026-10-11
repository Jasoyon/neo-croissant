import {
  Alert,
  Group,
  NumberInput,
  SegmentedControl,
  Select,
  Slider,
  Stack,
  Text,
} from "@mantine/core";
import { useEffect } from "react";
import type { EngineConfig } from "@/bindings";
import type { LocalEngine } from "@/utils/engines";
import { type ComputerSetup, strengthCapabilities } from "./computerGame";

export default function ComputerGameSetup({
  setup,
  onChange,
  engines,
  config,
  loading,
  error,
}: {
  setup: ComputerSetup;
  onChange: (value: ComputerSetup) => void;
  engines: LocalEngine[];
  config?: EngineConfig;
  loading: boolean;
  error?: string;
}) {
  const capabilities = strengthCapabilities(config);
  const range = setup.strength === "full" ? undefined : capabilities[setup.strength];
  const value = setup.strength === "elo" ? setup.elo : setup.skill;
  function update(patch: Partial<ComputerSetup>) {
    onChange({ ...setup, ...patch });
  }
  useEffect(() => {
    if (!config) return;
    let mode = setup.strength;
    if (mode !== "full" && !capabilities[mode])
      mode = capabilities.elo ? "elo" : capabilities.skill ? "skill" : "full";
    const elo = capabilities.elo
      ? Math.max(capabilities.elo.min, Math.min(capabilities.elo.max, setup.elo))
      : setup.elo;
    const skill = capabilities.skill
      ? Math.max(capabilities.skill.min, Math.min(capabilities.skill.max, setup.skill))
      : setup.skill;
    if (mode !== setup.strength || elo !== setup.elo || skill !== setup.skill)
      update({ strength: mode, elo, skill });
  }, [config, setup]);
  return (
    <Stack gap="lg">
      <Text fw={600}>与电脑对弈</Text>
      <Select
        label="引擎"
        data={engines.map((e) => ({ value: e.id, label: e.name }))}
        value={setup.engineId}
        allowDeselect={false}
        onChange={(id) => update({ engineId: id })}
        placeholder="请先添加本地引擎"
      />
      {loading && <Text size="sm">读取引擎…</Text>}
      {error && <Alert color="red">{error}</Alert>}
      {!engines.length && <Alert color="yellow">请先在“引擎”中添加一个本地引擎。</Alert>}
      {config && (
        <Stack gap="sm">
          <Text fw={600}>难度</Text>
          <SegmentedControl
            value={setup.strength}
            onChange={(v) => update({ strength: v as ComputerSetup["strength"] })}
            data={[
              ...(capabilities.elo ? [{ value: "elo", label: "Elo" }] : []),
              ...(capabilities.skill ? [{ value: "skill", label: "引擎等级" }] : []),
              { value: "full", label: "最高强度" },
            ]}
          />
          {range && (
            <>
              <Group justify="space-between">
                <Text fw={700}>
                  {setup.strength === "elo" ? `引擎 Elo ${value}` : `等级 ${value}`}
                </Text>
                <NumberInput
                  aria-label="难度数值"
                  w={130}
                  min={range.min}
                  max={range.max}
                  allowDecimal={false}
                  value={value}
                  onChange={(v) =>
                    typeof v === "number" &&
                    update(setup.strength === "elo" ? { elo: v } : { skill: v })
                  }
                />
              </Group>
              <Slider
                aria-label="难度"
                min={range.min}
                max={range.max}
                step={1}
                value={value}
                onChange={(v) => update(setup.strength === "elo" ? { elo: v } : { skill: v })}
                marks={[
                  { value: range.min, label: String(range.min) },
                  { value: range.max, label: String(range.max) },
                ]}
                mb="sm"
              />
              <Text size="xs" c="dimmed">
                {setup.strength === "elo"
                  ? "引擎等级分，不等同于网站等级分。"
                  : "数值越低，难度越低。"}
              </Text>
            </>
          )}
          {setup.strength === "full" && (
            <Text size="sm" c="dimmed">
              不限制棋力。
            </Text>
          )}
        </Stack>
      )}
      <Stack gap="xs">
        <Text fw={600}>执子</Text>
        <SegmentedControl
          value={setup.color}
          onChange={(v) => update({ color: v as ComputerSetup["color"] })}
          data={[
            { value: "white", label: "执白" },
            { value: "random", label: "随机" },
            { value: "black", label: "执黑" },
          ]}
        />
      </Stack>
      <Select
        label="用时"
        value={setup.time}
        allowDeselect={false}
        onChange={(v) => v && update({ time: v as ComputerSetup["time"] })}
        data={[
          { value: "unlimited", label: "不限时" },
          { value: "3+2", label: "3 分钟 + 每步 2 秒" },
          { value: "5+3", label: "5 分钟 + 每步 3 秒" },
          { value: "10+0", label: "10 分钟" },
          { value: "15+10", label: "15 分钟 + 每步 10 秒" },
        ]}
      />
    </Stack>
  );
}
