// js/main.js
// SpriteForge v1 — 32x32 demo with embedded assets via config/manifest.json
(async function(){
  const canvas = document.getElementById('sprite-canvas');
  const ctx = canvas.getContext('2d');
  const layerList = document.getElementById('layer-list');
  const assetList = document.getElementById('asset-list');
  const previewGrid = document.getElementById('preview-grid');
  const classSelect = document.getElementById('class-select');
  const genderSelect = document.getElementById('gender-select');
  const btnApply = document.getElementById('btn-apply');
  const btnExport = document.getElementById('btn-export');
  const colsInput = document.getElementById('cols');
  const scaleInput = document.getElementById('scale');

  // default layer order (topmost last)
  const LAYERS = ["base","hair","clothes","weapon","shield","accessory","outline","shadow"];

  // state
  let manifest = null;
  let layerState = {}; // id -> {url, img, visible}
  let cols = parseInt(colsInput.value,10) || 4;
  let scale = parseInt(scaleInput.value,10) || 6;

  // load manifest
  async function loadManifest(){
    try {
      const res = await fetch('config/manifest.json', {cache:'no-store'});
      if(!res.ok) throw new Error('no manifest');
      manifest = await res.json();
    } catch(e){
      // fallback to embedded manifest shipped with this package
      manifest = await fetch('config/manifest.json').then(r=>r.json()).catch(()=>null);
    }
    if(!manifest){
      alert("Could not load manifest. Make sure config/manifest.json exists.");
      return;
    }
    buildInitialLayerState();
    renderUI();
  }

  function buildInitialLayerState(){
    for(const id of LAYERS){
      const list = manifest[id] || [];
      layerState[id] = { url: list[0] || null, img: null, visible: true, options: list };
      if(layerState[id].url){
        const img = new Image();
        img.src = layerState[id].url;
        img.onload = ()=> { layerState[id].img = img; renderCanvas(); renderPreviewGrid(); };
      }
    }
  }

  function renderUI(){
    // layers
    layerList.innerHTML = '';
    for(const id of LAYERS){
      const row = document.createElement('div'); row.className='layer';
      const thumb = document.createElement('img');
      thumb.src = layerState[id].url || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"></svg>';
      const lbl = document.createElement('div'); lbl.textContent = id;
      const sel = document.createElement('select');
      (layerState[id].options||[]).forEach((opt, idx)=>{
        const o = document.createElement('option'); o.value = opt; o.textContent = opt.split('/').pop();
        if(opt === layerState[id].url) o.selected = true;
        sel.appendChild(o);
      });
      sel.addEventListener('change', ()=>{ layerState[id].url = sel.value; const img=new Image(); img.src=sel.value; img.onload=()=>{layerState[id].img=img; renderCanvas(); renderPreviewGrid();}; });
      const vis = document.createElement('input'); vis.type='checkbox'; vis.checked = layerState[id].visible;
      vis.addEventListener('change', ()=>{ layerState[id].visible = vis.checked; renderCanvas(); renderPreviewGrid(); });
      row.appendChild(thumb); row.appendChild(lbl); row.appendChild(sel); row.appendChild(vis);
      layerList.appendChild(row);
    }

    // assets list: show one folder per layer
    assetList.innerHTML = '';
    for(const id of LAYERS){
      const hdr = document.createElement('div'); hdr.style.fontWeight='700'; hdr.textContent = id;
      assetList.appendChild(hdr);
      const list = manifest[id]||[];
      list.forEach(url=>{
        const row = document.createElement('div'); row.className='asset';
        const im = document.createElement('img'); im.src = url;
        const name = document.createElement('div'); name.textContent = url.split('/').pop();
        const btn = document.createElement('button'); btn.textContent = 'Assign';
        btn.addEventListener('click', ()=>{ layerState[id].url = url; const img=new Image(); img.src=url; img.onload=()=>{layerState[id].img=img; renderCanvas(); renderPreviewGrid();}; });
        row.appendChild(im); row.appendChild(name); row.appendChild(btn);
        assetList.appendChild(row);
      });
    }
  }

  function clearCanvas(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // black bg for demonstration
    ctx.fillStyle = "#000";
    ctx.fillRect(0,0,canvas.width,canvas.height);
  }

  function renderCanvas(){
    clearCanvas();
    // draw layers in order; base first
    for(const id of LAYERS){
      const s = layerState[id];
      if(!s || !s.visible || !s.img) continue;
      ctx.drawImage(s.img, 0, 0, 32, 32);
    }
  }

  function renderPreviewGrid(){
    previewGrid.innerHTML = '';
    cols = parseInt(colsInput.value,10)||4;
    scale = parseInt(scaleInput.value,10)||6;
    const thumbW = 32*scale;
    const rows = Math.ceil( (cols) / cols );
    // simple single-row of cols frames (we'll repeat small variations if present)
    for(let i=0;i<cols;i++){
      const c = document.createElement('canvas');
      c.width = 32; c.height = 32;
      c.style.width = thumbW+'px';
      c.style.height = (32*scale)+'px';
      c.style.imageRendering = 'pixelated';
      const cc = c.getContext('2d');
      cc.fillStyle = "#000"; cc.fillRect(0,0,32,32);
      for(const id of LAYERS){
        const s = layerState[id];
        if(!s || !s.visible || !s.img) continue;
        cc.drawImage(s.img, 0, 0, 32, 32);
      }
      previewGrid.appendChild(c);
    }
  }

  // apply preset (class + gender)
  function applyPreset(cls, gender){
    // manifest contains presets mapping under "presets"
    const mapping = (manifest.presets && manifest.presets[cls]) || null;
    if(!mapping){
      console.warn("No preset mapping for",cls);
      return;
    }
    const key = mapping[gender];
    if(!manifest.presets_map || !manifest.presets_map[key]) return;
    const preset = manifest.presets_map[key];
    // preset is { layers: { base:index, hair:index, ... } }
    for(const [lid, idx] of Object.entries(preset.layers || {})){
      const list = manifest[lid] || [];
      const url = list[idx] || list[0] || null;
      if(url){
        layerState[lid].url = url;
        const img = new Image(); img.src = url; img.onload=()=>{layerState[lid].img=img; renderCanvas(); renderPreviewGrid();}
      }
    }
  }

  btnApply.addEventListener('click', ()=>{ applyPreset(classSelect.value, genderSelect.value); });

  btnExport.addEventListener('click', ()=>{ exportSpriteSheet(); });

  colsInput.addEventListener('change', ()=>{ renderPreviewGrid(); });
  scaleInput.addEventListener('change', ()=>{ renderPreviewGrid(); });

  function exportSpriteSheet(){
    // build a sheet with cols columns and 1 row for now (expandable)
    const ccols = parseInt(colsInput.value,10) || 4;
    const sheet = document.createElement('canvas');
    sheet.width = 32 * ccols;
    sheet.height = 32;
    const sctx = sheet.getContext('2d');
    for(let i=0;i<ccols;i++){
      // draw same sprite repeated (you can extend to variations)
      for(const id of LAYERS){
        const s = layerState[id];
        if(!s || !s.visible || !s.img) continue;
        sctx.drawImage(s.img, i*32, 0, 32, 32);
      }
    }
    // trigger download
    sheet.toBlob(function(blob){
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download='sprite_sheet.png'; document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  // initial load
  await loadManifest();
  renderCanvas();
  renderPreviewGrid();

})();