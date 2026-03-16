import { useState } from "react";

interface ApiResponse {
  endpoint: string;
  status: number;
  data: unknown;
  duration: number;
}

const ENDPOINTS = [
  { label: "GET /api/hello", url: "/api/hello", method: "GET" },
  { label: "GET /api/time", url: "/api/time", method: "GET" },
  { label: "GET /api/echo?msg=hello", url: "/api/echo?msg=hello+from+client", method: "GET" },
  { label: "POST /api/echo", url: "/api/echo", method: "POST" },
];

export default function ApiTester() {
  const [results, setResults] = useState<ApiResponse[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const callApi = async (endpoint: (typeof ENDPOINTS)[0]) => {
    setLoading(endpoint.url);
    const start = Date.now();
    try {
      const options: RequestInit = {
        method: endpoint.method,
        headers: { "Content-Type": "application/json" },
      };
      if (endpoint.method === "POST") {
        options.body = JSON.stringify({ message: "Hello from React island!", timestamp: Date.now() });
      }
      const res = await fetch(endpoint.url, options);
      const data = await res.json();
      const duration = Date.now() - start;
      setResults((prev) => [
        { endpoint: endpoint.label, status: res.status, data, duration },
        ...prev.slice(0, 4),
      ]);
    } catch (err) {
      setResults((prev) => [
        {
          endpoint: endpoint.label,
          status: 0,
          data: { error: String(err) },
          duration: Date.now() - start,
        },
        ...prev.slice(0, 4),
      ]);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ fontFamily: "var(--font-sans, system-ui)" }}>
      {/* Endpoint buttons */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {ENDPOINTS.map((ep) => (
          <button
            key={ep.url + ep.method}
            onClick={() => callApi(ep)}
            disabled={loading !== null}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "10px",
              border: "1px solid var(--color-border, #2a2a3d)",
              background:
                loading === ep.url
                  ? "rgba(124, 58, 237, 0.2)"
                  : "var(--color-surface-2, #1c1c28)",
              color: "var(--color-text, #e8e8f0)",
              fontSize: "0.8rem",
              fontFamily: "var(--font-mono, monospace)",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading && loading !== ep.url ? 0.5 : 1,
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <span
              style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                color: ep.method === "POST" ? "#f59e0b" : "#10b981",
              }}
            >
              {ep.method}
            </span>
            {ep.label.replace(/^(GET|POST) /, "")}
            {loading === ep.url && " ⏳"}
          </button>
        ))}
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "2rem",
            color: "var(--color-text-muted, #8888a8)",
            fontSize: "0.875rem",
            border: "1px dashed var(--color-border, #2a2a3d)",
            borderRadius: "12px",
          }}
        >
          Click an endpoint above to test the API routes ↑
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {results.map((r, i) => (
            <div
              key={i}
              style={{
                background: "var(--color-surface-2, #1c1c28)",
                border: `1px solid ${r.status >= 200 && r.status < 300 ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                borderRadius: "10px",
                padding: "1rem",
                opacity: i === 0 ? 1 : 0.7,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: "0.8rem",
                    color: "var(--color-text-muted, #8888a8)",
                  }}
                >
                  {r.endpoint}
                </span>
                <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.75rem" }}>
                  <span
                    style={{
                      color: r.status >= 200 && r.status < 300 ? "#10b981" : "#ef4444",
                      fontWeight: 700,
                    }}
                  >
                    {r.status || "ERR"}
                  </span>
                  <span style={{ color: "var(--color-text-muted, #8888a8)" }}>
                    {r.duration}ms
                  </span>
                </div>
              </div>
              <pre
                style={{
                  margin: 0,
                  fontSize: "0.78rem",
                  color: "#67e8f9",
                  fontFamily: "var(--font-mono, monospace)",
                  overflow: "auto",
                  maxHeight: "120px",
                  background: "none",
                  border: "none",
                  padding: 0,
                }}
              >
                {JSON.stringify(r.data, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
