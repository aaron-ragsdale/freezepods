# FreezePods Game Lab (Blockly + JavaScript)

A free, static GitHub Pages website for students to invent physical reaction and memory games with either Google Blockly or a JavaScript editor. No React build, npm install, server, firmware compiler, or account is needed for **simulation**.

## Choose how to program

Use the **Blocks / JavaScript** tabs in the editor. They are separate authoring modes, not automatic two-way translation. Switching modes preserves the Blockly workspace and the JavaScript draft independently.

- **Blocks:** supported Blockly commands, variables, loops, lists, math, colors, and memory-game features. Extra blocks include **set all pods to color** and **wait for specific pod press**.
- **JavaScript:** edit real JavaScript in the browser using the limited `pods` game API. Starter examples are provided for a reaction game and memory game. Save/load `.js` files separately from Blockly JSON.
- Both modes operate the same four virtual pods and use the same score display.

JavaScript mode accepts normal JavaScript syntax such as variables, arrays, functions, `for` loops, and `if` statements. Calls to the FreezePods API are asynchronous and must be `await`ed.

Example:

```js
for (let round = 0; round < 5; round++) {
  await pods.nextRound();
  const target = await pods.randomPod();
  await pods.light(target, 'blue');
  const press = await pods.waitPress(3000);
  await pods.addScore(press && press.pod === target ? 10 : -5);
  await pods.off();
  await pods.wait(500);
}
```

Supported methods: `pods.sound(effectName)`, `pods.light(podNumber, color)`, `pods.all(color)`, `pods.off()`, `pods.wait(milliseconds)`, `pods.waitPress(timeoutMs)`, `pods.randomPod()`, `pods.addScore(points)`, `pods.nextRound()`, `pods.message(text)`, `pods.getState()`.

`pods.waitPress()` returns `null` on timeout or an object like `{pod:2,ms:450,correct:true}`. Pod numbers are **1 to 4**. The simulated pods support red, green, blue, yellow, purple, orange, white, and off.

### Safety limitations of JavaScript mode

Student scripts execute inside a `sandbox="allow-scripts"` iframe without same-origin permission and with a restrictive Content Security Policy. Only selected commands are forwarded to the parent through a validated message channel; scripts do not receive device objects or direct hardware APIs. The iframe is discarded when the game stops and a two-minute game limit is enforced for **cooperative/asynchronous programs**.

**This is an educational sandbox, not a hardened untrusted-code service.** A synchronous infinite loop can still freeze the browser tab, and the text mode is best used for student-written or reviewed code rather than arbitrary downloaded scripts. Use Blockly for less experienced users.

## More game templates

Use the starter buttons above the Blockly editor:

| Game | What students can change |
|---|---|
| **Reaction Game** | Number of rounds, scoring, timeout, target selection |
| **Memory Game** | Sequence length, replay speed, scoring |
| **Speed Challenge** | Total duration, points for hits and misses; score as many as possible before time runs out |
| **Simon Says** | A growing sequence with configurable levels and starting difficulty |
| **Two-Player Duel** | Compete with Pod 1 versus Pod 2. Customize the round count and awarded points |

A duel needs **at least two connected micro:bits** for physical gameplay. It works with the four virtual pods in Simulation. Player scores are shown separately.

These starter games use high-level Blockly game blocks that students can inspect, change, and combine with other statements. They are not yet fully decomposed into basic control-flow blocks.

## Digital output pins

The **Output Pins** Blockly category provides a digital HIGH/LOW output block, plus experimental PWM and NeoPixel commands:

`digital output: Pod [number] pin [P0/P1/P2] [HIGH/LOW]`

Select a pod and output pin, then use this block to turn ordinary GPIO-controlled devices on and off (for example, an LED with a suitable resistor, or a driver module). In JavaScript use `await pods.digitalWrite(1, 0, true)` for Pod 1 / P0 / HIGH and `await pods.digitalWrite(1, 0, false)` for LOW.

In simulation the action is logged as a preview. In **Physical micro:bits** mode it sends actual GPIO commands via the micro:bit **Bluetooth I/O Pin Service**. This requires firmware with `bluetooth.startIOPinService()` enabled. The firmware source in [firmware/main.ts](firmware/main.ts) has been updated, but **the earlier compiled HEX is not automatically updated**. Recompile in MakeCode before testing physical GPIO.

