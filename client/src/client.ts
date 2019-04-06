import Socket = require('socket.io-client');

var socket: SocketIOClient.Socket = Socket('http://localhost:3000');

socket.on('connect', () => {
  socket.emit('identification', 'Command line client');
  socket.on('clients-updated', function (data: string[]) {
    console.log('clients: ' + data);
  });
});

//@ts-ignore
socket.on('TEST', dat => console.log(dat));