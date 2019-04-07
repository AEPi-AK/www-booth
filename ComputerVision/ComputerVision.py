import cv2

# FILE NAME FOR DEMOING
FILE = "fullHouse.jpg"


# Loads the image from file name in COLOR
# Returns the resulting image (OpenCV Image)
def load_image(img_file_name):
    # Load image in gray scale
    img = cv2.imread(img_file_name)
    return img


# Applies the necessary thresholding required for processing
# Returns the resulting image (OpenCV Image)
def load_threshold_image(img_file_name):
    # Load image in gray scale
    img = cv2.imread(img_file_name, 0)
    # Threshold image
    blur = cv2.GaussianBlur(img, (5, 5), 1)
    ret3, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    return thresh


# Given a OpenCV Image of an empty grid (game board) which has been thresholded,
# Returns x, y, w, h coordinates/dimensions of the rectangle which bounds the outer grid
# NOTE: this function relies entirely on the grid border being the largest shape in the image
def find_grid(img):
    def find_largest_contour(cons): # Used to pick out grid from other shape
        if len(cons) < 1:
            return False
        max_index = 0
        for i in range(0, len(cons)):
            if cv2.contourArea(cons[i]) > cv2.contourArea(cons[max_index]):
                max_index = i
        return cons[max_index]

    # cv2.RETR_EXTERNAL argument used to limit search to outermost contours
    contours, hierarchy = cv2.findContours(img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
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

        return h,s,v

    h, s, v = rgb_to_hsv(r, g, b)

    if s < 40 or v > 80:
        return "Blank"
    if h > 340 or h < 20:
        return "Red"
    if 100 < h < 140:
        return "Green"
    if 180 < h < 240:
        return "Blue"


# Given color image and x, y, w, h of grid border,
# Returns 4x4 color matrix of the grid cells (Colors are either "Red", "Green", "Blue", or "Blank")
# NOTE: assumes grid is 4x4
def get_colors(img, x, y, w, h):
    cell_width = w / 4
    cell_height = h / 4

    def area_color(i, j):
        # Dimensions of sampling rectangle (somewhat arbitrary)
        sample_width = int(cell_width / 4)
        sample_height = int(cell_height / 4)

        # top left corner of sample
        left_x = int(x + cell_width * i + (cell_width / 2) - sample_width / 2)
        top_y = int(y + cell_height * j + (cell_height / 2) - sample_height / 2)

        # count number of red, green, blue, and blank pixels
        red_count, green_count, blue_count, blank_count = 0, 0, 0, 0
        for dx in range(sample_width):
            for dy in range(sample_height):
                pixel = img[left_x + dx][top_y + dy]
                pix_r, pix_g, pix_b = pixel[2], pixel[1], pixel[0]  # Indices backwards b/c numpy arrays are weird
                pix_color = check_color(pix_r, pix_g, pix_b)
                if pix_color == "Blank": blank_count += 1
                elif pix_color == "Red": red_count += 1
                elif pix_color == "Green": green_count += 1
                elif pix_color == "Blue": blue_count += 1

        # There should be a clear majority in color count if all goes well
        color_max = max(red_count, green_count, blue_count, blank_count)
        if color_max == blank_count: return "Blank"
        if color_max == red_count: return "Red"
        if color_max == green_count: return "Green"
        if color_max == blue_count: return "Blue"

    cell_colors = [["Blank" for i in range(4)] for j in range(4)]
    for i in range(4):
        for j in range(4):
            cell_colors[i][j] = area_color(i, j)

    return cell_colors


# For demoing
# Displays image with grid border drawn in red
def draw_outer_grid(img_file_name):
    thresh = load_threshold_image(img_file_name)
    x, y, w, h = find_grid(thresh)

    colored = load_image(img_file_name)
    cv2.rectangle(colored, (x, y), (x + w, y + h), (20, 20, 200), 2)

    cv2.imshow('image', colored)


# DEMO
IMAGE = load_image(FILE)
THRESH = load_threshold_image(FILE)
X, Y, W, H = find_grid(THRESH)
draw_outer_grid(FILE)
print(get_colors(IMAGE, X, Y, W, H))
cv2.waitKey(0)
cv2.destroyAllWindows()

