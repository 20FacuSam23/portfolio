// ==UserScript==
// @name         Mi facultad · Apariencia
// @namespace    https://20facusam23.github.io/portfolio/sysacad/
// @version      1.0.0
// @description  Actualiza la apariencia del sitio oficial sin transferir datos.
// @match        https://sysacad.frp.utn.edu.ar/*
// @grant        none
// ==/UserScript==
(()=>{
'use strict';
if(location.hostname!=='sysacad.frp.utn.edu.ar'||location.protocol!=='https:'){alert('Abrí primero SysAcad de UTN Paraná y activá el marcador allí.');return;}
const css=`
:root{color-scheme:light!important;--fac-ink:#152c43;--fac-blue:#215be4}
html{background:#eef3fa!important;scroll-behavior:smooth}
body{background:#eef3fa!important;color:var(--fac-ink)!important;font:16px/1.6 system-ui,-apple-system,Segoe UI,sans-serif!important;margin:0!important;padding:28px!important;box-sizing:border-box}
body>*{max-width:1200px;margin-left:auto;margin-right:auto}
font,td,th,p,div,span,label{font-family:inherit!important;color:inherit}
h1,h2,h3{font-family:inherit!important;letter-spacing:-.025em;line-height:1.2;color:#152c43!important}
h1{font-size:32px!important}h2{font-size:25px!important}
a{color:#174dbd!important;text-underline-offset:4px}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #db8c0a!important;outline-offset:3px}
table{border-collapse:separate!important;border-spacing:0!important;background:white!important;color:#152c43!important;border:1px solid #dce4ef!important;border-radius:14px!important;box-shadow:0 8px 28px #183d6810;max-width:100%}
td,th{padding:12px 16px!important;border-color:#e1e8f1!important;font-size:15px!important;vertical-align:middle}
th{background:#eaf0fc!important;color:#183e77!important;text-align:left}
tr{background:transparent!important}tr:nth-child(even)>td{background:#f7f9fd!important}
form{line-height:2.5}input,select,textarea{box-sizing:border-box;max-width:100%;border:1px solid #b6c6dc!important;border-radius:9px!important;background:#fff!important;color:#152c43!important;font:16px system-ui!important;padding:10px 12px!important;min-height:42px}
input[type=submit],input[type=button],button{border:0!important;border-radius:9px!important;background:#215be4!important;color:white!important;font:600 15px system-ui!important;padding:12px 20px!important;cursor:pointer;min-height:44px}
input[type=checkbox],input[type=radio]{min-height:0}
.fac-toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:0 auto 26px!important;background:#132d4b;color:white!important;padding:18px 24px;border-radius:15px;max-width:1152px;box-shadow:0 10px 30px #102b4c18}
.fac-toolbar strong{color:white!important;font-size:20px}.fac-toolbar small{display:block;color:#c5d6ec!important;font-size:12px}.fac-toolbar button{background:#ffffff18!important;border:1px solid #ffffff45!important;font-size:13px!important;padding:9px 13px!important}
@media(max-width:650px){body{padding:12px!important;font-size:15px!important}td,th{padding:9px!important;font-size:13px!important}.fac-toolbar{padding:14px!important;flex-wrap:wrap}table{display:block;overflow-x:auto}input,select{font-size:16px!important}}
@media print{.fac-toolbar{display:none!important}body{background:white!important;padding:0!important}table{box-shadow:none!important}}
`;
let count=0;
function apply(win){let d;try{d=win.document;if(win.location.origin!==location.origin)return;}catch{return;}
if(d.getElementById('fac-apariencia'))return;
if(!d.head||!d.body)return;
const style=d.createElement('style');style.id='fac-apariencia';style.textContent=css;d.head.append(style);
if(!d.querySelector('meta[name=viewport]')){const meta=d.createElement('meta');meta.name='viewport';meta.content='width=device-width, initial-scale=1';meta.dataset.fac='viewport';d.head.append(meta);}
if(d.body.tagName==='BODY'){
const bar=d.createElement('div');bar.className='fac-toolbar';bar.dataset.fac='toolbar';
const title=d.createElement('div'),strong=d.createElement('strong'),small=d.createElement('small');strong.textContent='Mi facultad';small.textContent='SysAcad · UTN Paraná · Apariencia personal';title.append(strong,small);
const reset=d.createElement('button');reset.type='button';reset.textContent='Ver diseño original';reset.onclick=()=>{style.remove();bar.remove();d.querySelector('meta[data-fac=viewport]')?.remove();};bar.append(title,reset);d.body.prepend(bar);
}count++;
for(let i=0;i<win.frames.length;i++)apply(win.frames[i]);
}
apply(window);
if(!count)alert('La apariencia ya está activada o la página todavía no terminó de cargar.');
})();
