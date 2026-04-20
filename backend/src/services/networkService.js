import net from 'net';
export async function checkPort(host, port, timeout = 5000) {
    return new Promise((resolve) => {
        const start = performance.now();
        const socket = new net.Socket();
        socket.setTimeout(timeout);
        socket.on('connect', () => {
            const elapsed = performance.now() - start;
            socket.destroy();
            resolve({ port, open: true, response_time: Math.round(elapsed) });
        });
        socket.on('timeout', () => {
            socket.destroy();
            resolve({ port, open: false, error: 'Timeout' });
        });
        socket.on('error', (err) => {
            socket.destroy();
            let errorMsg = err.message || 'Error';
            if (err.code === 'ECONNREFUSED')
                errorMsg = 'Recusado';
            resolve({ port, open: false, error: errorMsg.substring(0, 80) });
        });
        socket.connect(port, host);
    });
}
//# sourceMappingURL=networkService.js.map