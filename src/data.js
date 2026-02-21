export const COL = {
  Austria: "#c0374f", England: "#1e4fa0", France: "#4a72d4", Germany: "#7a8e96",
  Italy: "#2e8b2e", Russia: "#c8dde8", Turkey: "#d4a820"
};
export const TEXT_COL = {
  Austria:"#fff", England:"#fff", France:"#fff", Germany:"#fff", 
  Italy:"#fff", Russia:"#1a2a38", Turkey:"#2a1a00"
};
export const COUNTRIES = ["Austria","England","France","Germany","Italy","Russia","Turkey"];

export const T = {
  CLY:{n:"Clyde",t:"C",sc:false,home:null,x:98,y:93}, EDI:{n:"Edinburgh",t:"C",sc:true,home:"England",x:130,y:112},
  LVP:{n:"Liverpool",t:"C",sc:true,home:"England",x:112,y:148}, YOR:{n:"Yorkshire",t:"C",sc:false,home:null,x:158,y:140},
  WAL:{n:"Wales",t:"C",sc:false,home:null,x:118,y:172}, LON:{n:"London",t:"C",sc:true,home:"England",x:168,y:175},
  BRE:{n:"Brest",t:"C",sc:true,home:"France",x:118,y:242}, PIC:{n:"Picardy",t:"C",sc:false,home:null,x:182,y:215},
  PAR:{n:"Paris",t:"L",sc:true,home:"France",x:188,y:245}, BUR:{n:"Burgundy",t:"L",sc:false,home:null,x:212,y:272},
  GAS:{n:"Gascony",t:"C",sc:false,home:null,x:148,y:300}, MAR:{n:"Marseilles",t:"C",sc:true,home:"France",x:210,y:322},
  SPA:{n:"Spain",t:"C",sc:true,home:null,x:138,y:375}, POR:{n:"Portugal",t:"C",sc:true,home:null,x:88,y:372},
  BEL:{n:"Belgium",t:"C",sc:true,home:null,x:198,y:198}, HOL:{n:"Holland",t:"C",sc:true,home:null,x:222,y:182},
  RUH:{n:"Ruhr",t:"L",sc:false,home:null,x:240,y:218}, KIE:{n:"Kiel",t:"C",sc:true,home:"Germany",x:270,y:170},
  BER:{n:"Berlin",t:"C",sc:true,home:"Germany",x:300,y:192}, MUN:{n:"Munich",t:"L",sc:true,home:"Germany",x:280,y:252},
  SIL:{n:"Silesia",t:"L",sc:false,home:null,x:330,y:218}, PRU:{n:"Prussia",t:"C",sc:false,home:null,x:344,y:178},
  BOH:{n:"Bohemia",t:"L",sc:false,home:null,x:318,y:238}, TYR:{n:"Tyrolia",t:"L",sc:false,home:null,x:290,y:280},
  VIE:{n:"Vienna",t:"L",sc:true,home:"Austria",x:336,y:268}, TRI:{n:"Trieste",t:"C",sc:true,home:"Austria",x:314,y:305},
  BUD:{n:"Budapest",t:"L",sc:true,home:"Austria",x:360,y:272}, GAL:{n:"Galicia",t:"L",sc:false,home:null,x:372,y:238},
  PIE:{n:"Piedmont",t:"C",sc:false,home:null,x:238,y:308}, VEN:{n:"Venice",t:"C",sc:true,home:"Italy",x:284,y:310},
  TUS:{n:"Tuscany",t:"C",sc:false,home:null,x:256,y:345}, ROM:{n:"Rome",t:"C",sc:true,home:"Italy",x:264,y:375},
  APU:{n:"Apulia",t:"C",sc:false,home:null,x:304,y:378}, NAP:{n:"Naples",t:"C",sc:true,home:"Italy",x:290,y:408},
  ALB:{n:"Albania",t:"C",sc:false,home:null,x:347,y:358}, SER:{n:"Serbia",t:"L",sc:true,home:null,x:370,y:318},
  GRE:{n:"Greece",t:"C",sc:true,home:null,x:374,y:388}, RUM:{n:"Rumania",t:"C",sc:true,home:null,x:410,y:295},
  BUL:{n:"Bulgaria",t:"C",sc:true,home:null,x:422,y:348}, NWY:{n:"Norway",t:"C",sc:true,home:null,x:294,y:85},
  SWE:{n:"Sweden",t:"C",sc:true,home:null,x:347,y:105}, DEN:{n:"Denmark",t:"C",sc:true,home:null,x:280,y:148},
  FIN:{n:"Finland",t:"C",sc:false,home:null,x:414,y:82}, STP:{n:"St. Petersburg",t:"C",sc:true,home:"Russia",x:472,y:75},
  LVN:{n:"Livonia",t:"C",sc:false,home:null,x:430,y:130}, MOS:{n:"Moscow",t:"L",sc:true,home:"Russia",x:518,y:150},
  WAR:{n:"Warsaw",t:"L",sc:true,home:"Russia",x:394,y:195}, UKR:{n:"Ukraine",t:"L",sc:false,home:null,x:454,y:228},
  SEV:{n:"Sevastopol",t:"C",sc:true,home:"Russia",x:500,y:278}, ARM:{n:"Armenia",t:"C",sc:false,home:null,x:590,y:348},
  ANK:{n:"Ankara",t:"C",sc:true,home:"Turkey",x:532,y:358}, CON:{n:"Constantinople",t:"C",sc:true,home:"Turkey",x:464,y:368},
  SMY:{n:"Smyrna",t:"C",sc:true,home:"Turkey",x:520,y:400}, SYR:{n:"Syria",t:"C",sc:false,home:null,x:594,y:400},
  TUN:{n:"Tunis",t:"C",sc:true,home:null,x:250,y:455}, NAO:{n:"N. Atlantic",t:"S",sc:false,home:null,x:52,y:162},
  NWG:{n:"Norwegian Sea",t:"S",sc:false,home:null,x:170,y:68}, NTH:{n:"North Sea",t:"S",sc:false,home:null,x:212,y:142},
  HEL:{n:"Helgoland",t:"S",sc:false,home:null,x:247,y:155}, SKA:{n:"Skagerrak",t:"S",sc:false,home:null,x:294,y:122},
  BAL:{n:"Baltic Sea",t:"S",sc:false,home:null,x:360,y:142}, BOT:{n:"G. of Bothnia",t:"S",sc:false,home:null,x:407,y:108},
  BAR:{n:"Barents Sea",t:"S",sc:false,home:null,x:397,y:48}, IRI:{n:"Irish Sea",t:"S",sc:false,home:null,x:82,y:152},
  ENG:{n:"Eng. Channel",t:"S",sc:false,home:null,x:154,y:200}, MAO:{n:"Mid-Atlantic",t:"S",sc:false,home:null,x:74,y:295},
  WES:{n:"W. Mediterranean",t:"S",sc:false,home:null,x:160,y:412}, LYO:{n:"G. of Lyon",t:"S",sc:false,home:null,x:212,y:368},
  TYS:{n:"Tyrrhenian Sea",t:"S",sc:false,home:null,x:264,y:428}, ADR:{n:"Adriatic Sea",t:"S",sc:false,home:null,x:322,y:348},
  ION:{n:"Ionian Sea",t:"S",sc:false,home:null,x:354,y:430}, AEG:{n:"Aegean Sea",t:"S",sc:false,home:null,x:427,y:415},
  EAS:{n:"E. Mediterranean",t:"S",sc:false,home:null,x:510,y:450}, BLA:{n:"Black Sea",t:"S",sc:false,home:null,x:522,y:320},
};

