/*
 * Monterey of AVIEW — Residence 5A
 * Geometry transcribed from the PLATFORM Architects floor plans in the sales brochure
 * (Ground / First / Second floor plans, scale 1:100, "figured dimensions only").
 *
 * Coordinate system (metres):
 *   x  → east  (0 = outer face of the west wall)
 *   y  → north (0 = outer face of the study's south wall on the first floor)
 *   Three.js: X = x, Z = -y, Y = height
 *
 * Levels: ground 0.00 (datum 166.900), first 3.40, second 6.80, roof 9.60
 * Overall footprint ≈ 13.6 m × 17.5 m (first floor 237 m², second 174 m², ground 149 m²).
 *
 * Where the plan labels a room, the nominal "(horizontal) x (vertical)" figure from the
 * plan is carried through as `dims` and shown in the room panel.
 */

const LEVELS = { 0: 0.0, 1: 3.4, 2: 6.8 };
const CLEAR = { 0: 3.1, 1: 3.1, 2: 2.8 };
const ROOF_Y = 9.6;

const SPEC = {
  oak: 'Oggie engineered oak flooring laid in a herringbone pattern',
  stone: 'Large-format honed stone tiles',
  deck: 'Hardwood timber deck',
  caesar: 'Engineered stone (Caesarstone or equivalent) countertops',
  hansgrohe: 'Hansgrohe sanitary fittings, heated towel rail',
  legrand: 'LeGrand Arteor switches and sockets, low-energy LED lighting throughout',
};

