# Monterey of AVIEW · Residence 5A — walkthrough

A first-person, browser-based walkthrough of Residence 5A at Monterey of AVIEW (5 Monterey Avenue,
Bishopscourt), generated from the PLATFORM Architects floor plans and the finishes specification in
the sales brochure. Open the front door on the driveway, walk through the entrance hall, up the
staircase to the living level, out to the patio and pool, and up again to the bedrooms.

## Run it

It is a static site. Either open `index.html` directly, or serve the folder:

```bash
cd monterey-walkthrough
python3 -m http.server 8000     # then open http://localhost:8000
```

Three.js is loaded from cdnjs; everything else (textures, geometry, furniture) is generated in the
browser from `js/house.js`.

## Controls

| Input | Action |
| --- | --- |
| `↑` `↓` or `W` `S` | walk forward / back (hold `Shift` to hurry) |
| `←` `→` | turn · `A` `D` side-step · `Q` `E` look up / down |
| Mouse | click the view to capture the pointer and look around (`Esc` releases); dragging also works |
| Trackpad | two-finger scroll up / down walks, left / right turns; drag to look |
| Touch | drag to look, on-screen arrows to walk |
| `M` `P` `T` `H` | mini map · architect's plan with your position · room list (jump straight to a room) · help |
| `R` / `F` | back to the front door / fullscreen |

Stairs are walked, not teleported: the main stair rises from the entrance hall along the west wall.

## How the house was built

* `js/house.js` — every room, wall, opening, stair, balustrade, slab, pergola and piece of furniture,
  in metres, transcribed from the ground, first and second floor plans (scale 1:100, "figured
  dimensions only"). Each room carries the nominal `(horizontal) x (vertical)` figure printed on the
  plan and the brochure finish for that space; these appear on the room card as you enter.
* `js/app.js` — builds the scene with Three.js: procedural Oggie-style herringbone oak, Calacatta-look
  engineered stone, off-shutter concrete ceilings, honed stone tiles, hardwood decking, timber slats and
  pergolas, bronze frames and brass fittings; sliding glass shown stacked open; first-person controls
  with wall collision and stair ramps; mini map; plan overlay; room cards with the brochure renders.
* `assets/` — the brochure renders (shown on the room cards), the three plan crops (for the plan
  overlay) and a 360° backdrop composited from the brochure's Constantiaberg and False Bay photographs.

Levels: ground 0.00 (datum 166.900) · first 3.40 · second 6.80 · roof 9.60. Footprint ≈ 13.6 × 17.5 m.

Known simplifications: furniture is indicative; the two stair flights to the bedroom floor are modelled
as a dog-leg within the well shown on the plan; the guest loo under the stair is 1.25 m wide inside the
well rather than the nominal 2.5 m; the angled south edge of the upper balcony is drawn straight.

`node build-single.mjs` writes `dist/monterey-walkthrough.html`, a single self-contained file with all
images inlined (used for sharing as a hosted artifact).
