import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { T, ADJ, INITIAL_UNITS, INITIAL_CONTROLLERS, COUNTRIES } from './src/data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// ─── GAME STATE ───────────────────────────────────────────────
let state = {
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

// ─── HELPER: GET ADJACENT ─────────────────────────────────────
function getAdj(loc, type) {
  const node = ADJ[loc];
  if (!node) return [];
  return type === 'A' ? (node.army || []) : (node.fleet || []);
}

// ─── HELPER: PATHFINDING (CONVOYS) ────────────────────────────
function hasConvoyPath(units, start, end, excludeIds = []) {
  const fleets = units.filter(u => u.type === 'F' && T[u.loc].t === 'S' && !excludeIds.includes(u.id));
  const queue = [start];
  const visited = new Set([start]);

  while (queue.length > 0) {
    const curr = queue.shift();
    if (curr === end) return true;

    const adj = ADJ[curr].fleet || []; 
    for (const neighbor of adj) {
      if (!visited.has(neighbor)) {
        if (neighbor === end) return true;
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
  
  units.forEach(u => { 
    if (!ordMap[u.id]) ordMap[u.id] = { type: 'Hold', unitId: u.id, unit: u };
    else ordMap[u.id].unit = u;
  });

  // Validate Moves (Check adjacency & convoys)
  units.forEach(u => {
    const o = ordMap[u.id];
    if (o.type === 'Move') {
      const isAdj = getAdj(u.loc, u.type).includes(o.to);
      if (!isAdj) {
        if (u.type === 'A' && hasConvoyPath(units, u.loc, o.to)) {
          // Valid convoy
        } else {
          o.type = 'Hold'; // Invalid move becomes hold
          o.to = null;
        }
      }
    }
  });

  const moves = {}; 
  units.forEach(u => {
    const o = ordMap[u.id];
    const dest = o.type === 'Move' ? o.to : u.loc;
    if (!moves[dest]) moves[dest] = [];
    moves[dest].push(u);
  });

  const supports = {}; 
  const supportList = orders.filter(o => o.type === 'Support Hold' || o.type === 'Support Move');
  
  supportList.forEach(sup => {
    const supporter = units.find(u => u.id === sup.unitId);
    if (!supporter) return;

    const isAttacked = units.some(attacker => {
      const aOrd = ordMap[attacker.id];
      return aOrd.type === 'Move' && aOrd.to === supporter.loc;
    });

    if (!isAttacked) {
      const targetLoc = sup.type === 'Support Move' ? sup.supTgt : sup.supLoc;
      supports[targetLoc] = (supports[targetLoc] || 0) + 1;
    }
  });

  const newUnits = [];
  const dislodgedList = [];
  const standoffs = [];
  const destinations = [...new Set(Object.keys(moves))];
  const winners = {};

  destinations.forEach(dest => {
    const candidates = moves[dest];
    const strengths = candidates.map(u => {
      const ord = ordMap[u.id];
      let str = 1; 
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
      standoffs.push(dest);
      winners[dest] = null; 
    } else {
      winners[dest] = winner.unit;
    }
  });

  units.forEach(u => {
    const ord = ordMap[u.id];
    let finalLoc = u.loc;

    if (ord.type === 'Move') {
      if (winners[ord.to] === u) {
        finalLoc = ord.to;
      } else {
        finalLoc = u.loc;
      }
    }

    const conqueror = winners[finalLoc];
    if (conqueror && conqueror.id !== u.id) {
       dislodgedList.push({
         ...u,
         source: units.find(x => x.id === conqueror.id)?.loc 
       });
    } else {
      newUnits.push({ ...u, loc: finalLoc });
    }
  });

  state.units = newUnits;
  state.dislodged = dislodgedList;
  state.resolutions = { standoffs }; 

  if (dislodgedList.length > 0) {
    state.phase = "Retreat";
  } else {
    advanceSeason();
  }
}

// ─── PROCESS: RETREAT PHASE ───────────────────────────────────
function processRetreatPhase() {
  const { orders, dislodged, units } = state;
  const newUnits = [...units]; 
  
  const ordMap = {};
  orders.forEach(o => ordMap[o.unitId] = o);

  dislodged.forEach(d => {
    const order = ordMap[d.id];
    if (order && order.type === 'Retreat' && order.to) {
      const isOccupied = newUnits.some(u => u.loc === order.to);
      const isSource = order.to === d.source;
      
      if (!isOccupied && !isSource) {
        newUnits.push({ id: d.id, country: d.country, type: d.type, loc: order.to });
        return;
      }
    }
  });

  state.units = newUnits;
  state.dislodged = [];
  advanceSeason();
}

// ─── PROCESS: ADJUSTMENT (WINTER) ─────────────────────────────
function processAdjustPhase() {
  const { orders, units } = state;
  let newUnits = [...units];
  
  // 1. Disbands
  const disbands = orders.filter(o => o.type === 'Disband');
  const disbandIds = disbands.map(o => o.unitId);
  newUnits = newUnits.filter(u => !disbandIds.includes(u.id));

  // 2. Builds
  const builds = orders.filter(o => o.type === 'Build');
  builds.forEach(b => {
     const isOccupied = newUnits.some(u => u.loc === b.loc);
     if (!isOccupied) {
       const newId = `${b.country.substring(0,2).toLowerCase()}${Math.floor(Math.random()*1000)}`;
       newUnits.push({
         id: newId,
         country: b.country,
         type: b.unitType,
         loc: b.loc
       });
     }
  });

  state.units = newUnits;
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
    state.units.forEach(u => {
      if (T[u.loc]?.sc) state.controllers[u.loc] = u.country;
    });

    let needAdjustment = false;
    const counts = {}; 
    
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
    state.season = "Spring";
    state.year++;
    state.phase = "Move";
  }
}

// ─── API ROUTES ───────────────────────────────────────────────
app.get('/api/state', (req, res) => res.json(state));

app.post('/api/orders', (req, res) => {
  const incoming = req.body.orders || [];
  if (state.phase === 'Adjust') {
    state.orders = incoming;
  } else {
    const map = {};
    state.orders.forEach(o => map[o.unitId] = o);
    incoming.forEach(o => map[o.unitId] = o);
    state.orders = Object.values(map);
  }
  res.json({ success: true });
});

app.post('/api/process', (req, res) => {
  // CRITICAL FIX: Guarantee that the backend processes the exact orders the frontend currently holds!
  if (req.body && req.body.orders) {
    state.orders = req.body.orders;
  }

  if (state.phase === "Move") processMovePhase();
  else if (state.phase === "Retreat") processRetreatPhase();
  else if (state.phase === "Adjust") processAdjustPhase();
  
  state.orders = []; 
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

// Serve Frontend
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Diplomacy Adjudicator running on ${PORT}`));