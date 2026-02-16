// Estado y configuración
const state = {
  foodsDB: [],
  logs: [], // {id, date, name, grams, kcal, sugars, satfat, sodium, fiber, tags}
  challenges: [
    { id: 'fv5', name: '5 porciones de frutas/verduras', target: 5, unit: 'porciones/día', streak: 0, done: false },
    { id: 'water8', name: '8 vasos de agua', target: 8, unit: 'vasos/día', streak: 0, done: false },
    { id: 'nosoda3', name: 'Sin bebidas azucaradas', target: 1, unit: 'día', streak: 0, done: false },
    { id: 'walk7k', name: '7k pasos o 40 min caminata', target: 1, unit: 'día', streak: 0, done: false },
  ],
  profile: { calTarget: 2000 },
  activeDate: null,
};

// Base simple de alimentos por 100g
const BASE_FOODS = [
  // name, kcal, sugars, satfat, sodium(mg), fiber, tags
  ['Manzana', 52, 10.4, 0.0, 1, 2.4, ['fruta']],
  ['Banana', 89, 12.2, 0.1, 1, 2.6, ['fruta']],
  ['Naranja', 47, 9.0, 0.0, 0, 2.4, ['fruta']],
  ['Arroz blanco cocido', 130, 0.1, 0.1, 1, 0.3, ['cereal']],
  ['Pan blanco', 265, 5.0, 0.8, 490, 2.4, ['cereal']],
  ['Pechuga de pollo', 165, 0, 0.3, 74, 0, ['proteina']],
  ['Huevo', 155, 1.1, 3.3, 124, 0, ['proteina']],
  ['Leche entera', 61, 5.0, 1.9, 44, 0, ['lacteo']],
  ['Yogur natural', 59, 3.2, 1.0, 36, 0, ['lacteo']],
  ['Queso (semicurado)', 402, 0.5, 20.0, 621, 0, ['lacteo']],
  ['Aceite de oliva', 884, 0, 14.0, 2, 0, ['grasa']],
  ['Azúcar', 387, 100, 0, 0, 0, ['azucar']],
  ['Refresco azucarado', 40, 10.6, 0, 5, 0, ['bebida']],
  ['Brócoli', 34, 1.7, 0.1, 33, 2.6, ['verdura']],
  ['Zanahoria', 41, 4.7, 0.0, 69, 2.8, ['verdura']],
  ['Avena', 389, 0.9, 1.2, 2, 10.6, ['cereal']],
  ['Frijoles cocidos', 127, 0.3, 0.1, 1, 6.4, ['legumbre']],
  ['Lentejas cocidas', 116, 1.8, 0.1, 2, 7.9, ['legumbre']],
];

// Recomendaciones OMS (adulto promedio)
const WHO = {
  sugarRed: 50,      // g/día (10% kcal ~ 2000kcal)
  sugarGreen: 25,    // g/día (5% kcal) objetivo ideal
  satFatRed: 22,     // g/día (~10% kcal)
  satFatGreen: 10,   // g/día
  sodiumRed: 2000,   // mg/día
  sodiumGreen: 1500, // mg/día
  fiberGreen: 25,    // g/día mínimo
  fiberAmber: 15,
};

// Utilidades
const $ = (sel) => document.querySelector(sel);
const $all = (sel) => Array.from(document.querySelectorAll(sel));
const todayStr = () => new Date().toISOString().slice(0,10);
const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const lsSet = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const number = (v, def=0) => isFinite(+v) ? +v : def;

function initDB(){
  state.foodsDB = lsGet('nutriruta-foods', BASE_FOODS.map(rowToFood));
  // Evita duplicar al migrar
  if(Array.isArray(state.foodsDB) && state.foodsDB.length && typeof state.foodsDB[0][0] !== 'string'){
    // ya son objetos
  }else{
    state.foodsDB = BASE_FOODS.map(rowToFood);
  }
  state.logs = lsGet('nutriruta-logs', []);
  state.profile = lsGet('nutriruta-profile', { calTarget: 2000 });
  state.activeDate = todayStr();
}

