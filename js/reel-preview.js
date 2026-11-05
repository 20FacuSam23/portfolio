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
  // Cursores libres en reposo; convergen solo durante mouse/touch y vuelven a dispersarse.
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
  const total = matchMedia('(max-width:760px)').matches ? 9 : 16;
  const columns = total === 9 ? 3 : 4;
  const rows = Math.ceil(total / columns);
  const ambientPoint = (p, now) => {
    const w=innerWidth, h=innerHeight;
    const baseX=(p.col+.5)*w/columns, baseY=(p.row+.5)*h/rows;
    const offsetX=Math.min(w/columns*.34,65), offsetY=Math.min(h/rows*.33,58);
    const drift=now*.00022;
    return {
      x:baseX+Math.sin(drift*(.9+p.index%4*.12)+p.angle)*offsetX
        +Math.cos(drift*.63+p.angle*.7)*offsetX*.38,
      y:baseY+Math.cos(drift*(.8+p.index%3*.1)+p.angle)*offsetY
        +Math.sin(drift*.76+p.angle*.3)*offsetY*.34
    };
  };
  for(let i=0;i<total;i++){
    const node=html('span','lab-cursor');
    node.style.setProperty('--lab-col',colors[i%colors.length]);
    const particle={node,index:i,col:i%columns,row:Math.floor(i/columns),
      angle:i*2.3999632297,x:0,y:0};
    const initial=ambientPoint(particle,performance.now());
    particle.x=initial.x;particle.y=initial.y;
    node.style.transform='translate3d('+particle.x+'px,'+particle.y+'px,0) rotate('+((i*47)%140-40)+'deg)';
    field.appendChild(node);
    swarm.push(particle);
  }
  field.appendChild(focus);
  let aimX=innerWidth/2,aimY=innerHeight/2;
  let frame=0, lastPaint=0, lastInput=-100000;
  let fingerDown=false, mouseDown=false, pointerKind='mouse';

  // La posición del puntero solo se utiliza para el efecto visual local.
  function gather(x,y,kind,down) {
    if(!isMoving())return;
    aimX=x;aimY=y;pointerKind=kind;
    lastInput=performance.now();
    if(kind==='touch')fingerDown=!!down;
    if(kind==='mouse')mouseDown=!!down;
    field.classList.add('is-tracking');
    field.classList.toggle('is-pressed',fingerDown||mouseDown);
    if(!frame&&!document.hidden)frame=requestAnimationFrame(animateSwarm);
  }
  function animateSwarm(now) {
    frame=0;
    if(!isMoving()||document.hidden){field.classList.remove('is-tracking','is-pressed');return;}
    frame=requestAnimationFrame(animateSwarm);
    // 30 FPS es suficiente para un efecto ambiental ligero en teléfonos.
    if(now-lastPaint<30)return;
    const elapsed=lastPaint?Math.min(70,now-lastPaint):33;
    lastPaint=now;
    const holding=fingerDown||mouseDown;
    const grace=pointerKind==='touch'?550:1150;
    const gatherActive=holding||now-lastInput<grace;
    field.classList.toggle('is-tracking',gatherActive);
    field.classList.toggle('is-pressed',holding);
    const orbitTime=now*.001;
    const settle=Math.min(1,elapsed/130);
    swarm.forEach((p,i)=>{
      let target;
      if(gatherActive){
        const radius=holding?7+(i%4)*3:24+(i%5)*6;
        const angle=p.angle+orbitTime*.35;
        target={
          x:aimX+Math.cos(angle)*radius,
          y:aimY+Math.sin(angle)*radius*.76
        };
      } else {
        target=ambientPoint(p,now);
      }
      // Se alejan solos del punto del toque y vuelven a sus trayectorias.
      const speed=settle*(gatherActive?.92:.45);
      p.x+=(target.x-p.x)*speed;
      p.y+=(target.y-p.y)*speed;
      p.node.style.transform='translate3d('+p.x.toFixed(1)+'px,'+p.y.toFixed(1)+'px,0) rotate('+((i*47)%140-40)+'deg)';
    });
    focus.style.transform='translate3d('+(aimX-20)+'px,'+(aimY-20)+'px,0)';
  }
  function startAmbient(){
    if(!isMoving()||document.hidden||frame)return;
    lastPaint=0;
    frame=requestAnimationFrame(animateSwarm);
  }
  function pauseAmbient(){
    if(frame)cancelAnimationFrame(frame);
    frame=0;lastPaint=0;
    fingerDown=false;mouseDown=false;
    lastInput=-100000;
    field.classList.remove('is-tracking','is-pressed');
  }
  window.addEventListener('pointermove',event=>{
    if(!event.isPrimary||!isMoving())return;
    if(event.pointerType==='touch'&&!fingerDown)return;
    gather(event.clientX,event.clientY,event.pointerType||'mouse',fingerDown||mouseDown);
  },{passive:true});
  window.addEventListener('pointerdown',event=>{
    if(!event.isPrimary||!isMoving()||(event.pointerType==='mouse'&&event.button!==0))return;
    gather(event.clientX,event.clientY,event.pointerType||'mouse',true);
  },{passive:true});
  function release(){
    fingerDown=false;mouseDown=false;
    lastInput=performance.now();
    field.classList.remove('is-pressed');
  }
  window.addEventListener('pointerup',release,{passive:true});
  window.addEventListener('pointercancel',release,{passive:true});
  window.addEventListener('blur',pauseAmbient);
  window.addEventListener('focus',startAmbient);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseAmbient();else startAmbient();});
  document.addEventListener('portfolio:motion',event=>{
    if(!event.detail?.enabled)pauseAmbient();else startAmbient();
  });
  startAmbient();
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
