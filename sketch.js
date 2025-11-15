// === Variabili globali ===
let table;          
let volcanoes = []; 
let worldImg;    
let hoveredVolcano = null;


// costanti per i file da caricare
const mapFile = "mappamondo.png";   
const csvFile = "volcano.csv";


let cnv;             // oggetto canvas p5.js
let wrapper;         // elemento HTML che contiene il canvas
let tooltipDiv;      // riferimento al tooltip (scheda informativa)


function preload() {
  table = loadTable(csvFile, "csv", "header");

  worldImg = loadImage(mapFile);
}


function setup() {
  // prendo dal DOM il contenitore del canvas
  wrapper = document.getElementById("canvas-wrapper");

  createResponsiveCanvas();

  // stile base per i disegni
  noStroke();
  textFont("Roboto");

  //dati dei vulcani
  loadVolcanoData();

  // salvo il riferimento al tooltip nel DOM
  tooltipDiv = document.getElementById("tooltip");

  // mostrare-nascondere il tooltip quando il mouse si muove sul canvas
  cnv.elt.addEventListener("mousemove", onMouseMove);
  cnv.elt.addEventListener("mouseleave", () => hideTooltip());

  cnv.elt.addEventListener("click", onClickCanvas); //cnv.elt è l’elemento HTML <canvas> creato da p5.

  // rende il sito responsive
  window.addEventListener("resize", () => {
    createResponsiveCanvas();
    redrawAll();
  });

  // disegno iniziale della mappa e dei punti
  redrawAll();
}

function onClickCanvas(evt) {
  // se non sto "hoverando" nessun vulcano → esco
  if (!hoveredVolcano) return;

  // l'id del vulcano
  const id = hoveredVolcano.id;

  // URL della nuova pagina, con un parametro
  window.location.href = `detail.html?id=${id}`;
}

// crea o ridimensiona il canvas mantenendo le proporzioni dell’immagine
function createResponsiveCanvas() {
  const wrapperW = Math.max(200, wrapper.clientWidth); // larghezza disponibile
  const imgRatio = worldImg.width / worldImg.height;   // rapporto larghezza/altezza dell’immagine
  const desiredW = wrapperW;                           // canvas largo quanto il contenitore
  const desiredH = Math.round(desiredW / imgRatio);    // altezza proporzionale

  if (cnv) {
    // se il canvas esiste già, lo ridimensiona
    resizeCanvas(desiredW, desiredH);
  } else {
    // altrimenti lo crea e lo inserisce nel wrapper
    cnv = createCanvas(desiredW, desiredH);
    cnv.parent("canvas-wrapper");
  }
}


// legge i dati del CSV e crea un array di oggetti “vulcano”
function loadVolcanoData() {
  volcanoes = []; 

  
  for (let r = 0; r < table.getRowCount(); r++) {
    
    let name = table.getString(r, "Volcano Name") || table.getString(r, "Volcano_Name") || "Sconosciuto";
    let country = table.getString(r, "Country") || "";
    let location = table.getString(r, "Location") || "";
    let lat = parseFloat(table.getString(r, "Latitude"));
    let lon = parseFloat(table.getString(r, "Longitude"));
    let elev = parseFloat(table.getString(r, "Elevation (m)"));
    let type = table.getString(r, "Type") || "";
    let category = table.getString(r, "TypeCategory") || table.getString(r, "Type Category") || "";
    let status = table.getString(r, "Status") || "";
    let last = table.getString(r, "Last Known Eruption") || "";

    // se latitudine o longitudine non sono numeriche, salta la riga
    if (isNaN(lat) || isNaN(lon)) continue;

    // altitudine determina il raggio (da 3 a 20 pixel)
    let rSize = map(constrain(elev || 0, -6000, 7000), -6000, 7000, 3, 20);
    rSize = constrain(rSize, 3, 26); // limita il valore massimo

    volcanoes.push({
      id: r,
      name,
      country,
      location,
      lat,
      lon,
      elev,
      type,
      category,
      status,
      last,
      rSize
    });

  }
}


// ridisegna completamente la mappa e tutti i punti
function redrawAll() {
  clear();                    
  background(14,15,18);       
  imageMode(CORNER);          
  image(worldImg, 0, 0, width, height); //la mappa grande quanto il canvas

  // disegno tutti i vulcani
  for (let v of volcanoes) {
    const p = projectToPixel(v.lon, v.lat); // converte coordinate geografiche in pixel
    drawVolcanoPoint(p.x, p.y, v);          // disegna il punto
  }
}


// disegna un singolo punto sulla mappa
function drawVolcanoPoint(x, y, v) {
  const elev = (v.elev == null || isNaN(v.elev)) ? 0 : v.elev; // gestione valori nulli
  const col = elevationColor(elev); // calcola colore in base all’altitudine

  // effetto ombra per dare profondità
  drawingContext.shadowBlur = 10;
  drawingContext.shadowColor = "rgba(0,0,0,0.35)";
  stroke(0, 40);
  strokeWeight(0.6);
  fill(col);
  ellipse(x, y, v.rSize, v.rSize); // disegna il cerchio del vulcano
  drawingContext.shadowBlur = 0;   // disattivo l’ombra
}

