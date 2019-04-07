import numpy as np
import math
import cv2

def mergeRelatedLines(lines, img):

    height = img.shape[0]
    width = img.shape[1]

    for i in range(len(lines)):
        if lines[i][0][0] == 0 and lines[i][0][1] == -100: continue # already merged
        p1 = lines[i][0][0]
        theta1 = lines[i][0][1]

        pt1current, pt2current = [0, 0], [0, 0]
        if theta1 > (math.pi*45/180) and theta1 < math.pi*135/180:
            pt1current[0] = 0
            pt1current[1] = p1/math.sin(theta1)

            pt2current[0] = width
            pt2current[1] = pt2current[1]/math.tan(theta1) +  \
                            p1/math.sin(theta1)

        else:
            pt1current[1] = 0
            pt1current[0] = p1/math.cos(theta1)

            pt2current[1] = height
            pt2current[0] = -pt2current[1] * math.tan(theta1) + \
                            p1/math.cos(theta1)

        for j in range(len(lines)):
            if (j == i): continue # comparing line to itself

            p = lines[j][0][0]
            theta = lines[j][0][1]

            if abs(p - p1) < 20 and \
               abs(theta - theta1) < math.pi * 10/180:


                pt1, pt2 = [0, 0], [0, 0]

                if theta > math.pi * 45/180 and theta < math.pi * 135/180:
                    pt1[0] = 0
                    pt1[1] = p / math.sin(theta)

                    pt2[0] = width
                    pt2[1] = -pt2[0] / math.tan(theta) + p/math.sin(theta)
                else:
                    pt1[1] = 0
                    pt1[0] = p / math.cos(theta)

                    pt2[1] = height
                    pt2[0] = -pt2[1] * math.tan(theta) + p / math.cos(theta)

                if (pt1[0]-pt1current[0])**2 + \
                   (pt1[1]-pt1current[1])**2 < 64**2 and \
                   (pt2[0]-pt2current[0])**2 + \
                   (pt2[1]-pt2current[1])**2 < 64**2:
                    # merge the lines
                    lines[i][0][0] = (lines[i][0][0] + lines[j][0][0]) / 2
                    lines[i][0][1] = (lines[i][0][1] + lines[j][0][1]) / 2

                    # set to impossible values to show it has been merged
                    lines[j][0][0] = 0
                    lines[j][0][1] = -100

    return lines

# IMAGE FILE NAME
imageFileName = 'grid.jpg'

# Load image in grayScale
img = cv2.imread(imageFileName, 0)
print("Loaded Image ", imageFileName)

# Threshold image
blur = cv2.GaussianBlur(img,(5,5),1)
ret3,thresh = cv2.threshold(blur,0,255,cv2.THRESH_BINARY+cv2.THRESH_OTSU)

print("Created threshold image")

print("Finding Edges")
edges = cv2.Canny(thresh,50,150)

print("Dilation")
kernel = np.ones((2,2), np.uint8)
dilation = cv2.dilate(edges, kernel, iterations = 1)

print("Hough Transform")
lines = cv2.HoughLines(dilation, 1, np.pi / 180, 150, None, 0, 0)
unmerged_image = np.zeros((img.shape[0],img.shape[1],3), np.uint8)
if lines is not None: # Draws lines on image for display purposes
        for i in range(0, len(lines)):
            rho = lines[i][0][0]
            theta = lines[i][0][1]
            a = math.cos(theta)
            b = math.sin(theta)
            x0 = a * rho
            y0 = b * rho
            pt1 = (int(x0 + 1000*(-b)), int(y0 + 1000*(a)))
            pt2 = (int(x0 - 1000*(-b)), int(y0 - 1000*(a)))
            cv2.line(unmerged_image, pt1, pt2, (0,0,255), 1, cv2.LINE_AA)

print("Merging Lines")
merged_image = np.zeros((img.shape[0],img.shape[1],3), np.uint8)
lines = mergeRelatedLines(lines, unmerged_image)
if lines is not None: # Draws merged lines on image for display purposes
        for i in range(0, len(lines)):
            rho = lines[i][0][0]
            theta = lines[i][0][1]
            a = math.cos(theta)
            b = math.sin(theta)
            x0 = a * rho
            y0 = b * rho
            pt1 = (int(x0 + 1000*(-b)), int(y0 + 1000*(a)))
            pt2 = (int(x0 - 1000*(-b)), int(y0 - 1000*(a)))
            cv2.line(merged_image, pt1, pt2, (0,0,255), 1, cv2.LINE_AA)


print("Displaying Images")
# Display images
cv2.imshow('image', img)            # Gray scale
cv2.waitKey(0)
cv2.destroyAllWindows()
cv2.imshow('thresh', thresh)        # Thresholded
cv2.waitKey(0)
cv2.destroyAllWindows()
cv2.imshow('edges', edges)
cv2.waitKey(0)
cv2.destroyAllWindows()
cv2.imshow('dilation', dilation)
cv2.waitKey(0)
cv2.destroyAllWindows()
cv2.imshow('unmerged lines', unmerged_image)
cv2.waitKey(0)
cv2.destroyAllWindows()
cv2.imshow('unmerged lines', merged_image)
cv2.waitKey(0)
cv2.imshow('imageAgain', img)            # Gray scale
cv2.waitKey(0)
cv2.destroyAllWindows()