### Addressable LEDs

Your proposed wiring is broadly correct: micro:bit GPIO to the WS2812/NeoPixel DIN pin, plus an appropriately rated external 5V power supply and shared ground between the micro:bit and LED supply. A 3.3V-to-5V logic-level shifter is recommended for reliable data when using 5V addressable LEDs. Do not power a 5V strip from a micro:bit output pin.

**Digital HIGH/LOW alone cannot control addressable RGB LEDs.** These pixels require a precisely timed serial waveform. To drive them, add the MakeCode NeoPixel library/extension to the micro:bit firmware and a compatible Bluetooth command protocol, so the micro:bit generates the timing locally. The expanded experimental micro:bit V2 firmware now includes a local NeoPixel command handler, but it has not yet been compiled or tested on physical hardware.

## Expanded micro:bit hardware controls (experimental V2 profile)

The firmware source at [firmware/main.ts](firmware/main.ts) now enables these Bluetooth services: **Buttons**, **LED Matrix**, **I/O Pins**, **Accelerometer**, **Magnetometer**, **Temperature**, and **UART**. **Radio is not enabled.** The UART channel accepts short commands for the V2 speaker, custom display icons, PWM outputs, and an optional 12-LED NeoPixel strip. This is a **source-level integration, not a compiled or hardware-tested HEX**. Compile in MakeCode with both the Bluetooth and NeoPixel extensions. On micro:bit V1, this many BLE services and extensions may exceed memory; the full profile targets V2.

| Blockly category | New capabilities | Hardware notes |
|---|---|---|
| Sensors | Sample accelerometer X/Y/Z (milli-g), heading, temperature into a variable | Requires BLE sensor services. Compass requires calibration for a meaningful heading. |
| Inputs & Timing | Sample P0/P2 digital or analog input into a variable | BLE I/O pin readback is experimental and not yet physically verified. |
| Output Pins | Digital HIGH/LOW, PWM 0–1023, 12-pixel NeoPixel commands, and display icons | P1 reserved as NeoPixel data output; use P0 or P2 for external GPIO/PWM. |
| Sounds & Effects | Play a specific tone and set micro:bit speaker volume | Through BLE UART; built-in speaker is V2 only. Browser sounds still work independently. |

JavaScript commands include `await pods.sensor(1, 'x')`, `await pods.pinRead(1, 0, true)`, `await pods.tone(1, 440, 200)`, `await pods.volume(1, 128)`, `await pods.pwm(1, 0, 512)`, `await pods.neoFill(1, 255, 0, 0)`, `await pods.neoPixel(1, 3, 0, 255, 0)`, `await pods.neoBrightness(1, 60)`, `await pods.neoClear(1)`, and `await pods.deviceIcon(1, 1)`.

In Simulation mode, sensor values and hardware writes are placeholders for students to explore programming. They are **not real sensor measurements**. When a physical service is absent, the game reports an error. The old compiled HEX may still support buttons and the built-in display but **will not automatically include these newer features**.

**Electrical safety:** External WS2812 LEDs need their own appropriately sized 5V supply with shared ground, ideally a logic level shifter between micro:bit P1 and DIN. Do not power an LED strip through a micro:bit GPIO pin. Ordinary output pins use 3.3V logic and cannot directly drive high-current loads.

## Sounds, countdowns, and game effects

FreezePods now includes more game-design blocks under **Sounds & Effects**, **Pods & Colors**, and **Inputs & Timing**:

- **Play sound:** beep, start, success, miss, level up, tick, or time up.
- **Countdown:** display a 3–2–1 style countdown and play ticks before the game begins. Choose 1–10 seconds.
- **Celebrate if correct:** play success or miss feedback based on the last response.
- **Flash pod:** light an individual pod for a chosen duration, then turn it off.
- **Random wait:** pause for a random interval between two millisecond values, useful for unpredictable reaction games.

**Game sounds play through the student’s computer or phone browser, not through the micro:bit.** They use the browser Web Audio API and do not require audio files, additional hardware, or firmware changes. The player can toggle **Game sounds** off in the play settings. Audio may require a click on Play to activate, and a muted device will remain silent.

