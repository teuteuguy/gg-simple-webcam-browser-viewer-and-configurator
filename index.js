const net = require('net');
const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const MjpegFrameStream = require('mjpeg-frame-stream');

const port = 3000;

const clientConnections = {};
let connectCounter = 0;

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
});

app.get('/js/socket.io.js', (req, res) =>
    res.sendFile(__dirname + '/node_modules/socket.io-client/dist/socket.io.js')
);
app.get('/js/socket.io.js.map', (req, res) =>
    res.sendFile(
        __dirname + '/node_modules/socket.io-client/dist/socket.io.js.map'
    )
);
app.get('/js/jquery.min.js', (req, res) =>
    res.sendFile(__dirname + '/node_modules/jquery/dist/jquery.min.js')
);

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

    res.send(
        `<html>
            <head>
            <title>Test</title>
            <script src="/js/socket.io.js"></script>
            <script src="/js/jquery.min.js"></script>      
            </head>
            <body style="margin: 0px">
            <img width="100%" id="video${req.params.streamport}">
            <script>
                var socket = io();
                socket.on('${req.params.streamport}', data => {
                    $('#video${req.params.streamport}').attr('src', 'data:image/jpg;base64, ' + data.frame);
                });
            </script>
            </body>
        </html>`
    );
});

http.listen(port, () =>
    console.log(`Example app listening at http://localhost:${port}`)
);

// Unused because long lived function
exports.handler = async (event) => {
    // TODO implement
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};
