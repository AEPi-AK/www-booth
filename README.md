# Booth Tech

Dear Future Reader,

This README was written to preserve the hashtag institutional knowledge of the technological geniuses
in AEPi. It includes how to set up Raspberry Pis minimally for booth, installing TypeScript and related
tools, and an explanation and rationale for our heavy use of Socket.io.

## Table of Contents

1. [Components](#components)
2. [Setting up your Pi](#setting-up-your-pi)
3. [Setting up TypeScript](#setting-up-typescript)
4. [Developing for the Pi](#developing-for-the-pi)
5. [Socket.io](#socketio)
6. [Type Safety](#type-safety)
7. [Misc tidbits and tips](#misc-tips)

## Components

The base booth tech kit comes with:

* Raspberry Pi
* Micro SD card
* Micro SD card reader
* Power supply
* Micro USB cable

You will need all of these things to continue.

## Setting up your Pi

If you were given a Pi that was already set up, you can skip this section.

If you are the one setting up the Pis, you might find this section helpful.

These instructions were written specifically for Mac.

1. Download [Etcher](https://etcher.io/)
2. Download [Raspbian](https://www.raspberrypi.org/downloads/raspbian/) (it may be faster to use the torrent download)
   * If you don't need the desktop, I recommend going with lite.
3. Put the Micro SD card into the reader
4. Plug the reader into your computer
5. Open Etcher
6. Select the zip of Raspbian
7. Select the reader as the storage device
8. Flash!
9. Plug a keyboard (via USB), mouse (via USB), screen (via HDMI), and the Micro SD card into your pi.
   * The micro SD card should be taken out of the reader and put into the pie directly. The slot is on the bottom.
10. If you are at CMU and plan to use the internet on the Pi, [you'll need to register its MAC address](https://netreg.net.cmu.edu/)
    1. Click Enter
    2. Click Register New Machine
    3. In the first dropdown, select Legacy Wireless Network and then click continue
    4. Type whatever you want for the hostname.
    5. On the Pi, open up the Terminal and type `ifconfig`
    6. Type the MAC address (should look like AA:BB:CC:DD) into the Hardware address box
    7. Select Student Organization under affiliation
    8. Click continue
    9. In about 30 minutes, you should be able to access the internet from the Pi.
11. Try to open chromium on your pi. If it doesn't let you access the internet after waiting for 30 minutes, follow this [SO answer](https://raspberrypi.stackexchange.com/a/47715).
    * Instead of internationalistation options, you'll want localisation options.
12. Set up the Pi SSH and VNC servers
    1. Run `sudo rapsi-config` in a terminal window
    2. Select `Interfacing Options`
    3. Navigate to and select `SSH`
    4. Choose `Yes`
    5. Select `Ok`
    6. Do the same for `VNC`
    7. Choose `Finish`
    8. Now you can ssh onto the pi by connecting to it via ethernet and 
       running `ssh pi@raspberrypi.local`. The password is `raspberry` by
       default.
    9. You can also connect to the Pi with VNC. See 
       `https://www.raspberrypi.org/documentation/remote-access/vnc/README.md`
       for more information.
13. Set up typescript + node on the Pi
    1. `curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -`
    2. Install node, `sudo apt-get install node`
    3. Install TypeScript, `sudo npm install -g typescript`
    4. Install nodemon, `sudo npm install -g nodemon`
14. Set sshfs for editing code
    1. On your laptop run sudo apt-get install sshfs
    2. On your laptop run mkdir pi
    3. log in with "sshfs pi@HOSTNAME:/home/pi pi" and type in the password
    4. When you enter the pi directory you will be able to see and edit the pi's files with whatever text editors you have installed on your laptop. 
15. Set up remote VSCode on your machine
    1. Open VSCode (see next section)
    2. Click the extensions icon (it looks like a square with a square inside it)
    3. Search Remote VSCode
    4. Click install
    5. On the installation page, it will have suggested user settings.  Add these to your VSCode user settings.
    6. Add the following to your ~/.ssh/config:
    ```Host <pi_name>
    HostName <pi_address>
    User pi
    ForwardAgent yes
    RemoteForward 52698 127.0.0.1:52698```
    7. Restart VSCode
    8. `ssh` into your pi, navigate to the file you'd like to edit, and `rcode <filename>`.  The file should open in VSCode.
    

You now have a linux machine on which you may begin developing.

## Setting up TypeScript

TypeScript is a type-safe superset of JavaScript with a badass community and development environment. All of the booth programming
can be done via ssh with remote VSCode, so you should follow these instructions on your local machine.

[Getting VS Code](https://code.visualstudio.com/)

[Getting TypeScript](https://code.visualstudio.com/docs/languages/typescript)

## Developing for the Pi

We use remote VSCode to ease the development process. I recommend connecting to the pi via ethernet, but you can also access it using
its IP address. Your pi should also be connected to wifi so it can download external dependencies.

You'll want to use VS Code to edit TypeScript files. I know I know, you really wanted to use `EDITORNAMEHERE` to work on booth,
but trust me, VS Code is great.

Since we set up remote VSCode, you should be able to open up the project on your pi inside VS Code. Any changes you make to these
files will be reflected via ssh to your pi.

Within VS Code, open up a terminal window and ssh onto your pi (`ssh pi@<pi name>.local`).
`cd` into your project folder. You'll want to make sure that you install dependencies while on the Pi.

With this setup, you'll be able to use your local environment to develop while still getting to run your code on the pi!

## Socket.io

Socket IO is essentially a distributed implementation of the observer design pattern.
The basic premise is that instead of being responsible for repeatedly checking the state of a server,
you can just set up "listeners" (which are just functions) that react to certain messages. An example of
a message is the message that comes in when a user connects to the server. Something listening to that message
may add that user to a list of active users, send the user a message, or continue listening to messages from that user.

Let's take a look at an example:


```typescript
server.ts

import Express = require('express');
import Http = require('http');
import IO = require('socket.io');

var app = Express();
var http = new Http.Server(app);
var io = IO(http);

// When a user connects, wait for them to identify themselves. Print
// to the console when they disconnect.
// Note: 'connect' and 'disconnect' are built in messages that are automatically
// sent when a connection is created and disconnected, respectively
io.on('connect', function(socket: SocketIO.Socket){
  var name: null | string = null;
  console.log('a user connected: ' + socket.id);

  socket.on('disconnect', function () {
    if (name) console.log(name + ' disconnected');
    else console.log(socket.id + ' disconnected');
  });

  // 'identification' is our own custom message. We expect a string to be supplied.
  socket.on('identification', function (data: string) {
    if (name === null) {
     console.log('user ' + socket.id + ' identified as ' + data);
     name = data;
    }
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
```

This code doesn't just execute top down like you may expect. This code tells the server to continually listen
for these messages. Specifically, always listen for a user to connect. When they do, always listen for them to identify
themselves, and note when they disconnect. We do not need to put our code in a loop -- this code says to start listening
and then proceeds on asynchronously.

The client to a server may look something like this:

```typescript
client.ts

import Socket = require('socket.io-client');
import Readline = require('readline');

var socket = Socket('http://localhost:3000');

const rl = Readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

rl.question('What is your name? ', (answer) => {
  // Sends an identification message to the server.
  socket.emit('identification', answer);
  rl.close();
});
```

This client connects to the server, takes a name as input from STDIN, and tells the server the name. On the server side,
it received a `'connect'` message, since the client made a connection to the server, and an `'identification'` message that
the client explicitly sends.

### Why do you care?

Traditionally (by this, I of course mean the 2017 & 2018 golden years of booth game), the master server in the booth keeps track of
game state while a bunch of Rasperry Pis control several mini-games throughout the booth react to changes in the game state. Some Raspberry Pis will also send messages to the server, and are the driving force behind many of these game state changes. This kind
of design is extremely well-modeled by socket.io -- just listen for a `gamestate changed` message and react accordingly; no need to
poll periodically! Similarly, to update the gamestate the server can just listen for updates and propagate those updates by broadcasting
a `gamestate changed` message.

## Type Safety

Sure, TypeScript is unsound by design (I'm more of a [Flow](http://flow.org) guy myself), but that doesn't mean we can't use its
type system to ease our development process. TypeScript allows us to do some real black magic: type
safe messages between different machines. Process that for a second. Think about how ridiculously robust that would
make an application.

Take a look at [messages.ts](/common/messages.ts). This file specifies all of the ways we use socket.io to send and receive messages.
All of these functions are just simple wrappers around the `socket.on` function, which specifies the type of the message being sent
or received. As long as everyone only uses the type safe methods to communicate between machines, we can statically guarantee that
all of the different programs are sending messages whose types are expected. If you ever want to create a new message, you MUST add it
to [messages.ts](/common/serverMessages.ts). Since it's in [common](/common), every sub-project can reference it, meaning all of the types are
synchronized across all of the sub-projects.


## Misc Tips

* You will not be able to use anything that requries Internet access at runtime-- we will only have access to each other's machines via our LAN network.
* The most important thing is robustness. Make sure your pi will not crash under any circumstances.
