import nodeFs from "fs/promises";

const getMounts = async () => {
    return String(await nodeFs.readFile("/proc/mounts")).trim().split("\n").map(line => {
        const [fs, mount, type, options, dump, pass] = line.trim().split(" ");
        return { fs, mount, type, options, dump, pass };
    });
};

export {
    getMounts,
};
