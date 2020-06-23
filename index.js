const net = require('net');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const MjpegFrameStream = require('mjpeg-frame-stream');

const ggSdk = require('aws-greengrass-core-sdk');
const iotClient = new ggSdk.IotData();

const WebcamConfigurator = require('./webcam_configurator');
const { Console } = require('console');
const myWebcamConfigurator = new WebcamConfigurator(process.env['WEBCAM_PATH']);

const port = 3000;

const clientConnections = {};
let connectCounter = 0;

const IOT_INFO_TOPIC = `$aws/things/${process.env['AWS_IOT_THING_NAME']}/info`;
const IOT_SHADOW_UPDATE_DELTA_TOPIC = `$aws/things/${process.env['AWS_IOT_THING_NAME']}/shadow/update/delta`;
const IOT_SHADOW_UPDATE_ACCEPTED_TOPIC = `$aws/things/${process.env['AWS_IOT_THING_NAME']}/shadow/update/accepted`;

io.on('connection', (socket) => {
    connectCounter++;
    console.log(
        `io.connection: A user connected. Total users: ${connectCounter}`
    );

    socket.on('disconnect', () => {
        connectCounter--;
        console.log(
            `io.connection: A user disconnected. Total users: ${connectCounter}`
        );
    });

    socket.on('update', (payload) => {
        console.log(
            `io.connection: A user requested shadow update. Total users: ${payload}`
        );
        iotClient.updateThingShadow(
            {
                thingName: process.env['AWS_IOT_THING_NAME'],
                payload: JSON.stringify(payload),
            },
            (err, data) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log(data);
                }
            }
        );
    });
});

// app.use(express.static('node_modules'));
app.use('/node_modules', express.static(__dirname + '/node_modules'));

app.get('/', (req, res) => res.send('Hello World!'));

app.get('/stream/:streamport', (req, res) => {
    console.log(`/stream/${req.params.streamport}: Route`);

    if (clientConnections.hasOwnProperty(req.params.streamport)) {
        // re-use it.
        console.log('Re-Using existing socket connection');
    } else {
        // Create it.
        // const client = new net.Socket();
        let client = (clientConnections[
            req.params.streamport
        ] = new net.Socket());
        client.connect(req.params.streamport, '127.0.0.1', () =>
            console.log(
                `/stream/${req.params.streamport}: Creating new socket connection`
            )
        );
        client.on('error', (err) => {
            res.status(400).send({
                message: `Are you sure about the streamport=${req.params.streamport} ?`,
            });
        });
        client.on('close', () =>
            console.log(
                `/stream/${req.params.streamport}: Disconnected from stream`
            )
        );
        client.pipe(new MjpegFrameStream()).on('frame', (frame) => {
            io.emit(`${req.params.streamport}`, {
                frame: frame.toString('base64'),
            });
        });
    }

    // res.sendFile(path.join(__dirname + '/index.html'));
    res.send(
        `<html>
        <head>
        <title>Test</title>
        <script src="/node_modules/socket.io-client/dist/socket.io.js"></script>
        <script src="/node_modules/jquery/dist/jquery.min.js"></script>      
        </head>
        <body style="margin: 0px">
        <img width="100%" id="video${req.params.streamport}">
        <script>
            var socket = io();
            socket.on('${req.params.streamport}', data => {
                $('#video${req.params.streamport}').attr('src', 'data:image/jpg;base64, ' + data.frame);
            });
            socket.on('${IOT_SHADOW_UPDATE_ACCEPTED_TOPIC}', data => {
                console.log('MQTT(${IOT_SHADOW_UPDATE_ACCEPTED_TOPIC}):', data);
            });
        </script>
        </body>
    </html>`
    );
});

http.listen(port, () =>
    console.log(`Example app listening at http://localhost:${port}`)
);

function parseIncomingShadow(shadow) {
    console.log(`Parsing: ${JSON.stringify(shadow)}`);
    if (
        shadow !== undefined &&
        shadow.hasOwnProperty('state') &&
        shadow.state.hasOwnProperty('desired') &&
        shadow.state.desired.hasOwnProperty('webcam_settings')
    ) {
        const settings = shadow.state.desired.webcam_settings;
        for (const key in settings) {
            myWebcamConfigurator[key] = settings[key];
        }
    }
}

// Unused because long lived function
exports.handler = (event, context, callback) => {
    console.log(`Event: ${JSON.stringify(event)}`);
    console.log(`Context: ${JSON.stringify(context)}`);

    try {
        if (
            context !== undefined &&
            context.hasOwnProperty('clientContext') &&
            context.clientContext.hasOwnProperty('Custom') &&
            context.clientContext.Custom.hasOwnProperty('subject')
        ) {
            const topic = context.clientContext.Custom.subject;
            console.log(`Emitting on: ${topic}: ${JSON.stringify(event)}`);
            io.emit(`${topic}`, event);

            switch (topic) {
                case IOT_SHADOW_UPDATE_ACCEPTED_TOPIC:
                    parseIncomingShadow(event);
                    break;
                case IOT_SHADOW_UPDATE_DELTA_TOPIC:
                    if (event !== undefined && event.hasOwnProperty('state')) {
                        parseIncomingShadow({ state: { desired: event } });
                    }
                    break;
            }
        } else {
            console.log(`Error: ${JSON.stringify(context)}`);
        }
    }
    catch(error) {
        console.error(`Error: ${JSON.stringify(error)}`);
    }

    callback(undefined, { result: 'Hello from Lambda!' });
};

// Get Thing Shadow
console.log('Shadow Get Operation');
iotClient.getThingShadow(
    {
        thingName: process.env['AWS_IOT_THING_NAME'],
    },
    (err, data) => {
        if (err) {
            console.error(err);
        } else {
            parseIncomingShadow(JSON.parse(data.Payload));
            // console.log(data);
        }
    }
);
