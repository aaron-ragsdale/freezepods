// FreezePods expanded firmware: experimental micro:bit V2 profile.
// MakeCode Extensions: Bluetooth AND NeoPixel (microsoft/pxt-neopixel).
// MakeCode Bluetooth setting: No Pairing Required, only in a supervised setting.
// Standard BLE services + small newline-delimited UART commands.
// Compile and test in MakeCode before deploying to learners.
// micro:bit V1 may not have enough memory for all the services.
//
// HARDWARE:
// NeoPixel / WS2812 data on P1; 12 RGB pixels (change count to match strip).
// Use an externally powered 5V strip, shared ground, and a suitable level shifter.
// P1 is RESERVED for the strip. P0 and P2 remain available for other GPIO.
// Built-in sound is micro:bit V2 only; on V1 use a suitable external sound circuit.

bluetooth.startButtonService()
bluetooth.startLEDService()
bluetooth.startIOPinService()
bluetooth.startAccelerometerService()
bluetooth.startMagnetometerService()
bluetooth.startTemperatureService()
bluetooth.startUartService()

let pixelStrip = neopixel.create(DigitalPin.P1, 12, NeoPixelMode.RGB)
pixelStrip.setBrightness(60)
pixelStrip.clear()
pixelStrip.show()
basic.clearScreen()

// Commands are short ASCII lines ending in a newline.
// T,<Hz>,<ms>       play a tone, e.g. T,440,150
// V,<0..255>        speaker volume (V2)
// F,<r>,<g>,<b>     fill 12 RGB pixels
// N,<i>,<r>,<g>,<b> set 0-based pixel index
// B,<0..255>        NeoPixel brightness
// C                 clear NeoPixels
// D,<0..4>          display predefined symbol (0 clear, 1 heart, 2 yes, 3 no, 4 diamond)
// Multiple messages should be sent as separate BLE writes (20 bytes max each).
bluetooth.onUartDataReceived("\n", function () {
    let line = bluetooth.uartReadUntil("\n")
    let items = line.split(",")
    let cmd = items[0]
    if (cmd == "T" && items.length >= 3) {
        let frequency = Math.constrain(parseInt(items[1]), 100, 3000)
        let duration = Math.constrain(parseInt(items[2]), 30, 2000)
        music.playTone(frequency, duration)
    } else if (cmd == "V" && items.length >= 2) {
        music.setVolume(Math.constrain(parseInt(items[1]), 0, 255))
    } else if (cmd == "F" && items.length >= 4) {
        pixelStrip.showColor(neopixel.rgb(
            Math.constrain(parseInt(items[1]), 0, 255),
            Math.constrain(parseInt(items[2]), 0, 255),
            Math.constrain(parseInt(items[3]), 0, 255)
        ))
    } else if (cmd == "N" && items.length >= 5) {
        let position = Math.constrain(parseInt(items[1]), 0, 11)
        pixelStrip.setPixelColor(position, neopixel.rgb(
            Math.constrain(parseInt(items[2]), 0, 255),
            Math.constrain(parseInt(items[3]), 0, 255),
            Math.constrain(parseInt(items[4]), 0, 255)
        ))
        pixelStrip.show()
    } else if (cmd == "B" && items.length >= 2) {
        pixelStrip.setBrightness(Math.constrain(parseInt(items[1]), 0, 255))
        pixelStrip.show()
    } else if (cmd == "C") {
        pixelStrip.clear()
        pixelStrip.show()
    } else if (cmd == "D" && items.length >= 2) {
        let symbol = parseInt(items[1])
        if (symbol == 0) {
            basic.clearScreen()
        } else if (symbol == 1) {
            basic.showIcon(IconNames.Heart)
        } else if (symbol == 2) {
            basic.showIcon(IconNames.Yes)
        } else if (symbol == 3) {
            basic.showIcon(IconNames.No)
        } else if (symbol == 4) {
            basic.showIcon(IconNames.Diamond)
        }
    }
})
