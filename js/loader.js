/* ============================================================
   LAS DOCE CORONAS · cargador (v23, proyecto multiarchivo)
   Corre después de js/game.js (que solo DEFINE window.LDC_GAME: lista de imágenes y "etapas").
   1) Muestra una pantalla de carga y baja todas las imágenes por ruta relativa
      (art/ref/… = arte de Brian que pide ref-art.js; art/atlas/… = atlas horneado + index.json),
      de a varias a la vez, con reintentos.
   2) Arte crítico de art/ref (v27, móvil): ya NO se convierte a data: URI; se baja con un <img> por su ruta (como el arte
      diferido desde v26), queda en window.LDC_PRE y LDC_ASSET(ruta) devuelve la ruta (sin cadenas base64 vivas toda la partida).
      Atlas: el mismo data: URI que v22 (bytes y tipo idénticos) en window.LDC_BAKED; no cambia porque bake-runtime.js entra
      en la huella del atlas horneado (tocarlo obliga a rehornear).
   3) Saca la pantalla de carga y corre las etapas en orden (cada una equivale a un <script> de v22).
   Si algo no baja: mensaje con el archivo y botón «Reintentar» (solo reintenta lo que faltó).
   ============================================================ */
(function(){
  'use strict';
  var G=window.LDC_GAME;
  var CONC=4, TRIES=3, TIMEOUT=90000;
  var URLS=Object.create(null), atlasIdx=null;

  // ---------- pantalla de carga (estilos propios en línea: no toca el CSS del juego) ----------
  var box=document.createElement('div'); box.id='ldcLoad'; box.setAttribute('role','status'); box.setAttribute('aria-live','polite');
  box.style.cssText='position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:radial-gradient(ellipse at 50% 0%,#151a28 0%,#0a0c12 70%);color:#eef2fa;font-family:"Marcellus SC",Georgia,serif;text-align:center;padding:16px';
  box.innerHTML='<div style="font-size:clamp(22px,5vw,34px);color:#d8b25a;letter-spacing:.06em">Las Doce Coronas</div>'+
    '<div style="width:min(320px,80vw);height:8px;border:1px solid #d8b25a;border-radius:6px;overflow:hidden;background:#0c1222"><div id="ldcBar" style="height:100%;width:0;background:linear-gradient(90deg,#9a7a32,#ffd77a);transition:width .15s"></div></div>'+
    '<div id="ldcMsg" style="font-family:Alegreya,Georgia,serif;font-size:15px;color:#a9b3c8">Preparando el arte…</div>'+
    '<div id="ldcErr" style="display:none;max-width:min(520px,92vw);font-family:Alegreya,Georgia,serif;font-size:14px;color:#f0c8c8"></div>'+
    '<button id="ldcRetry" type="button" style="display:none;font:inherit;font-size:15px;padding:8px 18px;border-radius:6px;border:1px solid #d8b25a;background:#1c2438;color:#ffd77a;cursor:pointer">Reintentar</button>';
  (document.body||document.documentElement).appendChild(box);
  var $=function(id){ return document.getElementById(id); };
  function fail(msg){ $('ldcErr').style.display='block'; $('ldcErr').textContent=msg; $('ldcRetry').style.display='inline-block'; $('ldcMsg').textContent='No se pudo terminar de cargar.'; }

  if(!G||!G.stages){ fail('Falta js/game.js (o no se pudo leer). Si estás probando en tu equipo, abrí el juego con el servidor: node tools/serve.js'); $('ldcRetry').onclick=function(){ location.reload(); }; return; }

  // ---------- bajada ----------
  // v26-fix M1: el arte diferido (lazy) no se baja acá: LDC_ASSET devuelve su ruta y el navegador la pide cuando el juego la usa
  // (preloadArt la precarga de fondo después del título). Lo crítico se espera acá (por <img>, ver arriba) y el atlas (data: URI).
  var PRE=window.LDC_PRE=Object.create(null), CRIT=window.LDC_CRIT=Object.create(null), ATL=Object.create(null);
  (G.atlasFiles||[]).forEach(function(a){ ATL[a.p]=1; });
  var LAZY=Object.create(null); (G.assets||[]).forEach(function(a){ if(a.lazy) LAZY[a.p]=1; });
  var list=(G.assets||[]).filter(function(a){ return !a.lazy; }).concat(G.atlasFiles||[]);
  var total=1, done=0; list.forEach(function(a){ total+=a.n||1; });
  function prog(){ var p=Math.min(100,Math.round(done*100/total)); $('ldcBar').style.width=p+'%'; $('ldcMsg').textContent='Cargando arte… '+p+' %'; }
  function get(url,kind){ // kind: 'buf' | 'json'
    var ctl=typeof AbortController==='function'?new AbortController():null, t=ctl?setTimeout(function(){ ctl.abort(); },TIMEOUT):0;
    return fetch(url,ctl?{signal:ctl.signal}:undefined).then(function(r){ clearTimeout(t); if(!r.ok) throw new Error('HTTP '+r.status); return kind==='json'?r.json():r.arrayBuffer(); },function(e){ clearTimeout(t); throw e; }); }
  function retry(fn,n){ return fn().catch(function(e){ if(n<=1) throw e; return new Promise(function(res){ setTimeout(res,600*(TRIES-n+1)); }).then(function(){ return retry(fn,n-1); }); }); }
  function toDataUri(buf,type){ return new Promise(function(res,rej){ var fr=new FileReader(); fr.onload=function(){ res(fr.result); }; fr.onerror=function(){ rej(fr.error||new Error('FileReader')); }; fr.readAsDataURL(new Blob([buf],{type:type})); }); }
  // <img> por ruta (con tiempo límite); en el reintento agrega ?r=N para no quedar pegado a un error en caché
  function img(p,k){ return new Promise(function(res,rej){ var im=new Image(), t=setTimeout(function(){ im.onload=im.onerror=null; var e=new Error('tiempo agotado'); e.name='AbortError'; rej(e); },TIMEOUT);
    im.onload=function(){ clearTimeout(t); if(im.naturalWidth) res(im); else rej(new Error('imagen vacía')); }; im.onerror=function(){ clearTimeout(t); rej(new Error('no se pudo leer')); };
    im.src=k>1?p+(p.indexOf('?')<0?'?':'&')+'r='+k:p; }); }
  function one(a){ if(URLS[a.p]!=null) return Promise.resolve(); var k=0;
    var job=ATL[a.p]?retry(function(){ return get(a.p,'buf'); },TRIES).then(function(buf){ return toDataUri(buf,a.t); })
                    :retry(function(){ return img(a.p,++k); },TRIES).then(function(im){ PRE[a.p]=im; CRIT[a.p]=1; return a.p; });
    return job.then(function(u){ URLS[a.p]=u; done+=a.n||1; prog(); },
      function(e){ throw new Error(a.p+' ('+(e&&e.name==='AbortError'?'tiempo agotado':(e&&e.message)||e)+')'); }); }
  function pool(items){ var i=0, errs=[]; return new Promise(function(res){ var live=0;
    (function pump(){ if(i>=items.length&&!live){ res(errs); return; }
      while(live<CONC&&i<items.length){ live++; one(items[i++]).catch(function(e){ errs.push(e.message); }).then(function(){ live--; pump(); }); } })(); }); }

  function run(){ $('ldcErr').style.display='none'; $('ldcRetry').style.display='none'; prog();
    var idx=(G.atlas&&!atlasIdx)?retry(function(){ return get(G.atlas,'json'); },TRIES).then(function(j){ atlasIdx=j; done+=1; prog(); return []; },function(e){ return [G.atlas+' ('+(e.message||e)+')']; }):Promise.resolve([]);
    if(!G.atlas) done+=1;
    Promise.all([idx,pool(list)]).then(function(r){ var errs=r[0].concat(r[1]);
      if(errs.length){ var fileProto=location.protocol==='file:';
        fail((fileProto?'El juego no puede leer sus archivos abierto como archivo local: hay que servirlo (node tools/serve.js). ':'')+'Faltan '+errs.length+' archivo(s): '+errs.slice(0,4).join(' · ')+(errs.length>4?' …':''));
        $('ldcRetry').onclick=run; return; }
      boot(); }); }

  // ---------- arranque ----------
  function boot(){
    window.LDC_ASSET=function(p){ var u=URLS[p]; if(u==null){ if(LAZY[p]) return p; throw new Error('LDC_ASSET: imagen no cargada: '+p); } return u; };
    if(atlasIdx){ var dir=G.atlas.slice(0,G.atlas.lastIndexOf('/')+1);
      window.LDC_BAKED={v:atlasIdx.v,made:atlasIdx.made,sheets:atlasIdx.sheets.map(function(f){ return URLS[dir+f]; }),groups:atlasIdx.groups,m:atlasIdx.m};
      atlasIdx.sheets.forEach(function(f){ delete URLS[dir+f]; }); atlasIdx=null; } // una sola copia de cada cadena (la de LDC_BAKED)
    box.parentNode&&box.parentNode.removeChild(box);
    // cada etapa como un <script> aparte de v22: un error en una no frena a la siguiente y queda reportado como error sin atrapar
    G.stages.forEach(function(st){ try{ st(); }catch(e){ if(typeof window.reportError==='function') window.reportError(e); else setTimeout(function(){ throw e; }); } });
    G.stages.length=0; }

  run();
})();
