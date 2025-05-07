WIP.

# Instructions

- You need Node up to 20.x
- `sudo apt install nfs-common`
- Clone this repo into `/root/nfs-mount-wanted`
- Prepare these files:

  - `/etc/systemd/system/nfs-mount-wanted.service`
    ```
    [Unit]
    Description=NFS auto mount/unmount
    After=default.target

    [Service]
    Type=simple
    User=root
    ExecStart=/bin/sh /root/start-nfs.sh
    WorkingDirectory=/root
    Restart=always
    RestartSec=1

    [Install]
    WantedBy=default.target
    ```
  - `/root/start-nfs.sh` (and do `chmod +x`)
    ```bash
    #!/bin/sh
    ### BEGIN INIT INFO
    # Provides:          nfs-mount-wanted
    # Required-Start:    $all
    # Required-Stop:
    # Default-Start:     2 3 4 5
    # Default-Stop:
    # Short-Description: Auto dis(mounts) NFS
    ### END INIT INFO
    node /root/nfs-mount-wanted/esm/index.js
    ```
  - `/root/.config/nfs-mount-wanted/config.json`
    ```json
    {
      "mounts": [
        {
          "pingHost": "192.168.101.132",
          "fsTabPath": "/mnt/nas"
        }
      ]
    }
    ```
  - And add this line into `/etc/fstab`:
    ```
    192.168.101.132:/volume1/main /mnt/nas nfs noauto 0 0
    ```
- Run these:
```bash
sudo systemctl daemon-reload
sudo systemctl enable nfs-mount-wanted.service
sudo systemctl start nfs-mount-wanted.service
sudo reboot
```
