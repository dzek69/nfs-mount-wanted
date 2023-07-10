import path from "path";
import fs from "fs/promises";

const findConfigBy = (appName: string) => {
    const useAppName = appName;
    let useFileName: string | undefined = undefined,
        useNamespace: string | undefined;

    return {
        fileName(fileName: string) {
            useFileName = fileName;
            return this;
        },
        namespace(namespace: string) {
            useNamespace = namespace;
            return this;
        },
        find() {
            return findConfigFile(useAppName, useFileName, useNamespace);
        },
    };
};

// eslint-disable-next-line max-statements
const findConfigFile = async (appName: string, fileName?: string, namespace?: string) => {
    const paths = [];
    const dotApp = "." + appName;

    if (!fileName) {
        paths.push(dotApp);
        paths.push(path.join(dotApp, dotApp));
    }
    else {
        paths.push(path.join(dotApp, fileName));
    }

    if (process.env.XDG_CONFIG_HOME || process.env.HOME) {
        const CONFIG_DIR = process.env.XDG_CONFIG_HOME || path.join(process.env.HOME!, ".config");
        if (namespace) {
            if (fileName) {
                paths.push(path.join(CONFIG_DIR, namespace, appName, fileName));
            }
            else {
                paths.push(path.join(CONFIG_DIR, namespace, appName, appName));
            }
        }
        else {
            if (fileName) {
                paths.push(path.join(CONFIG_DIR, appName, fileName));
            }
            else {
                paths.push(path.join(CONFIG_DIR, appName, appName));
            }
        }
    }

    for (let i = 0; i < paths.length; i++) {
        const currentPath = paths[i]!;
        try {
            console.info("Looking for config", currentPath);
            const info = await fs.stat(currentPath);
            if (info.isFile()) {
                return currentPath;
            }
        }
        catch {}
    }

    return null;
};

export {
    findConfigFile,
    findConfigBy,
};
