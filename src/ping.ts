import ping from "net-ping";
import { createError } from "@ezez/errors";

const UnknownError = createError("UnknownError");

const session = ping.createSession({
    retries: 5,
    timeout: 500,
});

const pong = (host: string) => {
    return new Promise<{ time: number }>((resolve, reject) => {
        session.pingHost(host, (error, target, start, end) => {
            if (error) {
                reject(UnknownError.normalize(error));
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
