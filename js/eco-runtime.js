/* LAS DOCE CORONAS · Sistema de Ecos v1 */
(function (w, d) {
  'use strict';
  if (w.LDC_ECOS && w.LDC_ECOS.version) return;
  var registry=Object.create(null), adapter=null, active=false, raf=0, startedAt=0, demo=null;
  var reducedMotion=!!(w.matchMedia&&w.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var ROOT='art/ref/ashvael/';
  var summonSheet=new Image(),portraitAsset=new Image(),idleSheet=new Image(),fxSheet=new Image();
  summonSheet.src=ROOT+'summon.png';portraitAsset.src=ROOT+'retrato-px.png';
  idleSheet.src=ROOT+'idle.png';fxSheet.src=ROOT+'efectos.png';
  var ashvael={
    id:'ashvael',name:'Ashvael',title:'El Ave que Arde Dos Veces',kind:'eco_principal',
    description:'Ave inmensa de plumas de brasa.',
    elements:{strength:['fuego'],resistance:['fuego','quemadura'],weakness:['agua','hielo']},
    summonCost:{impetusSegments:3,mp:20,usesPerBattle:1},
    forms:[{id:'brasa',name:'Ave de Brasa'},{id:'renacimiento',name:'Ave del Renacimiento'}],
    abilities:[
      {id:'llama_eterna',name:'Llama Eterna',type:'fire_aoe',target:'all_enemies',power:1.35,burnChance:.25,burnTurns:2,description:'Una oleada de fuego alcanza a todos los enemigos.'},
      {id:'renacer_igneo',name:'Renacer Ígneo',type:'party_heal_revive',target:'all_allies',healRatio:.22,reviveRatio:.18,maxRevives:1,description:'Restaura al grupo y puede devolver un aliado caído.'},
      {id:'plumas_crepusculares',name:'Plumas Crepusculares',type:'multi_hit_fire',target:'all_enemies',hits:3,powerPerHit:.52,speedDown:.15,duration:2,description:'Tres oleadas de plumas incandescentes ralentizan al enemigo.'},
      {id:'fenix_eterno',name:'Fénix Eterno',type:'two_phase_ultimate',target:'all_enemies_and_all_allies',enemyPower:2.2,healRatio:.38,reviveRatio:.35,maxRevives:1,description:'La primera combustión arrasa; la segunda devuelve la vida.'}
    ],
    assets:{
      portrait:ROOT+'retrato-px.png',icon:ROOT+'icono.png',
      idle:{src:ROOT+'idle.png',frameWidth:64,frameHeight:64,columns:3,rows:2,frames:6,fps:6},
      summon:{src:ROOT+'summon.png',frameWidth:64,frameHeight:64,columns:4,rows:2,frames:8,fps:10},
      effects:{src:ROOT+'efectos.png',frameWidth:32,frameHeight:32,columns:3,rows:2,frames:6,fps:12}
    }
  };
  registry.ashvael=ashvael;
  function el(tag,cls,txt){var n=d.createElement(tag);if(cls)n.className=cls;if(txt!=null)n.textContent=txt;return n;}
  function drawPhoenix(ctx,frame,white,scale){
    var c=ctx,lift=[0,1,0,-1,0,1,0,-1][frame%8];
    var p=white?{o:'#23191b',s:'#594039',a:'#d8c7a0',b:'#fff0c5',c:'#fff9e9',d:'#f49a39'}:{o:'#231318',s:'#421c22',a:'#762526',b:'#b83224',c:'#e45b27',d:'#f49a39'};
    c.save();c.scale(scale,scale);c.translate(0,lift);
    function poly(q,col){c.fillStyle=col;c.beginPath();c.moveTo(q[0][0],q[0][1]);for(var i=1;i<q.length;i++)c.lineTo(q[i][0],q[i][1]);c.closePath();c.fill();}
    function rect(x,y,w,h,col){c.fillStyle=col;c.fillRect(x,y,w,h);}
    poly([[27,38],[31,45],[28,57],[24,49]],p.d);poly([[31,38],[35,47],[35,59],[30,49]],p.c);poly([[35,37],[39,45],[42,55],[36,49]],p.d);
    poly([[22,25],[31,20],[39,25],[39,37],[32,44],[23,38]],p.s);poly([[27,25],[34,24],[36,33],[30,39],[25,34]],p.b);
    poly([[32,26],[37,16],[43,11],[47,14],[42,25],[36,31]],p.s);rect(40,10,7,7,p.c);poly([[45,13],[57,16],[46,20]],p.d);rect(43,12,2,2,p.c);
    poly([[39,11],[36,4],[42,8],[44,1],[46,9],[51,5],[48,14]],p.d);
    var wings=[
      [[26,26],[17,19],[8,21],[13,28],[5,32],[17,35],[12,41],[27,37]],
      [[26,26],[18,13],[9,8],[12,20],[4,18],[14,30],[8,37],[27,38]],
      [[26,25],[18,8],[10,3],[13,17],[4,12],[15,29],[9,35],[27,38]],
      [[26,27],[14,18],[3,20],[12,29],[4,35],[18,37],[27,39]],
      [[26,29],[16,35],[8,43],[19,41],[15,51],[29,41]],
      [[26,26],[18,12],[9,10],[12,22],[4,19],[14,31],[7,37],[27,39]],
      [[26,24],[18,6],[10,2],[13,16],[4,11],[15,29],[9,34],[27,38]],
      [[25,28],[16,19],[5,21],[13,29],[5,35],[18,38],[27,39]]
    ];
    var wing=wings[frame%8];poly(wing,p.a);
    for(var j=0;j<3;j++)poly([[wing[0][0]-j*4,wing[0][1]+j*4],[wing[0][0]-5-j*3,wing[0][1]-5+j*4],[wing[0][0]-4-j*3,wing[0][1]+3+j*4]],p.b);
    rect(28,41,3,3,p.o);rect(35,40,3,3,p.o);rect(27,44,4,2,p.d);rect(35,43,4,2,p.d);
    [[7,48],[14,54],[49,33],[54,43],[4,43]].forEach(function(q,i){if((i+frame)%2===0)rect(q[0],q[1],2,2,white?p.c:'#ffc65b');});
    c.restore();
  }
  function makeCanvas(w,h){var cv=el('canvas');cv.width=w;cv.height=h;cv.style.imageRendering='pixelated';return cv;}
  function drawPortrait(cv){var c=cv.getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,192,192);if(portraitAsset.complete&&portraitAsset.naturalWidth){c.drawImage(portraitAsset,0,0,192,192);return;}c.fillStyle='#1a1017';c.fillRect(0,0,192,192);for(var i=0;i<9;i++){c.fillStyle=i%2?'#762526':'#b83224';c.beginPath();c.moveTo(18+i*18,174);c.lineTo(8+i*18,96);c.lineTo(20+i*18,38);c.lineTo(30+i*18,105);c.closePath();c.fill();}c.save();c.scale(3,3);drawPhoenix(c,2,false,1);c.restore();}
  function mount(){
    if(d.getElementById('ldcEcoBtn'))return;
    var top=d.querySelector('.topbar');if(!top)return;
    var tools=top.querySelector('.tools');if(!tools)return;
    var btn=el('button','iconbtn','Ecos');btn.id='ldcEcoBtn';btn.type='button';btn.setAttribute('aria-haspopup','dialog');tools.appendChild(btn);
    var style=el('style');
    style.textContent='#ldcEcoLab{position:fixed;inset:0;z-index:2147482000;background:rgba(5,8,15,.88);display:none;align-items:center;justify-content:center;padding:12px;font-family:var(--f-body,Georgia,serif);color:#eef2fa}#ldcEcoLab.on{display:flex}#ldcEcoLab .eco-box{width:min(900px,100%);max-height:94vh;overflow:auto;background:linear-gradient(180deg,#172139,#0b101d);border:2px solid #c9d6ee;border-radius:8px;box-shadow:0 18px 70px #000;padding:14px}#ldcEcoLab .eco-head{display:flex;justify-content:space-between;align-items:center;gap:12px;border-bottom:1px solid #78613b;padding-bottom:10px}#ldcEcoLab h2{font-family:var(--f-display,Georgia,serif);font-weight:400;color:#ffd77a;margin:0;font-size:24px}#ldcEcoLab .eco-sub{color:#c8b995;font-size:13px}#ldcEcoLab .eco-grid{display:grid;grid-template-columns:minmax(160px,240px) 1fr;gap:14px;margin-top:14px}#ldcEcoLab .eco-portrait{display:grid;place-items:center;background:radial-gradient(ellipse,#4a2a27,#111725 72%);border:1px solid #725c39;border-radius:5px;min-height:220px}#ldcEcoLab .eco-portrait canvas{width:192px;height:192px;image-rendering:pixelated;max-width:100%}#ldcEcoLab .eco-stage{background:#101725;border:1px solid #53627d;border-radius:5px;display:grid;place-items:center;min-height:220px;overflow:hidden}#ldcEcoLab .eco-stage canvas{width:min(100%,480px);height:auto;image-rendering:pixelated;max-height:300px}#ldcEcoLab .eco-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px}#ldcEcoLab button{font:inherit;cursor:pointer}#ldcEcoLab .eco-btn{background:linear-gradient(#263858,#111c31);color:#f3e6c7;border:1px solid #8c7957;border-radius:4px;padding:9px;text-align:left}#ldcEcoLab .eco-btn:hover{border-color:#ffd77a}#ldcEcoLab .eco-btn small{display:block;color:#b7c2d8;font-size:12px;margin-top:3px}#ldcEcoLab .eco-log{margin-top:12px;padding:10px;background:#080d17;border:1px solid #35425a;border-radius:4px;min-height:76px;color:#d8dfed;font-size:13px;white-space:pre-line}#ldcEcoLab .eco-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:10px;color:#aebbd0;font-size:12px}#ldcEcoLab .eco-close{background:#34202a;color:#f5d7c5;border:1px solid #986b62;border-radius:4px;padding:7px 12px}#ldcEcoLab .eco-status{color:#ffd77a}@media(max-width:600px){#ldcEcoLab .eco-grid{grid-template-columns:1fr}#ldcEcoLab .eco-portrait{min-height:150px}#ldcEcoLab .eco-portrait canvas{width:144px;height:144px}#ldcEcoLab .eco-actions{grid-template-columns:1fr}}';
    d.head.appendChild(style);
    var modal=el('div');modal.id='ldcEcoLab';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','ldcEcoTitle');
    var box=el('div','eco-box'),head=el('div','eco-head'),hg=el('div'),title=el('h2','', 'ASHVAEL');title.id='ldcEcoTitle';hg.appendChild(title);hg.appendChild(el('div','eco-sub','El Ave que Arde Dos Veces · Eco principal'));
    var close=el('button','eco-close','Cerrar');close.type='button';head.appendChild(hg);head.appendChild(close);box.appendChild(head);
    var grid=el('div','eco-grid'),pb=el('div','eco-portrait'),portrait=makeCanvas(192,192);portrait.id='ldcEcoPortrait';drawPortrait(portrait);pb.appendChild(portrait);
    var right=el('div'),stage=el('div','eco-stage'),stageCanvas=makeCanvas(480,240);stageCanvas.id='ldcEcoCanvas';stage.appendChild(stageCanvas);right.appendChild(stage);
    var status=el('div','eco-foot');status.appendChild(el('span','eco-status','Laboratorio de invocación · modo aislado'));status.appendChild(el('span','','3 Ímpetu · 20 PM (provisional)'));right.appendChild(status);grid.appendChild(pb);grid.appendChild(right);box.appendChild(grid);
    var actions=el('div','eco-actions');
    ashvael.abilities.forEach(function(a){var b=el('button','eco-btn');b.type='button';b.dataset.ability=a.id;b.appendChild(d.createTextNode(a.name));b.appendChild(el('small','',a.description));b.addEventListener('click',function(){play(a.id);});actions.appendChild(b);});
    box.appendChild(actions);
    var log=el('div','eco-log','Ashvael espera la llamada. Elegí una habilidad para probar la secuencia visual y el simulador.');log.id='ldcEcoLog';box.appendChild(log);
    var foot=el('div','eco-foot');foot.appendChild(el('span','','Prototipo: no modifica una partida guardada.'));var summonBtn=el('button','eco-btn','Invocar a Ashvael');summonBtn.type='button';summonBtn.addEventListener('click',summon);foot.appendChild(summonBtn);box.appendChild(foot);
    modal.appendChild(box);d.body.appendChild(modal);
    function open(){modal.classList.add('on');active=true;startedAt=0;drawLoop();close.focus();}
    function shut(){modal.classList.remove('on');active=false;if(raf)cancelAnimationFrame(raf);btn.focus();}
    btn.addEventListener('click',open);close.addEventListener('click',shut);modal.addEventListener('click',function(e){if(e.target===modal)shut();});
    d.addEventListener('keydown',function(e){if(e.key==='Escape'&&active)shut();});
    modal._open=open;modal._close=shut;
  }
  function drawLoop(ts){
    if(!active)return;var cv=d.getElementById('ldcEcoCanvas'),c=cv.getContext('2d');if(!startedAt)startedAt=ts||0;
    var t=reducedMotion?0:Math.floor(((ts||0)-startedAt)/140);c.clearRect(0,0,cv.width,cv.height);c.fillStyle='#111a28';c.fillRect(0,0,cv.width,cv.height);
    for(var y=0;y<cv.height;y+=24){c.fillStyle='rgba(255,190,80,.035)';c.fillRect(0,y,cv.width,1);}
    var cx=240,cy=142,pulse=1+Math.sin((t%32)/32*Math.PI*2)*.035;c.save();c.translate(cx,cy);c.scale(pulse,pulse);c.strokeStyle='rgba(255,184,83,.48)';c.lineWidth=2;c.beginPath();c.ellipse(0,64,105,17,0,0,Math.PI*2);c.stroke();c.strokeStyle='rgba(255,226,164,.24)';c.beginPath();c.ellipse(0,64,78,12,0,0,Math.PI*2);c.stroke();c.restore();
    for(var i=0;i<18;i++){var a=i*2.399+t*.045,rr=44+(i%5)*15,x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr;c.fillStyle=i%3?'#e45b27':'#ffc65b';c.fillRect(Math.round(x),Math.round(y),2+(i%2),2+(i%2));}
    var frame=(t%48<34)?Math.floor(t/2)%4:4+Math.floor(t/3)%4;c.imageSmoothingEnabled=false;if(summonSheet.complete&&summonSheet.naturalWidth>=256&&summonSheet.naturalHeight>=128){var sx=(frame%4)*64,sy=Math.floor(frame/4)*64;c.drawImage(summonSheet,sx,sy,64,64,cx-112,cy-112,224,224);}else{c.save();c.translate(cx-112,cy-112);c.scale(3.5,3.5);drawPhoenix(c,frame,frame>=6,1);c.restore();}
    if(!reducedMotion)raf=requestAnimationFrame(drawLoop);
  }
  function writeLog(msg){var n=d.getElementById('ldcEcoLog');if(n)n.textContent=msg;}
  function summon(){
    if(adapter&&typeof adapter.summon==='function')return Promise.resolve(adapter.summon(ashvael)).then(function(r){writeLog('Ashvael ha sido invocado en el combate.');return r;});
    writeLog('¡ASHVAEL, EL AVE QUE ARDE DOS VECES!\nEl círculo se enciende. Las plumas de brasa descienden sobre el campo.\nModo laboratorio: la invocación es visual; no consume recursos de la partida.');
    return {preview:true,eco:'ashvael'};
  }
  function demoState(){if(!demo)demo={enemies:[{name:'Guardián de prueba',hp:120,maxHp:120,burn:0,slow:0}],allies:[{name:'Ilian',hp:72,maxHp:100,alive:true},{name:'Maela',hp:0,maxHp:110,alive:false},{name:'Simona',hp:45,maxHp:90,alive:true}]};return demo;}
  function play(id){
    var a=ashvael.abilities.find(function(x){return x.id===id;});if(!a)return;
    if(adapter&&typeof adapter.useEcoAbility==='function')return Promise.resolve(adapter.useEcoAbility(ashvael,a)).then(function(r){writeLog(a.name+' ejecutada en el combate.');return r;});
    var s=demoState(),lines=[a.name+' · prueba de combate'];
    if(a.type==='fire_aoe'){s.enemies.forEach(function(e){var dmg=Math.round(32*a.power);e.hp=Math.max(0,e.hp-dmg);if(Math.random()<a.burnChance)e.burn=a.burnTurns;lines.push(e.name+': '+dmg+' de daño de fuego'+(e.burn?' · Quemadura':'')+'.');});}
    else if(a.type==='multi_hit_fire'){s.enemies.forEach(function(e){var total=0;for(var i=0;i<a.hits;i++){var dmg=Math.round(32*a.powerPerHit);total+=dmg;e.hp=Math.max(0,e.hp-dmg);}e.slow=a.duration;lines.push(e.name+': '+total+' de daño en '+a.hits+' impactos · Velocidad reducida.');});}
    else{var revived=0;s.allies.forEach(function(p){if(!p.alive&&revived<a.maxRevives){p.alive=true;p.hp=Math.round(p.maxHp*a.reviveRatio);revived++;lines.push(p.name+' vuelve con '+p.hp+' PV.');}else if(p.alive){var heal=Math.round(p.maxHp*a.healRatio);p.hp=Math.min(p.maxHp,p.hp+heal);lines.push(p.name+': +'+heal+' PV.');}});if(a.type==='two_phase_ultimate')lines.unshift('PRIMERA COMBUSTIÓN: una llamarada cubre a los enemigos.','SEGUNDA COMBUSTIÓN: el plumaje se vuelve blanco y dorado.');}
    writeLog(lines.join('\n')+'\n\nSimulación aislada: valores ilustrativos, no conectados a la partida.');return {preview:true,ability:a,state:s};
  }
  var api={
    version:1,
    register:function(def){if(!def||!def.id)throw new Error('Eco necesita un id estable.');registry[def.id]=def;return def;},
    get:function(id){return registry[id]||null;},
    list:function(){return Object.keys(registry).map(function(k){return registry[k];});},
    attachBattle:function(a){if(!a||typeof a!=='object')throw new Error('Se esperaba un adaptador de combate.');adapter=a;return true;},
    detachBattle:function(){adapter=null;},
    summon:function(id){var eco=registry[id];if(!eco)return Promise.reject(new Error('Eco desconocido: '+id));if(id==='ashvael')return summon();return adapter&&typeof adapter.summon==='function'?adapter.summon(eco):{preview:true,eco:id};},
    useAbility:function(id,abilityId){var eco=registry[id];if(!eco)return Promise.reject(new Error('Eco desconocido: '+id));var ability=(eco.abilities||[]).find(function(a){return a.id===abilityId;});if(!ability)return Promise.reject(new Error('Habilidad desconocida: '+abilityId));if(adapter&&typeof adapter.useEcoAbility==='function')return adapter.useEcoAbility(eco,ability);if(id==='ashvael')return play(abilityId);return {preview:true,eco:id,ability:abilityId};},
    preview:function(){var m=d.getElementById('ldcEcoLab');if(m&&m._open)m._open();},
    closePreview:function(){var m=d.getElementById('ldcEcoLab');if(m&&m._close)m._close();},
    _render:drawPhoenix
  };
  w.LDC_ECOS=api;api.register(ashvael);
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',mount);else mount();
})(window,document);
