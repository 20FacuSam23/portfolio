/* Aviso discreto de estadisticas. Sin GPS ni permisos del dispositivo. */
(() => {
  'use strict';
  const source = document.currentScript;
  const portal = source && source.dataset.portal;
  const valid = ['a-remarla', 'nuts', 'escuela-mayores', 'aula-generica', 'tienda-generica', 'sysacad', 'portfolio'];
  if (!valid.includes(portal) || location.protocol !== 'https:') return;
  if (['aula-generica', 'tienda-generica'].includes(portal) &&
      (new URLSearchParams(location.search).has('portal') || new URLSearchParams(location.search).has('org'))) return;

  const noTrack = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';
  const key = 'dl-visit-permission-v1:' + portal;
  const cityKey = 'dl-visitor-city-v1:' + portal;
  let choice = null;
  let sent = false;
  try { choice = localStorage.getItem(key); } catch (_) {}

  function loadStatistics() {
    if (sent || noTrack) return;
    sent = true;
    const tag = document.createElement('script');
    tag.src = 'https://datalisting.info/js/portal-telemetry.js';
    tag.dataset.portal = portal;
    tag.async = true;
    document.body.appendChild(tag);
  }

  const styles = document.createElement('style');
  styles.textContent = [
    '.dl-privacy-panel,.dl-privacy-panel *{box-sizing:border-box}',
    '.dl-privacy-panel{position:fixed;z-index:2147483000;bottom:12px;left:12px;width:min(370px,calc(100vw - 24px));padding:14px 15px;border:1px solid #dce1e7;border-radius:13px;box-shadow:0 8px 26px #0002;background:#fff;color:#273449;font:13px/1.45 system-ui,Arial,sans-serif}',
    '.dl-privacy-panel[hidden]{display:none!important}',
    '.dl-privacy-panel h2{font:700 16px/1.35 system-ui,Arial,sans-serif;color:#202e44;margin:0 0 9px}',
    '.dl-privacy-panel label{display:block;font-size:13px;font-weight:650;margin:0 0 6px;color:#35445a}',
    '.dl-privacy-panel input{display:block;width:100%;margin:0 0 10px;border:1px solid #d0d7e1;border-radius:8px;background:#fff;color:#273449;padding:10px 11px;font:13px system-ui,Arial,sans-serif}',
    '.dl-privacy-panel p{font:12px/1.45 system-ui,Arial,sans-serif;color:#586576;margin:0 0 8px}',
    '.dl-privacy-actions{display:flex;gap:8px;margin-top:10px}',
    '.dl-privacy-panel button{font:650 12px/1.35 system-ui,Arial,sans-serif;padding:10px 10px;border-radius:8px;min-height:42px;cursor:pointer;flex:1}',
    '.dl-privacy-no{border:1px solid #d3dbe6;background:#f6f7f9;color:#334155}',
    '.dl-privacy-yes{border:1px solid #274e77;background:#274e77;color:#fff}',
    '.dl-privacy-yes:disabled{opacity:.5;cursor:not-allowed}',
    '.dl-privacy-details{margin:0}.dl-privacy-details summary{font-size:12px;color:#43617f;cursor:pointer;text-decoration:underline;text-underline-offset:2px}',
    '.dl-privacy-details p{margin:7px 0 0;font-size:12px;line-height:1.5}',
    '.dl-privacy-link{display:inline-block;cursor:pointer;color:inherit;background:transparent;border:1px solid currentColor;border-radius:8px;padding:5px 10px;margin:7px;font:inherit;font-size:12px;opacity:.8}',
    '.dl-privacy-panel button:focus-visible,.dl-privacy-link:focus-visible,.dl-privacy-details summary:focus-visible,.dl-privacy-panel input:focus-visible{outline:2px solid #275e9e;outline-offset:2px}',
    '@media(max-width:440px){.dl-privacy-panel{bottom:8px;left:8px;width:calc(100vw - 16px);padding:12px}.dl-privacy-actions button{padding:10px 7px}}'
  ].join('');
  document.head.appendChild(styles);

  function start() {
    if (document.getElementById('dl-privacy-panel')) return;
    const box = document.createElement('section');
    box.className = 'dl-privacy-panel';
    box.id = 'dl-privacy-panel';
    box.setAttribute('role', 'region');
    box.setAttribute('aria-label', 'Bienvenida y preferencias de estadísticas');

    const title = document.createElement('h2');
    title.textContent = '¡Bienvenido!';
    const label = document.createElement('label');
    label.textContent = '¿Desde dónde nos visitás? (opcional)';
    const city = document.createElement('input');
    city.type = 'text';
    city.maxLength = 70;
    city.placeholder = 'Ciudad o localidad';
    city.autocomplete = 'address-level2';
    label.appendChild(city);

    const message = document.createElement('p');
    message.textContent = 'Si aceptás, permitís estadísticas de visitas para mejorar la página.';

    const details = document.createElement('details');
    details.className = 'dl-privacy-details';
    const summary = document.createElement('summary');
    summary.textContent = 'Más información';
    const explanation = document.createElement('p');
    explanation.textContent = 'Datalisting registra la página, la fecha, el dispositivo y una IP cifrada al aceptar. No obtiene GPS ni datos de formularios. La localidad que escribas se guarda solo en este navegador, no se envía al servidor. Podés cambiar esta opción desde Privacidad.';
    details.append(summary, explanation);

    const actions = document.createElement('div');
    actions.className = 'dl-privacy-actions';
    const no = document.createElement('button');
    no.type = 'button';
    no.className = 'dl-privacy-no';
    no.textContent = 'Entrar sin compartir';
    const yes = document.createElement('button');
    yes.type = 'button';
    yes.className = 'dl-privacy-yes';
    yes.textContent = 'Aceptar y entrar';
    actions.append(no, yes);
    box.append(title, label, message, details, actions);
    document.body.appendChild(box);

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'dl-privacy-link';
    trigger.textContent = 'Privacidad';
    trigger.setAttribute('aria-controls', box.id);
    const footer = document.querySelector('footer');
    if (footer) footer.appendChild(trigger);
    else {
      trigger.style.position = 'fixed';
      trigger.style.bottom = '6px';
      trigger.style.right = '8px';
      trigger.style.zIndex = '2147482999';
      document.body.appendChild(trigger);
    }

    trigger.addEventListener('click', () => { box.hidden = !box.hidden; });
    no.addEventListener('click', () => {
      choice = 'no';
      try { localStorage.setItem(key, choice); localStorage.removeItem(cityKey); } catch (_) {}
      city.value = '';
      box.hidden = true;
    });
    yes.addEventListener('click', () => {
      if (noTrack) return;
      choice = 'si';
      try {
        localStorage.setItem(key, choice);
        if (city.value.trim()) localStorage.setItem(cityKey, city.value.trim());
        else localStorage.removeItem(cityKey);
      } catch (_) {}
      box.hidden = true;
      loadStatistics();
    });

    if (noTrack) {
      yes.disabled = true;
      message.textContent = 'Tu navegador tiene activada la opción de no seguimiento. Podés entrar normalmente.';
    }
    box.hidden = choice !== null || noTrack;
    if (choice === 'si') loadStatistics();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();