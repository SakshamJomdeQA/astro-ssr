import { useState, useRef } from "react";

interface Chunk {
  index: number;
  message: string;
  time: string;
  relativeMs: number;
  deltaMs: number;
  done?: boolean;
}

interface HeaderSet {
  label: string;
  url: string;
  headers: Record<string, string>;
  status: number;
}

type StreamStatus = "idle" | "connecting" | "streaming" | "done" | "error";
type Verdict = "unknown" | "streaming" | "buffered";

const INTERESTING_HEADERS = [
  "cache-control",
  "cdn-cache-control",
  "surrogate-control",
  "x-powered-by",
  "x-streaming-mode",
  "x-request-id",
  "x-response-time",
  "x-accel-buffering",
  "content-type",
  "transfer-encoding",
  "content-length",
];

const mono: React.CSSProperties = { fontFamily: "var(--font-mono, monospace)" };
const muted = "var(--color-text-muted, #8888a8)";
const surface = "var(--color-surface-2, #1c1c28)";
const border = "var(--color-border, #2a2a3d)";
const accent = "var(--color-accent-light, #a78bfa)";

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: "0.65rem",
        fontWeight: 700,
        padding: "0.15rem 0.5rem",
        borderRadius: 6,
        background: `${color}18`,
        border: `1px solid ${color}44`,
        color,
        ...mono,
      }}
    >
      {children}
    </span>
  );
}

