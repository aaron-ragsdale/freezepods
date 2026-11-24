// FreezePods micro:bit pod firmware (simple Bluetooth profile).
// In Microsoft MakeCode, add the Bluetooth extension (not Radio).
// Bluetooth security: "No Pairing Required" for the supervised classroom demo.
// Recompile this source in MakeCode to generate a new HEX file.
//
// Buttons A/B: game inputs
// LED Service: controls the built-in 5x5 display
// I/O Pins: optional simple digital/analog inputs and digital outputs
// Accelerometer/Compass/Temperature: optional basic pod sensor activities
//
// No speaker, NeoPixel strip, Radio, or custom UART commands are configured.
bluetooth.startButtonService()
bluetooth.startLEDService()
bluetooth.startIOPinService()
bluetooth.startAccelerometerService()
bluetooth.startMagnetometerService()
bluetooth.startTemperatureService()

// Leave the micro:bit display available for FreezePods game lights.
basic.clearScreen()