/* ------------------------------------------------------------------ ROOMS */
/* rect = [x0, y0, x1, y1] interior faces. floor: material key. ceil: material or null (open). */
const ROOMS = [
  // ---------------- GROUND FLOOR — Parking & Arrival
  { id: 'porch', level: 0, name: 'Front Door', sub: 'Arrival', rect: [4.55, 0.3, 7.0, 3.9], floor: 'paver', ceil: 'concrete', dims: 'covered porch',
    spec: 'The front door sits under the first-floor balcony, sheltered from the driveway. Timber pivot door with bronze ironmongery.', render: 'exterior-front', outside: true },
  { id: 'hall', level: 0, name: 'Main Entrance', sub: 'Ground floor', rect: [0.3, 0.3, 4.42, 3.68], floor: 'stone', ceil: 'plaster', dims: '4010 × 3280',
    spec: 'Arrival hall with the main staircase rising along the west wall to the living level. ' + SPEC.stone + ', feature timber cladding and a planted slot window to the street.', render: 'exterior-front' },
  { id: 'stair0', level: 0, name: 'Staircase', sub: 'Ground → first floor', rect: [0.3, 2.9, 1.5, 8.3], floor: 'stone', ceil: null, dims: 'to living level', spec: 'Oak treads on a concealed steel stringer, glass balustrade with a brass handrail.', stair: true },
  { id: 'laundry', level: 0, name: 'Laundry', sub: 'Hot water storage area', rect: [0.3, 6.5, 2.35, 10.15], floor: 'stone', ceil: 'plaster', dims: '2185 × 5000',
    spec: 'Laundry and hot-water storage tucked beneath the main staircase, with a service door to the garage.' },
  { id: 'laundry2', level: 0, name: 'Laundry', sub: 'Utility slot', rect: [1.57, 3.75, 2.35, 6.5], floor: 'stone', ceil: 'plaster', dims: '', spec: '', hidden: true },
  { id: 'garage', level: 0, name: 'Double Garage', sub: 'Automated', rect: [2.5, 3.98, 10.9, 10.15], floor: 'screed', ceil: 'concrete', dims: '8610 × 5950',
    spec: 'Double automated garage at datum level 166.900, with direct access to the laundry and the staff wing. Power-float screed floor, timber-slat sectional doors.' },
  { id: 'staff', level: 0, name: 'Staff Quarters', sub: 'Living / Kitchen / Dining', rect: [11.05, 2.5, 13.45, 8.15], floor: 'stone', ceil: 'plaster', dims: '2620 × 5750',
    spec: 'En-suite staff room with its own separate entrance from the front garden. Kitchenette, living and sleeping space.' },
  { id: 'staffbath', level: 0, name: 'Staff Bathroom', sub: 'New bath', rect: [11.05, 8.3, 13.45, 10.15], floor: 'stone', ceil: 'plaster', dims: '2620 × 1787',
    spec: 'Shower, basin and WC with ' + SPEC.hansgrohe.toLowerCase() + '.' },
  { id: 'driveway', level: 0, name: 'Driveway', sub: 'Common driveway & entrance', rect: [2.5, -9, 20, 3.98], floor: 'paver', ceil: null, dims: '377 m² shared', spec: 'Cobbled driveway from the 24-hour security guardhouse at the single access point.', outside: true, render: 'exterior-front' },
  { id: 'frontgarden', level: 0, name: 'Front Garden', sub: '', rect: [13.6, 3.98, 22, 10.45], floor: 'lawn', ceil: null, dims: '', spec: 'Front garden and rear-garden access stair beside the staff entrance.', outside: true },
  { id: 'frontgardenW', level: 0, name: 'Front Garden', sub: '', rect: [-8, -9, 0, 10.45], floor: 'lawn', ceil: null, dims: '', spec: 'Planted front garden.', outside: true },
  { id: 'frontgardenE', level: 0, name: 'Front Garden', sub: '', rect: [13.6, -9, 22, 3.98], floor: 'lawn', ceil: null, dims: '', spec: 'Front garden and security room.', outside: true },

  // ---------------- FIRST FLOOR — Living
  { id: 'entrance', level: 1, name: 'Entrance', sub: 'First floor arrival', rect: [0.3, 8.3, 4.55, 10.4], floor: 'oak', ceil: 'plaster', dims: '4130 × 2400',
    spec: 'Arrival at the living level. The double-volume patio opens straight ahead, the kitchen and dining to the right, the lounge beyond. ' + SPEC.oak + '.', render: 'dining-kitchen' },
  { id: 'stairvoid', level: 1, name: 'Staircase', sub: 'From the entrance hall', rect: [0.3, 2.9, 1.5, 8.3], floor: 'oak', ceil: 'plaster', dims: '', spec: '', stair: true, hidden: true },
  { id: 'study', level: 1, name: 'Study', sub: 'With unparalleled views', rect: [0.3, 0.3, 4.42, 3.0], floor: 'oak', ceil: 'plaster', dims: '4010 × 2800',
    spec: 'A quiet study reached from the west end of the balcony, with a full-width picture window over the Constantia Valley to False Bay. Floating oak desk, full-height joinery bookcase.', render: 'study' },
  { id: 'scullery', level: 1, name: 'Scullery / Pantry', sub: 'Behind the kitchen', rect: [1.75, 3.2, 4.55, 8.3], floor: 'stone', ceil: 'plaster', dims: '2800 × 4200',
    spec: 'Working scullery and walk-in pantry behind the kitchen wall, with a pocket door to the entrance and a concealed door into the kitchen joinery. Miele appliances.' },
  { id: 'kitchen', level: 1, name: 'Kitchen', sub: 'Designer kitchen', rect: [4.55, 3.95, 8.5, 9.3], floor: 'oak', ceil: 'concrete', dims: '3700 × 5200',
    spec: 'Designer kitchen with state-of-the-art Miele appliances, gas hob on a Calacatta-look engineered stone island with seating for five, tall taupe oak joinery with integrated ovens and a lit stone splashback niche.', render: 'dining-kitchen' },
  { id: 'dining', level: 1, name: 'Dining', sub: 'Open plan', rect: [8.5, 3.95, 13.3, 9.3], floor: 'oak', ceil: 'concrete', dims: '5000 × 5200',
    spec: 'Eight-seat dining beneath a cluster of glass globe pendants; sliding doors onto the south balcony and a garden door on the east side. ' + SPEC.oak + '.', render: 'dining-kitchen' },
  { id: 'balcony1', level: 1, name: 'Balcony', sub: 'South — sea view', rect: [4.55, 1.6, 13.3, 3.8], floor: 'stone', ceil: 'concrete', dims: '8850 × 2220',
    spec: 'Full-width balcony off the kitchen and dining with the stunning southern view over Constantia Valley and False Bay. Frameless glass balustrade.', outside: true, render: 'exterior-rear' },
  { id: 'gallery', level: 1, name: 'Living Gallery', sub: 'Between kitchen and lounge', rect: [2.98, 9.3, 13.05, 11.2], floor: 'oak', ceil: 'concrete', dims: '',
    spec: 'The open living floor flows from the kitchen and dining, past the double-volume patio, into the lounge.', render: 'patio-pool', hidden: true },
  { id: 'lounge', level: 1, name: 'Lounge', sub: 'Fireplace, hidden TV', rect: [8.0, 11.2, 13.05, 15.76], floor: 'oak', ceil: 'concrete', dims: '5000 × 4560',
    spec: 'Spacious lounge with a highly efficient wood-burning fireplace by Beauty Fires, a hidden television behind an art panel that slides open, and sliding glass to the patio (west) and pool deck (north).', render: 'lounge' },
  { id: 'patio', level: 1, name: 'Patio', sub: 'Double volume under a pergola', rect: [3.05, 11.2, 8.0, 17.5], floor: 'deck', ceil: null, dims: '5150 × 6300',
    spec: 'Double-volume covered patio beneath a timber pergola, opening north onto the rear garden and pool. Outdoor dining for eight, built-in braai in the western nook.', outside: true, render: 'patio-pool' },
  { id: 'nook', level: 1, name: 'Braai Nook', sub: 'Patio', rect: [0.3, 14.25, 2.98, 17.5], floor: 'deck', ceil: null, dims: '', spec: 'Built-in braai with a stone counter and timber-clad wall.', outside: true, render: 'patio-pool' },
  { id: 'pooldeck', level: 1, name: 'Pool Deck', sub: 'Hardwood deck', rect: [8.0, 15.9, 13.3, 17.5], floor: 'deck', ceil: 'concrete', dims: '',
    spec: 'Hardwood deck between the lounge and the swimming pool, with two sun loungers and a planter on the east.', outside: true, render: 'patio-pool' },
  { id: 'reargarden', level: 1, name: 'Rear Garden', sub: 'Exclusive-use garden 344 m²', rect: [-8, 17.5, 22, 30], floor: 'lawn', ceil: null, dims: '',
    spec: 'Level lawn behind the house, facing north for sun. Swimming pool 3000 × 4500 surrounded by a hardwood deck.', outside: true, render: 'exterior-rear' },
  { id: 'reargardenW', level: 1, name: 'Rear Garden', sub: '', rect: [-8, 10.45, 0, 17.5], floor: 'lawn', ceil: null, dims: '', spec: 'Garden terrace on the west.', outside: true },
  { id: 'reargardenE', level: 1, name: 'Rear Garden', sub: '', rect: [13.6, 10.45, 22, 17.5], floor: 'lawn', ceil: null, dims: '', spec: 'Rear garden access from the front garden stair.', outside: true },
  { id: 'gardenterrace', level: 1, name: 'Garden Terrace', sub: 'West', rect: [-5, 3.5, 0, 10.45], floor: 'lawn', ceil: null, dims: '', spec: 'Raised garden terrace on the west side at living level.', outside: true },
  { id: 'loonook', level: 1, name: 'Entrance', sub: 'Art nook', rect: [1.65, 10.4, 2.9, 11.2], floor: 'oak', ceil: 'plaster', dims: '', spec: '', hidden: true },
  { id: 'guestloo', level: 1, name: 'Guest Loo', sub: 'Under the stair', rect: [1.65, 11.2, 2.9, 13.1], floor: 'stone', ceil: 'plaster', h: 2.0, dims: '2500 × 1600',
    spec: 'Guest cloakroom tucked under the upper staircase. Wall-hung WC, stone basin, brass tapware.' },
  { id: 'stair1', level: 1, name: 'Staircase', sub: 'To the bedrooms', rect: [0.3, 10.4, 2.9, 14.1], floor: 'oak', ceil: null, dims: '', spec: 'Dog-leg stair to the bedroom floor, lit by a slot window.', stair: true, hidden: true },

  // ---------------- SECOND FLOOR — Bedrooms
  { id: 'stair2', level: 2, name: 'Staircase', sub: 'Second floor', rect: [0.3, 10.4, 2.9, 14.1], floor: 'oak', ceil: 'plaster', dims: '', spec: 'Top of the stair, arriving at the library gallery.', stair: true },
  { id: 'library', level: 2, name: 'Library', sub: 'Gallery over the double volume', rect: [2.98, 9.5, 8.05, 11.2], floor: 'oak', ceil: 'plaster', dims: '1300 × 5150',
    spec: 'A book-lined gallery bridging the double-volume patio below, behind a timber-slat screen. It links the main suite with the family bedrooms.', render: 'exterior-rear' },
  { id: 'mainlobby', level: 2, name: 'Main Suite', sub: 'Lobby', rect: [2.98, 6.6, 4.4, 9.42], floor: 'oak', ceil: 'plaster', dims: '', spec: 'Lobby to the main bedroom, dressing room and en-suite.', hidden: true },
  { id: 'dressing', level: 2, name: 'Main Dressing', sub: 'Walk-through dressing room', rect: [4.25, 7.5, 7.15, 9.35], floor: 'oak', ceil: 'plaster', dims: '2900 × 1900',
    spec: 'Dressing room with full-height smoked-oak wardrobes on both sides and a lit island of drawers.', render: 'ensuite' },
  { id: 'mainbed', level: 2, name: 'Main Bedroom', sub: 'North-facing en-suite behind the bed', rect: [0.3, 2.9, 4.4, 6.6], floor: 'oak', ceil: 'plaster', dims: '4350 × 3700',
    spec: 'Main bedroom with sliding doors to its own south balcony. The bed sits against a half-height headboard wall with the open-plan en-suite behind it, exactly as rendered in the brochure.', render: 'main-bedroom' },
  { id: 'mainens', level: 2, name: 'Main En-Suite', sub: 'Open to the bedroom', rect: [0.3, 6.6, 2.9, 10.35], floor: 'stone', ceil: 'plaster', dims: '2700 × 3700',
    spec: 'Freestanding bath against a book-matched marble wall, walk-in shower, separate WC and a double vanity in engineered stone on the back of the headboard wall. ' + SPEC.hansgrohe + '.', render: 'main-bedroom' },
  { id: 'balcony2m', level: 2, name: 'Balcony', sub: 'Main bedroom', rect: [0.3, 0.85, 4.4, 2.75], floor: 'stone', ceil: 'concrete', dims: '4000 × 2050',
    spec: 'Private balcony off the main bedroom with planter boxes along the edge and a timber-slat privacy screen.', outside: true, render: 'exterior-rear' },
  { id: 'bed4', level: 2, name: 'Bedroom 4 / Study', sub: 'South-facing', rect: [4.55, 3.2, 8.35, 7.35], floor: 'oak', ceil: 'plaster', dims: '3750 × 4500',
    spec: 'Fourth bedroom or second study, with built-in wardrobes and sliding doors to the long south balcony.' },
  { id: 'passage', level: 2, name: 'Balcony Passage', sub: '', rect: [8.5, 3.2, 9.4, 7.5], floor: 'oak', ceil: 'plaster', dims: '', spec: 'Passage from the bedroom lobby to the long balcony.', hidden: true },
  { id: 'bed3', level: 2, name: 'Bedroom 3', sub: 'South-east corner', rect: [9.55, 3.2, 13.3, 7.35], floor: 'oak', ceil: 'plaster', dims: '4230 × 4000',
    spec: 'Third bedroom with wardrobes, a picture window to the east and sliding doors onto the balcony.' },
  { id: 'balcony2', level: 2, name: 'Balcony', sub: 'Bedrooms 3 & 4', rect: [4.55, 1.55, 13.3, 3.05], floor: 'stone', ceil: 'concrete', dims: '9200 × 1650',
    spec: 'Long south balcony shared by bedrooms 3 and 4, each showcasing the vista over Constantia Valley and False Bay.', outside: true, render: 'exterior-rear' },
  { id: 'lobby', level: 2, name: 'Bedroom Lobby', sub: '', rect: [7.3, 7.5, 10.4, 11.3], floor: 'oak', ceil: 'plaster', dims: '', spec: 'Lobby serving bedrooms 2, 3 and 4, the shared bathroom and the balcony passage.', hidden: true },
  { id: 'sharedbath', level: 2, name: 'Shared Bathroom', sub: 'Bedrooms 3 & 4', rect: [10.55, 7.5, 13.3, 9.35], floor: 'stone', ceil: 'plaster', dims: '3120 × 1850',
    spec: 'Bath with overhead shower, vanity and WC. ' + SPEC.hansgrohe + '.', render: 'ensuite' },
  { id: 'ens2', level: 2, name: 'En-Suite', sub: 'Bedroom 2', rect: [10.55, 9.5, 13.3, 11.3], floor: 'stone', ceil: 'plaster', dims: '3120 × 1850',
    spec: 'Walk-in shower, vanity and WC with a slatted window to the east. ' + SPEC.hansgrohe + '.', render: 'ensuite' },
  { id: 'bed2', level: 2, name: 'Bedroom 2', sub: 'En-suite, north terrace', rect: [8.1, 11.45, 13.3, 15.3], floor: 'oak', ceil: 'plaster', dims: '5000 × 3850',
    spec: 'Second bedroom with its own en-suite, a wall of wardrobes and sliding doors onto a private north-facing roof terrace under the pergola.' },
  { id: 'terrace2', level: 2, name: 'Roof Terrace', sub: 'Bedroom 2 — pergola over', rect: [8.1, 15.45, 13.3, 17.5], floor: 'deck', ceil: null, dims: '',
    spec: 'Sunny north terrace over the pool deck, beneath the timber pergola.', outside: true, render: 'exterior-rear' },
];

