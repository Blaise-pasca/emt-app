/* =====================================================================
   EMT – Adaptateur Supabase
   Fournit à l'application (app.js) les mêmes services que la version
   hébergée chez Claude : base de données temps réel, utilisateurs,
   téléchargements, IA, stockage des photos – mais sur votre Supabase.
   ===================================================================== */
(function () {
  'use strict';
  const C = window.EMT_CONFIG || {};
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const L = $('#login'), card = () => $('#lcard');
  const logo = () => { const i = document.querySelector('#logo img'); return i ? `<img class="sym" src="${i.src}" alt="">` : ''; };

  if (!window.supabase || !C.supabaseUrl || /VOTRE-PROJET/.test(C.supabaseUrl)) {
    card().innerHTML = `${logo()}<h2>Configuration requise</h2><p>Renseignez l'adresse et la clé de votre projet Supabase dans le fichier <b>config.js</b> (voir le guide d'installation).</p>`;
    return;
  }
  const sb = window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true } });
  window.EMT_STANDALONE = true;
  window.EMT_ASSET_BASE = C.supabaseUrl.replace(/\/$/, '') + '/storage/v1/object/public/photos/';

  /* ---------------- Erreurs ---------------- */
  const dbErr = e => {
    const m = (e && (e.message || e.details)) || 'erreur';
    if (e && (e.code === '42501' || /row-level security|permission denied/i.test(m))) return { code: 'invalid_argument', message: m };
    if (e && /quota|too large|payload/i.test(m)) return { code: 'quota_exceeded', message: m };
    return { code: 'unavailable', message: m };
  };

  /* ---------------- Cache + temps réel ---------------- */
  const cache = new Map();          // col -> Map(id -> data)
  const full = new Set();           // collections chargées entièrement
  const loading = new Map();        // col -> Promise
  const colSubs = new Map();        // col -> Set(fn)
  const docSubs = new Map();        // "col/id" -> Set(fn)
  const colMap = c => { if (!cache.has(c)) cache.set(c, new Map()); return cache.get(c); };
  const split = p => { const a = p.split('/'); return { col: a.slice(0, -1).join('/'), id: a[a.length - 1] }; };
  const meta = { fromCache: false, hasPendingWrites: false };
  const dsnap = (id, d) => ({ id, exists: d !== undefined, data: () => d, metadata: meta });

  function notify(col, id) {
    (colSubs.get(col) || []).forEach(f => { try { f(); } catch (e) { console.error(e); } });
    (docSubs.get(col + '/' + id) || []).forEach(f => { try { f(); } catch (e) { console.error(e); } });
  }
  function putLocal(col, id, data) { colMap(col).set(id, data); notify(col, id); }
  function delLocal(col, id) { colMap(col).delete(id); notify(col, id); }

  async function loadAll(col) {
    if (full.has(col)) return;
    if (loading.has(col)) return loading.get(col);
    const p = (async () => {
      const m = colMap(col), step = 1000;
      for (let from = 0; ; from += step) {
        const { data, error } = await sb.from('docs').select('id,data').eq('col', col).range(from, from + step - 1);
        if (error) throw dbErr(error);
        data.forEach(r => m.set(r.id, r.data));
        if (data.length < step) break;
      }
      full.add(col);
      if (started && LD.t) { LD.n++; setProg(50 + 45 * (1 - Math.exp(-LD.n / 6)), null, 97); }
    })();
    loading.set(col, p);
    try { await p; } finally { loading.delete(col); }
  }
  async function loadSome(col, q) {
    let r = sb.from('docs').select('id,data').eq('col', col);
    q.filters.forEach(([f, op, v]) => { r = applyFilter(r, f, op, v); });
    if (q.order) r = r.order('data->>' + q.order[0], { ascending: q.order[1] !== 'desc' });
    if (q.lim) r = r.limit(q.lim);
    const { data, error } = await r;
    if (error) throw dbErr(error);
    const m = colMap(col); data.forEach(x => m.set(x.id, x.data));
    return data;
  }
  function applyFilter(r, f, op, v) {
    const k = 'data->>' + f;
    switch (op) {
      case '==': return r.eq(k, String(v)); case '!=': return r.neq(k, String(v));
      case '<': return r.lt(k, String(v)); case '<=': return r.lte(k, String(v));
      case '>': return r.gt(k, String(v)); case '>=': return r.gte(k, String(v));
      case 'in': return r.in(k, v.map(String));
      default: return r;
    }
  }
  function test(d, f, op, v) {
    const x = d ? d[f] : undefined;
    switch (op) {
      case '==': return x === v; case '!=': return x !== v; case '<': return x < v; case '<=': return x <= v;
      case '>': return x > v; case '>=': return x >= v; case 'in': return v.includes(x); case 'not-in': return !v.includes(x);
      case 'array-contains': return Array.isArray(x) && x.includes(v); default: return true;
    }
  }
  function view(col, q) {
    let rows = [...colMap(col).entries()].filter(([, d]) => q.filters.every(([f, op, v]) => test(d, f, op, v)));
    if (q.order) { const [f, dir] = q.order; rows.sort((a, b) => String(a[1][f] ?? '').localeCompare(String(b[1][f] ?? '')) * (dir === 'desc' ? -1 : 1)); }
    else rows.sort((a, b) => a[0].localeCompare(b[0]));
    if (q.lim) rows = rows.slice(0, q.lim);
    const docs = rows.map(([id, d]) => dsnap(id, d));
    return { docs, size: docs.length, empty: !docs.length, metadata: meta, docChanges: () => [] };
  }

  let channel = null;
  function startRealtime() {
    if (channel) return;
    channel = sb.channel('emt-docs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'docs' }, p => {
        if (p.eventType === 'DELETE') { const o = p.old || {}; if (o.col && o.id) delLocal(o.col, o.id); }
        else { const n = p.new || {}; if (n.col && n.id) putLocal(n.col, n.id, n.data); }
      })
      .subscribe();
    // Rattrapage après une coupure réseau ou un retour sur l'onglet
    let last = Date.now();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && Date.now() - last > 60000) {
        last = Date.now();
        [...full].forEach(c => { full.delete(c); const keep = colMap(c); keep.clear(); loadAll(c).then(() => notify(c, '')).catch(() => {}); });
      }
    });
  }

  function docRef(path) {
    const { col, id } = split(path);
    return {
      id, path,
      async get() {
        const { data, error } = await sb.from('docs').select('data').eq('col', col).eq('id', id).maybeSingle();
        if (error) throw dbErr(error);
        if (data) colMap(col).set(id, data.data); else colMap(col).delete(id);
        return dsnap(id, data ? data.data : undefined);
      },
      async set(d) {
        const data = JSON.parse(JSON.stringify(d));
        const { error } = await sb.from('docs').upsert({ col, id, data });
        if (error) throw dbErr(error);
        putLocal(col, id, data);
      },
      async update(d) {
        const cur = colMap(col).get(id) ?? (await this.get()).data();
        if (cur === undefined) throw { code: 'invalid_argument', message: 'document absent' };
        const merge = (a, b) => { const o = { ...a }; for (const k in b) o[k] = (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object') ? merge(a[k], b[k]) : b[k]; return o; };
        return this.set(merge(cur, d));
      },
      async delete() {
        const { error } = await sb.from('docs').delete().eq('col', col).eq('id', id);
        if (error) throw dbErr(error);
        delLocal(col, id);
      },
      async acquire() { return { acquired: true }; },
      onSnapshot(next, err) {
        const key = col + '/' + id, fn = () => next(dsnap(id, colMap(col).get(id)));
        if (!docSubs.has(key)) docSubs.set(key, new Set());
        docSubs.get(key).add(fn); startRealtime();
        this.get().then(fn).catch(e => err && err(e));
        return () => docSubs.get(key).delete(fn);
      },
      collection(sub) { return colRef(path + '/' + sub); }
    };
  }
  function colRef(col, q = { filters: [], order: null, lim: 0 }) {
    const self = {
      path: col,
      where: (f, op, v) => colRef(col, { ...q, filters: q.filters.concat([[f, op, v]]) }),
      orderBy: (f, dir) => colRef(col, { ...q, order: [f, dir || 'asc'] }),
      limit: n => colRef(col, { ...q, lim: n }),
      doc: id => docRef(col + '/' + (id || (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '').slice(0, 20) : Date.now().toString(36) + Math.random().toString(36).slice(2, 10)))),
      async add(d) { const r = self.doc(); await r.set(d); return r; },
      async get() { if (q.order || q.lim || q.filters.length) await loadSome(col, q); else await loadAll(col); return view(col, q); },
      onSnapshot(next, err) {
        const fn = () => next(view(col, q));
        if (!colSubs.has(col)) colSubs.set(col, new Set());
        colSubs.get(col).add(fn); startRealtime();
        (q.order || q.lim ? loadSome(col, q) : loadAll(col)).then(fn).catch(e => err && err(e));
        return () => colSubs.get(col).delete(fn);
      }
    };
    return self;
  }
  const DB = { doc: docRef, collection: c => colRef(c) };

  /* ---------------- Utilisateur ---------------- */
  let session = null, profile = null;
  const initialsAvatar = (name, color) => {
    const t = (name || '?').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="32" fill="${color}"/><text x="32" y="41" font-family="Arial" font-size="24" fill="#fff" text-anchor="middle">${esc(t)}</text></svg>`);
  };
  const colorOf = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return `hsl(${h} 45% 45%)`; };
  const pcache = {};
  const USER = {
    async me() {
      const id = session.user.id, name = profile.nom || session.user.email || '';
      return { id, name, avatarUrl: initialsAvatar(name, colorOf(id)), color: colorOf(id), email: session.user.email || null,
        isOwner: profile.role === 'admin', canEdit: profile.role === 'admin', role: profile.role, memberId: profile.member_id || null };
    },
    async id() { return session.user.id; },
    async isOwner() { return profile.role === 'admin'; },
    async canEdit() { return profile.role === 'admin'; },
    async can() { return null; },
    async name() { return profile.nom || ''; },
    async profiles(ids) {
      ids = [].concat(ids || []); const miss = ids.filter(i => !(i in pcache));
      if (miss.length) {
        const { data } = await sb.from('profiles').select('user_id,nom,email').in('user_id', miss.filter(i => /^[0-9a-f-]{36}$/i.test(i)));
        (data || []).forEach(p => pcache[p.user_id] = p);
        miss.forEach(i => { if (!(i in pcache)) pcache[i] = null; });
      }
      const o = {};
      ids.forEach(i => { const p = pcache[i]; const n = p ? (p.nom || p.email || '') : ''; o[i] = { id: i, name: n, avatarUrl: initialsAvatar(n || '?', colorOf(i)), color: colorOf(i), email: p ? p.email : null, isMe: i === session.user.id, guest: false }; });
      return o;
    },
    async search() { return []; }
  };

  /* ---------------- Téléchargements ---------------- */
  const DOWNLOADS = {
    async save({ filename, data }) {
      const blob = data instanceof Blob ? data : new Blob([data]);
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
      return { status: 'saved' };
    }
  };

  /* ---------------- Sauvegardes automatiques (espace privé « sauvegardes », administrateur seulement) ---------------- */
  window.EMT_BACKUP = {
    async upload(name, text) {
      const { error } = await sb.storage.from('sauvegardes').upload(name, new Blob([text], { type: 'application/json' }), { contentType: 'application/json', upsert: true });
      if (error) throw error;
      const { data } = await sb.storage.from('sauvegardes').list('', { limit: 100, sortBy: { column: 'name', order: 'desc' } });
      const old = (data || []).filter(f => /^sauvegarde-/.test(f.name)).slice(8).map(f => f.name);
      if (old.length) await sb.storage.from('sauvegardes').remove(old);
    },
    async list() { const { data, error } = await sb.storage.from('sauvegardes').list('', { limit: 100, sortBy: { column: 'name', order: 'desc' } }); if (error) throw error; return (data || []).filter(f => /\.json$/.test(f.name)); },
    async download(name) { const { data, error } = await sb.storage.from('sauvegardes').download(name); if (error) throw error; return await data.text(); }
  };

  /* ---------------- Appel des fonctions serveur (message d'erreur clair) ---------------- */
  async function invokeFn(name, body) {
    const { data, error } = await sb.functions.invoke(name, { body });
    if (!error && data && !data.error) return data;
    let m = data && data.error, st = 0;
    if (error && error.context) {
      st = error.context.status || 0;
      try { const j = await error.context.clone().json(); m = m || j.error || j.message || j.msg; } catch (e) { try { m = m || (await error.context.text()); } catch (x) {} }
    }
    if (st === 404 || /not found|NOT_FOUND/i.test(m || '')) m = `La fonction serveur « ${name} » n'est pas installée dans Supabase (Edge Functions).`;
    else if (st === 401 && !m) m = 'Session expirée : reconnectez-vous.';
    else if (!m && error && /fetch|network/i.test(error.message || '')) m = 'Impossible de joindre le serveur. Vérifiez votre connexion Internet.';
    throw { code: st === 403 ? 'not_granted' : 'upstream_error', message: m || (error && error.message) || 'Service indisponible' };
  }

  /* ---------------- IA (fonction serveur « ai ») ---------------- */
  async function callAI(input, opts = {}, json = false) {
    const messages = typeof input === 'string' ? [{ role: 'user', content: input }] : input;
    const data = await invokeFn('ai', { messages, tier: opts.modelTier || 'default', json });
    return data.text || '';
  }
  const SAMPLE = async (input, opts = {}) => {
    const text = await callAI(input, opts, false);
    if (opts.onText) try { opts.onText({ text, delta: text }); } catch (e) {}
    return { text, truncated: false };
  };
  SAMPLE.json = async (input, opts = {}) => {
    const t = await callAI(input, opts, true);
    try { return JSON.parse(t); } catch (e) {}
    const f = t.match(/```(?:json)?\s*([\s\S]*?)```/); if (f) try { return JSON.parse(f[1]); } catch (e) {}
    const a = Math.min(...['{', '['].map(c => t.indexOf(c)).filter(i => i >= 0)), b = Math.max(t.lastIndexOf('}'), t.lastIndexOf(']'));
    if (a >= 0 && b > a) try { return JSON.parse(t.slice(a, b + 1)); } catch (e) {}
    throw { code: 'invalid_json', message: 'Réponse illisible', text: t };
  };
  SAMPLE.limits = async () => ({ maxPromptBytes: 262144 });

  /* ---------------- Photos (stockage Supabase) ---------------- */
  const ASSETS = {
    async upload(blob, o = {}) {
      const type = o.type || blob.type || 'image/jpeg', ext = (type.split('/')[1] || 'bin').replace('jpeg', 'jpg');
      const path = new Date().toISOString().slice(0, 7) + '/' + (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2)) + '.' + ext;
      const { error } = await sb.storage.from('photos').upload(path, blob, { contentType: type, upsert: false });
      if (error) throw { code: /row-level|unauthorized|permission/i.test(error.message) ? 'not_granted' : /size|large/i.test(error.message) ? 'too_large' : 'upstream_error', message: error.message };
      return { id: path, url: window.EMT_ASSET_BASE + path, sizeBytes: blob.size, contentType: type };
    },
    async delete(id) { const { error } = await sb.storage.from('photos').remove([id]); if (error) throw { code: 'upstream_error', message: error.message }; return { deleted: true }; },
    async list() { return { assets: [], usage: {} }; }
  };

  /* ---------------- API propre à la version autonome ---------------- */
  window.EMT_API = {
    async signOut() { await sb.auth.signOut(); location.hash = ''; location.reload(); },
    async checkPassword(pwd) { const { error } = await sb.auth.signInWithPassword({ email: session.user.email, password: pwd }); return !error; },
    async send(canal, messages) {
      try { return await invokeFn('send-message', { canal, messages }); } catch (e) { throw new Error(e.message); }
    }
  };

  /* ---------------- Écran de connexion ---------------- */
  // Connexion par e-mail OU numéro de téléphone (sans e-mail : un identifiant interne est créé à partir du numéro).
  const IND = String(C.indicatif || '243'), TELDOM = C.telDomain || 'tel.emt-eglise.org';
  const GSVG = `<svg class="gico" width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>`;
  const isMail = v => /@/.test(v);
  const telDigits = v => { let d = String(v || '').replace(/[^\d+]/g, ''); if (!d) return ''; if (d[0] === '+') d = d.slice(1); else if (d.startsWith('00')) d = d.slice(2); else if (d[0] === '0') d = IND + d.slice(1); else if (d.length <= 9) d = IND + d; return /^\d{9,15}$/.test(d) ? d : ''; };
  const telMail = v => telDigits(v) + '@' + TELDOM;
  const isTelAccount = em => String(em || '').endsWith('@' + TELDOM);
  const showTel = d => '+' + d;
  const RK = 'emt_recent';
  const recents = () => { try { return JSON.parse(localStorage.getItem(RK) || '[]') } catch (e) { return [] } };
  const saveRecent = r => { try { const l = recents().filter(x => x.id !== r.id); l.unshift(r); localStorage.setItem(RK, JSON.stringify(l.slice(0, 3))) } catch (e) {} };
  const forgetRecent = id => { try { localStorage.setItem(RK, JSON.stringify(recents().filter(x => x.id !== id))) } catch (e) {} };
  const initials = n => String(n || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
  let mode = 'login', msg = '', ok = '', ident = '', pending = null;
  const eye = `<button type="button" class="leye" tabindex="-1" aria-label="Afficher le mot de passe">👁</button>`;
  const pwdField = (ac, ph, min) => `<div class="lpw"><input class="lin" id="lpwd" name="password" type="password" placeholder="${ph}" autocomplete="${ac}" ${min ? 'minlength="8"' : ''} required>${eye}</div><div class="lcaps">Majuscules activées</div>`;
  function googleSignIn(hint) {
    return (async () => {
      msg = ok = '';
      try { const r = await fetch(C.supabaseUrl + '/auth/v1/settings', { headers: { apikey: C.supabaseAnonKey } }); const j = await r.json(); if (j && j.external && j.external.google === false) { msg = "La connexion avec Google n'est pas encore activée. Utilisez votre téléphone ou votre e-mail avec un mot de passe."; drawLogin(); return; } } catch (e) {}
      try { sessionStorage.setItem('emt_via', 'google') } catch (e) {}
      const q = hint ? { login_hint: hint } : { prompt: 'select_account' };
      const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin, queryParams: q } });
      if (error) { msg = error.message; drawLogin(); }
    })();
  }
  function drawLogin() {
    L.classList.remove('hide');
    const R = recents();
    let f = '';
    if (mode === 'login') {
      const rec = R.length ? `<div class="lrec"><div class="lrt">Comptes utilisés sur cet appareil</div>${R.map((r, i) => `<div class="lacc" data-ri="${i}"><span class="lav">${esc(initials(r.nom))}</span><span class="lai"><b>${esc(r.nom || r.label)}</b><small>${r.method === 'google' ? 'Google · ' : ''}${esc(r.label)}</small></span><button type="button" class="lx" data-rx="${i}" aria-label="Retirer">×</button></div>`).join('')}<div class="lsep"><span></span>ou un autre compte<span></span></div></div>` : '';
      f = `${rec}<input class="lin" id="lid" name="username" type="text" inputmode="email" placeholder="Téléphone ou e-mail" autocomplete="username" autocapitalize="off" spellcheck="false" value="${esc(ident)}" required>${pwdField('current-password', 'Mot de passe')}
      <div class="lerr">${esc(msg)}</div><div class="lok">${esc(ok)}</div><button class="lbtn">Se connecter</button>
      <div class="lsep"><span></span>ou<span></span></div><button type="button" class="lbtn lg" id="gBtn">${GSVG}Continuer avec Google</button>
      <button type="button" class="lbtn" data-m="signup" style="margin-top:10px">Créer un compte</button><button type="button" class="llink" data-m="forgot">Mot de passe oublié ?</button>`;
    } else if (mode === 'signup') {
      f = `<input class="lin" name="name" placeholder="Nom complet" autocomplete="name" required><input class="lin" id="ltel" name="tel" type="tel" inputmode="tel" placeholder="Téléphone (ex. 0991234567)" autocomplete="tel" required>
      <input class="lin" name="email" type="email" placeholder="E-mail (facultatif)" autocomplete="email"><div class="lhint">Sans e-mail, vous vous connecterez avec votre numéro de téléphone.</div>
      <input type="text" name="username" autocomplete="username" id="luser" class="lhid" tabindex="-1" aria-hidden="true">${pwdField('new-password', 'Mot de passe (8 caractères min.)', 1)}<div class="lstr"><i></i></div>
      <div class="lerr">${esc(msg)}</div><div class="lok">${esc(ok)}</div><button class="lbtn">Créer mon compte</button>
      <div class="lsep"><span></span>ou<span></span></div><button type="button" class="lbtn lg" id="gBtn">${GSVG}Continuer avec Google</button>
      <button type="button" class="llink" data-m="login">J'ai déjà un compte : se connecter</button>`;
    } else if (mode === 'forgot') {
      f = `<p>Inscrit avec un e-mail : recevez un lien pour choisir un nouveau mot de passe.<br>Inscrit avec un numéro de téléphone : demandez à l'administrateur de l'église.</p><input class="lin" name="email" type="email" placeholder="Adresse e-mail" autocomplete="email" required><div class="lerr">${esc(msg)}</div><div class="lok">${esc(ok)}</div><button class="lbtn">Envoyer le lien</button><button type="button" class="llink" data-m="login">Retour</button>`;
    } else if (mode === 'reset') f = `<p>Choisissez votre nouveau mot de passe.</p><input type="text" name="username" autocomplete="username" class="lhid" tabindex="-1" aria-hidden="true" value="${esc(session && session.user ? session.user.email : '')}">${pwdField('new-password', 'Nouveau mot de passe', 1)}<div class="lerr">${esc(msg)}</div><button class="lbtn">Enregistrer</button>`;
    card().innerHTML = `${logo()}<div class="cn">${esc(C.nomEglise || 'Gestion de l\'église')}</div>${mode === 'login' ? '' : mode === 'signup' ? '<h2>Créer un compte</h2>' : '<h2>Mot de passe</h2>'}<form id="authForm" method="post" action="#">${f}</form><div class="lfoot">Le premier compte créé devient administrateur. Les suivants ont un espace fidèle ; l'administrateur leur attribue ensuite un rôle.</div>`;
    const F = $('#authForm');
    card().querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mode = b.dataset.m; msg = ok = ''; drawLogin(); });
    const gb = $('#gBtn'); if (gb) gb.onclick = () => { gb.disabled = true; googleSignIn(); };
    card().querySelectorAll('.leye').forEach(b => b.onclick = () => { const i = b.previousElementSibling; i.type = i.type === 'password' ? 'text' : 'password'; b.classList.toggle('on', i.type === 'text'); });
    const pw = $('#lpwd'), caps = card().querySelector('.lcaps');
    if (pw) { const ck = e => { if (caps && e.getModifierState) caps.classList.toggle('show', e.getModifierState('CapsLock')) }; pw.addEventListener('keyup', ck); pw.addEventListener('keydown', ck); }
    const str = card().querySelector('.lstr i');
    if (str && pw) pw.addEventListener('input', () => { const v = pw.value; let sc = (v.length >= 8) + (v.length >= 12) + /[A-Z]/.test(v) + /\d/.test(v) + /[^A-Za-z0-9]/.test(v); str.style.width = Math.min(100, sc * 20) + '%'; str.style.background = sc < 2 ? '#ff8a7a' : sc < 4 ? '#ffd166' : '#6ee7a8'; });
    const tel = $('#ltel'), em = F.elements.email, hu = $('#luser');
    if (hu) { const sy = () => { hu.value = (em && em.value.trim()) || (tel && telDigits(tel.value) ? '+' + telDigits(tel.value) : ''); }; tel && tel.addEventListener('input', sy); em && em.addEventListener('input', sy); }
    card().querySelectorAll('[data-rx]').forEach(b => b.onclick = e => { e.stopPropagation(); forgetRecent(R[+b.dataset.rx].id); drawLogin(); });
    card().querySelectorAll('[data-ri]').forEach(d => d.onclick = () => { const r = R[+d.dataset.ri]; if (r.method === 'google') { d.classList.add('busy'); googleSignIn(r.email); } else { ident = r.label; const i = $('#lid'); i.value = r.label; pw.value = ''; pw.focus(); msg = ''; } });
    const lid = $('#lid'); if (lid) lid.addEventListener('input', () => { lid.setAttribute('inputmode', /^[\d\s+().-]+$/.test(lid.value) && lid.value ? 'tel' : 'email'); });
    F.onsubmit = async e => {
      e.preventDefault(); const btn = F.querySelector('.lbtn'); btn.disabled = true; btn.classList.add('busy'); msg = ok = '';
      const v = n => (F.elements[n] ? F.elements[n].value.trim() : ''); const pwd = pw ? pw.value : '';
      try {
        if (mode === 'login') {
          const id = v('username'); ident = id; let email = id;
          if (!isMail(id)) { if (!telDigits(id)) { msg = 'Entrez votre numéro de téléphone (ex. 0991234567) ou votre adresse e-mail.'; } else email = telMail(id); }
          if (!msg) {
            const { error } = await sb.auth.signInWithPassword({ email, password: pwd });
            if (error) msg = /confirm/i.test(error.message) ? "Confirmez d'abord votre adresse e-mail (lien reçu par e-mail)." : isMail(id) ? 'E-mail ou mot de passe incorrect.' : 'Numéro ou mot de passe incorrect. Si vous vous êtes inscrit avec un e-mail, utilisez votre e-mail.';
            else pending = { label: isMail(id) ? id : showTel(telDigits(id)), method: 'password', id: email, pwd };
          }
        } else if (mode === 'signup') {
          const t = telDigits(v('tel')), mail = v('email');
          if (!t) msg = 'Numéro de téléphone invalide (ex. 0991234567).';
          else if (pwd.length < 8) msg = 'Le mot de passe doit avoir au moins 8 caractères.';
          else {
            const email = mail || telMail(t);
            const { data, error } = await sb.auth.signUp({ email, password: pwd, options: { data: { nom: v('name'), telephone: '+' + t, login: mail ? 'email' : 'telephone' }, emailRedirectTo: location.origin } });
            if (error) msg = /registered|already/i.test(error.message) ? (mail ? 'Un compte existe déjà avec cet e-mail. Connectez-vous.' : 'Un compte existe déjà avec ce numéro. Connectez-vous.') : /invalid/i.test(error.message) && !mail ? "L'inscription par téléphone n'est pas encore acceptée par le serveur. Ajoutez un e-mail ou prévenez l'administrateur." : error.message;
            else { pending = { label: mail || showTel(t), method: 'password', id: email, pwd }; if (!data.session) { ok = 'Compte créé ! Ouvrez le lien de confirmation reçu par e-mail, puis connectez-vous.'; ident = mail || showTel(t); mode = 'login'; } }
          }
        } else if (mode === 'forgot') { const { error } = await sb.auth.resetPasswordForEmail(v('email'), { redirectTo: location.origin }); if (error) msg = error.message; else ok = "Si ce compte existe, un e-mail vient d'être envoyé."; }
        else if (mode === 'reset') { const { error } = await sb.auth.updateUser({ password: pwd }); if (error) msg = error.message; else { mode = 'login'; ok = 'Mot de passe modifié.'; } }
      } catch (x) { msg = 'Connexion impossible. Vérifiez votre réseau.'; }
      if (!started && !starting) drawLogin();
    };
    // Proposer automatiquement un compte enregistré (Chrome / Android)
    if (mode === 'login' && !drawLogin.asked && navigator.credentials && window.PasswordCredential) {
      drawLogin.asked = true;
      navigator.credentials.get({ password: true, mediation: 'optional' }).then(c => { if (c && c.password && mode === 'login' && !started) { const i = $('#lid'), p = $('#lpwd'); if (i && p) { i.value = c.id; p.value = c.password; ok = ''; $('#authForm').requestSubmit ? $('#authForm').requestSubmit() : $('#authForm').querySelector('.lbtn').click(); } } }).catch(() => {});
    }
  }
  // Après connexion : mémoriser le compte sur cet appareil + l'enregistrer dans le gestionnaire de mots de passe
  function rememberAccount(s) {
    try {
      const u = s.user, prov = (u.app_metadata && u.app_metadata.provider) || 'email', md = u.user_metadata || {};
      const nom = (profile && profile.nom) || md.full_name || md.name || md.nom || '';
      if (prov === 'google') saveRecent({ id: 'g:' + u.email, method: 'google', email: u.email, label: u.email, nom });
      else { const lab = isTelAccount(u.email) ? showTel(u.email.split('@')[0]) : u.email; saveRecent({ id: u.email, method: 'password', label: lab, nom }); }
      if (pending && pending.pwd && window.PasswordCredential && navigator.credentials) navigator.credentials.store(new PasswordCredential({ id: pending.label, password: pending.pwd, name: nom || pending.label })).catch(() => {});
    } catch (e) {}
    pending = null;
  }

  /* ---------------- Écran de chargement (logo animé + barre de progression) ---------------- */
  const LD = { cur: 0, target: 0, cap: 0, t: null, n: 0 };
  function showLoader() {
    const i = document.querySelector('#logo img');
    card().innerHTML = `<div class="ldr"><div class="ldr-logo"><span class="ldr-ring"></span>${i ? `<img src="${i.src}" alt="">` : ''}</div>
      <div class="cn">${esc(C.nomEglise || "Gestion de l'église")}</div>
      <div class="ldr-bar"><i id="ldrBar"></i></div><div class="ldr-row"><span id="ldrTxt">Connexion…</span><b id="ldrPct">0 %</b></div></div>`;
    clearInterval(LD.t); LD.cur = 0;
    LD.t = setInterval(() => {
      if (LD.target < LD.cap) LD.target = Math.min(LD.cap, LD.target + 0.25); // avance doucement pour ne jamais paraître bloqué
      LD.cur += (LD.target - LD.cur) * 0.12;
      const b = document.getElementById('ldrBar'), p = document.getElementById('ldrPct');
      if (b) b.style.width = LD.cur.toFixed(1) + '%'; if (p) p.textContent = Math.round(LD.cur) + ' %';
    }, 60);
  }
  function setProg(v, txt, cap) {
    LD.target = Math.max(LD.target, v); LD.cap = Math.max(LD.target, cap || v);
    const t = document.getElementById('ldrTxt'); if (txt && t) t.textContent = txt;
  }
  // Attend que les premières données soient arrivées avant d'afficher l'application (10 s maximum)
  window.EMT_READY = () => new Promise(res => { const t0 = Date.now(); let calm = 0; const iv = setInterval(() => { calm = (LD.n > 0 && loading.size === 0) ? calm + 1 : 0; if (calm >= 3 || Date.now() - t0 > 10000) { clearInterval(iv); setProg(97, 'Préparation du tableau de bord…', 99); setTimeout(res, 350); } }, 120); });
  function endLoader() { setProg(100, 'Prêt !', 100); setTimeout(() => { clearInterval(LD.t); }, 900); }
  new MutationObserver(() => { if (started && L.classList.contains('hide')) endLoader(); }).observe(L, { attributes: true, attributeFilter: ['class'] });

  /* ---------------- Démarrage ---------------- */
  let started = false, starting = false;
  async function start(s) {
    if (started || starting || !s) return; starting = true; session = s;
    showLoader(); setProg(8, 'Vérification du compte…', 28);
    for (let i = 0; i < 5 && !profile; i++) {
      const { data } = await sb.from('profiles').select('*').eq('user_id', s.user.id).maybeSingle();
      profile = data; if (!profile) await new Promise(r => setTimeout(r, 800));
    }
    if (!profile) { starting = false; msg = 'Profil introuvable. Réessayez dans un instant.'; await sb.auth.signOut(); session = null; drawLogin(); return; }
    started = true; rememberAccount(s); setProg(30, 'Ouverture de l\'application…', 48);
    const caps = { db: DB, user: USER, downloads: DOWNLOADS, sample: SAMPLE, assets: ASSETS };
    window.claude = { use: async n => caps[n] || null };
    const sc = document.createElement('script'); sc.src = 'app.js?v=' + (C.version || '1') + '-' + Math.floor(Date.now() / 60000); sc.onload = () => setProg(50, 'Chargement des données…', 90); sc.onerror = () => { clearInterval(LD.t); card().innerHTML = `${logo()}<div class="cn">Impossible de charger l'application.</div><button class="lbtn" onclick="location.reload()">Réessayer</button>`; }; document.body.appendChild(sc);
  }
  sb.auth.onAuthStateChange((ev, s) => {
    if (ev === 'PASSWORD_RECOVERY') { mode = 'reset'; drawLogin(); return; }
    if (ev === 'SIGNED_OUT' && started) location.reload();
    if (s && mode !== 'reset') start(s);
  });
  sb.auth.getSession().then(({ data }) => { if (data.session && mode !== 'reset') start(data.session); else if (!started) drawLogin(); });
})();
