#/usr/bin/env bash

exec 1>/tmp/rc.local.log 2>&1
set -x

python3 /home/pi/www-booth/LEDs/RPi/run-webcam.py &
python3 /home/pi/www-booth/LEDs/RPi/led_controller.py &
cd /home/pi/www-booth/client-monitor && npm start &
sleep 60s && DISPLAY=:0 chromium-browser --kiosk --app="http://localhost:3002"