/* ------------------------------------------------------------------ WALLS
 * [level, x0, y0, x1, y1, thickness, {h, openings:[{at, w, type, sill, head, hinge}]}]
 * types: door (hinged, shown open), slide (stacked sliding glass), glass (fixed full pane),
 *        window (glazed with sill), open (plain opening), garage (raised sectional door),
 *        slats (timber-slat privacy glazing)
 */
const WALLS = [
  // ===== GROUND FLOOR
  [0, 0.15, 0.0, 0.15, 10.45, 0.3, { openings: [{ at: 4.2, w: 1.8, type: 'slats', sill: 1.5, head: 2.5 }] }],
  [0, 0.0, 0.15, 4.55, 0.15, 0.3, { openings: [{ at: 2.3, w: 1.8, type: 'window', sill: 1.7, head: 2.5 }] }],
  [0, 4.42, 0.3, 4.42, 3.75, 0.25, { openings: [{ at: 1.0, w: 1.25, type: 'door', head: 2.7, hinge: 'end', swing: 1, front: true }] }],
  [0, 1.5, 3.68, 4.42, 3.68, 0.15, { openings: [{ at: 0.2, w: 0.85, type: 'door', head: 2.1, hinge: 'start', swing: 1 }] }],
  [0, 1.57, 2.9, 1.57, 6.5, 0.15, {}],
  [0, 2.42, 3.75, 2.42, 10.15, 0.15, { openings: [{ at: 4.3, w: 0.9, type: 'door', head: 2.1, hinge: 'start', swing: -1 }] }],
  [0, 2.42, 3.98, 10.97, 3.98, 0.25, { openings: [{ at: 0.5, w: 3.7, type: 'garage', head: 2.4 }, { at: 4.5, w: 3.7, type: 'garage', head: 2.4 }] }],
  [0, 0.0, 10.3, 13.6, 10.3, 0.3, {}],
  [0, 10.97, 2.5, 10.97, 10.15, 0.15, {}],
  [0, 11.05, 8.22, 13.45, 8.22, 0.12, { openings: [{ at: 0.3, w: 0.8, type: 'door', head: 2.1, hinge: 'start', swing: 1 }] }],
  [0, 13.45, 2.5, 13.45, 10.45, 0.3, { openings: [{ at: 1.7, w: 0.9, type: 'door', head: 2.1, hinge: 'start', swing: 1 }, { at: 3.4, w: 1.6, type: 'window', sill: 0.9, head: 2.3 }, { at: 6.3, w: 1.0, type: 'slats', sill: 1.5, head: 2.3 }] }],
  [0, 11.05, 2.5, 13.45, 2.5, 0.3, { openings: [{ at: 0.5, w: 1.4, type: 'window', sill: 0.9, head: 2.3 }] }],

  // ===== FIRST FLOOR
  [1, 0.15, 0.0, 0.15, 17.5, 0.3, { openings: [{ at: 4.0, w: 3.0, type: 'slats', sill: 1.2, head: 2.6 }, { at: 8.6, w: 1.4, type: 'slats', sill: 1.4, head: 2.6 }, { at: 12.2, w: 1.2, type: 'slats', sill: 1.6, head: 2.8 }] }],
  [1, 0.0, 0.15, 4.55, 0.15, 0.3, { openings: [{ at: 0.6, w: 3.5, type: 'window', sill: 0.85, head: 2.55 }] }],
  [1, 4.42, 0.3, 4.42, 3.2, 0.25, { openings: [{ at: 1.4, w: 0.9, type: 'door', head: 2.4, hinge: 'start', swing: 1 }] }],
  [1, 0.3, 3.1, 4.55, 3.1, 0.2, {}],
  [1, 1.62, 3.1, 1.62, 8.3, 0.25, {}],
  [1, 4.67, 3.2, 4.67, 8.3, 0.25, { openings: [{ at: 4.3, w: 0.9, type: 'door', head: 2.4, hinge: 'start', swing: 1, flush: true }] }],
  [1, 1.62, 8.3, 4.67, 8.3, 0.2, { openings: [{ at: 0.6, w: 1.0, type: 'open', head: 2.4 }] }],
  [1, 4.55, 3.87, 13.3, 3.87, 0.15, { h: 3.1, openings: [{ at: 0.25, w: 8.4, type: 'slide', head: 2.9, panels: 6, openFrom: 'start', openCount: 3 }] }],
  [1, 13.45, 3.8, 13.45, 9.3, 0.3, { openings: [{ at: 0.3, w: 3.0, type: 'glass', sill: 0.1, head: 2.9 }, { at: 3.5, w: 1.0, type: 'door', head: 2.6, glass: true, hinge: 'start', swing: 1 }] }],
  [1, 13.45, 9.3, 13.45, 15.9, 0.3, {}],
  [1, 8.0, 15.83, 13.3, 15.83, 0.15, { openings: [{ at: 0.2, w: 4.9, type: 'slide', head: 2.9, panels: 4, openFrom: 'start', openCount: 2 }] }],
  [1, 8.0, 11.2, 8.0, 15.76, 0.15, { openings: [{ at: 0.2, w: 4.2, type: 'slide', head: 2.9, panels: 4, openFrom: 'end', openCount: 2 }] }],
  [1, 3.05, 11.12, 8.0, 11.12, 0.15, { openings: [{ at: 0.15, w: 4.65, type: 'slide', head: 2.9, panels: 4, openFrom: 'start', openCount: 3 }] }],
  [1, 2.98, 10.4, 2.98, 14.25, 0.15, {}],
  [1, 1.57, 11.2, 1.57, 13.1, 0.15, {}],
  [1, 1.57, 11.2, 2.98, 11.2, 0.12, { h: 3.1, openings: [{ at: 0.3, w: 0.8, type: 'door', head: 2.0, hinge: 'start', swing: -1 }] }],
  [1, 0.3, 14.18, 2.98, 14.18, 0.15, {}],
  [1, 0.3, 17.42, 1.4, 17.42, 0.15, { h: 1.0 }],
  [1, 1.57, 10.4, 1.57, 13.1, 0.12, { h: 3.3 }],

  // ===== SECOND FLOOR
  [2, 0.15, 0.3, 0.15, 14.25, 0.3, { openings: [{ at: 6.7, w: 2.4, type: 'slats', sill: 1.1, head: 2.4 }, { at: 10.4, w: 1.6, type: 'slats', sill: 0.9, head: 2.4 }] }],
  [2, 0.3, 2.83, 4.4, 2.83, 0.15, { openings: [{ at: 0.15, w: 3.8, type: 'slide', head: 2.6, panels: 3, openFrom: 'start', openCount: 1 }] }],
  [2, 4.47, 0.85, 4.47, 7.5, 0.15, {}],
  [2, 8.42, 3.2, 8.42, 7.5, 0.15, {}],
  [2, 9.47, 3.2, 9.47, 7.5, 0.15, {}],
  [2, 9.47, 7.42, 13.3, 7.42, 0.15, { openings: [{ at: 0.15, w: 0.85, type: 'door', head: 2.2, hinge: 'end', swing: -1 }] }],
  [2, 4.4, 7.42, 8.5, 7.42, 0.15, { openings: [{ at: 3.15, w: 0.85, type: 'door', head: 2.2, hinge: 'end', swing: -1 }] }],
  [2, 4.17, 7.5, 4.17, 9.42, 0.15, { openings: [{ at: 0.75, w: 0.9, type: 'door', head: 2.2, hinge: 'start', swing: -1 }] }],
  [2, 7.22, 7.5, 7.22, 9.42, 0.15, {}],
  [2, 2.98, 9.42, 7.3, 9.42, 0.15, { openings: [{ at: 0.15, w: 0.95, type: 'door', head: 2.2, hinge: 'start', swing: -1 }] }],
  [2, 2.98, 6.6, 2.98, 10.4, 0.15, { openings: [{ at: 1.4, w: 0.9, type: 'door', head: 2.2, hinge: 'start', swing: 1 }] }],
  [2, 0.3, 10.35, 2.98, 10.35, 0.15, {}],
  [2, 2.98, 10.4, 2.98, 14.25, 0.15, { openings: [{ at: 0.05, w: 0.85, type: 'open', head: 2.6 }] }],
  [2, 0.3, 14.18, 2.98, 14.18, 0.15, {}],
  [2, 0.3, 6.6, 2.98, 6.6, 0.25, { h: 1.35 }],  // headboard / vanity wall (half height)
  [2, 8.1, 11.37, 13.3, 11.37, 0.15, { openings: [{ at: 1.1, w: 0.9, type: 'door', head: 2.2, hinge: 'start', swing: 1 }] }],
  [2, 8.02, 11.37, 8.02, 15.45, 0.15, { openings: [{ at: 1.3, w: 2.0, type: 'slats', sill: 0.9, head: 2.4 }] }],
  [2, 8.1, 15.37, 13.3, 15.37, 0.15, { openings: [{ at: 0.2, w: 4.9, type: 'slide', head: 2.6, panels: 4, openFrom: 'end', openCount: 2 }] }],
  [2, 13.45, 3.05, 13.45, 15.45, 0.3, { openings: [{ at: 1.0, w: 2.6, type: 'window', sill: 0.9, head: 2.4 }, { at: 5.0, w: 1.6, type: 'slats', sill: 1.5, head: 2.4 }, { at: 7.0, w: 1.4, type: 'slats', sill: 1.5, head: 2.4 }, { at: 9.2, w: 2.6, type: 'slats', sill: 0.9, head: 2.4 }] }],
  [2, 10.47, 9.5, 10.47, 11.37, 0.15, { openings: [{ at: 0.3, w: 0.85, type: 'door', head: 2.2, hinge: 'start', swing: -1 }] }],
  [2, 10.47, 9.42, 13.3, 9.42, 0.15, {}],
  [2, 10.47, 7.5, 10.47, 9.42, 0.15, { openings: [{ at: 0.6, w: 0.85, type: 'door', head: 2.2, hinge: 'start', swing: -1 }] }],
  [2, 9.55, 3.13, 13.3, 3.13, 0.15, { openings: [{ at: 0.3, w: 3.2, type: 'slide', head: 2.6, panels: 3, openFrom: 'end', openCount: 1 }] }],
  [2, 4.55, 3.13, 8.42, 3.13, 0.15, { openings: [{ at: 0.3, w: 3.3, type: 'slide', head: 2.6, panels: 3, openFrom: 'start', openCount: 1 }] }],
  [2, 8.42, 3.13, 9.47, 3.13, 0.15, { openings: [{ at: 0.12, w: 0.85, type: 'door', head: 2.4, glass: true, hinge: 'start', swing: 1 }] }],
];

