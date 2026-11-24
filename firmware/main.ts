// FreezePods micro:bit firmware
// In MakeCode, add the Bluetooth extension and select No Pairing Required.
// Flash over USB once. This program remains installed after powering off.
//
// Start GATT services used by the FreezePods website.
// The website handles gameplay; the firmware only exposes inputs and display.
bluetooth.startButtonService()
bluetooth.startLEDService()

// Leave the display clear so FreezePods controls its 5x5 LED matrix.
// Do not run a forever loop that continuously draws icons or text.
basic.clearScreen()
