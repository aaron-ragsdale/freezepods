# FreezePods Game Lab (v3: Blockly + JavaScript)

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

Supported methods: `pods.light(podNumber, color)`, `pods.all(color)`, `pods.off()`, `pods.wait(milliseconds)`, `pods.waitPress(timeoutMs)`, `pods.randomPod()`, `pods.addScore(points)`, `pods.nextRound()`, `pods.message(text)`, `pods.getState()`.

`pods.waitPress()` returns `null` on timeout or an object like `{pod:2,ms:450,correct:true}`. Pod numbers are **1 to 4**. The simulated pods support red, green, blue, yellow, purple, orange, white, and off.

### Safety limitations of JavaScript mode

Student scripts execute inside a `sandbox="allow-scripts"` iframe without same-origin permission and with a restrictive Content Security Policy. Only selected commands are forwarded to the parent through a validated message channel; scripts do not receive device objects or direct hardware APIs. The iframe is discarded when the game stops and a two-minute game limit is enforced for **cooperative/asynchronous programs**.

**This is an educational sandbox, not a hardened untrusted-code service.** A synchronous infinite loop can still freeze the browser tab, and the text mode is best used for student-written or reviewed code rather than arbitrary downloaded scripts. Use Blockly for less experienced users.

## Features

- **Starter games:** Reaction Game and Memory Game buttons at the top of the Blockly workspace.
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

## Bluetooth hardware (experimental, not validated)

The site supports Web Bluetooth in compatible desktop Chrome/Edge browsers over HTTPS. Connect **one to four** BBC micro:bits, each running compatible Bluetooth firmware. Press **Connect micro:bit** once per device. In hardware mode, random targets only select connected devices. The button service is required for input; the LED service is required for the onboard display to illuminate.

**Not yet verified on real micro:bits.** Chrome choosing a micro:bit is not sufficient: FreezePods must connect to the GATT button service and start notifications. The app now reports button readiness separately from LED support, and you can press A/B outside a running game to test input. If LED output is unavailable, check the firmware's BLE services. BLE timing, reconnection and firmware configuration still require testing. The site does not install firmware onto devices. For accurate reactions, a future hardware adapter should timestamp presses locally.

## Safety and limitations

Blockly blocks are interpreted through a whitelist of supported instructions: **no eval for Blockly**. The optional JavaScript editor runs student JavaScript using a sandboxed iframe with a restricted command bridge. Loops and execution time are capped. Variables reset at each Play. Imported games are Blockly JSON; only supported blocks execute. The app does not store personal data on a server.

## Attribution

Inspired by [nicoletart/freezepods](https://github.com/nicoletart/freezepods), and built with [Google Blockly](https://developers.google.com/blockly).