/* ------------------------------------------------------------------ STAIRS
 * {level(base), x0,y0,x1,y1 (footprint), dir: 'n'|'s'|'e'|'w' (direction of ascent), rise, yBase}
 */
const STAIRS = [
  { id: 'gf-ff', x0: 0.3, y0: 2.9, x1: 1.5, y1: 8.3, dir: 'n', yBase: 0.0, rise: 3.4, risers: 19 },
  { id: 'ff-land', x0: 0.3, y0: 10.4, x1: 1.5, y1: 13.1, dir: 'n', yBase: 3.4, rise: 2.0, risers: 12, railSide: 'x1' },
  { id: 'landing', x0: 0.3, y0: 13.1, x1: 2.9, y1: 14.1, flat: true, yBase: 5.4 },
  { id: 'land-sf', x0: 1.65, y0: 11.0, x1: 2.9, y1: 13.1, dir: 's', yBase: 5.4, rise: 1.4, risers: 8 },
  { id: 'sf-arrive', x0: 0.3, y0: 10.4, x1: 2.9, y1: 11.0, flat: true, yBase: 6.8 },
  { id: 'garden', x0: 13.7, y0: 6.0, x1: 15.0, y1: 10.45, dir: 'n', yBase: 0.0, rise: 3.4, risers: 19, outside: true },
];