function rowToFood(r){
  return { name:r[0], kcal:r[1], sugars:r[2], satfat:r[3], sodium:r[4], fiber:r[5], tags:r[6] };
}

function saveAll(){
  lsSet('nutriruta-foods', state.foodsDB);
  lsSet('nutriruta-logs', state.logs);
  lsSet('nutriruta-profile', state.profile);
}

// UI Inicial
function renderFoodsDatalist(){
  const dl = $('#foods');
  dl.innerHTML = state.foodsDB
    .map(f => `<option value="${f.name}"></option>`)
    .join('');
}

function prefillMacrosByFoodName(name){
  const f = state.foodsDB.find(x => x.name.toLowerCase() === name.toLowerCase());
  if(!f) return;
  // Copia por 100g
  $('#kcal').value = f.kcal;
  $('#sugars').value = f.sugars;
  $('#satfat').value = f.satfat;
  $('#sodium').value = f.sodium;
  $('#fiber').value = f.fiber;
}

function gramsFactor(grams){ return number(grams, 0) / 100; }

function addLog(e){
  e.preventDefault();
  const date = $('#date').value || todayStr();
  const name = $('#food').value.trim();
  const grams = number($('#grams').value, 100);
  const kcal = number($('#kcal').value);
  const sugars = number($('#sugars').value);
  const satfat = number($('#satfat').value);
  const sodium = number($('#sodium').value);
  const fiber = number($('#fiber').value);
  if(!name) return;
  const f = gramsFactor(grams);
  const item = {
    id: crypto.randomUUID(),
    date,
    name,
    grams,
    kcal: +(kcal*f).toFixed(1),
    sugars: +(sugars*f).toFixed(2),
    satfat: +(satfat*f).toFixed(2),
    sodium: Math.round(sodium*f),
    fiber: +(fiber*f).toFixed(2),
    tags: detectTags(name),
  };
  state.logs.push(item);
  saveAll();
  renderLogsForDate(state.activeDate || date);
  $('#foodForm').reset();
  $('#grams').value = 100;
  $('#date').value = state.activeDate;
}

function detectTags(name){
  const f = state.foodsDB.find(x => x.name.toLowerCase() === name.toLowerCase());
  return f?.tags ?? [];
}

function deleteLog(id){
  state.logs = state.logs.filter(x => x.id !== id);
  saveAll();
  renderLogsForDate(state.activeDate);
}

function renderLogsForDate(dateStr){
  state.activeDate = dateStr;
  $('#activeDate').value = dateStr;
  $('#date').value = dateStr;
  const tbody = $('#logTable tbody');
  const rows = state.logs.filter(x => x.date === dateStr);
  tbody.innerHTML = rows.map(r => `
    <tr>
      <td>${r.date}</td>
      <td>${r.name}</td>
      <td>${r.grams}</td>
      <td>${r.kcal}</td>
      <td>${r.sugars}</td>
      <td>${r.satfat}</td>
      <td>${r.sodium}</td>
      <td>${r.fiber}</td>
      <td><button class="btn" data-del="${r.id}">Quitar</button></td>
    </tr>
  `).join('');
  tbody.querySelectorAll('[data-del]').forEach(btn=>{
    btn.addEventListener('click', ()=> deleteLog(btn.getAttribute('data-del')));
  });
  renderDailySummary(dateStr);
  drawWeeklyChart();
  renderChallenges();
}

function sumForDate(dateStr){
  const rows = state.logs.filter(x => x.date === dateStr);
  const tot = rows.reduce((a, r)=>{
    a.kcal += r.kcal;
    a.sugars += r.sugars;
    a.satfat += r.satfat;
    a.sodium += r.sodium;
    a.fiber += r.fiber;
    a.fv += r.tags?.some(t => ['fruta', 'verdura'].includes(t)) ? (r.grams/80) : 0; // porciones de 80g
    return a;
  }, {kcal:0,sugars:0,satfat:0,sodium:0,fiber:0,fv:0});
  return tot;
}

