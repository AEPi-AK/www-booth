import smbus
import time
import socketio
import RPi.GPIO as GPIO

station_number = 0

bus = smbus.SMBus(1)

CMD_UPDATE = 0x05
CMD_IDLE = 0x06

CLR_RED = 0x00
CLR_GREEN = 0x01
CLR_BLUE = 0x02
CLR_WHITE = 0x03
CLR_YELLOW = 0x04
CLR_OFF = 0x05

ARDUINO_ADDR = 0x08
DELAY_TIME = .02


def update_leds(color_string):
    if (len(color_string) != 16):
        print('ERROR: Please provide a string of length 16!')
        return
    data = []
    for c in color_string:
        if c is 'r':
            data += [CLR_RED]
        elif c is 'g':
            data += [CLR_GREEN]
        elif c is 'b':
            data += [CLR_BLUE]
        elif c is ' ':
            data += [CLR_OFF]
        elif c is 'w':
            data += [CLR_WHITE]
        elif c is 'y':
            data += [CLR_YELLOW]
        else:
            print('ERROR: String contains invalid character!')
            return

    try:
        bus.write_block_data(ARDUINO_ADDR, CMD_UPDATE, data)
    except Exception:
        pass


def flash_wildly():
    strings = ["r" * 16, "b" * 16, "g" * 16]
    for i in range(0, 10):
        update_leds(strings[i % 3])
        time.sleep(0.1)


def play_idle():
    try:
        bus.write_byte(ARDUINO_ADDR, CMD_IDLE)
    except Exception:
        pass


sio = socketio.Client()


@sio.on('connect')
def on_connect(sid, environ):
    print('connection established')


@sio.on('solved-puzzle-sound')
def on_solved(data):
    if data == station_number:
        flash_wildly()


@sio.on('game-state-updated')
def gameStateUpdated(data):
    def enc(n):
        if n == 0:
            return ' '
        else:
            return 'y'

    if data['phase'] == 1:
        play_idle()
    elif data['phase'] == 3:
        if data['puzzles'][station_number]:
            grid = data['puzzles'][station_number]['grid']
            snake_order = [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3], [1, 2],
                           [1, 1], [1, 0], [2, 0], [2, 1], [2, 2], [2, 3],
                           [3, 3], [3, 2], [3, 1], [3, 0]]
            data = [grid[a[0]][a[1]] for a in snake_order]
            data = ''.join([enc(d) for d in data])
            update_leds(data)
    else:
        update_leds(" " * 16)


while True:
    try:
        sio.connect("http://192.168.1.8:3000")
        break
    except Exception:
        continue

sio.wait()