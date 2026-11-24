# Set up a BBC micro:bit for FreezePods

The FreezePods website controls the micro:bit over Web Bluetooth. Each micro:bit must have compatible firmware installed **once**. Students can then use many Blockly and JavaScript games without changing that firmware.

## Install once per micro:bit

1. Open [Microsoft MakeCode](https://makecode.microbit.org/) and create a project.
2. Open **Extensions**, search for **Bluetooth** and add it (accept removing **Radio** if prompted).
3. Switch to JavaScript, and replace the project code with the contents of [main.ts](./main.ts):

   ```typescript
   bluetooth.startButtonService()
   bluetooth.startLEDService()
   basic.clearScreen()
   ```

4. Set the MakeCode Bluetooth security/pairing option to **No Pairing Required** for this classroom test. This allows the browser to connect without the micro:bit pairing gesture. Consider the security implications of unauthenticated connections before wider use.
5. Download the firmware and copy/flash the resulting `.hex` file onto the micro:bit via USB. You can re-use a compiled HEX for other devices of the same micro:bit hardware revision.
6. Reset **once** and let the program run. **Do not press reset three times** to enter special pairing mode. A blank display is expected because `basic.clearScreen()` leaves the LEDs under browser control.
7. In Chrome or Edge, open the [FreezePods website](https://aaron-ragsdale.github.io/freezepods/), choose **micro:bit Bluetooth (test mode)** and press **Connect micro:bit**. Select your micro:bit in the browser chooser.
8. Check for **1 micro:bit ready**, press its A/B buttons, and use **Test LEDs** to flash its display before playing.

**Note:** This repository includes the MakeCode source, **not a precompiled HEX binary**. To produce the binary, compile in MakeCode with the Bluetooth extension included and the setting configured. A prebuilt HEX that has not been compiled and tested on target hardware should not be represented as ready-to-flash firmware.

## Why the earlier heart program may not be ideal

The earlier connectivity test displayed a heart when it started. The website can connect to that program, but for a dedicated LED-controlled game, it is cleaner to leave the built-in screen blank rather than have the firmware draw its own pattern. No `forever` loop should redraw LEDs while the website is trying to update them.

The micro:bit's 5×5 display is **monochrome**. Virtual colored pods are shown on the webpage, but the micro:bit screen displays on/off patterns.

## Troubleshooting

- **Chrome finds it, but 0 ready:** The micro:bit's currently running program may lack the Bluetooth Button Service. Reflash the correct MakeCode project.
- **1 ready, buttons work, but LEDs stay dark:** Check the LED service status under the device counter and click **Test LEDs**. Expand **See game events** and copy any LED write errors or readback results.
- **LED test says writes completed but lights do not change:** Confirm the micro:bit is running this minimal firmware, not a program that repeatedly displays a heart, scrolls text, or overwrites the LED matrix. Reset once and reconnect.
- **Micro:bit does not appear:** Ensure it has power and is running the Bluetooth-enabled program, rather than special pairing mode. Close any conflicting BLE connection.
- **Multiple devices:** Connect one at a time. FreezePods supports 1–4, and only connected devices are chosen as random targets.

## What the site sends

The website uses Bluetooth GATT Button Service notifications to receive Button A/B presses. For LED output it writes five bytes (one byte for each row of the 5×5 display) to the LED Matrix State characteristic. The website now serializes writes per device and provides a dedicated on/off test.

References: [MakeCode Bluetooth LED Service](https://makecode.microbit.org/reference/bluetooth/start-led-service) and [micro:bit Bluetooth GATT LED service](https://lancaster-university.github.io/microbit-docs/ble/led-service/).
