const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const MjpegFrameStream = require('mjpeg-frame-stream');
const fs = require('fs');

const port = 3000;

console.log('Will open and read from the following stream:', process.env.stream);

const mjpegStream = fs.createReadStream(process.env.stream).pipe((new MjpegFrameStream())).on('frame', (frame) => {
    io.emit(process.env.stream, {
        frame: frame.toString('base64')
    });
});

app.get('/js/socket.io.js', (req, res) => res.sendFile(__dirname + '/node_modules/socket.io-client/dist/socket.io.js'));
app.get('/js/socket.io.js.map', (req, res) => res.sendFile(__dirname + '/node_modules/socket.io-client/dist/socket.io.js.map'));
app.get('/js/jquery.min.js', (req, res) => res.sendFile(__dirname + '/node_modules/jquery/dist/jquery.min.js'));

app.get('/', (req, res) => res.send('Hello World!'));

app.get('/stream', (req, res) => {
    res.send(`
  <html>
    <head>
      <title>Test</title>
      <script src="/js/socket.io.js"></script>
      <script src="/js/jquery.min.js"></script>      
    </head>
    <body style="margin: 0px">
      <img width="100%" id="video"></br><div id="log"></div>
      <script>
        var socket = io();
        socket.on('${process.env.stream}', data => {
          $('#video').attr('src', 'data:image/jpg;base64, ' + data.frame);
        });
      </script>
    </body>
  </html>
  `);
});

http.listen(port, () =>
    console.log(`Example app listening at http://localhost:${port}`)
);

