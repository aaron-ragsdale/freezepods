# Set up a BBC micro:bit for FreezePods

The FreezePods website controls the micro:bit over Web Bluetooth. Each micro:bit must have compatible firmware installed **once**. Students can then use many Blockly and JavaScript games without changing that firmware.

## Candidate compiled HEX (testing)

The candidate file `microbit-bluettoth.hex` is **being tested and is not yet in this GitHub repository**. The documented source, [main.ts](./main.ts), is available now. Please don't rely on an unverified HEX as an official classroom release.

If you have the candidate HEX locally, use the [official micro:bit WebUSB HEX Download Tool](https://microbit.org/tools/webusb-hex-download-tool/) to flash it, then check that both A/B button notifications and **Test LEDs** work in FreezePods. The WebUSB tool does not compile MakeCode source files.

After a successful hardware test, the compiled HEX can be committed to this folder and linked directly from this README.

## Install once per micro:bit

1. Open [Microsoft MakeCode](https://makecode.microbit.org/) and create a project.
2. Open **Extensions**, search for **Bluetooth** and add it (accept removing **Radio** if prompted).
3. Switch to JavaScript, and replace the project code with the contents of [main.ts](./main.ts):

   ```typescript
   bluetooth.startButtonService()
   bluetooth.startLEDService()
   bluetooth.startIOPinService()
   basic.clearScreen()
   ```

4. Set the MakeCode Bluetooth security/pairing option to **No Pairing Required** for this classroom test. This allows the browser to connect without the micro:bit pairing gesture. Consider the security implications of unauthenticated connections before wider use.
5. Compile/download the `.hex` file from MakeCode, then flash it onto the micro:bit using USB. For a convenient browser-based flashing option, use the official [micro:bit WebUSB HEX Download Tool](https://microbit.org/tools/webusb-hex-download-tool/). This tool installs an **existing `.hex` file**; it does not compile `main.ts` to HEX. You can reuse a compatible compiled HEX for other devices of the same micro:bit hardware revision.
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

## GPIO output blocks

The website's **Output Pins** category supports HIGH/LOW on P0, P1, or P2. These use the optional standard Bluetooth I/O Pin Service and require an updated MakeCode HEX compiled with `bluetooth.startIOPinService()`. The browser sets the selected pin's configuration to digital output before sending its value. Verify the pin with a suitable resistor and small LED or a meter before attaching other hardware.

The existing candidate `.hex` file may **not** include the I/O Pin Service, even if buttons and built-in LEDs work. Updating this `main.ts` source does not change an already compiled HEX; recompile and flash it.

Addressable LED strips are different: they require the MakeCode NeoPixel extension (or another timing-aware firmware library), a suitable command protocol, external 5V supply, common ground, and generally a 3.3V-to-5V data level shifter. The current HIGH/LOW block **does not** implement WS2812 color data.
