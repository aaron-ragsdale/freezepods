# FreezePods Game Builder

A static, browser-based Blockly game builder for four reaction pods. Students remix games with visual blocks, test on simulated pods, and optionally experiment with BBC micro:bit Bluetooth devices.

**This is a new prototype rather than a fixed copy of nicoletart/freezepods.** No React, Node.js, or build step is required.

## What works

- Drag-and-drop Blockly editor
- One game-start sequence, repeat-rounds blocks, random or numbered target selection
- Wait for button, assign points for correct / wrong / timed-out responses
- Clear displays and wait between targets
- Four clickable simulated pods; keyboard shortcuts 1, 2, 3, 4
- Score, hit count, round count and browser-received reaction times
- Save/load Blockly games as JSON
- Experimental Web Bluetooth: connect up to four BBC micro:bits with the required Bluetooth Button and LED services

**Important:** Physical Bluetooth connectivity and LED matrix writes have not been verified on real devices. Some micro:bit firmware versions do not expose the required services. The browser measures reaction time, so Bluetooth latency is included. Simulated pods are the reliable starting point. This version does not compile or flash micro:bit firmware.

## Repo files

- `index.html` — website markup and Blockly CDN
- `style.css` — layout and responsive styling
- `app.js` — blocks, safe interpreter, simulation, save/load and experimental Bluetooth
- `README.md` — project documentation

## Enable GitHub Pages

1. Open repository **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select `main` and `/(root)`, then **Save**.
4. The website will normally appear at `https://<your-username>.github.io/freezepods/`.

If the repository is **private**, GitHub Pages availability may depend on the account plan. If Pages is not available, make the repository public when you're comfortable sharing the code, or use a supported Pages plan. Pages hosts static files; no server is required.

The site pulls Blockly 11.2.2 from unpkg.com; students require internet access to load Blockly.

## Student quick start

1. Open the GitHub Pages site in desktop Chrome or Edge.
2. Leave **Simulation** selected.
3. Press **Play game**.
4. Click any active green pod, or press its number key (1–4).
5. Click **Stop** to end early.
6. Change the blocks, then Play again.
7. **Save game** downloads a JSON file; **Load game** imports it later.

The default game runs eight rounds. A correct press gives 10 points, while a wrong press or timeout gives -5 points. The timeout defaults to three seconds. Students can change those rules in Blockly.

## Experimental Bluetooth use

Use desktop Chrome/Edge over HTTPS with a BBC micro:bit already flashed with firmware exposing:
- BLE Button Service (A/B state notifications)
- BLE LED Service (matrix state writable characteristic)

Choose **micro:bit Bluetooth (experimental)** and press **Connect micro:bit** four times to pair four different devices, then press Play. A BLE device chooser appears for each device.

The hardware path is not yet tested with four physical micro:bits. A connection can fail if services are disabled, firmware is incompatible, or the browser lacks BLE permission. The app does not upload MakeCode projects or Arduino sketches.

## Architecture

Blockly workspace → validated block interpreter → game actions → simulated pods or BLE device characteristics.

No `eval` or execution of student-generated arbitrary JavaScript is used. The interpreter supports only the defined game blocks, with bounded repeats and step counts. The browser receives events and calculates scores.

## Roadmap

- Real micro:bit firmware testing and reconnect/disconnect UI
- Configurable countdown, reaction-time scoring, target colors and multiple game templates
- Classroom-ready save, share and instructions
- Hardware-level button timestamps for more accurate measurements
- ESP32 reaction pods via a separate adapter (current ESP32 firmware uses Wi-Fi, not these micro:bit BLE services)

## Credits

Inspired by the [original FreezePods repository](https://github.com/nicoletart/freezepods). Powered by [Google Blockly](https://developers.google.com/blockly).
