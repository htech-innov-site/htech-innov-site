/* H TECH INNOV — Mode édition des sites (site principal et H TECH ACADEMY)
   Activation : ajouter ?edition à l'adresse (ou lien « Administration du site » en pied de page).
   Connexion avec un compte ERP admin ou superadmin. Les droits sont vérifiés par la base (RLS). */
(function () {
  'use strict';
  if (window.__HTE) return; window.__HTE = true;
  const CFG = window.HTI_EDITEUR || {};
  const SITE = CFG.site === 'academy' ? 'academy' : 'principal';
  const SURL = 'https://mgdpbngmjybqphonshsl.supabase.co';
  const SKEY = CFG.cle || '';
  const TEXTES = [
    ['principal', 'principal.annonce', 'Bandeau d’annonce (vide = masqué)'], ['principal', 'principal.annonce_lien', 'Lien du bandeau'],
    ['principal', 'principal.hero_kicker', 'Accroche au-dessus du titre'], ['principal', 'principal.hero_titre', 'Titre principal (vide = titre d’origine en couleurs)', 1],
    ['principal', 'principal.hero_texte', 'Texte sous le titre', 1], ['principal', 'principal.partenaires_titre', 'Titre de la bande partenaires'], ['principal', 'principal.agrements_titre', 'Titre de la section agréments'],
    ['academy', 'academy.annonce', 'Bandeau d’annonce (vide = masqué)'], ['academy', 'academy.hero_kicker', 'Accroche au-dessus du titre'], ['academy', 'academy.hero_titre', 'Titre principal', 1],
    ['academy', 'academy.hero_texte', 'Texte sous le titre', 1], ['academy', 'academy.stat_reussite', 'Chiffre mis en avant'], ['academy', 'academy.stat_reussite_libelle', 'Légende du chiffre'],
    ['academy', 'academy.formateurs_intro', 'Introduction de la section formateurs', 1], ['academy', 'academy.faq', 'FAQ supplémentaire (« Q: … » puis « R: … », ligne vide entre deux questions)', 1],
    ['commun', 'commun.telephone', 'Téléphone'], ['commun', 'commun.whatsapp', 'WhatsApp (format 225…)'], ['commun', 'commun.email', 'Email'], ['commun', 'commun.adresse', 'Adresse']];
  const TYPES = { partenaire: 'Partenaire', technologique: 'Partenaire technologique', atp: 'Agrément ATP', convention: 'Convention', certification: 'Certification / accréditation', client: 'Client de référence' };
  let sb = null, USER = null, PANNEAU = null;
  const esc = v => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const $ = (s, r) => (r || document).querySelector(s);

  // ── Styles ──
  const css = document.createElement('style');
  css.textContent = `
  .hte-barre{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:99990;background:#0A2A66;color:#fff;border-radius:14px;box-shadow:0 14px 40px rgba(0,0,0,.3);display:flex;gap:6px;align-items:center;padding:8px;font:600 13px 'Source Sans 3',system-ui,sans-serif;flex-wrap:wrap;max-width:96vw}
  .hte-barre b{padding:0 10px;font-family:'Montserrat',system-ui,sans-serif;letter-spacing:.04em}
  .hte-b{border:0;border-radius:9px;padding:9px 13px;background:rgba(255,255,255,.12);color:#fff;font:inherit;cursor:pointer;min-height:38px}
  .hte-b:hover{background:rgba(255,255,255,.24)}.hte-b.v{background:#3F8A1E}.hte-b.p{background:#1565C0}
  body.hte-on [data-cms]{outline:2px dashed #3F8A1E!important;outline-offset:3px;cursor:pointer!important;border-radius:4px}
  body.hte-on [data-cms]:hover{outline-color:#1565C0!important;background:rgba(66,165,245,.08)}
  .hte-voile{position:fixed;inset:0;z-index:99995;background:rgba(10,42,102,.45);display:flex;align-items:center;justify-content:center;padding:16px}
  .hte-modal{background:#fff;color:#0F1B33;border-radius:16px;width:min(560px,96vw);max-height:90vh;overflow:auto;padding:22px;font:15px/1.5 'Source Sans 3',system-ui,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.3)}
  .hte-modal h2{font:800 20px 'Montserrat',system-ui,sans-serif;color:#0A2A66;margin:0 0 12px}
  .hte-modal label{display:block;font-size:12.5px;font-weight:700;color:#4A5A78;margin:12px 0 5px}
  .hte-modal input[type=text],.hte-modal input[type=email],.hte-modal input[type=password],.hte-modal input[type=number],.hte-modal input:not([type]),.hte-modal textarea,.hte-modal select{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #C5D6F0;border-radius:9px;font:inherit}
  .hte-modal textarea{min-height:90px;resize:vertical}
  .hte-act{display:flex;gap:8px;justify-content:flex-end;margin-top:16px;flex-wrap:wrap}
  .hte-btn{border:0;border-radius:9px;padding:10px 16px;font:700 14px 'Montserrat',system-ui,sans-serif;cursor:pointer;min-height:42px}
  .hte-btn.p{background:#0A2A66;color:#fff}.hte-btn.o{background:#fff;color:#0A2A66;border:2px solid #0A2A66}.hte-btn.r{background:#fff;color:#C62828;border:2px solid #C62828}
  .hte-err{color:#C62828;font-weight:600;font-size:13px;min-height:18px;margin-top:8px}
  .hte-tiroir{position:fixed;top:0;right:0;bottom:0;z-index:99992;width:min(520px,100vw);background:#fff;color:#0F1B33;box-shadow:-10px 0 40px rgba(0,0,0,.25);display:flex;flex-direction:column;font:15px/1.5 'Source Sans 3',system-ui,sans-serif}
  .hte-tiroir header{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid #D5E0F0}
  .hte-tiroir header h2{font:800 18px 'Montserrat',system-ui,sans-serif;color:#0A2A66;margin:0}
  .hte-corps{flex:1;overflow:auto;padding:14px 18px}
  .hte-item{display:flex;gap:12px;align-items:center;padding:10px;border:1px solid #D5E0F0;border-radius:12px;margin-bottom:8px}
  .hte-item img,.hte-item .hte-vide{width:56px;height:48px;object-fit:contain;border-radius:8px;background:#F4F7FC;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;color:#7A8BA8}
  .hte-item .t{flex:1;min-width:0}.hte-item .t b{display:block}.hte-item .t small{color:#4A5A78}
  .hte-apercu{width:110px;height:90px;object-fit:contain;border:1px solid #D5E0F0;border-radius:10px;background:#F4F7FC;display:block;margin-bottom:6px}
  .hte-choix{display:grid;grid-template-columns:1fr 1fr;gap:6px;max-height:180px;overflow:auto;border:1px solid #D5E0F0;border-radius:9px;padding:8px;font-size:13.5px}
  .hte-choix label{margin:0;font-weight:500;color:#0F1B33;display:flex;gap:6px;align-items:flex-start}
  .hte-toast{position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:99999;background:#0A2A66;color:#fff;padding:11px 18px;border-radius:10px;font:600 14px 'Source Sans 3',system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.25)}`;
  document.head.appendChild(css);

  function toast(m) { const t = document.createElement('div'); t.className = 'hte-toast'; t.setAttribute('role', 'status'); t.textContent = m; document.body.appendChild(t); setTimeout(() => t.remove(), 3500); }
  function modal(html) { const v = document.createElement('div'); v.className = 'hte-voile'; v.innerHTML = `<div class="hte-modal" role="dialog" aria-modal="true">${html}</div>`; document.body.appendChild(v); v.addEventListener('click', e => { if (e.target === v) v.remove(); }); setTimeout(() => { const f = v.querySelector('input,textarea,select'); f && f.focus(); }, 30); return v; }
  function maj() { try { CFG.onMaj && CFG.onMaj(); } catch (e) { } window.dispatchEvent(new Event('hti-cms-maj')); }
  function vignette(file, taille) {
    return new Promise((ok, ko) => { const fr = new FileReader(); fr.onerror = ko; fr.onload = () => { const im = new Image(); im.onerror = ko; im.onload = () => {
      const k = Math.min(1, (taille || 360) / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height); ok(c.toDataURL('image/jpeg', .85)); }; im.src = fr.result; }; fr.readAsDataURL(file); });
  }
  const lienOk = u => { u = String(u || '').trim(); if (!u) return null; if (!/^https?:\/\//i.test(u)) u = 'https://' + u; return /^https?:\/\/[^\s]+$/i.test(u) ? u : null; };

  // ── Connexion ──
  function charger(src) { return new Promise((ok, ko) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = ko; document.head.appendChild(s); }); }
  async function init() {
    if (!window.supabase) await charger('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    sb = window.supabase.createClient(SURL, SKEY, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'hti-editeur-site', detectSessionInUrl: false } });
    const { data } = await sb.auth.getSession(); USER = data.session && data.session.user;
    if (USER && await estAdmin()) return activer();
    connexion();
  }
  async function estAdmin() { const { data } = await sb.from('profiles').select('role').eq('id', USER.id).maybeSingle(); return !!data && ['admin', 'superadmin'].includes(data.role); }
  function connexion(msg) {
    const v = modal(`<h2>Mode édition du site</h2><p style="margin:0;color:#4A5A78">Connectez-vous avec votre compte ERP administrateur.</p>
      <label for="hteEm">Email</label><input id="hteEm" type="email" autocomplete="email"><label for="hteMp">Mot de passe</label><input id="hteMp" type="password" autocomplete="current-password">
      <div class="hte-err" id="hteErr">${esc(msg || '')}</div><div class="hte-act"><button class="hte-btn o" id="hteAnn">Annuler</button><button class="hte-btn p" id="hteOk">Se connecter</button></div>`);
    const go = async () => {
      const e = $('#hteErr', v); e.textContent = '';
      const { data, error } = await sb.auth.signInWithPassword({ email: $('#hteEm', v).value.trim(), password: $('#hteMp', v).value });
      if (error) { e.textContent = 'Email ou mot de passe incorrect.'; return; }
      USER = data.user;
      if (!await estAdmin()) { await sb.auth.signOut(); e.textContent = 'Ce compte n’a pas les droits d’administration du site.'; return; }
      v.remove(); activer();
    };
    $('#hteOk', v).onclick = go; $('#hteMp', v).onkeydown = ev => { if (ev.key === 'Enter') go(); }; $('#hteAnn', v).onclick = () => { v.remove(); quitterUrl(); };
  }
  function quitterUrl() { const u = new URL(location.href); u.searchParams.delete('edition'); history.replaceState(null, '', u.pathname + u.search + u.hash); }

  // ── Barre d'outils et édition au clic ──
  function activer() {
    document.body.classList.add('hte-on');
    const b = document.createElement('div'); b.className = 'hte-barre'; b.setAttribute('role', 'toolbar'); b.setAttribute('aria-label', 'Mode édition');
    b.innerHTML = `<b>✏️ MODE ÉDITION</b><button class="hte-b" data-p="textes">Textes</button><button class="hte-b" data-p="formateurs">Formateurs</button><button class="hte-b" data-p="partenaires">Partenaires et agréments</button>${SITE === 'academy' ? '<button class="hte-b" data-p="images">Images des formations</button>' : ''}<button class="hte-b v" data-p="aide">Aide</button><button class="hte-b" data-p="quitter">Quitter</button>`;
    document.body.appendChild(b);
    b.addEventListener('click', e => { const p = e.target.closest('[data-p]')?.dataset.p; if (!p) return; if (p === 'quitter') return quitter(); if (p === 'aide') return aide(); ouvrirPanneau(p); });
    document.addEventListener('click', clicEditable, true);
    toast('Mode édition activé : cliquez sur un texte encadré en vert pour le modifier.');
  }
  async function quitter() { document.body.classList.remove('hte-on'); document.removeEventListener('click', clicEditable, true); document.querySelector('.hte-barre')?.remove(); PANNEAU?.remove(); await sb.auth.signOut(); quitterUrl(); toast('Mode édition fermé'); }
  function aide() {
    const v = modal(`<h2>Comment modifier le site</h2><ul style="padding-left:18px;margin:0">
      <li><b>Textes</b> : cliquez sur un texte encadré en vert, ou ouvrez « Textes » pour tous les voir (bandeau, coordonnées, FAQ…).</li>
      <li><b>Formateurs</b> : ajoutez photo, titre, compétences, certifications, références et formations animées.</li>
      <li><b>Partenaires et agréments</b> : logo, lien vers leur site, type (ATP, convention, partenaire…).</li>
      ${SITE === 'academy' ? '<li><b>Images des formations</b> : une image par formation du catalogue.</li>' : ''}
      <li>Les changements sont publiés immédiatement pour tous les visiteurs. Chaque version est conservée (historique dans l’ERP › Site web).</li></ul>
      <div class="hte-act"><button class="hte-btn p">Compris</button></div>`);
    v.querySelector('.hte-btn').onclick = () => v.remove();
  }
  function clicEditable(e) {
    if (!document.body.classList.contains('hte-on')) return;
    const el = e.target.closest('[data-cms]'); if (!el || e.target.closest('.hte-barre,.hte-tiroir,.hte-voile')) return;
    e.preventDefault(); e.stopPropagation();
    editerTexte(el.dataset.cms, el.innerText.trim());
  }
  async function editerTexte(cle, actuel) {
    const def = TEXTES.find(t => t[1] === cle) || [null, cle, cle, 1];
    const { data } = await sb.from('site_contenus').select('valeur').eq('cle', cle).maybeSingle();
    const val = data ? data.valeur : actuel;
    const v = modal(`<h2>Modifier le texte</h2><label for="hteTx">${esc(def[2])}</label>
      ${def[3] ? `<textarea id="hteTx">${esc(val)}</textarea>` : `<input id="hteTx" value="${esc(val)}">`}
      <div class="hte-err" id="hteErr"></div>
      <div class="hte-act">${data ? '<button class="hte-btn r" id="hteOri">Texte d’origine</button>' : ''}<button class="hte-btn o" id="hteAnn">Annuler</button><button class="hte-btn p" id="hteOk">Publier</button></div>`);
    $('#hteAnn', v).onclick = () => v.remove();
    $('#hteOk', v).onclick = async () => {
      const t = $('#hteTx', v).value.trim();
      const r = t ? await sb.from('site_contenus').upsert({ cle, site: cle.split('.')[0], valeur: t }, { onConflict: 'cle' }) : await sb.from('site_contenus').delete().eq('cle', cle);
      if (r.error) { $('#hteErr', v).textContent = r.error.message; return; }
      v.remove(); toast('✅ Publié'); maj();
    };
    const o = $('#hteOri', v); if (o) o.onclick = async () => { const r = await sb.from('site_contenus').delete().eq('cle', cle); if (r.error) { $('#hteErr', v).textContent = r.error.message; return; } v.remove(); toast('Texte d’origine rétabli'); maj(); };
  }

  // ── Panneaux ──
  function tiroir(titre, corps, bouton) {
    PANNEAU?.remove();
    const t = document.createElement('aside'); t.className = 'hte-tiroir'; t.setAttribute('aria-label', titre);
    t.innerHTML = `<header><h2>${esc(titre)}</h2><div style="display:flex;gap:6px">${bouton || ''}<button class="hte-btn o" data-f>Fermer</button></div></header><div class="hte-corps">${corps}</div>`;
    document.body.appendChild(t); t.querySelector('[data-f]').onclick = () => { t.remove(); PANNEAU = null; }; PANNEAU = t; return t;
  }
  async function ouvrirPanneau(p) {
    if (p === 'textes') return panneauTextes();
    if (p === 'formateurs') return panneauFormateurs();
    if (p === 'partenaires') return panneauPartenaires();
    if (p === 'images') return panneauImages();
  }
  async function panneauTextes() {
    const { data } = await sb.from('site_contenus').select('cle,valeur');
    const V = Object.fromEntries((data || []).map(x => [x.cle, x.valeur]));
    const liste = TEXTES.filter(t => t[0] === SITE || t[0] === 'commun');
    const t = tiroir('Textes du site', liste.map(x => `<div class="hte-item"><div class="t"><b>${esc(x[2])}</b><small>${V[x[1]] ? esc(String(V[x[1]]).slice(0, 90)) : '<i>Texte d’origine</i>'}</small></div><button class="hte-btn o" data-k="${esc(x[1])}">Modifier</button></div>`).join(''));
    t.querySelectorAll('[data-k]').forEach(b => b.onclick = () => editerTexte(b.dataset.k, V[b.dataset.k] || ''));
  }
  // Formateurs
  let CAT = null;
  async function catalogue() { if (CAT) return CAT; const { data } = await sb.rpc('academy_catalogue'); CAT = data || []; return CAT; }
  async function panneauFormateurs() {
    const { data, error } = await sb.from('site_formateurs').select('*').order('ordre');
    if (error) return toast('❌ ' + error.message);
    const t = tiroir('Formateurs', (data || []).map(f => `<div class="hte-item">${f.photo_data ? `<img src="${esc(f.photo_data)}" alt="">` : '<span class="hte-vide">Sans photo</span>'}
      <div class="t"><b>${esc(f.nom)}</b><small>${esc(f.titre || '')}${f.actif ? '' : ' · masqué'}</small></div><button class="hte-btn o" data-id="${esc(f.id)}">Modifier</button></div>`).join('') || '<p>Aucun formateur pour le moment.</p>', '<button class="hte-btn p" data-n>+ Ajouter</button>');
    t.querySelector('[data-n]').onclick = () => formFormateur(null);
    t.querySelectorAll('[data-id]').forEach(b => b.onclick = () => formFormateur((data || []).find(x => x.id === b.dataset.id)));
  }
  async function formFormateur(f) {
    f = f || { actif: true, afficher_academy: true, afficher_principal: SITE === 'principal', competences: [], certifications: [], formations: [], ordre: 100 };
    const cat = await catalogue(); let photo = f.photo_data || null;
    const v = modal(`<h2>${f.id ? 'Modifier' : 'Ajouter'} un formateur</h2>
      <label>Photo</label><img class="hte-apercu" id="htePh" src="${esc(photo || '')}" alt="" ${photo ? '' : 'style="display:none"'}><input type="file" id="hteF" accept="image/jpeg,image/png">
      <label for="hteNom">Nom et prénom *</label><input id="hteNom" value="${esc(f.nom || '')}">
      <label for="hteTit">Titre (ex. Consultante senior, certifiée PMP®)</label><input id="hteTit" value="${esc(f.titre || '')}">
      <label for="hteBio">Présentation et références (projets, clients, réalisations)</label><textarea id="hteBio">${esc(f.bio || '')}</textarea>
      <label for="hteCo">Compétences (une par ligne)</label><textarea id="hteCo">${esc((f.competences || []).join('\n'))}</textarea>
      <label for="hteCe">Certifications (une par ligne)</label><textarea id="hteCe" style="min-height:60px">${esc((f.certifications || []).join('\n'))}</textarea>
      <label>Formations animées</label><div class="hte-choix">${cat.map(c => `<label><input type="checkbox" value="${esc(c.reference)}" ${(f.formations || []).includes(c.reference) ? 'checked' : ''}> ${esc(c.designation)}</label>`).join('') || '<span>Catalogue indisponible</span>'}</div>
      <label for="hteExp">Années d’expérience</label><input id="hteExp" type="number" min="0" value="${esc(f.annees_experience ?? '')}">
      <label for="hteLi">Profil LinkedIn</label><input id="hteLi" value="${esc(f.linkedin || '')}">
      <label><input type="checkbox" id="hteAc" ${f.afficher_academy ? 'checked' : ''}> Afficher sur H TECH ACADEMY</label>
      <label><input type="checkbox" id="htePr" ${f.afficher_principal ? 'checked' : ''}> Afficher sur le site principal</label>
      <label><input type="checkbox" id="hteVi" ${f.actif ? 'checked' : ''}> Profil visible</label>
      <div class="hte-err" id="hteErr"></div>
      <div class="hte-act">${f.id ? '<button class="hte-btn r" id="hteSup">Supprimer</button>' : ''}<button class="hte-btn o" id="hteAnn">Annuler</button><button class="hte-btn p" id="hteOk">Enregistrer et publier</button></div>`);
    $('#hteF', v).onchange = async e => { const file = e.target.files[0]; if (!file) return; photo = await vignette(file, 360); const i = $('#htePh', v); i.src = photo; i.style.display = 'block'; };
    $('#hteAnn', v).onclick = () => v.remove();
    $('#hteOk', v).onclick = async () => {
      const nom = $('#hteNom', v).value.trim(); if (!nom) { $('#hteErr', v).textContent = 'Le nom est obligatoire.'; return; }
      const lignes = id => $(id, v).value.split('\n').map(x => x.trim()).filter(Boolean);
      const d = { nom, titre: $('#hteTit', v).value.trim() || null, bio: $('#hteBio', v).value.trim() || null, competences: lignes('#hteCo'), certifications: lignes('#hteCe'),
        formations: [...v.querySelectorAll('.hte-choix input:checked')].map(i => i.value), annees_experience: parseInt($('#hteExp', v).value) || null, linkedin: lienOk($('#hteLi', v).value),
        afficher_academy: $('#hteAc', v).checked, afficher_principal: $('#htePr', v).checked, actif: $('#hteVi', v).checked, photo_data: photo };
      const r = f.id ? await sb.from('site_formateurs').update(d).eq('id', f.id) : await sb.from('site_formateurs').insert(d);
      if (r.error) { $('#hteErr', v).textContent = r.error.message; return; }
      v.remove(); toast('✅ Formateur publié'); maj(); panneauFormateurs();
    };
    const s = $('#hteSup', v); if (s) s.onclick = async () => { if (!confirm('Supprimer ce formateur ?')) return; const r = await sb.from('site_formateurs').delete().eq('id', f.id); if (r.error) { $('#hteErr', v).textContent = r.error.message; return; } v.remove(); toast('Formateur supprimé'); maj(); panneauFormateurs(); };
  }
  // Partenaires et agréments
  async function panneauPartenaires() {
    const { data, error } = await sb.from('site_partenaires').select('*').order('ordre');
    if (error) return toast('❌ ' + error.message);
    const t = tiroir('Partenaires et agréments', (data || []).map(p => `<div class="hte-item">${p.logo_data ? `<img src="${esc(p.logo_data)}" alt="">` : '<span class="hte-vide">Sans logo</span>'}
      <div class="t"><b>${esc(p.nom)}</b><small>${esc(TYPES[p.type] || p.type)} · ${esc((p.sites || []).map(s => s === 'academy' ? 'Academy' : 'Principal').join(', '))}${p.actif ? '' : ' · masqué'}</small></div><button class="hte-btn o" data-id="${esc(p.id)}">Modifier</button></div>`).join('') || '<p>Aucun partenaire.</p>', '<button class="hte-btn p" data-n>+ Ajouter</button>');
    t.querySelector('[data-n]').onclick = () => formPartenaire(null);
    t.querySelectorAll('[data-id]').forEach(b => b.onclick = () => formPartenaire((data || []).find(x => x.id === b.dataset.id)));
  }
  function formPartenaire(p) {
    p = p || { type: 'partenaire', sites: [SITE], actif: true, ordre: 100 }; let logo = p.logo_data || null;
    const v = modal(`<h2>${p.id ? 'Modifier' : 'Ajouter'} un partenaire ou un agrément</h2>
      <label>Logo</label><img class="hte-apercu" id="hteLg" src="${esc(logo || '')}" alt="" ${logo ? '' : 'style="display:none"'}><input type="file" id="hteF" accept="image/jpeg,image/png">
      <label for="hteNom">Nom de la structure *</label><input id="hteNom" value="${esc(p.nom || '')}">
      <label for="hteTy">Type</label><select id="hteTy">${Object.entries(TYPES).map(([k, l]) => `<option value="${k}" ${k === p.type ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>
      <label for="hteLi">Lien vers leur site</label><input id="hteLi" value="${esc(p.lien || '')}" placeholder="https://www.exemple.ci">
      <label for="hteDe">Description (ex. « Centre agréé ATP pour la certification PMP® »)</label><textarea id="hteDe" style="min-height:60px">${esc(p.description || '')}</textarea>
      <label>Afficher sur</label><div class="hte-choix"><label><input type="checkbox" value="principal" ${(p.sites || []).includes('principal') ? 'checked' : ''}> Site principal</label><label><input type="checkbox" value="academy" ${(p.sites || []).includes('academy') ? 'checked' : ''}> H TECH ACADEMY</label></div>
      <label for="hteOr">Ordre d’affichage (petit = en premier)</label><input id="hteOr" type="number" value="${esc(p.ordre ?? 100)}">
      <label><input type="checkbox" id="hteVi" ${p.actif ? 'checked' : ''}> Visible sur le site</label>
      <div class="hte-err" id="hteErr"></div>
      <div class="hte-act">${p.id ? '<button class="hte-btn r" id="hteSup">Supprimer</button>' : ''}<button class="hte-btn o" id="hteAnn">Annuler</button><button class="hte-btn p" id="hteOk">Enregistrer et publier</button></div>`);
    $('#hteF', v).onchange = async e => { const file = e.target.files[0]; if (!file) return; logo = await vignette(file, 320); const i = $('#hteLg', v); i.src = logo; i.style.display = 'block'; };
    $('#hteAnn', v).onclick = () => v.remove();
    $('#hteOk', v).onclick = async () => {
      const nom = $('#hteNom', v).value.trim(); if (!nom) { $('#hteErr', v).textContent = 'Le nom est obligatoire.'; return; }
      const sites = [...v.querySelectorAll('.hte-choix input:checked')].map(i => i.value); if (!sites.length) { $('#hteErr', v).textContent = 'Choisissez au moins un site.'; return; }
      const brut = $('#hteLi', v).value.trim(), lien = lienOk(brut); if (brut && !lien) { $('#hteErr', v).textContent = 'Lien invalide.'; return; }
      const d = { nom, type: $('#hteTy', v).value, lien, description: $('#hteDe', v).value.trim() || null, sites, ordre: parseInt($('#hteOr', v).value) || 100, actif: $('#hteVi', v).checked, logo_data: logo };
      const r = p.id ? await sb.from('site_partenaires').update(d).eq('id', p.id) : await sb.from('site_partenaires').insert(d);
      if (r.error) { $('#hteErr', v).textContent = r.error.message; return; }
      v.remove(); toast('✅ Publié'); maj(); panneauPartenaires();
    };
    const s = $('#hteSup', v); if (s) s.onclick = async () => { if (!confirm('Supprimer ce partenaire ?')) return; const r = await sb.from('site_partenaires').delete().eq('id', p.id); if (r.error) { $('#hteErr', v).textContent = r.error.message; return; } v.remove(); toast('Supprimé'); maj(); panneauPartenaires(); };
  }
  // Images des formations (Academy)
  async function panneauImages() {
    CAT = null; const cat = await catalogue();
    const t = tiroir('Images des formations', cat.map(c => `<div class="hte-item">${c.image_data ? `<img src="${esc(c.image_data)}" alt="">` : '<span class="hte-vide">Sans image</span>'}
      <div class="t"><b>${esc(c.designation)}</b><small>${esc(c.reference)}</small></div><label class="hte-btn o" style="margin:0">Changer<input type="file" accept="image/jpeg,image/png" data-ref="${esc(c.reference)}" hidden></label></div>`).join('') || '<p>Catalogue indisponible.</p>');
    t.querySelectorAll('input[data-ref]').forEach(i => i.onchange = async e => {
      const file = e.target.files[0]; if (!file) return; const img = await vignette(file, 640);
      const r = await sb.from('produits').update({ image_data: img }).eq('reference', i.dataset.ref).select('id');
      if (r.error || !(r.data || []).length) return toast('❌ ' + (r.error ? r.error.message : 'Modification refusée'));
      toast('✅ Image publiée'); maj(); panneauImages();
    });
  }

  if (new URLSearchParams(location.search).has('edition')) init().catch(e => toast('❌ Mode édition indisponible : ' + e.message));
  window.htiOuvrirEdition = () => { const u = new URL(location.href); u.searchParams.set('edition', '1'); history.replaceState(null, '', u.pathname + u.search + u.hash); init().catch(e => toast('❌ ' + e.message)); };
})();
