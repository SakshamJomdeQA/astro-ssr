export const prerender = false;

const TOTAL_CHUNKS = 5;
const INTERVAL_MS = 500;

// Chrome buffers SSE data until it receives ~1 KB before firing any events.
// Sending a padding comment first flushes that buffer immediately so the
// browser starts dispatching events as soon as each chunk arrives.
const SSE_PADDING = ": " + " ".repeat(1024) + "\n\n";

export async function GET() {
  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | null = null;
  let count = 0;

  const stream = new ReadableStream({
    start(controller) {
      const send = (payload: object) =>
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
        );

      // Flush Chrome's 1 KB SSE buffer before sending real events.
      controller.enqueue(encoder.encode(SSE_PADDING));

      send({ chunk: 0, message: "Stream connected", time: new Date().toISOString() });

      timer = setInterval(() => {
        count++;
        const done = count >= TOTAL_CHUNKS;
        send({
          chunk: count,
          message: done ? "Stream complete" : `Chunk ${count} of ${TOTAL_CHUNKS}`,
          done,
          time: new Date().toISOString(),
        });
        if (done) {
          controller.close();
          if (timer) clearInterval(timer);
        }
      }, INTERVAL_MS);
    },
    cancel() {
      if (timer) clearInterval(timer);
    },
  });

  return new Response(stream, {
    headers: {
      // Content-Type must be text/event-stream for SSE.
      // server.mjs detects this and skips buffering.
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
      "Connection": "keep-alive",
      // Tell Nginx/similar proxies not to buffer this response.
      "X-Accel-Buffering": "no",
    },
  });
}