export const ADJ = {
  CLY:{army:["EDI","LVP"],fleet:["EDI","LVP","NWG","NAO"]}, EDI:{army:["CLY","LVP","YOR"],fleet:["CLY","YOR","NWG","NTH"]},
  LVP:{army:["CLY","EDI","YOR","WAL"],fleet:["CLY","WAL","IRI","NAO"]}, YOR:{army:["EDI","LVP","WAL","LON"],fleet:["EDI","LON","NTH"]},
  WAL:{army:["LVP","LON","YOR"],fleet:["LVP","LON","IRI","ENG"]}, LON:{army:["YOR","WAL"],fleet:["YOR","WAL","NTH","ENG"]},
  BRE:{army:["PIC","PAR","GAS"],fleet:["PIC","GAS","ENG","MAO"]}, PIC:{army:["BRE","PAR","BEL"],fleet:["BRE","BEL","ENG"]},
  PAR:{army:["BRE","PIC","BUR","GAS"],fleet:[]}, BUR:{army:["PAR","PIC","BEL","RUH","MUN","MAR","GAS"],fleet:[]},
  GAS:{army:["BRE","PAR","BUR","MAR","SPA"],fleet:["BRE","SPA","MAO"]}, MAR:{army:["GAS","BUR","PIE","SPA"],fleet:["PIE","SPA","LYO"]},
  SPA:{army:["POR","GAS","MAR"],fleet:["POR","GAS","MAR","MAO","WES","LYO"]}, POR:{army:["SPA"],fleet:["SPA","MAO"]},
  BEL:{army:["PIC","BUR","RUH","HOL"],fleet:["PIC","HOL","ENG","NTH"]}, HOL:{army:["BEL","RUH","KIE"],fleet:["BEL","KIE","NTH","HEL"]},
  RUH:{army:["HOL","BEL","BUR","MUN","KIE"],fleet:[]}, KIE:{army:["HOL","RUH","BER","MUN","DEN"],fleet:["HOL","BER","DEN","HEL","BAL"]},
  BER:{army:["KIE","SIL","PRU","MUN"],fleet:["KIE","PRU","BAL"]}, MUN:{army:["RUH","KIE","BER","BOH","TYR","BUR"],fleet:[]},
  SIL:{army:["BER","PRU","WAR","GAL","BOH"],fleet:[]}, PRU:{army:["BER","SIL","WAR","LVN"],fleet:["BER","LVN","BAL"]},
  BOH:{army:["MUN","SIL","GAL","VIE","TYR"],fleet:[]}, TYR:{army:["MUN","BOH","VIE","TRI","VEN","PIE"],fleet:[]},
  VIE:{army:["BOH","TYR","TRI","BUD","GAL"],fleet:[]}, TRI:{army:["TYR","VIE","BUD","SER","ALB","VEN"],fleet:["VEN","ALB","ADR"]},
  BUD:{army:["VIE","TRI","GAL","SER","RUM"],fleet:[]}, GAL:{army:["WAR","SIL","BOH","VIE","BUD","RUM","UKR"],fleet:[]},
  PIE:{army:["MAR","TYR","VEN"],fleet:["MAR","VEN","LYO"]}, VEN:{army:["PIE","TYR","TRI","TUS","ROM","APU"],fleet:["PIE","TRI","APU","ADR"]},
  TUS:{army:["PIE","VEN","ROM"],fleet:["PIE","ROM","LYO","TYS"]}, ROM:{army:["TUS","VEN","APU","NAP"],fleet:["TUS","NAP","TYS"]},
  APU:{army:["ROM","VEN","NAP"],fleet:["VEN","NAP","ION","ADR"]}, NAP:{army:["ROM","APU"],fleet:["ROM","APU","TYS","ION"]},
  ALB:{army:["TRI","SER","GRE"],fleet:["TRI","GRE","ADR","ION"]}, SER:{army:["TRI","BUD","RUM","BUL","GRE","ALB"],fleet:[]},
  GRE:{army:["SER","BUL","ALB"],fleet:["ALB","BUL","ION","AEG"]}, RUM:{army:["BUD","GAL","UKR","SEV","BUL","SER"],fleet:["SEV","BUL","BLA"]},
  BUL:{army:["SER","RUM","GRE","CON"],fleet:["GRE","CON","RUM","AEG","BLA"]}, NWY:{army:["STP","FIN","SWE"],fleet:["STP","SWE","NWG","NTH","BAR","SKA"]},
  SWE:{army:["NWY","FIN","DEN"],fleet:["NWY","FIN","DEN","NTH","BAL","SKA","BOT"]}, DEN:{army:["SWE","KIE"],fleet:["SWE","KIE","NTH","BAL","HEL","SKA"]},
  FIN:{army:["NWY","STP"],fleet:["STP","SWE","BOT"]}, STP:{army:["NWY","FIN","MOS","LVN"],fleet:["NWY","FIN","LVN","BAR","BOT"]},
  LVN:{army:["STP","MOS","WAR","PRU"],fleet:["STP","PRU","BAL","BOT"]}, MOS:{army:["STP","LVN","WAR","UKR","SEV"],fleet:[]},
  WAR:{army:["SIL","PRU","LVN","MOS","UKR","GAL"],fleet:[]}, UKR:{army:["WAR","MOS","SEV","RUM","GAL"],fleet:[]},
  SEV:{army:["UKR","MOS","RUM","ARM"],fleet:["RUM","ARM","BLA"]}, ARM:{army:["SEV","ANK","SMY","SYR"],fleet:["SEV","ANK","BLA"]},
  ANK:{army:["CON","SMY","ARM"],fleet:["CON","ARM","BLA"]}, CON:{army:["BUL","ANK","SMY"],fleet:["BUL","ANK","SMY","BLA","AEG"]},
  SMY:{army:["CON","ANK","ARM","SYR"],fleet:["CON","SYR","AEG","EAS"]}, SYR:{army:["SMY","ARM"],fleet:["SMY","EAS"]},
  TUN:{army:[],fleet:["WES","TYS","ION","NAP"]}, NAO:{fleet:["CLY","LVP","IRI","MAO","NWG"]},
  NWG:{fleet:["CLY","EDI","NWY","NTH","BAR","NAO"]}, NTH:{fleet:["EDI","YOR","LON","BEL","HOL","DEN","NWY","NWG","ENG","SKA","HEL"]},
  HEL:{fleet:["HOL","KIE","DEN","NTH","SKA"]}, SKA:{fleet:["NTH","NWY","SWE","DEN","HEL","BAL"]},
  BAL:{fleet:["KIE","BER","PRU","LVN","SWE","DEN","BOT","SKA"]}, BOT:{fleet:["STP","LVN","FIN","SWE","BAL"]},
  BAR:{fleet:["STP","NWY","NWG"]}, IRI:{fleet:["CLY","LVP","WAL","NAO","ENG","MAO"]},
  ENG:{fleet:["LON","WAL","BRE","PIC","BEL","NTH","IRI","MAO"]}, MAO:{fleet:["NAO","IRI","ENG","BRE","GAS","SPA","POR","WES"]},
  WES:{fleet:["SPA","MAO","TUN","TYS","LYO"]}, LYO:{fleet:["PIE","MAR","SPA","TUS","WES","TYS"]},
  TYS:{fleet:["TUS","ROM","NAP","TUN","LYO","WES","ION"]}, ADR:{fleet:["TRI","VEN","APU","ALB","ION"]},
  ION:{fleet:["APU","NAP","ALB","GRE","TUN","TYS","ADR","AEG","EAS"]}, AEG:{fleet:["GRE","BUL","CON","SMY","ION","EAS"]},
  EAS:{fleet:["SMY","SYR","ION","AEG"]}, BLA:{fleet:["RUM","BUL","CON","ANK","ARM","SEV"]},
};

