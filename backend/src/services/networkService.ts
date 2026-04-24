import net from 'net';
import type { PortResult } from '../models/types.js';

const PORT_CHECK_TIMEOUT_MS = 1500;

export async function checkPort(host: string, port: number, timeout: number = PORT_CHECK_TIMEOUT_MS): Promise<PortResult> {
    return new Promise((resolve) => {
        const start = performance.now();
        const socket = new net.Socket();
    let done = false;

    const finish = (result: PortResult) => {
      if (done) return;
      done = true;
      clearTimeout(hardTimeout);
      socket.removeAllListeners();
      socket.destroy();
      resolve(result);
    };

    // Hard timeout to guarantee max test duration even in edge network scenarios.
    const hardTimeout = setTimeout(() => {
      finish({ port, open: false, error: 'Timeout' });
    }, timeout);

    socket.setTimeout(timeout);

        socket.on('connect', () => {
            const elapsed = performance.now() - start;
      finish({ port, open: true, response_time: Math.round(elapsed) });
        });

        socket.on('timeout', () => {
      finish({ port, open: false, error: 'Timeout' });
        });

        socket.on('error', (err: any) => {
            let errorMsg = err.message || 'Error';
            if (err.code === 'ECONNREFUSED') errorMsg = 'Recusado';
      finish({ port, open: false, error: errorMsg.substring(0, 80) });
        });

        socket.connect(port, host);
    });
}
