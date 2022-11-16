declare module "net-ping" {
    interface Session {
        pingHost: (
            host: string,
            callback: (error: Error | null, target: string, startTime: Date, endTime: Date) => void
        ) => void;
    }
    interface SessionOptions {
        retries?: number;
        timeout?: number;
    }

    declare function createSession(opts?: SessionOptions): Session;

    const def = {
        createSession,
    };

    // eslint-disable-next-line import/no-default-export
    export default def;
}