// === elevationColor() ===
// restituisce un colore che varia in base all’altitudine (dal bordeaux al giallo)
function elevationColor(elev) {
  const t = constrain(map(elev, -6000, 7000, 0, 1), 0, 1); // normalizza l’altitudine tra 0 e 1
  const c0 = color("#df0101"); // basso → bordeaux scuro
  const c1 = color("#cd8067"); // medio → arancione/rosso
  const c2 = color("#ecdc9c"); // alto → giallo

  // sfumatura dei colori
  if (t < 0.5) {
    // da 0 a 0.5 
    const tt = map(t, 0, 0.5, 0, 1);
    return lerpColor(c0, c1, tt);
  } else {
    // da 0.5 a 1 
    const tt = map(t, 0.5, 1, 0, 1);
    return lerpColor(c1, c2, tt);
  }
}

// converte coordinate geografiche (lon/lat) in coordinate pixel sul canvas
function projectToPixel(lonDeg, latDeg) {
  // normalizza la longitudine in intervallo [-180, 180]
  let L = ((parseFloat(lonDeg) + 180) % 360 + 360) % 360 - 180;

  // converto longitudine e latitudine in coordinate x,y
  const x = map(L, -180, 180, 0, width);
  const y = map(latDeg, 90, -90, 0, height);
  return { x, y };
}

/* === TOOLTIP ===
   (scheda che appare al passaggio del mouse) */

function onMouseMove(evt) {
  const rect = cnv.elt.getBoundingClientRect(); // posizione del canvas nella finestra
  const mx = evt.clientX - rect.left; // coordinate mouse relative al canvas
  const my = evt.clientY - rect.top;

  let found = null; // variabile per il vulcano trovato
  hoveredVolcano = null;   // nessun vulcano selezionato all'inizio

  // cerca se il cursore è sopra un punto (entro il suo raggio)
  for (let v of volcanoes) {
    const p = projectToPixel(v.lon, v.lat);
    const d = dist(mx, my, p.x, p.y);
    if (d <= v.rSize / 2 + 4) { // +4 pixel di tolleranza
      found = { v, p };
      hoveredVolcano = v;     // memorizza quale vulcano sto "hoverando"
      break;
    }
  }

  // se non ho trovato nessun vulcano, nascondo il tooltip
  if (!found) {
    hideTooltip();
    return;
  }

  // mostra il tooltip per il vulcano trovato
  showTooltipFor(found.v, found.p, evt.clientX, evt.clientY);
}

// mostra il tooltip con le informazioni del vulcano
function showTooltipFor(v, p, clientX, clientY) {
  if (!tooltipDiv) tooltipDiv = document.getElementById("tooltip");

  const title = tooltipDiv.querySelector(".tt-title");
  const body = tooltipDiv.querySelector(".tt-body");

  // titolo del tooltip: nome + paese/località
  title.textContent = `${v.name} (${v.country || v.location || ""})`;

  // testo interno con informazioni formattate
  const latStr = (Math.round(v.lat * 100) / 100).toFixed(2);
  const lonStr = (Math.round(v.lon * 100) / 100).toFixed(2);
  body.innerHTML = `
    <div><strong>Type:</strong> ${v.type || "N/A"}</div>
    <div><strong>Category:</strong> ${v.category || "N/A"}</div>
    <div><strong>Lat / Lon:</strong> ${latStr}°, ${lonStr}°</div>
    <div><strong>Elevation:</strong> ${v.elev != null ? v.elev + " m" : "N/A"}</div>
    <div><strong>Status:</strong> ${v.status || "N/A"}</div>
    <div><strong>Last Known Eruption:</strong> ${v.last || "N/A"}</div>
  `;

  // calcola posizione del tooltip accanto al cursore
  const cardRect = document.querySelector("#map-card").getBoundingClientRect();
  const ttRect = tooltipDiv.getBoundingClientRect();

  let left = clientX + 12; // di default a destra del cursore
  let top = clientY + 8;

  // se uscisse fuori a destra, lo metto a sinistra
  if (left + ttRect.width > cardRect.right) left = clientX - ttRect.width - 18;
  // se uscisse sotto, lo sposto sopra
  if (top + ttRect.height > cardRect.bottom) top = clientY - ttRect.height - 18;
  // se troppo in alto, lo limito
  if (top < cardRect.top + 6) top = cardRect.top + 6;

  // applica le coordinate calcolate al tooltip
  tooltipDiv.style.left = `${left}px`;
  tooltipDiv.style.top = `${top}px`;
  tooltipDiv.style.display = "block";
  tooltipDiv.setAttribute("aria-hidden", "false");

  // ridisegna la mappa e metto in evidenza il vulcano selezionato
  redrawAll();
  pushHighlight(p.x, p.y, v);
}

// disegna un effetto di "bagliore" attorno al vulcano selezionato
function pushHighlight(x, y, v) {
  drawingContext.save();
  drawingContext.shadowBlur = 22;
  drawingContext.shadowColor = "rgba(218, 218, 218, 0.12)";
  noStroke();
  fill(255, 255, 255, 36); // cerchio bianco semi-trasparente
  ellipse(x, y, v.rSize * 1.8, v.rSize * 1.8);
  drawingContext.restore();
}

// nasconde il tooltip e ridisegna la mappa
function hideTooltip() {
  if (!tooltipDiv) tooltipDiv = document.getElementById("tooltip");
  tooltipDiv.style.display = "none";
  tooltipDiv.setAttribute("aria-hidden", "true");
  hoveredVolcano = null;
  redrawAll();
}


