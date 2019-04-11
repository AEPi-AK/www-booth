import io
import pygame
import pygame.camera
from pygame.locals import *
import base64
import cv2
import numpy as np

station_number = 0

pygame.init()
pygame.camera.init()

class Capture(object):
    def __init__(self):
        self.size = (640, 480)
        # create a display surface. standard pygame stuff
        self.display = pygame.display.set_mode(self.size, 0)

        # this is the same as what we saw before
        self.clist = pygame.camera.list_cameras()
        if not self.clist:
            raise ValueError("Sorry, no cameras detected.")
        self.cam = pygame.camera.Camera(self.clist[0], self.size)
        self.cam.start()

        # create a surface to capture to.  for performance purposes
        # bit depth is the same as that of the display surface.
        self.snapshot = pygame.surface.Surface(self.size)
        self.ready = False

    def get_and_flip(self):
        # if you don't want to tie the framerate to the camera, you can check
        # if the camera has an image ready.  note that while this works
        # on most cameras, some will never return true.
        if self.cam.query_image():
            self.ready = True
            self.snapshot = self.cam.get_image(self.snapshot)
            c.display.blit(c.snapshot, (0, 0))
            pygame.display.flip()

    def main(self):
        going = True
        debounce = 0
        while going:
            self.get_and_flip()
         

c = Capture()
import threading
def printit():
    threading.Timer(5.0, printit).start()
    if c.ready:
        data = pygame.image.tostring(c.snapshot, "RGBA")
        nparr = np.fromstring(data, np.uint8)
        nparr = np.reshape(nparr, (480,640,4))
        nparr[:,:,[0,1,2]] = nparr[:,:,[2,1,0]]
        cv2.imshow('image', nparr.astype(np.uint8))
        cv2.waitKey(1000)
        print('snapshot')

test = np.zeros((648, 480, 3))
test[:,:,0] = 100
test[:,:,1] = 150
test[:,:,2] = 200
printit()
c.main()