In the **JavaScript** editor, use `await pods.sound('success')` to play an effect. Other sound names are `beep`, `start`, `miss`, `level`, `tick`, and `timeup`. For example:

```js
await pods.sound('start');
const target = await pods.randomPod();
await pods.light(target, 'green');
const press = await pods.waitPress(3000);
await pods.sound(press && press.pod === target ? 'success' : 'miss');
await pods.off();
```

## Features

- **Starter games:** Reaction Game, Memory Game, Speed Challenge, Simon Says, and Two-Player Duel.
- **Programming concepts:** variables, basic math, comparisons, Boolean logic, if/else, repeat and while/until loops.
- **Lists & memory:** create lists, read list items, generate random sequences, show them on pods, and check players' presses.
- **Pod controls:** random or specific target, change pod color, clear pods.
- **Inputs:** wait for a press with timeout; check most recent button and whether it was correct.
- **Scoring:** assign points for correct/wrong presses or adjust score directly.
- **Test:** four virtual pods, clickable or controlled by number keys 1–4.
- **Sharing:** download and reload your Blockly workspace as a JSON project.

Note: this release supports a *defined subset* of Blockly blocks. It does not run arbitrary generated JavaScript and does not yet support Blockly functions/procedures, nested custom event handlers, or every built-in list/math block. Unsupported blocks stop the game with an explanatory error. Long-running loops are bounded.

## Play online with GitHub Pages

Open **Settings → Pages** in this GitHub repository, choose **Deploy from a branch**, set **main** / **/(root)**, and save. The resulting public URL is generally `https://aaron-ragsdale.github.io/freezepods/`.

No GitHub Actions or build step is required. Blockly is loaded from the public CDN and requires internet access.

## Student quick start

1. Open the site in Chrome or Edge. Select **Simulation**.
2. Press **Reaction game** or **Memory game** to load a starting Blockly project.
3. Press **Play game** and click the pods (or use keyboard numbers 1–4).
4. Change settings or add blocks. To make a variable, open **Variables → Create variable**.
5. Press Play again. To share your program, use **Save game**; use **Load game** to reopen the JSON.

### Reaction game

The example uses eight rounds with a random illuminated pod, a three-second button timeout, and +10 or -5 points. Adjust blocks for new rules. Reaction times are measured by the browser, not a sensor hardware clock.

### Memory game

The example repeats five rounds. Each round generates a list of three pod numbers and flashes them blue in order. The student repeats the sequence by clicking the matching pods. Correct sequences earn +20; incorrect responses or timeouts score -5. Change the sequence-length math block to make it easier/harder; variables are used to store the sequence.

### Color control

Use **Pods & Colors → set pod [number] color to [color]**. Insert a Math number block into the pod input. This can control all four simulated pods. Standard micro:bit LED matrices do not produce red/green/blue light. In experimental Bluetooth mode, the browser sends monochrome on/off LED matrix patterns regardless of chosen simulated color.

## Files

| File | Role |
|---|---|
| `index.html` | Layout and Google Blockly loading |
| `style.css` | Responsive visual styles |
| `app.js` | Custom Blockly blocks, interpreter, simulation, Bluetooth and restricted parent bridge |
| `editor.js` | JavaScript editor, starter programs and sandboxed game runner |
| `README.md` | This guide |
| `firmware/main.ts` | Minimal MakeCode source for Bluetooth input and LED matrix output |
| `firmware/README.md` | Setup and troubleshooting guide for physical micro:bits |

## One-micro:bit setup and troubleshooting

If Chrome shows your micro:bit but FreezePods still reports **0 ready**, Chrome device selection alone does not mean the board exposes the Bluetooth Button Service. A paired device may be in pairing mode without running a program that starts the required services.

