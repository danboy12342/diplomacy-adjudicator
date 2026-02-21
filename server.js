import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { T, INITIAL_UNITS, INITIAL_CONTROLLERS } from './src/data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

let state = {
  units: [...INITIAL_UNITS],
  controllers: { ...INITIAL_CONTROLLERS },
  orders: [],
  year: 1901,
  season: "Spring"
};

// ─── ADJUDICATOR ALGORITHM ───
function processAdjudication() {
  const { units, orders } = state;
  const ordMap = {};
  
  orders.forEach(o => ordMap[o.unitId] = o);
  units.forEach(u => { if (!ordMap[u.id]) ordMap[u.id] = { type: 'Hold', unitId: u.id }; });

  const isAttackedBy = (targetLoc) => units.filter(u => ordMap[u.id].type === 'Move' && ordMap[u.id].to === targetLoc);

  // 1. Support Cuts (Attacked from anywhere EXCEPT the province it is directing support against)
  const supportCut = {};
  units.forEach(u => {
    const o = ordMap[u.id];
    if (o.type === 'Support Hold' || o.type === 'Support Move') {
      let targetProv = o.type === 'Support Hold' ? o.supLoc : o.supTgt;
      const attackers = isAttackedBy(u.loc);
      if (attackers.some(a => a.loc !== targetProv)) supportCut[u.id] = true;
    }
  });

  // 2. Base Strengths
  const attackStr = {};
  const holdStr = {};
  units.forEach(u => {
    attackStr[u.id] = ordMap[u.id].type === 'Move' ? 1 : 0;
    holdStr[u.id] = ordMap[u.id].type !== 'Move' ? 1 : 0;
  });

  // 3. Add Supports
  units.forEach(u => {
    const o = ordMap[u.id];
    if (!supportCut[u.id]) {
      if (o.type === 'Support Hold') {
        const targetUnit = units.find(x => x.loc === o.supLoc);
        if (targetUnit && ordMap[targetUnit.id].type !== 'Move') holdStr[targetUnit.id]++;
      } else if (o.type === 'Support Move') {
        const targetUnit = units.find(x => x.loc === o.supLoc);
        if (targetUnit && ordMap[targetUnit.id].type === 'Move' && ordMap[targetUnit.id].to === o.supTgt) attackStr[targetUnit.id]++;
      }
    }
  });

  // 4. Resolve Moves & Bounces
  const newLocations = {};
  const dislodged = [];
  const destinations = [...new Set(units.map(u => ordMap[u.id].type === 'Move' ? ordMap[u.id].to : u.loc))];

  destinations.forEach(dest => {
    const attackers = units.filter(u => ordMap[u.id].type === 'Move' && ordMap[u.id].to === dest);
    const holder = units.find(u => u.loc === dest && ordMap[u.id].type !== 'Move');

    if (attackers.length === 0) return;

    attackers.sort((a, b) => attackStr[b.id] - attackStr[a.id]);
    const strongest = attackers[0];
    const secondStrongest = attackers[1];

    let maxAttack = attackStr[strongest.id];
    let isStandoff = secondStrongest && attackStr[secondStrongest.id] === maxAttack;
    let headHolder = units.find(u => u.loc === dest && ordMap[u.id].type === 'Move' && ordMap[u.id].to === strongest.loc);
    
    const holderStrength = holder ? holdStr[holder.id] : 0;
    const opposingAttack = headHolder ? attackStr[headHolder.id] : 0;

    // Movement succeeds if it outpowers the holder, breaks any standoff, and wins any head-to-head
    if (!isStandoff && maxAttack > holderStrength && maxAttack > opposingAttack) {
      newLocations[strongest.id] = dest;
      if (holder) dislodged.push(holder.id);
    }
  });

  // 5. Apply Results
  const newUnits = [];
  units.forEach(u => {
    if (dislodged.includes(u.id)) return; // Dislodged units are simply disbanded in this MVP 
    const loc = newLocations[u.id] || u.loc;
    newUnits.push({ ...u, loc });
  });

  state.units = newUnits;
  
  if (state.season === "Fall") {
    state.units.forEach(unit => {
      if (T[unit.loc]?.sc) state.controllers[unit.loc] = unit.country;
    });
  }

  state.orders = [];
  if (state.season === "Spring") { state.season = "Fall"; } 
  else { state.season = "Spring"; state.year++; }
}

// ─── API ROUTES ───
app.get('/api/state', (req, res) => res.json(state));

app.post('/api/orders', (req, res) => {
  state.orders = req.body.orders;
  res.json({ success: true });
});

app.post('/api/process', (req, res) => {
  processAdjudication();
  res.json(state);
});

app.post('/api/reset', (req, res) => {
  state = { units: [...INITIAL_UNITS], controllers: { ...INITIAL_CONTROLLERS }, orders: [], year: 1901, season: "Spring" };
  res.json(state);
});

// Serve Frontend in Production
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = 3000;
app.listen(PORT, () => console.log(`Diplomacy Adjudicator started on port ${PORT}`));