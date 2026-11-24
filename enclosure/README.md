# FreezePods V2 — screw-free housing prototype

![Conceptual exploded assembly](graphics/exploded-assembly.svg)

A three-part printable housing for a micro:bit. No screws, nuts, bolts, washers or inserts are required.

## Parts and CAD

- [Editable OpenSCAD source](FreezePods.scad)
- [Base STL](FreezePods_base.stl): holds the board and optional battery pack.
- [Lid STL](FreezePods_lid.stl): snap-fit skirt with LED viewing window.
- [Ring pusher STL](FreezePods_pusher.stl): extended split legs contact the A/B buttons.

To export each STL using the free [OpenSCAD](https://openscad.org/) application, open the source, set `part` to `base`, `lid`, or `pusher`, render with F6 and export STL. All dimensions are in mm.

## Design dimensions

| Feature | V2 |
|---|---:|
| Board pocket | 53.2 × 43.2 mm |
| PCB thickness | 1.7 mm |
| Button centers | ±20.5 mm X, +1 mm Y |
| Pusher outer / inner diameter | 58 / 31 mm |
| Ring thickness | 4.5 mm |
| Nominal button clearance | 0.25 mm |
| Nominal travel | 0.85 mm |

## Printing

Print one of each part per pod. PETG recommended; 0.2 mm layers, 4 walls, 20% infill, 0.4 mm nozzle. Inspect the slicer preview for small snap features that may need support.

## Assembly

1. Place the optional 2×AAA battery pack between the support towers and route its cable.
2. Seat the micro:bit face up, USB toward +Y and edge connector toward −Y.
3. Insert the pusher into the lid from outside, gently compressing the split tips if needed.
4. Align lid snap windows with the base bumps and press together.
5. Test gentle presses and confirm the LED display remains visible.

Release the skirt fingers gently to remove the lid.

## Prototype limitations

Fit and snap strength are not physically validated. The pusher relies on the micro:bit button springs for return and may have free play. Measure actual button height (default 2.8 mm) and adjust clearance and travel as needed. Do not force a switch that bottoms out early. No dedicated battery retention or breakout mount is included. The board drawing used for nominal dimensions is a V1.5 drawing; verify your actual board revision before printing multiple units.

[Back to the FreezePods game lab](../README.md)
