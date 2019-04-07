import cv2

# FILE NAME FOR DEMOING
FILE = "grid.jpg"


# Loads the image from file name in GRAY SCALE (needed for thresholding)
# Returns the resulting image (OpenCV Image)
def load_image_gs(imgFileName):
    # Load image in gray scale
    img = cv2.imread(imgFileName, 0)
    return img


# Applies the necessary thresholding required for processing
# Returns the resulting image (OpenCV Image)
def threshold_image(img):
    # Threshold image
    blur = cv2.GaussianBlur(img,(5,5),1)
    ret3,thresh = cv2.threshold(blur,0,255,cv2.THRESH_BINARY_INV+cv2.THRESH_OTSU)

    return thresh


# Given a OpenCV Image of an empty grid (game board) which has been thresholded,
# Returns x, y, w, h coordinates/dimensions of the rectangle which bounds the outer grid
# NOTE: this function relies entirely on the grid border being the largest shape in the image
def find_grid(img):
    def find_largest_contour(contours): # Used to pick out grid from other shape
        if len(contours) < 1:
            return False
        max = 0
        for i in range(0, len(contours)):
            if cv2.contourArea(contours[i]) > cv2.contourArea(contours[max]):
                max = i
        return contours[max]

    # cv2.RETR_EXTERNAL argument used to limit search to outermost contours
    contours, hierarchy = cv2.findContours(img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    border = find_largest_contour(contours)

    x, y, w, h = cv2.boundingRect(border)
    return x, y, w, h

# DEMO function
def draw_outer_grid(imgFileName): 
    img = load_image_gs(imgFileName)
    thresh = threshold_image(img)
    x, y, w, h = find_grid(thresh)

    colored = cv2.imread(imgFileName)
    cv2.rectangle(colored, (x, y), (x+w, y+h), (20, 20, 200), 2)

    cv2.imshow('image', colored)
    cv2.waitKey(0)
    cv2.destroyAllWindows()


draw_outer_grid(FILE)