export const INITIAL_UNITS = [
  {id:"au1",country:"Austria",type:"A",loc:"BUD"}, {id:"au2",country:"Austria",type:"A",loc:"VIE"},
  {id:"au3",country:"Austria",type:"F",loc:"TRI"}, {id:"en1",country:"England", type:"F",loc:"EDI"},
  {id:"en2",country:"England", type:"F",loc:"LON"}, {id:"en3",country:"England", type:"A",loc:"LVP"},
  {id:"fr1",country:"France",  type:"A",loc:"PAR"}, {id:"fr2",country:"France",  type:"A",loc:"MAR"},
  {id:"fr3",country:"France",  type:"F",loc:"BRE"}, {id:"ge1",country:"Germany", type:"A",loc:"BER"},
  {id:"ge2",country:"Germany", type:"A",loc:"MUN"}, {id:"ge3",country:"Germany", type:"F",loc:"KIE"},
  {id:"it1",country:"Italy",   type:"A",loc:"VEN"}, {id:"it2",country:"Italy",   type:"A",loc:"ROM"},
  {id:"it3",country:"Italy",   type:"F",loc:"NAP"}, {id:"ru1",country:"Russia",  type:"A",loc:"MOS"},
  {id:"ru2",country:"Russia",  type:"A",loc:"WAR"}, {id:"ru3",country:"Russia",  type:"F",loc:"SEV"},
  {id:"ru4",country:"Russia",  type:"F",loc:"STP"}, {id:"tu1",country:"Turkey",  type:"A",loc:"CON"},
  {id:"tu2",country:"Turkey",  type:"A",loc:"SMY"}, {id:"tu3",country:"Turkey",  type:"F",loc:"ANK"},
];

export const INITIAL_CONTROLLERS = (() => {
  const m = {};
  Object.entries(T).forEach(([k,v]) => {
    if (v.sc) m[k] = v.home || null;
  });
  return m;
})();