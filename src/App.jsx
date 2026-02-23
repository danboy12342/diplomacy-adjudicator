import { useState, useMemo, useEffect } from "react";
import { COL, TEXT_COL, COUNTRIES, T, ADJ } from "./data.js";

// Helper: Format orders for display
function formatOrder(order, units, phase) {
  if (phase === "Adjust") {
    if (order.type === "Build") return `Build ${order.unitType} in ${order.loc}`;
    if (order.type === "Disband") return `Disband Unit in ${order.unitLoc}`;
    return "Unknown";
  }

  const unit = units.find(u => u.id === order.unitId);
  if (!unit) return "";
  const u = `${unit.type} ${unit.loc}`;
  
  switch (order.type) {
    case "Hold": return `${u} H`;
    case "Move": return `${u} → ${order.to}`;
    case "Support Hold": return `${u} S ${order.supLoc}`;
    case "Support Move": return `${u} S ${order.supLoc} → ${order.supTgt}`;
    case "Convoy": return `${u} C ${order.supLoc} → ${order.to}`;
    case "Retreat": return `${u} Retreat → ${order.to}`;
    case "Disband": return `${u} Disband`;
    default: return u;
  }
}

// Styles
const SELECT_STYLE = {
  width:"100%", background:"#111827", color:"#d4c9a8",
  border:"1px solid #2e2e4a", borderRadius:"4px",
  padding:"5px 8px", fontSize:"12px", fontFamily:"Georgia, serif", cursor:"pointer",
};