1. Go to [MakeCode](https://makecode.microbit.org/), create a new program, and add the **Bluetooth extension**.
2. In MakeCode's JavaScript editor, use:

   ```typescript
   bluetooth.startButtonService()
   bluetooth.startLEDService()
   basic.showIcon(IconNames.Heart)
   ```

3. For initial testing, set MakeCode's Bluetooth security/pairing setting to **No Pairing Required**. Download the program to the micro:bit by USB and reset it so that the heart program is running.
4. On FreezePods, choose **micro:bit Bluetooth (test mode)**, select **Connect micro:bit**, and select the device from Chrome's chooser. You need only **one** board.
5. The diagnostics below the connection counter now show the stage: device selected, GATT connected, Button Service, and LED matrix. With one board ready, press A/B to confirm input and launch a Reaction game. Random targets use that board only.

If it still fails, copy the **Setup stopped** diagnostic and the **See game events** log. The exact error tells us whether discovery, GATT or firmware services are the blocker.

## Downloading and testing FreezePods firmware

A compiled firmware file named `microbit-bluettoth.hex` is currently being tested. **It has not been added to this repository or confirmed as the release firmware yet.** The source code lives at [firmware/main.ts](firmware/main.ts).

If you already have a compiled `.hex` file, you can install it onto a micro:bit using the official [micro:bit WebUSB HEX Download Tool](https://microbit.org/tools/webusb-hex-download-tool/). Connect your micro:bit by USB, select the HEX file, and follow the tool's instructions. This tool **flashes** compiled firmware; it does not compile the TypeScript source.

After flashing, reset the board once, connect it from the [FreezePods website](https://aaron-ragsdale.github.io/freezepods/) using **micro:bit Bluetooth (test mode)**, and check the game lights and button presses. Once the candidate firmware passes these checks, it can be added to the `firmware/` folder with a direct download link.

See the [full firmware setup instructions](firmware/README.md).

## LED troubleshooting and one-time firmware

Physical micro:bit LEDs use the built-in monochrome 5×5 display, not the simulation's RGB colors.

1. Connect at least one micro:bit in **Physical micro:bits** mode.
2. Choose the reaction game and press **Play game** to verify the LEDs illuminate when selected.
3. Press button A or B to respond. Open **See game events** if any errors appear.

The website serializes writes per device to avoid overlapping Bluetooth LED commands. The one-off diagnostic LED test button was removed from the main student interface.

The repository includes a reusable MakeCode program at **[firmware/main.ts](firmware/main.ts)** and detailed [one-time flashing instructions](firmware/README.md). Once you have compiled a `.hex` file in MakeCode, you can flash it to additional micro:bits with the official [micro:bit WebUSB HEX Download Tool](https://microbit.org/tools/webusb-hex-download-tool/). The WebUSB tool flashes an existing HEX file; it does not compile the source. That program starts the Bluetooth Button and LED services, then leaves the display clear rather than showing a permanent heart. We have included the firmware **source**, not a compiled HEX; compile and flash it through MakeCode. Once flashed, the same firmware is used by all student games.

If a browser reports that Bluetooth LED writes succeeded but the lights do not change, first flash the minimal firmware, reset once, reconnect, and try the LED test. Browser command success alone does not establish that physical LEDs illuminated.

## Bluetooth hardware (experimental, not validated)

The site supports Web Bluetooth in compatible desktop Chrome/Edge browsers over HTTPS. Connect **one to four** BBC micro:bits, each running compatible Bluetooth firmware. Press **Connect micro:bit** once per device. In hardware mode, random targets only select connected devices. The button service is required for input; the LED service is required for the onboard display to illuminate.

**Not yet verified on real micro:bits.** Chrome choosing a micro:bit is not sufficient: FreezePods must connect to the GATT button service and start notifications. The app now reports button readiness separately from LED support, and you can press A/B outside a running game to test input. If LED output is unavailable, check the firmware's BLE services. BLE timing, reconnection and firmware configuration still require testing. The site does not install firmware onto devices. For accurate reactions, a future hardware adapter should timestamp presses locally.

## Safety and limitations

Blockly blocks are interpreted through a whitelist of supported instructions: **no eval for Blockly**. The optional JavaScript editor runs student JavaScript using a sandboxed iframe with a restricted command bridge. Loops and execution time are capped. Variables reset at each Play. Imported games are Blockly JSON; only supported blocks execute. The app does not store personal data on a server.

## Attribution

Inspired by [nicoletart/freezepods](https://github.com/nicoletart/freezepods), and built with [Google Blockly](https://developers.google.com/blockly).
