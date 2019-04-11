import pygame
import pygame.camera
from pygame.locals import *
import base64
import RPi.GPIO as GPIO
import cv2

station_number = 0

pygame.init()
pygame.camera.init()

GPIO.setmode(GPIO.BCM)
GPIO.setup(BUTTON_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)

BUTTON_PIN = 17

sio = socketio.Client()


@sio.on("connect")
def on_connect():
    print("connection established, webcam")


def read_button():
    return (GPIO.input(BUTTON_PIN))


class Capture(object):
    def __init__(self):
        self.size = (640, 480)
        # create a display surface. standard pygame stuff

        # this is the same as what we saw before
        self.clist = pygame.camera.list_cameras()
        if not self.clist:
            raise ValueError("Sorry, no cameras detected.")
        self.cam = pygame.camera.Camera(self.clist[0], self.size)
        self.cam.start()

        # create a surface to capture to.  for performance purposes
        # bit depth is the same as that of the display surface.
        self.snapshot = pygame.surface.Surface(self.size)

    def get_and_flip(self):
        # if you don't want to tie the framerate to the camera, you can check
        # if the camera has an image ready.  note that while this works
        # on most cameras, some will never return true.
        if self.cam.query_image():
            self.snapshot = self.cam.get_image(self.snapshot)

    def main(self):
        going = True
        debounce = 0
        while going:
            events = pygame.event.get()
            for e in events:
                if e.type == QUIT or (e.type == KEYDOWN and e.key == K_ESCAPE):
                    # close the camera safely
                    self.cam.stop()
                    going = False

            self.get_and_flip()
            if debounce > 0:
                debounce -= 1
            if read_button() and debounce == 0:
                debounce = 10
                data = pygame.image.tostring(self.snapshot, "RGB")
                data = base64.b64encode(data)
                sio.emit('image-send', {
                    'station': station_number,
                    'data': data.decode("utf-8")
                })


while True:
    try:
        sio.connect("http://monitor-5.local:3000")
        break
    except Exception:
        continue

c = Capture()

import threading


def printit():
    threading.Timer(5.0, printit).start()
    cv2.imshow(c.snapshot)


printit()
c.main()
