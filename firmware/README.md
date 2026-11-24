# FreezePods micro:bit setup

FreezePods is a browser-based game builder that uses **1–4 micro:bits as physical pods**. You only need to flash a compatible Bluetooth HEX once per device. Students can create new games in Blockly or JavaScript without reflashing the board.

## One-time setup

1. Open [Microsoft MakeCode](https://makecode.microbit.org/) and choose a micro:bit project.
2. Add the **Bluetooth** extension. Do not enable the **Radio** extension.
3. Switch to JavaScript and paste the source from [main.ts](main.ts):

   ```typescript
   bluetooth.startButtonService()
   bluetooth.startLEDService()
   bluetooth.startIOPinService()
   bluetooth.startAccelerometerService()
   bluetooth.startMagnetometerService()
   bluetooth.startTemperatureService()
   basic.clearScreen()
   ```

4. For this supervised classroom setup, select **No Pairing Required** in the MakeCode Bluetooth settings. This trades Bluetooth authentication for easier connection, so consider the classroom environment before deployment.
5. Download the compiled `.hex` and flash via USB. You can use the [official micro:bit WebUSB HEX Download Tool](https://microbit.org/tools/webusb-hex-download-tool/). The tool flashes a HEX; it does not compile MakeCode source.
6. Reset the device **once**, not three times. A blank screen is expected because the website controls the LED display.
7. Open [FreezePods](https://aaron-ragsdale.github.io/freezepods/) in Chrome or Edge. Choose **Physical micro:bits**, connect the device, and try a Reaction Game.

## What the firmware supports

- Button A/B presses as game inputs
- Onboard 5×5 monochrome LED patterns as game outputs
- Optional Bluetooth GPIO HIGH/LOW and simple sensor inputs
- Optional accelerometer, compass, and temperature data for small game variations

The sound effects in FreezePods come from the **browser**, not the micro:bit speaker. We deliberately do **not** include custom Bluetooth UART sound commands, NeoPixel strip drivers, or Radio in this basic firmware.

**Important:** The latest `main.ts` is source code. A previously compiled HEX only has whatever services were enabled when it was built. If you changed the firmware or its services, compile it again. The site can detect missing optional services and report that capability as unavailable.

## Hardware notes

- GPIO output on P0/P1/P2 uses 3.3V logic; never power high-current accessories directly from a micro:bit pin.
- External digital/analog sensors need suitable connections and power. Keep wiring simple for classroom games.
- Compass readings may require calibration. Some Bluetooth services and extension combinations may be limited by micro:bit V1 memory.
- This firmware and the advanced optional pin/sensor web controls still need verification on each board revision. The existing buttons and LED display should be checked first.

For full micro:bit hardware programming beyond interactive pods, use [MakeCode](https://makecode.microbit.org/).
