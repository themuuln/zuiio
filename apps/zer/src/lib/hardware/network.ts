import { createConnection, type Socket } from "node:net";

/**
 * Raw-TCP transport to a network ESC/POS printer (typically port 9100).
 * Server-only (node:net). The browser POS never talks to the printer
 * directly — it calls /api/hardware/escpos, which sends the bytes here.
 */
export type EscPosTarget = {
  host: string;
  port: number;
};

export async function sendEscPosCommand(
  target: EscPosTarget,
  bytes: Uint8Array,
  timeoutMs = 4000,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const socket: Socket = createConnection({
      host: target.host,
      port: target.port,
    });

    const fail = (err: Error) => {
      socket.destroy();
      reject(err);
    };

    const timer = setTimeout(() => {
      fail(new Error(`ESC/POS timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    socket.setTimeout(timeoutMs, () => {
      clearTimeout(timer);
      fail(
        new Error(
          `ESC/POS connection timed out (${target.host}:${target.port})`,
        ),
      );
    });

    socket.once("error", (err) => {
      clearTimeout(timer);
      fail(err);
    });

    socket.once("connect", () => {
      socket.write(Uint8Array.from(bytes), (err) => {
        if (err) {
          clearTimeout(timer);
          fail(err);
          return;
        }
        clearTimeout(timer);
        // Give the printer a moment to flush before closing; the socket
        // write callback only means the kernel accepted the bytes.
        socket.end();
        resolve();
      });
    });
  });
}
