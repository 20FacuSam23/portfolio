/* Estudio cinematográfico aislado. No cambia ni envía datos del portfolio. */
(() => {
  'use strict';
  if (!document.documentElement.classList.contains('reel-lab')) return;
  const root = document.documentElement;
  const hero = document.querySelector('.hero');
  const main = document.querySelector('main');
  if (!hero || !main) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const isMoving = () => !reduce.matches && root.dataset.motion !== 'off';
  const html = (tag, className, value) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value != null) node.textContent = value;
    return node;
  };
  // Cursors holográficos: responden al mouse, clic o toque sin bloquear la página.
  const overlay = html('div','lab-overlay');
  overlay.setAttribute('aria-hidden','true');
  overlay.innerHTML = '<div class="lab-rail lab-rail--left"></div><div class="lab-rail lab-rail--right"></div>'+
    '<span class="lab-crosshair lab-crosshair--a"></span><span class="lab-crosshair lab-crosshair--b"></span>'+
    '<span class="lab-hud">INTERFACE / STRUCTURE / MOTION / 2026</span><div class="lab-cursor-field"></div>';
  document.body.appendChild(overlay);
  const field = overlay.querySelector('.lab-cursor-field');
  const colors = ['#44ccff','#feaf75','#a79bff','#54e6dc','#eb80cd','#97fff6'];
  const swarm = [];
  const focus = html('span','lab-cursor-focus');
  focus.setAttribute('aria-hidden','true');
  // Todo está en una capa de solo visualización; no se registra ni envía la posición.
  const total = matchMedia('(max-width:760px)').matches ? 9 : 16;
  for (let i=0; i<total; i++) {
    const node=html('span','lab-cursor');
    node.style.setProperty('--lab-col',colors[i%colors.length]);
    node.style.setProperty('--lab-rot',((i*47)%140-40)+'deg');
    field.appendChild(node);
    swarm.push({node,x:0,y:0,angle:i*2.3999632297});
  }
  field.appendChild(focus);
  let aimX=innerWidth/2, aimY=innerHeight/2;
  let frame=0, tracking=false, pressing=false, touching=false, fingerDown=false;
  let lastInput=0;

  function stopSwarm() {
    tracking=false;
    pressing=false;
    fingerDown=false;
    field.classList.remove('is-tracking','is-pressed');
    if(frame) cancelAnimationFrame(frame);
    frame=0;
  }
  function startSwarm(x,y,kind,down) {
    if(!isMoving()) return;
    aimX=x;aimY=y;
    touching=kind==='touch';
    pressing=!!down;
    lastInput=performance.now();
    if(!tracking) {
      tracking=true;
      // Aparecen alrededor y se acercan al punto de contacto.
      const reach=Math.min(280, Math.min(innerWidth,innerHeight)*.40);
      swarm.forEach((p,i)=>{
        const angle=p.angle;
        const radius=reach*(.53+(i%5)*.16);
        p.x=aimX+Math.cos(angle)*radius;
        p.y=aimY+Math.sin(angle)*radius;
      });
    }
    field.classList.add('is-tracking');
    field.classList.toggle('is-pressed',pressing);
    if(!frame) frame=requestAnimationFrame(stepSwarm);
  }
  function stepSwarm(now) {
    frame=0;
    if(!tracking||!isMoving()) {stopSwarm();return;}
    const hold=touching?1350:1700;
    const idle=now-lastInput;
    if(!pressing&&idle>hold) {
      field.classList.remove('is-tracking','is-pressed');
      tracking=false;
      return;
    }
    const drift=now*.00035;
    const edge=Math.min(35,Math.max(20,innerWidth*.045));
    for(let i=0;i<swarm.length;i++) {
      const p=swarm[i];
      const radius=i===0?0:(pressing?6+(i%4)*3:edge+(i%4)*5);
      const angle=p.angle+drift;
      const desiredX=aimX+Math.cos(angle)*radius;
      const desiredY=aimY+Math.sin(angle)*radius*.72;
      const speed=Math.min(.23,.09+(i%5)*.021);
      p.x+=(desiredX-p.x)*speed;
      p.y+=(desiredY-p.y)*speed;
      p.node.style.transform='translate3d('+p.x.toFixed(1)+'px,'+p.y.toFixed(1)+'px,0) rotate('+((i*47)%140-40)+'deg)';
    }
    focus.style.transform='translate3d('+(aimX-20)+'px,'+(aimY-20)+'px,0)';
    frame=requestAnimationFrame(stepSwarm);
  }
  window.addEventListener('pointermove',event=>{
    if(!event.isPrimary||!isMoving())return;
    if(event.pointerType==='touch'&&!fingerDown)return;
    startSwarm(event.clientX,event.clientY,event.pointerType,false);
    // El punto de toque permanece concentrado hasta soltar.
    if(fingerDown) {
      pressing=true;
      field.classList.add('is-pressed');
    }
  },{passive:true});
  window.addEventListener('pointerdown',event=>{
    if(!event.isPrimary||!isMoving()||(event.pointerType==='mouse'&&event.button!==0))return;
    fingerDown=event.pointerType==='touch';
    startSwarm(event.clientX,event.clientY,event.pointerType,true);
  },{passive:true});
  const releaseSwarm=()=>{
    fingerDown=false;
    pressing=false;
    lastInput=performance.now();
    field.classList.remove('is-pressed');
  };
  window.addEventListener('pointerup',releaseSwarm,{passive:true});
  window.addEventListener('pointercancel',releaseSwarm,{passive:true});
  window.addEventListener('blur',stopSwarm);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSwarm()});
  document.addEventListener('portfolio:motion',event=>{
    if(!event.detail?.enabled)stopSwarm();
  });
  const scan = html('span','lab-scanline');
  scan.setAttribute('aria-hidden','true');
  document.body.appendChild(scan);
  // Physics-like browser floating next to the existing orb, not replacing it.
  const orbit=html('div','lab-orbit'), orbit2=html('div','lab-orbit lab-orbit--b');
  const corner=html('div','lab-corner');
  const browser=html('div','lab-browser');
  browser.innerHTML = '<div class="lab-browser__bar"><i></i><i></i><i></i></div>'+
    '<div class="lab-browser__body"><b>Diseño que<br>se construye.</b>'+
    '<span class="lab-browser__line"></span><span class="lab-browser__line"></span>'+
    '<div class="lab-browser__grid"><span></span><span></span><span></span></div></div>';
  const coords=html('span','lab-coordinate','X: 40.82  /  Y: -60.52\nUI SYSTEM — V.01');
  coords.style.whiteSpace='pre-line';
  for(const n of [orbit,orbit2,corner,browser,coords]) { n.setAttribute('aria-hidden','true');hero.appendChild(n); }
  // Reuse the original project's own cards and text, layer the blueprint treatment on top.
  const selectors=['.hero-intro','.hero-description','.hero-actions',
    '.section-heading','.showcase-heading','.showcase-card',
    '.project','.statement','.approach-intro','.process-item',
    '.about-portrait','.about-content h2','.about-copy',
    '.contact-top','.contact-title','.contact-bottom'];
  const nodes=Array.from(new Set(selectors.flatMap(s=>Array.from(document.querySelectorAll(s)))));
  for(const [i,n] of nodes.entries()){
    n.classList.add('lab-assemble');
    n.style.setProperty('--assemble-x',((i%2===0)?-18:18)+'px');
    n.style.setProperty('--assemble-y',((i%3)*9+14)+'px');
    n.style.setProperty('--lab-delay-enter',((i%4)*55)+'ms');
    if (n.matches('.project,.showcase-card')){
      n.classList.add('lab-frame');
      const tr=html('span','lab-trace');
      tr.setAttribute('aria-hidden','true');
      n.appendChild(tr);
    }
  }
  root.classList.add('lab-ready');
  // Section reveal, respecting user's existing pause-motion control.
  const revealNow = () => {
    const viewHeight=innerHeight;
    for(const n of nodes){
      const r=n.getBoundingClientRect();
      if(r.top < viewHeight*1.13 && r.bottom > -viewHeight*.15)
        n.classList.add('lab-in');
    }
  };
  if ('IntersectionObserver' in window){
    const io=new IntersectionObserver(entries => {
      for(const entry of entries) if(entry.isIntersecting){
        entry.target.classList.add('lab-in');io.unobserve(entry.target);
      }
    },{threshold:.06,rootMargin:'0px 0px 50px 0px'});
    nodes.forEach(n=>io.observe(n));
  }else {
    nodes.forEach(n=>n.classList.add('lab-in'));
  }
  addEventListener('load',revealNow,{once:true});
  requestAnimationFrame(revealNow);
  document.addEventListener('portfolio:motion',e=>{
    if(!e.detail?.enabled)nodes.forEach(n=>n.classList.add('lab-in'));
    else revealNow();
  });
  // Compact lab toolbar linking to the unaffected published homepage.
  const toolbar=html('div','lab-demo-label');
  toolbar.setAttribute('role','group');
  toolbar.setAttribute('aria-label','Controles de la versión de prueba');
  const signal=html('strong','','ESTUDIO / 01');
  const original=document.createElement('a');
  original.href='index.html';original.textContent='Ver original';
  const replay=html('button','','Repetir efecto');replay.type='button';
  const projects=document.createElement('a');
  projects.href='#proyectos';projects.className='lab-demo-cta';projects.textContent='Ver proyectos ↗';
  toolbar.append(signal,original,replay,projects);
  document.body.appendChild(toolbar);
  const intro=html('div','lab-intro-screen');
  intro.setAttribute('aria-hidden','true');
  intro.innerHTML='<div class="lab-intro-inner"><small>FACUNDO / INTERFACES / 2026</small>'+
    '<strong>DE LA IDEA<br><span>A LO REAL.</span></strong>'+
    '<small>ENSAMBLANDO EXPERIENCIA ...</small>'+
    '<div class="lab-intro-progress"><i></i></div></div>';
  document.body.appendChild(intro);
  let introTimer=null,hideTimer=null;
  function playIntro(){
    if(!isMoving())return;
    clearTimeout(introTimer);clearTimeout(hideTimer);
    intro.classList.remove('lab-show');
    const bar=intro.querySelector('.lab-intro-progress i');
    bar.style.animation='none';void bar.offsetWidth;bar.style.animation='';
    requestAnimationFrame(()=>intro.classList.add('lab-show'));
    nodes.forEach(n=>{
      if(n.getBoundingClientRect().top < innerHeight*1.1)n.classList.remove('lab-in');
    });
    introTimer=setTimeout(()=>{
      intro.classList.remove('lab-show');
      hideTimer=setTimeout(revealNow,300);
    },2100);
  }
  replay.addEventListener('click',()=>{
    if(!isMoving()) {
      const btn=document.getElementById('motion-toggle');
      if(btn && root.dataset.motion==='off') btn.click();
    }
    playIntro();
  });
  // Only play intro on first visit to the preview in the current tab.
  let seen=false;
  try {
    seen=sessionStorage.getItem('portfolio-reel-preview-intro')==='1';
    if(!seen)sessionStorage.setItem('portfolio-reel-preview-intro','1');
  }catch(e){/* Private browsing may block storage */ }
  if(!seen && isMoving())playIntro();
  window.addEventListener('pagehide',()=>{clearTimeout(introTimer);clearTimeout(hideTimer);});
})();
