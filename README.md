# FreezePods Blockly Game Lab (v2)

A free, static GitHub Pages website for students to invent physical reaction and memory games with Google Blockly. No React build, npm install, server, firmware compiler, or account is needed for **simulation**.

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
| `app.js` | Custom Blockly blocks, safe interpreter, templates, simulation, experimental BLE |
| `README.md` | This guide |

## Bluetooth hardware (experimental, not validated)

The site supports Web Bluetooth in compatible desktop Chrome/Edge browsers over HTTPS. To connect four BBC micro:bits, each must already have suitable firmware exposing Bluetooth Button and LED GATT services. Press **Connect micro:bit** once per device, and select Hardware mode before starting.

**Not yet verified on real micro:bits.** BLE timing, reconnection, correct firmware configuration, and other hardware limitations still require testing. The site does not install firmware onto devices. For accurate reactions, a future hardware adapter should timestamp presses locally.

## Safety and limitations

Student blocks are interpreted through a whitelist of supported instructions: **no eval or arbitrary compiled JavaScript**. Loops and execution time are capped. Variables reset at each Play. Imported games are Blockly JSON; only supported blocks execute. The app does not store personal data on a server.

## Attribution

Inspired by [nicoletart/freezepods](https://github.com/nicoletart/freezepods), and built with [Google Blockly](https://developers.google.com/blockly).
