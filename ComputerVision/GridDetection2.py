import numpy as np
import math
import cv2

# IMAGE FILE NAME
imageFileName = 'grid.jpg'

# Load image in grayScale
img = cv2.imread(imageFileName, 0)
print("Loaded Image ", imageFileName)

# Threshold image
blur = cv2.GaussianBlur(img,(5,5),1)
ret3,thresh = cv2.threshold(blur,0,255,cv2.THRESH_BINARY_INV+cv2.THRESH_OTSU)



def find_largest_contour(contours):
    if len(contours) < 1:
        return False
    max = 0
    for i in range(0, len(contours)):
        if cv2.contourArea(contours[i]) > cv2.contourArea(contours[max]):
            max = i
    return contours[max]

contours, hierarchy = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
print(contours)
blank = np.zeros((img.shape[0],img.shape[1],3), np.uint8)
cv2.drawContours(blank, contours, -1, (128,255,0), 1)
outerGrid = find_largest_contour(contours)

cv2.drawContours(blank, [outerGrid], -1, (0, 0, 255), 3)
x, y, w, h = cv2.boundingRect(outerGrid)
cv2.rectangle(blank,(x,y),(x+w,y+h),(0,255,0),2)

cv2.imshow('image', img)
cv2.imshow('thresh', thresh)
cv2.imshow('contours', blank)
cv2.waitKey(0)
cv2.destroyAllWindows()