function SectionCard({
  title,
  badge,
  badgeColor = "#7c3aed",
  children,
  borderColor = "rgba(124,58,237,0.25)",
}: {
  title: string;
  badge?: string;
  badgeColor?: string;
  children: React.ReactNode;
  borderColor?: string;
}) {
  return (
    <div
      style={{
        background: surface,
        border: `1px solid ${borderColor}`,
        borderRadius: 12,
        padding: "1.25rem",
        marginBottom: "1.25rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.65rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "0.95rem", color: "#fff" }}>{title}</h3>
        {badge && <Badge color={badgeColor}>{badge}</Badge>}
      </div>
      {children}
    </div>
  );
}

export default function StreamingTester() {
  // ── SSE state ──────────────────────────────────────────────────────────
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [sseStatus, setSseStatus] = useState<StreamStatus>("idle");
  const [verdict, setVerdict] = useState<Verdict>("unknown");
  const abortRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const chunksRef = useRef<Chunk[]>([]);

  // ── Headers state ──────────────────────────────────────────────────────
  const [headerSets, setHeaderSets] = useState<HeaderSet[]>([]);
  const [headersLoading, setHeadersLoading] = useState(false);

  // ── SSE test ───────────────────────────────────────────────────────────
  function resetSSE() {
    abortRef.current?.abort();
    setChunks([]);
    setSseStatus("idle");
    setVerdict("unknown");
    chunksRef.current = [];
  }

  async function startSSE() {
    resetSSE();
    const now = Date.now();
    startTimeRef.current = now;
    lastTimeRef.current = now;
    setSseStatus("connecting");

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch("/api/stream", {
        headers: { Accept: "text/event-stream" },
        signal: ac.signal,
      });

      if (!res.ok || !res.body) {
        setSseStatus("error");
        return;
      }

      setSseStatus("streaming");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      const processLine = (line: string) => {
        if (!line.startsWith("data: ")) return;
        try {
          const parsed: { chunk: number; message: string; time: string; done?: boolean } =
            JSON.parse(line.slice(6));
          const ts = Date.now();
          const chunk: Chunk = {
            index: parsed.chunk,
            message: parsed.message,
            time: parsed.time,
            relativeMs: ts - startTimeRef.current,
            deltaMs: ts - lastTimeRef.current,
            done: parsed.done,
          };
          lastTimeRef.current = ts;
          chunksRef.current = [...chunksRef.current, chunk];
          setChunks([...chunksRef.current]);
        } catch {}
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n");
        buf = parts.pop() ?? "";
        for (const line of parts) processLine(line.trim());
      }
      // flush any remaining data
      if (buf.trim()) processLine(buf.trim());

      setSseStatus("done");
      const deltas = chunksRef.current.slice(1).map((c) => c.deltaMs);
      if (deltas.length >= 2) {
        const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
        setVerdict(avg > 200 ? "streaming" : "buffered");
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") setSseStatus("error");
    }
  }

  // ── Headers inspector ──────────────────────────────────────────────────
  async function checkHeaders() {
    setHeadersLoading(true);
    setHeaderSets([]);

    const targets = [
      { label: "GET /api/hello  (API route — no-store)", url: "/api/hello" },
      { label: "GET /ssr  (SSR page — public cache)", url: "/ssr" },
    ];

    const results: HeaderSet[] = [];
    for (const t of targets) {
      try {
        const res = await fetch(t.url, { cache: "no-store" });
        const headers: Record<string, string> = {};
        for (const name of INTERESTING_HEADERS) {
          const val = res.headers.get(name);
          if (val) headers[name] = val;
        }
        results.push({ label: t.label, url: t.url, headers, status: res.status });
      } catch (err) {
        results.push({
          label: t.label,
          url: t.url,
          headers: { error: String(err) },
          status: 0,
        });
      }
    }
    setHeaderSets(results);
    setHeadersLoading(false);
  }

  // ── Verdict UI ─────────────────────────────────────────────────────────
  const verdictColor =
    verdict === "streaming" ? "#10b981" : verdict === "buffered" ? "#f59e0b" : muted;
  const verdictText =
    verdict === "streaming"
      ? "TRUE STREAMING — chunks arrived with expected delays"
      : verdict === "buffered"
      ? "PROXY BUFFERING — all chunks arrived together (streaming disabled at proxy)"
      : "";

  const statusColor: Record<StreamStatus, string> = {
    idle: muted,
    connecting: "#f59e0b",
    streaming: "#10b981",
    done: "#06b6d4",
    error: "#ef4444",
  };

  return (
    <div style={{ fontFamily: "var(--font-sans, system-ui)", color: "var(--color-text, #e8e8f0)" }}>

      {/* ── SSE Streaming Test ── */}
      <SectionCard
        title="SSE Streaming Test"
        badge="EventSource /api/stream"
        badgeColor="#10b981"
        borderColor="rgba(16,185,129,0.25)"
      >
        <p style={{ color: muted, fontSize: "0.85rem", margin: "0 0 1rem" }}>
          The server sends 6 events over ~3 seconds (one every 500 ms). If chunks arrive
          progressively, streaming is working end-to-end. If they all arrive at once, a
          proxy is buffering the response.
        </p>

        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <button
            onClick={startSSE}
            disabled={sseStatus === "connecting" || sseStatus === "streaming"}
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: 8,
              border: "1px solid rgba(16,185,129,0.4)",
              background: "rgba(16,185,129,0.1)",
              color: "#10b981",
              fontSize: "0.85rem",
              cursor: sseStatus === "connecting" || sseStatus === "streaming" ? "not-allowed" : "pointer",
              opacity: sseStatus === "connecting" || sseStatus === "streaming" ? 0.5 : 1,
              ...mono,
            }}
          >
            {sseStatus === "idle" ? "▶ Start" : sseStatus === "done" || sseStatus === "error" ? "↺ Run again" : "⏳ Running…"}
          </button>
          {chunks.length > 0 && (
            <button
              onClick={resetSSE}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: 8,
                border: `1px solid ${border}`,
                background: "transparent",
                color: muted,
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          )}
          {sseStatus !== "idle" && (
            <span style={{ fontSize: "0.78rem", color: statusColor[sseStatus], alignSelf: "center", ...mono }}>
              ● {sseStatus.toUpperCase()}
            </span>
          )}
        </div>

        {/* Chunk log */}
        {chunks.length > 0 && (
          <div
            style={{
              background: "rgba(0,0,0,0.3)",
              borderRadius: 8,
              padding: "0.75rem 1rem",
              marginBottom: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem",
            }}
          >
            {chunks.map((c) => (
              <div
                key={c.index}
                style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap", fontSize: "0.8rem" }}
              >
                <span style={{ color: c.done ? "#06b6d4" : "#10b981", minWidth: 16 }}>
                  {c.done ? "✓" : "↓"}
                </span>
                <span style={{ color: "#fff", ...mono, flex: 1 }}>{c.message}</span>
                <span style={{ color: muted, ...mono, whiteSpace: "nowrap" }}>
                  +{c.relativeMs}ms
                </span>
                {c.index > 0 && (
                  <span
                    style={{
                      color: c.deltaMs > 200 ? "#10b981" : "#f59e0b",
                      ...mono,
                      fontSize: "0.72rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Δ{c.deltaMs}ms
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Verdict */}
        {verdict !== "unknown" && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: 8,
              border: `1px solid ${verdictColor}44`,
              background: `${verdictColor}0d`,
              fontSize: "0.82rem",
              color: verdictColor,
              ...mono,
            }}
          >
            {verdict === "streaming" ? "✅" : "⚠️"} {verdictText}
          </div>
        )}
      </SectionCard>

      {/* ── Response Headers Inspector ── */}
      <SectionCard
        title="Response Headers Inspector"
        badge="Cache-Control verification"
        badgeColor="#06b6d4"
        borderColor="rgba(6,182,212,0.25)"
      >
        <p style={{ color: muted, fontSize: "0.85rem", margin: "0 0 1rem" }}>
          Fetches two routes and shows the key response headers — confirms
          Cache-Control is preserved for both API routes (<code style={mono}>no-store</code>)
          and SSR pages (<code style={mono}>public, s-maxage=31536000</code>).
        </p>

        <button
          onClick={checkHeaders}
          disabled={headersLoading}
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: 8,
            border: "1px solid rgba(6,182,212,0.4)",
            background: "rgba(6,182,212,0.1)",
            color: "#06b6d4",
            fontSize: "0.85rem",
            cursor: headersLoading ? "not-allowed" : "pointer",
            opacity: headersLoading ? 0.5 : 1,
            marginBottom: "1rem",
            ...mono,
          }}
        >
          {headersLoading ? "⏳ Fetching…" : "🔍 Inspect headers"}
        </button>

        {headerSets.map((hs) => (
          <div
            key={hs.url}
            style={{
              background: "rgba(0,0,0,0.25)",
              borderRadius: 8,
              padding: "0.75rem 1rem",
              marginBottom: "0.75rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.6rem",
                flexWrap: "wrap",
                gap: "0.4rem",
              }}
            >
              <span style={{ color: accent, fontSize: "0.8rem", ...mono }}>{hs.label}</span>
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: hs.status >= 200 && hs.status < 300 ? "#10b981" : "#ef4444",
                  ...mono,
                }}
              >
                HTTP {hs.status || "ERR"}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              {Object.entries(hs.headers).map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: "0.75rem", fontSize: "0.78rem", flexWrap: "wrap" }}>
                  <span style={{ color: muted, minWidth: 160, ...mono }}>{k}:</span>
                  <span
                    style={{
                      color: k === "cache-control" ? "#fbbf24" : "#e8e8f0",
                      ...mono,
                      wordBreak: "break-all",
                    }}
                  >
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {headerSets.length === 0 && !headersLoading && (
          <div
            style={{
              textAlign: "center",
              padding: "1.5rem",
              color: muted,
              fontSize: "0.85rem",
              border: `1px dashed ${border}`,
              borderRadius: 8,
            }}
          >
            Click "Inspect headers" to fetch routes and check Cache-Control ↑
          </div>
        )}
      </SectionCard>

    </div>
  );
}