/* ------------------------------------------------------------------ BALUSTRADES
 * [level, x0,y0,x1,y1, type: 'glass'|'slats'|'planter']
 */
const BALUSTRADES = [
  [1, 4.55, 1.6, 13.3, 1.6, 'glass'],
  [1, 13.3, 1.6, 13.3, 3.8, 'glass'],
  [1, 13.3, 15.9, 13.3, 17.5, 'planter'],
  [2, 2.98, 11.2, 8.05, 11.2, 'slats'],     // library gallery over the void
  [2, 7.3, 11.2, 8.02, 11.2, 'slats'],
  [2, 4.55, 1.55, 13.3, 1.55, 'glass'],
  [2, 13.3, 1.55, 13.3, 3.05, 'glass'],
  [2, 0.3, 0.85, 4.4, 0.85, 'glass'],
  [2, 0.3, 0.3, 4.4, 0.3, 'planter'],
  [2, 4.47, 0.85, 4.47, 1.55, 'wall'],
  [2, 8.1, 17.5, 13.3, 17.5, 'glass'],
  [2, 13.3, 15.45, 13.3, 17.5, 'glass'],
  [2, 8.02, 15.45, 8.02, 17.5, 'wall'],
];

/* ------------------------------------------------------------------ SLABS (floor/ceiling plates)
 * [yBottom, yTop, x0,y0,x1,y1]   — holes are handled by listing the plates around them
 */
const SLABS = [
  // first-floor slab (over ground floor) — bottom 3.1, top 3.4
  [3.1, 3.4, 0, 0, 13.6, 10.45],
  [3.1, 3.4, 0, 10.45, 13.6, 17.5],          // slab on ground behind (patio / lounge sit on fill)
  // second-floor slab — bottom 6.5, top 6.8 (void over patio + braai nook left open)
  [6.5, 6.8, 0, 0.3, 2.98, 14.25],
  [6.5, 6.8, 2.98, 0.3, 13.6, 11.2],
  [6.5, 6.8, 8.02, 11.2, 13.6, 17.5],
  [6.5, 6.8, 4.55, 0, 13.6, 0.3],
  // roof — bottom 9.6, top 9.9
  [9.6, 9.9, 0, 0.3, 2.98, 14.25],
  [9.6, 9.9, 2.98, 0.3, 13.6, 11.2],
  [9.6, 9.9, 8.02, 11.2, 13.6, 15.45],
  [9.6, 9.9, 0, 0, 13.6, 0.3],
];
// stair-void openings cut from the first-floor slab are modelled by omitting a plate: the plate above
// the ground-floor staircase (x 0.3..1.5, y 2.9..8.3) is removed by drawing that slab in two parts.
SLABS[0] = null;
SLABS.push([3.1, 3.4, 0, 0, 13.6, 2.9], [3.1, 3.4, 1.5, 2.9, 13.6, 8.3], [3.1, 3.4, 0, 8.3, 13.6, 10.45], [3.1, 3.4, 0, 2.9, 0.3, 8.3]);
// second-floor slab over the first-floor stair well (x 0.3..2.9, y 10.4..14.1) is open where the flights pass
const SLAB_LIST = SLABS.filter(Boolean).flatMap(s => {
  // cut the stair well out of the 2nd-floor west plate
  if (s[0] === 6.5 && s[2] === 0 && s[5] === 14.25) {
    return [[6.5, 6.8, 0, 0.3, 2.98, 10.4], [6.5, 6.8, 0, 10.4, 0.3, 14.25], [6.5, 6.8, 0, 14.1, 2.98, 14.25]];
  }
  return [s];
});

