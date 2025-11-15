let table;
let volcano = null;
let cnv;
let wrapper;

const csvFile = "volcano.csv";
const glyphStroke = [255, 140, 0];

function preload() {
  table = loadTable(csvFile, "csv", "header");
}

function setup() {
  wrapper = document.getElementById("canvas-wrapper");
  createResponsiveCanvas();
  textFont("Roboto");
  textAlign(CENTER, CENTER);

  loadVolcanoFromURL();
  noLoop();

  window.addEventListener("resize", () => {
    createResponsiveCanvas();
    redraw();
  });
}

function createResponsiveCanvas() {
  const wrapperW = Math.max(260, wrapper.clientWidth || 260);
  const size = wrapperW;
  if (cnv) {
    resizeCanvas(size, size);
  } else {
    cnv = createCanvas(size, size);
    cnv.parent("canvas-wrapper");
  }
}

function loadVolcanoFromURL() {
  const params = new URLSearchParams(window.location.search);
  const idParam = parseInt(params.get("id"));

  if (isNaN(idParam) || idParam < 0 || idParam >= table.getRowCount()) {
    console.warn("Parametro 'id' non valido");
    volcano = null;
    return;
  }

  const row = table.getRow(idParam);

  let name     = row.getString("Volcano Name") || row.getString("Volcano_Name") || "Sconosciuto";
  let country  = row.getString("Country") || "";
  let location = row.getString("Location") || "";
  let lat      = parseFloat(row.getString("Latitude"));
  let lon      = parseFloat(row.getString("Longitude"));
  let elev     = parseFloat(row.getString("Elevation (m)"));
  let type     = row.getString("Type") || "";
  let category = row.getString("TypeCategory") || row.getString("Type Category") || "";
  let status   = row.getString("Status") || "";
  let last     = row.getString("Last Known Eruption") || "";

  volcano = {
    id: idParam,
    name,
    country,
    location,
    lat,
    lon,
    elev,
    type,
    category,
    status,
    last
  };
}

function draw() {
  background("#253130");

  if (!volcano) {
    fill(255);
    textSize(16);
    text(
      "Nessun vulcano trovato per questo ID.\nControlla il link o torna alla mappa.",
      width / 2,
      height / 2
    );
    return;
  }

  const cx = width / 2;
  const cy = height * 0.30;
  const glyphSize = min(width, height) * 0.32;

  // Glifo basato sulla CATEGORIA
  const drivingCategory = volcano.category || volcano.type || "";
  drawTypeGlyph(drivingCategory, cx, cy, glyphSize);

  // Testi
  fill(255);
  noStroke();
  textAlign(CENTER, TOP);

  textSize(22);
  text(volcano.name || "Vulcano", width / 2, height * 0.55);

  textSize(14);
  let lines = [
    `Paese: ${volcano.country || "N/A"}`,
    `Categoria: ${volcano.category || volcano.type || "N/A"}`,
    `Stato: ${volcano.status || "N/A"}`,
    `Elevazione: ${volcano.elev != null && !isNaN(volcano.elev) ? volcano.elev + " m" : "N/A"}`,
    `Ultima eruzione: ${volcano.last || "N/A"}`
  ];

  let y = height * 0.60;
  for (let line of lines) {
    text(line, width / 2, y);
    y += 20;
  }

}


// =======================
// GLIFI
// =======================
function getGlyphKey(typeStr) {
  const t = (typeStr || "").toLowerCase();

  // categorie da TypeCategory
  if (t.includes("stratovolcano"))      return "strato";
  if (t.includes("shield"))             return "shield";
  if (t.includes("caldera"))            return "caldera";
  if (t === "cone" || t.includes(" cone")) return "cone";
  if (t.includes("maars") || t.includes("tuff ring")) return "maar_tuff";
  if (t.includes("crater system") || t.includes("crater rows")) return "crater_system";
  if (t.includes("submarine"))          return "submarine";
  if (t.includes("subglacial"))         return "subglacial";
  if (t.includes("field"))              return "field";
  if (t.includes("other") || t.includes("unknown")) return "other";

  // fallback: guardo il Type
  if (t.includes("lava dome"))          return "lava_dome";
  if (t.includes("lava cone"))          return "lava_cone";
  if (t.includes("fissure vent"))       return "fissure_vent";
  if (t.includes("explosion crater"))   return "explosion_crater";
  if (t.includes("maar"))               return "maar_tuff";
  if (t.includes("complex") || t.includes("compound")) return "complex";

  return "generic";
}

