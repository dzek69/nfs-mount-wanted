#!/usr/bin/env node

import fs from "fs/promises";

import { rethrow, wait } from "@ezez/utils";

import { findConfigBy } from "./configFile.js";
import { getMounts } from "./mounts.js";
import { ping } from "./ping.js";
import { run, RunError } from "./run.promise.js";

interface Mount {
    pingHost: string;
    fsTabPath: string;
    mountPersistentPath?: string;
}

interface Config {
    mounts: Mount[];
}

const handleRunError = (e: unknown) => {
    if (e && e instanceof RunError) {
        return {
            stdOut: e.details?.stdOut ?? "",
            stdErr: e.details?.stdErr ?? "",
            code: -1,
        };
    }
    return {
        stdOut: "",
        stdErr: "",
        code: -1,
    };
};

const WAIT_BETWEEN_PINGS = 1000;

(async () => {
    const configFile = await findConfigBy("nfs-mount-wanted").fileName("config.json").find();
    if (!configFile) {
        throw new Error("Config file could not be found");
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const config = JSON.parse(String(await fs.readFile(configFile))) as Config;
    if (!config.mounts.length) {
        throw new Error("No mounts configured");
    }

    config.mounts.forEach(mnt => { // eslint-disable-line max-lines-per-function
        (async () => { // eslint-disable-line max-statements
            const checkIsMounted = async () => {
                const mounts = await getMounts();
                return Boolean(mounts.find(m => m.type === "nfs" && m.mount === mnt.fsTabPath));
            };

            let isMounted = await checkIsMounted();
            const wasMountedOnStart = isMounted;
            let firstMountDone = false;

            const { mountPersistentPath } = mnt;
            console.info("Starting listening", mnt.pingHost, "to automount", mnt.fsTabPath);
            console.info("Currently mounted?", isMounted);
            if (isMounted && mountPersistentPath) {
                await (async () => {
                    console.info("Mounting persistent path (on boot)", mountPersistentPath);
                    const { stdOut, stdErr, code } = await run(
                        "mount", ["--rbind", mnt.fsTabPath, mountPersistentPath],
                    ).catch(handleRunError);
                    console.info({ stdOut, stdErr, code });
                })().catch(rethrow);
            }

            const mount = async () => {
                await (async () => {
                    console.info(mnt.pingHost, "is up, mounting", mnt.fsTabPath);
                    const { stdOut, stdErr, code } = await run("mount", [mnt.fsTabPath]).catch(handleRunError);
                    console.info({ stdOut, stdErr, code });
                    isMounted = await checkIsMounted();
                })().catch(rethrow);

                if (isMounted && !wasMountedOnStart && !firstMountDone && mountPersistentPath) {
                    console.info("Mounting persistent path (on first mount)", mountPersistentPath);
                    const { stdOut, stdErr, code } = await run(
                        "mount", ["--rbind", mnt.fsTabPath, mountPersistentPath],
                    ).catch(handleRunError);
                    console.info({ stdOut, stdErr, code });
                }
                firstMountDone = true; // eslint-disable-line require-atomic-updates
            };

            const unmount = async () => {
                console.info(mnt.pingHost, "is down, unmounting", mnt.fsTabPath);
                const { stdOut, stdErr, code } = await run("umount", ["-l", mnt.fsTabPath]).catch(handleRunError);
                console.info({ stdOut, stdErr, code });
                isMounted = await checkIsMounted();
            };

            // eslint-disable-next-line no-constant-condition,@typescript-eslint/no-unnecessary-condition
            while (true) {
                try {
                    const data = await ping(mnt.pingHost);
                    console.info(mnt.pingHost, "is up", data.time, "ms");
                    if (!isMounted) {
                        await mount();
                    }
                }
                catch {
                    console.info(mnt.pingHost, "is down");
                    if (isMounted) {
                        await unmount();
                    }
                }
                await wait(WAIT_BETWEEN_PINGS);
            }
        })().catch(rethrow);
    });
})().catch(rethrow);