/* ------------------------------------------------------------------ PERGOLAS / SLAT SCREENS
 * pergola: [yTop, x0,y0,x1,y1, direction 'x'|'y']  (slats 60×160 @ 300 c/c)
 */
const PERGOLAS = [
  [9.75, 2.98, 11.2, 8.02, 17.5, 'x'],   // over the double-volume patio
  [9.75, 0.3, 14.25, 2.98, 17.5, 'x'],    // over the braai nook
  [9.75, 8.02, 15.45, 13.6, 17.5, 'y'],   // over bedroom-2 terrace
  [6.65, 8.0, 17.5, 13.6, 19.2, 'y'],     // pool-side pergola projecting from the pool deck
];
// exterior timber-slat screens on the second-floor facade: [x0,y0,x1,y1, yBottom, yTop]
const SCREENS = [
  [13.35, 1.6, 13.35, 3.05, 6.9, 9.5],  // side privacy screens to the balconies
  [0.15, 0.85, 0.15, 2.8, 6.9, 9.5],
  [4.47, 0.85, 4.47, 1.55, 6.9, 9.5],
  [2.98, 17.5, 8.02, 17.5, 6.9, 9.5],  // slat screen closing the void toward the garden at upper level
];

/* ------------------------------------------------------------------ FURNITURE
 * { t: type, l: level, x, y, r (rotation deg, 0 = facing north/+y), ...params }
 */