// =======================
// DISEGNARE GLIFI
// =======================
function drawTypeGlyph(typeOrCategory, cx, cy, size) {
  const key = getGlyphKey(typeOrCategory);

  stroke(...glyphStroke);
  strokeWeight(7);
  noFill();
  strokeCap(ROUND);
  strokeJoin(ROUND);

  switch (key) {
    case "strato":          drawStratoGlyph(cx, cy, size); break;
    case "shield":          drawShieldGlyph(cx, cy, size); break;
    case "caldera":         drawCalderaGlyph(cx, cy, size); break;
    case "cone":            drawConeGlyph(cx, cy, size); break;
    case "maar_tuff":       drawMaarTuffGlyph(cx, cy, size); break;
    case "crater_system":   drawCraterSystemGlyph(cx, cy, size); break;
    case "submarine":       drawSubmarineGlyph(cx, cy, size); break;
    case "subglacial":      drawSubglacialGlyph(cx, cy, size); break;
    case "field":           drawFieldGlyph(cx, cy, size); break;
    case "other":           drawOtherGlyph(cx, cy, size); break;
    case "lava_dome":       drawLavaDomeGlyph(cx, cy, size); break;
    case "lava_cone":       drawLavaConeGlyph(cx, cy, size); break;
    case "fissure_vent":    drawFissureVentGlyph(cx, cy, size); break;
    case "explosion_crater":drawExplosionCraterGlyph(cx, cy, size); break;
    case "complex":         drawComplexGlyph(cx, cy, size); break;
    default:                drawGenericGlyph(cx, cy, size); break;
  }
}

// ---- TUTTI I GLIFI ----
function drawStratoGlyph(cx, cy, size) {
  const h = size;
  const baseW = size * 0.9;
  const topW = size * 0.35;
  const yBottom = cy + h * 0.4;
  const yTop = cy - h * 0.4;

  beginShape();
  vertex(cx - baseW / 2, yBottom);
  vertex(cx - topW / 2,  yTop);
  vertex(cx + topW / 2,  yTop);
  vertex(cx + baseW / 2, yBottom);
  endShape();
}

function drawShieldGlyph(cx, cy, size) {
  const h = size * 0.45;
  const baseW = size * 1.1;
  const topW = size * 0.7;
  const yBottom = cy + h * 0.3;
  const yTop = cy - h * 0.3;

  beginShape();
  vertex(cx - baseW / 2, yBottom);
  vertex(cx - topW / 2,  yTop);
  vertex(cx + topW / 2,  yTop);
  vertex(cx + baseW / 2, yBottom);
  endShape();
}

function drawLavaDomeGlyph(cx, cy, size) {
  const w = size * 0.9;
  const h = size * 0.9;
  const yBottom = cy + h * 0.1;
  arc(cx, yBottom, w, h, PI, TWO_PI);
}

function drawCalderaGlyph(cx, cy, size) {
  const w = size * 0.8;
  line(cx - w / 2, cy, cx + w / 2, cy);
}

function drawFissureVentGlyph(cx, cy, size) {
  const w = size * 0.9;
  const y = cy + size * 0.15;
  line(cx - w / 2, y, cx + w / 2, y);
}

function drawExplosionCraterGlyph(cx, cy, size) {
  const w = size * 0.8;
  const notch = size * 0.2;
  const y = cy + size * 0.1;

  beginShape();
  vertex(cx - w / 2, y);
  vertex(cx - notch / 2, y);
  vertex(cx, y - notch * 0.35);
  vertex(cx + notch / 2, y);
  vertex(cx + w / 2, y);
  endShape();
}

function drawComplexGlyph(cx, cy, size) {
  drawStratoGlyph(cx, cy, size * 0.85);
  const h = size * 0.45;
  const yBottom = cy + h * 0.7;
  const yTop = cy + h * 0.05;
  const baseW = size * 0.35;
  const topW = size * 0.2;

  beginShape();
  vertex(cx + size * 0.12,      yBottom);
  vertex(cx + size * 0.12 - baseW / 2, yBottom);
  vertex(cx + size * 0.12 - topW / 2,  yTop);
  vertex(cx + size * 0.12 + topW / 2,  yTop);
  vertex(cx + size * 0.12 + baseW / 2, yBottom);
  endShape();
}

