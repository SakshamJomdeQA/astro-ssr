import { useState } from "react";

interface CounterProps {
  initialCount?: number;
  step?: number;
  label?: string;
}

export default function Counter({
  initialCount = 0,
  step = 1,
  label = "Counter",
}: CounterProps) {
  const [count, setCount] = useState(initialCount);
  const [history, setHistory] = useState<number[]>([initialCount]);

  const update = (delta: number) => {
    const next = count + delta;
    setCount(next);
    setHistory((h) => [...h.slice(-9), next]);
  };

  const reset = () => {
    setCount(initialCount);
    setHistory([initialCount]);
  };

  return (
    <div style={{ fontFamily: "var(--font-sans, system-ui)" }}>
      <div
        style={{
          background: "var(--color-surface-2, #1c1c28)",
          border: "1px solid var(--color-border, #2a2a3d)",
          borderRadius: "16px",
          padding: "2rem",
          maxWidth: "380px",
        }}
      >
        {/* Label */}
        <div
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-text-muted, #8888a8)",
            marginBottom: "1rem",
          }}
        >
          ⚛️ React Island · {label}
        </div>

        {/* Count display */}
        <div
          style={{
            fontSize: "4.5rem",
            fontWeight: 800,
            textAlign: "center",
            color: count > 0 ? "#10b981" : count < 0 ? "#ef4444" : "#fff",
            lineHeight: 1,
            marginBottom: "1.5rem",
            fontVariantNumeric: "tabular-nums",
            transition: "color 0.2s",
          }}
        >
          {count > 0 && "+"}
          {count}
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
          <button
            onClick={() => update(-step)}
            style={{
              flex: 1,
              padding: "0.65rem",
              borderRadius: "10px",
              border: "1px solid #2a2a3d",
              background: "rgba(239, 68, 68, 0.1)",
              color: "#fc8181",
              fontSize: "1.25rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.background =
                "rgba(239, 68, 68, 0.2)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background =
                "rgba(239, 68, 68, 0.1)";
            }}
          >
            −{step}
          </button>
          <button
            onClick={reset}
            style={{
              padding: "0.65rem 1rem",
              borderRadius: "10px",
              border: "1px solid #2a2a3d",
              background: "var(--color-surface, #13131a)",
              color: "var(--color-text-muted, #8888a8)",
              fontSize: "0.8rem",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.borderColor = "#7c3aed";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.borderColor = "#2a2a3d";
            }}
          >
            Reset
          </button>
          <button
            onClick={() => update(step)}
            style={{
              flex: 1,
              padding: "0.65rem",
              borderRadius: "10px",
              border: "1px solid #2a2a3d",
              background: "rgba(16, 185, 129, 0.1)",
              color: "#34d399",
              fontSize: "1.25rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.background =
                "rgba(16, 185, 129, 0.2)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background =
                "rgba(16, 185, 129, 0.1)";
            }}
          >
            +{step}
          </button>
        </div>

        {/* Step selector */}
        <div
          style={{
            display: "flex",
            gap: "0.4rem",
            justifyContent: "center",
            marginBottom: "1.25rem",
          }}
        >
          {[1, 5, 10, 100].map((s) => (
            <span
              key={s}
              style={{
                fontSize: "0.7rem",
                color:
                  step === s
                    ? "var(--color-primary-light, #a78bfa)"
                    : "var(--color-text-muted, #8888a8)",
                padding: "0.2rem 0.5rem",
                borderRadius: "6px",
                background:
                  step === s
                    ? "rgba(124, 58, 237, 0.15)"
                    : "transparent",
                border: `1px solid ${step === s ? "rgba(124, 58, 237, 0.4)" : "transparent"}`,
              }}
            >
              ±{s}
            </span>
          ))}
        </div>

        {/* History */}
        {history.length > 1 && (
          <div
            style={{
              borderTop: "1px solid var(--color-border, #2a2a3d)",
              paddingTop: "1rem",
            }}
          >
            <div
              style={{
                fontSize: "0.7rem",
                color: "var(--color-text-muted, #8888a8)",
                marginBottom: "0.5rem",
                fontWeight: 600,
                letterSpacing: "0.05em",
              }}
            >
              HISTORY (last {history.length})
            </div>
            <div
              style={{
                display: "flex",
                gap: "0.35rem",
                flexWrap: "wrap",
              }}
            >
              {history.map((h, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: "0.75rem",
                    fontFamily: "var(--font-mono, monospace)",
                    color:
                      i === history.length - 1
                        ? "#fff"
                        : "var(--color-text-muted, #8888a8)",
                    fontWeight: i === history.length - 1 ? 700 : 400,
                  }}
                >
                  {h > 0 ? `+${h}` : h}
                  {i < history.length - 1 && (
                    <span style={{ opacity: 0.3, marginLeft: "0.35rem" }}>
                      →
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