const FURNITURE = [
  // ground floor
  { t: 'car', l: 0, x: 4.9, y: 7.0, r: 0 },
  { t: 'car', l: 0, x: 8.6, y: 7.0, r: 0, color: 0x2b2b30 },
  { t: 'washer', l: 0, x: 0.75, y: 9.75, r: 180 }, { t: 'washer', l: 0, x: 1.45, y: 9.75, r: 180 },
  { t: 'counter', l: 0, x: 1.1, y: 8.6, r: 90, w: 1.4, d: 0.6, top: 'caesar' },
  { t: 'geyser', l: 0, x: 1.95, y: 4.5 },
  { t: 'console', l: 0, x: 2.2, y: 3.3, r: 180, w: 1.6 },
  { t: 'art', l: 0, x: 0.34, y: 1.9, r: 270, w: 1.4, h: 1.0, style: 'green' },
  { t: 'plant', l: 0, x: 3.9, y: 0.7, s: 1.2 },
  { t: 'planter', l: 0, x: 1.4, y: -0.25, w: 2.2, d: 0.5 },
  { t: 'bed', l: 0, x: 12.4, y: 3.9, r: 180, w: 1.4, len: 2.0, low: true },
  { t: 'kitchenette', l: 0, x: 11.37, y: 6.6, r: 270, w: 2.0 },
  { t: 'sofa', l: 0, x: 11.55, y: 4.6, r: 270, w: 1.5 },
  { t: 'shower', l: 0, x: 11.55, y: 9.65, r: 0, w: 0.9, d: 0.9, glass: 'se' },
  { t: 'wc', l: 0, x: 12.6, y: 9.85, r: 180 },
  { t: 'vanity', l: 0, x: 13.1, y: 8.9, r: 270, w: 0.9 },
  { t: 'box', l: 0, x: 17.0, y: -5.2, w: 2.2, d: 2.2, h: 2.7, mat: 'stoneWall', label: 'Security room' },
  // first floor
  { t: 'desk', l: 1, x: 2.4, y: 0.95, r: 0, w: 3.6 },
  { t: 'bookcase', l: 1, x: 0.5, y: 1.9, r: 270, w: 2.2, h: 3.0, dark: true },
  { t: 'chair', l: 1, x: 2.4, y: 1.6, r: 180, office: true },
  { t: 'rug', l: 1, x: 2.4, y: 1.8, w: 2.4, d: 1.6, color: 0x6a6a5f },
  { t: 'sculleryRun', l: 1, x: 2.05, y: 5.75, r: 270, w: 4.6 },
  { t: 'sculleryRun', l: 1, x: 4.25, y: 5.75, r: 90, w: 4.6, tall: true },
  { t: 'kitchenTall', l: 1, x: 5.1, y: 6.6, r: 270, w: 5.3 },
  { t: 'island', l: 1, x: 6.95, y: 6.8, r: 0, w: 1.1, len: 3.9 },
  { t: 'diningTable', l: 1, x: 10.9, y: 6.6, r: 0 },
  { t: 'rug', l: 1, x: 10.9, y: 6.6, w: 3.6, d: 4.6, color: 0xb9ad98 },
  { t: 'pendantCluster', l: 1, x: 10.9, y: 6.6, y0: 3.1 },
  { t: 'console', l: 1, x: 12.95, y: 5.3, r: 90, w: 1.8, dark: true },
  { t: 'plant', l: 1, x: 12.7, y: 4.4, s: 1.8 },
  { t: 'plant', l: 1, x: 9.0, y: 10.5, s: 1.6 },
  { t: 'tvWall', l: 1, x: 12.78, y: 13.5, r: 90, w: 4.4 },
  { t: 'sofa', l: 1, x: 9.6, y: 13.6, r: 270, w: 3.4, curved: true },
  { t: 'armchair', l: 1, x: 12.0, y: 15.0, r: 200, olive: true },
  { t: 'armchair', l: 1, x: 12.1, y: 12.0, r: 330, olive: true },
  { t: 'coffeeTable', l: 1, x: 11.0, y: 13.5 },
  { t: 'rug', l: 1, x: 10.6, y: 13.5, w: 4.4, d: 3.8, color: 0xaea79a },
  { t: 'pendantGlobes', l: 1, x: 10.6, y: 13.5, y0: 3.1 },
  { t: 'art', l: 1, x: 13.02, y: 10.2, r: 90, w: 1.2, h: 1.4, style: 'bronze' },
  { t: 'art', l: 1, x: 5.8, y: 8.34, r: 0, w: 1.3, h: 1.0, style: 'green', z: 1.5 },
  { t: 'outdoorTable', l: 1, x: 5.5, y: 14.6, r: 0 },
  { t: 'braai', l: 1, x: 0.75, y: 16.2, r: 270 },
  { t: 'lounger', l: 1, x: 9.1, y: 16.7, r: 0 }, { t: 'lounger', l: 1, x: 11.9, y: 16.7, r: 0 },
  { t: 'plant', l: 1, x: 12.9, y: 16.3, s: 1.5 }, { t: 'plant', l: 1, x: 3.6, y: 16.9, s: 1.4 }, { t: 'plant', l: 1, x: 7.6, y: 11.8, s: 1.3 },
  { t: 'loungeSet', l: 1, x: 7.0, y: 16.3 },
  { t: 'wc', l: 1, x: 2.0, y: 12.75, r: 180 }, { t: 'vanity', l: 1, x: 2.62, y: 11.9, r: 270, w: 0.7, small: true },
  { t: 'art', l: 1, x: 2.25, y: 11.12, r: 180, w: 0.8, h: 1.0, style: 'bronze' },
  { t: 'outdoorChairs', l: 1, x: 6.0, y: 2.7, r: 0 },
  { t: 'plant', l: 1, x: 12.9, y: 2.0, s: 1.4 },
  { t: 'plant', l: 1, x: 0.6, y: 9.9, s: 1.5 },
  { t: 'curtain', l: 1, x: 4.95, y: 4.15, r: 0, w: 0.9 }, { t: 'curtain', l: 1, x: 13.1, y: 4.15, r: 0, w: 0.6 },
  { t: 'curtain', l: 1, x: 8.2, y: 15.6, r: 0, w: 0.7 }, { t: 'curtain', l: 1, x: 12.9, y: 15.6, r: 0, w: 0.7 },
  { t: 'curtain', l: 1, x: 8.2, y: 11.4, r: 90, w: 0.6 },
  { t: 'curtain', l: 2, x: 0.55, y: 3.05, r: 0, w: 0.7 }, { t: 'curtain', l: 2, x: 4.15, y: 3.05, r: 0, w: 0.7 },
  { t: 'curtain', l: 2, x: 12.95, y: 15.15, r: 0, w: 0.7 }, { t: 'curtain', l: 2, x: 8.5, y: 15.15, r: 0, w: 0.7 },
  { t: 'rug', l: 2, x: 10.9, y: 13.2, w: 3.2, d: 2.6, color: 0xa39c8e },
  { t: 'rug', l: 2, x: 6.5, y: 5.2, w: 2.6, d: 2.4, color: 0x8f9a8a },
  { t: 'rug', l: 2, x: 11.5, y: 5.4, w: 2.6, d: 2.4, color: 0x9d9587 },
  { t: 'timberWall', l: 0, x: 0.32, y: 2.0, r: 270, w: 3.2, h: 3.05 },
  { t: 'timberWall', l: 1, x: 0.32, y: 9.35, r: 270, w: 2.0, h: 3.05 },
  { t: 'downlights', l: 1, x: 4.8, y: 3.95, x1: 13.3, y1: 15.8, ny: 3, nx: 4 },
  { t: 'downlights', l: 1, x: 0.3, y: 0.3, x1: 4.4, y1: 3.0, ny: 1, nx: 3 },
  // second floor
  { t: 'bed', l: 2, x: 2.35, y: 5.35, r: 0, w: 1.9, len: 2.2 },
  { t: 'rug', l: 2, x: 2.35, y: 4.8, w: 3.2, d: 2.6, color: 0x9d9587 },
  { t: 'sideTable', l: 2, x: 1.0, y: 6.0 }, { t: 'sideTable', l: 2, x: 3.7, y: 6.0 },
  { t: 'art', l: 2, x: 4.37, y: 5.0, r: 90, w: 1.2, h: 0.9, style: 'green' },
  { t: 'armchair', l: 2, x: 3.7, y: 3.5, r: 180, rattan: true },
  { t: 'bath', l: 2, x: 0.85, y: 9.4, r: 0 },
  { t: 'marbleWall', l: 2, x: 0.3, y: 9.6, r: 90, w: 1.6, h: 2.8 },
  { t: 'shower', l: 2, x: 2.3, y: 9.7, r: 0, w: 1.1, d: 1.2, glass: 'sw' },
  { t: 'wc', l: 2, x: 0.75, y: 10.0, r: 180 },
  { t: 'vanity', l: 2, x: 1.6, y: 6.95, r: 180, w: 2.2, double: true, mirrors: true },
  { t: 'wardrobe', l: 2, x: 4.55, y: 8.42, r: 270, w: 1.7, dark: true },
  { t: 'wardrobe', l: 2, x: 6.85, y: 8.42, r: 90, w: 1.7, dark: true },
  { t: 'bookcase', l: 2, x: 5.2, y: 9.72, r: 0, w: 4.2, h: 2.4, dark: true, shelfBack: true },
  { t: 'readingChair', l: 2, x: 7.7, y: 10.75, r: 200 },
  { t: 'bed', l: 2, x: 6.5, y: 5.6, r: 0, w: 1.6, len: 2.1 },
  { t: 'wardrobe', l: 2, x: 4.86, y: 5.2, r: 270, w: 2.6 },
  { t: 'desk', l: 2, x: 7.6, y: 6.9, r: 0, w: 1.4, small: true },
  { t: 'bed', l: 2, x: 11.5, y: 5.8, r: 0, w: 1.6, len: 2.1 },
  { t: 'wardrobe', l: 2, x: 9.86, y: 5.4, r: 270, w: 2.4 },
  { t: 'sideTable', l: 2, x: 12.8, y: 6.4 },
  { t: 'bed', l: 2, x: 10.9, y: 12.4, r: 180, w: 1.6, len: 2.1 },
  { t: 'wardrobe', l: 2, x: 8.4, y: 13.4, r: 270, w: 3.6 },
  { t: 'sideTable', l: 2, x: 12.5, y: 12.2 }, { t: 'sideTable', l: 2, x: 9.4, y: 12.2 },
  { t: 'bath', l: 2, x: 12.88, y: 8.42, r: 0, builtIn: true },
  { t: 'vanity', l: 2, x: 11.3, y: 7.8, r: 180, w: 1.1 },
  { t: 'wc', l: 2, x: 11.0, y: 9.05, r: 180 },
  { t: 'shower', l: 2, x: 12.72, y: 10.4, r: 0, w: 1.1, d: 1.7, glass: 'w' },
  { t: 'vanity', l: 2, x: 11.3, y: 11.05, r: 0, w: 1.1 },
  { t: 'wc', l: 2, x: 11.0, y: 9.8, r: 0 },
  { t: 'planter', l: 2, x: 2.35, y: 0.58, w: 3.9, d: 0.5 },
  { t: 'outdoorChairs', l: 2, x: 2.3, y: 1.8, r: 0, two: true },
  { t: 'lounger', l: 2, x: 9.5, y: 16.6, r: 0 }, { t: 'lounger', l: 2, x: 11.5, y: 16.6, r: 0 },
  { t: 'plant', l: 2, x: 12.8, y: 16.9, s: 1.3 }, { t: 'plant', l: 2, x: 12.9, y: 2.2, s: 1.2 },
  { t: 'downlights', l: 2, x: 0.3, y: 3.0, x1: 13.3, y1: 15.3, ny: 4, nx: 4 },
  // garden
  { t: 'pool', l: 1, x: 9.2, y: 17.8, x1: 12.2, y1: 22.3 },
  { t: 'hedge', l: 1, x: -7.5, y: 10.6, x1: -7.0, y1: 29.5 },
  { t: 'hedge', l: 1, x: -7.5, y: 29.0, x1: 21.5, y1: 29.5 },
  { t: 'hedge', l: 1, x: 21.0, y: 10.6, x1: 21.5, y1: 29.5 },
  { t: 'hedge', l: 0, x: -7.5, y: -8.5, x1: -7.0, y1: 10.4 },
  { t: 'hedge', l: 0, x: 21.0, y: -8.5, x1: 21.5, y1: 10.4 },
  { t: 'hedge', l: 0, x: -7.5, y: -8.5, x1: 21.5, y1: -8.0 },
  { t: 'tree', l: 1, x: -4, y: 24, s: 1.3 }, { t: 'tree', l: 1, x: 18, y: 26, s: 1.1 }, { t: 'tree', l: 1, x: 3, y: 26.5, s: 1.0 }, { t: 'tree', l: 1, x: 15.5, y: 19, s: 0.9 },
  { t: 'tree', l: 0, x: -4.5, y: -4, s: 1.2 }, { t: 'tree', l: 0, x: 18.5, y: 2, s: 1.0 }, { t: 'tree', l: 0, x: -3.5, y: 6, s: 0.9 },
  { t: 'shrubs', l: 0, x: 11.0, y: 0.6, x1: 13.4, y1: 2.4 },
  { t: 'shrubs', l: 0, x: 14.0, y: -2, x1: 20, y1: 3.5 },
  { t: 'shrubs', l: 0, x: -6.5, y: -7.5, x1: -1, y1: 3.2 },
  { t: 'retaining', l: 0 },
];

