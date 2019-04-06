# master-server

## Client Listeners

Clients may listen for the following events: 

### 'connect'

This message is sent to all clients when the master server goes up. Usually, you'll want
to identify yourself to the server here (see [identification](#identification)).

The callback function takes no arguments and returns `void`.

Example:

```typescript
socket.on('connect', () =>
  console.log('The server is up!')
);
```

### 'disconnect'

This message is sent to all clients when the master server goes down.

The callback function takes no arguments and returns `void`.

Example:

```typescript
socket.on('disconnect', () =>
  console.log('The server is down!')
);
```

### 'clients-updated'

This message is sent to all clients when the list of clients is updated.

The callback function takes a `string[]` of clients and returns `void`.

Example:

```typescript
socket.on('clients-updated', (clients: string[]) =>
  console.log('There are ' + clients.length + ' clients connected');
);
```

## Client Emitters

The clients may emit the following messages:

### 'identification'

This message should be sent to the master server to tell it the name of
the client.

There is only one argument, and it is a `string`.

Example:

```typescript
socket.emit('identification', 'admin-console');
```

## Master server listeners

The master server may listen for the following events:

### 'connect'

This message is received when a client connects to the server. The argument in the callback is a `SocketIO.Socket` that may be
listened on for further messages.

This should only be listened to from the server socket, typically named io.

Example:

```typescript
io.on('connect', (socket: SocketIO.Socket) =>
  console.log('The client id is ' + client.id);
);
```

### 'disconnect'

This message is received when a client disconnects from the server. There are no arguments to the callback function.

Example:

```typescript
socket.on('disconnect', () =>
  console.log('The client id is ' + client.id);
);
```

### 'identification'

This message is received when a client sends its name to the server. The argument to the callback is a `string`, which
is the client's name.

Example:

```typescript
socket.on('identification', (name: string) =>
  console.log('The client name is ' + name);
);
```

## Server Emitters

The server may emit the following messages:

### 'clients-updated'

This message is emitted when the server's client list is updated. The only argument is of type `string[]`, and
should have all of the clients currently tracked by the server.

Example:

```typescript
// Emit to all clients
io.sockets.emit('clients-updated', currentClients);
```
