import { useState, useMemo, useCallback, useEffect } from "react";
import { COL, TEXT_COL, COUNTRIES, T, ADJ } from "./data.js";

function getValidMoves(unit) {
  const adj = ADJ[unit.loc];
  if (!adj) return [];
  return unit.type === "A" ? (adj.army || []) : (adj.fleet || []);
}

function formatOrder(order, units) {
  const unit = units.find(u => u.id === order.unitId);
  if (!unit) return "";
  const u = `${unit.type} ${unit.loc}`;
  switch (order.type) {
    case "Hold": return `${u} H`;
    case "Move": return `${u} → ${order.to}`;
    case "Support Hold": return `${u} S ${order.supLoc}`;
    case "Support Move": return `${u} S ${order.supLoc} → ${order.supTgt}`;
    case "Convoy": return `${u} C ${order.supLoc} → ${order.to}`;
    default: return u;
  }
}

const SELECT_STYLE = {
  width:"100%", background:"#111827", color:"#d4c9a8",
  border:"1px solid #2e2e4a", borderRadius:"4px",
  padding:"5px 8px", fontSize:"12px", fontFamily:"Georgia, serif", cursor:"pointer",
};

export default function DiplomacyApp() {
  const [units, setUnits]             = useState([]);
  const [controllers, setControllers] = useState({});
  const [orders, setOrders]           = useState([]);
  const [year, setYear]               = useState(1901);
  const [season, setSeason]           = useState("Spring");

  const [selCountry, setSelCountry]   = useState("England");
  const [selUnitId, setSelUnitId]     = useState(null);
  const [orderType, setOrderType]     = useState("Hold");
  const [orderTo, setOrderTo]         = useState("");
  const [orderSupLoc, setOrderSupLoc] = useState("");
  const [orderSupTgt, setOrderSupTgt] = useState("");
  const [hoveredId, setHoveredId]     = useState(null);
  const [tooltip, setTooltip]         = useState(null);

  useEffect(() => {
    fetch('/api/state').then(r => r.json()).then(syncState);
  }, []);

  const syncState = (data) => {
    setUnits(data.units); setControllers(data.controllers);
    setOrders(data.orders); setYear(data.year); setSeason(data.season);
  };

  const selectedUnit = useMemo(() => units.find(u => u.id === selUnitId), [units, selUnitId]);
  const countryUnits = useMemo(() => units.filter(u => u.country === selCountry), [units, selCountry]);

  const validMoves = useMemo(() => selectedUnit ? getValidMoves(selectedUnit) : [], [selectedUnit]);
  const possibleMoves = useMemo(() => {
    if (!selectedUnit) return [];
    if (selectedUnit.type === "A") {
      const landNodes = Object.keys(T).filter(k => T[k].t !== "S" && k !== selectedUnit.loc);
      return [...new Set([...validMoves, ...landNodes])].sort();
    }
    return validMoves;
  }, [selectedUnit, validMoves]);

  const adjUnits = useMemo(() => {
    if (!selectedUnit) return [];
    return validMoves
      .map(loc => ({ loc, unit: units.find(u => u.loc === loc && u.id !== selectedUnit.id) }))
      .filter(x => x.unit);
  }, [selectedUnit, validMoves, units]);

  const supMoveTargets = useMemo(() => {
    if (!selectedUnit || !orderSupLoc) return [];
    const supUnit = units.find(u => u.loc === orderSupLoc);
    if (!supUnit) return [];
    const supMoves = getValidMoves(supUnit);
    return supMoves.filter(t => t !== selectedUnit.loc && validMoves.includes(t));
  }, [selectedUnit, orderSupLoc, units, validMoves]);

  const getOrder = useCallback(uid => orders.find(o => o.unitId === uid), [orders]);

  const canAdd = () => {
    if (!selectedUnit) return false;
    if (orderType === "Hold") return true;
    if (orderType === "Move") return !!orderTo;
    if (orderType === "Support Hold") return !!orderSupLoc;
    if (orderType === "Support Move") return !!orderSupLoc && !!orderSupTgt;
    if (orderType === "Convoy") return !!orderSupLoc && !!orderTo;
    return false;
  };

  const resetOrderForm = () => { setOrderType("Hold"); setOrderTo(""); setOrderSupLoc(""); setOrderSupTgt(""); };

  const saveOrders = (newOrders) => {
    setOrders(newOrders);
    fetch('/api/orders', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({orders: newOrders}) });
  };

  const addOrder = () => {
    if (!canAdd()) return;
    const newOrder = {
      unitId: selectedUnit.id, type: orderType,
      to: orderTo || null, supLoc: orderSupLoc || null, supTgt: orderSupTgt || null,
    };
    saveOrders([...orders.filter(o => o.unitId !== selectedUnit.id), newOrder]);
    resetOrderForm();
  };

  const removeOrder = uid => saveOrders(orders.filter(o => o.unitId !== uid));
  const selectUnit = (unit) => { setSelUnitId(unit.id); setSelCountry(unit.country); resetOrderForm(); };

  const processOrders = () => {
    fetch('/api/process', { method: 'POST' }).then(r => r.json()).then(data => {
      syncState(data);
      setSelUnitId(null);
      resetOrderForm();
    });
  };

  const resetGame = () => {
    if(confirm("Reset game back to 1901?")) {
      fetch('/api/reset', { method: 'POST' }).then(r => r.json()).then(syncState);
    }
  };

  const getTerritoryFill = id => {
    const terr = T[id];
    if (terr.t === "S") return "#1e3a5c";
    if (terr.sc && controllers[id]) return COL[controllers[id]] || "#b0a070";
    if (terr.sc) return "#b0a070";
    return "#8a7a50";
  };

  const getUnitAt = id => units.find(u => u.loc === id);
  const scCount = country => Object.values(controllers).filter(c => c === country).length;

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:"#0a0d15", fontFamily:"Georgia, serif", color:"#d4c9a8" }}>
      {/* ── MAP PANEL ── */}
      <div style={{flex:1, display:"flex", flexDirection:"column", overflow:"hidden"}}>
        <div style={{ padding:"7px 16px", borderBottom:"1px solid #1e2a3a", background:"rgba(10,13,21,0.9)", display:"flex", alignItems:"center", gap:"16px" }}>
          {/* UPDATED TITLE HERE */}
          <span style={{ fontSize:"18px", letterSpacing:"4px", color:"#c8a850", fontStyle:"italic" }}>DIPLO-ADJ</span>
          <span style={{color:"#2e3a4a", fontSize:"14px"}}>—</span>
          <span style={{fontSize:"13px", color:"#8a9aaa", letterSpacing:"1px"}}>{season} {year}</span>
          <button onClick={resetGame} style={{ background:"none", border:"1px solid #c0374f", color:"#c0374f", padding:"2px 6px", borderRadius:"3px", cursor:"pointer", marginLeft: "10px", fontSize: "11px"}}>Reset</button>
          
          <div style={{marginLeft:"auto", display:"flex", gap:"8px"}}>
            {COUNTRIES.map(c => (
              <div key={c} style={{
                display:"flex", alignItems:"center", gap:"3px", padding:"1px 6px", borderRadius:"3px",
                background: selCountry === c ? COL[c]+"22" : "transparent", border: selCountry === c ? `1px solid ${COL[c]}66` : "1px solid transparent",
                cursor:"pointer", fontSize:"11px", color:"#8a9aaa",
              }} onClick={() => { setSelCountry(c); setSelUnitId(null); resetOrderForm(); }}>
                <div style={{width:8,height:8,borderRadius:"50%",background:COL[c]}}/>
                <span>{c.slice(0,3)}</span><span style={{color:COL[c], fontWeight:"bold"}}>{scCount(c)}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{flex:1, overflow:"hidden", position:"relative"}}>
          <svg width="100%" height="100%" viewBox="0 0 660 480" style={{display:"block", cursor:"default"}}>
            <defs>
              <radialGradient id="ocean" cx="40%" cy="40%">
                <stop offset="0%" stopColor="#1a3a60"/><stop offset="100%" stopColor="#0d1e35"/>
              </radialGradient>
              {COUNTRIES.map(c => (
                <marker key={c} id={`arr-${c}`} markerWidth="6" markerHeight="6" refX="5" refY="2" orient="auto">
                  <path d="M0,0 L0,4 L6,2 z" fill={COL[c]}/>
                </marker>
              ))}
              <marker id="arr-sup" markerWidth="6" markerHeight="6" refX="5" refY="2" orient="auto">
                <path d="M0,0 L0,4 L6,2 z" fill="#22d4c8"/>
              </marker>
            </defs>
            <rect width="660" height="480" fill="url(#ocean)"/>
            {selectedUnit && validMoves.map(loc => {
              const terr = T[loc];
              if (!terr) return null;
              return <circle key={`vm-${loc}`} cx={terr.x} cy={terr.y} r={(terr.t==="S"?6:10)+4} fill="none" stroke="#44ff99" strokeWidth={1.5} strokeDasharray="3,2" opacity={0.6}/>
            })}
            {orders.filter(o => o.type === "Support Hold" || o.type === "Support Move").map(o => {
              const from = T[units.find(u => u.id === o.unitId)?.loc], to = T[o.supLoc];
              return from && to ? <line key={`sl-${o.unitId}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#22d4c8" strokeWidth={1.5} strokeDasharray="4,3" markerEnd="url(#arr-sup)" opacity={0.7}/> : null;
            })}
            {orders.filter(o => o.type === "Move" && o.to).map(o => {
              const unit = units.find(u => u.id === o.unitId);
              const from = T[unit?.loc], to = T[o.to];
              if (!from || !to) return null;
              const ux = (to.x - from.x)/(Math.sqrt((to.x-from.x)**2+(to.y-from.y)**2)||1), uy = (to.y - from.y)/(Math.sqrt((to.x-from.x)**2+(to.y-from.y)**2)||1);
              return <line key={`mo-${o.unitId}`} x1={from.x+ux*16} y1={from.y+uy*16} x2={to.x-ux*16} y2={to.y-uy*16} stroke={COL[unit.country]} strokeWidth={2.5} markerEnd={`url(#arr-${unit.country})`} opacity={0.9}/>;
            })}
            {orders.filter(o => o.type === "Convoy" && o.to && o.supLoc).map(o => {
              const unit = units.find(u => u.id === o.unitId);
              const from = T[o.supLoc], to = T[o.to];
              if (!from || !to) return null;
              const ux = (to.x - from.x)/(Math.sqrt((to.x-from.x)**2+(to.y-from.y)**2)||1), uy = (to.y - from.y)/(Math.sqrt((to.x-from.x)**2+(to.y-from.y)**2)||1);
              return <line key={`cv-${o.unitId}`} x1={from.x+ux*14} y1={from.y+uy*14} x2={to.x-ux*14} y2={to.y-uy*14} stroke={COL[unit.country]} strokeWidth={2} strokeDasharray="5,3" markerEnd={`url(#arr-${unit.country})`} opacity={0.8}/>
            })}
            {Object.entries(T).map(([id, terr]) => {
              const isSea = terr.t === "S", r = isSea ? 7 : 10;
              const unit = getUnitAt(id), isSel = selectedUnit?.loc === id, isHov = hoveredId === id;
              return (
                <g key={id} onClick={() => { if(unit) selectUnit(unit); }} onMouseEnter={() => { setHoveredId(id); setTooltip({id, terr, unit}); }} onMouseLeave={() => { setHoveredId(null); setTooltip(null); }} style={{cursor: unit ? "pointer" : "default"}}>
                  <circle cx={terr.x} cy={terr.y} r={r} fill={getTerritoryFill(id)} stroke={isSel ? "#ffee44" : isHov && unit ? "#fff" : isSea ? "#1a4a7a" : "#3a2a10"} strokeWidth={isSel ? 2.5 : 1} opacity={isSea ? 0.55 : 1}/>
                  {terr.sc && !isSea && <circle cx={terr.x} cy={terr.y} r={1.5} fill="rgba(255,255,255,0.45)"/>}
                  {unit && (
                    <>
                      <circle cx={terr.x} cy={terr.y} r={r-2} fill={COL[unit.country]} stroke={isSel ? "#ffee44" : "#000"} strokeWidth={isSel ? 1.5 : 0.8}/>
                      <text x={terr.x} y={terr.y+2.5} textAnchor="middle" fontSize={6} fontWeight="bold" fill={TEXT_COL[unit.country]}>{unit.type}</text>
                    </>
                  )}
                  {unit && !!getOrder(unit.id) && <circle cx={terr.x+r-2} cy={terr.y-r+2} r={3} fill="#ff9922" stroke="#000" strokeWidth={0.5}/>}
                  {!isSea && <text x={terr.x} y={terr.y+r+8} textAnchor="middle" fontSize={5.5} fill={isHov?"#fff":"#c0b080"} style={{pointerEvents:"none"}}>{id}</text>}
                </g>
              );
            })}
          </svg>
          {tooltip && (
            <div style={{ position:"absolute", bottom:12, left:12, background:"rgba(8,12,22,0.92)", border:"1px solid #2e3a4a", borderRadius:"4px", padding:"6px 10px", fontSize:"11px", pointerEvents:"none"}}>
              <div style={{color:"#c8a850", fontWeight:"bold", marginBottom:2}}>{tooltip.terr.n} ({tooltip.id})</div>
              <div style={{color:"#6a7a8a"}}>{tooltip.terr.t==="S"?"Sea":tooltip.terr.t==="C"?"Coastal":"Inland"}{tooltip.terr.sc?" • Supply Centre":""}</div>
              {tooltip.unit && <div style={{color:COL[tooltip.unit.country], marginTop:3}}>{tooltip.unit.type} ({tooltip.unit.country})</div>}
            </div>
          )}
        </div>
      </div>

      {/* ── SIDE PANEL ── */}
      <div style={{ width:290, background:"#080c14", borderLeft:"1px solid #1a2030", display:"flex", flexDirection:"column" }}>
        <div style={{padding:"10px", borderBottom:"1px solid #1a2030"}}>
          <div style={{display:"flex", flexWrap:"wrap", gap:"4px"}}>
            {COUNTRIES.map(c => (
              <button key={c} onClick={() => { setSelCountry(c); setSelUnitId(null); resetOrderForm(); }}
                style={{ padding:"3px 8px", fontSize:"11px", fontFamily:"Georgia,serif", background: selCountry===c ? COL[c]+"33" : "transparent",
                  border: selCountry===c ? `1px solid ${COL[c]}` : "1px solid #1e2a3a", borderRadius:"3px", color: selCountry===c ? COL[c] : "#5a6a7a", cursor:"pointer"
                }}>{c}</button>
            ))}
          </div>
        </div>

        <div style={{padding:"10px", borderBottom:"1px solid #1a2030"}}>
          <div style={{display:"flex", justifyContent:"space-between", marginBottom:"7px"}}>
            <span style={{fontSize:"9px",color:"#4a5a6a",textTransform:"uppercase"}}>{selCountry} Units</span>
            <span style={{fontSize:"10px",color:"#c8a850"}}>{scCount(selCountry)} SC</span>
          </div>
          {countryUnits.map(unit => {
            const ord = getOrder(unit.id), isSel = selUnitId === unit.id;
            return (
              <button key={unit.id} onClick={() => selectUnit(unit)} style={{ display:"flex", alignItems:"center", width:"100%", padding:"5px 8px", marginBottom:"3px", background: isSel ? COL[selCountry]+"1a" : "transparent", border: isSel ? `1px solid ${COL[selCountry]}66` : "1px solid #151e2a", borderRadius:"4px", cursor:"pointer", textAlign:"left"}}>
                <div style={{ width:20, height:20, borderRadius:"50%", background:COL[unit.country], color:TEXT_COL[unit.country], display:"flex", alignItems:"center", justifyContent:"center", fontSize:"9px", fontWeight:"bold", marginRight:8 }}>{unit.type}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:"12px", color:"#d4c9a8"}}>{T[unit.loc]?.n}</div>
                  <div style={{fontSize:"10px", color:"#4a5a6a"}}>{unit.loc}</div>
                </div>
                {ord && <div style={{fontSize:"10px", color:"#ff9922", fontFamily:"monospace"}}>{ord.type==="Move"?`→${ord.to}`:ord.type==="Hold"?"H":ord.type==="Convoy"?"C":"S"}</div>}
              </button>
            );
          })}
        </div>

        <div style={{padding:"10px", borderBottom:"1px solid #1a2030", minHeight:0}}>
          {selectedUnit ? (
            <>
              <div style={{marginBottom:7}}>
                <select value={orderType} onChange={e => { setOrderType(e.target.value); setOrderTo(""); setOrderSupLoc(""); setOrderSupTgt(""); }} style={SELECT_STYLE}>
                  <option value="Hold">Hold</option><option value="Move">Move</option><option value="Support Hold">Support Hold</option><option value="Support Move">Support Move</option>
                  {selectedUnit.type === "F" && T[selectedUnit.loc]?.t === "S" && <option value="Convoy">Convoy</option>}
                </select>
              </div>
              {orderType === "Move" && (
                <div style={{marginBottom:7}}>
                  <select value={orderTo} onChange={e => setOrderTo(e.target.value)} style={SELECT_STYLE}>
                    <option value="">— choose destination —</option>
                    {possibleMoves.map(loc => <option key={loc} value={loc}>{loc} — {T[loc]?.n}</option>)}
                  </select>
                </div>
              )}
              {(orderType === "Support Hold" || orderType === "Support Move") && (
                <div style={{marginBottom:7}}>
                  <select value={orderSupLoc} onChange={e => { setOrderSupLoc(e.target.value); setOrderSupTgt(""); }} style={SELECT_STYLE}>
                    <option value="">— choose unit to support —</option>
                    {adjUnits.map(({loc, unit}) => <option key={loc} value={loc}>{loc} — {unit.type} ({unit.country.slice(0,3)})</option>)}
                  </select>
                </div>
              )}
              {orderType === "Support Move" && orderSupLoc && (
                <div style={{marginBottom:7}}>
                  <select value={orderSupTgt} onChange={e => setOrderSupTgt(e.target.value)} style={SELECT_STYLE}>
                    <option value="">— support attack to —</option>
                    {supMoveTargets.map(loc => <option key={loc} value={loc}>{loc} — {T[loc]?.n}</option>)}
                  </select>
                </div>
              )}
              {orderType === "Convoy" && (
                <>
                  <select value={orderSupLoc} onChange={e => setOrderSupLoc(e.target.value)} style={{...SELECT_STYLE, marginBottom:7}}>
                    <option value="">— choose army to convoy —</option>
                    {validMoves.map(loc => { const u = units.find(u => u.loc === loc && u.type === "A"); return u ? <option key={loc} value={loc}>{loc} — A ({u.country.slice(0,3)})</option> : null; })}
                  </select>
                  <select value={orderTo} onChange={e => setOrderTo(e.target.value)} style={SELECT_STYLE}>
                    <option value="">— convoy destination —</option>
                    {Object.keys(T).filter(k => T[k].t !== "S" && k !== orderSupLoc).map(loc => <option key={loc} value={loc}>{loc} — {T[loc].n}</option>)}
                  </select>
                </>
              )}
              <button onClick={addOrder} disabled={!canAdd()} style={{ width:"100%", padding:"7px", marginTop:2, background: canAdd() ? "#1a3a1a" : "#111", color: canAdd() ? "#6ad46a" : "#3a4a3a", border: `1px solid ${canAdd() ? "#3a6a3a" : "#1a2a1a"}`, borderRadius:"4px", cursor: canAdd() ? "pointer" : "default", fontSize:"12px" }}>Set Order</button>
            </>
          ) : <div style={{padding:"16px", textAlign:"center", color:"#2a3a4a", fontSize:"12px", fontStyle:"italic"}}>Select a unit</div>}
        </div>

        <div style={{flex:1, overflow:"auto", padding:"10px"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
            <span style={{fontSize:"9px",color:"#4a5a6a"}}>ORDERS ({orders.length})</span>
            {orders.length > 0 && <button onClick={() => saveOrders([])} style={{background:"none",border:"none",color:"#6a4a4a",cursor:"pointer",fontSize:"10px"}}>Clear</button>}
          </div>
          {orders.map(order => {
            const unit = units.find(u => u.id === order.unitId);
            return unit ? (
              <div key={order.unitId} style={{ display:"flex", padding:"4px 7px", marginBottom:3, background:"#0d121e", border:"1px solid #1a2030", borderRadius:"3px"}}>
                <div style={{flex:1, fontSize:"11px", fontFamily:"monospace", color:"#c0b080"}}>{formatOrder(order, units)}</div>
                <button onClick={() => removeOrder(order.unitId)} style={{color:"#4a3a3a", background:"none", border:"none", cursor:"pointer"}}>×</button>
              </div>
            ) : null;
          })}
        </div>

        <div style={{padding:"10px", borderTop:"1px solid #1a2030"}}>
          <button onClick={processOrders} style={{ width:"100%", padding:"9px", background:"#0e1e3a", color:"#6a9ad8", border:"1px solid #1e3a6a", borderRadius:"4px", cursor:"pointer", fontSize:"13px" }}>
            Resolve Orders (Automated) →
          </button>
          {/* UPDATED FOOTER HERE */}
          <div style={{marginTop:"8px", textAlign:"center", fontSize:"9px", color:"#3a4a5a", fontFamily:"monospace", letterSpacing:"1px", textTransform:"uppercase"}}>daniel shengyi</div>
        </div>
      </div>
    </div>
  );
}