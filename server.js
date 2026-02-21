import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
// Shared map/adjacency data used by both client and server
import { T, ADJ, INITIAL_UNITS, INITIAL_CONTROLLERS, COUNTRIES } from './src/data.js';

// ESM doesn't expose __dirname natively, so reconstruct it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());           // Allow requests from the Vite dev server
app.use(express.json());   // Parse JSON request bodies

// ─── GAME STATE ───────────────────────────────────────────────
let state = {
  units: [...INITIAL_UNITS],
  controllers: { ...INITIAL_CONTROLLERS },
  orders: [],
  year: 1901,
  season: "Spring", // "Spring", "Fall", "Winter"
  phase: "Move",    // "Move", "Retreat", "Adjust"
  dislodged: [],    // Units that must retreat: { id, country, type, loc, source: "PAR" }
  resolutions: {},  // Results of last turn (for UI feedback)
  scCounts: {}      // Calculated in Winter
};

// ─── HELPER: GET ADJACENT ─────────────────────────────────────
// Returns the list of territories reachable by an army ('A') or fleet ('F') from loc
function getAdj(loc, type) {
  const node = ADJ[loc];
  if (!node) return [];
  return type === 'A' ? (node.army || []) : (node.fleet || []);
}

// ─── HELPER: PATHFINDING (CONVOYS) ────────────────────────────
function hasConvoyPath(units, start, end, excludeIds = []) {
  // Simple BFS to see if a chain of fleets exists
  // In a real adjudicator, this must check if the fleets are ordered to convoy
  // and if they weren't dislodged. For this MVP, we check if fleets exist at sea.
  const fleets = units.filter(u => u.type === 'F' && T[u.loc].t === 'S' && !excludeIds.includes(u.id));
  const queue = [start];
  const visited = new Set([start]);

  while (queue.length > 0) {
    const curr = queue.shift();
    if (curr === end) return true;

    // Get seas adjacent to current land/sea
    // If curr is start (Land), look for adjacent fleets
    // If curr is sea, look for adjacent fleets or destination
    const adj = ADJ[curr].fleet || []; // Use fleet adjacency for sea travel
    
    for (const neighbor of adj) {
      if (!visited.has(neighbor)) {
        if (neighbor === end) return true;
        // To traverse, neighbor must be a sea occupied by a fleet
        if (fleets.some(f => f.loc === neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
  }
  return false;
}

// ─── PROCESS: MOVEMENT PHASE ──────────────────────────────────
function processMovePhase() {
  const { units, orders } = state;
  const ordMap = {};
  orders.forEach(o => ordMap[o.unitId] = o);
  
  // 0. Default Hold for missing orders
  units.forEach(u => { 
    if (!ordMap[u.id]) ordMap[u.id] = { type: 'Hold', unitId: u.id, unit: u };
    else ordMap[u.id].unit = u;
  });

  // 1. Identify Attempted Moves
  const moves = {}; // Dest -> [UnitIds]
  units.forEach(u => {
    const o = ordMap[u.id];
    const dest = o.type === 'Move' ? o.to : u.loc;
    if (!moves[dest]) moves[dest] = [];
    moves[dest].push(u);
  });

  // 2. Calculate Support
  const supports = {}; // Dest -> Power
  const supportList = orders.filter(o => o.type === 'Support Hold' || o.type === 'Support Move');
  
  supportList.forEach(sup => {
    const supporter = units.find(u => u.id === sup.unitId);
    if (!supporter) return;

    // check if supporter is being attacked (Support Cut)
    // Exception: You cannot cut support if you are being attacked by the unit you are supporting support against
    // MVP Simplification: If supporter is attacked by ANYONE, support is cut.
    const isAttacked = units.some(attacker => {
      const aOrd = ordMap[attacker.id];
      return aOrd.type === 'Move' && aOrd.to === supporter.loc;
    });

    if (!isAttacked) {
      const targetLoc = sup.type === 'Support Move' ? sup.supTgt : sup.supLoc;
      supports[targetLoc] = (supports[targetLoc] || 0) + 1;
    }
  });

  // 3. Resolve Conflicts
  const newUnits = [];
  const dislodgedList = [];
  const standoffs = [];

  // Map of where everyone *wants* to be
  const destinations = [...new Set(Object.keys(moves))];

  // Logic: 
  // For every territory, who is strongest?
  const winners = {};

  destinations.forEach(dest => {
    const candidates = moves[dest];
    
    // Calculate strength for each candidate
    const strengths = candidates.map(u => {
      const ord = ordMap[u.id];
      let str = 1; // Base strength (every unit starts at 1)
      
      // Add supports
      // Move support only counts toward the destination being attacked
      // Hold support only counts toward the unit already at that territory
      if (ord.type === 'Move' && ord.to === dest) {
         str += (supports[dest] || 0);
      } else if (ord.type !== 'Move' && u.loc === dest) {
         str += (supports[dest] || 0);
      }
      return { unit: u, str };
    });

    strengths.sort((a, b) => b.str - a.str);

    const winner = strengths[0];
    const runnerUp = strengths[1];

    if (runnerUp && winner.str === runnerUp.str) {
      // Tied strength = bounce; nobody moves into this territory
      standoffs.push(dest);
      winners[dest] = null;
    } else {
      winners[dest] = winner.unit; // Strongest unit claims the territory
    }
  });

  // 4. Apply Results
  units.forEach(u => {
    const ord = ordMap[u.id];
    let finalLoc = u.loc;

    if (ord.type === 'Move') {
      // Did we win our destination?
      if (winners[ord.to] === u) {
        // Did we bounce with a unit currently AT the destination that failed to move out?
        const occupier = units.find(x => x.loc === ord.to && x.id !== u.id);
        if (occupier && winners[ord.to] === u) {
          // Simplification: In Diplomacy, if you displace someone, you move in.
          // They get dislodged.
          finalLoc = ord.to;
        } else {
           finalLoc = ord.to;
        }
      } else {
        // We bounced, stay put
        finalLoc = u.loc;
      }
    }

    // Check if we are dislodged in our (possibly new, possibly old) location
    // A unit is dislodged if someone else WON this territory and it's not us
    const conqueror = winners[finalLoc];
    if (conqueror && conqueror.id !== u.id) {
       // We have been dislodged!
       dislodgedList.push({
         ...u,
         source: units.find(x => x.id === conqueror.id)?.loc // Where did they come from? (Retreat restriction)
       });
       // Do not add to newUnits yet, they go to dislodged state
    } else {
      newUnits.push({ ...u, loc: finalLoc });
    }
  });

  state.units = newUnits;
  state.dislodged = dislodgedList;
  state.resolutions = { standoffs }; // can expand this for UI

  // 5. Next Phase logic
  if (dislodgedList.length > 0) {
    state.phase = "Retreat";
  } else {
    advanceSeason();
  }
}

// ─── PROCESS: RETREAT PHASE ───────────────────────────────────
function processRetreatPhase() {
  const { orders, dislodged, units } = state;
  const newUnits = [...units]; // Survivors from move phase
  
  // Map orders
  const ordMap = {};
  orders.forEach(o => ordMap[o.unitId] = o);

  dislodged.forEach(d => {
    const order = ordMap[d.id];
    
    if (order && order.type === 'Retreat' && order.to) {
      // Validate Retreat:
      // 1. Cannot retreat to where attacker came from (d.source)
      // 2. Cannot retreat to occupied territory (in newUnits)
      // 3. Cannot retreat to a Standoff location (simplified: we accept for now unless occupied)
      
      const isOccupied = newUnits.some(u => u.loc === order.to);
      const isSource = order.to === d.source;
      
      if (!isOccupied && !isSource) {
        // Success
        newUnits.push({ id: d.id, country: d.country, type: d.type, loc: order.to });
        return;
      }
    }
    // Else: Disband (do nothing, unit is lost)
  });

  state.units = newUnits;
  state.dislodged = [];
  advanceSeason();
}

// ─── PROCESS: ADJUSTMENT (WINTER) ─────────────────────────────
function processAdjustPhase() {
  const { orders, units, controllers } = state;
  let newUnits = [...units];
  
  // Map orders
  // Build: { type: "Build", loc: "LON", unitType: "F" }
  // Disband: { type: "Disband", unitId: "en1" }
  
  // 1. Execute Disbands first
  const disbands = orders.filter(o => o.type === 'Disband');
  const disbandIds = disbands.map(o => o.unitId);
  newUnits = newUnits.filter(u => !disbandIds.includes(u.id));

  // 2. Execute Builds
  const builds = orders.filter(o => o.type === 'Build');
  builds.forEach(b => {
     // Validate: territory must be unoccupied (home SC / country ownership checked on client)
     const isOccupied = newUnits.some(u => u.loc === b.loc);
     if (!isOccupied) {
       // Generate a simple unique ID for the new unit
       const newId = `${b.country.substring(0,2).toLowerCase()}${Math.floor(Math.random()*1000)}`;
       newUnits.push({
         id: newId,
         country: b.country,
         type: b.unitType, // "A" or "F"
         loc: b.loc
       });
     }
  });

  state.units = newUnits;
  // Next Turn
  state.season = "Spring";
  state.year++;
  state.phase = "Move";
}

// ─── ADVANCE SEASON HELPER ────────────────────────────────────
function advanceSeason() {
  if (state.season === "Spring") {
    state.season = "Fall";
    state.phase = "Move";
  } else if (state.season === "Fall") {
    // Update Supply Centers
    state.units.forEach(u => {
      if (T[u.loc]?.sc) state.controllers[u.loc] = u.country;
    });

    // Check for Adjustments
    let needAdjustment = false;
    const counts = {}; // country -> { units, scs }
    
    COUNTRIES.forEach(c => {
      const nUnits = state.units.filter(u => u.country === c).length;
      const nScs = Object.values(state.controllers).filter(val => val === c).length;
      counts[c] = { units: nUnits, scs: nScs, diff: nScs - nUnits };
      if (nUnits !== nScs) needAdjustment = true;
    });

    if (needAdjustment) {
      state.season = "Winter";
      state.phase = "Adjust";
      state.scCounts = counts;
    } else {
      state.season = "Spring";
      state.year++;
      state.phase = "Move";
    }
  } else {
    // Should not happen here, Winter handled in processAdjust
    state.season = "Spring";
    state.year++;
    state.phase = "Move";
  }
}

// ─── API ROUTES ───────────────────────────────────────────────
app.get('/api/state', (req, res) => res.json(state));

// Accepts a full or partial order list and merges into current state
app.post('/api/orders', (req, res) => {
  const incoming = req.body.orders || [];
  
  if (state.phase === 'Adjust') {
    // Winter builds/disbands: just replace the whole list
    state.orders = incoming;
  } else {
    // Move/Retreat: merge by unitId so the last submission wins per unit
    const map = {};
    state.orders.forEach(o => map[o.unitId] = o);
    incoming.forEach(o => map[o.unitId] = o);
    state.orders = Object.values(map);
  }
  
  res.json({ success: true });
});

// Runs adjudication for the current phase, then advances the season
app.post('/api/process', (req, res) => {
  if (state.phase === "Move") processMovePhase();
  else if (state.phase === "Retreat") processRetreatPhase();
  else if (state.phase === "Adjust") processAdjustPhase();
  
  state.orders = []; // Clear orders after processing so next phase starts fresh
  res.json(state);
});

app.post('/api/reset', (req, res) => {
  state = { 
    units: [...INITIAL_UNITS], 
    controllers: { ...INITIAL_CONTROLLERS }, 
    orders: [], 
    year: 1901, 
    season: "Spring",
    phase: "Move",
    dislodged: [],
    resolutions: {},
    scCounts: {}
  };
  res.json(state);
});

// Serve the built Vite frontend from /dist
app.use(express.static(path.join(__dirname, 'dist')));
// Fallback to index.html for client-side routing
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = 3000;
app.listen(PORT, () => console.log(`Diplomacy Adjudicator running on ${PORT}`));