export default function DiplomacyApp() {
  // Game State
  const [units, setUnits]             = useState([]);
  const [controllers, setControllers] = useState({});
  const [orders, setOrders]           = useState([]);
  const [year, setYear]               = useState(1901);
  const [season, setSeason]           = useState("Spring");
  const [phase, setPhase]             = useState("Move");
  const [dislodged, setDislodged]     = useState([]);
  const [scCounts, setScCounts]       = useState({});

  // UI State
  const [selCountry, setSelCountry]   = useState("England");
  const [selUnitId, setSelUnitId]     = useState(null); 
  const [selTerritory, setSelTerritory] = useState(null); 
  
  // Form State
  const [orderType, setOrderType]     = useState("Hold");
  const [orderTo, setOrderTo]         = useState("");
  const [orderSupLoc, setOrderSupLoc] = useState("");
  const [orderSupTgt, setOrderSupTgt] = useState("");
  
  const [hoveredId, setHoveredId]     = useState(null);
  const [tooltip, setTooltip]         = useState(null);

  useEffect(() => { fetch('/api/state').then(r => r.json()).then(syncState).catch(console.error); }, []);

  const syncState = (data) => {
    setUnits(data.units || []); 
    setControllers(data.controllers || {});
    setOrders(data.orders || []); 
    setYear(data.year); 
    setSeason(data.season);
    setPhase(data.phase); 
    setDislodged(data.dislodged || []);
    setScCounts(data.scCounts || {});
  };

  const visibleUnits = useMemo(() => phase === "Retreat" ? dislodged : units, [phase, units, dislodged]);
  const selectedUnit = useMemo(() => visibleUnits.find(u => u.id === selUnitId), [visibleUnits, selUnitId]);
  
  const validMoves = useMemo(() => {
    if (!selectedUnit) return [];
    const node = ADJ[selectedUnit.loc];
    if (!node) return [];
    
    // Safety check for empty adjacency arrays
    const adjList = selectedUnit.type === "A" ? node.army : node.fleet;
    const safeAdj = adjList || [];

    if (phase === "Retreat") {
      return safeAdj.filter(dest => dest !== selectedUnit.source && !units.some(u => u.loc === dest));
    }
    return safeAdj;
  }, [selectedUnit, phase, units]);

  const possibleMoves = useMemo(() => {
    if (phase !== "Move" || !selectedUnit) return validMoves;
    if (selectedUnit.type === "A") {
      const landNodes = Object.keys(T).filter(k => T[k].t !== "S" && k !== selectedUnit.loc);
      return [...new Set([...validMoves, ...landNodes])].sort();
    }
    return validMoves;
  }, [selectedUnit, validMoves, phase]);

  const adjUnits = useMemo(() => {
    if (!selectedUnit || phase !== "Move") return [];
    return validMoves.map(loc => ({ loc, unit: units.find(u => u.loc === loc && u.id !== selectedUnit.id) })).filter(x => x.unit);
  }, [selectedUnit, validMoves, units, phase]);

  const supMoveTargets = useMemo(() => {
    if (!selectedUnit || !orderSupLoc || phase !== "Move") return [];
    const supUnit = units.find(u => u.loc === orderSupLoc);
    if (!supUnit) return [];
    
    const node = ADJ[supUnit.loc];
    const supMoves = (supUnit.type === "A" ? node.army : node.fleet) || [];
    return supMoves.filter(t => t !== selectedUnit.loc && validMoves.includes(t));
  }, [selectedUnit, orderSupLoc, units, validMoves, phase]);

  const adjustmentNeeded = useMemo(() => {
    if (phase !== "Adjust") return 0;
    const c = scCounts[selCountry];
    return c ? c.diff : 0; 
  }, [phase, scCounts, selCountry]);

  const saveOrders = (newOrders) => {
    setOrders(newOrders);
    fetch('/api/orders', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({orders: newOrders}) });
  };

  const addOrder = () => {
    let newOrder = null;

    if (phase === "Move") {
      newOrder = { unitId: selectedUnit.id, type: orderType, to: orderTo || null, supLoc: orderSupLoc || null, supTgt: orderSupTgt || null };
    } else if (phase === "Retreat") {
      newOrder = { unitId: selectedUnit.id, type: orderType, to: orderTo || null }; 
    } else if (phase === "Adjust") {
      if (adjustmentNeeded > 0 && selTerritory) {
         newOrder = { type: "Build", loc: selTerritory, unitType: orderType, country: selCountry }; 
         const others = orders.filter(o => o.loc !== selTerritory);
         saveOrders([...others, newOrder]);
         setSelTerritory(null);
         return;
      }
      if (adjustmentNeeded < 0 && selectedUnit) {
         newOrder = { type: "Disband", unitId: selectedUnit.id, unitLoc: selectedUnit.loc };
      }
    }

    if (newOrder) {
      const filtered = orders.filter(o => phase === "Adjust" ? o.unitId !== newOrder.unitId : o.unitId !== newOrder.unitId);
      saveOrders([...filtered, newOrder]);
      setOrderType("Hold"); setOrderTo(""); setSelTerritory(null); setSelUnitId(null);
    }
  };

  const removeOrder = (order) => {
    if (phase === "Adjust" && order.type === "Build") {
      saveOrders(orders.filter(o => o.loc !== order.loc));
    } else {
      saveOrders(orders.filter(o => o.unitId !== order.unitId));
    }
  };

  const processOrders = () => {
    fetch('/api/process', { method: 'POST' }).then(r => r.json()).then(d => {
      syncState(d);
      setSelUnitId(null); setSelTerritory(null);
    }).catch(console.error);
  };

  const resetGame = () => { if(confirm("Reset game?")) fetch('/api/reset', { method: 'POST' }).then(r => r.json()).then(syncState); };

  const handleMapClick = (id) => {
    const unit = visibleUnits.find(u => u.loc === id);
    
    if (phase === "Adjust") {
      if (adjustmentNeeded > 0) {
        if (!unit && T[id].home === selCountry && T[id].sc && controllers[id] === selCountry) {
          setSelTerritory(id);
          setSelUnitId(null);
          setOrderType("A"); 
        }
      }
      if (adjustmentNeeded < 0 && unit && unit.country === selCountry) {
        setSelUnitId(unit.id);
        setSelTerritory(null);
        setOrderType("Disband"); 
      }
      return;
    }

    if (unit) {
      setSelUnitId(unit.id);
      setSelCountry(unit.country);
      setOrderType(phase === "Retreat" ? "Retreat" : "Hold");
      setOrderTo("");
    }
  };

  const getTerritoryFill = id => {
    const terr = T[id];
    if (phase === "Adjust" && adjustmentNeeded > 0 && terr.home === selCountry && !units.some(u=>u.loc===id) && controllers[id]===selCountry) return "#44ff44";
    if (terr.t === "S") return "#1e3a5c";
    if (terr.sc && controllers[id]) return COL[controllers[id]] || "#b0a070";
    if (terr.sc) return "#b0a070";
    return "#8a7a50";
  };

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:"#0a0d15", fontFamily:"Georgia, serif", color:"#d4c9a8" }}>
      
      {/* ── MAP ── */}
      <div style={{flex:1, display:"flex", flexDirection:"column", overflow:"hidden"}}>
        {/* HEADER */}
        <div style={{ padding:"7px 16px", borderBottom:"1px solid #1e2a3a", background:"rgba(10,13,21,0.9)", display:"flex", alignItems:"center", gap:"16px" }}>
          <span style={{ fontSize:"18px", letterSpacing:"4px", color:"#c8a850", fontStyle:"italic" }}>DIPLO-ADJ</span>
          <span style={{color:"#2e3a4a"}}>—</span>
          <span style={{fontSize:"13px", color:"#fff", letterSpacing:"1px", fontWeight:"bold"}}>
            {season} {year} <span style={{color:"#f00"}}>({phase.toUpperCase()})</span>
          </span>
          <button onClick={resetGame} style={{marginLeft:"auto", background:"none", border:"1px solid #443333", color:"#c0374f", padding:"2px 6px", borderRadius:"3px", cursor:"pointer", fontSize:"10px"}}>RESET</button>
        </div>

        {/* SVG */}
        <div style={{flex:1, overflow:"hidden", position:"relative"}}>
          <svg width="100%" height="100%" viewBox="0 0 660 480">
             <defs>
              <radialGradient id="ocean" cx="40%" cy="40%"><stop offset="0%" stopColor="#1a3a60"/><stop offset="100%" stopColor="#0d1e35"/></radialGradient>
              {COUNTRIES.map(c => <marker key={c} id={`arr-${c}`} markerWidth="6" markerHeight="6" refX="5" refY="2" orient="auto"><path d="M0,0 L0,4 L6,2 z" fill={COL[c]}/></marker>)}
            </defs>
            <rect width="660" height="480" fill="url(#ocean)"/>
            
            {Object.entries(T).map(([id, terr]) => {
              const unit = visibleUnits.find(u => u.loc === id);
              const isSel = selectedUnit?.loc === id || selTerritory === id;
              const isSea = terr.t === "S", r = isSea ? 7 : 10;
              
              return (
                <g key={id} onClick={() => handleMapClick(id)} 
                   onMouseEnter={()=>{setHoveredId(id);setTooltip({id,terr,unit})}} 
                   onMouseLeave={()=>{setHoveredId(null);setTooltip(null)}}
                   style={{cursor:"pointer"}}>
                   
                   <circle cx={terr.x} cy={terr.y} r={r} fill={getTerritoryFill(id)} 
                     stroke={isSel?"#fff": (isSea?"#1a4a7a":"#3a2a10")} strokeWidth={isSel?2:1} opacity={isSea?0.6:1} />
                   
                   {terr.sc && !isSea && <circle cx={terr.x} cy={terr.y} r={1.5} fill="rgba(255,255,255,0.5)"/>}
                   
                   {unit && (
                     <>
                      <circle cx={terr.x} cy={terr.y} r={r-2} fill={COL[unit.country]} stroke={isSel?"#fff":"#000"} strokeWidth={isSel?1.5:0.5}/>
                      <text x={terr.x} y={terr.y+2.5} textAnchor="middle" fontSize={6} fontWeight="bold" fill={TEXT_COL[unit.country]}>{unit.type}</text>
                     </>
                   )}
                   {!isSea && <text x={terr.x} y={terr.y+r+8} textAnchor="middle" fontSize={5.5} fill="#c0b080" style={{pointerEvents:"none"}}>{id}</text>}
                </g>
              )
            })}
            
            {selectedUnit && phase !== "Adjust" && validMoves.map(m => {
               const t = T[m];
               if (!t) return null;
               return <circle key={m} cx={t.x} cy={t.y} r={3} fill="#44ff99" opacity={0.5} style={{pointerEvents:"none"}}/>
            })}
          </svg>
          
          {tooltip && (
             <div style={{position:"absolute", bottom:10, left:10, background:"rgba(0,0,0,0.8)", padding:"5px", borderRadius:"4px", pointerEvents:"none", fontSize:"11px"}}>
               <div style={{fontWeight:"bold", color:"#c8a850"}}>{tooltip.terr.n}</div>
               {tooltip.unit && <div style={{color:COL[tooltip.unit.country]}}>{tooltip.unit.type} ({tooltip.unit.country})</div>}
             </div>
          )}
        </div>
      </div>

      {/* ── SIDEBAR ── */}
      <div style={{ width:300, background:"#080c14", borderLeft:"1px solid #1a2030", display:"flex", flexDirection:"column", padding:"10px", gap:"10px" }}>
        
        {/* Country Selector */}
        <div style={{display:"flex", flexWrap:"wrap", gap:"4px"}}>
          {COUNTRIES.map(c => (
            <button key={c} onClick={() => { setSelCountry(c); setSelUnitId(null); setSelTerritory(null); }}
              style={{ flex:1, padding:"4px", fontSize:"10px", background: selCountry===c?COL[c]+"44":"#111", border:`1px solid ${selCountry===c?COL[c]:"#333"}`, color: selCountry===c?COL[c]:"#666", cursor:"pointer" }}>
              {c.slice(0,3)}
            </button>
          ))}
        </div>

        {/* Phase Info */}
        <div style={{background:"#111", padding:"8px", borderRadius:"4px", fontSize:"11px", color:"#aaa"}}>
          <div>Phase: <span style={{color:"#fff"}}>{phase}</span></div>
          {phase === "Adjust" && scCounts[selCountry] && (
             <div style={{marginTop:4}}>
               Units: {scCounts[selCountry].units} | SCs: {scCounts[selCountry].scs} | 
               <span style={{color: adjustmentNeeded > 0 ? "#4f4" : adjustmentNeeded < 0 ? "#f44" : "#fff", fontWeight:"bold"}}>
                 {adjustmentNeeded > 0 ? ` Build ${adjustmentNeeded}` : adjustmentNeeded < 0 ? ` Disband ${Math.abs(adjustmentNeeded)}` : " Balanced"}
               </span>
             </div>
          )}
        </div>

        {/* Action Panel */}
        <div style={{background:"#0e121a", padding:"10px", borderRadius:"4px", border:"1px solid #222"}}>
          {phase === "Adjust" ? (
             <div>
               <div style={{fontSize:"10px", marginBottom:5, color:"#666", textTransform:"uppercase"}}>Adjustment Orders</div>
               {adjustmentNeeded > 0 && selTerritory ? (
                  <>
                    <div style={{fontSize:"12px", color:"#fff", marginBottom:5}}>Build in {T[selTerritory].n}</div>
                    <select style={SELECT_STYLE} value={orderType} onChange={e=>setOrderType(e.target.value)}>
                      <option value="A">Army</option><option value="F">Fleet</option>
                    </select>
                    <button onClick={addOrder} style={{marginTop:8, width:"100%", background:"#242", color:"#afa", border:"none", padding:6, cursor:"pointer"}}>Confirm Build</button>
                  </>
               ) : adjustmentNeeded < 0 && selectedUnit ? (
                  <>
                     <div style={{fontSize:"12px", color:"#fff", marginBottom:5}}>Disband {selectedUnit.type} in {selectedUnit.loc}</div>
                     <button onClick={addOrder} style={{marginTop:8, width:"100%", background:"#422", color:"#faa", border:"none", padding:6, cursor:"pointer"}}>Confirm Disband</button>
                  </>
               ) : <div style={{fontSize:"11px", fontStyle:"italic", color:"#444"}}>Select Map Location to Act</div>}
             </div>
          ) : (
             <div>
               <div style={{fontSize:"10px", marginBottom:5, color:"#666", textTransform:"uppercase"}}>
                 {selectedUnit ? `${selectedUnit.type} in ${selectedUnit.loc}` : "Select Unit"}
               </div>
               
               {selectedUnit && (
                 <>
                   <select style={SELECT_STYLE} value={orderType} onChange={e=>{setOrderType(e.target.value); setOrderTo("");}}>
                     {phase === "Move" ? (
                       <>
                        <option value="Hold">Hold</option><option value="Move">Move</option>
                        <option value="Support Hold">Support Hold</option><option value="Support Move">Support Move</option>
                        {selectedUnit.type === "F" && <option value="Convoy">Convoy</option>}
                       </>
                     ) : (
                       <>
                        <option value="Retreat">Retreat</option><option value="Disband">Disband</option>
                       </>
                     )}
                   </select>

                   {(orderType === "Move" || orderType === "Retreat" || orderType === "Convoy") && (
                     <select style={{...SELECT_STYLE, marginTop:5}} value={orderTo} onChange={e=>setOrderTo(e.target.value)}>
                       <option value="">Dest...</option>
                       {(orderType==="Convoy" || orderType==="Move" ? possibleMoves : validMoves).map(m => <option key={m} value={m}>{m} ({T[m].n})</option>)}
                     </select>
                   )}

                   {(orderType.startsWith("Support") || orderType==="Convoy") && (
                     <select style={{...SELECT_STYLE, marginTop:5}} value={orderSupLoc} onChange={e=>setOrderSupLoc(e.target.value)}>
                       <option value="">Unit to {orderType==="Convoy"?"Convoy":"Support"}...</option>
                       {orderType === "Convoy" 
                          ? units.filter(u=>u.type==="A").map(u => <option key={u.loc} value={u.loc}>{u.loc}</option>)
                          : adjUnits.map(u => <option key={u.loc} value={u.loc}>{u.loc}</option>)
                       }
                     </select>
                   )}
                   
                   {orderType === "Support Move" && (
                      <select style={{...SELECT_STYLE, marginTop:5}} value={orderSupTgt} onChange={e=>setOrderSupTgt(e.target.value)}>
                        <option value="">Into...</option>
                        {supMoveTargets.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                   )}

                   <button onClick={addOrder} style={{marginTop:10, width:"100%", padding:6, background:"#223", color:"#aac", border:"1px solid #334", cursor:"pointer"}}>Enter Order</button>
                 </>
               )}
             </div>
          )}
        </div>

        {/* Order List */}
        <div style={{flex:1, overflowY:"auto", background:"#0a0e14", padding:5}}>
           {orders.map((o, i) => (
             <div key={i} style={{display:"flex", justifyContent:"space-between", fontSize:"11px", padding:"3px", borderBottom:"1px solid #222", color:"#ccc"}}>
               <span>{formatOrder(o, phase==="Retreat"?dislodged:units, phase)}</span>
               <span onClick={()=>removeOrder(o)} style={{cursor:"pointer", color:"#666"}}>x</span>
             </div>
           ))}
        </div>

        <button onClick={processOrders} style={{padding:12, background:"#135", color:"#fff", border:"none", fontWeight:"bold", cursor:"pointer"}}>
          RESOLVE {phase.toUpperCase()}
        </button>
        
        <div style={{textAlign:"center", fontSize:"9px", color:"#3a4a5a", fontFamily:"monospace", textTransform:"uppercase"}}>daniel shengyi</div>
      </div>
    </div>
  );
}