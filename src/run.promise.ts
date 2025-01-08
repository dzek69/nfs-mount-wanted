import { spawn } from "child_process";

import { createError } from "@ezez/errors";

import type { SpawnOptions } from "child_process";

type RunResult = {
    stdOut: string;
    stdErr: string;
    code: number | null;
};

const RunError = createError<RunResult>("RunError");

interface Events {
    onOut?: (s: string) => void;
    onErr?: (s: string) => void;
}

const run = (command: string, args: string[], events?: Events, options?: SpawnOptions): Promise<RunResult> => {
    const { onOut, onErr } = events ?? {};

    return new Promise((resolve, reject) => {
        const cmd = spawn(command, args, options!);

        let stdOut: string, stdErr: string;

        stdOut = "";
        stdErr = "";

        cmd.stdout!.on("data", (newData) => {
            onOut?.(String(newData));
            stdOut += String(newData);
        });

        cmd.stderr!.on("data", (newData) => {
            onErr?.(String(newData));
            stdErr += String(newData);
        });

        cmd.on("close", (code) => {
            if (!code) {
                resolve({ stdOut, stdErr, code });
                return;
            }

            reject(new RunError(`Program exited with code ${code}`, {
                stdOut,
                stdErr,
                code,
            }));
        });

        cmd.on("error", () => {
            reject(new Error(`Cant's start program`));
        });
    });
};

export { run, RunError };
