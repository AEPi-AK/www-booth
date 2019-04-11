import base64
import RPi.GPIO as GPIO
import socketio

station_number = 0

BUTTON_PIN = 17

GPIO.setmode(GPIO.BCM)
GPIO.setup(BUTTON_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)

sio = socketio.Client()


@sio.on("connect")
def on_connect():
    print("connection established, button")


def read_button():
    return (GPIO.input(BUTTON_PIN))


def poll_button(self):
    debounce = 0
    if read_button() and debounce > 0:
        debounce -= 1
    if not read_button() and debounce == 0:
        print("sending data")
        debounce = 100
        sio.emit('solved-puzzle', station_number)


while True:
    try:
        sio.connect("http://192.168.1.8:3000")
        break
    except Exception:
        continue

while True:
    try:
        poll_button()
    except Exception:
        continue