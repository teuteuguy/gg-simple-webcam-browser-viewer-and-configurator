# gg-simple-browser-camera-viewer

Connects to a gstreamer tcpserversink.

Launched inside Greengrass, and remember to set the WEBCAM_PATH environment variable to your webcam: ```example: /dev/video0```

Open your browser on.

```bash
[URL].local:3000/stream/[PORT]
```

Use PORT as 8080 for example.