/* Start position: on the driveway looking at the front door (west) */
const START = { x: 6.3, y: 1.9, level: 0, yaw: 90, pitch: 0 };

/* Teleport list (id → position/yaw) */
const TOUR = [
  ['porch', 'Front door', 6.2, 1.9, 0, 90],
  ['hall', 'Main entrance hall', 3.2, 1.6, 0, 90],
  ['garage', 'Double garage', 6.7, 2.5, 0, 0],
  ['staff', 'Staff quarters', 12.2, 3.6, 0, 0],
  ['entrance', 'First-floor entrance', 1.0, 9.3, 1, -90],
  ['kitchen', 'Kitchen', 6.4, 4.6, 1, 0],
  ['dining', 'Dining', 10.0, 9.0, 1, 180],
  ['balcony1', 'Balcony (sea view)', 9.0, 3.3, 1, 180],
  ['study', 'Study', 2.4, 2.6, 1, 180],
  ['lounge', 'Lounge', 9.0, 12.0, 1, 40],
  ['patio', 'Patio', 5.5, 12.0, 1, 0],
  ['pooldeck', 'Pool deck', 10.5, 16.6, 1, 0],
  ['reargarden', 'Rear garden', 10.7, 24.0, 1, 180],
  ['library', 'Library gallery', 3.4, 10.4, 2, -90],
  ['mainbed', 'Main bedroom', 2.3, 3.6, 2, 0],
  ['mainens', 'Main en-suite', 1.6, 7.6, 2, 0],
  ['dressing', 'Main dressing', 4.6, 8.4, 2, -90],
  ['bed4', 'Bedroom 4 / Study', 6.5, 4.0, 2, 0],
  ['bed3', 'Bedroom 3', 11.4, 4.0, 2, 0],
  ['bed2', 'Bedroom 2', 10.9, 14.6, 2, 180],
  ['balcony2', 'Upper balcony', 9.0, 2.3, 2, 180],
  ['terrace2', 'Roof terrace', 10.7, 16.5, 2, 0],
];

const RENDERS = {
  'exterior-front': { file: 'assets/renders/exterior-front.jpg', caption: 'Brochure render — arrival from Monterey Avenue' },
  'exterior-rear': { file: 'assets/renders/exterior-rear.jpg', caption: 'Brochure render — rear elevations, pool and balconies' },
  'patio-pool': { file: 'assets/renders/patio-pool.jpg', caption: 'Brochure render — patio, lounge and pool' },
  'dining-kitchen': { file: 'assets/renders/dining-kitchen.jpg', caption: 'Brochure render — dining and kitchen' },
  'lounge': { file: 'assets/renders/lounge.jpg', caption: 'Brochure render — lounge with fireplace and TV wall' },
  'main-bedroom': { file: 'assets/renders/main-bedroom.jpg', caption: 'Brochure render — main bedroom and open en-suite' },
  'ensuite': { file: 'assets/renders/ensuite.jpg', caption: 'Brochure render — vanity with slatted screen' },
  'study': { file: 'assets/renders/study.jpg', caption: 'Brochure render — study with the southern view' },
};

const FEATURES = [
  'Designer kitchen with Miele appliances', 'Oggie engineered oak herringbone flooring', 'Caesarstone (or equivalent) counters and vanities',
  'Hansgrohe sanitary fittings, heated towel rails', 'LeGrand Arteor switches', 'Beauty Fires wood-burning fireplace', 'Timber, stone and planting throughout',
  'En-suite staff room with separate entrance', 'Study with unparalleled views', 'Open-plan lounge and dining', 'Balconies and patios with timber pergolas and screens',
  'Built-in braai', 'Pool with hardwood deck', 'Double automated garage', 'High-speed fibre',
];

window.HOUSE = { LEVELS, CLEAR, ROOF_Y, ROOMS, WALLS, STAIRS, BALUSTRADES, SLABS: SLAB_LIST, PERGOLAS, SCREENS, FURNITURE, START, TOUR, RENDERS, FEATURES };
