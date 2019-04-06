#include <Adafruit_NeoPixel.h>
#define PIN 6
const int numLeds = 72;

void setup() {
  pinMode(PIN, OUTPUT);
  // put your setup code here, to run once:
  Serial.begin(9600)
  while (Serial.available()>0) serIn=Serial.read();
}

void setYellow(int loc){
  
}

void getValidUpper(int serIn, int pinNum){
  if (serIn%2 = 1){
    
  }
  else if (serIn%4 = 1){
    
  }
  else if (serIn%8 = 1){
    
  }
  else if (serIn%16 = 1){
    
  }
  else if (serIn%32 = 1){
    
  }
  else if (serIn%64 = 1){
    
  }
  else if (serIn%128 = 1){
    
  }
  else if (serIn%256 = 1){
    
  }
}

void loop() {
  // put your main code here, to run repeatedly:

  if (Serial.available()>0) {
    serIn=Serial.read()
    
    
  }     
}
