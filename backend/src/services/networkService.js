import net from 'net';
const PORT_CHECK_TIMEOUT_MS = 1000;
export async function checkPort(host, port, timeout = PORT_CHECK_TIMEOUT_MS) {
    return new Promise((resolve) => {
        const start = performance.now();
        const socket = new net.Socket();
        let done = false;
        const finish = (result) => {
            if (done)
                return;
            done = true;
            clearTimeout(hardTimeout);
            socket.removeAllListeners();
            socket.destroy();
            resolve(result);
        };
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
        socket.on('error', (err) => {
            let errorMsg = err.message || 'Error';
            if (err.code === 'ECONNREFUSED')
                errorMsg = 'Recusado';
            finish({ port, open: false, error: errorMsg.substring(0, 80) });
        });
        socket.connect(port, host);
    });
}
//# sourceMappingURL=networkService.js.map