function classify(value, green, red, reverse=false){
  // reverse=true cuando "más es mejor" (ej: fibra)
  if(reverse){
    if(value >= green) return 'green';
    if(value >= WHO.fiberAmber) return 'yellow';
    return 'red';
  }else{
    if(value <= green) return 'green';
    if(value <= red) return 'yellow';
    return 'red';
  }
}

function renderDailySummary(dateStr){
  const s = sumForDate(dateStr);
  $('#sumKcal').textContent = Math.round(s.kcal);
  $('#sumSugar').textContent = `${s.sugars.toFixed(1)} g`;
  $('#sumSat').textContent = `${s.satfat.toFixed(1)} g`;
  $('#sumNa').textContent = `${s.sodium} mg`;
  $('#sumFiber').textContent = `${s.fiber.toFixed(1)} g`;

  $('#sumKcalTarget').textContent = state.profile.calTarget;
  // Semáforos
  setLight('#lightSugar', classify(s.sugars, WHO.sugarGreen, WHO.sugarRed));
  setLight('#lightSat', classify(s.satfat, WHO.satFatGreen, WHO.satFatRed));
  setLight('#lightNa', classify(s.sodium, WHO.sodiumGreen, WHO.sodiumRed));
  setLight('#lightFiber', classify(s.fiber, WHO.fiberGreen, WHO.fiberGreen, true));

  // Recomendaciones
  const recs = [];
  if(s.sugars > WHO.sugarRed) recs.push('Reduce azúcares libres: evita refrescos y dulces.');
  else if(s.sugars > WHO.sugarGreen) recs.push('Mantén azúcares por debajo de 25–50 g/día.');
  if(s.satfat > WHO.satFatRed) recs.push('Baja grasas saturadas: prefiere lácteos bajos en grasa y métodos al horno.');
  if(s.sodium > WHO.sodiumRed) recs.push('Limita sodio: cocina con menos sal, evita procesados.');
  if(s.fiber < WHO.fiberGreen) recs.push('Aumenta fibra: legumbres, avena, frutas y verduras.');
  if(s.fv < 5) recs.push(`Porciones de frutas/verduras: ${Math.round(s.fv*10)/10}/5.`);
  if(s.kcal > state.profile.calTarget*1.1) recs.push('Revisa el tamaño de porciones para alinear las calorías.');
  if(s.kcal < state.profile.calTarget*0.8) recs.push('Podrías estar comiendo poco para tu objetivo calórico.');
  renderRecoms(recs);
}

function setLight(sel, color){
  const el = $(sel);
  el.classList.remove('green','yellow','red');
  el.classList.add(color);
}

function renderRecoms(list){
  const wrap = $('#recoms');
  if(!list.length){ wrap.innerHTML = '<span class="chip">¡Vas bien! Sigue así.</span>'; return; }
  wrap.innerHTML = list.map(t => `<span class="chip">${t}</span>`).join('');
}

// Navegación por días
function shiftDay(delta){
  const d = new Date(state.activeDate);
  d.setDate(d.getDate()+delta);
  renderLogsForDate(d.toISOString().slice(0,10));
}

// Gráfico semanal
let weeklyChart;
function drawWeeklyChart(){
  const labels = [];
  const sugars = [];
  const sodium = [];
  const fiber = [];
  for(let i=6;i>=0;i--){
    const d = new Date(state.activeDate);
    d.setDate(d.getDate()-i);
    const key = d.toISOString().slice(0,10);
    labels.push(key.slice(5));
    const s = sumForDate(key);
    sugars.push(+s.sugars.toFixed(1));
    sodium.push(s.sodium);
    fiber.push(+s.fiber.toFixed(1));
  }
  const data = {
    labels,
    datasets: [
      { type:'bar', label:'Azúcares (g)', data:sugars, backgroundColor:'#ff7a00' },
      { type:'bar', label:'Sodio (mg)', data:sodium, backgroundColor:'#60a5fa' },
      { type:'line', label:'Fibra (g)', data:fiber, borderColor:'#2dbf6c', tension:.3 },
    ]
  };
  const ctx = $('#weeklyChart').getContext('2d');
  if(weeklyChart) weeklyChart.destroy();
  weeklyChart = new Chart(ctx, {
    type:'bar',
    data,
    options:{
      responsive:true,
      scales:{ y:{ beginAtZero:true } },
      plugins:{ legend:{ position:'bottom' } }
    }
  });
}

