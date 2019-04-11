import cv2
import socketio
import base64

# Given an OpenCV image
# Returns a list of lists, where the sublists represent rows of the grid.
# The values within each sublist are either:
#   None => for blank
#   0    => for red
#   1    => for green
#   2    => for blue
# Or returns None (for safety, in the case where it cannot recognize the grid)

sio = socketio.Client()

while True:
    try:
        sio.connect("http://192.168.1.8:3000")
        break
    except Exception:
        continue


def get_color_matrix(image):
    def threshold_image(img):
        # Threshold image
        blur = cv2.GaussianBlur(img, (5, 5), 1)
        ret3, thresh = cv2.threshold(blur, 0, 255,
                                     cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

        return thresh

    def find_grid(img):
        def find_largest_contour(
                cons):  # Used to pick out grid from other shape
            if len(cons) < 1:
                return False
            max_index = 0
            for i in range(0, len(cons)):
                if cv2.contourArea(cons[i]) > cv2.contourArea(cons[max_index]):
                    max_index = i
            return cons[max_index]

        # cv2.RETR_EXTERNAL argument used to limit search to outermost contours
        contours, hierarchy = cv2.findContours(img, cv2.RETR_EXTERNAL,
                                               cv2.CHAIN_APPROX_SIMPLE)
        border = find_largest_contour(contours)

        x, y, w, h = cv2.boundingRect(border)
        return x, y, w, h

    def check_color(r, g, b):
        def rgb_to_hsv(r, g, b):
            r, g, b = r / 255.0, g / 255.0, b / 255.0

            mx = max(r, g, b)
            mn = min(r, g, b)
            df = mx - mn
            if mx == mn:
                h = 0
            elif mx == r:
                h = (60 * ((g - b) / df) + 360) % 360
            elif mx == g:
                h = (60 * ((b - r) / df) + 120) % 360
            elif mx == b:
                h = (60 * ((r - g) / df) + 240) % 360
            if mx == 0:
                s = 0
            else:
                s = (df / mx) * 100
            v = mx * 100

            return h, s, v

        h, s, v = rgb_to_hsv(r, g, b)

        if s < 10:
            return "Blank"
        if h > 320 or h < 40:
            return "Red"
        if 75 < h < 140:
            return "Green"
        if 145 < h < 240:
            return "Blue"

    def get_colors(img, x, y, w, h):
        cell_width = w / 4
        cell_height = h / 4

        def area_color(i, j):
            # Dimensions of sampling rectangle (somewhat arbitrary)
            sample_width = int(cell_width / 4)
            sample_height = int(cell_height / 4)

            # top left corner of sample
            left_x = int(x + cell_width * i + (cell_width / 2) -
                         sample_width / 2)
            top_y = int(y + cell_height * j + (cell_height / 2) -
                        sample_height / 2)

            if top_y + sample_height > img.shape[
                    1] or left_x + sample_width > img.shape[0]:
                return None

            # return img[left_x][top_y]
            # count number of red, green, blue, and blank pixels
            red_count, green_count, blue_count, blank_count = 0, 0, 0, 0
            for dx in range(sample_width):
                for dy in range(sample_height):
                    pixel = img[left_x + dx][top_y + dy]
                    pix_r, pix_g, pix_b = pixel[2], pixel[1], pixel[
                        0]  # Indices backwards b/c numpy arrays are weird
                    pix_color = check_color(pix_r, pix_g, pix_b)
                    if pix_color == "Blank": blank_count += 1
                    elif pix_color == "Red": red_count += 1
                    elif pix_color == "Green": green_count += 1
                    elif pix_color == "Blue": blue_count += 1

            # There should be a clear majority in color count if all goes well
            color_max = max(red_count, green_count, blue_count, blank_count)
            if color_max == blank_count: return None
            if color_max == red_count: return 0
            if color_max == green_count: return 1
            if color_max == blue_count: return 2

        cell_colors = [["Blank" for i in range(4)] for j in range(4)]
        for i in range(4):
            for j in range(4):
                cell_colors[i][j] = area_color(i, j)

        return cell_colors

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    thresh = threshold_image(gray)
    x, y, w, h = find_grid(thresh)
    return get_colors(image, x, y, w, h)


@sio.on('image-process')
def detect_image(data):
    imgdata = base64.decode(data["image"])
    nparr = np.fromstring(data, np.uint8)
    nparr = np.reshape(nparr, (480, 640, 4))
    nparr[:, :, [0, 1, 2]] = nparr[:, :, [2, 1, 0]]
    detected = get_color_matrix(nparr)
    console.log("detected at station " + str(data["station"]))
    sio.emit("submission", {"station": data["station"], "grid": detected})


sio.wait()