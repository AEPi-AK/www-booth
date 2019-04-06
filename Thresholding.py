import numpy as np
import cv2


# IMAGE FILE NAME
imageFileName = 'test.jpg'

# Load image in grayScale
img = cv2.imread(imageFileName, 0)
img = cv2.resize(img, (400, 600)) # Resizing for viewing convenience
print("Loaded Image ", imageFileName)

# Threshold image
blur = cv2.GaussianBlur(img,(5,5),4)
ret3,thresh = cv2.threshold(blur,0,255,cv2.THRESH_BINARY+cv2.THRESH_OTSU)

print("Created threshold image")

print("Displaying Images")
# Display images
cv2.imshow('image', img)            # Gray scale
cv2.imshow('thresh', thresh)        # Thresholded

cv2.waitKey(0)
cv2.destroyAllWindows()