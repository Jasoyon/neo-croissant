import { useEffect, useRef, useState } from "react";
import { commands } from "@/bindings";
import type { LocalEngine } from "@/utils/engines";
import { hintShape, requestGameHint } from "@/utils/gameHint";
import { unwrap } from "@/utils/unwrap";

export function useGameHint(
    engine: LocalEngine | null,
    fen: string,
    scope: string,
    enabled: boolean,
) {
    const [result, setResult] = useState<{
        key: string;
        value: NonNullable<ReturnType<typeof hintShape>>;
    } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const generation = useRef(0);
    const inFlight = useRef(false);
    const key = `${scope}:${fen}:${engine?.path}:${enabled}`;
    const latest = useRef(key);
    latest.current = key;
    useEffect(() => {
        generation.current++;
        inFlight.current = false;
        setResult(null);
        setLoading(false);
        setError(null);
        return () => {
            generation.current++;
        };
    }, [key]);
    async function request() {
        if (!enabled || !engine || inFlight.current) return;
        if (result?.key === key) {
            setResult(null);
            return;
        }
        const version = ++generation.current;
        inFlight.current = true;
        setLoading(true);
        setError(null);
        try {
            const config = unwrap(await commands.getEngineConfig(engine.path));
            if (version !== generation.current || latest.current !== key) return;
            const uci = await requestGameHint(engine, config, fen);
            if (version !== generation.current || latest.current !== key) return;
            const value = uci && hintShape(fen, uci);
            if (!value) throw Error("暂无提示");
            setResult({ key, value });
        } catch (err) {
            if (version === generation.current && latest.current === key) setError(String(err));
        } finally {
            if (version === generation.current) {
                inFlight.current = false;
                setLoading(false);
            }
        }
    }
    return { hint: enabled && result?.key === key ? result.value : null, loading, error, request };
}
