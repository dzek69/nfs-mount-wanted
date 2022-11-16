import { ensureError } from "bottom-line-utils";
import ping from "net-ping";

const session = ping.createSession({
    retries: 5,
    timeout: 500,
});

const pong = (host: string) => {
    return new Promise<{ time: number }>((resolve, reject) => {
        session.pingHost(host, (error, target, start, end) => {
            if (error) {
                reject(ensureError(error));
                return;
            }
            resolve({
                time: end.getTime() - start.getTime(),
            });
        });
    });
};

export {
    pong as ping,
};
