#!/usr/bin/env node

import fs from "fs/promises";

import { rethrow, wait } from "bottom-line-utils";

import { findConfigBy } from "./configFile.js";
import { getMounts } from "./mounts.js";
import { ping } from "./ping.js";
import { run, RunError } from "./run.promise.js";

interface Mount {
    pingHost: "";
    fsTabPath: "";
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
    const config = JSON.parse(String(await fs.readFile(configFile))) as Config;
    if (!config.mounts.length) {
        throw new Error("No mounts configured");
    }

    config.mounts.forEach(mnt => {
        (async () => {
            const mounts = await getMounts();
            let isMounted = Boolean(mounts.find(m => m.type === "nfs" && m.mount === mnt.fsTabPath));

            console.info("Starting listening", mnt.pingHost, "to automount", mnt.fsTabPath);
            console.info("Currently mounted?", isMounted);

            const mount = async () => {
                console.info(mnt.pingHost, "is up, mounting", mnt.fsTabPath);
                const { stdOut, stdErr, code } = await run("mount", [mnt.fsTabPath]).catch(handleRunError);
                console.info({ stdOut, stdErr, code });
                if (!code) {
                    isMounted = true;
                }
            };

            const unmount = async () => {
                console.info(mnt.pingHost, "is down, unmounting", mnt.fsTabPath);
                const { stdOut, stdErr, code } = await run("umount", ["-l", mnt.fsTabPath]).catch(handleRunError);
                console.info({ stdOut, stdErr, code });
                if (!code) {
                    isMounted = false;
                }
            };

            // eslint-disable-next-line no-constant-condition
            while (true) {
                try {
                    await ping(mnt.pingHost);
                    if (!isMounted) {
                        await mount();
                    }
                }
                catch {
                    if (isMounted) {
                        await unmount();
                    }
                }
                await wait(WAIT_BETWEEN_PINGS);
            }
        })().catch(rethrow);
    });
})().catch(rethrow);

