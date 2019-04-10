from led_controller import *
import time

while(True):
    update_leds('rbrb    rbrbgygy');
    time.sleep(1) 
    update_leds('rrrr    bbbb    ');
    time.sleep(1)
    play_idle()
    time.sleep(5)
