import Socket = require('socket.io-client');

var socket: SocketIOClient.Socket = Socket('http://localhost:3000');

socket.on('connect', () => {
  socket.emit('identification', 'Command line client');
});

//@ts-ignore
socket.on('TEST', dat => console.log(dat));