function drawConeGlyph(cx, cy, size) {
  const h = size;
  const baseW = size * 0.7;
  const topW = size * 0.25;
  const yBottom = cy + h * 0.4;
  const yTop = cy - h * 0.35;

  beginShape();
  vertex(cx - baseW / 2, yBottom);
  vertex(cx - topW / 2,  yTop);
  vertex(cx + topW / 2,  yTop);
  vertex(cx + baseW / 2, yBottom);
  endShape();
}

function drawMaarTuffGlyph(cx, cy, size) {
  const outerR = size * 0.55;
  const innerR = size * 0.3;
  noFill();
  beginShape();
  for (let a = PI, end = TWO_PI; a <= end; a += 0.2) {
    const x = cx + cos(a) * outerR;
    const y = cy + sin(a) * outerR;
    vertex(x, y);
  }
  endShape();
  beginShape();
  for (let a = PI, end = TWO_PI; a <= end; a += 0.2) {
    const x = cx + cos(a) * innerR;
    const y = cy + sin(a) * innerR;
    vertex(x, y);
  }
  endShape();
}

function drawCraterSystemGlyph(cx, cy, size) {
  const r = size * 0.22;
  const gap = size * 0.18;
  const centers = [cx - gap, cx, cx + gap];
  const y = cy + size * 0.05;

  centers.forEach((c) => {
    beginShape();
    for (let a = PI, end = TWO_PI; a <= end; a += 0.2) {
      const x = c + cos(a) * r;
      const yy = y + sin(a) * r;
      vertex(x, yy);
    }
    endShape();
  });
}

function drawSubmarineGlyph(cx, cy, size) {
  drawShieldGlyph(cx, cy - size * 0.12, size * 0.85);

  const w = size * 0.9;
  const y = cy + size * 0.35;
  const amp = size * 0.05;
  const steps = 12;

  beginShape();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = cx - w / 2 + w * t;
    const yy = y + sin(t * TWO_PI) * amp;
    vertex(x, yy);
  }
  endShape();
}

function drawSubglacialGlyph(cx, cy, size) {
  drawStratoGlyph(cx, cy + size * 0.05, size * 0.85);
  const w = size * 0.6;
  const y = cy - size * 0.45;
  line(cx - w / 2, y, cx + w / 2, y);
}

function drawFieldGlyph(cx, cy, size) {
  const w = size * 0.9;
  const baseY = cy + size * 0.2;
  const count = 6;
  const step = w / (count - 1);
  const h = size * 0.18;

  for (let i = 0; i < count; i++) {
    const x = cx - w / 2 + step * i;
    const y0 = baseY;
    const y1 = baseY - (0.3 + 0.7 * (i / (count - 1))) * h;
    line(x, y0, x, y1);
  }
}

function drawOtherGlyph(cx, cy, size) {
  const w = size * 0.6;
  const h = size * 0.35;
  const yTop = cy - h / 2;
  const yBottom = cy + h / 2;
  const xLeft = cx - w / 2;
  const xRight = cx + w / 2;

  beginShape();
  vertex(xLeft, yBottom);
  vertex(xLeft, yTop);
  vertex(xRight, yTop);
  vertex(xRight, yBottom);
  endShape();
}

function drawLavaConeGlyph(cx, cy, size) {
  const h = size;
  const baseW = size * 0.8;
  const yBottom = cy + h * 0.35;
  const yTop = cy - h * 0.35;

  beginShape();
  vertex(cx - baseW / 2, yBottom);
  vertex(cx, yTop);
  vertex(cx + baseW / 2, yBottom);
  endShape();
}

function drawGenericGlyph(cx, cy, size) {
  const h = size;
  const baseW = size * 0.8;
  const topW = size * 0.4;
  const yBottom = cy + h * 0.35;
  const yTop = cy - h * 0.35;

  beginShape();
  vertex(cx - baseW / 2, yBottom);
  vertex(cx - topW / 2,  yTop);
  vertex(cx + topW / 2,  yTop);
  vertex(cx + baseW / 2, yBottom);
  endShape();
}