// Retos saludables
function renderChallenges(){
  const ul = $('#challenges');
  const today = state.activeDate;
  const daySum = sumForDate(today);
  const fvDone = daySum.fv >= 5;
  const sugarOK = daySum.sugars < WHO.sugarGreen;
  const noSoda = !state.logs.some(x => x.date===today && /refresco|gaseosa|soda/i.test(x.name));
  const waterDone = getDailyCounter('water', today) >= 8;
  const walkDone = getDailyCounter('walk', today) >= 1;
  const map = {
    fv5: fvDone,
    water8: waterDone,
    nosoda3: sugarOK && noSoda,
    walk7k: walkDone,
  };
  ul.innerHTML = state.challenges.map(ch => {
    const done = map[ch.id] ? 'done' : '';
    return `<li>
      <span>
        <strong class="${done}">${ch.name}</strong>
        <div class="meta">${ch.target} ${ch.unit}</div>
      </span>
      <button class="btn" data-tog="${ch.id}">${map[ch.id] ? '✓' : 'Marcar'}</button>
    </li>`;
  }).join('');
  ul.querySelectorAll('[data-tog]').forEach(b=>{
    b.addEventListener('click', ()=>{
      // Marca manual (simple)
      b.textContent = '✓';
      b.previousElementSibling.querySelector('strong').classList.add('done');
    });
  });
}

function getDailyCounter(kind, date){
  // espacio para futuras integraciones (agua/pasos)
  return 0;
}

// Export/Import
function exportData(){
  const blob = new Blob([JSON.stringify({
    profile: state.profile,
    logs: state.logs,
    foodsDB: state.foodsDB,
    version: 1
  }, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `nutriruta_${state.activeDate}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importData(file){
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const obj = JSON.parse(reader.result);
      if(obj.logs) state.logs = obj.logs;
      if(obj.foodsDB) state.foodsDB = obj.foodsDB;
      if(obj.profile) state.profile = obj.profile;
      saveAll();
      renderFoodsDatalist();
      renderLogsForDate(state.activeDate);
      alert('Importación exitosa');
    }catch(e){
      alert('Archivo inválido');
    }
  };
  reader.readAsText(file);
}

// Perfil
function saveProfile(){
  state.profile.calTarget = number($('#calTarget').value, 2000);
  saveAll();
  renderDailySummary(state.activeDate);
}

// Eventos
function bindEvents(){
  $('#foodForm').addEventListener('submit', addLog);
  $('#food').addEventListener('change', e => prefillMacrosByFoodName(e.target.value));
  $('#clearForm').addEventListener('click', ()=> $('#foodForm').reset());
  $('#prevDay').addEventListener('click', ()=> shiftDay(-1));
  $('#nextDay').addEventListener('click', ()=> shiftDay(1));
  $('#activeDate').addEventListener('change', e => renderLogsForDate(e.target.value));
  $('#saveProfile').addEventListener('click', saveProfile);
  $('#exportBtn').addEventListener('click', exportData);
  $('#importFile').addEventListener('change', e => importData(e.target.files[0]));
}

function boot(){
  initDB();
  renderFoodsDatalist();
  $('#calTarget').value = state.profile.calTarget;
  $('#sumKcalTarget').textContent = state.profile.calTarget;
  const d = todayStr();
  state.activeDate = d;
  $('#date').value = d;
  $('#activeDate').value = d;
  bindEvents();
  renderLogsForDate(d);
}

document.addEventListener('DOMContentLoaded', boot);

