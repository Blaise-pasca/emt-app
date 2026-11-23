
/* ---------- utilitaires ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today=()=>iso(new Date());
const parse=s=>{const[y,m,d]=String(s).split('-').map(Number);return new Date(y,(m||1)-1,d||1)};
const fdate=s=>s?parse(s).toLocaleDateString(LOC(),{day:'numeric',month:'short',year:'numeric'}):'';
const fday=s=>s?parse(s).toLocaleDateString(LOC(),{weekday:'short',day:'numeric',month:'short'}):'';
const money=(n,c)=>(Number(n)||0).toLocaleString('fr-FR',{maximumFractionDigits:2})+(c==='USD'?' $':' FC');
const JOURS=['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
const num=v=>Number(v)||0;
const monthLabel=m=>m?parse(m+'-01').toLocaleDateString(LOC(),{month:'long',year:'numeric'}):'';

/* ---------- configuration par défaut ---------- */
const DEF={
  nom:"Église Missionnaire Témoignage",sigle:"EMT",pasteur:"Vivien MWELA",adresse:"",ville:"",telephone:"",taux:2800,
  fonds:["Caisse générale","Compte achat parcelle"],
  comptes:["Caisse (espèces)","Banque","Mobile money"],
  catEntrees:["Dîme","Offrande","Action de grâce","Don","Contribution parcelle","Autre entrée"],
  catSorties:["Loyer","Électricité / eau","Transport","Social / assistance","Matériel / sono","Entretien","Achat parcelle","Évangélisation / mission","Honoraires","Autre sortie"],
  programmes:[
    {titre:"Culte du dimanche",jour:0,debut:"09:00",fin:"11:30"},
    {titre:"École du dimanche",jour:0,debut:"10:00",fin:"11:00"},
    {titre:"École de prière",jour:4,debut:"16:00",fin:"18:30"},
    {titre:"Louange & adoration (chorale)",jour:6,debut:"",fin:""}
  ]
};
const STATUTS=["Membre actif","Nouveau converti","Visiteur","Inactif","Parti(e)"];
const FONCTIONS=["Fidèle","Pasteur","Ancien","Diacre","Diaconesse","Évangéliste","Responsable de département","Ouvrier","Choriste","Moniteur (école du dimanche)"];
const CAT_EVT=["Culte spécial","Réunion","Conférence / séminaire","Mariage","Baptême","Présentation d'enfant","Deuil / funérailles","Évangélisation","Sortie / retraite","Autre"];
const TYPES_SUIVI=["Visite à domicile","Appel téléphonique","Nouveau converti","Malade","Demande de prière","Absent répété","Autre"];
const STAT_SUIVI=["À faire","En cours","Terminé"];

/* ---------- état ---------- */
const COLS=['members','groups','events','attendance','followups','transactions','budgets','rapprochements','commlog','bulletins','plans','songs','lots','campagnes','checkins','indispos','inscriptions','reservations','biens','formulaires','reponses','sondages','votes','rdv','medias','albums','photos','articles','mouvements','comptages'];
const S={members:[],groups:[],events:[],attendance:[],followups:[],transactions:[],budgets:[],rapprochements:[],commlog:[],bulletins:[],plans:[],songs:[],lots:[],campagnes:[],checkins:[],indispos:[],inscriptions:[],reservations:[],biens:[],formulaires:[],reponses:[],sondages:[],votes:[],rdv:[],medias:[],albums:[],photos:[],articles:[],mouvements:[],comptages:[],journal:[],chat:[],chatLocal:{},config:{},people:[],roles:{}};
const now=new Date();
const UI={q:'',fstat:'',cal:new Date(now.getFullYear(),now.getMonth(),1),finMonth:today().slice(0,7),finFund:'',repMonth:today().slice(0,7),fu:'ouverts',finTab:'ops',finCompte:'',finProj:'',budYear:String(now.getFullYear()),rcCompte:'',rcDev:'CDF',rcDate:today(),rcSolde:'',etYear:String(now.getFullYear()),etPer:'annee',comTab:'messages',aud:'actifs',audSel:[],canal:'whatsapp',msg:'',sent:{},bul:null,chat:'general',chatDraft:'',mf:{sexe:'',statut:'',fonction:'',groupe:'',ageMin:'',ageMax:'',etatCivil:'',baptise:'',anniv:'',present30:'',famille:'',arrDu:'',arrAu:''},crN:'12',crF:{statut:'',sexe:'',groupe:''},showF:0,aiQ:'',aiMsg:'',aiBusy:0,aiBusy3:0,mView:'liste',lastList:[],pTab:'comptage',ckDate:today(),ckCulte:'Culte du dimanche',ckQ:'',ckF:'tous',ckGrp:'',borne:null,cTab:'plans',plan:null,songQ:'',eqMonth:today().slice(0,7),dTab:'lots',lot:null,relYear:String(now.getFullYear()),rTab:'mensuel',album:null,upBusy:0,iTab:'articles',invQ:'',invCat:'',mvtArt:'',comptInv:null,eTab:'inscr',evSel:null,resDate:today(),foTab:'forms',form:null,formResp:null,kio:null,rdvF:'avenir',mTab:'predic',medQ:'',aiBusy4:0,site:(()=>{try{return localStorage.getItem('emt_site')||''}catch(e){return''}})(),aiChat:[],aiDraft:'',aiBusy2:0};
let db=null,mode='loading';
const cfg=()=>{const c={...DEF,...S.config};['fonds','comptes','catEntrees','catSorties','programmes'].forEach(k=>{if(!Array.isArray(c[k])||!c[k].length)c[k]=DEF[k]});return c};
const fullName=m=>[m.nom,m.postnom,m.prenom].filter(Boolean).join(' ')||'(sans nom)';
const memberById=id=>S.members.find(m=>m.id===id);
const groupName=id=>(S.groups.find(g=>g.id===id)||{}).nom;
const initials=m=>((m.prenom||m.nom||'?')[0]+(m.nom&&m.prenom?m.nom[0]:'')).toUpperCase();
const hue=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))%360;return h};
const avatar=m=>`<div class="av" style="background:hsl(${hue(fullName(m))} 45% 48%)">${esc(initials(m))}</div>`;
const statutClass=s=>({"Membre actif":"b-membre","Visiteur":"b-visiteur","Nouveau converti":"b-nouveau","Inactif":"b-inactif","Parti(e)":"b-todo"}[s]||'');
const sortedMembers=()=>[...S.members].sort((a,b)=>fullName(a).localeCompare(fullName(b),'fr'));
const memberOptions=()=>[['','—']].concat(sortedMembers().map(m=>[m.id,fullName(m)]));
const attTotal=a=>num(a.hommes)+num(a.femmes)+num(a.enfants);

/* ---------- stockage ---------- */
function toast(msg,err){const t=$('#toast');t.textContent=msg;t.className='toast show'+(err?' err':'');clearTimeout(toast.t);toast.t=setTimeout(()=>t.className='toast',2600)}
function setBanner(msg,kind){const b=$('#banner');b.textContent=msg||'';b.className='banner'+(msg?' show '+(kind||'info'):'')}
function errMsg(e){if(e&&e.code==='invalid_argument')return"Vous n'avez pas le droit de modifier ces données.";if(e&&e.code==='quota_exceeded')return"Espace de stockage plein : supprimez d'anciens éléments.";return"Échec de l'enregistrement. Réessayez."}
async function save(col,obj){
  const {id,...data}=obj;data.updatedAt=new Date().toISOString();
  if(UI.site&&typeof SITECOLS!=='undefined'&&SITECOLS.includes(col)&&!data.site)data.site=UI.site;
  if(!id)data.createdAt=data.updatedAt;
  const isNew=!id||!S[col].some(x=>x.id===id),old=id?S[col].find(x=>x.id===id):null;
  if(db){try{const ref=id?db.collection(col).doc(id):db.collection(col).doc();await ref.set(data);journal(isNew?'create':'update',col,{id:ref.id,...data},old);return ref.id}catch(e){toast(errMsg(e),1);return false}}
  const nid=id||'l'+Date.now()+Math.random().toString(36).slice(2,6);
  const i=S[col].findIndex(x=>x.id===nid);if(i<0)S[col].push({id:nid,...data});else S[col][i]={id:nid,...data};
  journal(isNew?'create':'update',col,{id:nid,...data},old);render();return nid;
}
async function removeDoc(col,id){
  journal('delete',col,S[col].find(x=>x.id===id)||{});
  if(db){try{await db.collection(col).doc(id).delete();return true}catch(e){toast(errMsg(e),1);return false}}
  S[col]=S[col].filter(x=>x.id!==id);render();return true;
}
async function saveConfig(patch){
  const data={...S.config,...patch};
  if(db){try{await db.doc('config/main').set(data);return true}catch(e){toast(errMsg(e),1);return false}}
  S.config=data;render();return true;
}
let rq=0;function scheduleRender(){if(rq)return;rq=requestAnimationFrame(()=>{rq=0;render()})}
function subscribe(){
  const pending=new Set(COLS.concat('config'));
  setBanner('Chargement des données…','info');
  const timer=setTimeout(()=>{if(pending.size)setBanner("Les données ne sont pas encore joignables. Vérifiez la connexion ; l'affichage peut être incomplet.",'warn')},10000);
  const done=(k,meta)=>{if(meta&&meta.fromCache)return;pending.delete(k);if(!pending.size){clearTimeout(timer);setBanner('')}};
  const fail=k=>e=>{pending.delete(k);clearTimeout(timer);setBanner('Impossible de charger certaines données ('+(e&&e.code||'erreur')+').','warn')};
  for(const c of COLS)db.collection(c).onSnapshot(s=>{S[c]=s.docs.map(d=>({id:d.id,...d.data()}));applyFinLim();done(c,s.metadata);scheduleRender()},fail(c));
  db.doc('config/main').onSnapshot(s=>{S.config=s.exists?{...s.data()}:{};done('config',s.metadata);scheduleRender()},fail('config'));
  db.doc('acces/roles').onSnapshot(s=>{S.roles=s.exists?{...(s.data().roles||{})}:{};updateRole();scheduleRender()},()=>{});
  try{db.collection('journal').orderBy('at','desc').limit(500).onSnapshot(s=>{S.journal=s.docs.map(d=>({id:d.id,...d.data()}));scheduleRender()},()=>{})}catch(e){}
  db.collection('people').onSnapshot(s=>{S.people=s.docs.map(d=>({id:d.id,...d.data()}));scheduleRender()},()=>{});
}

/* ---------- modales et formulaires ---------- */
function modal(html){const m=$('#modal');m.innerHTML=`<div class="mbox">${html}</div>`;m.classList.add('open');m.scrollTop=0}
function closeModal(){const m=$('#modal');m.classList.remove('open');m.innerHTML=''}
function opt(o,v){if(o&&o.group)return`<optgroup label="${esc(o.group)}">${o.items.map(x=>opt(x,v)).join('')}</optgroup>`;const[val,lab]=Array.isArray(o)?o:[o,o];return`<option value="${esc(val)}"${String(v??'')===String(val)?' selected':''}>${esc(lab)}</option>`}
function field(f,v){
  let inp;
  if(f.type==='select')inp=`<select name="${f.k}">${f.options.map(o=>opt(o,v)).join('')}</select>`;
  else if(f.type==='textarea')inp=`<textarea name="${f.k}" rows="${f.rows||3}">${esc(v)}</textarea>`;
  else if(f.type==='checkbox')return`<div class="fld ${f.full?'full':''}"><label class="chk"><input type="checkbox" name="${f.k}"${v?' checked':''}> ${esc(f.label)}</label></div>`;
  else if(f.type==='multi')inp=f.options.length?`<div class="multi">${f.options.map(([val,lab])=>`<label><input type="checkbox" name="${f.k}" value="${esc(val)}"${(v||[]).includes(val)?' checked':''}> ${esc(lab)}</label>`).join('')}</div>`:`<div class="muted small">${esc(f.empty||'Aucun choix disponible')}</div>`;
  else if(f.list)inp=`<input name="${f.k}" value="${esc(v)}" list="dl_${f.k}" autocomplete="off"><datalist id="dl_${f.k}">${f.list.map(x=>`<option value="${esc(x)}">`).join('')}</datalist>`;
  else inp=`<input type="${f.type||'text'}" name="${f.k}" value="${esc(v)}"${f.type==='number'?' step="any" inputmode="decimal"':''}${f.req?' required':''}${f.ph?` placeholder="${esc(f.ph)}"`:''}>`;
  return`<div class="fld ${f.full?'full':''}"><label>${esc(f.label)}${f.req?' *':''}</label>${inp}</div>`;
}
function readForm(form,fields){
  const o={};
  for(const f of fields){
    const el=form.elements.namedItem(f.k);
    if(f.type==='checkbox')o[f.k]=!!(el&&el.checked);
    else if(f.type==='multi')o[f.k]=[...form.querySelectorAll(`input[name="${f.k}"]:checked`)].map(i=>i.value);
    else if(f.type==='number')o[f.k]=el.value===''?'':Number(el.value);
    else o[f.k]=(el&&el.value||'').trim();
  }
  return o;
}
function openForm({title,fields,values={},onSave,onDelete,extra=[]}){
  modal(`<form id="mform" novalidate><div class="mhead"><h3>${esc(title)}</h3><button type="button" class="x" data-act="close" aria-label="Fermer">×</button></div>
  <div class="fgrid">${fields.map(f=>field(f,values[f.k])).join('')}</div>
  <div class="mfoot">${onDelete?'<button type="button" class="btn danger" id="mdel">Supprimer</button>':''}${extra.map((x,i)=>`<button type="button" class="btn" id="mx${i}">${esc(x.label)}</button>`).join('')}<span class="sp"></span><button type="button" class="btn" data-act="close">Annuler</button><button class="btn primary" id="msave">Enregistrer</button></div></form>`);
  const form=$('#mform');
  form.onsubmit=async e=>{
    e.preventDefault();
    const miss=fields.find(f=>f.req&&!String(form.elements.namedItem(f.k).value).trim());
    if(miss){toast('Champ obligatoire : '+miss.label,1);form.elements.namedItem(miss.k).focus();return}
    const b=$('#msave');b.disabled=true;
    const ok=await onSave(readForm(form,fields));
    if(ok!==false)closeModal();else b.disabled=false;
  };
  if(onDelete)$('#mdel').onclick=()=>confirmBox('Supprimer définitivement cet élément ?',onDelete);
  extra.forEach((x,i)=>$('#mx'+i).onclick=x.fn);
}
function confirmBox(msg,yes,o={}){
  modal(`<div class="mhead"><h3>Confirmation</h3><button class="x" data-act="close">×</button></div><div class="mbody">${esc(msg)}</div><div class="mfoot"><span class="sp"></span><button class="btn" data-act="close">Annuler</button><button class="btn primary" id="cyes" style="background:${o.btn?'var(--brand)':'var(--bad)'};border-color:${o.btn?'var(--brand)':'var(--bad)'}">${esc(o.btn||'Supprimer')}</button></div>`);
  $('#cyes').onclick=async()=>{$('#cyes').disabled=true;const ok=await yes();if(ok!==false){closeModal();toast(o.done||'Supprimé')}};
}

/* ---------- calculs ---------- */
function dayItems(ds){
  const dt=parse(ds),res=[];
  cfg().programmes.forEach(p=>{if(+p.jour===dt.getDay())res.push({kind:'prog',titre:p.titre,heure:p.debut,fin:p.fin})});
  S.rdv.filter(r=>r.date===ds&&r.statut!=='Annulé').forEach(r=>res.push({kind:'rdv',titre:'RDV : '+(r.membreId?fullName(memberById(r.membreId)||{}):r.nom||'')+(r.motif?' ('+r.motif+')':''),heure:r.heure}));
  S.events.filter(e=>occurs(e,ds)).forEach(e=>res.push({kind:'event',titre:e.titre,heure:e.heure,fin:e.fin,id:e.id,lieu:e.lieu,categorie:e.categorie}));
  S.members.filter(m=>m.dateNaissance&&m.dateNaissance.slice(5)===ds.slice(5)).forEach(m=>res.push({kind:'bday',titre:'Anniversaire : '+fullName(m),id:m.id}));
  return res.sort((a,b)=>(a.heure||'99').localeCompare(b.heure||'99'));
}
function balances(){
  const b={};cfg().fonds.forEach(f=>b[f]={CDF:0,USD:0});
  S.transactions.filter(t=>t.type!=='transfert').forEach(t=>{const k=t.fonds||'Sans fonds';b[k]=b[k]||{CDF:0,USD:0};b[k][t.devise==='USD'?'USD':'CDF']+=((t.type==='sortie'||t.type==='pret')?-1:1)*num(t.montant)});
  return b;
}
function nextBon(type){
  const p=type==='sortie'?'S':type==='transfert'?'V':type==='pret'?'P':type==='rembpret'?'R':'E';let max=0;
  S.transactions.forEach(t=>{const m=String(t.numBon||'').match(new RegExp('^'+p+'-(\\d+)$'));if(m)max=Math.max(max,+m[1])});
  return p+'-'+String(max+1).padStart(4,'0');
}
function sumBy(list,keyFn){const o={};list.forEach(t=>{const k=keyFn(t);o[k]=o[k]||{CDF:0,USD:0};o[k][t.devise==='USD'?'USD':'CDF']+=num(t.montant)});return o}
const both=o=>`${money(o.CDF,'CDF')}<br><span class="muted">${money(o.USD,'USD')}</span>`;

/* ---------- icônes et navigation ---------- */
const IC={
 dashboard:'<path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-5"/>',
 communication:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/>',
 evenements:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4"/>',
 formulaires:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
 rdv:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 mediatheque:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/>',
 album:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/>',
 inventaire:'<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/>',
 monespace:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
 projets:'<path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6"/>',
 aide:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17h.01"/>',
 culte:'<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
 dons:'<circle cx="9" cy="9" r="5"/><path d="M14.5 6.5a5 5 0 1 1-6 9"/>',
 membres:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
 groupes:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M15.5 20c0-2.6 1.4-4.5 4-4.5"/>',
 calendrier:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
 presences:'<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/>',
 suivis:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',
 finances:'<rect x="2" y="6" width="20" height="13" rx="2"/><circle cx="12" cy="12.5" r="3"/><path d="M6 10v5M18 10v5"/>',
 rapports:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
 parametres:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1"/>'
};
const NAV=[['monespace','Mon espace'],['dashboard','Tableau de bord'],['membres','Membres'],['groupes','Groupes & départements'],['communication','Communication'],['culte','Culte & bénévoles'],['evenements','Événements & salles'],['calendrier','Calendrier'],['presences','Présences'],['suivis','Suivis pastoraux'],['rdv','Rendez-vous'],['dons','Dons'],['projets','Projets & collectes'],['finances','Finances'],['formulaires','Formulaires & votes'],['mediatheque','Médiathèque'],['album','Album photo'],['inventaire','Inventaire'],['rapports','Rapports'],['parametres','Paramètres'],['aide','Aide']];
const route=()=>{const h=location.hash.slice(1);return NAV.some(n=>n[0]===h)&&allowed(h)?h:(allowed('dashboard')?'dashboard':'monespace')};

/* ---------- vues ---------- */
function vDashboardOld(){
  const c=cfg(),m=S.members,mois=today().slice(0,7);
  const actifs=m.filter(x=>x.statut==='Membre actif'||!x.statut).length;
  const nouveaux=m.filter(x=>(x.dateAdhesion||String(x.createdAt||'')).slice(0,7)===mois).length;
  const att=[...S.attendance].sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  const last4=att.slice(-4);const moy=last4.length?Math.round(last4.reduce((s,a)=>s+attTotal(a),0)/last4.length):0;
  const bal=balances(),g=bal[c.fonds[0]]||{CDF:0,USD:0};
  const up=[];for(let i=0;i<7;i++){const d=new Date();d.setDate(d.getDate()+i);const ds=iso(d);dayItems(ds).forEach(x=>up.push({...x,ds}))}
  const bdays=m.filter(x=>x.dateNaissance&&x.dateNaissance.slice(5,7)===mois.slice(5)).sort((a,b)=>a.dateNaissance.slice(8).localeCompare(b.dateNaissance.slice(8)));
  const fu=S.followups.filter(f=>f.statut!=='Terminé').sort((a,b)=>(a.echeance||'9').localeCompare(b.echeance||'9'));
  const recent=att.slice(-8);
  return todayCard()+`<div class="grid4">
   <div class="card kpi"><div class="l">Membres actifs</div><div class="v">${actifs}</div><div class="s">${m.length} personnes enregistrées</div></div>
   <div class="card kpi"><div class="l">Nouveaux ce mois</div><div class="v">${nouveaux}</div><div class="s">${m.filter(x=>x.statut==='Visiteur').length} visiteurs au total</div></div>
   <div class="card kpi"><div class="l">Présence moyenne</div><div class="v">${moy}</div><div class="s">sur les ${last4.length||0} derniers cultes</div></div>
   <div class="card kpi"><div class="l">${esc(c.fonds[0])}</div><div class="v" style="font-size:18px">${money(g.CDF,'CDF')}</div><div class="s">${money(g.USD,'USD')}</div></div>
  </div>
  <div class="grid2 sec">
   <div class="card"><h2>Les 7 prochains jours</h2>${up.length?`<div>${up.slice(0,10).map(x=>`<div style="display:flex;gap:10px;padding:6px 0;border-top:1px solid var(--bd)"><span class="pill k-${x.kind}" style="width:6px;padding:0;margin:0"></span><div style="flex:1;min-width:0"><div style="font-weight:600">${esc(x.titre)}</div><div class="muted small">${fday(x.ds)}${x.heure?' · '+esc(x.heure)+(x.fin?'–'+esc(x.fin):''):''}</div></div></div>`).join('')}</div>`:'<div class="muted">Rien de prévu.</div>'}</div>
   <div class="card"><h2>Fréquentation récente</h2>${recent.length?attChart(recent):'<div class="muted">Aucune présence enregistrée. Utilisez « Présences » après chaque culte.</div>'}</div>
  </div>
  <div class="grid2 sec">
   <div class="card"><h2>Suivis en attente (${fu.length})</h2>${fu.length?fu.slice(0,6).map(f=>`<div class="row" style="padding:8px 0" data-act="editFollow" data-id="${f.id}"><div class="grow"><div class="t">${esc(f.membreId?fullName(memberById(f.membreId)||{}):f.personne)} · ${esc(f.type)}</div><div class="st">${f.responsable?'Par '+esc(f.responsable)+' · ':''}${f.echeance?'Échéance '+fdate(f.echeance):''}</div></div><span class="badge ${f.statut==='En cours'?'b-encours':'b-todo'}">${esc(f.statut||'À faire')}</span></div>`).join(''):'<div class="muted">Aucun suivi en attente.</div>'}</div>
   <div class="card"><h2>Anniversaires du mois</h2>${bdays.length?bdays.map(b=>`<div class="row" style="padding:8px 0" data-act="viewMember" data-id="${b.id}">${avatar(b)}<div class="grow"><div class="t">${esc(fullName(b))}</div><div class="st">${parse(b.dateNaissance).toLocaleDateString(LOC(),{day:'numeric',month:'long'})}</div></div>${waLink(b.telephone)?`<a class="btn sm wa" target="_blank" rel="noopener" href="${esc(waLink(b.telephone,`Joyeux anniversaire ${b.prenom||b.nom||''} ! Que le Seigneur te bénisse abondamment en cette nouvelle année de vie. — ${c.nom}`))}">Souhaiter</a>`:''}</div>`).join(''):'<div class="muted">Aucun anniversaire ce mois-ci.</div>'}</div>
  </div>`;
}
function attChart(list){
  const W=340,H=150,pl=8,pb=22,pt=16,max=Math.max(...list.map(attTotal),1),bw=(W-pl*2)/list.length;
  return`<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Présences des derniers cultes">${list.map((a,i)=>{const v=attTotal(a),h=(H-pb-pt)*v/max,w=Math.min(bw*.64,34),x=pl+i*bw+(bw-w)/2,y=H-pb-h;return`<rect x="${x}" y="${y}" width="${w}" height="${Math.max(h,1)}" rx="3" fill="#1f3f75"><title>${esc(fdate(a.date))} : ${v}</title></rect><text x="${x+w/2}" y="${y-4}" text-anchor="middle" font-size="10" fill="#1b2a2e">${v}</text><text x="${x+w/2}" y="${H-7}" text-anchor="middle" font-size="9.5" fill="#6a7a7f">${a.date?a.date.slice(8)+'/'+a.date.slice(5,7):''}</text>`}).join('')}</svg></div>`;
}
function vMembresOld(){
  const q=UI.q.toLowerCase();
  const list=sortedMembers().filter(m=>(!UI.fstat||m.statut===UI.fstat)&&(!q||[fullName(m),m.telephone,m.email,m.adresse].join(' ').toLowerCase().includes(q)));
  return`<div class="toolbar"><input class="inp" id="q" data-bind="q" placeholder="Rechercher un nom, un téléphone…" value="${esc(UI.q)}" style="flex:1;min-width:180px">
   <select class="inp" data-bind="fstat"><option value="">Tous les statuts</option>${STATUTS.map(s=>opt(s,UI.fstat)).join('')}</select>
   <button class="btn" data-act="pdfMembres">PDF</button><button class="btn" data-act="cartesAll">🪪 Cartes</button><button class="btn" data-act="exportMembers">Excel</button><button class="btn primary" data-act="newMember">+ Ajouter</button></div>
  <div class="muted small" style="margin:0 0 8px">${list.length} personne(s)</div>
  <div class="list">${list.length?list.map(m=>`<div class="row" data-act="viewMember" data-id="${m.id}">${avatar(m)}<div class="grow"><div class="t">${esc(fullName(m))}</div><div class="st">${esc(m.telephone||m.email||'')}${m.fonction&&m.fonction!=='Fidèle'?' · '+esc(m.fonction):''}</div>${(m.groupes||[]).map(g=>groupName(g)?`<span class="chip">${esc(groupName(g))}</span>`:'').join('')}</div><span class="badge ${statutClass(m.statut)}">${esc(m.statut||'Membre actif')}</span></div>`).join(''):`<div class="empty">${S.members.length?'Aucun résultat.':'Aucun membre pour le moment. Cliquez sur « + Ajouter ».'}</div>`}</div>`;
}
function memberFields(){return[
  {k:'nom',label:'Nom',req:1},{k:'postnom',label:'Postnom'},{k:'prenom',label:'Prénom'},
  {k:'sexe',label:'Sexe',type:'select',options:[['','—'],['M','Homme'],['F','Femme']]},
  {k:'dateNaissance',label:'Date de naissance',type:'date'},{k:'etatCivil',label:'État civil',type:'select',options:['','Célibataire','Marié(e)','Veuf / veuve','Divorcé(e)']},
  {k:'telephone',label:'Téléphone',type:'tel'},{k:'email',label:'E-mail',type:'email'},
  {k:'adresse',label:'Adresse (quartier, commune)',full:1},{k:'profession',label:'Profession'},
  {k:'statut',label:'Statut',type:'select',options:STATUTS},{k:'fonction',label:'Fonction dans l\'église',type:'select',options:FONCTIONS},
  {k:'dateAdhesion',label:'Date d\'arrivée / adhésion',type:'date'},{k:'dateDepart',label:'Date de départ (si parti)',type:'date'},{k:'motifDepart',label:'Motif du départ',type:'select',options:['',...MOTIFS_DEPART]},{k:'destination',label:'Nouvelle ville / église'},
  {k:'baptise',label:'Baptisé(e) par immersion',type:'checkbox'},{k:'dateBapteme',label:'Date du baptême',type:'date'},
  ...(sites().length>1?[{k:'site',label:'Site / antenne',type:'select',options:sites()}]:[]),
  {k:'famille',label:'Famille / foyer',ph:'ex. Famille MWELA'},{k:'lienFamille',label:'Lien dans la famille',type:'select',options:['','Chef de famille','Conjoint(e)','Enfant','Parent','Autre']},
  {k:'dateMariage',label:'Date de mariage',type:'date'},
  {k:'groupes',label:'Groupes / départements',type:'multi',full:1,options:S.groups.map(g=>[g.id,g.nom]),empty:'Créez d\'abord des groupes dans « Groupes & départements ».'},
  {k:'notes',label:'Notes',type:'textarea',full:1}
]}
function memberForm(m){
  openForm({title:m?'Modifier la fiche':'Nouvelle personne',fields:memberFields(),values:m||{statut:'Membre actif',fonction:'Fidèle',dateAdhesion:today()},
    onSave:async d=>{const id=await save('members',{...(m||{}),...d});if(id){toast('Fiche enregistrée');if(!m){await accueilAuto({...d,id});setTimeout(()=>viewMember(id),120)}}return id},
    onDelete:m?()=>removeDoc('members',m.id):null});
}
function viewMember(id){
  const m=memberById(id);if(!m)return;
  const tx=S.transactions.filter(t=>t.membreId===id).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const tot=sumBy(tx.filter(isIn),()=>'all').all||{CDF:0,USD:0};
  const kv=(k,v)=>v?`<dt>${k}</dt><dd>${v}</dd>`:'';
  modal(`<div class="mhead">${avatar(m)}<h3 style="margin-left:10px">${esc(fullName(m))}</h3><button class="x" data-act="close">×</button></div>
  <div class="mbody"><dl class="kv">
   ${kv('Statut',`<span class="badge ${statutClass(m.statut)}">${esc(m.statut||'Membre actif')}</span>`)}${kv('Fonction',esc(m.fonction))}
   ${kv('Sexe',m.sexe==='M'?'Homme':m.sexe==='F'?'Femme':'')}${kv('Naissance',fdate(m.dateNaissance))}${kv('État civil',esc(m.etatCivil))}
   ${kv('Téléphone',esc(m.telephone))}${kv('E-mail',esc(m.email))}${kv('Adresse',esc(m.adresse))}${kv('Profession',esc(m.profession))}
   ${kv('Âge',ageOf(m)!==null?ageOf(m)+' ans':'')}${kv('Famille',m.famille?esc(m.famille)+(m.lienFamille?' ('+esc(m.lienFamille)+')':''):'')}${kv('Mariage',fdate(m.dateMariage))}${kv('Présences (90 j)',S.checkins.length?String(S.checkins.filter(c=>c.date>=iso(new Date(Date.now()-90*864e5))&&(c.presents||{})[m.id]).length):'')}${kv('Adhésion',fdate(m.dateAdhesion))}${isGone(m)?kv('Départ','<b class="neg">'+fdate(m.dateDepart)+'</b>'+(m.motifDepart?' · '+esc(m.motifDepart):'')+(m.destination?' → '+esc(m.destination):'')):''}${kv('Retour',fdate(m.dateRetour))}${kv('Baptême',m.baptise?'Oui'+(m.dateBapteme?' – '+fdate(m.dateBapteme):''):'Non')}
   ${kv('Groupes',(m.groupes||[]).map(g=>groupName(g)?`<span class="chip">${esc(groupName(g))}</span>`:'').join(''))}${kv('Notes',esc(m.notes).replace(/\n/g,'<br>'))}
  </dl>
  <h2 style="font-size:14px;margin:18px 0 8px">Contributions (${tx.length})</h2>
  ${tx.length?`<div class="muted small" style="margin-bottom:6px">Total : ${money(tot.CDF,'CDF')} · ${money(tot.USD,'USD')}</div><table class="t"><tr><th>Date</th><th>Catégorie</th><th class="n">Montant</th></tr>${tx.slice(0,20).map(t=>`<tr><td>${fdate(t.date)}</td><td>${esc(t.categorie)}</td><td class="n">${money(t.montant,t.devise)}</td></tr>`).join('')}</table>`:'<div class="muted small">Aucune contribution liée à cette personne.</div>'}
  </div><div class="mfoot"><button class="btn" data-act="newFollowFor" data-id="${m.id}">+ Suivi</button>${isGone(m)?`<button class="btn ok" data-act="reintegrer" data-id="${m.id}">Réintégrer</button>`:`<button class="btn danger" data-act="departM" data-id="${m.id}">Départ</button>`}${waLink(m.telephone)?`<a class="btn wa" target="_blank" rel="noopener" href="${esc(waLink(m.telephone))}">WhatsApp</a>`:''}<button class="btn" data-act="carteM" data-id="${m.id}">🪪 Carte</button><button class="btn" data-act="pdfAttestation" data-id="${m.id}">Attestation PDF</button><button class="btn" data-act="pdfFiche" data-id="${m.id}">Fiche PDF</button><span class="sp"></span><button class="btn primary" data-act="editMember" data-id="${m.id}">Modifier</button></div>`);
}
function vGroupes(){
  const gs=[...S.groups].sort((a,b)=>(a.nom||'').localeCompare(b.nom||'','fr'));
  return`<div class="toolbar"><div class="muted">Chorale, jeunesse, mamans, papas, intercesseurs, protocole, école du dimanche…</div><span class="sp"></span><button class="btn primary" data-act="newGroup">+ Nouveau groupe</button></div>
  ${gs.length?`<div class="grid3">${gs.map(g=>{const n=S.members.filter(m=>(m.groupes||[]).includes(g.id)).length;const r=memberById(g.responsable);return`<div class="card" style="cursor:pointer" data-act="viewGroup" data-id="${g.id}"><div style="font-weight:600;font-size:15px">${esc(g.nom)}</div><div class="muted small" style="margin-top:4px">${n} membre(s)${g.reunion?' · '+esc(g.reunion):''}</div><div class="small" style="margin-top:8px">${r?'Responsable : '+esc(fullName(r)):'<span class="muted">Pas de responsable</span>'}</div></div>`}).join('')}</div>`:'<div class="card empty">Aucun groupe. Créez vos départements pour y rattacher les membres.</div>'}`;
}
function groupForm(g){
  openForm({title:g?'Modifier le groupe':'Nouveau groupe',values:g||{},fields:[{k:'nom',label:'Nom du groupe',req:1,full:1},{k:'responsable',label:'Responsable',type:'select',options:memberOptions()},{k:'adjoint',label:'Adjoint',type:'select',options:memberOptions()},{k:'reunion',label:'Réunion (jour et heure)',ph:'ex. Samedi 14h'},{k:'description',label:'Description',type:'textarea',full:1}],
    onSave:d=>save('groups',{...(g||{}),...d}),onDelete:g?()=>removeDoc('groups',g.id):null});
}
function viewGroup(id){
  const g=S.groups.find(x=>x.id===id);if(!g)return;
  const ms=sortedMembers().filter(m=>(m.groupes||[]).includes(id));
  modal(`<div class="mhead"><h3>${esc(g.nom)}</h3><button class="x" data-act="close">×</button></div><div class="mbody">
  <dl class="kv"><dt>Responsable</dt><dd>${esc(fullName(memberById(g.responsable)||{nom:'—'}))}</dd>${g.adjoint?`<dt>Adjoint</dt><dd>${esc(fullName(memberById(g.adjoint)||{}))}</dd>`:''}${g.reunion?`<dt>Réunion</dt><dd>${esc(g.reunion)}</dd>`:''}${g.description?`<dt>Description</dt><dd>${esc(g.description)}</dd>`:''}</dl>
  <h2 style="font-size:14px;margin:16px 0 8px">Membres (${ms.length})</h2>
  ${ms.length?`<div class="list">${ms.map(m=>`<div class="row" data-act="viewMember" data-id="${m.id}">${avatar(m)}<div class="grow"><div class="t">${esc(fullName(m))}</div><div class="st">${esc(m.telephone||'')}</div></div></div>`).join('')}</div>`:'<div class="muted small">Ajoutez des membres à ce groupe depuis leur fiche (Modifier → Groupes).</div>'}
  </div><div class="mfoot"><button class="btn" data-act="exportGroup" data-id="${id}">Exporter la liste</button><span class="sp"></span><button class="btn primary" data-act="editGroup" data-id="${id}">Modifier</button></div>`);
}
function vCalendrier(){
  const d=UI.cal,y=d.getFullYear(),mo=d.getMonth();
  const first=new Date(y,mo,1),off=(first.getDay()+6)%7,dim=new Date(y,mo+1,0).getDate(),rows=Math.ceil((off+dim)/7);
  const cur=new Date(y,mo,1-off);let cells='';
  for(let i=0;i<rows*7;i++){const ds=iso(cur),it=dayItems(ds);
    cells+=`<div class="cell${cur.getMonth()!==mo?' other':''}${ds===today()?' today':''}" data-act="viewDay" data-date="${ds}"><span class="dn">${cur.getDate()}</span>${it.slice(0,3).map(x=>`<span class="pill k-${x.kind}">${x.heure?esc(x.heure)+' ':''}${esc(x.titre)}</span>`).join('')}${it.length>3?`<span class="more">+${it.length-3}</span>`:''}</div>`;
    cur.setDate(cur.getDate()+1)}
  const ym=`${y}-${pad(mo+1)}`;
  const evs=S.events.filter(e=>(e.date||'').startsWith(ym)).sort((a,b)=>(a.date+(a.heure||'')).localeCompare(b.date+(b.heure||'')));
  return`<div class="calhead"><button class="btn sm" data-act="calPrev">‹</button><button class="btn sm" data-act="calToday">Aujourd'hui</button><button class="btn sm" data-act="calNext">›</button><span class="m">${first.toLocaleDateString(LOC(),{month:'long',year:'numeric'})}</span><span style="flex:1"></span><button class="btn primary" data-act="newEvent">+ Événement</button></div>
  <div class="cal">${['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(h=>`<div class="h">${h}</div>`).join('')}${cells}</div>
  <div class="legend"><span><i class="k-prog"></i>Programme hebdomadaire</span><span><i class="k-event"></i>Événement</span><span><i class="k-bday"></i>Anniversaire</span><span><i class="k-rdv"></i>Rendez-vous</span></div>
  <div class="sec"><h2>Événements du mois</h2><div class="list">${evs.length?evs.map(e=>`<div class="row" data-act="editEvent" data-id="${e.id}"><div class="grow"><div class="t">${esc(e.titre)}</div><div class="st">${fday(e.date)}${e.heure?' · '+esc(e.heure)+(e.fin?'–'+esc(e.fin):''):''}${e.lieu?' · '+esc(e.lieu):''}</div></div>${e.categorie?`<span class="badge">${esc(e.categorie)}</span>`:''}</div>`).join(''):'<div class="empty">Aucun événement particulier ce mois-ci.</div>'}</div></div>`;
}
function eventFormOld(e,date){
  openForm({title:e?'Modifier l\'événement':'Nouvel événement',values:e||{date:date||today(),categorie:'Culte spécial'},
   fields:[{k:'titre',label:'Titre',req:1,full:1},{k:'date',label:'Date',type:'date',req:1},{k:'categorie',label:'Catégorie',type:'select',options:CAT_EVT},{k:'heure',label:'Début',type:'time'},{k:'fin',label:'Fin',type:'time'},{k:'lieu',label:'Lieu',full:1},{k:'description',label:'Détails',type:'textarea',full:1}],
   onSave:d=>save('events',{...(e||{}),...d}),onDelete:e?()=>removeDoc('events',e.id):null});
}
function viewDay(ds){
  const it=dayItems(ds);
  modal(`<div class="mhead"><h3 style="text-transform:capitalize">${parse(ds).toLocaleDateString(LOC(),{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</h3><button class="x" data-act="close">×</button></div><div class="mbody">
  ${it.length?`<div class="list">${it.map(x=>`<div class="row" ${x.kind==='event'?`data-act="editEvent" data-id="${x.id}"`:x.kind==='bday'?`data-act="viewMember" data-id="${x.id}"`:''}><span class="pill k-${x.kind}" style="width:6px;height:30px;padding:0;margin:0"></span><div class="grow"><div class="t">${esc(x.titre)}</div><div class="st">${x.heure?esc(x.heure)+(x.fin?'–'+esc(x.fin):''):'Toute la journée'}${x.lieu?' · '+esc(x.lieu):''}${x.kind==='prog'?' · programme hebdomadaire':''}</div></div></div>`).join('')}</div>`:'<div class="muted">Rien de prévu ce jour.</div>'}
  </div><div class="mfoot"><span class="sp"></span><button class="btn" data-act="newAttDate" data-date="${ds}">+ Présences</button><button class="btn primary" data-act="newEvent" data-date="${ds}">+ Événement ce jour</button></div>`);
}
function vComptage(){
  const att=[...S.attendance].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const chron=[...att].reverse().slice(-12);
  return`<div class="toolbar"><div class="muted">Comptage après chaque culte ou réunion.</div><span class="sp"></span><button class="btn primary" data-act="newAtt">+ Enregistrer</button></div>
  ${chron.length?`<div class="card" style="margin-bottom:12px"><h2>Évolution (12 dernières réunions)</h2>${attChart(chron)}</div>`:''}
  <div class="list">${att.length?att.map(a=>`<div class="row" data-act="editAtt" data-id="${a.id}"><div class="grow"><div class="t">${esc(a.culte||'Réunion')} – ${fdate(a.date)}</div><div class="st">${num(a.hommes)} hommes · ${num(a.femmes)} femmes · ${num(a.enfants)} enfants${num(a.visiteurs)?' · dont '+num(a.visiteurs)+' visiteurs':''}</div></div><div class="amt">${attTotal(a)}</div></div>`).join(''):'<div class="empty">Aucune présence enregistrée.</div>'}</div>`;
}
function attForm(a,date){
  const progs=[...new Set(cfg().programmes.map(p=>p.titre))].concat(['Réunion spéciale','Autre']);
  openForm({title:a?'Modifier les présences':'Enregistrer les présences',values:a||{date:date||today(),culte:progs[0]},
   fields:[{k:'date',label:'Date',type:'date',req:1},{k:'culte',label:'Culte / réunion',type:'select',options:progs},{k:'hommes',label:'Hommes',type:'number'},{k:'femmes',label:'Femmes',type:'number'},{k:'enfants',label:'Enfants',type:'number'},{k:'visiteurs',label:'Dont visiteurs',type:'number'},{k:'notes',label:'Notes (prédicateur, thème…)',type:'textarea',full:1}],
   onSave:d=>save('attendance',{...(a||{}),...d}),onDelete:a?()=>removeDoc('attendance',a.id):null});
}
function vSuivis(){
  const f=UI.fu;
  const list=S.followups.filter(x=>f==='tous'||(f==='ouverts'?x.statut!=='Terminé':x.statut==='Terminé')).sort((a,b)=>(a.echeance||'9').localeCompare(b.echeance||'9'));
  return suivisKpis()+`<div class="toolbar"><div class="tabs">${[['ouverts','En attente'],['termines','Terminés'],['tous','Tous']].map(([k,l])=>`<button class="tab${f===k?' on':''}" data-act="fuTab" data-k="${k}">${l}</button>`).join('')}</div><span class="sp"></span><button class="btn primary" data-act="newFollow">+ Nouveau suivi</button></div>
  <div class="list">${list.length?list.map(x=>{const late=x.statut!=='Terminé'&&x.echeance&&x.echeance<today();return`<div class="row" data-act="editFollow" data-id="${x.id}"><div class="grow"><div class="t">${esc(x.membreId?fullName(memberById(x.membreId)||{}):x.personne||'—')} · ${esc(x.type)}</div><div class="st">${x.responsable?'Par '+esc(x.responsable)+' · ':''}${x.echeance?`<span class="${late?'neg':''}">Échéance ${fdate(x.echeance)}</span>`:''}${x.notes?' · '+esc(x.notes):''}</div></div>${x.statut!=='Terminé'?`<button class="btn sm ok" data-act="doneFollow" data-id="${x.id}">✓ Terminé</button>`:''}<span class="badge ${x.statut==='Terminé'?'b-done':x.statut==='En cours'?'b-encours':'b-todo'}">${esc(x.statut||'À faire')}</span></div>`}).join(''):'<div class="empty">Aucun suivi ici.</div>'}</div>`;
}
function followForm(x,membreId){
  openForm({title:x?'Modifier le suivi':'Nouveau suivi',values:x||{membreId:membreId||'',statut:'À faire',type:TYPES_SUIVI[0],echeance:today()},
   fields:[{k:'membreId',label:'Membre concerné',type:'select',options:memberOptions()},{k:'personne',label:'Ou nom (si non enregistré)'},{k:'type',label:'Type',type:'select',options:TYPES_SUIVI},{k:'statut',label:'Statut',type:'select',options:STAT_SUIVI},{k:'responsable',label:'Confié à'},{k:'echeance',label:'Échéance',type:'date'},{k:'notes',label:'Notes / compte rendu',type:'textarea',full:1}],
   onSave:d=>{if(!d.membreId&&!d.personne){toast('Choisissez un membre ou saisissez un nom',1);return false}return save('followups',{...(x||{}),...d})},onDelete:x?()=>removeDoc('followups',x.id):null});
}
function vFinOps(){
  const c=cfg(),m=UI.finMonth,f=UI.finFund,C=UI.finCompte,bal=balances(),taux=num(c.taux)||1;
  const list=S.transactions.filter(t=>(!m||(t.date||'').startsWith(m))&&(!f||t.fonds===f)&&(!C||acct(t)===C||t.compteDest===C)&&projMatch(t)).sort((a,b)=>(b.date||'').localeCompare(a.date||'')||String(b.numBon||'').localeCompare(String(a.numBon||'')));
  const tin=sumBy(list.filter(isIn),()=>'x').x||{CDF:0,USD:0},tout=sumBy(list.filter(isOut),()=>'x').x||{CDF:0,USD:0};
  const funds=[...new Set(c.fonds.concat(S.transactions.map(t=>t.fonds).filter(Boolean)))];
  return`<div class="grid${Object.keys(bal).length>2?3:2}">${Object.entries(bal).filter(([k])=>!FINLIM()||k===c.fonds[0]).map(([k,b])=>`<div class="card kpi"><div class="l">Solde · ${esc(FINLIM()?'Offrandes ordinaires':k)}</div><div class="v ${b.CDF<0?'neg':''}" style="font-size:19px">${money(b.CDF,'CDF')}</div><div class="v ${b.USD<0?'neg':''}" style="font-size:17px;margin-top:0">${money(b.USD,'USD')}</div><div class="s">≈ ${money(b.USD+b.CDF/taux,'USD')} au total (1 $ = ${num(c.taux).toLocaleString('fr-FR')} FC)</div></div>`).join('')}</div>
  <div class="toolbar sec"><input type="month" class="inp" data-bind="finMonth" value="${esc(m)}">${FINLIM()?'':`<select class="inp" data-bind="finFund"><option value="">Tous les fonds</option>${funds.map(x=>opt(x,f)).join('')}</select>`}${S.campagnes.length?`<select class="inp" data-bind="finProj"><option value="">Tous (projets ou non)</option><option value="__none"${UI.finProj==='__none'?' selected':''}>Hors projets (offrandes, dîmes…)</option>${S.campagnes.map(c=>opt([c.id,'Projet : '+c.nom],UI.finProj)).join('')}</select>`:''}<select class="inp" data-bind="finCompte"><option value="">Tous les comptes</option>${c.comptes.map(x=>opt(x,C)).join('')}</select>${m?'<button class="btn sm" data-act="finAll">Tout afficher</button>':''}<span class="sp"></span><button class="btn" data-act="pdfJournal">Journal PDF</button><button class="btn" data-act="exportTx">Excel</button><button class="btn ok" data-act="newTx" data-type="entree">+ Entrée</button><button class="btn danger" data-act="newTx" data-type="sortie">− Sortie</button>${FINLIM()?'':'<button class="btn" data-act="newTransfer">⇄ Virement</button>'}</div>
  <div class="grid3" style="margin-bottom:12px"><div class="card kpi"><div class="l">Entrées ${m?'du mois':''}</div><div class="v pos" style="font-size:16px">${both(tin)}</div></div><div class="card kpi"><div class="l">Sorties ${m?'du mois':''}</div><div class="v neg" style="font-size:16px">${both(tout)}</div></div><div class="card kpi"><div class="l">Résultat</div><div class="v" style="font-size:16px">${both({CDF:tin.CDF-tout.CDF,USD:tin.USD-tout.USD})}</div></div></div>
  <div class="list">${list.length?list.map(t=>{const mm=memberById(t.membreId);if(t.type==='transfert')return`<div class="row" data-act="editTx" data-id="${t.id}"><div class="grow"><div class="t">Virement interne</div><div class="st">${fdate(t.date)} · ${esc(t.numBon||'')} · ${esc(acct(t))} → ${esc(t.compteDest)}${t.description?' · '+esc(t.description):''}</div></div><div class="amt">⇄ ${money(t.montant,t.devise)}</div></div>`;return`<div class="row" data-act="editTx" data-id="${t.id}"><div class="grow"><div class="t">${esc(t.categorie)}${mm?' – '+esc(fullName(mm)):t.tiers?' – '+esc(t.tiers):''}</div><div class="st">${fdate(t.date)} · ${esc(t.numBon||'')} · ${esc(t.fonds||'')} · ${esc(acct(t))}${t.rapproche?' ✓':''}${projName(t)?' · <b style="color:var(--brand)">Projet : '+esc(projName(t))+'</b>':''}${t.description?' · '+esc(t.description):''}</div></div><div class="amt ${((t.type==='sortie'||t.type==='pret'))?'neg':'pos'}">${((t.type==='sortie'||t.type==='pret'))?'−':'+'} ${money(t.montant,t.devise)}</div></div>`}).join(''):'<div class="empty">Aucune opération pour cette période.</div>'}</div>`;
}
function txForm(t,type,pre){
  if(t&&t.type==='transfert')return transferForm(t);
  const c=cfg();type=t?t.type:type;
  let cats=type==='sortie'?c.catSorties:c.catEntrees;if(FINLIM()&&type!=='sortie')cats=cats.filter(isOrdOff);if(!cats.length)cats=['Offrande'];if(t&&t.categorie&&!cats.includes(t.categorie))cats=cats.concat(t.categorie);
  const funds=FINLIM()?[c.fonds[0]]:c.fonds.concat(t&&t.fonds&&!c.fonds.includes(t.fonds)?[t.fonds]:[]);
  if(FINLIM()&&type==='transfert')return toast('Accès limité',1);
  openForm({title:(t?'Modifier ':'Nouvelle ')+(type==='sortie'?'sortie de caisse':'entrée de caisse'),values:t||{...{date:today(),devise:'CDF',fonds:funds[0],compte:c.comptes[0],categorie:cats[0],numBon:nextBon(type)},...(pre||{})},
   fields:[{k:'campagneId',label:type==='sortie'?'Dépense pour':'Pour quoi ? (offrande ordinaire ou projet)',type:'select',full:1,options:[['',type==='sortie'?'Fonctionnement ordinaire de l\'église':(FINLIM()?'Offrande ordinaire (caisse générale)':'Offrande / dîme ordinaire (caisse générale)')]].concat(S.campagnes.filter(x=>projActif(x)||(t&&t.campagneId===x.id)).map(x=>[x.id,'Projet : '+x.nom+(projClos(x)?' (clôturé)':'')]))},{k:'date',label:'Date',type:'date',req:1},{k:'numBon',label:'N° de bon'},{k:'categorie',label:'Catégorie',type:'select',options:cats},{k:'fonds',label:'Fonds (affectation)',type:'select',options:funds},{k:'compte',label:'Compte (où est l\'argent)',type:'select',options:c.comptes.concat(t&&t.compte&&!c.comptes.includes(t.compte)?[t.compte]:[])},{k:'montant',label:'Montant',type:'number',req:1},{k:'devise',label:'Devise',type:'select',options:[['CDF','Francs congolais (FC)'],['USD','Dollars ($)']]},
     {k:'membreId',label:type==='sortie'?'Membre bénéficiaire (facultatif)':'Membre (dîme, don…)',type:'select',options:memberOptions()},{k:'tiers',label:type==='sortie'?'Bénéficiaire (payé à)':'Reçu de (si non membre)',list:payees()},{k:'description',label:'Libellé / motif',type:'textarea',full:1,rows:2}],
   onSave:d=>{if(!(d.montant>0)){toast('Montant invalide',1);return false}const pj=d.campagneId&&S.campagnes.find(x=>x.id===d.campagneId);if(pj&&pj.fonds&&(!t||t.campagneId!==d.campagneId))d.fonds=pj.fonds;if(pj&&type!=='sortie'&&!d.description)d.description='Projet : '+pj.nom;return save('transactions',{...(t||{}),...d,type}).then(id=>{if(id&&!t&&type==='entree'&&(d.membreId||String(d.tiers||'').trim()))setTimeout(()=>recuPrompt({...d,type,id}),250);return id})},onDelete:t?()=>removeDoc('transactions',t.id):null,
   extra:t?[{label:'Imprimer le bon (PDF)',fn:()=>pdfBon(t)}].concat(type==='entree'&&(t.membreId||t.tiers)?[{label:'🧾 Reçu du donateur',fn:()=>recuPrompt(t)}]:[]):[]});
}
function vRapMensuel(){
  const m=UI.repMonth,y=m.slice(0,4),c=cfg();
  const att=S.attendance.filter(a=>(a.date||'').startsWith(m));const tot=att.reduce((s,a)=>s+attTotal(a),0);
  const tx=S.transactions.filter(t=>(t.date||'').startsWith(m));
  const ins=sumBy(tx.filter(isIn),t=>t.categorie||'—'),outs=sumBy(tx.filter(t=>t.type==='sortie'),t=>t.categorie||'—');
  const sumAll=o=>Object.values(o).reduce((a,b)=>({CDF:a.CDF+b.CDF,USD:a.USD+b.USD}),{CDF:0,USD:0});
  const nv=S.members.filter(x=>(x.dateAdhesion||'').startsWith(m)),bap=S.members.filter(x=>(x.dateBapteme||'').startsWith(m));
  const fuDone=S.followups.filter(x=>x.statut==='Terminé'&&String(x.updatedAt||'').startsWith(m)).length;
  const dimes=sumBy(S.transactions.filter(t=>isIn(t)&&t.membreId&&(t.date||'').startsWith(y)),t=>t.membreId);
  const dl=Object.entries(dimes).map(([id,v])=>({m:memberById(id),v})).filter(x=>x.m).sort((a,b)=>fullName(a.m).localeCompare(fullName(b.m),'fr'));
  const tbl=(o)=>{const e=Object.entries(o);return e.length?`<table class="t"><tr><th>Catégorie</th><th class="n">FC</th><th class="n">$</th></tr>${e.map(([k,v])=>`<tr><td>${esc(k)}</td><td class="n">${money(v.CDF,'CDF')}</td><td class="n">${money(v.USD,'USD')}</td></tr>`).join('')}<tr style="font-weight:700"><td>Total</td><td class="n">${money(sumAll(o).CDF,'CDF')}</td><td class="n">${money(sumAll(o).USD,'USD')}</td></tr></table>`:'<div class="muted small">Aucune opération.</div>'};
  return`<div class="toolbar"><input type="month" class="inp" data-bind="repMonth" value="${esc(m)}"><span class="sp"></span><button class="btn" data-act="exportReport">Excel</button><button class="btn primary" data-act="pdfRapport">Rapport PDF</button></div>
  <h2 style="font-size:16px;margin:4px 0 12px;text-transform:capitalize">Rapport de ${monthLabel(m)} – ${esc(c.nom)}</h2>
  <div class="grid4"><div class="card kpi"><div class="l">Réunions comptées</div><div class="v">${att.length}</div></div><div class="card kpi"><div class="l">Présence moyenne</div><div class="v">${att.length?Math.round(tot/att.length):0}</div></div><div class="card kpi"><div class="l">Nouveaux membres</div><div class="v">${nv.length}</div><div class="s">${bap.length} baptême(s)</div></div><div class="card kpi"><div class="l">Suivis terminés</div><div class="v">${fuDone}</div></div></div>
  <div class="grid2 sec"><div class="card"><h2>Entrées par catégorie</h2>${tbl(ins)}</div><div class="card"><h2>Sorties par catégorie</h2>${tbl(outs)}</div></div>
  <div class="card sec"><h2>Contributions par membre – année ${y}</h2>${dl.length?`<table class="t"><tr><th>Membre</th><th class="n">FC</th><th class="n">$</th></tr>${dl.map(x=>`<tr><td>${esc(fullName(x.m))}</td><td class="n">${money(x.v.CDF,'CDF')}</td><td class="n">${money(x.v.USD,'USD')}</td></tr>`).join('')}</table>`:'<div class="muted small">Aucune contribution liée à un membre cette année. Choisissez le membre lors de la saisie d\'une dîme ou d\'un don.</div>'}</div>`;
}
const APP_VERSION='23/11/2026 – cartes, reçus, journal';
function vParametres(){
  const c=cfg(),admin=ROLE==='admin';
  const theme=getTheme();
  let html=`<div class="muted small" style="text-align:right;margin-bottom:6px">Version de l'application : ${APP_VERSION}</div><div class="card"><h2>Apparence</h2><div class="tabs"><button class="tab${theme==='glass'?' on':''}" data-act="setTheme" data-k="glass">Verre (transparent)</button><button class="tab${theme==='classic'?' on':''}" data-act="setTheme" data-k="classic">Classique</button></div><div style="margin-top:14px"><b>Langue des menus</b> <select class="inp" data-lang="1">${[['fr','Français'],['en','English'],['sw','Kiswahili']].map(o=>opt(o,getLang())).join('')}</select><div class="muted small" style="margin-top:4px">Traduit toute l'interface sur cet appareil ; vos propres données (noms, notes, versets…) restent telles que vous les avez écrites.</div></div></div>`;
  if(admin){
    html+=themeCard();
    html+=`<div class="card sec"><div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><h2 style="margin:0;flex:1">Informations de l'église</h2><button class="btn primary sm" data-act="editConfig">Modifier</button></div>
  <dl class="kv"><dt>Nom</dt><dd>${esc(c.nom)} (${esc(c.sigle)})</dd><dt>Pasteur principal</dt><dd>${esc(visio(c))}</dd>${c.adresse?`<dt>Adresse</dt><dd>${esc(c.adresse)}</dd>`:''}${c.ville?`<dt>Ville</dt><dd>${esc(c.ville)}</dd>`:''}${c.telephone?`<dt>Téléphone</dt><dd>${esc(c.telephone)}</dd>`:''}<dt>Taux du jour</dt><dd>1 $ = ${num(c.taux).toLocaleString('fr-FR')} FC</dd><dt>Fonds</dt><dd>${c.fonds.map(f=>`<span class="chip">${esc(f)}</span>`).join('')}</dd><dt>Comptes</dt><dd>${c.comptes.map(f=>`<span class="chip">${esc(f)}</span>`).join('')}</dd><dt>Catégories d'entrées</dt><dd>${c.catEntrees.map(f=>`<span class="chip">${esc(f)}</span>`).join('')}</dd><dt>Catégories de sorties</dt><dd>${c.catSorties.map(f=>`<span class="chip">${esc(f)}</span>`).join('')}</dd></dl></div>
  <div class="card sec"><div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><h2 style="margin:0;flex:1">Programmes hebdomadaires</h2><button class="btn primary sm" data-act="newProg">+ Ajouter</button></div>
  <div class="list">${c.programmes.map((p,i)=>`<div class="row" data-act="editProg" data-i="${i}"><div class="grow"><div class="t">${esc(p.titre)}</div><div class="st">${JOURS[+p.jour]||''}${p.debut?' · '+esc(p.debut)+(p.fin?'–'+esc(p.fin):''):''}</div></div></div>`).join('')}</div></div>`;
    const others=S.people.filter(p=>!ME||p.id!==ME.id);
    html+=`<div class="card sec"><h2>Utilisateurs et rôles</h2>
    <div class="muted small" style="margin-bottom:10px">Chaque compte apparaît ici après sa première connexion. Choisissez ce qu'il peut voir : <b>Trésorier</b> (finances, rapports), <b>Secrétaire</b> (membres, groupes, présences, suivis), <b>Pasteur / ancien</b> (tout sauf les paramètres), <b>Lecteur</b> (tableau de bord et calendrier, sans modification).</div>
    ${others.length?`<div class="list">${others.map(p=>`<div class="row" style="cursor:default"><img class="uav" data-uid="${esc(p.id)}" style="width:34px;height:34px;border-radius:50%;background:#dde" alt=""><div class="grow"><div class="t uname" data-uid="${esc(p.id)}">…</div><div class="st">Dernière connexion : ${fdate(p.lastSeen)}</div></div><select class="inp" data-role-uid="${esc(p.id)}">${Object.entries(ROLES).filter(([k])=>k!=='admin'||window.EMT_STANDALONE).map(([k,r])=>opt([k,k==='admin'?'Administrateur (accès total)':r.l],S.roles[p.id]||'lecteur')).join('')}</select></div>`).join('')}</div>`:'<div class="muted small">Personne d\'autre ne s\'est encore connecté.</div>'}</div>`;
    html+=adminCards();
  } else {
    html+=`<div class="card sec"><h2>Mon accès</h2><div>Rôle : <b>${esc((ROLES[ROLE]||{}).l||ROLE)}</b></div><div class="muted small" style="margin-top:6px">Pour obtenir plus d'accès, demandez à l'administrateur de l'application.</div></div>`;
  }
  html+=`<div class="card sec"><h2>Sécurité</h2><div class="muted small" style="margin-bottom:10px">Chaque personne se connecte avec son e-mail et son mot de passe. Pensez à vous déconnecter sur un appareil partagé.</div><button class="btn" data-act="lock">Se déconnecter</button> ${AUTH.canPin?'<button class="btn" data-act="changePin">Changer mon code</button>':''}</div>
  <div class="card sec muted small">Les données sont enregistrées en ligne avec cette page. Chaque personne crée son compte sur la page de connexion (rôle « Fidèle » par défaut). Attribuez ensuite un rôle aux responsables ci-dessus : les droits sont appliqués par la base de données elle-même.</div>`;
  return html;
}
function configForm(){
  const c=cfg();
  openForm({title:'Informations de l\'église',values:{...c,sites:(c.sites||[]).join('\n'),fonds:c.fonds.join('\n'),comptes:c.comptes.join('\n'),catEntrees:c.catEntrees.join('\n'),catSorties:c.catSorties.join('\n')},
   fields:[{k:'nom',label:'Nom de l\'église',full:1,req:1},{k:'sigle',label:'Sigle'},{k:'pasteur',label:'Pasteur principal'},{k:'titrePasteur',label:'Titre affiché (ex. Visionnaire)'},{k:'adresse',label:'Adresse'},{k:'ville',label:'Ville'},{k:'telephone',label:'Téléphone'},{k:'taux',label:'Taux : 1 $ = … FC',type:'number'},{k:'sites',label:'Sites / antennes (un par ligne, le premier = site principal ; laisser vide si un seul)',type:'textarea',full:1,rows:2},{k:'fonds',label:'Fonds / affectations (un par ligne)',type:'textarea',full:1},{k:'comptes',label:'Comptes : caisse, banque, mobile money (un par ligne)',type:'textarea',full:1},{k:'catEntrees',label:'Catégories d\'entrées (une par ligne)',type:'textarea',rows:5},{k:'catSorties',label:'Catégories de sorties (une par ligne)',type:'textarea',rows:5}],
   onSave:d=>{const lines=s=>s.split('\n').map(x=>x.trim()).filter(Boolean);return saveConfig({...d,sites:lines(d.sites),fonds:lines(d.fonds),comptes:lines(d.comptes),catEntrees:lines(d.catEntrees),catSorties:lines(d.catSorties)})}});
}
function progForm(i){
  const c=cfg(),p=i==null?null:c.programmes[i];
  openForm({title:p?'Modifier le programme':'Nouveau programme',values:p||{jour:0},
   fields:[{k:'titre',label:'Intitulé',req:1,full:1},{k:'jour',label:'Jour',type:'select',options:JOURS.map((j,k)=>[String(k),j])},{k:'debut',label:'Début',type:'time'},{k:'fin',label:'Fin',type:'time'}],
   onSave:d=>{const arr=c.programmes.map(x=>({...x}));d.jour=+d.jour;if(p)arr[i]=d;else arr.push(d);return saveConfig({programmes:arr})},
   onDelete:p?()=>saveConfig({programmes:c.programmes.filter((_,k)=>k!==i)}):null});
}

const HW=[278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584, 350, 556, 350, 222, 556, 333, 1000, 556, 556, 333, 1000, 667, 333, 1000, 350, 611, 350, 350, 222, 222, 333, 333, 350, 556, 1000, 333, 1000, 500, 333, 944, 350, 500, 667, 278, 333, 556, 556, 556, 556, 260, 556, 333, 737, 370, 556, 584, 333, 737, 333, 400, 584, 333, 333, 333, 556, 537, 278, 333, 333, 365, 556, 834, 834, 834, 611, 667, 667, 667, 667, 667, 667, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278, 722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611, 556, 556, 556, 556, 556, 556, 889, 500, 556, 556, 556, 556, 278, 278, 278, 278, 556, 556, 556, 556, 556, 556, 556, 584, 611, 556, 556, 556, 556, 500, 556, 500],HBW=[278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584, 350, 556, 350, 278, 556, 500, 1000, 556, 556, 333, 1000, 667, 333, 1000, 350, 611, 350, 350, 278, 278, 500, 500, 350, 556, 1000, 333, 1000, 556, 333, 944, 350, 500, 667, 278, 333, 556, 556, 556, 556, 280, 556, 333, 737, 370, 556, 584, 333, 737, 333, 400, 584, 333, 333, 333, 611, 556, 278, 333, 333, 365, 556, 834, 834, 834, 611, 722, 722, 722, 722, 722, 722, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278, 722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611, 556, 556, 556, 556, 556, 556, 889, 556, 556, 556, 556, 556, 278, 278, 278, 278, 611, 611, 611, 611, 611, 611, 611, 584, 611, 611, 611, 611, 611, 556, 611, 556];
const LOGO_JPG={w:600,h:199,b64:"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"};
/* ---------- WhatsApp ---------- */
const waNum=t=>{let d=String(t||'').replace(/\D/g,'');if(!d)return'';if(d.startsWith('00'))d=d.slice(2);else if(d.startsWith('0'))d='243'+d.slice(1);else if(d.length===9)d='243'+d;return d.length>=10?d:''};
const waLink=(t,msg)=>{const n=waNum(t);return n?`https://wa.me/${n}${msg?'?text='+encodeURIComponent(msg):''}`:''};

/* ---------- montant en lettres ---------- */
function enLettres(n){
  const U=['zéro','un','deux','trois','quatre','cinq','six','sept','huit','neuf','dix','onze','douze','treize','quatorze','quinze','seize','dix-sept','dix-huit','dix-neuf'];
  const D=['','dix','vingt','trente','quarante','cinquante','soixante','soixante','quatre-vingt','quatre-vingt'];
  const lt100=n=>{if(n<20)return U[n];const d=Math.floor(n/10),u=n%10;if(d===7||d===9)return D[d]+(d===7&&u===1?' et ':'-')+U[10+u];if(u===0)return D[d]+(d===8?'s':'');if(u===1&&d!==8)return D[d]+' et un';return D[d]+'-'+U[u]};
  const lt1000=n=>{const c=Math.floor(n/100),r=n%100;let s='';if(c)s=(c>1?U[c]+' cent':'cent')+(c>1&&r===0?'s':'');if(r)s+=(s?' ':'')+lt100(r);return s};
  n=Math.floor(n);if(!n)return'zéro';const p=[];
  for(const[v,name]of[[1e9,'milliard'],[1e6,'million'],[1e3,'mille']]){const q=Math.floor(n/v);if(q){p.push(v===1e3?(q===1?'mille':lt1000(q).replace(/s$/,'')+' mille'):lt1000(q)+' '+name+(q>1?'s':''));n%=v}}
  if(n)p.push(lt1000(n));return p.join(' ');
}
function montantLettres(m,dev){
  m=Math.round(num(m)*100)/100;const e=Math.floor(m),c=Math.round((m-e)*100);
  let s=enLettres(e)+(dev==='USD'?(e>1?' dollars américains':' dollar américain'):' francs congolais');
  if(c)s+=' et '+enLettres(c)+(dev==='USD'?' cents':' centimes');
  return s.charAt(0).toUpperCase()+s.slice(1);
}

/* ---------- mini générateur PDF (sans dépendance) ---------- */
const PDFLIB=(()=>{
  const MAP={8364:128,8218:130,402:131,8222:132,8230:133,8224:134,8225:135,710:136,8240:137,352:138,8249:139,338:140,381:142,8216:145,8217:146,8220:147,8221:148,8226:149,8211:150,8212:151,732:152,8482:153,353:154,8250:155,339:156,382:158,376:159,8722:45,8776:126,8594:62,8239:32,8201:32,160:32};
  const code=ch=>{const c=ch.codePointAt(0);if(MAP[c]!==undefined)return MAP[c];if(c>=32&&c<127||c>160&&c<256)return c;return 63};
  const enc=s=>{let o='';for(const ch of String(s)){const x=String.fromCharCode(code(ch));o+=(x==='('||x===')'||x==='\\')?'\\'+x:x}return o};
  const width=(s,size,b)=>{const W=b?HBW:HW;let w=0;for(const ch of String(s))w+=W[code(ch)-32]||556;return w*size/1000};
  const f=v=>(+v).toFixed(2);
  class Doc{
    constructor(){this.W=595.28;this.H=841.89;this.pages=[];this.addPage()}
    addPage(){this.c=[];this.pages.push(this.c);this.y=0}
    rgb(c){return c.map(v=>(v/255).toFixed(3)).join(' ')}
    width(s,size,b){return width(s,size,b)}
    fit(s,max,size,b){if(width(s,size,b)<=max)return s;while(s.length&&width(s+'…',size,b)>max)s=s.slice(0,-1);return s+'…'}
    wrap(s,max,size,b){const out=[];String(TR(s??'')).split('\n').forEach(par=>{let line='';par.split(/\s+/).forEach(w=>{const t=line?line+' '+w:w;if(line&&width(t,size,b)>max){out.push(line);line=w}else line=t});out.push(line)});return out}
    text(s,x,y,o={}){const size=o.size||10,b=!!o.bold;s=String(TR(s??''));if(o.max)s=this.fit(s,o.max,size,b);const w=width(s,size,b);if(o.align==='right')x-=w;else if(o.align==='center')x-=w/2;this.c.push(`BT /${b?'F2':o.italic?'F3':'F1'} ${size} Tf ${this.rgb(o.color||[27,42,46])} rg ${f(x)} ${f(this.H-y)} Td (${enc(s)}) Tj ET`);return w}
    rect(x,y,w,h,o={}){let s='';if(o.fill)s+=this.rgb(o.fill)+' rg ';if(o.stroke)s+=this.rgb(o.stroke)+' RG '+(o.lw||0.6)+' w ';if(o.dash)s+='[3 3] 0 d ';s+=`${f(x)} ${f(this.H-y-h)} ${f(w)} ${f(h)} re ${o.fill&&o.stroke?'B':o.fill?'f':'S'}`;if(o.dash)s+=' [] 0 d';this.c.push(s)}
    line(x1,y1,x2,y2,o={}){this.c.push(`${this.rgb(o.color||[200,210,212])} RG ${o.lw||0.6} w ${o.dash?'[4 3] 0 d ':''}${f(x1)} ${f(this.H-y1)} m ${f(x2)} ${f(this.H-y2)} l S${o.dash?' [] 0 d':''}`)}
    image(x,y,w,h){this.c.push(`q ${f(w)} 0 0 ${f(h)} ${f(x)} ${f(this.H-y-h)} cm /Im1 Do Q`)}
    output(){
      const LG=LOGOI(),img=atob(LG.b64),o=[];
      o[0]='<< /Type /Catalog /Pages 2 0 R >>';
      o[2]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
      o[3]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
      o[4]=`<< /Type /XObject /Subtype /Image /Width ${LG.w} /Height ${LG.h} /ColorSpace ${LG.cs||'/DeviceGray'} /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.length} >>\nstream\n${img}\nendstream`;
      o[5]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>';
      const kids=[];
      this.pages.forEach(p=>{const ct=p.join('\n'),pi=o.length+1,ci=o.length+2;
        o.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.W} ${this.H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 6 0 R >> /XObject << /Im1 5 0 R >> >> /Contents ${ci} 0 R >>`);
        o.push(`<< /Length ${ct.length} >>\nstream\n${ct}\nendstream`);kids.push(pi+' 0 R')});
      o[1]=`<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${kids.length} >>`;
      let out='%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';const offs=[];
      o.forEach((x,i)=>{offs.push(out.length);out+=`${i+1} 0 obj\n${x}\nendobj\n`});
      const xr=out.length;
      out+=`xref\n0 ${o.length+1}\n0000000000 65535 f \n`+offs.map(v=>String(v).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size ${o.length+1} /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF\n`;
      const u=new Uint8Array(out.length);for(let i=0;i<out.length;i++)u[i]=out.charCodeAt(i)&255;return u;
    }
  }
  return{Doc};
})();
let TEAL=[20,41,77],GREY=[106,122,127];
function pdfDoc(title,subtitle){
  const d=new PDFLIB.Doc(),c=cfg(),M=40;d.M=M;
  d.header=()=>{const lw=150,lh=lw*LOGOI().h/LOGOI().w;d.image(M,30,lw,lh);
    d.text(title,d.W-M,44,{size:15,bold:1,align:'right',color:TEAL,max:300});
    if(subtitle)d.text(subtitle,d.W-M,60,{size:10,align:'right',color:GREY,max:300});
    d.text(visio(c),d.W-M,74,{size:9,bold:1,align:'right',color:TEAL,max:300});const ad=[c.adresse,c.ville,c.telephone].filter(Boolean).join(' · ');if(ad)d.text(ad,d.W-M,85,{size:7.5,align:'right',color:GREY,max:300});
    d.rect(M,92,d.W-2*M,2,{fill:[31,63,117]});d.y=112};
  d.newPage=()=>{d.addPage();d.header()};
  d.ensure=h=>{if(d.y+h>d.H-50)d.newPage()};
  d.h2=s=>{d.ensure(50);d.y+=8;d.text(s,M,d.y,{size:12,bold:1,color:TEAL});d.y+=12};
  d.para=(s,size=10)=>{d.wrap(s,d.W-2*M,size).forEach(l=>{d.ensure(16);d.text(l,M,d.y+size,{size});d.y+=size*1.45});d.y+=4};
  d.table=(cols,rows,opts={})=>{
    const W=d.W-2*M,ws=cols.map(c=>c.w*W);
    const cell=(v,i,x,y,b,col)=>d.text(v??'',cols[i].a==='r'?x+ws[i]-5:x+5,y,{size:8.5,bold:b,align:cols[i].a==='r'?'right':'left',max:ws[i]-10,color:col});
    const head=()=>{d.rect(M,d.y,W,18,{fill:[230,236,246]});let x=M;cols.forEach((c,i)=>{cell(c.t,i,x,d.y+12.5,1,TEAL);x+=ws[i]});d.y+=18};
    d.ensure(44);head();
    if(!rows.length){d.text(opts.empty||'Aucune donnée.',M+5,d.y+13,{size:9,color:GREY});d.y+=24;return}
    rows.forEach((r,ri)=>{if(d.y+17>d.H-50){d.newPage();head()}
      const b=!!r.bold,cells=r.cells||r;
      if(b)d.rect(M,d.y,W,17,{fill:[234,239,248]});else if(ri%2)d.rect(M,d.y,W,17,{fill:[248,250,250]});
      let x=M;cols.forEach((c,i)=>{cell(cells[i],i,x,d.y+11.5,b,r.colors&&r.colors[i]);x+=ws[i]});
      d.line(M,d.y+17,M+W,d.y+17,{color:[226,232,234]});d.y+=17});
    d.y+=8};
  d.kpis=items=>{d.ensure(64);const W=d.W-2*M,g=8,w=(W-g*(items.length-1))/items.length;
    items.forEach(([l,v],i)=>{const x=M+i*(w+g);d.rect(x,d.y,w,48,{fill:[246,249,249],stroke:[220,230,232]});d.text(l,x+8,d.y+16,{size:8,color:GREY,max:w-16});d.text(v,x+8,d.y+37,{size:14,bold:1,max:w-16})});d.y+=60};
  d.signatures=labels=>{d.ensure(100);d.y+=24;const W=d.W-2*M,w=W/labels.length;
    labels.forEach((l,i)=>{const x=M+i*w;d.text(l,x+w/2,d.y,{size:9,bold:1,align:'center',color:[60,75,80]});d.line(x+12,d.y+48,x+w-12,d.y+48,{color:[150,160,164]})});d.y+=64};
  d.finish=()=>{const n=d.pages.length;d.pages.forEach((p,i)=>{d.c=p;d.line(M,d.H-36,d.W-M,d.H-36);
    d.text(`${c.nom} — généré le ${new Date().toLocaleDateString(LOC())} à ${new Date().toLocaleTimeString(LOC(),{hour:'2-digit',minute:'2-digit'})}`,M,d.H-24,{size:7.5,color:GREY});
    d.text(`Page ${i+1} / ${n}`,d.W-M,d.H-24,{size:7.5,align:'right',color:GREY})});return d.output()};
  d.header();return d;
}
async function savePDF(name,bytes){
  let dl=null;try{dl=window.claude?await window.claude.use('downloads'):null}catch(e){}
  if(!dl){toast('Téléchargement indisponible dans cette vue',1);return}
  try{await dl.save({filename:name,data:bytes});toast('PDF prêt')}catch(e){if(e&&e.code==='declined')return;toast('PDF non enregistré ('+(e&&e.code||'erreur')+')',1)}
}
const sumAll=o=>Object.values(o).reduce((a,b)=>({CDF:a.CDF+b.CDF,USD:a.USD+b.USD}),{CDF:0,USD:0});
const lastDay=m=>iso(new Date(+m.slice(0,4),+m.slice(5,7),0));
function catRows(o){const e=Object.entries(o).sort((a,b)=>a[0].localeCompare(b[0],'fr'));const t=sumAll(o);return e.map(([k,v])=>[k,money(v.CDF,'CDF'),money(v.USD,'USD')]).concat(e.length?[{bold:1,cells:['Total',money(t.CDF,'CDF'),money(t.USD,'USD')]}]:[])}
function pdfRapport(){
  const m=UI.repMonth,c=cfg(),d=pdfDoc('Rapport mensuel',monthLabel(m).replace(/^./,x=>x.toUpperCase()));
  const att=S.attendance.filter(a=>(a.date||'').startsWith(m)).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  const tot=att.reduce((s,a)=>s+attTotal(a),0),tx=S.transactions.filter(t=>(t.date||'').startsWith(m));
  const nv=S.members.filter(x=>(x.dateAdhesion||'').startsWith(m)),bap=S.members.filter(x=>(x.dateBapteme||'').startsWith(m));
  const fuDone=S.followups.filter(x=>x.statut==='Terminé'&&String(x.updatedAt||'').startsWith(m)).length;
  d.kpis([['Réunions comptées',String(att.length)],['Présence moyenne',String(att.length?Math.round(tot/att.length):0)],['Nouveaux membres',String(nv.length)],['Baptêmes',String(bap.length)],['Suivis terminés',String(fuDone)]]);
  pdfInterp(d,interpretation(m));
  {const taux=num(c.taux)||1,ms=lastMonths(6).filter(x=>x<=m);while(ms.length<6){const f=ms[0]||m;ms.unshift(iso(new Date(+f.slice(0,4),+f.slice(5,7)-2,1)).slice(0,7))}
   const ms6=ms.slice(-6).map(()=>0),M6=[];for(let i=5;i>=0;i--)M6.push(iso(new Date(+m.slice(0,4),+m.slice(5,7)-1-i,1)).slice(0,7));
   const eqT=t=>conv(t,'USD');
   d.h2('Graphiques');
   if(att.length)pdfBars(d,'Présence par réunion ce mois',att.map(a=>a.date.slice(8)+'/'+a.date.slice(5,7)),[{n:'Présents',c:NAVYC,v:att.map(attTotal)}]);
   pdfBars(d,'Recettes et dépenses sur 6 mois (équivalent $)',M6.map(mLab),[{n:'Recettes',c:NAVYC,v:M6.map(x=>S.transactions.filter(t=>isIn(t)&&(t.date||'').startsWith(x)).reduce((s,t)=>s+eqT(t),0))},{n:'Dépenses',c:ORC,v:M6.map(x=>S.transactions.filter(t=>isOut(t)&&(t.date||'').startsWith(x)).reduce((s,t)=>s+eqT(t),0))}]);
   const rc=sumBy(tx.filter(isIn),t=>t.categorie||'—');pdfHBars(d,'Répartition des recettes du mois (équivalent $)',Object.entries(rc).map(([k,v])=>[k,v.USD+v.CDF/taux]),v=>money(v,'USD'));
   const dc=sumBy(tx.filter(isOut),t=>t.categorie||'—');pdfHBars(d,'Répartition des dépenses du mois (équivalent $)',Object.entries(dc).map(([k,v])=>[k,v.USD+v.CDF/taux]),v=>money(v,'USD'));
   d.newPage();}
  d.h2('1. Fréquentation');
  d.table([{t:'Date',w:.14},{t:'Réunion',w:.34},{t:'Hommes',w:.1,a:'r'},{t:'Femmes',w:.1,a:'r'},{t:'Enfants',w:.1,a:'r'},{t:'Visiteurs',w:.11,a:'r'},{t:'Total',w:.11,a:'r'}],
    att.map(a=>[fdate(a.date),a.culte,num(a.hommes),num(a.femmes),num(a.enfants),num(a.visiteurs),attTotal(a)]).concat(att.length?[{bold:1,cells:['Total','',att.reduce((s,a)=>s+num(a.hommes),0),att.reduce((s,a)=>s+num(a.femmes),0),att.reduce((s,a)=>s+num(a.enfants),0),att.reduce((s,a)=>s+num(a.visiteurs),0),tot]}]:[]),{empty:'Aucune présence enregistrée ce mois.'});
  d.h2('2. Entrées par catégorie');
  d.table([{t:'Catégorie',w:.5},{t:'Francs congolais',w:.25,a:'r'},{t:'Dollars',w:.25,a:'r'}],catRows(sumBy(tx.filter(isIn),t=>t.categorie||'—')),{empty:'Aucune entrée.'});
  d.h2('3. Sorties par catégorie');
  d.table([{t:'Catégorie',w:.5},{t:'Francs congolais',w:.25,a:'r'},{t:'Dollars',w:.25,a:'r'}],catRows(sumBy(tx.filter(t=>t.type==='sortie'),t=>t.categorie||'—')),{empty:'Aucune sortie.'});
  const end=lastDay(m),bal={};c.fonds.forEach(f=>bal[f]={CDF:0,USD:0});
  S.transactions.filter(t=>(t.date||'')<=end&&t.type!=='transfert').forEach(t=>{const k=t.fonds||'Sans fonds';bal[k]=bal[k]||{CDF:0,USD:0};bal[k][t.devise==='USD'?'USD':'CDF']+=(t.type==='sortie'?-1:1)*num(t.montant)});
  d.h2('4. Soldes des caisses au '+fdate(end));
  d.table([{t:'Fonds / caisse',w:.5},{t:'Francs congolais',w:.25,a:'r'},{t:'Dollars',w:.25,a:'r'}],Object.entries(bal).map(([k,v])=>[k,money(v.CDF,'CDF'),money(v.USD,'USD')]));
  d.h2('5. Nouveaux membres et baptêmes');
  d.table([{t:'Nom',w:.45},{t:'Téléphone',w:.25},{t:'Événement',w:.3}],nv.map(x=>[fullName(x),x.telephone,'Adhésion le '+fdate(x.dateAdhesion)]).concat(bap.map(x=>[fullName(x),x.telephone,'Baptême le '+fdate(x.dateBapteme)])),{empty:'Aucun ce mois.'});
  d.signatures(['Le Pasteur principal','Le Trésorier','Le Secrétaire']);
  savePDF(`Rapport ${c.sigle||'EMT'} ${m}.pdf`,d.finish());
}
function pdfJournal(){
  const m=UI.finMonth,f=UI.finFund,C=UI.finCompte,c=cfg();
  const l=S.transactions.filter(t=>(!m||(t.date||'').startsWith(m))&&(!f||t.fonds===f)&&(C?(acct(t)===C||t.compteDest===C):t.type!=='transfert')&&projMatch(t)).sort((a,b)=>(a.date||'').localeCompare(b.date||'')||String(a.numBon||'').localeCompare(String(b.numBon||'')));
  const d=pdfDoc('Journal de caisse',(m?monthLabel(m).replace(/^./,x=>x.toUpperCase()):'Toutes périodes')+(f?' · '+f:'')+(C?' · '+C:'')+(UI.finProj?' · '+(UI.finProj==='__none'?'Hors projets':'Projet '+((S.campagnes.find(c=>c.id===UI.finProj)||{}).nom||'')):''));
  const sg=t=>C?(amountFor(t,C,'CDF')||amountFor(t,C,'USD')):((isOut(t)||t.type==='pret')?-1:1)*num(t.montant);
  const tin=sumAll(sumBy(l.filter(t=>sg(t)>0),()=>'x')),tout=sumAll(sumBy(l.filter(t=>sg(t)<0),()=>'x'));
  d.kpis([['Entrées (FC)',money(tin.CDF,'CDF')],['Entrées ($)',money(tin.USD,'USD')],['Sorties (FC)',money(tout.CDF,'CDF')],['Sorties ($)',money(tout.USD,'USD')]]);
  d.table([{t:'Date',w:.12},{t:'N° bon',w:.1},{t:'Libellé',w:.36},{t:'Fonds',w:.14},{t:'Entrée',w:.14,a:'r'},{t:'Sortie',w:.14,a:'r'}],
    l.map(t=>{const mm=memberById(t.membreId);const lib=t.type==='transfert'?`Virement ${acct(t)} → ${t.compteDest}${t.description?' – '+t.description:''}`:[t.categorie,mm?fullName(mm):t.tiers,t.description].filter(Boolean).join(' – ');const s=sg(t)<0;return{cells:[fdate(t.date),t.numBon,lib,t.fonds,s?'':money(t.montant,t.devise),s?money(t.montant,t.devise):''],colors:[0,0,0,0,[46,139,87],[192,57,43]]}})
    .concat(l.length?[{bold:1,cells:['Total FC','','','',money(tin.CDF,'CDF'),money(tout.CDF,'CDF')]},{bold:1,cells:['Total $','','','',money(tin.USD,'USD'),money(tout.USD,'USD')]},{bold:1,cells:['Résultat','','','',money(tin.CDF-tout.CDF,'CDF'),money(tin.USD-tout.USD,'USD')]}]:[]),{empty:'Aucune opération.'});
  d.signatures(['Le Caissier / Trésorier','Le Pasteur principal']);
  savePDF(`Journal de caisse ${c.sigle||'EMT'} ${m||'complet'}.pdf`,d.finish());
}
function pdfBon(t){
  const c=cfg(),d=new PDFLIB.Doc(),M=40,W=d.W-2*M,s=(t.type==='sortie'||t.type==='pret'),mm=memberById(t.membreId);
  const tiers=mm?fullName(mm):(t.tiers||'');
  const draw=(y0,label)=>{
    d.rect(M,y0,W,370,{stroke:[180,195,198],lw:.8});
    const lw=130,lh=lw*LOGOI().h/LOGOI().w;d.image(M+14,y0+14,lw,lh);
    d.text(s?'BON DE SORTIE DE CAISSE':"BON D'ENTRÉE DE CAISSE",M+W-14,y0+30,{size:14,bold:1,align:'right',color:s?[192,57,43]:[46,139,87]});
    d.text('N° '+(t.numBon||'—'),M+W-14,y0+48,{size:12,bold:1,align:'right'});
    d.text(label,M+W-14,y0+62,{size:8,align:'right',color:GREY});
    d.line(M+14,y0+76,M+W-14,y0+76,{color:[31,63,117],lw:1.2});
    const kv=(k,v,x,y,w)=>{d.text(k,x,y,{size:8.5,color:GREY});d.text(v||'—',x,y+15,{size:11,bold:1,max:w})};
    kv('Date',fdate(t.date),M+14,y0+96,150);kv('Fonds / caisse',t.fonds,M+180,y0+96,150);kv('Catégorie',t.categorie,M+350,y0+96,W-364);
    d.rect(M+14,y0+128,W-28,46,{fill:[238,242,250],stroke:[200,212,232]});
    d.text('Montant',M+26,y0+146,{size:9,color:GREY});d.text(money(t.montant,t.devise),M+W-26,y0+160,{size:20,bold:1,align:'right',color:TEAL});
    d.text('Montant en lettres :',M+14,y0+194,{size:8.5,color:GREY});
    const lines=d.wrap(montantLettres(t.montant,t.devise),W-28,10.5,1);lines.slice(0,2).forEach((l,i)=>d.text(l,M+14,y0+209+i*14,{size:10.5,bold:1}));
    kv(s?'Payé à':'Reçu de',tiers,M+14,y0+246,W-28);
    d.text('Motif :',M+14,y0+284,{size:8.5,color:GREY});d.text(t.description||t.categorie||'—',M+14,y0+299,{size:10,max:W-28});
    const sw=(W-28)/3;[s?'Le Caissier':'Le Caissier',s?'Le Bénéficiaire':'Le Déposant','Visa du Pasteur'].forEach((l,i)=>{const x=M+14+i*sw;d.text(l,x+sw/2,y0+322,{size:8.5,bold:1,align:'center',color:[60,75,80]});d.line(x+10,y0+356,x+sw-10,y0+356,{color:[150,160,164]})});
  };
  draw(30,'Original');
  d.line(20,d.H/2,d.W-20,d.H/2,{dash:1,color:[150,160,164]});d.text('- - découper ici - -',d.W/2,d.H/2-4,{size:7,align:'center',color:GREY});
  draw(d.H/2+20,'Souche (copie caisse)');
  savePDF(`Bon ${t.numBon||''} ${c.sigle||'EMT'}.pdf`,d.output());
}
function pdfMembres(){
  const q=UI.q.toLowerCase(),c=cfg();
  const list=sortedMembers().filter(m=>(!UI.fstat||m.statut===UI.fstat)&&(!q||[fullName(m),m.telephone,m.email,m.adresse].join(' ').toLowerCase().includes(q)));
  const d=pdfDoc('Liste des membres',`${list.length} personne(s)${UI.fstat?' · '+UI.fstat:''}`);
  const by=s=>list.filter(m=>m.statut===s).length;
  d.kpis([['Total',String(list.length)],['Membres actifs',String(by('Membre actif')+list.filter(m=>!m.statut).length)],['Nouveaux convertis',String(by('Nouveau converti'))],['Visiteurs',String(by('Visiteur'))],['Hommes / Femmes',`${list.filter(m=>m.sexe==='M').length} / ${list.filter(m=>m.sexe==='F').length}`]]);
  d.table([{t:'N°',w:.05,a:'r'},{t:'Nom complet',w:.27},{t:'Sexe',w:.06},{t:'Téléphone',w:.15},{t:'Statut',w:.15},{t:'Fonction',w:.14},{t:'Groupes',w:.18}],
    list.map((m,i)=>[i+1,fullName(m),m.sexe||'',m.telephone,m.statut||'Membre actif',m.fonction&&m.fonction!=='Fidèle'?m.fonction:'',(m.groupes||[]).map(groupName).filter(Boolean).join(', ')]),{empty:'Aucun membre.'});
  savePDF(`Membres ${c.sigle||'EMT'}.pdf`,d.finish());
}
function pdfAttestation(id){
  const m=memberById(id),c=cfg(),y=UI.repMonth.slice(0,4);if(!m)return;
  const tx=S.transactions.filter(t=>t.membreId===id&&isIn(t)&&(t.date||'').startsWith(y)).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  const d=pdfDoc('Attestation de contributions','Année '+y),t=sumAll(sumBy(tx,()=>'x'));
  d.y+=6;
  d.para(`Nous soussignés, responsables de l'${c.nom}${c.ville?' à '+c.ville:''}, attestons que ${m.sexe==='F'?'Madame':m.sexe==='M'?'Monsieur':'M./Mme'} ${fullName(m)} a fidèlement contribué à l'œuvre de Dieu au cours de l'année ${y}, selon le détail ci-dessous enregistré dans nos livres de caisse.`,10.5);
  d.y+=4;
  d.table([{t:'Date',w:.16},{t:'N° bon',w:.14},{t:'Nature',w:.4},{t:'Montant',w:.3,a:'r'}],tx.map(x=>[fdate(x.date),x.numBon,x.categorie,money(x.montant,x.devise)]).concat(tx.length?[{bold:1,cells:['Total FC','','',money(t.CDF,'CDF')]},{bold:1,cells:['Total $','','',money(t.USD,'USD')]}]:[]),{empty:'Aucune contribution enregistrée pour cette année.'});
  d.para('Que le Seigneur vous bénisse et vous le rende au centuple. « Que chacun donne comme il l\'a résolu en son cœur, sans tristesse ni contrainte ; car Dieu aime celui qui donne avec joie. » (2 Corinthiens 9:7)',9.5);
  d.y+=6;d.text(`Fait à ${c.ville||'……………………'}, le ${new Date().toLocaleDateString(LOC(),{day:'numeric',month:'long',year:'numeric'})}`,d.W-d.M,d.y+10,{size:10,align:'right'});d.y+=20;
  d.signatures(['Le Trésorier','Le Pasteur principal']);
  savePDF(`Attestation ${fullName(m)} ${y}.pdf`,d.finish());
}

/* ---------- connexion, rôles, thème ---------- */
let USER=null,ME=null,ROLE='admin';
const AUTH={hash:null,canPin:false,unlocked:false,last:Date.now()};
const ROLES={admin:{l:'Administrateur',v:'*'},pasteur:{l:'Pasteur / ancien',v:['projets','album','inventaire','evenements','rdv','formulaires','mediatheque','aide','dashboard','membres','groupes','communication','culte','dons','calendrier','presences','suivis','finances','rapports','parametres']},tresorier:{l:'Trésorier',v:['projets','inventaire','aide','evenements','dashboard','membres','calendrier','dons','finances','rapports','parametres']},secretaire:{l:'Secrétaire',v:['album','inventaire','evenements','rdv','formulaires','mediatheque','aide','dashboard','membres','groupes','communication','culte','calendrier','presences','suivis','rapports','parametres']},fidele:{l:'Fidèle (espace membre)',v:['monespace','album','mediatheque','aide']},lecteur:{l:'Lecteur (consultation)',v:['album','mediatheque','aide','dashboard','calendrier','parametres'],ro:1}};
const allowed=k=>{const r=ROLES[ROLE]||ROLES.lecteur;return r.v==='*'||r.v.includes(k)};
const FINLIM=()=>!!(ROLES[ROLE]&&ROLES[ROLE].finLim);
const isOrdOff=c=>/offrande|action de gr/i.test(c||'');
function isOrd(t){const g=cfg().fonds[0];if(t.campagneId||(t.fonds&&t.fonds!==g))return false;if(t.type==='entree')return isOrdOff(t.categorie);if(t.type==='transfert')return false;return true}
function applyFinLim(){if(!FINLIM())return;S.transactions=S.transactions.filter(isOrd);S.campagnes=[];S.lots=[];S.biens=[];S.budgets=[];S.rapprochements=[]}
function updateRole(){_updateRole();applyFinLim()}
function _updateRole(){(cfg().customRoles||[]).forEach(r=>{ROLES[r.id]={l:r.nom,v:(r.ecrans||[]).concat('parametres','aide'),ro:r.ro,finLim:r.finLim}});if(mode!=='db'||!ME)ROLE='admin';else if(ME.isOwner)ROLE='admin';else ROLE=ROLES[S.roles[ME.id]]&&S.roles[ME.id]!=='admin'?S.roles[ME.id]:'lecteur';if(window.EMT_STANDALONE&&ME){ROLE=ME.isOwner?'admin':(ROLES[S.roles[ME.id]]&&S.roles[ME.id]!=='admin'?S.roles[ME.id]:(ROLES[ME.role]&&ME.role!=='admin'?ME.role:'fidele'))}}
function getTheme(){try{return localStorage.getItem('emt_theme')||'glass'}catch(e){return'glass'}}
function applyTheme(t){document.body.classList.toggle('glass',t==='glass');try{localStorage.setItem('emt_theme',t)}catch(e){}}
async function sha(s){try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){let h=5381;for(const ch of s)h=(h*33^ch.charCodeAt(0))>>>0;return'x'+h}}
const pinDoc=()=>db.doc('data/users/'+ME.id+'/profile');
function loginScreen(kind,err){
  const c=cfg(),L=$('#login');L.classList.remove('hide');
  const hello=ME&&ME.name?`<img class="av2" src="${esc(ME.avatarUrl)}" alt=""><p style="margin-top:6px">${esc(ME.name)}</p>`:'';
  let body='';
  if(kind==='create')body=`<h2>Créer votre code</h2><p>Choisissez un code de 4 à 6 chiffres. Il vous sera demandé à chaque ouverture.</p>${hello}<form id="lform"><input id="p1" type="password" inputmode="numeric" maxlength="6" placeholder="Nouveau code" autocomplete="new-password"><input id="p2" type="password" inputmode="numeric" maxlength="6" placeholder="Confirmer le code" autocomplete="new-password"><div class="lerr">${esc(err||'')}</div><button class="lbtn">Enregistrer et entrer</button></form>`;
  else if(kind==='pin')body=`<h2>Bon retour</h2>${hello||'<p>Entrez votre code d\'accès</p>'}<form id="lform"><input id="p1" type="password" inputmode="numeric" maxlength="6" placeholder="Code d'accès" autocomplete="current-password" autofocus><div class="lerr">${esc(err||'')}</div><button class="lbtn">Se connecter</button></form><button class="llink" id="lforgot">Code oublié ?</button>`;
  else body=`<h2>Bienvenue</h2>${hello}<p>${kind==='demo'?'Mode démonstration : les données saisies ne seront pas conservées.':'Gestion de l\'église'}</p><form id="lform"><button class="lbtn">Entrer</button></form>`;
  $('#lcard').innerHTML=`<img class="sym" src="${$('#logo img').src}" alt=""><div class="cn">${esc(c.nom)}</div>${body}<div class="lfoot">Connexion protégée par votre compte Claude${kind==='pin'||kind==='create'?' et votre code personnel':''}.</div>`;
  const f=$('#lform');setTimeout(()=>{const i=$('#p1');if(i)i.focus()},50);
  f.onsubmit=async e=>{e.preventDefault();const b=f.querySelector('button');
    if(kind==='create'){const a=$('#p1').value,z=$('#p2').value;if(!/^\d{4,6}$/.test(a))return loginScreen('create','Le code doit contenir 4 à 6 chiffres.');if(a!==z)return loginScreen('create','Les deux codes ne correspondent pas.');
      b.disabled=true;const h=await sha(ME.id+':'+a);try{await pinDoc().set({pinHash:h,updatedAt:new Date().toISOString()});AUTH.hash=h}catch(e){toast('Code non enregistré : accès sans code',1);AUTH.canPin=false}unlock();return}
    if(kind==='pin'){b.disabled=true;const h=await sha(ME.id+':'+$('#p1').value);if(h===AUTH.hash)unlock();else{loginScreen('pin','Code incorrect.')}return}
    unlock()};
  const fg=$('#lforgot');if(fg)fg.onclick=async()=>{fg.disabled=true;try{await pinDoc().delete()}catch(e){}AUTH.hash=null;loginScreen('create')};
}
function unlock(){AUTH.unlocked=true;AUTH.last=Date.now();try{sessionStorage.setItem('emt_unlock',String(Date.now()))}catch(e){}$('#login').classList.add('hide');
  if(db&&ME&&ME.id&&!unlock.done){unlock.done=1;db.doc('people/'+ME.id).set({lastSeen:today()}).catch(()=>{})}render()}
function lock(){if(window.EMT_API){window.EMT_API.signOut();return}AUTH.unlocked=false;try{sessionStorage.removeItem('emt_unlock')}catch(e){}closeModal();loginScreen(AUTH.canPin?(AUTH.hash?'pin':'create'):(mode==='local'?'demo':'enter'))}
['click','keydown','touchstart'].forEach(ev=>document.addEventListener(ev,()=>{AUTH.last=Date.now()},{passive:true}));
setInterval(()=>{if(AUTH.unlocked&&AUTH.canPin&&Date.now()-AUTH.last>15*60*1000)lock()},30000);
async function fillNames(){
  if(!USER)return;const els=[...document.querySelectorAll('[data-uid]')];if(!els.length)return;
  const ps=await USER.profiles([...new Set(els.map(e=>e.dataset.uid))]);
  els.forEach(e=>{const p=ps[e.dataset.uid];if(!p)return;if(e.tagName==='IMG')e.src=p.avatarUrl;else e.textContent=p.name||'Utilisateur sans nom'});
}
async function setRole(uid,role){if(role==='admin'&&!confirm("Donner l'accès TOTAL d'administrateur à cette personne ? Elle pourra tout voir et tout modifier, y compris les rôles.")){render();return}const roles={...S.roles,[uid]:role};try{await db.doc('acces/roles').set({roles});toast('Rôle mis à jour')}catch(e){toast(errMsg(e),1)}}

/* ================= COMPTABILITÉ ================= */
const isIn=t=>t.type==='entree'||!t.type;
const isOut=t=>t.type==='sortie';
const dv=t=>t.devise==='USD'?'USD':'CDF';
const acct=t=>t.compte||cfg().comptes[0];
function amountFor(t,C,dev){
  if(dv(t)!==dev)return 0;const m=num(t.montant);
  if(t.type==='transfert')return(t.compteDest===C?m:0)-(acct(t)===C?m:0);
  if(acct(t)!==C)return 0;return(isOut(t)||t.type==='pret')?-m:m;
}
function accountBalances(upto){
  const c=cfg(),names=[...new Set(c.comptes.concat(S.transactions.map(acct),S.transactions.map(t=>t.compteDest).filter(Boolean)))],b={};
  names.forEach(n=>b[n]={CDF:0,USD:0});
  S.transactions.filter(t=>!upto||(t.date||'')<=upto).forEach(t=>names.forEach(n=>{b[n].CDF+=amountFor(t,n,'CDF');b[n].USD+=amountFor(t,n,'USD')}));
  return b;
}
const payees=()=>[...new Set(S.transactions.map(t=>t.tiers).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fr'));
const FTABS=[['ops','Opérations'],['prets','Prêts'],['journal','Journal'],['comptes','Comptes'],['budget','Budget'],['rappro','Rapprochement'],['etats','États financiers'],['immos','Immobilisations']];
function vFinJournal(){
  const q=(UI.jq||'').toLowerCase(),mo=UI.jm||'',A={create:['Ajout','b-done'],update:['Modification','b-encours'],delete:['Suppression','b-inactif']};
  const J=(S.journal||[]).filter(j=>j.fin||j.quoi==='Opération').filter(j=>(!mo||(j.at||'').startsWith(mo))&&(!q||[j.qui,j.label,j.details].join(' ').toLowerCase().includes(q))).sort((a,b)=>(b.at||'').localeCompare(a.at||''));
  const ms=[...new Set((S.journal||[]).filter(j=>j.fin||j.quoi==='Opération').map(j=>(j.at||'').slice(0,7)))].sort().reverse();
  return`<div class="toolbar"><div class="muted small" style="flex:1;min-width:220px">Chaque ajout, modification ou suppression d'une opération financière est noté ici : qui, quand, et ce qui a changé. Seul l'administrateur voit cette page ; personne ne peut effacer ces traces.</div></div>
  <div class="toolbar"><input class="inp" placeholder="Rechercher un nom, un montant…" data-bind="jq" value="${esc(UI.jq||'')}" style="flex:1;min-width:160px"><select class="inp" data-bind="jm"><option value="">Tous les mois</option>${ms.map(m=>opt([m,mLab(m)+' '+m.slice(0,4)],mo)).join('')}</select><button class="btn" data-act="pdfJournalFin">PDF</button></div>
  <div class="list">${J.length?J.slice(0,300).map(j=>{const a=A[j.action]||['?',''];return`<div class="row" style="cursor:default;align-items:flex-start"><div class="grow"><div class="t"><span class="badge ${a[1]}">${a[0]}</span> ${esc(j.label||'')}</div>${j.details?`<div class="small" style="margin-top:4px;white-space:normal">${esc(j.details)}</div>`:''}<div class="st">${esc(new Date(j.at).toLocaleString(LOC(),{dateStyle:'medium',timeStyle:'short'}))} · par <b>${esc(j.qui||'?')}</b></div></div></div>`}).join(''):'<div class="card empty">Aucune modification enregistrée pour le moment.</div>'}</div>`;
}
function pdfJournalFin(){const J=(S.journal||[]).filter(j=>j.fin||j.quoi==='Opération').filter(j=>!UI.jm||(j.at||'').startsWith(UI.jm)).sort((a,b)=>(b.at||'').localeCompare(a.at||''));
  const d=pdfDoc('Journal des modifications financières',UI.jm?mLab(UI.jm)+' '+UI.jm.slice(0,4):'Toutes les dates');
  d.table([{t:'Date et heure',w:.17},{t:'Action',w:.12},{t:'Par',w:.15},{t:'Opération / changements',w:.56}],J.map(j=>[new Date(j.at).toLocaleString('fr-FR',{dateStyle:'short',timeStyle:'short'}),{create:'Ajout',update:'Modification',delete:'Suppression'}[j.action]||j.action,j.qui||'',(j.label||'')+(j.details?' — '+j.details:'')]),{empty:'Aucune modification.'});
  savePDF(`Journal finances ${cfg().sigle||'EMT'}.pdf`,d.finish())}
function vFinances(){
  const sub={ops:vFinOps,prets:vFinPrets,journal:()=>ROLE==='admin'?vFinJournal():vFinOps(),comptes:vComptes,budget:vBudget,rappro:vRappro,etats:vEtats,immos:vImmos}[UI.finTab]||vFinOps;
  if(FINLIM())return`<div class="banner show info" style="margin-bottom:12px">Accès limité : vous voyez et saisissez seulement les offrandes ordinaires de la caisse générale et ses dépenses.</div>`+vFinOps();
  return`<div class="tabs" style="margin-bottom:14px">${FTABS.filter(([k])=>k!=='journal'||ROLE==='admin').map(([k,l])=>`<button class="tab${UI.finTab===k?' on':''}" data-act="finTab" data-k="${k}">${l}</button>`).join('')}</div>`+sub();
}
/* ---------- Prêts d'argent de l'église ---------- */
const loanRepays=l=>S.transactions.filter(t=>t.type==='rembpret'&&t.pretId===l.id).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
const loanPaid=l=>loanRepays(l).reduce((a,t)=>a+(dv(t)===dv(l)?num(t.montant):0),0);
const loanLeft=l=>Math.max(0,num(l.montant)-loanPaid(l));
const loanWho=l=>{const m=memberById(l.membreId);return m?fullName(m):(l.tiers||'—')};
function loanState(l){const r=loanLeft(l);if(r<=0.0001)return['Remboursé','b-done'];if(l.echeance&&l.echeance<today())return['En retard','b-inactif'];return['En cours','b-encours']}
function vFinPrets(){
  if(UI.loan){const l=S.transactions.find(t=>t.id===UI.loan&&t.type==='pret');if(l)return vLoan(l);UI.loan=null}
  const L=S.transactions.filter(t=>t.type==='pret').sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const open=L.filter(l=>loanLeft(l)>0.0001),tot={CDF:0,USD:0};open.forEach(l=>tot[dv(l)]+=loanLeft(l));
  const late=open.filter(l=>l.echeance&&l.echeance<today()).length;
  const row=l=>{const[st,cl]=loanState(l),r=loanLeft(l);return`<div class="row" data-act="openLoan" data-id="${l.id}"><div class="grow"><div class="t">${esc(loanWho(l))} <span class="badge ${cl}">${st}</span></div><div class="st">Prêté le ${fdate(l.date)} · ${money(l.montant,dv(l))}${l.echeance?' · à rendre le '+fdate(l.echeance):''}${l.description?' · '+esc(l.description):''}</div></div><div class="amt ${r>0?'neg':'pos'}">${r>0?'reste '+money(r,dv(l)):'✓'}</div></div>`};
  return`<div class="toolbar"><div class="muted small">L'argent prêté sort de la caisse mais n'est pas une dépense : il reste dû à l'église. Chaque remboursement le fait revenir dans la caisse.</div><span class="sp"></span><button class="btn primary" data-act="newLoan">+ Nouveau prêt</button></div>
  <div class="grid3" style="margin-bottom:12px"><div class="card kpi"><div class="l">Encore dû à l'église</div><div class="v neg" style="font-size:17px">${both(tot)}</div></div><div class="card kpi"><div class="l">Prêts en cours</div><div class="v">${open.length}</div></div><div class="card kpi"><div class="l">En retard</div><div class="v ${late?'neg':''}">${late}</div></div></div>
  <div class="list">${L.length?open.map(row).join('')+(L.length>open.length?`<div class="muted small" style="margin:14px 2px 6px">Prêts remboursés</div>`+L.filter(l=>loanLeft(l)<=0.0001).map(row).join(''):''):'<div class="card empty">Aucun prêt enregistré. Cliquez sur « + Nouveau prêt » quand l\'église prête de l\'argent à quelqu\'un.</div>'}</div>`;
}
function vLoan(l){
  const R=loanRepays(l),r=loanLeft(l),[st,cl]=loanState(l),d=dv(l),pc=num(l.montant)?loanPaid(l)/num(l.montant)*100:0;
  return`<div class="toolbar"><button class="btn sm" data-act="closeLoan">‹ Prêts</button><h2 style="margin:0;flex:1">${esc(loanWho(l))} <span class="badge ${cl}">${st}</span></h2><button class="btn sm" data-act="editTx" data-id="${l.id}">Modifier</button>${r>0?`<button class="btn primary" data-act="repayLoan" data-id="${l.id}">+ Remboursement</button>`:''}</div>
  <div class="grid3" style="margin-bottom:12px"><div class="card kpi"><div class="l">Montant prêté</div><div class="v" style="font-size:17px">${money(l.montant,d)}</div><div class="s">le ${fdate(l.date)} · ${esc(acct(l))}</div></div><div class="card kpi"><div class="l">Déjà remboursé</div><div class="v pos" style="font-size:17px">${money(loanPaid(l),d)}</div><div class="s">${bar(pc)}</div></div><div class="card kpi"><div class="l">Reste à rendre</div><div class="v ${r>0?'neg':''}" style="font-size:17px">${money(r,d)}</div><div class="s">${l.echeance?'à rendre le '+fdate(l.echeance):'pas de date prévue'}</div></div></div>
  ${l.description?`<div class="card" style="margin-bottom:12px"><b>Motif :</b> ${esc(l.description)}</div>`:''}
  <div class="sec"><h2>Remboursements</h2><div class="list">${R.length?R.map(t=>`<div class="row" data-act="editTx" data-id="${t.id}"><div class="grow"><div class="t">Remboursement</div><div class="st">${fdate(t.date)} · ${esc(t.numBon||'')} · ${esc(acct(t))}${t.description?' · '+esc(t.description):''}</div></div><div class="amt pos">+ ${money(t.montant,dv(t))}</div></div>`).join(''):'<div class="card empty">Aucun remboursement pour l\'instant.</div>'}</div></div>`;
}
function loanForm(t){
  const c=cfg(),mem=[['','—']].concat(sortedMembers().filter(m=>!isGone(m)).map(m=>[m.id,fullName(m)]));
  openForm({title:t?'Modifier le prêt':'Nouveau prêt d\'argent',values:t||{date:today(),devise:'CDF',compte:c.comptes[0],fonds:c.fonds[0],numBon:nextBon('pret')},
   fields:[{k:'membreId',label:'Prêté à (membre)',type:'select',options:mem},{k:'tiers',label:'Ou nom (si non membre)'},{k:'date',label:'Date du prêt',type:'date',req:1},{k:'echeance',label:'À rendre avant le (facultatif)',type:'date'},{k:'montant',label:'Montant prêté',type:'number',req:1},{k:'devise',label:'Devise',type:'select',options:[['CDF','Francs congolais (FC)'],['USD','Dollars ($)']]},{k:'compte',label:'Pris dans le compte',type:'select',options:c.comptes},{k:'fonds',label:'Fonds',type:'select',options:c.fonds},{k:'numBon',label:'N° de pièce'},{k:'description',label:'Motif / conditions',type:'textarea',full:1}],
   onSave:d=>{if(!(d.montant>0)){toast('Montant invalide',1);return false}if(!d.membreId&&!String(d.tiers||'').trim()){toast('Indiquez à qui l\'argent est prêté',1);return false}d.categorie='Prêt accordé';return save('transactions',{...(t||{}),...d,type:'pret'}).then(ok=>{if(ok&&!t){UI.finTab='prets';render()}return ok})},
   onDelete:t?()=>{if(loanRepays(t).length){toast('Supprimez d\'abord les remboursements de ce prêt',1);return false}UI.loan=null;return removeDoc('transactions',t.id)}:null});
}
function repayForm(l,t){
  if(!l){if(t)return txForm(t);return}const c=cfg(),r=loanLeft(l)+(t?num(t.montant):0);
  openForm({title:(t?'Modifier le remboursement':'Remboursement')+' – '+loanWho(l),values:t||{date:today(),montant:r,compte:acct(l),numBon:nextBon('rembpret')},
   fields:[{k:'date',label:'Date',type:'date',req:1},{k:'montant',label:'Montant rendu ('+(dv(l)==='USD'?'$':'FC')+') – reste dû : '+money(r,dv(l)),type:'number',req:1},{k:'compte',label:'Déposé dans le compte',type:'select',options:c.comptes},{k:'numBon',label:'N° de pièce'},{k:'description',label:'Note',full:1}],
   onSave:d=>{if(!(d.montant>0)){toast('Montant invalide',1);return false}if(d.montant>r+0.0001){toast('Le montant dépasse ce qui reste dû ('+money(r,dv(l))+')',1);return false}return save('transactions',{...(t||{}),...d,type:'rembpret',pretId:l.id,categorie:'Remboursement de prêt',devise:dv(l),fonds:l.fonds||'',membreId:l.membreId||'',tiers:l.tiers||''})},
   onDelete:t?()=>removeDoc('transactions',t.id):null});
}
function transferForm(t){
  const c=cfg();
  openForm({title:t?'Modifier le virement':'Virement entre comptes',values:t||{date:today(),devise:'CDF',compte:c.comptes[0],compteDest:c.comptes[1]||c.comptes[0],numBon:nextBon('transfert')},
    fields:[{k:'date',label:'Date',type:'date',req:1},{k:'numBon',label:'N° de pièce'},{k:'compte',label:'Depuis le compte',type:'select',options:c.comptes},{k:'compteDest',label:'Vers le compte',type:'select',options:c.comptes},{k:'montant',label:'Montant',type:'number',req:1},{k:'devise',label:'Devise',type:'select',options:[['CDF','Francs congolais (FC)'],['USD','Dollars ($)']]},{k:'description',label:'Motif',full:1,ph:'ex. Dépôt des offrandes à la banque'}],
    onSave:d=>{if(!(d.montant>0)){toast('Montant invalide',1);return false}if(d.compte===d.compteDest){toast('Choisissez deux comptes différents',1);return false}return save('transactions',{...(t||{}),...d,type:'transfert',categorie:'Virement interne'})},
    onDelete:t?()=>removeDoc('transactions',t.id):null});
}
function vComptes(){
  const c=cfg(),b=accountBalances(),taux=num(c.taux)||1;
  const tot=sumAll(b);
  return`<div class="toolbar"><div class="muted">Où se trouve l'argent : caisse, banque, mobile money.</div><span class="sp"></span><button class="btn" data-act="newTransfer">⇄ Virement</button></div>
  <div class="grid3">${Object.entries(b).map(([k,v])=>{const open=S.transactions.filter(t=>!t.rapproche&&(amountFor(t,k,'CDF')||amountFor(t,k,'USD'))).length;const last=S.rapprochements.filter(r=>r.compte===k).sort((a,b)=>(b.date||'').localeCompare(a.date||''))[0];
   return`<div class="card kpi"><div class="l">${esc(k)}</div><div class="v ${v.CDF<0?'neg':''}" style="font-size:19px">${money(v.CDF,'CDF')}</div><div class="v ${v.USD<0?'neg':''}" style="font-size:17px;margin-top:0">${money(v.USD,'USD')}</div><div class="s">${open} opération(s) non rapprochée(s)${last?' · dernier rapprochement le '+fdate(last.date):''}</div><button class="btn sm" style="margin-top:10px" data-act="goRappro" data-k="${esc(k)}">Rapprocher</button></div>`}).join('')}</div>
  <div class="card sec kpi"><div class="l">Total tous comptes</div><div class="v" style="font-size:18px">${money(tot.CDF,'CDF')} · ${money(tot.USD,'USD')}</div><div class="s">≈ ${money(tot.USD+tot.CDF/taux,'USD')} au taux de ${num(c.taux).toLocaleString('fr-FR')} FC</div></div>
  <div class="muted small sec">Les comptes se modifient dans Paramètres → Informations de l'église.</div>`;
}
/* budget */
const budgetFor=y=>S.budgets.find(b=>b.id===String(y))||null;
function conv(t,dev){const taux=num(cfg().taux)||1,m=num(t.montant);return dev==='USD'?(dv(t)==='USD'?m:m/taux):(dv(t)==='USD'?m*taux:m)}
function realise(type,cat,pred,dev){return S.transactions.filter(t=>(type==='s'?isOut(t):isIn(t))&&t.categorie===cat&&pred(t.date||'')).reduce((s,t)=>s+conv(t,dev),0)}
function budgetRows(y){
  const b=budgetFor(y),dev=(b&&b.devise)||'USD',c=cfg(),L=(b&&b.lignes)||{},pred=d=>d.startsWith(y);
  const mk=(type,cats)=>{const all=[...new Set(cats.concat(S.transactions.filter(t=>(type==='s'?isOut(t):isIn(t))&&(t.date||'').startsWith(y)).map(t=>t.categorie)))];
    return all.map(cat=>({cat,bud:num(L[type+'|'+cat]),r:realise(type,cat,pred,dev)})).filter(x=>x.bud||x.r)};
  return{dev,e:mk('e',c.catEntrees),s:mk('s',c.catSorties),exists:!!b};
}
function bar(p,bad){const w=Math.max(0,Math.min(100,p));return`<div style="height:7px;background:#e6ecee;border-radius:4px;overflow:hidden;min-width:60px"><div style="height:100%;width:${w}%;background:${bad?'var(--bad)':'var(--brand)'}"></div></div>`}
function vBudget(){
  const y=UI.budYear,R=budgetRows(y),cy=String(new Date().getFullYear());
  const doy=y===cy?Math.round((Date.now()-new Date(+y,0,1))/864e5/3.65):(y<cy?100:0);
  const tbl=(rows,type)=>{const tb=rows.reduce((s,x)=>s+x.bud,0),tr=rows.reduce((s,x)=>s+x.r,0);
    return rows.length?`<table class="t"><tr><th>Catégorie</th><th class="n">Budget</th><th class="n">Réalisé</th><th class="n">Écart</th><th style="width:28%">Avancement</th></tr>${rows.map(x=>{const p=x.bud?x.r/x.bud*100:0,ec=x.r-x.bud,bad=type==='s'?x.r>x.bud&&x.bud>0:false;
      return`<tr><td>${esc(x.cat)}</td><td class="n">${money(x.bud,R.dev)}</td><td class="n">${money(x.r,R.dev)}</td><td class="n ${type==='s'?(ec>0?'neg':'pos'):(ec>=0?'pos':'neg')}">${ec>0?'+':''}${money(ec,R.dev)}</td><td>${x.bud?bar(p,bad)+`<span class="small muted">${Math.round(p)} %</span>`:'<span class="small muted">non budgété</span>'}</td></tr>`}).join('')}
      <tr style="font-weight:700"><td>Total</td><td class="n">${money(tb,R.dev)}</td><td class="n">${money(tr,R.dev)}</td><td class="n">${money(tr-tb,R.dev)}</td><td>${tb?Math.round(tr/tb*100)+' %':''}</td></tr></table>`:'<div class="muted small">Aucune ligne.</div>'};
  const years=[];for(let k=+cy-2;k<=+cy+1;k++)years.push(String(k));
  return`<div class="toolbar"><select class="inp" data-bind="budYear">${years.map(x=>opt(x,y)).join('')}</select><span class="muted small">${y===cy?`Nous sommes à ${doy} % de l'année`:''}</span><span class="sp"></span><button class="btn" data-act="pdfBudget">PDF</button><button class="btn primary" data-act="editBudget">${R.exists?'Modifier le budget':'Créer le budget '+y}</button></div>
  ${R.exists?'':`<div class="banner show info">Aucun budget pour ${y}. Cliquez sur « Créer le budget » pour fixer un montant par catégorie ; le réalisé se calcule tout seul à partir des opérations.</div>`}
  <div class="card"><h2>Recettes (en ${R.dev==='USD'?'dollars':'francs congolais'})</h2>${tbl(R.e,'e')}</div>
  <div class="card sec"><h2>Dépenses</h2>${tbl(R.s,'s')}</div>
  <div class="muted small sec">Les montants dans l'autre devise sont convertis au taux de ${num(cfg().taux).toLocaleString('fr-FR')} FC pour 1 $.</div>`;
}
function budgetForm(){
  const y=UI.budYear,b=budgetFor(y),c=cfg(),L=(b&&b.lignes)||{};
  const fe=c.catEntrees.map((cat,i)=>({k:'e'+i,label:'Recette – '+cat,type:'number',cat:'e|'+cat})),fs=c.catSorties.map((cat,i)=>({k:'s'+i,label:'Dépense – '+cat,type:'number',cat:'s|'+cat}));
  const vals={devise:(b&&b.devise)||'USD'};fe.concat(fs).forEach(f=>{if(L[f.cat])vals[f.k]=L[f.cat]});
  openForm({title:'Budget '+y,values:vals,fields:[{k:'devise',label:'Devise du budget',type:'select',full:1,options:[['USD','Dollars ($)'],['CDF','Francs congolais (FC)']]}].concat(fe,fs),
    onSave:d=>{const lignes={};fe.concat(fs).forEach(f=>{if(num(d[f.k]))lignes[f.cat]=num(d[f.k])});return save('budgets',{id:y,devise:d.devise,lignes})}});
}
/* rapprochement */
function vRappro(){
  const c=cfg(),C=UI.rcCompte||c.comptes[0],dev=UI.rcDev,dt=UI.rcDate;
  const txs=S.transactions.filter(t=>amountFor(t,C,dev)!==0&&(t.date||'')<=dt);
  const prev=txs.filter(t=>t.rapproche).reduce((s,t)=>s+amountFor(t,C,dev),0);
  const open=txs.filter(t=>!t.rapproche).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  const pts=open.filter(t=>t.pointe),sp=prev+pts.reduce((s,t)=>s+amountFor(t,C,dev),0);
  const rel=UI.rcSolde===''?null:Number(UI.rcSolde),ec=rel===null||isNaN(rel)?null:Math.round((rel-sp)*100)/100;
  const livres=txs.reduce((s,t)=>s+amountFor(t,C,dev),0);
  const hist=S.rapprochements.filter(r=>r.compte===C).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  return`<div class="card" style="margin-bottom:12px"><div class="muted small" style="margin-bottom:10px">Comparez votre relevé (banque, mobile money ou comptage de la caisse) avec vos écritures : cochez les opérations qui figurent sur le relevé, saisissez le solde du relevé, puis validez quand l'écart est à zéro.</div>
  <div class="toolbar" style="margin:0"><select class="inp" data-bind="rcCompte">${c.comptes.map(x=>opt(x,C)).join('')}</select><select class="inp" data-bind="rcDev">${opt(['CDF','FC'],dev)}${opt(['USD','$'],dev)}</select><input type="date" class="inp" data-bind="rcDate" value="${esc(dt)}"><input id="rcSolde" class="inp" data-bind="rcSolde" inputmode="decimal" placeholder="Solde du relevé" value="${esc(UI.rcSolde)}" style="width:150px"></div></div>
  <div class="grid4"><div class="card kpi"><div class="l">Solde selon vos livres</div><div class="v" style="font-size:16px">${money(livres,dev)}</div></div><div class="card kpi"><div class="l">Solde pointé</div><div class="v" style="font-size:16px">${money(sp,dev)}</div><div class="s">${pts.length} opération(s) cochée(s)</div></div><div class="card kpi"><div class="l">Solde du relevé</div><div class="v" style="font-size:16px">${rel===null||isNaN(rel)?'—':money(rel,dev)}</div></div><div class="card kpi"><div class="l">Écart</div><div class="v ${ec===0?'pos':ec===null?'':'neg'}" style="font-size:16px">${ec===null?'—':money(ec,dev)}</div><div class="s">${ec===0?'Équilibré ✓':ec===null?'Saisissez le solde du relevé':'À expliquer'}</div></div></div>
  <div class="toolbar sec"><b>Opérations à pointer (${open.length})</b><span class="sp"></span>${open.length?'<button class="btn sm" data-act="pointAll">Tout cocher</button>':''}<button class="btn primary sm" data-act="validRappro" ${ec===0&&pts.length?'':'disabled'}>Valider le rapprochement</button></div>
  <div class="list">${open.length?open.map(t=>{const a=amountFor(t,C,dev);return`<label class="row"><input type="checkbox" data-act="pointe" data-id="${t.id}"${t.pointe?' checked':''} style="width:18px;height:18px"><div class="grow"><div class="t">${esc(t.type==='transfert'?'Virement interne':t.categorie)}${t.tiers?' – '+esc(t.tiers):''}</div><div class="st">${fdate(t.date)} · ${esc(t.numBon||'')}${t.description?' · '+esc(t.description):''}</div></div><div class="amt ${a<0?'neg':'pos'}">${a<0?'−':'+'} ${money(Math.abs(a),dev)}</div></label>`}).join(''):'<div class="empty">Tout est rapproché jusqu\'à cette date.</div>'}</div>
  ${hist.length?`<div class="sec"><h2>Historique des rapprochements</h2><div class="list">${hist.map(r=>`<div class="row" style="cursor:default"><div class="grow"><div class="t">${fdate(r.date)} – ${money(r.soldeReleve,r.devise)}</div><div class="st">${r.nb} opération(s) rapprochée(s)</div></div><span class="badge b-done">Équilibré</span></div>`).join('')}</div></div>`:''}`;
}
/* états financiers */
function periodPred(){const y=UI.etYear,p=UI.etPer;if(p==='annee')return d=>d.startsWith(y);if(p[0]==='T'){const q=+p[1];return d=>d.startsWith(y)&&Math.ceil(+d.slice(5,7)/3)===q}return d=>d.startsWith(y+'-'+p)}
function periodLabel(){const y=UI.etYear,p=UI.etPer;if(p==='annee')return'Année '+y;if(p[0]==='T')return p[1]+'e trimestre '+y;return monthLabel(y+'-'+p)}
function periodEnd(){const y=UI.etYear,p=UI.etPer;if(p==='annee')return y+'-12-31';if(p[0]==='T')return lastDay(y+'-'+pad(+p[1]*3));return lastDay(y+'-'+p)}
function etatsData(){
  const pred=periodPred(),taux=num(cfg().taux)||1,tx=S.transactions.filter(t=>pred(t.date||''));
  const rec=sumBy(tx.filter(isIn),t=>t.categorie||'—'),dep=sumBy(tx.filter(isOut),t=>t.categorie||'—'),proj=sumBy(tx.filter(isIn),t=>projName(t)||'Hors projets (offrandes, dîmes…)');
  const eq=o=>o.USD+o.CDF/taux;
  return{rec,dep,proj,tr:sumAll(rec),td:sumAll(dep),eq,bal:accountBalances(periodEnd()),taux};
}
function vEtats(){
  const D=etatsData(),cy=new Date().getFullYear(),years=[];for(let k=cy-2;k<=cy+1;k++)years.push(String(k));
  const pers=[['annee','Année complète'],['T1','1er trimestre'],['T2','2e trimestre'],['T3','3e trimestre'],['T4','4e trimestre']].concat(Array.from({length:12},(_,i)=>[pad(i+1),parse(`2000-${pad(i+1)}-01`).toLocaleDateString(LOC(),{month:'long'})]));
  const tbl=(o,tot)=>{const e=Object.entries(o).sort((a,b)=>D.eq(b[1])-D.eq(a[1]));return e.length?`<table class="t"><tr><th>Catégorie</th><th class="n">FC</th><th class="n">$</th><th class="n">≈ total $</th></tr>${e.map(([k,v])=>`<tr><td>${esc(k)}</td><td class="n">${money(v.CDF,'CDF')}</td><td class="n">${money(v.USD,'USD')}</td><td class="n">${money(D.eq(v),'USD')}</td></tr>`).join('')}<tr style="font-weight:700"><td>Total</td><td class="n">${money(tot.CDF,'CDF')}</td><td class="n">${money(tot.USD,'USD')}</td><td class="n">${money(D.eq(tot),'USD')}</td></tr></table>`:'<div class="muted small">Aucune opération.</div>'};
  const res={CDF:D.tr.CDF-D.td.CDF,USD:D.tr.USD-D.td.USD};
  return`<div class="toolbar"><select class="inp" data-bind="etYear">${years.map(x=>opt(x,UI.etYear)).join('')}</select><select class="inp" data-bind="etPer">${pers.map(x=>opt(x,UI.etPer)).join('')}</select><span class="sp"></span><button class="btn primary" data-act="pdfEtats">États financiers PDF</button></div>
  <div class="grid3"><div class="card kpi"><div class="l">Recettes</div><div class="v pos" style="font-size:16px">${both(D.tr)}</div></div><div class="card kpi"><div class="l">Dépenses</div><div class="v neg" style="font-size:16px">${both(D.td)}</div></div><div class="card kpi"><div class="l">Résultat (${esc(periodLabel())})</div><div class="v ${D.eq(res)<0?'neg':'pos'}" style="font-size:16px">${both(res)}</div><div class="s">≈ ${money(D.eq(res),'USD')}</div></div></div>
  <div class="card sec"><h2>Compte de résultat – recettes</h2>${tbl(D.rec,D.tr)}</div>
  <div class="card sec"><h2>Compte de résultat – dépenses</h2>${tbl(D.dep,D.td)}</div>
  ${S.campagnes.length?`<div class="card sec"><h2>Recettes par projet</h2>${tbl(D.proj,D.tr)}</div>`:''}
  <div class="card sec"><h2>Situation des comptes au ${fdate(periodEnd())}</h2><table class="t"><tr><th>Compte</th><th class="n">FC</th><th class="n">$</th></tr>${Object.entries(D.bal).map(([k,v])=>`<tr><td>${esc(k)}</td><td class="n">${money(v.CDF,'CDF')}</td><td class="n">${money(v.USD,'USD')}</td></tr>`).join('')}</table></div>`;
}
function pdfEtats(){
  const D=etatsData(),c=cfg(),d=pdfDoc('États financiers',periodLabel().replace(/^./,x=>x.toUpperCase()));
  const res={CDF:D.tr.CDF-D.td.CDF,USD:D.tr.USD-D.td.USD};
  d.kpis([['Recettes (équiv. $)',money(D.eq(D.tr),'USD')],['Dépenses (équiv. $)',money(D.eq(D.td),'USD')],['Résultat (équiv. $)',money(D.eq(res),'USD')]]);
  const cols=[{t:'Catégorie',w:.4},{t:'Francs congolais',w:.2,a:'r'},{t:'Dollars',w:.2,a:'r'},{t:'Équiv. total $',w:.2,a:'r'}];
  const rows=(o,tot)=>Object.entries(o).sort((a,b)=>D.eq(b[1])-D.eq(a[1])).map(([k,v])=>[k,money(v.CDF,'CDF'),money(v.USD,'USD'),money(D.eq(v),'USD')]).concat(Object.keys(o).length?[{bold:1,cells:['Total',money(tot.CDF,'CDF'),money(tot.USD,'USD'),money(D.eq(tot),'USD')]}]:[]);
  {const y=UI.etYear,M12=[];const per=UI.etPer;const months=per==='annee'?Array.from({length:12},(_,i)=>y+'-'+pad(i+1)):per[0]==='T'?[1,2,3].map(i=>y+'-'+pad((+per[1]-1)*3+i)):[y+'-'+per];
   d.h2('Graphiques');pdfBars(d,'Recettes et dépenses par mois (équivalent $)',months.map(mLab),[{n:'Recettes',c:NAVYC,v:months.map(x=>S.transactions.filter(t=>isIn(t)&&(t.date||'').startsWith(x)).reduce((s,t)=>s+conv(t,'USD'),0))},{n:'Dépenses',c:ORC,v:months.map(x=>S.transactions.filter(t=>isOut(t)&&(t.date||'').startsWith(x)).reduce((s,t)=>s+conv(t,'USD'),0))}]);
   pdfHBars(d,'Recettes par catégorie (équivalent $)',Object.entries(D.rec).map(([k,v])=>[k,D.eq(v)]),v=>money(v,'USD'));
   pdfHBars(d,'Dépenses par catégorie (équivalent $)',Object.entries(D.dep).map(([k,v])=>[k,D.eq(v)]),v=>money(v,'USD'));
   const res=D.eq(D.tr)-D.eq(D.td);pdfInterp(d,[`Recettes totales : ${money(D.eq(D.tr),'USD')} ; dépenses : ${money(D.eq(D.td),'USD')} (équivalent dollars).`,`Résultat ${res>=0?'excédentaire':'déficitaire'} de ${money(Math.abs(res),'USD')}`+(D.eq(D.tr)?` ; les dépenses représentent ${Math.round(D.eq(D.td)/D.eq(D.tr)*100)} % des recettes.`:'.')]);
   d.newPage();}
  d.h2('1. Recettes');d.table(cols,rows(D.rec,D.tr),{empty:'Aucune recette.'});
  d.h2('2. Dépenses');d.table(cols,rows(D.dep,D.td),{empty:'Aucune dépense.'});
  if(S.campagnes.length){d.h2('Recettes par projet');d.table(cols,rows(D.proj,D.tr))}
  d.h2('3. Résultat de la période');d.table(cols,[{bold:1,cells:['Recettes − dépenses',money(res.CDF,'CDF'),money(res.USD,'USD'),money(D.eq(res),'USD')]}]);
  d.h2('4. Situation des comptes au '+fdate(periodEnd()));
  d.table([{t:'Compte',w:.5},{t:'Francs congolais',w:.25,a:'r'},{t:'Dollars',w:.25,a:'r'}],Object.entries(D.bal).map(([k,v])=>[k,money(v.CDF,'CDF'),money(v.USD,'USD')]));
  if(UI.etPer==='annee'&&budgetFor(UI.etYear)){const R=budgetRows(UI.etYear);d.h2('5. Exécution du budget '+UI.etYear+' (en '+(R.dev==='USD'?'$':'FC')+')');
    const bc=[{t:'Catégorie',w:.36},{t:'Budget',w:.16,a:'r'},{t:'Réalisé',w:.16,a:'r'},{t:'Écart',w:.16,a:'r'},{t:'%',w:.16,a:'r'}];
    const br=(rows,lab)=>[{bold:1,cells:[lab,'','','','']}].concat(rows.map(x=>[x.cat,money(x.bud,R.dev),money(x.r,R.dev),money(x.r-x.bud,R.dev),x.bud?Math.round(x.r/x.bud*100)+' %':'—']));
    d.table(bc,br(R.e,'Recettes').concat(br(R.s,'Dépenses')))}
  d.para(`Taux de conversion utilisé : 1 $ = ${num(c.taux).toLocaleString('fr-FR')} FC.`,8.5);
  d.signatures(['Le Trésorier','Le Pasteur principal','Le Comité de contrôle']);
  savePDF(`Etats financiers ${c.sigle||'EMT'} ${periodLabel()}.pdf`,d.finish());
}
function pdfBudget(){
  const y=UI.budYear,R=budgetRows(y),c=cfg(),d=pdfDoc('Budget '+y,'Prévisions et réalisations');
  const cols=[{t:'Catégorie',w:.36},{t:'Budget',w:.16,a:'r'},{t:'Réalisé',w:.16,a:'r'},{t:'Écart',w:.16,a:'r'},{t:'%',w:.16,a:'r'}];
  const rows=rs=>rs.map(x=>[x.cat,money(x.bud,R.dev),money(x.r,R.dev),money(x.r-x.bud,R.dev),x.bud?Math.round(x.r/x.bud*100)+' %':'—']).concat(rs.length?[{bold:1,cells:['Total',money(rs.reduce((s,x)=>s+x.bud,0),R.dev),money(rs.reduce((s,x)=>s+x.r,0),R.dev),money(rs.reduce((s,x)=>s+x.r-x.bud,0),R.dev),'']}]:[]);
  d.h2('Recettes');d.table(cols,rows(R.e),{empty:'Aucune ligne.'});d.h2('Dépenses');d.table(cols,rows(R.s),{empty:'Aucune ligne.'});
  d.para(`Montants en ${R.dev==='USD'?'dollars':'francs congolais'} ; l'autre devise est convertie au taux de ${num(c.taux).toLocaleString('fr-FR')} FC pour 1 $.`,8.5);
  d.signatures(['Le Trésorier','Le Pasteur principal']);
  savePDF(`Budget ${c.sigle||'EMT'} ${y}.pdf`,d.finish());
}
async function validRappro(){
  const c=cfg(),C=UI.rcCompte||c.comptes[0],dev=UI.rcDev,dt=UI.rcDate;
  const pts=S.transactions.filter(t=>!t.rapproche&&t.pointe&&amountFor(t,C,dev)!==0&&(t.date||'')<=dt);
  for(const t of pts){if(!await save('transactions',{...t,rapproche:true,dateRappro:dt}))return}
  await save('rapprochements',{compte:C,devise:dev,date:dt,soldeReleve:Number(UI.rcSolde),nb:pts.length});
  UI.rcSolde='';toast('Rapprochement validé');render();
}

/* ================= COMMUNICATION ================= */
const CTABS=[['messages','Messages'],['bulletin','Bulletin'],['discussions','Discussions'],['historique','Historique']];
const TPL={
  '':'',
  bienvenue:"Bonjour {prenom}, c'est une joie de vous avoir accueilli(e) à l'{eglise} ! Nous serions heureux de vous revoir dimanche au culte. Que Dieu vous bénisse. — Pasteur {pasteur}",
  rappel:"Bonjour {prenom}, nous vous rappelons le culte de ce dimanche à 9h00. Venez avec un cœur ouvert, le Seigneur a une parole pour vous ! — {eglise}",
  anniversaire:"Joyeux anniversaire {prenom} ! Toute l'{eglise} se joint à moi pour vous souhaiter une année pleine de la grâce et de la paix du Seigneur. — Pasteur {pasteur}",
  absent:"Bonjour {prenom}, vous nous avez manqué ces derniers temps. Nous prions pour vous. Si vous avez besoin de quoi que ce soit, n'hésitez pas à nous écrire. — {eglise}",
  priere:"Bien-aimé(e) {prenom}, l'école de prière a lieu ce jeudi de 16h00 à 18h30. Venez avec vos sujets de prière ! — {eglise}",
  evenement:"Bonjour {prenom}, vous êtes invité(e) à notre prochain événement : [titre], le [date] à [heure]. Soyez les bienvenus ! — {eglise}",
  annonce:"Chers frères et sœurs, [votre annonce]. Que Dieu vous bénisse. — {eglise}"
};
const TPL_L={'':'— Choisir un modèle —',bienvenue:'Bienvenue à un visiteur',rappel:'Rappel du culte',anniversaire:'Anniversaire',absent:'Vous nous avez manqué',priere:'École de prière',evenement:'Invitation à un événement',annonce:'Annonce générale'};
function audiences(){
  const a=[['actifs','Membres actifs'],['tous','Tout le monde (sauf inactifs)'],['nouveaux','Visiteurs et nouveaux convertis'],['bday_today',"Anniversaires d'aujourd'hui"],['bday_week','Anniversaires des 7 prochains jours'],['ouvriers','Ouvriers et responsables'],['manuel','Choisir les personnes…']];
  S.groups.forEach(g=>a.push(['g:'+g.id,'Groupe : '+g.nom]));return a;
}
function inNextDays(dn,n){if(!dn)return false;for(let i=0;i<n;i++){const d=new Date();d.setDate(d.getDate()+i);if(iso(d).slice(5)===dn.slice(5))return true}return false}
function audienceList(){
  const k=UI.aud,M=sortedMembers();
  if(k==='actifs')return M.filter(m=>!m.statut||m.statut==='Membre actif');
  if(k==='tous')return M.filter(m=>m.statut!=='Inactif'&&!isGone(m));
  if(k==='nouveaux')return M.filter(m=>m.statut==='Visiteur'||m.statut==='Nouveau converti');
  if(k==='bday_today')return M.filter(m=>inNextDays(m.dateNaissance,1));
  if(k==='bday_week')return M.filter(m=>inNextDays(m.dateNaissance,7));
  if(k==='ouvriers')return M.filter(m=>m.fonction&&m.fonction!=='Fidèle');
  if(k==='manuel')return M.filter(m=>UI.audSel.includes(m.id));
  if(k.startsWith('g:'))return M.filter(m=>(m.groupes||[]).includes(k.slice(2)));
  return[];
}
const fillTpl=(txt,m)=>{const c=cfg();return String(txt||'').replace(/\{prenom\}/g,m?(m.prenom||m.nom||''):'').replace(/\{nom\}/g,m?fullName(m):'').replace(/\{eglise\}/g,c.nom).replace(/\{pasteur\}/g,c.pasteur).replace(/ ,/g,',')};
const intl=t=>{const n=waNum(t);return n?'+'+n:''};
function vCommunication(){
  const sub={messages:vMessages,bulletin:vBulletin,discussions:vDiscussions,historique:vHistorique}[UI.comTab]||vMessages;
  return`<div class="tabs" style="margin-bottom:14px">${CTABS.map(([k,l])=>`<button class="tab${UI.comTab===k?' on':''}" data-act="comTab" data-k="${k}">${l}</button>`).join('')}</div>`+sub();
}
function vMessages(){
  const list=audienceList(),ch=UI.canal,label=(audiences().find(a=>a[0]===UI.aud)||[])[1]||'';
  const withC=list.filter(m=>ch==='email'?m.email:waNum(m.telephone));
  const sentN=withC.filter(m=>UI.sent[m.id]).length;
  let rows='';
  if(ch==='whatsapp')rows=list.map(m=>{const l=waLink(m.telephone,fillTpl(UI.msg,m));return`<div class="row" style="cursor:default">${avatar(m)}<div class="grow"><div class="t">${esc(fullName(m))}</div><div class="st">${esc(m.telephone||'pas de numéro')}</div></div>${l&&UI.msg?`<a class="btn sm ${UI.sent[m.id]?'':'wa'}" data-sent="${m.id}" target="_blank" rel="noopener" href="${esc(l)}">${UI.sent[m.id]?'✓ Envoyé':'Envoyer'}</a>`:''}</div>`}).join('');
  else if(ch==='sms')rows=list.map(m=>{const n=intl(m.telephone);return`<div class="row" style="cursor:default">${avatar(m)}<div class="grow"><div class="t">${esc(fullName(m))}</div><div class="st">${esc(n||'pas de numéro')}</div></div>${n&&UI.msg?`<a class="btn sm" data-sent="${m.id}" href="sms:${esc(n)}?body=${encodeURIComponent(fillTpl(UI.msg,m))}">${UI.sent[m.id]?'✓ SMS':'SMS'}</a>`:''}</div>`}).join('');
  else rows=list.map(m=>`<div class="row" style="cursor:default">${avatar(m)}<div class="grow"><div class="t">${esc(fullName(m))}</div><div class="st">${esc(m.email||'pas d\'e-mail')}</div></div>${m.email&&UI.msg?`<a class="btn sm" data-sent="${m.id}" href="mailto:${esc(m.email)}?subject=${encodeURIComponent(cfg().nom)}&body=${encodeURIComponent(fillTpl(UI.msg,m))}">${UI.sent[m.id]?'✓ E-mail':'E-mail'}</a>`:''}</div>`).join('');
  return`<div class="grid2">
  <div class="card"><h2>1. Destinataires</h2><select class="inp" data-bind="aud" style="width:100%">${audiences().map(a=>opt(a,UI.aud)).join('')}</select>
   ${UI.aud==='manuel'?`<div class="multi" style="margin-top:10px;max-height:220px;overflow:auto">${sortedMembers().map(m=>`<label><input type="checkbox" data-act="audToggle" data-id="${m.id}"${UI.audSel.includes(m.id)?' checked':''}> ${esc(fullName(m))}</label>`).join('')||'<span class="muted small">Aucun membre</span>'}</div>`:''}
   <div class="muted small" style="margin-top:8px">${list.length} personne(s) · ${withC.length} joignable(s) par ${ch==='email'?'e-mail':'téléphone'}</div>
   <h2 style="margin-top:16px">2. Canal</h2><div class="tabs">${[['whatsapp','WhatsApp'],['sms','SMS'],['email','E-mail']].map(([k,l])=>`<button class="tab${ch===k?' on':''}" data-act="setCanal" data-k="${k}">${l}</button>`).join('')}</div></div>
  <div class="card"><h2>3. Message</h2><select class="inp" data-tpl="1" style="width:100%;margin-bottom:8px">${Object.keys(TPL).map(k=>opt([k,TPL_L[k]],'')).join('')}</select>
   <textarea id="msgTxt" class="inp" data-bind="msg" rows="6" style="width:100%;resize:vertical" placeholder="Écrivez votre message… Utilisez {prenom} pour personnaliser.">${esc(UI.msg)}</textarea>
   <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm" data-act="insVerse">📖 Insérer un verset</button>${['ton','Lingala','Swahili','Anglais'].map(k=>`<button class="btn sm" data-act="aiRewrite" data-k="${k}" ${UI.msg&&!UI.aiBusy3?'':'disabled'}>${k==='ton'?'✨ Améliorer le ton':'Traduire : '+k}</button>`).join('')}${UI.aiBusy3?'<span class="small muted">Traduction en cours…</span>':''}${UI.trUrl?`<a class="btn sm" target="_blank" rel="noopener" href="${esc(UI.trUrl)}">🌐 Ouvrir Google Traduction</a>`:''}</div><div style="margin-top:6px">${['{prenom}','{nom}','{eglise}','{pasteur}'].map(v=>`<button class="chip" style="border:0;cursor:pointer" data-act="insVar" data-k="${v}">${v}</button>`).join('')}<span class="muted small"> · ${UI.msg.length} caractères${ch==='sms'?' ('+Math.max(1,Math.ceil(UI.msg.length/160))+' SMS)':''}</span></div>
   ${UI.msg&&list[0]?`<div class="muted small" style="margin-top:10px">Aperçu pour ${esc(list[0].prenom||list[0].nom||'')} :</div><div style="background:#e7f6ec;border-radius:10px;padding:10px;margin-top:4px;font-size:13px;white-space:pre-wrap">${esc(fillTpl(UI.msg,list[0]))}</div>`:''}</div></div>
  <div class="toolbar sec"><b>4. Envoi${sentN?` – ${sentN}/${withC.length} envoyé(s)`:''}</b><span class="sp"></span>${ch==='email'?'<button class="btn sm" data-act="copyEmails">Copier les e-mails</button>':'<button class="btn sm" data-act="copyNums">Copier les numéros</button>'}<button class="btn sm" data-act="copyMsg">Copier le message</button>${window.EMT_API&&ch!=='email'?`<button class="btn sm primary" data-act="autoSend" ${UI.msg&&withC.length?'':'disabled'}>Envoyer automatiquement (${withC.length})</button>`:''}<button class="btn sm" data-act="logMsg" ${UI.msg&&list.length?'':'disabled'}>Enregistrer dans l'historique</button></div>
  <div class="muted small" style="margin:-4px 0 8px">${ch==='whatsapp'?'Chaque bouton ouvre WhatsApp avec le message personnalisé : il suffit d\'appuyer sur Envoyer. Pour un envoi groupé, copiez les numéros dans une liste de diffusion WhatsApp.':ch==='sms'?'Le bouton SMS ouvre votre application de messages sur téléphone. Pour un envoi en masse, copiez les numéros dans votre service de SMS groupés.':'Le bouton ouvre votre messagerie. Pour un envoi groupé, copiez les adresses en copie cachée (Cci).'}</div>
  <div class="list">${rows||'<div class="empty">Aucun destinataire.</div>'}</div>`;
}
function vHistorique(){
  const l=[...S.commlog].sort((a,b)=>String(b.at||'').localeCompare(String(a.at||'')));
  return`<div class="list">${l.length?l.map(x=>`<div class="row" data-act="reuseMsg" data-id="${x.id}"><div class="grow"><div class="t">${esc(x.audience)} · ${esc({whatsapp:'WhatsApp',sms:'SMS',email:'E-mail'}[x.canal]||x.canal)} · ${x.nb} pers.</div><div class="st">${x.at?new Date(x.at).toLocaleString(LOC(),{dateStyle:'medium',timeStyle:'short'}):''} · ${esc(String(x.message||'').slice(0,90))}</div></div><span class="badge">Réutiliser</span></div>`).join(''):'<div class="empty">Aucun envoi enregistré.</div>'}</div>`;
}
/* bulletin */
const BTYPES={texte:'Texte',verset:'Verset biblique',annonce:'Annonce',programme:'Programme de la semaine',anniv:'Anniversaires de la semaine',contact:'Contacts de l\'église'};
function bulAuto(b,type){
  const start=b.date?parse(b.date):new Date(),out=[];
  if(type==='programme'){for(let i=0;i<7;i++){const d=new Date(start);d.setDate(d.getDate()+i);const ds=iso(d);dayItems(ds).filter(x=>x.kind!=='bday').forEach(x=>out.push([fday(ds),x.heure?(x.heure+(x.fin?'–'+x.fin:'')):'',x.titre]))}}
  if(type==='anniv'){S.members.forEach(m=>{if(!m.dateNaissance)return;for(let i=0;i<7;i++){const d=new Date(start);d.setDate(d.getDate()+i);if(iso(d).slice(5)===m.dateNaissance.slice(5))out.push([fday(iso(d)),fullName(m)])}})}
  return out;
}
function vBulletin(){
  if(!UI.bul){const l=[...S.bulletins].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
    return`<div class="toolbar"><div class="muted">Créez un bulletin hebdomadaire à imprimer ou partager sur WhatsApp.</div><span class="sp"></span><button class="btn primary" data-act="newBul">+ Nouveau bulletin</button></div>
    <div class="list">${l.length?l.map(b=>`<div class="row" data-act="openBul" data-id="${b.id}"><div class="grow"><div class="t">${esc(b.titre||'Bulletin')}</div><div class="st">${fdate(b.date)} · ${(b.blocs||[]).length} bloc(s)</div></div></div>`).join(''):'<div class="empty">Aucun bulletin pour le moment.</div>'}</div>`}
  const b=UI.bul;
  const blk=(x,i)=>{const auto=x.type==='programme'||x.type==='anniv'||x.type==='contact';let inner='';
    if(x.type==='verset')inner=`<textarea class="inp" data-bk="${i}:texte" rows="3" placeholder="Texte du verset">${esc(x.texte)}</textarea><input class="inp" data-bk="${i}:ref" placeholder="Référence (ex. Jean 3:16)" value="${esc(x.ref)}"><div><button class="btn sm primary" data-act="bulVerse" data-i="${i}">📖 Choisir un passage dans la liste</button></div>`;
    else if(x.type==='texte'||x.type==='annonce')inner=`<input class="inp" data-bk="${i}:titre" placeholder="Titre" value="${esc(x.titre)}"><textarea class="inp" data-bk="${i}:texte" rows="4" placeholder="Texte">${esc(x.texte)}</textarea>`;
    else if(x.type==='contact'){const c=cfg();inner=`<div class="small muted">${esc([c.nom,visio(c),c.adresse,c.ville,c.telephone].filter(Boolean).join(' · '))}</div>`}
    else{const r=bulAuto(b,x.type);inner=`<div class="small muted">${r.length?r.map(z=>esc(z.filter(Boolean).join(' · '))).join('<br>'):'Rien pour cette semaine.'}</div>`}
    return`<div class="blk card" data-i="${i}" style="margin-bottom:10px;padding:12px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><span class="hdl" draggable="true" data-i="${i}" title="Glisser pour déplacer">⠿</span><b style="flex:1">${BTYPES[x.type]}${auto?' <span class="badge">automatique</span>':''}</b><button class="btn sm" data-act="bulUp" data-i="${i}" ${i?'':'disabled'}>↑</button><button class="btn sm" data-act="bulDown" data-i="${i}" ${i<b.blocs.length-1?'':'disabled'}>↓</button><button class="btn sm danger" data-act="bulDel" data-i="${i}">✕</button></div><div style="display:flex;flex-direction:column;gap:6px">${inner}</div></div>`};
  return`<div class="toolbar"><button class="btn sm" data-act="closeBul">‹ Bulletins</button><span class="sp"></span>${b.id?'<button class="btn sm danger" data-act="delBul">Supprimer</button>':''}<button class="btn sm" data-act="copyBul">Texte WhatsApp</button><button class="btn sm" data-act="pdfBul">PDF</button><button class="btn sm primary" data-act="saveBul">Enregistrer</button></div>
  <div class="card" style="margin-bottom:12px"><div class="fgrid" style="padding:0"><div class="fld"><label>Titre</label><input data-bulf="titre" value="${esc(b.titre)}"></div><div class="fld"><label>Date (début de semaine)</label><input type="date" data-bulf="date" value="${esc(b.date)}"></div></div></div>
  <div id="blks">${b.blocs.map(blk).join('')||'<div class="card empty">Ajoutez des blocs avec les boutons ci-dessous.</div>'}</div>
  <div class="card"><div class="muted small" style="margin-bottom:8px">Ajouter un bloc (glissez la poignée ⠿ ou utilisez ↑ ↓ pour réordonner) :</div><div class="tabs">${Object.entries(BTYPES).map(([k,l])=>`<button class="tab" data-act="bulAdd" data-k="${k}">+ ${l}</button>`).join('')}</div></div>`;
}
function newBulletin(){const d=new Date();d.setDate(d.getDate()+((7-d.getDay())%7));return{titre:'Bulletin de la semaine',date:iso(d),blocs:[{type:'verset',texte:'',ref:''},{type:'texte',titre:'Mot du pasteur',texte:''},{type:'programme'},{type:'annonce',titre:'Annonces',texte:''},{type:'anniv'},{type:'contact'}]}}
function bulText(b){
  const c=cfg();let s=`*${b.titre}*\n_${c.nom} – semaine du ${fdate(b.date)}_\n`;
  b.blocs.forEach(x=>{if(x.type==='verset'&&x.texte)s+=`\n📖 _« ${x.texte} »_ – *${x.ref||''}*\n`;else if((x.type==='texte'||x.type==='annonce')&&(x.titre||x.texte))s+=`\n${x.type==='annonce'?'📢 ':''}*${x.titre||''}*\n${x.texte||''}\n`;
    else if(x.type==='programme'){const r=bulAuto(b,'programme');if(r.length)s+='\n🗓️ *Programme de la semaine*\n'+r.map(z=>`• ${z[0]} ${z[1]} – ${z[2]}`).join('\n')+'\n'}
    else if(x.type==='anniv'){const r=bulAuto(b,'anniv');if(r.length)s+='\n🎂 *Anniversaires*\n'+r.map(z=>`• ${z[1]} (${z[0]})`).join('\n')+'\n'}
    else if(x.type==='contact')s+=`\n📍 ${[c.nom,visio(c),c.adresse,c.ville,c.telephone].filter(Boolean).join(' · ')}\n`});
  return s;
}
function pdfBul(){
  const b=UI.bul,c=cfg(),d=pdfDoc(b.titre||'Bulletin','Semaine du '+fdate(b.date)),M=d.M,W=d.W-2*M;
  const box=(lines,size,o={})=>{const h=lines.length*size*1.45+18+(o.extra||0);d.ensure(h+8);d.rect(M,d.y,W,h,{fill:o.fill||[243,248,248]});if(o.bar)d.rect(M,d.y,3,h,{fill:[31,63,117]});return h};
  b.blocs.forEach(x=>{
    if(x.type==='verset'&&x.texte){const L=d.wrap('« '+x.texte+' »',W-40,11.5);const h=box(L,11.5,{extra:16});L.forEach((l,i)=>d.text(l,d.W/2,d.y+20+i*16.7,{size:11.5,italic:1,align:'center',color:[40,60,64]}));d.text(x.ref||'',d.W/2,d.y+h-10,{size:9.5,bold:1,align:'center',color:TEAL});d.y+=h+12}
    else if(x.type==='texte'&&(x.titre||x.texte)){if(x.titre)d.h2(x.titre);d.para(x.texte||'',10.5)}
    else if(x.type==='annonce'&&(x.titre||x.texte)){const L=d.wrap(x.texte||'',W-30,10);const h=box(L,10,{bar:1,extra:x.titre?16:0});let y=d.y+16;if(x.titre){d.text(x.titre,M+14,y,{size:11,bold:1,color:TEAL});y+=16}L.forEach((l,i)=>d.text(l,M+14,y+i*14.5,{size:10}));d.y+=h+12}
    else if(x.type==='programme'){d.h2('Programme de la semaine');d.table([{t:'Jour',w:.25},{t:'Heure',w:.2},{t:'Activité',w:.55}],bulAuto(b,'programme'),{empty:'Aucun programme.'})}
    else if(x.type==='anniv'){const r=bulAuto(b,'anniv');if(r.length){d.h2('Anniversaires de la semaine');d.table([{t:'Jour',w:.3},{t:'Nom',w:.7}],r)}}
    else if(x.type==='contact'){d.ensure(50);d.y+=6;d.line(M,d.y,d.W-M,d.y,{color:[31,63,117]});d.y+=14;d.text([c.nom,visio(c)].join(' · '),d.W/2,d.y,{size:9.5,bold:1,align:'center',color:TEAL});d.y+=13;const ad=[c.adresse,c.ville,c.telephone].filter(Boolean).join(' · ');if(ad){d.text(ad,d.W/2,d.y,{size:9,align:'center',color:GREY});d.y+=13}}
  });
  savePDF(`${b.titre||'Bulletin'} ${b.date||''}.pdf`,d.finish());
}
/* discussions */
let chatUnsub=null,chatGid=null;
function ensureChat(gid){
  if(chatGid===gid)return;if(chatUnsub){chatUnsub();chatUnsub=null}chatGid=gid;S.chat=S.chatLocal[gid]||[];
  if(!db)return;
  try{chatUnsub=db.collection('chats/'+gid+'/messages').orderBy('at','desc').limit(100).onSnapshot(s=>{S.chat=s.docs.map(d=>({id:d.id,...d.data()})).reverse();scheduleRender()},()=>{})}catch(e){}
}
function vDiscussions(){
  const chans=[['general','Tous les responsables']].concat(S.groups.map(g=>[g.id,g.nom]));
  if(!chans.some(c=>c[0]===UI.chat))UI.chat='general';
  ensureChat(UI.chat);
  const me=ME&&ME.id||'local';let lastDay='';
  const msgs=S.chat.map(m=>{const day=String(m.at||'').slice(0,10),mine=m.uid===me;const sep=day!==lastDay?`<div class="csep">${fday(day)}</div>`:'';lastDay=day;
    return sep+`<div class="bub ${mine?'me':''}">${mine?'':`<div class="bn" data-uid="${esc(m.uid)}">…</div>`}<div>${esc(m.text).replace(/\n/g,'<br>')}</div><div class="bt">${m.at?new Date(m.at).toLocaleTimeString(LOC(),{hour:'2-digit',minute:'2-digit'}):''}</div></div>`}).join('');
  return`<div class="toolbar"><select class="inp" data-bind="chat">${chans.map(c=>opt(c,UI.chat)).join('')}</select><span class="muted small">Discussion entre les personnes qui ont accès à l'application.</span></div>
  <div class="card" style="padding:0;display:flex;flex-direction:column;height:min(62vh,560px)"><div id="chatBox" style="flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:6px">${msgs||'<div class="empty">Aucun message. Lancez la discussion !</div>'}</div>
  <form id="chatForm" style="display:flex;gap:8px;padding:10px;border-top:1px solid var(--bd)"><input id="chatIn" class="inp" data-bind="chatDraft" value="${esc(UI.chatDraft)}" placeholder="Votre message…" style="flex:1" autocomplete="off"><button class="btn primary">Envoyer</button></form></div>`;
}
async function sendChat(){
  const text=UI.chatDraft.trim();if(!text)return;const msg={uid:ME&&ME.id||'local',text,at:new Date().toISOString()};
  UI.chatDraft='';
  if(db){try{await db.collection('chats/'+UI.chat+'/messages').add(msg)}catch(e){UI.chatDraft=text;toast(errMsg(e),1)}}
  else{(S.chatLocal[UI.chat]=S.chatLocal[UI.chat]||[]).push({id:'l'+Date.now(),...msg});S.chat=S.chatLocal[UI.chat]}
  render();
}
async function copyText(s,ok){try{await navigator.clipboard.writeText(s);toast(ok||'Copié')}catch(e){modal(`<div class="mhead"><h3>Copier</h3><button class="x" data-act="close">×</button></div><div class="mbody"><div class="muted small" style="margin-bottom:6px">Sélectionnez le texte puis copiez-le :</div><textarea class="inp" rows="10" style="width:100%">${esc(s)}</textarea></div>`)}}
/* à faire aujourd'hui (tableau de bord) */
function todayCard(){
  const c=cfg(),td=today(),items=[];
  S.members.filter(m=>m.dateNaissance&&m.dateNaissance.slice(5)===td.slice(5)).forEach(m=>items.push({t:'Anniversaire de '+fullName(m),m,msg:fillTpl(TPL.anniversaire,m)}));
  S.members.filter(m=>m.dateMariage&&m.dateMariage.slice(5)===td.slice(5)).forEach(m=>items.push({t:'Anniversaire de mariage de '+fullName(m)+' ('+(+td.slice(0,4)-+m.dateMariage.slice(0,4))+' ans)',m,msg:`Joyeux anniversaire de mariage ${m.prenom||m.nom} ! Que le Seigneur continue de bénir votre foyer. — ${c.nom}`}));
  const wk=new Date();wk.setDate(wk.getDate()-7);const w=iso(wk);
  S.members.filter(m=>(m.statut==='Visiteur'||m.statut==='Nouveau converti')&&(m.dateAdhesion||String(m.createdAt||'').slice(0,10))>=w&&!S.followups.some(f=>f.membreId===m.id)).forEach(m=>items.push({t:'Accueillir '+fullName(m)+' ('+m.statut.toLowerCase()+')',m,msg:fillTpl(TPL.bienvenue,m),fu:1}));
  const late=S.followups.filter(f=>f.statut!=='Terminé'&&f.echeance&&f.echeance<td).length;
  if(!items.length&&!late)return'';
  return`<div class="card" style="margin-bottom:12px;border-left:4px solid var(--brand)"><h2>À faire aujourd'hui</h2>${items.map(x=>`<div class="row" style="padding:8px 0;cursor:default">${avatar(x.m)}<div class="grow"><div class="t">${esc(x.t)}</div><div class="st">${esc(x.m.telephone||'pas de numéro')}</div></div>${waLink(x.m.telephone)?`<a class="btn sm wa" target="_blank" rel="noopener" href="${esc(waLink(x.m.telephone,x.msg))}">WhatsApp</a>`:''}${x.fu?`<button class="btn sm" data-act="newFollowFor" data-id="${x.m.id}">+ Suivi</button>`:''}</div>`).join('')}${late?`<a class="row" style="padding:8px 0;text-decoration:none;color:inherit" href="#suivis"><div class="grow"><div class="t neg">${late} suivi(s) en retard</div></div><span class="badge b-todo">Voir</span></a>`:''}</div>`;
}

const fillTplKeep=t=>t;
/* ================= ÉTAPE 1 ================= */
const ageOf=m=>{if(!m.dateNaissance)return null;const b=parse(m.dateNaissance),n=new Date();let a=n.getFullYear()-b.getFullYear();if(n<new Date(n.getFullYear(),b.getMonth(),b.getDate()))a--;return a};
const slug=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'x';
function plChart(labels,values,fmt){
  const W=340,H=170,pl=8,pb=22,pt=18,mx=Math.max(...values.map(Math.abs),1),bw=(W-pl*2)/Math.max(values.length,1),z=pt+(H-pb-pt)/2,k=(H-pb-pt)/2/mx;
  return`<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img"><line x1="${pl}" x2="${W-pl}" y1="${z}" y2="${z}" stroke="#9aa9b8" stroke-width="1"/>${values.map((v,i)=>{const h=Math.abs(v)*k,w=Math.min(bw*.6,34),x=pl+i*bw+(bw-w)/2,y=v>=0?z-h:z,c=v>=0?'#2e9e6a':'#d9534f';return`<rect x="${x}" y="${y}" width="${w}" height="${Math.max(h,1)}" rx="3" fill="${c}"><title>${esc(labels[i])} : ${esc(fmt(v))}</title></rect><text x="${x+w/2}" y="${v>=0?y-4:y+h+11}" text-anchor="middle" font-size="9" fill="${c}" font-weight="700">${Math.round(v)?esc((v>0?'+':'')+fmt(v)):''}</text><text x="${x+w/2}" y="${H-6}" text-anchor="middle" font-size="9" fill="#6a7a7f">${esc(labels[i])}</text>`}).join('')}</svg></div>`;
}
function barChart(labels,values,o={}){
  const W=340,H=o.h||150,pl=8,pb=22,pt=16,max=Math.max(...values,1),bw=(W-pl*2)/Math.max(values.length,1);
  return`<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img">${values.map((v,i)=>{const h=(H-pb-pt)*v/max,w=Math.min(bw*.64,34),x=pl+i*bw+(bw-w)/2,y=H-pb-h;return`<rect x="${x}" y="${y}" width="${w}" height="${Math.max(h,1)}" rx="3" fill="${i===values.length-1?BRD():'#8fa6cc'}"><title>${esc(labels[i])} : ${esc(o.fmt?o.fmt(v):v)}</title></rect><text x="${x+w/2}" y="${y-4}" text-anchor="middle" font-size="9.5" fill="#1b2a2e">${esc(o.fmt?o.fmt(v):v)}</text><text x="${x+w/2}" y="${H-7}" text-anchor="middle" font-size="9" fill="#6a7a7f">${esc(labels[i])}</text>`}).join('')}</svg></div>`;
}
const lastMonths=n=>{const r=[];const d=new Date();d.setDate(1);for(let i=n-1;i>=0;i--){const x=new Date(d.getFullYear(),d.getMonth()-i,1);r.push(iso(x).slice(0,7))}return r};
const mLab=m=>parse(m+'-01').toLocaleDateString(LOC(),{month:'short'}).replace('.','');

/* ---------- QR code (encodeur maison, mode octets, correction M) ---------- */
const QR=(()=>{
  const ECC_M=[-1,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26];
  const BLK_M=[-1,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16];
  const rawMods=v=>{let r=(16*v+128)*v+64;if(v>=2){const n=Math.floor(v/7)+2;r-=(25*n-10)*n-55;if(v>=7)r-=36}return r};
  const dataCw=v=>Math.floor(rawMods(v)/8)-ECC_M[v]*BLK_M[v];
  const gmul=(x,y)=>{let z=0;for(let i=7;i>=0;i--){z=(z<<1)^((z>>>7)*0x11D);z^=((y>>>i)&1)*x}return z&255};
  function rsDiv(deg){const r=new Array(deg).fill(0);r[deg-1]=1;let root=1;for(let i=0;i<deg;i++){for(let j=0;j<r.length;j++){r[j]=gmul(r[j],root);if(j+1<r.length)r[j]^=r[j+1]}root=gmul(root,2)}return r}
  function rsRem(data,div){const r=div.map(()=>0);for(const b of data){const f=b^r.shift();r.push(0);div.forEach((c,i)=>r[i]^=gmul(c,f))}return r}
  function encode(text){
    const bytes=[...new TextEncoder().encode(text)];let v=1;
    for(;v<=20;v++){if(4+(v<10?8:16)+bytes.length*8<=dataCw(v)*8)break}if(v>20)throw new Error('trop long');
    const bits=[];const put=(val,n)=>{for(let i=n-1;i>=0;i--)bits.push((val>>>i)&1)};
    put(4,4);put(bytes.length,v<10?8:16);bytes.forEach(b=>put(b,8));
    const cap=dataCw(v)*8;put(0,Math.min(4,cap-bits.length));put(0,(8-bits.length%8)%8);
    for(let p=0xEC;bits.length<cap;p^=0xEC^0x11)put(p,8);
    const data=[];for(let i=0;i<bits.length;i+=8)data.push(bits.slice(i,i+8).reduce((a,b)=>a<<1|b,0));
    // blocs + correction
    const nb=BLK_M[v],ec=ECC_M[v],raw=Math.floor(rawMods(v)/8),nShort=nb-raw%nb,shortLen=Math.floor(raw/nb),div=rsDiv(ec),blocks=[];
    for(let i=0,k=0;i<nb;i++){const len=shortLen-ec+(i<nShort?0:1),d=data.slice(k,k+len);k+=len;const e=rsRem(d,div);if(i<nShort)d.push(0);blocks.push(d.concat(e))}
    const out=[];for(let i=0;i<blocks[0].length;i++)blocks.forEach((b,j)=>{if(i!==shortLen-ec||j>=nShort)out.push(b[i])});
    // matrice
    const N=v*4+17,M=[...Array(N)].map(()=>Array(N).fill(false)),F=[...Array(N)].map(()=>Array(N).fill(false));
    const set=(x,y,d)=>{M[y][x]=d;F[y][x]=true};
    for(let i=0;i<N;i++){set(6,i,i%2===0);set(i,6,i%2===0)}
    const finder=(x,y)=>{for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const d=Math.max(Math.abs(dx),Math.abs(dy)),xx=x+dx,yy=y+dy;if(xx>=0&&xx<N&&yy>=0&&yy<N)set(xx,yy,d!==2&&d!==4)}};
    finder(3,3);finder(N-4,3);finder(3,N-4);
    const al=[];if(v>1){const n=Math.floor(v/7)+2,step=v===32?26:Math.ceil((v*4+4)/(n*2-2))*2;al.push(6);for(let p=N-7;al.length<n;p-=step)al.splice(1,0,p)}
    al.forEach((a,i)=>al.forEach((b,j)=>{if((i===0&&j===0)||(i===0&&j===al.length-1)||(i===al.length-1&&j===0))return;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)set(a+dx,b+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1)}));
    const fmt=mask=>{const d=0<<3|mask;let r=d;for(let i=0;i<10;i++)r=(r<<1)^((r>>>9)*0x537);const b=(d<<10|r)^0x5412;
      for(let i=0;i<=5;i++)set(8,i,(b>>>i)&1);set(8,7,(b>>>6)&1);set(8,8,(b>>>7)&1);set(7,8,(b>>>8)&1);for(let i=9;i<15;i++)set(14-i,8,(b>>>i)&1);
      for(let i=0;i<8;i++)set(N-1-i,8,(b>>>i)&1);for(let i=8;i<15;i++)set(8,N-15+i,(b>>>i)&1);set(8,N-8,true)};
    fmt(0);
    if(v>=7){let r=v;for(let i=0;i<12;i++)r=(r<<1)^((r>>>11)*0x1F25);const b=v<<12|r;for(let i=0;i<18;i++){const bt=(b>>>i)&1,a=N-11+i%3,c=Math.floor(i/3);set(a,c,bt);set(c,a,bt)}}
    let i=0;for(let right=N-1;right>=1;right-=2){if(right===6)right=5;for(let vert=0;vert<N;vert++)for(let j=0;j<2;j++){const x=right-j,up=((right+1)&2)===0,y=up?N-1-vert:vert;if(!F[y][x]&&i<out.length*8){M[y][x]=((out[i>>>3]>>>(7-(i&7)))&1)===1;i++}}}
    const maskF=[(x,y)=>(x+y)%2===0,(x,y)=>y%2===0,(x,y)=>x%3===0,(x,y)=>(x+y)%3===0,(x,y)=>(Math.floor(x/3)+Math.floor(y/2))%2===0,(x,y)=>x*y%2+x*y%3===0,(x,y)=>(x*y%2+x*y%3)%2===0,(x,y)=>((x+y)%2+x*y%3)%2===0];
    const apply=m=>{for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(!F[y][x]&&maskF[m](x,y))M[y][x]=!M[y][x]};
    const penalty=()=>{let p=0;for(let y=0;y<N;y++){let run=1;for(let x=1;x<N;x++){if(M[y][x]===M[y][x-1]){run++;if(run===5)p+=3;else if(run>5)p++}else run=1}}
      for(let x=0;x<N;x++){let run=1;for(let y=1;y<N;y++){if(M[y][x]===M[y-1][x]){run++;if(run===5)p+=3;else if(run>5)p++}else run=1}}
      for(let y=0;y<N-1;y++)for(let x=0;x<N-1;x++){const c=M[y][x];if(c===M[y][x+1]&&c===M[y+1][x]&&c===M[y+1][x+1])p+=3}
      let dark=0;M.forEach(r=>r.forEach(c=>dark+=c));p+=Math.floor(Math.abs(dark*20-N*N*10)/(N*N))*10;return p};
    let best=0,bp=1e9;for(let m=0;m<8;m++){apply(m);fmt(m);const p=penalty();if(p<bp){bp=p;best=m}apply(m)}
    apply(best);fmt(best);return M;
  }
  function svg(text,px=4){const M=encode(text),N=M.length,q=4,S=(N+q*2);let d='';M.forEach((r,y)=>r.forEach((c,x)=>{if(c)d+=`M${x+q} ${y+q}h1v1h-1z`}));return`<svg viewBox="0 0 ${S} ${S}" width="${S*px}" height="${S*px}" shape-rendering="crispEdges"><rect width="${S}" height="${S}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`}
  return{encode,svg};
})();

/* ---------- Thème : logo et couleur ---------- */
const PALETTES=[['#1f3f75','Bleu nuit'],['#7b1e3a','Bordeaux'],['#1f6b4a','Vert'],['#5b2a86','Violet'],['#8a5a00','Or / brun'],['#0f6e7a','Bleu canard'],['#2b2b2b','Noir']];
const BRC=()=>cfg().couleur||'#1f3f75';
const hexRgb=h=>{h=String(h||'#1f3f75').replace('#','');return[0,2,4].map(i=>parseInt(h.substr(i,2),16)||0)};
const mixHex=(h,t,k)=>'#'+hexRgb(h).map((v,i)=>Math.round(v+(t[i]-v)*k).toString(16).padStart(2,'0')).join('');
const BRD=()=>mixHex(BRC(),[0,0,0],.35);
const LOGOI=()=>{const l=cfg().logo;return l&&l.b64?l:LOGO_JPG};
const logoUrl=()=>{const l=cfg().logo;return l&&l.b64?'data:image/jpeg;base64,'+l.b64:''};
let _thm='';
function applyTheme(){const c=BRC(),k=c+'|'+((cfg().logo||{}).b64||'').length;if(k===_thm)return;_thm=k;const R=document.documentElement.style;R.setProperty('--brand',c);R.setProperty('--brand-d',BRD());R.setProperty('--brand-l',mixHex(c,[255,255,255],.88));
  TEAL=hexRgb(BRD());const u=logoUrl(),im=document.querySelector('#logo img');if(u&&im)im.src=u;if(im)R.setProperty('--wm',`url("${im.src}")`);const mt=document.querySelector('meta[name=theme-color]');if(mt)mt.setAttribute('content',c)}
function logoUpload(file){if(!file)return;const fr=new FileReader();fr.onload=()=>{const img=new Image();img.onload=async()=>{const mx=600,sc=Math.min(1,mx/Math.max(img.width,img.height)),w=Math.max(1,Math.round(img.width*sc)),h=Math.max(1,Math.round(img.height*sc));const cv=document.createElement('canvas');cv.width=w;cv.height=h;const x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(img,0,0,w,h);
  const b64=cv.toDataURL('image/jpeg',.85).split(',')[1];if(b64.length>400000){toast('Image trop lourde, choisissez-en une plus petite',1);return}if(await saveConfig({...cfg(),logo:{w,h,b64,cs:'/DeviceRGB'}})){_thm='';toast('Logo mis à jour')}};img.onerror=()=>toast('Image illisible',1);img.src=fr.result};fr.readAsDataURL(file)}
function themeCard(){const c=cfg(),cur=BRC();return`<div class="card sec"><h2>Logo et couleur de l'église</h2><div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap"><div style="width:84px;height:84px;border-radius:50%;background:#fff;border:2px solid var(--bd);display:grid;place-items:center;overflow:hidden"><img src="${esc(logoUrl()||(document.querySelector('#logo img')||{}).src||'')}" style="max-width:76px;max-height:76px"></div>
  <div style="flex:1;min-width:200px"><div class="muted small" style="margin-bottom:8px">Le logo apparaît dans le menu, en filigrane et sur tous les PDF (rapports, reçus, cartes). Choisissez une image carrée, sur fond blanc de préférence.</div><label class="btn sm">📷 Changer le logo<input type="file" accept="image/*" data-logo="1" hidden></label>${c.logo?' <button class="btn sm" data-act="logoReset">Revenir au logo d\'origine</button>':''}</div></div>
  <div class="muted small" style="margin:14px 0 6px">Couleur principale</div><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">${PALETTES.map(([h,n])=>`<button class="btn sm" data-act="setColor" data-k="${h}" title="${esc(n)}" style="background:${h};color:#fff;border-color:${h};${h===cur?'outline:3px solid #ffb400;outline-offset:2px':''}">${esc(n)}</button>`).join('')}<label class="btn sm">Autre… <input type="color" data-color="1" value="${esc(cur)}" style="width:28px;height:22px;border:0;padding:0;background:none"></label></div></div>`}

/* ---------- Carte de membre avec QR code ---------- */
const memberCode=m=>(cfg().sigle||'EMT')+'-'+String(m.id||'').replace(/[^a-z0-9]/gi,'').slice(-6).toUpperCase();
const ckUrl=m=>location.origin+location.pathname+'#ck='+encodeURIComponent(m.id);
function pdfCartes(list){
  list=list.filter(Boolean);if(!list.length){toast('Aucun membre',1);return}
  const c=cfg(),d=new PDFLIB.Doc(),L=LOGOI(),gap=14,M=28,cw=(d.W-2*M-gap)/2,ch=158,br=hexRgb(BRC());
  list.forEach((m,i)=>{const k=i%8;if(i&&k===0)d.page();const x=M+(k%2)*(cw+gap),y=M+Math.floor(k/2)*(ch+gap);
    d.rect(x,y,cw,ch,{stroke:[190,198,210],lw:.8});d.rect(x,y,cw,30,{fill:br});
    d.text(c.nom||'',x+10,y+19,{size:9.5,bold:1,color:[255,255,255],max:cw-20});
    const lw=46,lh=Math.min(40,lw*L.h/L.w);d.image(x+10,y+38,lw,lh);
    d.text(fullName(m),x+10,y+92,{size:11.5,bold:1,max:cw-112});
    d.text((m.statut||'Membre actif')+(m.fonction&&m.fonction!=='Fidèle'?' · '+m.fonction:''),x+10,y+107,{size:8.5,color:GREY,max:cw-112});
    d.text('N° '+memberCode(m),x+10,y+122,{size:9,bold:1,color:TEAL});if(m.telephone)d.text(m.telephone,x+10,y+135,{size:8.5,color:GREY});
    d.text('Présentez cette carte à l\'accueil',x+10,y+ch-8,{size:6.8,color:GREY});
    const Q=QR.encode(ckUrl(m)),N=Q.length,qs=96,mo=qs/N,qx=x+cw-qs-10,qy=y+40;
    Q.forEach((r,yy)=>{let run=-1;for(let xx=0;xx<=N;xx++){const on=xx<N&&r[xx];if(on&&run<0)run=xx;if(!on&&run>=0){d.rect(qx+run*mo,qy+yy*mo,(xx-run)*mo+.15,mo+.15,{fill:[0,0,0]});run=-1}}});
  });
  savePDF(list.length===1?`Carte ${fullName(list[0])}.pdf`:`Cartes membres ${c.sigle||'EMT'}.pdf`,d.output());
}
function ckMark(m){
  if(!m){toast('Carte inconnue',1);return}
  if(!allowed('presences')||(ROLES[ROLE]||{}).ro){toast("Seuls les responsables de l'accueil peuvent enregistrer les présences",1);return}
  UI.ckDate=today();const already=(checkinFor(UI.ckDate,UI.ckCulte,UI.ckGrp||'')||{presents:{}}).presents||{};
  if(!already[m.id])ckToggle(m.id,true);if(navigator.vibrate)try{navigator.vibrate(120)}catch(e){}
  const box=document.createElement('div');box.className='ckok';box.innerHTML=`<div>${already[m.id]?'ℹ️':'✅'}</div><b>${esc(fullName(m))}</b><span>${already[m.id]?'déjà enregistré(e)':'présence enregistrée'} · ${esc(UI.ckCulte)}</span>`;document.body.appendChild(box);setTimeout(()=>box.remove(),2200);
}
function ckFromText(t){const m=String(t||'').match(/#ck=([^&\s]+)/);if(!m)return null;return decodeURIComponent(m[1])}
let ckPend=null,ckPendT=0;
function ckHash(){const id=ckFromText(location.hash);if(!id)return false;ckPend=id;ckPendT=Date.now();try{history.replaceState(null,'','#presences')}catch(e){location.hash='presences'}return true}
function ckPending(){if(!ckPend)return;const m=memberById(ckPend);if(m){ckPend=null;UI.pTab='pointage';setTimeout(()=>ckMark(m),50)}else if(Date.now()-ckPendT>10000){ckPend=null;toast('Carte inconnue',1)}}
let scanStream=null;
async function scanCard(){
  if(!('BarcodeDetector' in window)){modal(`<div class="mhead"><h3>Scanner une carte</h3><button class="x" data-act="close">×</button></div><div class="mbody"><p>Ce téléphone ne permet pas de scanner dans l'application.</p><p><b>Solution :</b> ouvrez l'<b>appareil photo</b> du téléphone et visez le QR code de la carte, puis touchez le lien qui apparaît. La présence s'enregistre toute seule (vous devez être connecté sur ce téléphone).</p></div><div class="mfoot"><span class="sp"></span><button class="btn primary" data-act="close">Compris</button></div>`);return}
  let det;try{det=new BarcodeDetector({formats:['qr_code']})}catch(e){toast('Scanner indisponible',1);return}
  modal(`<div class="mhead"><h3>Scanner les cartes · ${esc(UI.ckCulte)}</h3><button class="x" data-act="scanStop">×</button></div><div class="mbody"><video id="scanV" playsinline muted style="width:100%;border-radius:12px;background:#000;max-height:60vh"></video><div class="muted small" style="margin-top:8px">Visez le QR code. Chaque carte lue est enregistrée ; continuez avec la suivante.</div></div><div class="mfoot"><span class="sp"></span><button class="btn primary" data-act="scanStop">Terminer</button></div>`);
  try{scanStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}})}catch(e){toast("Accès à la caméra refusé",1);return}
  const v=$('#scanV');if(!v){scanStop();return}v.srcObject=scanStream;await v.play().catch(()=>{});let last='',lastT=0;
  const loop=async()=>{if(!scanStream||!$('#scanV'))return;try{const r=await det.detect(v);if(r&&r[0]){const id=ckFromText(r[0].rawValue);if(id&&(id!==last||Date.now()-lastT>4000)){last=id;lastT=Date.now();ckMark(memberById(id))}}}catch(e){}setTimeout(loop,280)};loop();
}
function scanStop(){if(scanStream){scanStream.getTracks().forEach(t=>t.stop());scanStream=null}closeModal()}

/* ---------- Reçu de don / dîme ---------- */
function pdfRecuDoc(t){
  const c=cfg(),d=new PDFLIB.Doc(),M=40,W=d.W-2*M,L=LOGOI(),mm=memberById(t.membreId),who=mm?fullName(mm):(t.tiers||'Anonyme'),y0=40,br=hexRgb(BRC());
  d.rect(M,y0,W,400,{stroke:[180,195,198],lw:.8});d.rect(M,y0,W,6,{fill:br});
  const lw=120,lh=Math.min(70,lw*L.h/L.w);d.image(M+16,y0+20,lw,lh);
  d.text('REÇU',M+W-16,y0+40,{size:22,bold:1,align:'right',color:TEAL});d.text('N° '+(t.numBon||'—'),M+W-16,y0+58,{size:11,bold:1,align:'right'});d.text(fdate(t.date),M+W-16,y0+73,{size:9,align:'right',color:GREY});
  d.line(M+16,y0+100,M+W-16,y0+100,{color:TEAL,lw:1});
  d.text(c.nom||'',M+16,y0+122,{size:12,bold:1});if(c.adresse||c.ville)d.text([c.adresse,c.ville].filter(Boolean).join(' · '),M+16,y0+137,{size:8.5,color:GREY,max:W-32});
  const sx=mm&&mm.sexe==='F'?'Madame ':mm&&mm.sexe==='M'?'Monsieur ':'';
  d.text("L'église accuse réception, avec reconnaissance, de :",M+16,y0+168,{size:10,color:GREY});
  d.text(sx+who,M+16,y0+188,{size:14,bold:1,max:W-32});
  d.rect(M+16,y0+204,W-32,52,{fill:[238,242,250],stroke:[200,212,232]});d.text(t.categorie||'Contribution',M+28,y0+226,{size:10,color:GREY});d.text(money(t.montant,t.devise),M+W-28,y0+238,{size:22,bold:1,align:'right',color:TEAL});
  const ln=d.wrap(montantLettres(t.montant,t.devise),W-32,10,1);ln.slice(0,2).forEach((l,i)=>d.text(l,M+16,y0+276+i*13,{size:10,bold:1}));
  if(t.description)d.text('Motif : '+t.description,M+16,y0+306,{size:9,color:GREY,max:W-32});
  d.text('« Dieu aime celui qui donne avec joie. » — 2 Corinthiens 9:7',M+W/2,y0+332,{size:10,align:'center',color:TEAL});
  d.text('Le Trésorier',M+W-120,y0+356,{size:9,bold:1,align:'center'});d.line(M+W-190,y0+388,M+W-50,y0+388,{color:[150,160,164]});
  d.text('Merci pour votre fidélité. Que Dieu vous bénisse abondamment !',M+16,y0+372,{size:8.5,color:GREY});
  return{name:`Reçu ${t.numBon||''} ${who}.pdf`.replace(/\s+/g,' '),bytes:d.output(),who,mm};
}
function recuText(t){const c=cfg(),mm=memberById(t.membreId),p=mm?(mm.prenom||mm.nom):(t.tiers||'');return`Bonjour ${p}, l'${c.nom} accuse réception de votre ${String(t.categorie||'contribution').toLowerCase()} de ${money(t.montant,t.devise)} du ${fdate(t.date)} (reçu N° ${t.numBon||'—'}). Merci pour votre fidélité ! « Dieu aime celui qui donne avec joie » (2 Co 9:7). Que Dieu vous bénisse.`}
function recuPDF(t){const r=pdfRecuDoc(t);savePDF(r.name,r.bytes)}
async function recuShare(t){const r=pdfRecuDoc(t),txt=recuText(t);
  try{const f=new File([r.bytes],r.name,{type:'application/pdf'});if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],text:txt,title:'Reçu'});return}}catch(e){if(e&&e.name==='AbortError')return}
  const tel=r.mm&&r.mm.telephone;const u=tel&&waLink(tel,txt);if(u){window.open(u,'_blank');toast('Le message est prêt dans WhatsApp ; joignez le PDF téléchargé si besoin')}else toast("Pas de numéro WhatsApp : téléchargez le PDF et envoyez-le",1);savePDF(r.name,r.bytes)}
function recuPrompt(t){if(!t)return;UI.recuT=t;const mm=memberById(t.membreId),who=mm?fullName(mm):(t.tiers||'');
  modal(`<div class="mhead"><h3>Contribution enregistrée ✓</h3><button class="x" data-act="close">×</button></div><div class="mbody"><div style="font-size:15px"><b>${esc(who)}</b> · ${esc(t.categorie||'')} · <b>${esc(money(t.montant,t.devise))}</b></div><div class="muted small" style="margin-top:6px">Voulez-vous lui envoyer un reçu ?</div></div><div class="mfoot"><button class="btn" data-act="close">Plus tard</button><span class="sp"></span><button class="btn" data-act="recuPdf" data-id="${t.id}">📄 Reçu PDF</button><button class="btn wa" data-act="recuShare" data-id="${t.id}">📲 Envoyer (WhatsApp…)</button></div>`)}

/* ---------- Sauvegarde automatique ---------- */
const daysSince=d=>d?Math.floor((Date.now()-new Date(d).getTime())/864e5):999;
async function loadAutoBk(){const el=document.getElementById('autoBk');if(!el||!window.EMT_BACKUP||el.dataset.ok)return;el.dataset.ok=1;
  try{const L=await window.EMT_BACKUP.list();el.innerHTML=L.length?L.map(f=>`<div class="row" style="cursor:default;padding:8px 12px"><div class="grow"><div class="t">${esc(f.name.replace('sauvegarde-','').replace('.json',''))}</div><div class="st">${f.metadata&&f.metadata.size?Math.round(f.metadata.size/1024)+' Ko':''}</div></div><button class="btn sm" data-act="dlAutoBk" data-k="${esc(f.name)}">Télécharger</button><button class="btn sm" data-act="rsAutoBk" data-k="${esc(f.name)}">Restaurer</button></div>`).join(''):'<div class="muted small">Aucune pour le moment : la première sera faite automatiquement.</div>'}catch(e){el.innerHTML='<div class="muted small">Espace « sauvegardes » pas encore créé dans Supabase (lancez le fichier SQL de mise à jour).</div>'}}
function backupData(){const o={app:'EMT',version:1,date:new Date().toISOString(),config:S.config};BKCOLS.forEach(c=>o[c]=S[c]);return o}
let autoBkDone=false;
async function autoBackup(){
  if(autoBkDone||ROLE!=='admin'||!window.EMT_BACKUP||!S.members.length)return;autoBkDone=true;
  if(daysSince(cfg().lastAutoBackup)<7)return;
  try{await window.EMT_BACKUP.upload(`sauvegarde-${today()}.json`,JSON.stringify(backupData()));await saveConfig({...cfg(),lastAutoBackup:new Date().toISOString()});toast('Sauvegarde automatique de la semaine effectuée ✓')}catch(e){console.warn('auto backup',e)}
}
function backupBanner(){if(ROLE!=='admin')return'';const c=cfg(),last=[c.lastBackup,c.lastAutoBackup].filter(Boolean).sort().pop(),n=daysSince(last);if(n<8)return'';
  return`<div class="card" style="margin-bottom:12px;border-left:4px solid var(--warn);display:flex;gap:10px;align-items:center;flex-wrap:wrap"><div style="flex:1;min-width:200px"><b>💾 ${last?'Dernière sauvegarde il y a '+n+' jours':'Aucune sauvegarde faite'}</b><div class="muted small">Gardez une copie de toutes les données de l'église en lieu sûr.</div></div><button class="btn primary sm" data-act="backup">Sauvegarder maintenant</button></div>`}

/* ---------- journal d'activité ---------- */
const LOGCOLS={members:'Membre',groups:'Groupe',events:'Événement',attendance:'Présences',followups:'Suivi',transactions:'Opération',budgets:'Budget',plans:'Plan de culte',songs:'Chant',lots:'Lot de collecte',campagnes:'Campagne',checkins:'Pointage',indispos:'Indisponibilité',bulletins:'Bulletin'};
function logLabel(col,o){if(col==='members')return fullName(o);if(col==='transactions')return(o.numBon||'')+' '+(o.categorie||'')+' '+money(o.montant,o.devise);return o.titre||o.nom||o.culte||o.date||''}
const TXF=[['date','Date'],['montant','Montant'],['devise','Devise'],['categorie','Catégorie'],['compte','Compte'],['fonds','Fonds'],['membreId','Membre'],['tiers','Nom'],['description','Libellé'],['numBon','N° bon'],['campagneId','Projet'],['type','Type']];
function txDiff(a,b){const sh=(k,v)=>k==='membreId'?(memberById(v)?fullName(memberById(v)):v||''):k==='campagneId'?((S.campagnes.find(x=>x.id===v)||{}).nom||v||''):k==='montant'?String(num(v)):String(v??'');
  return TXF.filter(([k])=>sh(k,a[k])!==sh(k,b[k])).map(([k,l])=>`${l} : ${sh(k,a[k])||'—'} → ${sh(k,b[k])||'—'}`).join(' ; ')}
function journal(action,col,o,old){
  if(!LOGCOLS[col])return;const e={at:new Date().toISOString(),uid:ME&&ME.id||'',qui:ME&&ME.name||'',action,quoi:LOGCOLS[col],label:String(logLabel(col,o||{})).slice(0,80)};
  if(col==='transactions'){e.fin=true;e.txId=(o&&o.id)||'';if(action==='update'&&old)e.details=txDiff(old,o).slice(0,600);else e.details=[fdate(o.date),o.type==='sortie'?'Sortie':o.type==='pret'?'Prêt':o.type==='rembpret'?'Remboursement':o.type==='transfert'?'Virement':'Entrée',o.categorie,money(o.montant,o.devise),o.compte,(memberById(o.membreId)?fullName(memberById(o.membreId)):o.tiers||''),o.description].filter(Boolean).join(' · ').slice(0,600);if(action==='update'&&!e.details)return}
  if(db)db.collection('journal').add(e).catch(()=>{});else S.journal.push({id:'j'+Date.now(),...e});
}

/* ---------- membres : recherche avancée + IA + familles + import ---------- */
const FDEF={sexe:'',statut:'',fonction:'',groupe:'',ageMin:'',ageMax:'',etatCivil:'',baptise:'',anniv:'',present30:'',famille:'',arrDu:'',arrAu:''};
function memberMatch(m){
  const f=UI.mf,a=ageOf(m);
  if(f.sexe&&m.sexe!==f.sexe)return false;
  if(f.statut&&(m.statut||'Membre actif')!==f.statut)return false;
  if(f.fonction&&m.fonction!==f.fonction)return false;
  if(f.groupe&&!(m.groupes||[]).includes(f.groupe))return false;
  if(f.ageMin!==''&&(a===null||a<+f.ageMin))return false;
  if(f.ageMax!==''&&(a===null||a>+f.ageMax))return false;
  if(f.etatCivil&&m.etatCivil!==f.etatCivil)return false;
  if(f.baptise==='oui'&&!m.baptise||f.baptise==='non'&&m.baptise)return false;
  if(f.anniv==='mois'&&!(m.dateNaissance&&m.dateNaissance.slice(5,7)===today().slice(5,7)))return false;
  if(f.present30){const p=presentSince(m.id,30);if(f.present30==='oui'&&!p||f.present30==='non'&&p)return false}
  if(f.famille&&m.famille!==f.famille)return false;
  {const j=(m.dateAdhesion||String(m.createdAt||'')).slice(0,7);if(f.arrDu&&(!j||j<f.arrDu))return false;if(f.arrAu&&(!j||j>f.arrAu))return false}
  return true;
}
const filtersOn=()=>Object.values(UI.mf).filter(v=>v!=='').length;
function filterPanel(){
  const f=UI.mf,fams=[...new Set(S.members.map(m=>m.famille).filter(Boolean))].sort();
  const sel=(k,opts)=>`<select class="inp" data-mf="${k}">${opts.map(o=>opt(o,f[k])).join('')}</select>`;
  return`<div class="card" style="margin-bottom:12px">
   <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px"><b style="flex:1">✨ Rechercher avec l'IA</b><span class="badge">BETA</span></div>
   <form id="aiForm" style="display:flex;gap:8px"><input class="inp" id="aiQ" data-bind="aiQ" value="${esc(UI.aiQ)}" placeholder="ex. femmes mariées de plus de 30 ans présentes ces 30 derniers jours" style="flex:1"><button class="btn primary" ${UI.aiBusy?'disabled':''}>${UI.aiBusy?'…':'→'}</button></form>
   <div class="muted small" style="margin-top:6px">${esc(UI.aiMsg||"L'IA traduit votre phrase en filtres ci-dessous : vérifiez-les avant de les utiliser.")}</div>
   <div class="fgrid" style="padding:12px 0 0;grid-template-columns:repeat(auto-fill,minmax(150px,1fr))">
    <div class="fld"><label>Sexe</label>${sel('sexe',[['','Tous'],['M','Homme'],['F','Femme']])}</div>
    <div class="fld"><label>Statut</label>${sel('statut',[['','Tous']].concat(STATUTS))}</div>
    <div class="fld"><label>Fonction</label>${sel('fonction',[['','Toutes']].concat(FONCTIONS))}</div>
    <div class="fld"><label>Groupe</label>${sel('groupe',[['','Tous']].concat(S.groups.map(g=>[g.id,g.nom])))}</div>
    <div class="fld"><label>Âge min.</label><input class="inp" data-mf="ageMin" inputmode="numeric" value="${esc(f.ageMin)}"></div>
    <div class="fld"><label>Âge max.</label><input class="inp" data-mf="ageMax" inputmode="numeric" value="${esc(f.ageMax)}"></div>
    <div class="fld"><label>État civil</label>${sel('etatCivil',[['','Tous'],'Célibataire','Marié(e)','Veuf / veuve','Divorcé(e)'])}</div>
    <div class="fld"><label>Baptisé(e)</label>${sel('baptise',[['','—'],['oui','Oui'],['non','Non']])}</div>
    <div class="fld"><label>Anniversaire</label>${sel('anniv',[['','—'],['mois','Ce mois-ci']])}</div>
    <div class="fld"><label>Présent 30 derniers jours</label>${sel('present30',[['','—'],['oui','Oui'],['non','Non (absent)']])}</div>
    <div class="fld"><label>Famille</label>${sel('famille',[['','Toutes']].concat(fams))}</div>
    <div class="fld"><label>Arrivé(e) du (mois)</label><input type="month" class="inp" data-mf="arrDu" value="${esc(f.arrDu)}"></div>
    <div class="fld"><label>au (mois)</label><input type="month" class="inp" data-mf="arrAu" value="${esc(f.arrAu)}"></div>
   </div><div style="margin-top:10px;display:flex;gap:8px"><button class="btn sm" data-act="mfClear">Effacer les filtres</button><button class="btn sm" data-act="mfMsg">Envoyer un message à ce résultat</button></div></div>`;
}
async function aiSearch(){
  const q=UI.aiQ.trim();if(!q)return;let sample=null;try{sample=window.claude?await window.claude.use('sample'):null}catch(e){}
  if(!sample){UI.aiMsg="L'IA n'est pas disponible ici.";render();return}
  UI.aiBusy=1;UI.aiMsg='Analyse de la demande…';render();
  const prompt=`Tu convertis une demande en filtres pour la liste des membres d'une église. Réponds UNIQUEMENT par un objet JSON avec ces clés (valeur "" si non concernée):
sexe: "M"|"F"; statut: ${JSON.stringify(STATUTS)}; fonction: ${JSON.stringify(FONCTIONS)}; groupe: id parmi ${JSON.stringify(S.groups.map(g=>({id:g.id,nom:g.nom})))}; ageMin: nombre; ageMax: nombre; etatCivil: "Célibataire"|"Marié(e)"|"Veuf / veuve"|"Divorcé(e)"; baptise: "oui"|"non"; anniv: "mois" (anniversaire ce mois); present30: "oui"|"non" (présent ou absent aux cultes des 30 derniers jours); arrDu et arrAu: mois "AAAA-MM" de la date d'arrivée/adhésion (ex. arrivés en octobre 2026 => arrDu "2026-10", arrAu "2026-10"; aujourd'hui ${today()}); explication: courte phrase en français décrivant les filtres.
"plus de 30 ans" => ageMin 31. Demande : ${q}`;
  try{const r=await sample.json(prompt,{modelTier:'quick'});const nf={...FDEF};Object.keys(FDEF).forEach(k=>{if(r&&r[k]!==undefined&&r[k]!==null)nf[k]=String(r[k])});UI.mf=nf;UI.showF=1;UI.aiMsg='Compris comme : '+(r&&r.explication||'filtres appliqués');}
  catch(e){UI.aiMsg=e&&e.code==='not_granted'?"Accès à l'IA refusé.":"L'IA n'a pas pu traiter la demande. Réessayez ou utilisez les filtres."}
  UI.aiBusy=0;render();
}
function famillesView(list){
  const by={};list.forEach(m=>{const k=m.famille||'— Sans famille —';(by[k]=by[k]||[]).push(m)});
  return Object.keys(by).sort((a,b)=>a.startsWith('—')?1:b.startsWith('—')?-1:a.localeCompare(b,'fr')).map(k=>`<div class="card" style="margin-bottom:10px"><h2>${esc(k)} <span class="muted small">(${by[k].length})</span></h2><div class="list">${by[k].map(m=>`<div class="row" data-act="viewMember" data-id="${m.id}">${avatar(m)}<div class="grow"><div class="t">${esc(fullName(m))}</div><div class="st">${esc(m.lienFamille||'')}${ageOf(m)!==null?' · '+ageOf(m)+' ans':''}</div></div></div>`).join('')}</div></div>`).join('');
}
function parseCSV(t){
  t=t.replace(/^﻿/,'');const sep=(t.split('\n')[0].match(/;/g)||[]).length>=(t.split('\n')[0].match(/,/g)||[]).length?';':',';
  const rows=[];let row=[],cur='',q=false;
  for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c==='"'){if(t[i+1]==='"'){cur+='"';i++}else q=false}else cur+=c}else if(c==='"')q=true;else if(c===sep){row.push(cur);cur=''}else if(c==='\n'||c==='\r'){if(c==='\r'&&t[i+1]==='\n')i++;row.push(cur);rows.push(row);row=[];cur=''}else cur+=c}
  if(cur||row.length){row.push(cur);rows.push(row)}return rows.filter(r=>r.some(x=>x.trim()));
}
const normH=h=>slug(h).toLowerCase();
const HMAP={nom:'nom',postnom:'postnom','post-nom':'postnom',prenom:'prenom',sexe:'sexe',telephone:'telephone',tel:'telephone',phone:'telephone','e-mail':'email',email:'email',mail:'email',naissance:'dateNaissance','date-de-naissance':'dateNaissance',adresse:'adresse',statut:'statut',fonction:'fonction',famille:'famille',profession:'profession','etat-civil':'etatCivil'};
const toIsoDate=v=>{v=String(v||'').trim();let m=v.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);if(m)return`${m[3]}-${pad(m[2])}-${pad(m[1])}`;m=v.match(/^\d{4}-\d{2}-\d{2}/);return m?m[0]:''};
function importForm(){
  modal(`<div class="mhead"><h3>Importer des membres (Excel / CSV)</h3><button class="x" data-act="close">×</button></div><div class="mbody">
  <div class="muted small" style="margin-bottom:10px">Dans Excel : Fichier → Enregistrer sous → <b>CSV</b>. Première ligne = titres de colonnes, par exemple : <code>Nom;Postnom;Prénom;Sexe;Téléphone;E-mail;Naissance;Adresse;Statut;Famille</code>. Les dates peuvent être au format 25/11/1990.</div>
  <input type="file" id="csvIn" accept=".csv,.txt" class="inp" style="width:100%"><div id="csvPrev" class="small" style="margin-top:10px"></div></div>
  <div class="mfoot"><span class="sp"></span><button class="btn" data-act="close">Annuler</button><button class="btn primary" id="csvGo" disabled>Importer</button></div>`);
  let recs=[];
  $('#csvIn').onchange=async e=>{const f=e.target.files[0];if(!f)return;const rows=parseCSV(await f.text());if(rows.length<2){$('#csvPrev').textContent='Fichier vide ou illisible.';return}
    const keys=rows[0].map(h=>HMAP[normH(h)]||null);
    recs=rows.slice(1).map(r=>{const o={};keys.forEach((k,i)=>{if(k&&r[i]!==undefined)o[k]=r[i].trim()});if(o.dateNaissance)o.dateNaissance=toIsoDate(o.dateNaissance);if(o.sexe)o.sexe=/^f/i.test(o.sexe)?'F':/^[mh]/i.test(o.sexe)?'M':'';if(!STATUTS.includes(o.statut))o.statut='Membre actif';return o}).filter(o=>o.nom||o.prenom);
    const known=new Set(S.members.map(m=>(fullName(m)+'|'+(m.telephone||'')).toLowerCase()));const dup=recs.filter(o=>known.has((fullName(o)+'|'+(o.telephone||'')).toLowerCase())).length;
    $('#csvPrev').innerHTML=`Colonnes reconnues : <b>${esc(keys.filter(Boolean).join(', ')||'aucune')}</b><br>${recs.length} personne(s) à importer${dup?` · ${dup} doublon(s) ignoré(s)`:''}.<br><span class="muted">${recs.slice(0,3).map(o=>esc(fullName(o))).join(' · ')}${recs.length>3?'…':''}</span>`;
    recs=recs.filter(o=>!known.has((fullName(o)+'|'+(o.telephone||'')).toLowerCase()));$('#csvGo').disabled=!recs.length};
  $('#csvGo').onclick=async()=>{const b=$('#csvGo');b.disabled=true;let n=0;for(const o of recs){b.textContent=`Import… ${n}/${recs.length}`;if(!await save('members',{fonction:'Fidèle',dateAdhesion:today(),...o}))break;n++}closeModal();toast(n+' membre(s) importé(s)');journal('import','members',{nom:n+' membres importés'})};
}

/* ---------- accueil automatique, mariage ---------- */
async function accueilAuto(m){
  const a=cfg().accueilAuto||{};if(!a.actif)return;if(m.statut!=='Visiteur'&&m.statut!=='Nouveau converti')return;
  const d=new Date();d.setDate(d.getDate()+num(a.delai||3));
  await save('followups',{membreId:m.id,type:a.type||'Nouveau converti',statut:'À faire',responsable:a.responsable||'',echeance:iso(d),notes:'Créé automatiquement (accueil des nouveaux venus)'});
  if(a.groupe&&!(m.groupes||[]).includes(a.groupe))await save('members',{...m,groupes:(m.groupes||[]).concat(a.groupe)});
  toast('Accueil automatique : suivi créé');
}
function accueilForm(){
  const a=cfg().accueilAuto||{};
  openForm({title:'Accueil automatique des nouveaux venus',values:{actif:!!a.actif,type:a.type||'Nouveau converti',delai:a.delai??3,responsable:a.responsable||'',groupe:a.groupe||''},
   fields:[{k:'actif',label:'Activer : à chaque nouveau visiteur ou nouveau converti enregistré',type:'checkbox',full:1},{k:'type',label:'Type de suivi créé',type:'select',options:TYPES_SUIVI},{k:'delai',label:'Échéance (jours après l\'enregistrement)',type:'number'},{k:'responsable',label:'Confié à'},{k:'groupe',label:'Ajouter au groupe',type:'select',options:[['','— Aucun —']].concat(S.groups.map(g=>[g.id,g.nom]))}],
   onSave:d=>saveConfig({accueilAuto:d})});
}

/* ---------- présences : pointage, absents, borne ---------- */
const PTABS=[['comptage','Comptage'],['pointage','Pointage par nom'],['absents','Absents à accompagner']];
function vPresences(){
  const sub={comptage:vComptage,pointage:vPointage,absents:vAbsents}[UI.pTab]||vComptage;
  return`<div class="toolbar"><div class="tabs">${PTABS.map(([k,l])=>`<button class="tab${UI.pTab===k?' on':''}" data-act="pTab" data-k="${k}">${l}</button>`).join('')}</div><span class="sp"></span><button class="btn" data-act="borne">Mode borne</button></div>`+sub();
}
const ckId=(d,c,g)=>d+'_'+slug(c)+(g?'_'+g:'');
const checkinFor=(d,c,g=UI.ckGrp||'')=>S.checkins.find(x=>x.id===ckId(d,c,g));
function presentSince(id,days){const d=new Date();d.setDate(d.getDate()-days);const lim=iso(d);return S.checkins.some(c=>c.date>=lim&&c.presents&&c.presents[id])}
function progTitles(){return[...new Set(cfg().programmes.map(p=>p.titre))].concat(['Répétition','Réunion de groupe','Réunion spéciale']).filter((x,i,a)=>a.indexOf(x)===i)}
function assiduite(G,M){
  const ss=S.checkins.filter(x=>x.groupeId===G.id).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,10);
  if(!ss.length)return`<div class="banner show info" style="margin-bottom:12px">Groupe « ${esc(G.nom)} » : choisissez « Répétition » (ou « Réunion de groupe »), puis cochez les présents. Après quelques séances, l'assiduité de chaque membre s'affiche ici.</div>`;
  const rows=M.map(m=>{const k=ss.filter(x=>(x.presents||{})[m.id]).length;return{m,k,p:Math.round(k/ss.length*100)}}).sort((a,b)=>b.p-a.p||fullName(a.m).localeCompare(fullName(b.m)));
  const lab=p=>p>=75?'<span class="badge b-done">Permanent</span>':p>=40?'<span class="badge b-encours">Irrégulier</span>':'<span class="badge b-inactif">Rarement présent</span>';
  const perm=rows.filter(r=>r.p>=75).length;
  return`<details class="card" style="margin-bottom:12px"${UI.assOpen?' open':''} ontoggle="UI.assOpen=this.open"><summary style="cursor:pointer;font-weight:700">Assiduité – ${esc(G.nom)} · ${perm} permanent(s) sur ${rows.length} · ${ss.length} dernière(s) séance(s)</summary>
  <table class="t" style="margin-top:10px"><tr><th>Nom</th><th class="n">Présences</th><th style="width:30%"></th><th></th></tr>${rows.map(r=>`<tr><td>${esc(fullName(r.m))}</td><td class="n">${r.k} / ${ss.length}</td><td>${bar(r.p)}</td><td>${lab(r.p)}</td></tr>`).join('')}</table>
  <div class="muted small" style="margin-top:6px">Permanent = présent à au moins 75 % des séances · Irrégulier = 40 à 74 % · Rarement = moins de 40 %.</div></details>`;
}
function vPointage(){
  const c=checkinFor(UI.ckDate,UI.ckCulte)||{presents:{}},P=c.presents||{},q=UI.ckQ.toLowerCase();
  const G=UI.ckGrp&&S.groups.find(g=>g.id===UI.ckGrp);if(UI.ckGrp&&!G)UI.ckGrp='';
  const M=sortedMembers().filter(m=>m.statut!=='Inactif'&&!isGone(m)&&(!G||(m.groupes||[]).includes(G.id))),n=Object.keys(P).filter(id=>M.some(m=>m.id===id)).length;
  const list=M.filter(m=>(!q||[fullName(m),m.telephone].join(' ').toLowerCase().includes(q))&&(UI.ckF==='tous'||(UI.ckF==='presents'?P[m.id]:!P[m.id])));
  return`<div class="card" style="margin-bottom:12px"><div class="toolbar" style="margin:0"><input type="date" class="inp" data-bind="ckDate" value="${esc(UI.ckDate)}"><select class="inp" data-bind="ckGrp"><option value="">Tous les membres</option>${S.groups.map(g=>`<option value="${g.id}"${UI.ckGrp===g.id?' selected':''}>${esc(g.nom)}</option>`).join('')}</select><select class="inp" data-bind="ckCulte">${progTitles().map(t=>opt(t,UI.ckCulte)).join('')}</select><input class="inp" id="ckQ" data-bind="ckQ" value="${esc(UI.ckQ)}" placeholder="Rechercher…" style="flex:1;min-width:140px"></div></div>
  <div class="toolbar"><div class="tabs">${[['tous',`Tous (${M.length})`],['absents',`Absents (${M.length-n})`],['presents',`Présents (${n})`]].map(([k,l])=>`<button class="tab${UI.ckF===k?' on':''}" data-act="ckF" data-k="${k}">${l}</button>`).join('')}</div><span class="sp"></span><button class="btn sm primary" data-act="scanCard">📷 Scanner les cartes</button>${n?(G?'':'<button class="btn sm" data-act="ckReport">Reporter dans le comptage</button>')+'<button class="btn sm" data-act="ckExport">Exporter</button>':''}</div>${G?assiduite(G,M):''}
  <div class="grid2">${list.map(m=>{const t=P[m.id];return`<div class="row card" style="padding:10px;cursor:default">${avatar(m)}<div class="grow"><div class="t">${esc(fullName(m))}</div><div class="st">${t?'<span class="pos">● Arrivée · '+esc(t)+'</span>':esc(m.telephone||'')}</div></div><button class="btn sm ${t?'':'primary'}" data-act="ckToggle" data-id="${m.id}">${t?'✕':'Présent'}</button></div>`}).join('')||'<div class="empty">Personne.</div>'}</div>`;
}
let ckBusy=Promise.resolve();
function ckToggle(id,force){
  ckBusy=ckBusy.then(async()=>{
    const d=UI.ckDate,c=UI.ckCulte,g=UI.ckGrp||'',cur=checkinFor(d,c,g)||{id:ckId(d,c,g),date:d,culte:c,presents:{}};if(g)cur.groupeId=g;
    const P={...(cur.presents||{})};if(P[id]&&!force)delete P[id];else P[id]=new Date().toLocaleTimeString(LOC(),{hour:'2-digit',minute:'2-digit'});
    await save('checkins',{...cur,date:d,culte:c,presents:P});
  });return ckBusy;
}
function vAbsents(){
  const sess=[...S.checkins].filter(x=>!x.groupeId).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3);
  if(sess.length<2)return'<div class="card empty">Faites le pointage par nom pendant au moins 2 cultes : les membres absents à toutes les dernières réunions apparaîtront ici.</div>';
  const abs=sortedMembers().filter(m=>(m.statut==='Membre actif'||!m.statut)&&sess.every(s=>!(s.presents||{})[m.id])&&(m.dateAdhesion||'')<sess[sess.length-1].date);
  return`<div class="muted small" style="margin-bottom:8px">Membres actifs absents aux ${sess.length} derniers pointages (${sess.map(s=>fdate(s.date)).join(', ')}).</div>
  <div class="list">${abs.length?abs.map(m=>`<div class="row" style="cursor:default">${avatar(m)}<div class="grow"><div class="t">${esc(fullName(m))}</div><div class="st">Absent ${sess.length} fois de suite</div></div><span class="badge b-encours">À accompagner</span>${waLink(m.telephone)?`<a class="btn sm wa" target="_blank" rel="noopener" href="${esc(waLink(m.telephone,fillTpl(TPL.absent,m)))}">WhatsApp</a>`:''}<button class="btn sm" data-act="newFollowAbs" data-id="${m.id}">+ Suivi</button></div>`).join(''):'<div class="empty">Aucun absent répété. 🎉</div>'}</div>`;
}
function borne(){
  UI.borne={tel:'',found:null,msg:''};drawBorne();
}
function drawBorne(){
  const B=UI.borne,c=cfg();let el=$('#borne');if(!el){el=document.createElement('div');el.id='borne';el.className='login';document.body.appendChild(el)}
  const keys=['1','2','3','4','5','6','7','8','9','⌫','0','✓'];
  el.innerHTML=`<div class="lcard" style="max-width:420px"><img class="sym" src="${$('#logo img').src}" alt=""><div class="cn">${esc(c.nom)} · ${esc(UI.ckCulte)} · ${fday(UI.ckDate)}</div>
  ${B.found?`<h2>Bienvenue ${esc(B.found.prenom||B.found.nom)} !</h2><p>${esc(B.msg)}</p><button class="lbtn" data-bk="ok">OK</button>`:
  `<h2>Enregistrez votre présence</h2><p>Tapez votre numéro de téléphone</p><input value="${esc(B.tel)}" readonly placeholder="0991234567" style="letter-spacing:3px"><div class="lerr">${esc(B.msg)}</div>
   <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${keys.map(k=>`<button class="lbtn" style="margin:0;background:rgba(255,255,255,${k==='✓'?'1':'.85'})" data-bk="${k}">${k==='✓'?'Me trouver':k}</button>`).join('')}</div>`}
  <button class="llink" data-bk="exit">Quitter le mode borne (code requis)</button></div>`;
  el.onclick=async e=>{const b=e.target.closest('[data-bk]');if(!b)return;const k=b.dataset.bk;
    if(k==='exit'){if(window.EMT_API||AUTH.hash){const v=await askCode();if(v===null)return;if(!(await exitOk(v))){B.msg='Code incorrect';drawBorne();return}}el.remove();UI.borne=null;render();return}
    if(k==='ok'){UI.borne={tel:'',found:null,msg:''};drawBorne();return}
    if(k==='⌫')B.tel=B.tel.slice(0,-1);else if(k==='✓'){const t=waNum(B.tel);const m=t&&S.members.find(x=>waNum(x.telephone)===t);if(!m){B.msg='Numéro introuvable. Adressez-vous à l\'accueil.';}else{const already=(checkinFor(UI.ckDate,UI.ckCulte)||{presents:{}}).presents[m.id];if(!already)await ckToggle(m.id,1);B.found=m;B.msg=already?'Vous êtes déjà enregistré(e). Bon culte !':'Votre présence est enregistrée. Bon culte !';setTimeout(()=>{if(UI.borne&&UI.borne.found===m){UI.borne={tel:'',found:null,msg:''};drawBorne()}},5000)}}
    else if(B.tel.length<13){B.tel+=k;B.msg=''}drawBorne()};
}
function askCode(){return new Promise(r=>{
  const d=document.createElement('div');d.className='modal open';d.style.zIndex=200;d.innerHTML=`<div class="mbox" style="max-width:320px"><div class="mhead"><h3>${window.EMT_API?'Mot de passe':'Code administrateur'}</h3></div><div class="mbody"><input type="password" ${window.EMT_API?'':'inputmode="numeric"'} class="inp" id="bcode" style="width:100%"></div><div class="mfoot"><span class="sp"></span><button class="btn" id="bno">Annuler</button><button class="btn primary" id="bok">Valider</button></div></div>`;document.body.appendChild(d);d.querySelector('#bcode').focus();
  d.querySelector('#bno').onclick=()=>{d.remove();r(null)};d.querySelector('#bok').onclick=()=>{const v=d.querySelector('#bcode').value;d.remove();r(v)}})}

/* ---------- suivis : compteurs ---------- */
function suivisKpis(){
  const mois=today().slice(0,7),me=ME&&ME.name||'';
  const att=S.followups.filter(f=>f.statut==='À faire'||!f.statut).length,enc=S.followups.filter(f=>f.statut==='En cours').length,fin=S.followups.filter(f=>f.statut==='Terminé'&&String(f.updatedAt||'').startsWith(mois)).length,late=S.followups.filter(f=>f.statut!=='Terminé'&&f.echeance&&f.echeance<today()).length;
  const a=cfg().accueilAuto||{};
  return`<div class="grid4" style="margin-bottom:12px"><div class="card kpi"><div class="l">En attente</div><div class="v">${att}</div></div><div class="card kpi"><div class="l">En cours</div><div class="v">${enc}</div></div><div class="card kpi"><div class="l">Terminés ce mois</div><div class="v pos">${fin}</div></div><div class="card kpi"><div class="l">En retard</div><div class="v ${late?'neg':''}">${late}</div></div></div>
  <div class="card" style="margin-bottom:12px;display:flex;align-items:center;gap:10px"><div class="grow" style="flex:1"><b>Accueil automatique des nouveaux venus</b><div class="muted small">${a.actif?`Actif : suivi « ${esc(a.type||'Nouveau converti')} » à J+${num(a.delai||3)}${a.responsable?' confié à '+esc(a.responsable):''}${a.groupe&&groupName(a.groupe)?', ajout au groupe '+esc(groupName(a.groupe)):''}`:'Désactivé'}</div></div><span class="badge ${a.actif?'b-done':''}">${a.actif?'Actif':'Inactif'}</span><button class="btn sm" data-act="accueilForm">Configurer</button></div>`;
}

/* ---------- culte : plans, chants, équipes ---------- */
const CTABS2=[['plans','Plans de culte'],['chants','Chants'],['equipe','Bénévoles']];
function vCulte(){
  const sub={plans:vPlans,chants:vChants,equipe:vEquipe}[UI.cTab]||vPlans;
  return`<div class="tabs" style="margin-bottom:14px">${CTABS2.map(([k,l])=>`<button class="tab${UI.cTab===k?' on':''}" data-act="cTab" data-k="${k}">${l}</button>`).join('')}</div>`+sub();
}
const addMin=(hhmm,min)=>{const[h,m]=String(hhmm||'09:00').split(':').map(Number);const t=h*60+m+min;return pad(Math.floor(t/60)%24)+':'+pad(t%60)};
function planTimes(p){let t=0;return(p.items||[]).map(it=>{const s=addMin(p.heure,t);t+=num(it.duree);return s})}
const VSTAT={attente:['En attente','b-encours'],accepte:['Accepté','b-done'],refuse:['Refusé','b-todo']};
function conflicts(p,a){
  if(!a.membreId)return'';const ind=S.indispos.find(i=>i.membreId===a.membreId&&p.date>=i.du&&p.date<=(i.au||i.du));if(ind)return'Indisponible'+(ind.motif?' ('+ind.motif+')':'');
  const other=S.plans.find(q=>q.date===p.date&&q.id!==p.id&&(q.equipe||[]).some(b=>b.membreId===a.membreId));if(other)return'Conflit : sert déjà à « '+other.titre+' »';
  if((p.equipe||[]).filter(b=>b.membreId===a.membreId).length>1)return'Conflit : 2 rôles dans ce culte';return'';
}
function vPlans(){
  if(UI.plan)return planEditor();
  const l=[...S.plans].sort((a,b)=>(b.date||'').localeCompare(a.date||''));const mods=cfg().planModeles||[];
  return`<div class="toolbar"><div class="muted">Ordre du culte, chants et équipe de service.</div><span class="sp"></span>${mods.length?`<select class="inp" data-act-change="fromModel"><option value="">Depuis un modèle…</option>${mods.map((m,i)=>`<option value="${i}">${esc(m.nom)}</option>`).join('')}</select>`:''}<button class="btn primary" data-act="newPlan">+ Nouveau plan</button></div>
  <div class="list">${l.length?l.map(p=>{const e=p.equipe||[],ok=e.filter(a=>a.statut==='accepte').length,cf=e.filter(a=>conflicts(p,a)).length;return`<div class="row" data-act="openPlan" data-id="${p.id}"><div class="grow"><div class="t">${esc(p.titre)}</div><div class="st">${fday(p.date)} · ${esc(p.heure||'')} · ${(p.items||[]).length} élément(s) · ${ok}/${e.length} bénévole(s) confirmé(s)</div></div>${cf?'<span class="badge b-todo">'+cf+' conflit(s)</span>':''}</div>`}).join(''):'<div class="empty">Aucun plan. Créez le plan du prochain culte.</div>'}</div>`;
}
function newPlan(model){const d=new Date();d.setDate(d.getDate()+((7-d.getDay())%7));
  return model?{...JSON.parse(JSON.stringify(model)),id:null,date:iso(d),equipe:(model.equipe||[]).map(a=>({role:a.role,membreId:a.membreId||'',statut:'attente'}))}:
  {titre:'Culte du dimanche',date:iso(d),heure:'09:00',items:[{type:'section',titre:'Avant le culte',duree:0},{type:'element',titre:'Accueil et prière',duree:10},{type:'section',titre:'Culte',duree:0},{type:'chant',titre:'',duree:5},{type:'chant',titre:'',duree:5},{type:'element',titre:'Lecture biblique',duree:5},{type:'element',titre:'Prédication',duree:45},{type:'element',titre:'Offrandes et dîmes',duree:10},{type:'element',titre:'Annonces',duree:5},{type:'element',titre:'Prière finale et bénédiction',duree:5}],equipe:(cfg().rolesServ||[]).flatMap(r=>Array.from({length:num(r.requis)||1},()=>({role:r.nom,membreId:'',statut:'attente'})))}}
function planEditor(){
  const p=UI.plan,T=planTimes(p),tot=(p.items||[]).reduce((s,i)=>s+num(i.duree),0);
  const songs=[...S.songs].sort((a,b)=>(a.titre||'').localeCompare(b.titre||'','fr'));
  const items=(p.items||[]).map((it,i)=>{const sec=it.type==='section';return`<div class="row" style="cursor:default;${sec?'background:#e6ecf6':''}"><span class="small" style="width:44px;color:var(--brand);font-weight:600">${sec?'':T[i]}</span><div class="grow" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">${sec?`<input class="inp" data-pk="${i}:titre" value="${esc(it.titre)}" style="flex:1;font-weight:700">`:it.type==='chant'?`<span title="Chant">♪</span><input class="inp" data-pk="${i}:titre" list="songlist" value="${esc(it.titre)}" placeholder="Titre du chant" style="flex:1;min-width:120px">`:`<input class="inp" data-pk="${i}:titre" value="${esc(it.titre)}" style="flex:1;min-width:120px">`}${sec?'':`<input class="inp" data-pk="${i}:note" value="${esc(it.note)}" placeholder="Note / responsable" style="flex:1;min-width:110px"><input class="inp" data-pk="${i}:duree" inputmode="numeric" value="${esc(it.duree)}" style="width:56px" title="minutes"><span class="small muted">min</span>`}</div><button class="btn sm" data-act="piUp" data-i="${i}" ${i?'':'disabled'}>↑</button><button class="btn sm" data-act="piDown" data-i="${i}">↓</button><button class="btn sm danger" data-act="piDel" data-i="${i}">✕</button></div>`}).join('');
  const team=(p.equipe||[]).map((a,i)=>{const m=memberById(a.membreId),cf=conflicts(p,a),st=VSTAT[a.statut]||VSTAT.attente;return`<div class="row" style="cursor:default"><div class="grow" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><input class="inp" data-pe="${i}:role" value="${esc(a.role)}" style="width:140px"><select class="inp" data-pe="${i}:membreId" style="flex:1;min-width:150px">${memberOptions().map(o=>opt(o,a.membreId)).join('')}</select>${cf?`<span class="badge b-todo">${esc(cf)}</span>`:''}</div><select class="inp" data-pe="${i}:statut">${Object.entries(VSTAT).map(([k,v])=>opt([k,v[0]],a.statut||'attente')).join('')}</select>${m&&waLink(m.telephone)?`<a class="btn sm wa" target="_blank" rel="noopener" href="${esc(waLink(m.telephone,`Bonjour ${m.prenom||m.nom}, vous servez au poste « ${a.role} » pour ${p.titre} le ${fday(p.date)} à ${p.heure}. Merci de confirmer (oui / non). — ${cfg().nom}`))}">Inviter</a>`:''}<button class="btn sm danger" data-act="peDel" data-i="${i}">✕</button></div>`}).join('');
  return`<datalist id="songlist">${songs.map(s=>`<option value="${esc(s.titre)}">${esc([s.tonalite,s.theme].filter(Boolean).join(' · '))}</option>`).join('')}</datalist>
  <div class="toolbar"><button class="btn sm" data-act="closePlan">‹ Plans</button><span class="sp"></span>${p.id?'<button class="btn sm danger" data-act="delPlan">Supprimer</button>':''}<button class="btn sm" data-act="planModel">Enregistrer comme modèle</button><button class="btn sm" data-act="planWa">Texte WhatsApp</button><button class="btn sm" data-act="pdfPlan">PDF</button><button class="btn sm primary" data-act="savePlan">Enregistrer</button></div>
  <div class="card" style="margin-bottom:12px"><div class="fgrid" style="padding:0;grid-template-columns:2fr 1fr 1fr"><div class="fld"><label>Culte</label><input data-pf="titre" value="${esc(p.titre)}"></div><div class="fld"><label>Date</label><input type="date" data-pf="date" value="${esc(p.date)}"></div><div class="fld"><label>Début</label><input type="time" data-pf="heure" value="${esc(p.heure)}"></div></div><div class="muted small" style="margin-top:8px">Durée totale : ${Math.floor(tot/60)} h ${pad(tot%60)} · fin prévue à ${addMin(p.heure,tot)}</div></div>
  <div class="card" style="margin-bottom:12px;padding:0"><div style="padding:12px 14px"><b>Ordre du culte</b></div><div class="list" style="border:0;border-radius:0">${items}</div><div style="padding:10px 14px;display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm" data-act="piAdd" data-k="element">+ Élément</button><button class="btn sm" data-act="piAdd" data-k="chant">+ Chant</button><button class="btn sm" data-act="piAdd" data-k="section">+ Section</button></div></div>
  <div class="card" style="padding:0"><div style="padding:12px 14px;display:flex;gap:8px;align-items:center"><b style="flex:1">Équipe de service</b><span class="small muted">${(p.equipe||[]).filter(a=>a.statut==='accepte').length} accepté · ${(p.equipe||[]).filter(a=>!a.statut||a.statut==='attente').length} en attente · ${(p.equipe||[]).filter(a=>a.statut==='refuse').length} refusé</span></div><div class="list" style="border:0;border-radius:0">${team||'<div class="empty">Aucun rôle.</div>'}</div><div style="padding:10px 14px"><button class="btn sm" data-act="peAdd">+ Rôle</button></div></div>`;
}
function planText(p){const T=planTimes(p);return`*${p.titre}* – ${fday(p.date)}\n`+(p.items||[]).map((it,i)=>it.type==='section'?`\n*${it.titre}*`:`${T[i]} ${it.type==='chant'?'♪ ':''}${it.titre}${it.note?' ('+it.note+')':''}`).join('\n')+((p.equipe||[]).length?'\n\n*Équipe*\n'+(p.equipe||[]).map(a=>`• ${a.role} : ${a.membreId?fullName(memberById(a.membreId)||{}):'à pourvoir'}`).join('\n'):'')}
function pdfPlan(){
  const p=UI.plan,T=planTimes(p),d=pdfDoc('Plan du culte',`${p.titre} · ${fday(p.date)}`);
  d.table([{t:'Heure',w:.12},{t:'Élément',w:.5},{t:'Note / responsable',w:.28},{t:'Durée',w:.1,a:'r'}],(p.items||[]).map((it,i)=>it.type==='section'?{bold:1,cells:['',it.titre,'','']}:[T[i],(it.type==='chant'?'Chant : ':'')+it.titre,it.note||'',num(it.duree)+' min']));
  if((p.equipe||[]).length){d.h2('Équipe de service');d.table([{t:'Rôle',w:.3},{t:'Bénévole',w:.45},{t:'Réponse',w:.25}],(p.equipe||[]).map(a=>[a.role,a.membreId?fullName(memberById(a.membreId)||{}):'À pourvoir',(VSTAT[a.statut]||VSTAT.attente)[0]]))}
  savePDF(`Plan ${p.titre} ${p.date}.pdf`,d.finish());
}
function vChants(){
  const q=UI.songQ.toLowerCase(),l=[...S.songs].filter(s=>!q||[s.titre,s.artiste,s.tonalite,s.theme].join(' ').toLowerCase().includes(q)).sort((a,b)=>(a.titre||'').localeCompare(b.titre||'','fr'));
  const used={};S.plans.forEach(p=>(p.items||[]).forEach(it=>{if(it.type==='chant'&&it.titre)used[it.titre.toLowerCase()]=(used[it.titre.toLowerCase()]||0)+1}));
  return`<div class="toolbar"><input class="inp" id="songQ" data-bind="songQ" value="${esc(UI.songQ)}" placeholder="Rechercher par titre, tonalité, thème…" style="flex:1"><button class="btn" data-act="exportSongs">Excel</button><button class="btn primary" data-act="newSong">+ Chant</button></div>
  <div class="list">${l.length?l.map(s=>`<div class="row" data-act="editSong" data-id="${s.id}"><div class="grow"><div class="t">${esc(s.titre)}${s.tonalite?` <span class="badge">${esc(s.tonalite)}</span>`:''}</div><div class="st">${esc([s.artiste,s.theme,s.langue,s.duree?s.duree+' min':''].filter(Boolean).join(' · '))}</div></div><span class="small muted">${used[(s.titre||'').toLowerCase()]?'chanté '+used[(s.titre||'').toLowerCase()]+' fois':''}</span></div>`).join(''):'<div class="empty">Aucun chant. Ajoutez le répertoire de la chorale.</div>'}</div>`;
}
function songForm(s){openForm({title:s?'Modifier le chant':'Nouveau chant',values:s||{langue:'Français'},fields:[{k:'titre',label:'Titre',req:1,full:1},{k:'artiste',label:'Auteur / artiste'},{k:'tonalite',label:'Tonalité',ph:'ex. Sol, Ré'},{k:'theme',label:'Thème',ph:'Louange, adoration, grâce…'},{k:'langue',label:'Langue',type:'select',options:['Français','Lingala','Swahili','Tshiluba','Kikongo','Anglais','Autre']},{k:'duree',label:'Durée (min)',type:'number'},{k:'lien',label:'Lien (vidéo, partition)',full:1},{k:'paroles',label:'Notes / premières lignes',type:'textarea',full:1}],onSave:d=>save('songs',{...(s||{}),...d}),onDelete:s?()=>removeDoc('songs',s.id):null})}
function vEquipe(){
  const roles=cfg().rolesServ||[],dims=[];const d=new Date(UI.eqMonth+'-01T00:00');while(d.getDay()!==0)d.setDate(d.getDate()+1);while(iso(d).startsWith(UI.eqMonth)){dims.push(iso(d));d.setDate(d.getDate()+7)}
  const cell=(r,ds)=>{const ps=S.plans.filter(p=>p.date===ds),as=ps.flatMap(p=>(p.equipe||[]).filter(a=>a.role===r.nom&&a.membreId));const need=num(r.requis)||1;const ok=as.filter(a=>a.statut==='accepte').length;return`<td style="text-align:center"><span class="badge ${as.length>=need?(ok>=need?'b-done':'b-encours'):'b-todo'}" title="${esc(as.map(a=>fullName(memberById(a.membreId)||{})).join(', '))}">${as.length}/${need}</span></td>`};
  const ind=[...S.indispos].sort((a,b)=>(a.du||'').localeCompare(b.du||'')).filter(i=>(i.au||i.du)>=today());
  return`<div class="card" style="margin-bottom:12px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><h2 style="margin:0;flex:1">Rôles de service</h2><button class="btn sm primary" data-act="editRolesServ">Modifier les rôles</button></div>${roles.length?roles.map(r=>`<span class="chip" style="font-size:12.5px;padding:4px 9px">${esc(r.nom)} · ${num(r.requis)||1} requis${r.responsable&&memberById(r.responsable)?' · resp. '+esc(fullName(memberById(r.responsable))):''}</span>`).join(''):'<div class="muted small">Aucun rôle. Exemples : Accueil, Protocole, Sonorisation, Chorale, Intercession, Offrandes, Moniteur.</div>'}</div>
  <div class="card" style="margin-bottom:12px"><div class="toolbar" style="margin-bottom:8px"><h2 style="margin:0;flex:1">Grille du mois</h2><input type="month" class="inp" data-bind="eqMonth" value="${esc(UI.eqMonth)}"></div>${roles.length&&dims.length?`<div style="overflow:auto"><table class="t"><tr><th>Rôle</th>${dims.map(x=>`<th style="text-align:center">${parse(x).getDate()}</th>`).join('')}</tr>${roles.map(r=>`<tr><td>${esc(r.nom)}</td>${dims.map(ds=>cell(r,ds)).join('')}</tr>`).join('')}</table></div><div class="muted small" style="margin-top:6px">Affectés / requis dans les plans de culte des dimanches. Vert = tous ont accepté.</div>`:'<div class="muted small">Définissez des rôles et créez des plans de culte.</div>'}</div>
  <div class="card"><div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><h2 style="margin:0;flex:1">Indisponibilités</h2><button class="btn sm" data-act="newIndispo">+ Indisponibilité</button></div><div class="list">${ind.length?ind.map(i=>`<div class="row" data-act="editIndispo" data-id="${i.id}"><div class="grow"><div class="t">${esc(fullName(memberById(i.membreId)||{}))}</div><div class="st">Du ${fdate(i.du)} au ${fdate(i.au||i.du)}${i.motif?' · '+esc(i.motif):''}</div></div><span class="badge b-todo">Indisponible</span></div>`).join(''):'<div class="empty">Aucune indisponibilité à venir.</div>'}</div></div>`;
}
function rolesServForm(){const r=cfg().rolesServ||[];openForm({title:'Rôles de service',values:{t:r.map(x=>`${x.nom};${num(x.requis)||1}`).join('\n')},fields:[{k:'t',label:'Un rôle par ligne : Nom;nombre requis',type:'textarea',rows:8,full:1}],onSave:d=>saveConfig({rolesServ:d.t.split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{const[n,q]=l.split(/[;,]/);return{nom:n.trim(),requis:num(q)||1}})})})}
function indispoForm(i){openForm({title:'Indisponibilité',values:i||{du:today()},fields:[{k:'membreId',label:'Bénévole',type:'select',options:memberOptions(),full:1},{k:'du',label:'Du',type:'date',req:1},{k:'au',label:'Au',type:'date'},{k:'motif',label:'Motif',full:1}],onSave:d=>d.membreId?save('indispos',{...(i||{}),...d}):(toast('Choisissez un bénévole',1),false),onDelete:i?()=>removeDoc('indispos',i.id):null})}

/* ---------- dons : lots, campagnes, relevés, analyse ---------- */
const DTABS=[['lots','Lots & enveloppes'],['campagnes','Projets & promesses'],['releves','Relevés'],['analyse','Analyse']];
function vDons(){
  const sub={lots:vLots,campagnes:vProjets,releves:vReleves,analyse:vAnalyseDons}[UI.dTab]||vLots;
  return`<div class="tabs" style="margin-bottom:12px">${DTABS.map(([k,l])=>`<button class="tab${UI.dTab===k?' on':''}" data-act="dTab" data-k="${k}" style="font-size:12px">${l}</button>`).join('')}</div>`+sub();
}
const lotTot=l=>sumAll(sumBy(l.lignes||[],()=>'x'));
function vLots(){
  if(UI.lot)return lotEditor();
  const l=[...S.lots].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  return`<div class="toolbar"><div class="muted small">Saisissez les enveloppes de la collecte, vérifiez, puis clôturez : les recettes sont enregistrées en une fois dans la comptabilité.</div><span class="sp"></span><button class="btn primary" data-act="newLot">+ Nouveau lot</button></div>
  <div class="list">${l.length?l.map(x=>{const t=lotTot(x);return`<div class="row" data-act="openLot" data-id="${x.id}"><div class="grow"><div class="t">Lot n° ${esc(x.numero)} · ${esc(x.culte||'')}</div><div class="st">${fday(x.date)} · ${(x.lignes||[]).length} ligne(s) · ${money(t.CDF,'CDF')} · ${money(t.USD,'USD')}</div></div><span class="badge ${x.statut==='cloture'?'b-done':'b-encours'}">${x.statut==='cloture'?'Clôturé':'Ouvert'}</span></div>`}).join(''):'<div class="empty">Aucun lot.</div>'}</div>`;
}
function lotEditor(){
  const L=UI.lot,c=cfg(),closed=L.statut==='cloture',t=lotTot(L),dis=closed?'disabled':'';
  const rows=(L.lignes||[]).map((r,i)=>`<div class="row" style="cursor:default;flex-wrap:wrap"><input class="inp" data-lk="${i}:enveloppe" ${dis} value="${esc(r.enveloppe)}" placeholder="Env." style="width:62px"><select class="inp" data-lk="${i}:membreId" ${dis} style="flex:1;min-width:140px">${[['','Anonyme / non-membre']].concat(sortedMembers().map(m=>[m.id,fullName(m)])).map(o=>opt(o,r.membreId)).join('')}</select><select class="inp" data-lk="${i}:categorie" ${dis}>${c.catEntrees.map(x=>opt(x,r.categorie)).join('')}</select><select class="inp" data-lk="${i}:fonds" ${dis}>${c.fonds.map(x=>opt(x,r.fonds)).join('')}</select><select class="inp" data-lk="${i}:mode" ${dis}>${['Espèces','Mobile money','Virement','Chèque','Nature'].map(x=>opt(x,r.mode)).join('')}</select><input class="inp" data-lk="${i}:montant" ${dis} inputmode="decimal" value="${esc(r.montant)}" placeholder="Montant" style="width:100px"><select class="inp" data-lk="${i}:devise" ${dis}>${opt(['CDF','FC'],r.devise)}${opt(['USD','$'],r.devise)}</select>${closed?'':`<button class="btn sm danger" data-act="lkDel" data-i="${i}">✕</button>`}</div>`).join('');
  return`<div class="toolbar"><button class="btn sm" data-act="closeLot">‹ Lots</button><span class="sp"></span>${!closed&&L.id?'<button class="btn sm danger" data-act="delLot">Supprimer</button>':''}${closed?'':'<button class="btn sm" data-act="saveLot">Enregistrer</button><button class="btn sm primary" data-act="clotureLot">Clôturer et enregistrer le dépôt</button>'}</div>
  ${closed?`<div class="banner show info">Lot clôturé le ${fdate(L.dateCloture)} : ${(L.lignes||[]).length} recette(s) enregistrée(s) dans la comptabilité (compte « ${esc(L.compte)} »).</div>`:''}
  <div class="card" style="margin-bottom:12px"><div class="fgrid" style="padding:0;grid-template-columns:repeat(auto-fill,minmax(150px,1fr))"><div class="fld"><label>N° du lot</label><input data-lf="numero" ${dis} value="${esc(L.numero)}"></div><div class="fld"><label>Date</label><input type="date" data-lf="date" ${dis} value="${esc(L.date)}"></div><div class="fld"><label>Culte</label><select data-lf="culte" ${dis}>${progTitles().map(x=>opt(x,L.culte)).join('')}</select></div><div class="fld"><label>Déposé sur le compte</label><select data-lf="compte" ${dis}>${c.comptes.map(x=>opt(x,L.compte)).join('')}</select></div><div class="fld"><label>Compté par</label><input data-lf="comptePar" ${dis} value="${esc(L.comptePar)}"></div></div></div>
  <div class="grid3" style="margin-bottom:12px"><div class="card kpi"><div class="l">Total FC</div><div class="v" style="font-size:18px">${money(t.CDF,'CDF')}</div></div><div class="card kpi"><div class="l">Total $</div><div class="v" style="font-size:18px">${money(t.USD,'USD')}</div></div><div class="card kpi"><div class="l">Enveloppes</div><div class="v">${(L.lignes||[]).length}</div></div></div>
  <div class="list">${rows||'<div class="empty">Ajoutez les enveloppes et l\'offrande générale.</div>'}</div>${closed?'':'<div style="margin-top:8px;display:flex;gap:8px"><button class="btn sm" data-act="lkAdd">+ Ligne</button><button class="btn sm" data-act="lkAdd" data-k="offrande">+ Offrande générale (anonyme)</button></div>'}`;
}
async function clotureLot(){
  const L=UI.lot,lines=(L.lignes||[]).filter(r=>num(r.montant)>0);if(!lines.length){toast('Aucun montant',1);return}
  confirmBox(`Clôturer le lot n° ${L.numero} et enregistrer ${lines.length} recette(s) dans la comptabilité ? Le lot ne pourra plus être modifié.`,async()=>{
    for(const r of lines){if(!await save('transactions',{type:'entree',date:L.date,numBon:nextBon('entree'),categorie:r.categorie,fonds:r.fonds,compte:L.compte,montant:num(r.montant),devise:r.devise,membreId:r.membreId||'',description:`Lot n° ${L.numero}${r.enveloppe?' · env. '+r.enveloppe:''} · ${r.mode}`,lotId:L.id||'',campagneId:r.campagneId||''}))return false;await new Promise(z=>setTimeout(z,30))}
    const id=L.id||('lot'+Date.now());const ok=await save('lots',{...L,id,lignes:lines,statut:'cloture',dateCloture:today()});if(ok){UI.lot=null;render()}return ok},{btn:'Clôturer',done:'Dépôt enregistré'});
}
const catOk=c=>c.categorie&&!/d[îi]me|offrande|action de gr/i.test(c.categorie);
function campReal(c,mid){return S.transactions.filter(t=>isIn(t)&&(t.campagneId===c.id||(catOk(c)&&!t.campagneId&&t.categorie===c.categorie&&(!c.debut||t.date>=c.debut)&&(!c.dateCloture||t.date<=c.dateCloture)))&&(!mid||t.membreId===mid)).reduce((s,t)=>s+conv(t,c.devise||'USD'),0)}
function vCampagnes(){
  const l=[...S.campagnes].sort((a,b)=>(b.debut||'').localeCompare(a.debut||''));
  return`<div class="toolbar"><div class="muted small">Ex. achat de la parcelle, construction, mission.</div><span class="sp"></span><button class="btn primary" data-act="newCamp">+ Campagne</button></div>
  ${l.length?l.map(c=>{const P=c.promesses||{},prom=Object.values(P).reduce((s,v)=>s+num(v),0),real=campReal(c),dev=c.devise||'USD',obj=num(c.objectif)||prom;
   const donors=Object.keys(P).map(id=>({m:memberById(id),p:num(P[id]),r:campReal(c,id)})).filter(x=>x.m).sort((a,b)=>b.p-a.p);
   return`<div class="card" style="margin-bottom:12px"><div style="display:flex;gap:8px;align-items:center"><h2 style="margin:0;flex:1">${esc(c.nom)}</h2><span class="badge b-done">${c.fin&&c.fin<today()?'Terminée':'Active'}</span><button class="btn sm" data-act="editCamp" data-id="${c.id}">Modifier</button><button class="btn sm" data-act="newPromesse" data-id="${c.id}">+ Promesse</button></div>
   <div style="display:flex;justify-content:space-between;margin:10px 0 4px"><b>${money(real,dev)} reçus</b><span class="muted">objectif ${money(obj,dev)} · ${money(prom,dev)} promis</span></div>${bar(obj?real/obj*100:0)}
   <div class="muted small" style="margin:6px 0 8px">Comptent : les recettes de catégorie « ${esc(c.categorie||'—')} »${c.debut?' depuis le '+fdate(c.debut):''}, converties en ${dev==='USD'?'$':'FC'}.</div>
   ${donors.length?`<table class="t">${donors.map(x=>`<tr><td>${esc(fullName(x.m))}</td><td style="width:35%">${bar(x.p?x.r/x.p*100:0)}</td><td class="n">${money(x.r,dev)} / ${money(x.p,dev)}</td><td style="width:1%">${x.r<x.p&&waLink(x.m.telephone)?`<a class="btn sm wa" target="_blank" rel="noopener" href="${esc(waLink(x.m.telephone,`Bonjour ${x.m.prenom||x.m.nom}, merci pour votre engagement à la campagne « ${c.nom} ». À ce jour : ${money(x.r,dev)} versés sur ${money(x.p,dev)} promis. Que Dieu vous bénisse ! — ${cfg().nom}`))}">Relevé</a>`:''}</td></tr>`).join('')}</table>`:'<div class="muted small">Aucune promesse enregistrée.</div>'}</div>`}).join(''):'<div class="card empty">Aucune campagne.</div>'}`;
}
function campForm(c){const cf=cfg();openForm({title:c?'Modifier le projet':'Nouveau projet',values:c||{devise:'USD',debut:today(),fonds:cf.fonds.find(x=>/parcelle/i.test(x))||cf.fonds[0],categorie:cf.catEntrees.find(x=>/parcelle/i.test(x))||cf.catEntrees[0]},fields:[{k:'nom',label:'Nom',req:1,full:1},{k:'objectif',label:'Objectif',type:'number'},{k:'devise',label:'Devise',type:'select',options:[['USD','Dollars ($)'],['CDF','Francs congolais']]},{k:'categorie',label:'Catégorie de recette',type:'select',options:cf.catEntrees},{k:'fonds',label:'Fonds (caisse du projet)',type:'select',options:cf.fonds},{k:'debut',label:'Début',type:'date'},{k:'fin',label:'Fin',type:'date'},{k:'description',label:'Description',type:'textarea',full:1}],onSave:d=>save('campagnes',{...(c||{}),...d}),onDelete:c?()=>removeDoc('campagnes',c.id):null})}
function promesseForm(c){openForm({title:'Promesse – '+c.nom,values:{},fields:[{k:'membreId',label:'Membre',type:'select',options:memberOptions(),full:1},{k:'montant',label:'Montant promis ('+(c.devise==='CDF'?'FC':'$')+')',type:'number',req:1}],onSave:d=>d.membreId?save('campagnes',{...c,promesses:{...(c.promesses||{}),[d.membreId]:num(d.montant)}}):(toast('Choisissez un membre',1),false)})}
function vReleves(){
  const y=UI.relYear,tx=S.transactions.filter(t=>isIn(t)&&t.membreId&&(t.date||'').startsWith(y));const by=sumBy(tx,t=>t.membreId);
  const l=Object.entries(by).map(([id,v])=>({m:memberById(id),v})).filter(x=>x.m).sort((a,b)=>fullName(a.m).localeCompare(fullName(b.m),'fr'));
  const years=[];for(let k=new Date().getFullYear();k>=new Date().getFullYear()-3;k--)years.push(String(k));
  return`<div class="toolbar"><select class="inp" data-bind="relYear">${years.map(x=>opt(x,y)).join('')}</select><span class="muted small">${l.length} donateur(s)</span><span class="sp"></span>${l.length?'<button class="btn primary" data-act="pdfRelevesAll">PDF de tous les relevés</button>':''}</div>
  <div class="list">${l.length?l.map(x=>`<div class="row" style="cursor:default">${avatar(x.m)}<div class="grow"><div class="t">${esc(fullName(x.m))}</div><div class="st">${money(x.v.CDF,'CDF')} · ${money(x.v.USD,'USD')}</div></div><button class="btn sm" data-act="pdfAttY" data-id="${x.m.id}">PDF</button>${waLink(x.m.telephone)?`<a class="btn sm wa" target="_blank" rel="noopener" href="${esc(waLink(x.m.telephone,`Bonjour ${x.m.prenom||x.m.nom}, voici le relevé de vos contributions ${y} à l'${cfg().nom} : ${money(x.v.CDF,'CDF')} et ${money(x.v.USD,'USD')}. Merci pour votre fidélité, que Dieu vous bénisse !`))}">WhatsApp</a>`:''}</div>`).join(''):'<div class="empty">Aucune contribution liée à un membre pour cette année.</div>'}</div>`;
}
function attestationPages(d,m,y,first){
  const c=cfg(),tx=S.transactions.filter(t=>t.membreId===m.id&&isIn(t)&&(t.date||'').startsWith(y)).sort((a,b)=>(a.date||'').localeCompare(b.date||'')),t=sumAll(sumBy(tx,()=>'x'));
  if(!first)d.newPage();d.y+=6;
  d.para(`Nous soussignés, responsables de l'${c.nom}${c.ville?' à '+c.ville:''}, attestons que ${m.sexe==='F'?'Madame':m.sexe==='M'?'Monsieur':'M./Mme'} ${fullName(m)} a contribué à l'œuvre de Dieu au cours de l'année ${y}, selon le détail ci-dessous.`,10.5);
  d.table([{t:'Date',w:.16},{t:'N° bon',w:.14},{t:'Nature',w:.4},{t:'Montant',w:.3,a:'r'}],tx.map(x=>[fdate(x.date),x.numBon,x.categorie,money(x.montant,x.devise)]).concat(tx.length?[{bold:1,cells:['Total FC','','',money(t.CDF,'CDF')]},{bold:1,cells:['Total $','','',money(t.USD,'USD')]}]:[]),{empty:'Aucune contribution.'});
  d.text(`Fait à ${c.ville||'……………'}, le ${new Date().toLocaleDateString(LOC(),{day:'numeric',month:'long',year:'numeric'})}`,d.W-d.M,d.y+10,{size:10,align:'right'});d.y+=20;d.signatures(['Le Trésorier','Le Pasteur principal']);
}
function pdfRelevesAll(){const y=UI.relYear,ids=[...new Set(S.transactions.filter(t=>isIn(t)&&t.membreId&&(t.date||'').startsWith(y)).map(t=>t.membreId))].map(memberById).filter(Boolean).sort((a,b)=>fullName(a).localeCompare(fullName(b),'fr'));
  const d=pdfDoc('Relevés de contributions','Année '+y);ids.forEach((m,i)=>attestationPages(d,m,y,i===0));savePDF(`Releves ${cfg().sigle||'EMT'} ${y}.pdf`,d.finish())}
function vAnalyseDons(){
  const ms=lastMonths(8),dons=S.transactions.filter(isIn),vals=ms.map(m=>Math.round(dons.filter(t=>(t.date||'').startsWith(m)).reduce((s,t)=>s+conv(t,'USD'),0)));
  const y=String(new Date().getFullYear()),actifs=S.members.filter(m=>!m.statut||m.statut==='Membre actif'),donors=new Set(dons.filter(t=>(t.date||'').startsWith(y)&&t.membreId).map(t=>t.membreId));
  const part=actifs.length?Math.round(actifs.filter(m=>donors.has(m.id)).length/actifs.length*100):0;
  const byCat=sumBy(dons.filter(t=>(t.date||'').startsWith(y)),t=>t.categorie||'—');
  return`<div class="grid3"><div class="card kpi"><div class="l">Participation ${y}</div><div class="v">${part} %</div><div class="s">des membres actifs ont donné</div></div><div class="card kpi"><div class="l">Donateurs identifiés</div><div class="v">${donors.size}</div></div><div class="card kpi"><div class="l">Moyenne mensuelle</div><div class="v" style="font-size:18px">${money(vals.reduce((a,b)=>a+b,0)/vals.length,'USD')}</div><div class="s">équiv. $, 8 derniers mois</div></div></div>
  <div class="card sec"><h2>Dons par mois (équivalent $)</h2>${barChart(ms.map(mLab),vals,{fmt:v=>v.toLocaleString('fr-FR')})}</div>
  <div class="card sec"><h2>Par catégorie – ${y}</h2>${Object.keys(byCat).length?`<table class="t"><tr><th>Catégorie</th><th class="n">FC</th><th class="n">$</th></tr>${Object.entries(byCat).map(([k,v])=>`<tr><td>${esc(k)}</td><td class="n">${money(v.CDF,'CDF')}</td><td class="n">${money(v.USD,'USD')}</td></tr>`).join('')}</table>`:'<div class="muted small">Aucune recette.</div>'}</div>`;
}

/* ---------- rapports : croissance + assistant IA ---------- */
const RTABS=[['mensuel','Rapport mensuel'],['croissance','Croissance'],['ia','Assistant IA']];
function vRapports(){
  const sub={mensuel:vRapMensuel,croissance:vCroissance,ia:vAssistant}[UI.rTab]||vRapMensuel;
  return`<div class="tabs" style="margin-bottom:14px">${RTABS.map(([k,l])=>`<button class="tab${UI.rTab===k?' on':''}" data-act="rTab" data-k="${k}">${l}</button>`).join('')}</div>`+sub();
}
function vCroissance(){
  const n=+UI.crN||12,ms=lastMonths(n),F=UI.crF,joined=m=>(m.dateAdhesion||String(m.createdAt||'')).slice(0,7);
  const M=S.members.filter(m=>(!F.sexe||m.sexe===F.sexe)&&(!F.groupe||(m.groupes||[]).includes(F.groupe))&&(!F.statut||(m.statut||'Membre actif')===F.statut||isGone(m)));
  const dep=m=>(m.dateDepart||'').slice(0,7);
  const rows=ms.map((mm,i)=>{const debut=M.filter(m=>joined(m)&&joined(m)<mm&&!(dep(m)&&dep(m)<mm)).length,nouv=M.filter(m=>joined(m)===mm).length,parts=M.filter(m=>dep(m)===mm).length,fin=debut+nouv-parts;
    const a=S.attendance.filter(x=>(x.date||'').startsWith(mm)),pres=a.length?Math.round(a.reduce((s,x)=>s+attTotal(x),0)/a.length):0;
    const bap=M.filter(m=>(m.dateBapteme||'').startsWith(mm)).length;return{mm,debut,nouv,parts,fin,pres,bap,var:debut?Math.round((nouv-parts)/debut*1000)/10:null}});
  const cnt=f=>{const o={};M.forEach(m=>{const k=f(m);o[k]=(o[k]||0)+1});return o};
  const ages=cnt(m=>{const a=ageOf(m);return a===null?'Inconnu':a<13?'0–12':a<18?'13–17':a<30?'18–29':a<45?'30–44':a<60?'45–59':'60+'});
  const tbl=o=>{const T=Object.values(o).reduce((a,b)=>a+b,0)||1;return`<table class="t">${Object.entries(o).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<tr><td>${esc(k)}</td><td style="width:45%">${bar(v/T*100)}</td><td class="n">${v}</td></tr>`).join('')}</table>`};
  const totNew=rows.reduce((s,r)=>s+r.nouv,0),totDep=rows.reduce((s,r)=>s+r.parts,0),motifs={};M.filter(m=>dep(m)&&dep(m)>=ms[0]).forEach(m=>{const k=m.motifDepart||'Non précisé';motifs[k]=(motifs[k]||0)+1}),first=rows[0],last=rows[rows.length-1],evol=first&&first.debut?Math.round((last.fin-first.debut)/first.debut*100):null;
  const sel=(k,o)=>`<select class="inp" data-crf="${k}">${o.map(x=>opt(x,F[k])).join('')}</select>`;
  return`<div class="card" style="margin-bottom:12px"><div class="toolbar" style="margin:0"><b>Filtres</b><select class="inp" data-bind="crN">${[['3','3 derniers mois'],['6','6 derniers mois'],['12','12 derniers mois'],['24','24 derniers mois']].map(o=>opt(o,String(n))).join('')}</select>
   ${sel('statut',[['','Tous les statuts']].concat(STATUTS))}${sel('sexe',[['','Hommes et femmes'],['M','Hommes'],['F','Femmes']])}${sel('groupe',[['','Tous les groupes']].concat(S.groups.map(g=>[g.id,g.nom])))}<span class="sp"></span><button class="btn sm" data-act="crExport">Excel</button></div></div>
  <div class="grid4"><div class="card kpi"><div class="l">Personnes (filtre)</div><div class="v">${M.length}</div></div><div class="card kpi"><div class="l">Nouveaux sur la période</div><div class="v">${totNew}</div><div class="s">${n} mois</div></div><div class="card kpi"><div class="l">Évolution de l'effectif</div><div class="v ${evol>0?'pos':evol<0?'neg':''}">${evol===null?'—':(evol>0?'+':'')+evol+' %'}</div><div class="s">${first?first.debut:0} → ${last?last.fin:0}</div></div><div class="card kpi"><div class="l">Départs sur la période</div><div class="v ${totDep?'neg':''}">${totDep}</div><div class="s">solde : ${totNew-totDep>=0?'+':''}${totNew-totDep}</div></div></div>
  <div class="grid2 sec"><div class="card"><h2>Effectif en fin de mois</h2>${barChart(ms.map(mLab),rows.map(r=>r.fin))}</div><div class="card"><h2>Nouveaux par mois</h2>${barChart(ms.map(mLab),rows.map(r=>r.nouv))}</div></div>
  <div class="card sec"><h2>Évolution mois par mois</h2><div style="overflow:auto"><table class="t"><tr><th>Mois</th><th class="n">Début</th><th class="n">Nouveaux</th><th class="n">Départs</th><th class="n">Fin</th><th class="n">Croissance</th><th class="n">Baptêmes</th><th class="n">Présence moy.</th></tr>${rows.slice().reverse().map(r=>`<tr><td style="text-transform:capitalize">${monthLabel(r.mm)}</td><td class="n">${r.debut}</td><td class="n">${r.nouv?'<b class="pos">+'+r.nouv+'</b>':'0'}</td><td class="n">${r.parts?'<b class="neg">−'+r.parts+'</b>':'0'}</td><td class="n"><b>${r.fin}</b></td><td class="n">${r.var===null?'—':r.var+' %'}</td><td class="n">${r.bap}</td><td class="n">${r.pres||'—'}</td></tr>`).join('')}</table></div><div class="muted small" style="margin-top:6px">Les personnes sont comptées selon leur date d'arrivée/adhésion (ou la date de création de la fiche). Pour voir la liste nominative d'un mois : Membres → Filtres → « Arrivé(e) du / au ».</div></div>
  ${totDep?`<div class="card sec"><h2>Motifs de départ (${n} derniers mois)</h2>${tbl(motifs)}<div class="muted small" style="margin-top:6px">Liste nominative : Membres → statut « Parti(e) ».</div></div>`:''}
  <div class="grid2 sec"><div class="card"><h2>Présence moyenne par mois</h2>${barChart(ms.map(mLab),rows.map(r=>r.pres))}</div><div class="card"><h2>Par statut</h2>${M.length?tbl(cnt(m=>m.statut||'Membre actif')):'—'}</div></div>
  <div class="grid2 sec"><div class="card"><h2>Par tranche d'âge</h2>${M.length?tbl(ages):'—'}</div><div class="card"><h2>Par sexe</h2>${M.length?tbl(cnt(m=>m.sexe==='M'?'Hommes':m.sexe==='F'?'Femmes':'Non précisé')):'—'}</div></div>`;
}
function churchSummary(){
  const c=cfg(),y=String(new Date().getFullYear()),M=S.members;
  const cnt=f=>{const o={};M.forEach(m=>{const k=f(m);o[k]=(o[k]||0)+1});return o};
  const ms=lastMonths(12);
  return JSON.stringify({eglise:c.nom,date:today(),tauxUSD_CDF:c.taux,membres:{total:M.length,parStatut:cnt(m=>m.statut||'Membre actif'),parSexe:cnt(m=>m.sexe||'?'),parFonction:cnt(m=>m.fonction||'Fidèle'),nouveauxParMois:Object.fromEntries(ms.map(mm=>[mm,M.filter(m=>(m.dateAdhesion||'').startsWith(mm)).length]))},
   groupes:S.groups.map(g=>({nom:g.nom,membres:M.filter(m=>(m.groupes||[]).includes(g.id)).length})),
   presences:[...S.attendance].sort((a,b)=>(a.date||'').localeCompare(b.date||'')).slice(-30).map(a=>({date:a.date,culte:a.culte,h:num(a.hommes),f:num(a.femmes),e:num(a.enfants),visiteurs:num(a.visiteurs)})),
   finances:Object.fromEntries(ms.map(mm=>{const t=S.transactions.filter(x=>(x.date||'').startsWith(mm));return[mm,{recettes:sumBy(t.filter(isIn),x=>x.categorie),depenses:sumBy(t.filter(isOut),x=>x.categorie)}]})),
   soldesComptes:accountBalances(),suivis:{enAttente:S.followups.filter(f=>f.statut!=='Terminé').length,termines:S.followups.filter(f=>f.statut==='Terminé').length},
   evenementsAVenir:S.events.filter(e=>(e.date||'')>=today()).slice(0,15).map(e=>({titre:e.titre,date:e.date}))});
}
function vAssistant(){
  const msgs=UI.aiChat.map(m=>`<div class="bub ${m.role==='user'?'me':''}">${m.role==='user'?'':'<div class="bn">✨ Données de l\'église</div>'}<div>${esc(m.content).replace(/\n/g,'<br>')}</div></div>`).join('');
  const sugg=['Comment la présence du dimanche a-t-elle évolué ces derniers mois ?','Résume les recettes par catégorie ce trimestre.','Combien de nouveaux venus cette année et quels groupes grandissent ?','Quelles dépenses ont le plus augmenté ?'];
  return`<div class="card" style="padding:0;display:flex;flex-direction:column;height:min(64vh,580px)"><div style="padding:10px 14px;border-bottom:1px solid var(--bd);display:flex;gap:6px;align-items:center"><b style="flex:1">Assistant IA</b><span class="badge">Lecture seule</span>${UI.aiChat.length?'<button class="btn sm" data-act="aiReset">Effacer</button>':''}</div>
  <div id="chatBox" style="flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:6px">${msgs||`<div class="muted small" style="margin-bottom:8px">Posez une question sur les membres, la présence, les finances ou les suivis. L'assistant lit un résumé des données de l'application ; il ne peut rien modifier.</div>${sugg.map(s=>`<button class="btn sm" style="text-align:left;white-space:normal" data-act="aiSugg" data-k="${esc(s)}">${esc(s)}</button>`).join('')}`}${UI.aiBusy2?'<div class="bub"><div class="bn">✨</div><div id="aiLive">Réflexion…</div></div>':''}</div>
  <form id="aiChatForm" style="display:flex;gap:8px;padding:10px;border-top:1px solid var(--bd)"><input id="aiIn" class="inp" data-bind="aiDraft" value="${esc(UI.aiDraft)}" placeholder="Votre question…" style="flex:1" autocomplete="off"><button class="btn primary" ${UI.aiBusy2?'disabled':''}>Envoyer</button></form></div>`;
}
async function aiAsk(q){
  q=(q||UI.aiDraft).trim();if(!q||UI.aiBusy2)return;let sample=null;try{sample=window.claude?await window.claude.use('sample'):null}catch(e){}
  UI.aiChat.push({role:'user',content:q});UI.aiDraft='';
  if(!sample){UI.aiChat.push({role:'assistant',content:"L'assistant IA n'est pas disponible dans cette vue."});render();return}
  UI.aiBusy2=1;render();
  const rules={role:'user',content:`Tu es l'assistant de gestion de l'église. Réponds en français, brièvement et précisément, uniquement à partir de ces données (JSON). Montants : CDF = francs congolais, USD = dollars. Si une donnée manque, dis-le. Pas de markdown lourd.\n\nDONNÉES:\n${churchSummary().slice(0,120000)}`};
  try{const {text}=await sample([rules,...UI.aiChat.slice(-8)],{cache:false,onText:({text})=>{const el=document.getElementById('aiLive');if(el)el.textContent=text}});UI.aiChat.push({role:'assistant',content:text})}
  catch(e){UI.aiChat.push({role:'assistant',content:e&&e.code==='not_granted'?"Accès à l'IA refusé.":e&&e.code==='rate_limited'?'Trop de demandes, réessayez plus tard.':(e&&e.text)||"Erreur, réessayez."})}
  UI.aiBusy2=0;render();
}

/* ---------- administration ---------- */
const ECRANS=[['dashboard','Tableau de bord'],['membres','Membres'],['groupes','Groupes'],['communication','Communication'],['culte','Culte & bénévoles'],['calendrier','Calendrier'],['presences','Présences'],['suivis','Suivis'],['dons','Dons'],['projets','Projets & collectes'],['finances','Finances'],['rapports','Rapports'],['evenements','Événements & salles'],['rdv','Rendez-vous'],['formulaires','Formulaires & votes'],['mediatheque','Médiathèque'],['album','Album photo'],['inventaire','Inventaire']];
function customRoleForm(r){openForm({title:r?'Modifier le rôle':'Nouveau rôle',values:r||{ecrans:['dashboard','calendrier']},fields:[{k:'nom',label:'Nom du rôle',req:1,full:1},{k:'ecrans',label:'Écrans visibles',type:'multi',full:1,options:ECRANS},{k:'ro',label:'Consultation seulement (aucune modification)',type:'checkbox',full:1},{k:'finLim',label:'Finances limitées : seulement les offrandes ordinaires (caisse générale) et ses dépenses — pas les dîmes, projets, parcelle ni les autres fonds',type:'checkbox',full:1}],
  onSave:d=>{const l=(cfg().customRoles||[]).filter(x=>!r||x.id!==r.id);l.push({id:r?r.id:'c'+Date.now(),...d});return saveConfig({customRoles:l})},onDelete:r?()=>saveConfig({customRoles:(cfg().customRoles||[]).filter(x=>x.id!==r.id)}):null})}
function adminCards(){
  const cr=cfg().customRoles||[],J=[...S.journal].sort((a,b)=>String(b.at).localeCompare(String(a.at))).slice(0,40);
  return`<div class="card sec"><div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><h2 style="margin:0;flex:1">Rôles personnalisés</h2><button class="btn primary sm" data-act="newCRole">+ Rôle</button></div>${cr.length?`<div class="list">${cr.map(r=>`<div class="row" data-act="editCRole" data-id="${r.id}"><div class="grow"><div class="t">${esc(r.nom)}${r.ro?' <span class="badge">lecture seule</span>':''}</div><div class="st">${(r.ecrans||[]).map(k=>(ECRANS.find(e=>e[0]===k)||[,k])[1]).join(', ')}</div></div></div>`).join('')}</div>`:'<div class="muted small">Ex. « Responsable chorale » : Culte & bénévoles + Calendrier. Les rôles créés apparaissent dans la liste des utilisateurs.</div>'}</div>
  <div class="card sec"><h2>Sauvegarde des données</h2><div class="muted small" style="margin-bottom:10px">Téléchargez régulièrement une copie complète (fichier .json). Elle permet de tout restaurer en cas de problème.</div><button class="btn" data-act="backup">Télécharger la sauvegarde</button> <label class="btn" style="display:inline-block">Restaurer…<input type="file" id="restoreIn" accept=".json" style="display:none"></label>${(()=>{const c=cfg(),f=d=>d?new Date(d).toLocaleDateString(LOC(),{dateStyle:'medium'}):'jamais';return`<div class="muted small" style="margin-top:10px">Dernière sauvegarde téléchargée : <b>${f(c.lastBackup)}</b>${window.EMT_BACKUP?` · dernière sauvegarde automatique : <b>${f(c.lastAutoBackup)}</b>`:''}</div>`+(window.EMT_BACKUP?`<div style="margin-top:12px"><b>Sauvegardes automatiques</b> <span class="muted small">(une par semaine, les 8 dernières sont gardées dans votre espace privé Supabase)</span><div id="autoBk" class="list" style="margin-top:6px"><div class="muted small">Chargement…</div></div></div>`:'')})()}</div>
  <div class="card sec"><h2>Journal d'activité</h2>${J.length?`<div class="list">${J.map(j=>`<div class="row" style="cursor:default;padding:8px 12px"><div class="grow"><div class="small"><b>${esc(j.quoi)}</b> ${esc({create:'ajouté',update:'modifié',delete:'supprimé',import:'import'}[j.action]||j.action)} : ${esc(j.label)}</div><div class="st"><span data-uid="${esc(j.uid)}">${j.uid?'…':'—'}</span> · ${new Date(j.at).toLocaleString(LOC(),{dateStyle:'short',timeStyle:'short'})}</div></div></div>`).join('')}</div>`:'<div class="muted small">Aucune activité enregistrée pour l\'instant.</div>'}</div>`;
}
const BKCOLS=['albums','photos','articles','mouvements','comptages','inscriptions','reservations','biens','formulaires','reponses','sondages','votes','rdv','medias','members','groups','events','attendance','followups','transactions','budgets','rapprochements','commlog','bulletins','plans','songs','lots','campagnes','checkins','indispos'];
async function backup(){const o={app:'EMT',version:1,date:new Date().toISOString(),config:S.config};BKCOLS.forEach(c=>o[c]=S[c]);
  let dl=null;try{dl=await window.claude.use('downloads')}catch(e){}if(!dl){toast('Téléchargement indisponible',1);return}
  try{await dl.save({filename:`Sauvegarde ${cfg().sigle||'EMT'} ${today()}.json`,data:JSON.stringify(o)});toast('Sauvegarde prête');saveConfig({...cfg(),lastBackup:new Date().toISOString()})}catch(e){if(e&&e.code!=='declined')toast('Échec : '+(e&&e.code),1)}}
async function restore(file){let o;try{o=JSON.parse(await file.text())}catch(e){toast('Fichier illisible',1);return}if(!o||o.app!=='EMT'){toast("Ce n'est pas une sauvegarde EMT",1);return}
  const n=BKCOLS.reduce((s,c)=>s+(o[c]||[]).length,0);
  confirmBox(`Restaurer la sauvegarde du ${new Date(o.date).toLocaleString('fr-FR')} (${n} éléments) ? Les éléments existants avec le même identifiant seront remplacés ; rien n'est supprimé.`,async()=>{
    let k=0;for(const c of BKCOLS)for(const x of(o[c]||[])){const{id,...d}=x;if(!id)continue;try{if(db)await db.collection(c).doc(id).set(d);else{S[c]=S[c].filter(y=>y.id!==id);S[c].push(x)}k++}catch(e){}}
    if(o.config)await saveConfig(o.config);render();return true},{btn:'Restaurer',done:'Sauvegarde restaurée'});
}
// Traduction gratuite (service public de Google Traduction) ; les variables {prenom}… sont protégées
const TRL={Lingala:'ln',Swahili:'sw',Anglais:'en'};
async function freeTranslate(txt,lang){
  const tl=TRL[lang];if(!tl)throw new Error('langue');
  const vars=[];const src=txt.replace(/\{[a-z]+\}/gi,v=>{vars.push(v);return'['+(vars.length-1)+']'});
  const back=o=>String(o||'').replace(/\[\s*(\d+)\s*\]/g,(m,i)=>vars[+i]!==undefined?vars[+i]:m);
  const q=encodeURIComponent(src),errs=[];
  const tries=[
    async()=>{const r=await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=fr&tl='+tl+'&dt=t&q='+q);if(!r.ok)throw new Error('G1 '+r.status);const j=await r.json();return(j[0]||[]).map(x=>x[0]).join('')},
    async()=>{const r=await fetch('https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=fr&tl='+tl+'&q='+q);if(!r.ok)throw new Error('G2 '+r.status);const j=await r.json();const v=Array.isArray(j)?j[0]:j;return Array.isArray(v)?v[0]:(v&&v.sentences?v.sentences.map(x=>x.trans||'').join(''):v)},
    async()=>{const r=await fetch('https://api.mymemory.translated.net/get?langpair=fr|'+tl+'&q='+q);if(!r.ok)throw new Error('M '+r.status);const j=await r.json();if(j.responseStatus&&+j.responseStatus!==200)throw new Error('M '+j.responseStatus);return j.responseData&&j.responseData.translatedText}
  ];
  for(const t of tries){try{const o=await t();if(o&&String(o).trim())return back(o)}catch(e){errs.push(e.message||String(e))}}
  throw new Error(errs.join(' / ')||'indisponible');
}
const gtUrl=(txt,lang)=>'https://translate.google.com/?sl=fr&tl='+(TRL[lang]||'en')+'&op=translate&text='+encodeURIComponent(txt);
async function aiRewrite(k){
  UI.trUrl='';
  if(k!=='ton'&&window.EMT_STANDALONE){UI.aiBusy3=1;render();try{UI.msg=await freeTranslate(UI.msg,k);UI.aiBusy3=0;render();toast('Message traduit en '+k);return}catch(e){UI.aiBusy3=0;UI.trUrl=gtUrl(UI.msg,k);render();toast('Traduction automatique impossible ('+(e.message||'réseau')+'). Utilisez le bouton « Ouvrir Google Traduction ».',1);return}}
  let sample=null;try{sample=window.claude?await window.claude.use('sample'):null}catch(e){}if(!sample){toast("L'IA n'est pas disponible ici",1);return}
  UI.aiBusy3=1;render();
  const p=k==='ton'?`Réécris ce message d'église pour qu'il soit chaleureux, clair et respectueux, en français, de longueur similaire. Garde exactement les variables entre accolades comme {prenom}. Réponds uniquement par le message.\n\n${UI.msg}`:`Traduis ce message d'église en ${k}. Garde exactement les variables entre accolades comme {prenom}. Réponds uniquement par la traduction.\n\n${UI.msg}`;
  try{const{text}=await sample(p,{modelTier:'quick'});UI.msg=text.trim()}catch(e){toast(e&&e.code==='not_granted'?"Accès à l'IA refusé":"Échec de l'IA"+(e&&e.message?' : '+e.message:''),1)}
  UI.aiBusy3=0;render();
}
function vMembres(){
  const q=UI.q.toLowerCase(),nf=filtersOn();
  const list=sortedMembers().filter(m=>(UI.fstat?m.statut===UI.fstat:(UI.mf.statut==='Parti(e)'||!isGone(m)))&&(!q||[fullName(m),m.telephone,m.email,m.adresse,m.famille].join(' ').toLowerCase().includes(q))).filter(memberMatch);
  UI.lastList=list.map(m=>m.id);
  return`<div class="toolbar"><input class="inp" id="q" data-bind="q" placeholder="Rechercher un nom, un téléphone…" value="${esc(UI.q)}" style="flex:1;min-width:180px">
   <select class="inp" data-bind="fstat"><option value="">Tous les statuts</option>${STATUTS.map(s=>opt(s,UI.fstat)).join('')}</select>
   <button class="btn ${nf||UI.showF?'primary':''}" data-act="toggleF">Filtres${nf?' ('+nf+')':''} · IA</button><button class="btn" data-act="mView">${UI.mView==='familles'?'Liste':'Familles'}</button>
   <button class="btn" data-act="importCSV">Importer</button><button class="btn" data-act="pdfMembres">PDF</button><button class="btn" data-act="exportMembers">Excel</button><button class="btn primary" data-act="newMember">+ Ajouter</button></div>
  ${UI.showF?filterPanel():''}
  <div class="muted small" style="margin:0 0 8px">${list.length} personne(s)${!UI.fstat&&UI.mf.statut!=='Parti(e)'&&S.members.some(isGone)?` · ${S.members.filter(isGone).length} parti(s) masqué(s) – choisissez le statut « Parti(e) » pour les voir`:''}</div>
  ${UI.mView==='familles'?famillesView(list):`<div class="list">${list.length?list.map(m=>`<div class="row" data-act="viewMember" data-id="${m.id}">${avatar(m)}<div class="grow"><div class="t">${esc(fullName(m))}</div><div class="st">${esc(m.telephone||m.email||'')}${m.fonction&&m.fonction!=='Fidèle'?' · '+esc(m.fonction):''}${ageOf(m)!==null?' · '+ageOf(m)+' ans':''}</div>${(m.groupes||[]).map(g=>groupName(g)?`<span class="chip">${esc(groupName(g))}</span>`:'').join('')}</div><span class="badge ${statutClass(m.statut)}">${esc(m.statut||'Membre actif')}</span></div>`).join(''):`<div class="empty">${S.members.length?'Aucun résultat.':'Aucun membre pour le moment. Cliquez sur « + Ajouter » ou « Importer ».'}</div>`}</div>`}`;
}
function ckReport(){
  const c=checkinFor(UI.ckDate,UI.ckCulte);if(!c)return;const ids=Object.keys(c.presents||{}),ms=ids.map(memberById).filter(Boolean);
  const kid=m=>{const a=ageOf(m);return a!==null&&a<13};
  const h=ms.filter(m=>!kid(m)&&m.sexe==='M').length,f=ms.filter(m=>!kid(m)&&m.sexe==='F').length,e=ms.filter(kid).length,u=ms.length-h-f-e;
  const id='ck_'+ckId(UI.ckDate,UI.ckCulte),ex=S.attendance.find(a=>a.id===id);
  save('attendance',{...(ex||{}),id,date:UI.ckDate,culte:UI.ckCulte,hommes:h+u,femmes:f,enfants:e,visiteurs:ms.filter(m=>m.statut==='Visiteur').length,notes:'Depuis le pointage par nom'+(u?` (${u} personne(s) sans sexe renseigné comptée(s) avec les hommes)`:'')}).then(ok=>ok&&toast('Comptage mis à jour'));
}

/* ================= ÉTAPES 2 & 3 ================= */
const hm=s=>{const[h,m]=String(s||'').split(':').map(Number);return isNaN(h)?null:h*60+(m||0)};
const overlap=(a,b)=>{const a1=hm(a.debut)??0,a2=hm(a.fin)??(hm(a.debut)!==null?hm(a.debut)+60:1440),b1=hm(b.debut)??0,b2=hm(b.fin)??(hm(b.debut)!==null?hm(b.debut)+60:1440);return a1<b2&&b1<a2};
function occurs(e,ds){if(!e.date)return false;if(e.date===ds)return true;if(!e.recurrence||ds<e.date||(e.jusquau&&ds>e.jusquau))return false;
  const a=parse(e.date),b=parse(ds);if(e.recurrence==='hebdo')return a.getDay()===b.getDay();if(e.recurrence==='2sem')return a.getDay()===b.getDay()&&Math.round((b-a)/864e5)%14===0;if(e.recurrence==='mensuel')return a.getDate()===b.getDate();return false}
const billetsOf=e=>String(e.billets||'').split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{const[n,p,d]=l.split(/[;]/);return{nom:(n||'').trim(),prix:num(p),devise:/\$|usd/i.test(d||'')?'USD':'CDF'}});

/* ---------- événements : formulaire étendu ---------- */
function eventForm(e,date){
  const c=cfg();
  openForm({title:e?'Modifier l\'événement':'Nouvel événement',values:e||{date:date||today(),categorie:'Culte spécial',recurrence:''},
   fields:[{k:'titre',label:'Titre',req:1,full:1},{k:'date',label:'Date',type:'date',req:1},{k:'categorie',label:'Catégorie',type:'select',options:CAT_EVT},{k:'heure',label:'Début',type:'time'},{k:'fin',label:'Fin',type:'time'},
    {k:'recurrence',label:'Répétition',type:'select',options:[['','Aucune'],['hebdo','Chaque semaine'],['2sem','Toutes les 2 semaines'],['mensuel','Chaque mois']]},{k:'jusquau',label:'Jusqu\'au (si répété)',type:'date'},
    {k:'salle',label:'Salle réservée',type:'select',options:[['','—']].concat((c.salles||[]).map(s=>s.nom))},{k:'lieu',label:'Lieu / adresse'},
    {k:'inscriptions',label:'Ouvrir les inscriptions',type:'checkbox',full:1},{k:'places',label:'Nombre de places',type:'number'},{k:'clotureInscr',label:'Clôture des inscriptions',type:'date'},
    {k:'billets',label:'Types de billets (un par ligne : Nom;prix;devise) — ex. Adulte;10;USD',type:'textarea',full:1,rows:3},
    {k:'description',label:'Détails',type:'textarea',full:1}],
   onSave:d=>{if(d.salle){const cf=resConflicts({id:'ev:'+(e&&e.id),ressource:d.salle,date:d.date,debut:d.heure,fin:d.fin,qte:1});if(cf)toast('Attention : '+cf,1)}return save('events',{...(e||{}),...d})},onDelete:e?()=>removeDoc('events',e.id):null,
   extra:e?[{label:'Partager (WhatsApp)',fn:()=>copyText(eventText(e),'Annonce copiée')}]:[]});
}
const eventText=e=>`*${e.titre}*\n📅 ${fday(e.date)}${e.heure?' à '+e.heure:''}${e.fin?' – '+e.fin:''}\n📍 ${e.lieu||e.salle||cfg().nom}${e.description?'\n\n'+e.description:''}${e.inscriptions?'\n\nInscriptions ouvertes'+(billetsOf(e).length?' : '+billetsOf(e).map(b=>b.nom+' '+(b.prix?money(b.prix,b.devise):'gratuit')).join(', '):'')+'. Contactez l\'église pour vous inscrire.':''}\n— ${cfg().nom}`;

/* ---------- événements : inscriptions + salles ---------- */
const ETABS=[['inscr','Inscriptions'],['salles','Salles & matériel']];
function vEvenements(){
  const sub={inscr:vInscr,salles:vSalles}[UI.eTab]||vInscr;
  return`<div class="tabs" style="margin-bottom:12px">${ETABS.map(([k,l])=>`<button class="tab${UI.eTab===k?' on':''}" data-act="eTab" data-k="${k}">${l}</button>`).join('')}</div>`+sub();
}
const inscrOf=id=>S.inscriptions.filter(i=>i.eventId===id);
const inscrDu=i=>num(i.montant)-num(i.reduction);
function vInscr(){
  if(UI.evSel)return inscrDetail(S.events.find(e=>e.id===UI.evSel));
  const l=S.events.filter(e=>e.inscriptions).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  return`<div class="toolbar"><div class="muted small">Cochez « Ouvrir les inscriptions » dans un événement (Calendrier ou ici) pour gérer participants, billets et paiements.</div><span class="sp"></span><button class="btn primary" data-act="newEvent">+ Événement</button></div>
  ${l.length?l.map(e=>{const I=inscrOf(e.id),n=I.reduce((s,i)=>s+(num(i.qte)||1),0),pl=num(e.places),open=!e.clotureInscr||e.clotureInscr>=today();return`<div class="card" style="margin-bottom:10px;cursor:pointer;border-left:4px solid var(--warn)" data-act="openEv" data-id="${e.id}"><div style="display:flex;gap:8px;align-items:center"><b style="flex:1;color:var(--brand-d)">${esc(e.titre)}</b><span class="badge ${open?'b-done':'b-inactif'}">${open?'Inscriptions ouvertes':'Clôturé'}</span></div><div class="muted small" style="margin:4px 0 8px">${fday(e.date)}${e.heure?' · '+esc(e.heure):''}${e.lieu||e.salle?' · '+esc(e.lieu||e.salle):''}${billetsOf(e).length?' · '+billetsOf(e).map(b=>esc(b.nom)+' '+(b.prix?money(b.prix,b.devise):'gratuit')).join(', '):''}</div>${pl?bar(n/pl*100)+`<div class="small muted" style="margin-top:4px">${n} places sur ${pl}${e.clotureInscr?' · clôture le '+fdate(e.clotureInscr):''}</div>`:`<div class="small muted">${n} inscrit(s)</div>`}</div>`}).join(''):'<div class="card empty">Aucun événement avec inscriptions.</div>'}`;
}
function inscrDetail(e){
  if(!e){UI.evSel=null;return''}
  const I=inscrOf(e.id).sort((a,b)=>(a.nom||'').localeCompare(b.nom||'','fr')),n=I.reduce((s,i)=>s+(num(i.qte)||1),0);
  const tot={},paid={};I.forEach(i=>{const d=i.devise||'CDF';tot[d]=(tot[d]||0)+inscrDu(i);paid[d]=(paid[d]||0)+num(i.paye)});
  const fmt=o=>Object.keys(o).length?Object.entries(o).map(([d,v])=>money(v,d)).join(' · '):'0';
  const due={};Object.keys(tot).forEach(d=>due[d]=tot[d]-(paid[d]||0));
  return`<div class="toolbar"><button class="btn sm" data-act="closeEv">‹ Événements</button><span class="sp"></span><button class="btn sm" data-act="editEvent" data-id="${e.id}">Modifier</button><button class="btn sm" data-act="evShare" data-id="${e.id}">Partager (WhatsApp)</button><button class="btn sm" data-act="evExport" data-id="${e.id}">Excel</button><button class="btn sm" data-act="evPdf" data-id="${e.id}">PDF</button><button class="btn sm primary" data-act="newInscr" data-id="${e.id}">+ Inscription</button></div>
  <div class="card" style="margin-bottom:12px"><h2 style="margin:0">${esc(e.titre)}</h2><div class="muted small">${fday(e.date)}${e.heure?' · '+esc(e.heure):''}${e.lieu||e.salle?' · '+esc(e.lieu||e.salle):''}</div></div>
  <div class="grid4" style="margin-bottom:12px"><div class="card kpi"><div class="l">Inscrits</div><div class="v">${n}${num(e.places)?'<span class="muted" style="font-size:14px"> / '+num(e.places)+'</span>':''}</div></div><div class="card kpi"><div class="l">Total dû</div><div class="v" style="font-size:15px">${fmt(tot)}</div></div><div class="card kpi"><div class="l">Encaissé</div><div class="v pos" style="font-size:15px">${fmt(paid)}</div></div><div class="card kpi"><div class="l">Reste à payer</div><div class="v ${Object.values(due).some(v=>v>0)?'neg':''}" style="font-size:15px">${fmt(due)}</div></div></div>
  <div class="list">${I.length?I.map(i=>{const r=inscrDu(i)-num(i.paye);return`<div class="row" data-act="editInscr" data-id="${i.id}"><div class="grow"><div class="t">${esc(i.membreId?fullName(memberById(i.membreId)||{}):i.nom)}${num(i.qte)>1?' × '+num(i.qte):''}</div><div class="st">${esc(i.billet||'')}${i.telephone?' · '+esc(i.telephone):''} · ${money(inscrDu(i),i.devise)}${num(i.reduction)?' (réduction '+money(i.reduction,i.devise)+')':''}</div></div><span class="badge ${r<=0?'b-done':num(i.paye)?'b-encours':'b-todo'}">${r<=0?(inscrDu(i)?'Payé':'Gratuit'):num(i.paye)?'Acompte · reste '+money(r,i.devise):'À payer'}</span>${r>0?`<button class="btn sm ok" data-act="payInscr" data-id="${i.id}">Paiement</button>`:''}</div>`}).join(''):'<div class="empty">Aucune inscription.</div>'}</div>`;
}
function inscrForm(e,i){
  const B=billetsOf(e);
  openForm({title:i?'Modifier l\'inscription':'Nouvelle inscription',values:i||{billet:B[0]?B[0].nom:'',qte:1},
   fields:[{k:'membreId',label:'Membre',type:'select',options:memberOptions()},{k:'nom',label:'Ou nom (visiteur)'},{k:'telephone',label:'Téléphone',type:'tel'},{k:'billet',label:'Billet',type:'select',options:B.length?B.map(b=>[b.nom,b.nom+' – '+(b.prix?money(b.prix,b.devise):'gratuit')]):[['','Gratuit']]},{k:'qte',label:'Quantité',type:'number'},{k:'reduction',label:'Réduction (montant)',type:'number'},{k:'notes',label:'Notes (allergies, besoins…)',type:'textarea',full:1}],
   onSave:d=>{if(!d.membreId&&!d.nom){toast('Choisissez un membre ou un nom',1);return false}const b=B.find(x=>x.nom===d.billet)||{prix:0,devise:'CDF'};const q=num(d.qte)||1;
     if(!i&&num(e.places)&&inscrOf(e.id).reduce((s,x)=>s+(num(x.qte)||1),0)+q>num(e.places)){toast('Plus assez de places',1);return false}
     return save('inscriptions',{paye:0,...(i||{}),...d,qte:q,eventId:e.id,montant:b.prix*q,devise:b.devise,nom:d.nom||(memberById(d.membreId)?fullName(memberById(d.membreId)):'')})},
   onDelete:i?()=>removeDoc('inscriptions',i.id):null});
}
function payForm(i){
  const e=S.events.find(x=>x.id===i.eventId)||{},reste=inscrDu(i)-num(i.paye),c=cfg();
  openForm({title:'Paiement – '+(i.nom||''),values:{montant:reste,compte:c.comptes[0]},fields:[{k:'montant',label:'Montant reçu ('+(i.devise==='USD'?'$':'FC')+')',type:'number',req:1},{k:'compte',label:'Compte',type:'select',options:c.comptes}],
   onSave:async d=>{const m=num(d.montant);if(m<=0){toast('Montant invalide',1);return false}
     const ok=await save('transactions',{type:'entree',date:today(),numBon:nextBon('entree'),categorie:'Inscriptions événements',fonds:c.fonds[0],compte:d.compte,montant:m,devise:i.devise||'CDF',membreId:i.membreId||'',tiers:i.membreId?'':i.nom,description:'Inscription : '+(e.titre||'')});
     if(!ok)return false;return save('inscriptions',{...i,paye:num(i.paye)+m})}});
}
function vSalles(){
  const c=cfg(),d=UI.resDate,items=resItems(d);
  return`<div class="toolbar"><input type="date" class="inp" data-bind="resDate" value="${esc(d)}"><span class="sp"></span><button class="btn" data-act="editRessources">Salles & matériel</button><button class="btn primary" data-act="newRes">+ Réserver</button></div>
  <div class="grid2">${(c.salles||[]).map(s=>{const l=items.filter(x=>x.ressource===s.nom);return`<div class="card"><div style="display:flex;align-items:center"><b style="flex:1">${esc(s.nom)}</b><span class="muted small">Capacité ${num(s.capacite)||'—'}</span></div>${l.length?l.map(x=>{const cf=resConflicts(x);return`<div class="row" style="padding:8px 0" ${x.id&&!x.ev?`data-act="editRes" data-id="${x.id}"`:''}><div class="grow"><div class="t">${esc(x.objet)}</div><div class="st">${x.debut?esc(x.debut)+'–'+esc(x.fin||''):'Journée'}${x.par?' · '+esc(x.par):''}</div></div><span class="badge ${cf?'b-encours':'b-done'}">${cf?'Chevauchement':'Réservé'}</span></div>`}).join(''):'<div class="muted small" style="margin-top:6px">Libre</div>'}</div>`}).join('')}
  ${materielList().map(m=>{const l=items.filter(x=>x.ressource===m.nom);return`<div class="card"><div style="display:flex;align-items:center"><b style="flex:1">${esc(m.nom)}</b><span class="muted small">Stock ${num(m.quantite)}</span></div>${l.length?l.map(x=>{const cf=resConflicts(x);return`<div class="row" style="padding:8px 0" data-act="editRes" data-id="${x.id}"><div class="grow"><div class="t">${esc(x.objet)} · × ${num(x.qte)||1}</div><div class="st">${x.debut?esc(x.debut)+'–'+esc(x.fin||''):'Journée'}</div></div><span class="badge ${cf?'b-todo':'b-done'}">${cf?'Quantité dépassée':'Réservé'}</span></div>`}).join(''):'<div class="muted small" style="margin-top:6px">Disponible</div>'}</div>`}).join('')}</div>
  ${!(c.salles||[]).length&&!materielList().length?'<div class="card empty">Ajoutez vos salles et votre matériel (bouton « Salles & matériel »).</div>':''}`;
}
function resItems(d){return S.reservations.filter(r=>r.date===d).concat(S.events.filter(e=>e.salle&&occurs(e,d)).map(e=>({ev:1,id:'ev:'+e.id,ressource:e.salle,date:d,debut:e.heure,fin:e.fin,objet:e.titre,qte:1})))}
function resConflicts(x){
  const c=cfg(),mat=materielList().find(m=>m.nom===x.ressource),others=resItems(x.date).filter(y=>y.ressource===x.ressource&&y.id!==x.id&&overlap(x,y));
  if(mat){const used=others.reduce((s,y)=>s+(num(y.qte)||1),0)+(num(x.qte)||1);return used>num(mat.quantite)?`${used} demandés pour ${num(mat.quantite)} disponibles`:''}
  return others.length?'chevauche « '+others[0].objet+' »':'';
}
function resForm(r){
  const c=cfg(),opts=(c.salles||[]).map(s=>s.nom).concat(materielList().map(m=>m.nom));if(!opts.length){toast('Ajoutez d\'abord des salles ou du matériel',1);return}
  openForm({title:r?'Modifier la réservation':'Nouvelle réservation',values:r||{date:UI.resDate,ressource:opts[0],qte:1},fields:[{k:'ressource',label:'Salle ou matériel',type:'select',options:opts},{k:'qte',label:'Quantité (matériel)',type:'number'},{k:'date',label:'Date',type:'date',req:1},{k:'debut',label:'Début',type:'time'},{k:'fin',label:'Fin',type:'time'},{k:'objet',label:'Objet',req:1},{k:'par',label:'Demandé par'}],
   onSave:d=>{const cf=resConflicts({...d,id:r&&r.id});if(cf)toast('Attention : '+cf,1);return save('reservations',{...(r||{}),...d})},onDelete:r?()=>removeDoc('reservations',r.id):null});
}
function ressourcesForm(){const c=cfg();openForm({title:'Salles & matériel',values:{s:(c.salles||[]).map(x=>x.nom+';'+(x.capacite||'')).join('\n'),m:materielList().map(x=>x.nom+';'+x.quantite).join('\n')},
  fields:[{k:'s',label:'Salles (une par ligne : Nom;capacité)',type:'textarea',full:1,rows:4},{k:'m',label:'Matériel (un par ligne : Nom;quantité)',type:'textarea',full:1,rows:4}],
  onSave:d=>{const L=t=>t.split('\n').map(x=>x.trim()).filter(Boolean).map(x=>x.split(';'));return saveConfig({salles:L(d.s).map(([n,q])=>({nom:n.trim(),capacite:num(q)})),materiel:L(d.m).map(([n,q])=>({nom:n.trim(),quantite:num(q)||1}))})}})}

/* ---------- immobilisations ---------- */
function amort(b,at){const v=num(b.valeur),r=num(b.residuel),n=num(b.duree)||1,an=(v-r)/n;const y=Math.max(0,((at?parse(at):new Date())-parse(b.dateAcq||today()))/(365.25*864e5));const cum=Math.min(v-r,an*y);return{annuel:an,cumul:cum,net:v-cum}}
function vImmos(){
  const l=[...S.biens].sort((a,b)=>num(b.valeur)-num(a.valeur));const t={CDF:{v:0,n:0,a:0},USD:{v:0,n:0,a:0}};
  l.forEach(b=>{const d=b.devise==='CDF'?'CDF':'USD',A=amort(b);t[d].v+=num(b.valeur);t[d].n+=A.net;t[d].a+=A.annuel});
  return`<div class="toolbar"><div class="muted small">Bâtiments, terrain (parcelle), véhicules, sonorisation, mobilier… Amortissement linéaire.</div><span class="sp"></span><button class="btn primary" data-act="newBien">+ Ajouter un bien</button></div>
  <div class="grid3" style="margin-bottom:12px"><div class="card kpi"><div class="l">Valeur d'acquisition</div><div class="v" style="font-size:16px">${money(t.USD.v,'USD')}</div><div class="s">${money(t.CDF.v,'CDF')}</div></div><div class="card kpi"><div class="l">Valeur nette actuelle</div><div class="v" style="font-size:16px">${money(t.USD.n,'USD')}</div><div class="s">${money(t.CDF.n,'CDF')}</div></div><div class="card kpi"><div class="l">Amortissement annuel</div><div class="v" style="font-size:16px">${money(t.USD.a,'USD')}</div><div class="s">${money(t.CDF.a,'CDF')}</div></div></div>
  <div class="list">${l.length?l.map(b=>{const A=amort(b);return`<div class="row" data-act="editBien" data-id="${b.id}"><div class="grow"><div class="t">${esc(b.nom)}</div><div class="st">${esc(b.categorie||'')} · acquis le ${fdate(b.dateAcq)} · ${num(b.duree)?'linéaire '+num(b.duree)+' ans':'non amorti'}</div></div><div class="amt">${money(A.net,b.devise)}<div class="small muted" style="font-weight:400">sur ${money(b.valeur,b.devise)}</div></div></div>`}).join(''):'<div class="empty">Aucun bien enregistré.</div>'}</div>`;
}
function bienForm(b){openForm({title:b?'Modifier le bien':'Nouveau bien',values:b||{devise:'USD',dateAcq:today(),duree:5,categorie:'Matériel'},fields:[{k:'nom',label:'Désignation',req:1,full:1},{k:'categorie',label:'Catégorie',type:'select',options:['Terrain','Bâtiment','Véhicule','Matériel','Sonorisation / instruments','Mobilier','Informatique','Autre']},{k:'dateAcq',label:'Date d\'acquisition',type:'date'},{k:'valeur',label:'Valeur d\'acquisition',type:'number',req:1},{k:'devise',label:'Devise',type:'select',options:[['USD','Dollars ($)'],['CDF','Francs congolais']]},{k:'duree',label:'Durée d\'amortissement (ans, 0 = terrain)',type:'number'},{k:'residuel',label:'Valeur résiduelle',type:'number'},{k:'emplacement',label:'Emplacement / n° de série'},{k:'notes',label:'Notes / historique',type:'textarea',full:1}],onSave:d=>save('biens',{...(b||{}),...d,duree:d.duree===''?0:d.duree}),onDelete:b?()=>removeDoc('biens',b.id):null})}

/* ---------- formulaires ---------- */
const FTYPES=[['texte','Texte court'],['paragraphe','Paragraphe'],['nombre','Nombre'],['date','Date'],['telephone','Téléphone'],['choix','Liste de choix'],['multi','Cases multiples'],['case','Case Oui'],['signature','Signature']];
const FMAP=[['','—'],['nom','Nom'],['postnom','Postnom'],['prenom','Prénom'],['telephone','Téléphone'],['email','E-mail'],['dateNaissance','Naissance'],['adresse','Adresse'],['sexe','Sexe (M/F)']];
const FOTABS=[['forms','Formulaires'],['votes','Sondages & élections']];
function vFormulaires(){
  const sub={forms:vForms,votes:vVotes}[UI.foTab]||vForms;
  return`<div class="tabs" style="margin-bottom:12px">${FOTABS.map(([k,l])=>`<button class="tab${UI.foTab===k?' on':''}" data-act="foTab" data-k="${k}">${l}</button>`).join('')}</div>`+sub();
}
const optsOf=f=>String(f.options||'').split(',').map(x=>x.trim()).filter(Boolean);
function vForms(){
  if(UI.form)return formEditor();
  if(UI.formResp)return formResponses(S.formulaires.find(f=>f.id===UI.formResp));
  const l=[...S.formulaires].sort((a,b)=>(a.titre||'').localeCompare(b.titre||'','fr'));
  return`<div class="toolbar"><div class="muted small">Fiche d'accueil des visiteurs, demande de baptême, inscription à l'école du dimanche, demande de prière…</div><span class="sp"></span><button class="btn" data-act="newFormVisiteur">+ Fiche visiteur prête</button><button class="btn primary" data-act="newForm">+ Formulaire</button></div>
  <div class="list">${l.length?l.map(f=>`<div class="row" style="cursor:default"><div class="grow"><div class="t">${esc(f.titre)}</div><div class="st">${(f.champs||[]).length} champ(s) · ${S.reponses.filter(r=>r.formId===f.id).length} réponse(s)</div></div><button class="btn sm primary" data-act="kiosk" data-id="${f.id}">Mode tablette</button><button class="btn sm" data-act="formResp" data-id="${f.id}">Réponses</button><button class="btn sm" data-act="editForm" data-id="${f.id}">Modifier</button></div>`).join(''):'<div class="empty">Aucun formulaire.</div>'}</div>`;
}
function formEditor(){
  const f=UI.form;
  const rows=(f.champs||[]).map((c,i)=>`<div class="row" style="cursor:default;flex-wrap:wrap"><input class="inp" data-fk="${i}:label" value="${esc(c.label)}" placeholder="Question" style="flex:2;min-width:160px"><select class="inp" data-fk="${i}:type">${FTYPES.map(o=>opt(o,c.type)).join('')}</select>${c.type==='choix'||c.type==='multi'?`<input class="inp" data-fk="${i}:options" value="${esc(c.options)}" placeholder="Choix séparés par des virgules" style="flex:2;min-width:160px">`:''}<select class="inp" data-fk="${i}:map" title="Copier dans la fiche membre">${FMAP.map(o=>opt([o[0],o[0]?'→ '+o[1]:'Pas de lien membre'],c.map)).join('')}</select><label class="small" style="display:flex;gap:4px;align-items:center"><input type="checkbox" data-fk="${i}:requis"${c.requis?' checked':''}> requis</label><button class="btn sm" data-act="fkUp" data-i="${i}" ${i?'':'disabled'}>↑</button><button class="btn sm danger" data-act="fkDel" data-i="${i}">✕</button></div>`).join('');
  return`<div class="toolbar"><button class="btn sm" data-act="closeForm">‹ Formulaires</button><span class="sp"></span>${f.id?'<button class="btn sm danger" data-act="delForm">Supprimer</button>':''}<button class="btn sm primary" data-act="saveForm">Enregistrer</button></div>
  <div class="card" style="margin-bottom:12px"><div class="fgrid" style="padding:0"><div class="fld full"><label>Titre</label><input data-ff="titre" value="${esc(f.titre)}"></div><div class="fld full"><label>Message d'introduction</label><input data-ff="description" value="${esc(f.description)}"></div><div class="fld full"><label>Message après l'envoi</label><input data-ff="merci" value="${esc(f.merci)}"></div></div></div>
  <div class="list">${rows||'<div class="empty">Ajoutez des questions.</div>'}</div><div style="margin-top:8px"><button class="btn sm" data-act="fkAdd">+ Question</button></div>`;
}
function visiteurForm(){return{titre:'Fiche d\'accueil – Nouveau visiteur',description:'Bienvenue ! Merci de remplir cette fiche pour que nous puissions rester en contact.',merci:'Merci et que Dieu vous bénisse !',creerMembre:true,champs:[{label:'Nom',type:'texte',map:'nom',requis:true},{label:'Postnom',type:'texte',map:'postnom'},{label:'Prénom',type:'texte',map:'prenom'},{label:'Sexe',type:'choix',options:'Homme, Femme',map:'sexe'},{label:'Téléphone (WhatsApp)',type:'telephone',map:'telephone',requis:true},{label:'Quartier / commune',type:'texte',map:'adresse'},{label:'Comment avez-vous connu l\'église ?',type:'choix',options:'Un ami / un membre, Évangélisation, Réseaux sociaux, Passage, Autre'},{label:'Souhaitez-vous une visite ?',type:'case'},{label:'Sujet de prière',type:'paragraphe'}]}}
function kiosk(f){
  UI.kio={f,vals:{},msg:''};drawKiosk();
}
function drawKiosk(){
  const K=UI.kio,f=K.f;let el=$('#kiosk');if(!el){el=document.createElement('div');el.id='kiosk';el.className='login';el.style.alignItems='flex-start';document.body.appendChild(el)}
  const inp=(c,i)=>{const v=K.vals[i]??'',n='k'+i;switch(c.type){case'paragraphe':return`<textarea class="inp" name="${n}" rows="3" style="width:100%">${esc(v)}</textarea>`;case'choix':return`<select class="inp" name="${n}" style="width:100%"><option value="">—</option>${optsOf(c).map(o=>opt(o,v)).join('')}</select>`;
   case'multi':return`<div class="multi">${optsOf(c).map(o=>`<label><input type="checkbox" name="${n}" value="${esc(o)}"> ${esc(o)}</label>`).join('')}</div>`;case'case':return`<label class="chk"><input type="checkbox" name="${n}"> Oui</label>`;
   case'signature':return`<canvas class="sig" data-i="${i}" width="500" height="150" style="width:100%;max-width:500px;height:150px;background:#fff;border:1px dashed #9ab;border-radius:10px;touch-action:none"></canvas><button type="button" class="btn sm" data-sigclear="${i}">Effacer</button>`;
   default:return`<input class="inp" name="${n}" type="${{nombre:'number',date:'date',telephone:'tel'}[c.type]||'text'}" value="${esc(v)}" style="width:100%">`}};
  el.innerHTML=`<div class="mbox" style="max-width:620px;margin:20px auto;color:var(--tx)"><div class="mhead" style="gap:10px"><img src="${$('#logo img').src}" style="width:34px;height:34px;filter:brightness(0) saturate(100%) invert(30%) sepia(30%) saturate(900%) hue-rotate(140deg)" alt=""><h3>${esc(f.titre)}</h3><button class="btn sm" id="kExit">Quitter</button></div>
  ${K.done?`<div class="mbody" style="text-align:center;padding:40px 20px"><h2>${esc(f.merci||'Merci !')}</h2><button class="btn primary" id="kNext" style="margin-top:16px">Nouvelle réponse</button></div>`:
  `<form id="kForm"><div class="mbody">${f.description?`<p class="muted">${esc(f.description)}</p>`:''}${(f.champs||[]).map((c,i)=>`<div class="fld" style="margin-bottom:12px"><label>${esc(c.label)}${c.requis?' *':''}</label>${inp(c,i)}</div>`).join('')}<div class="lerr" style="color:var(--bad)">${esc(K.msg)}</div></div><div class="mfoot"><span class="sp"></span><button class="btn primary" style="padding:12px 22px">Envoyer</button></div></form>`}</div>`;
  el.querySelectorAll('canvas.sig').forEach(cv=>{const x=cv.getContext('2d');x.lineWidth=2.2;x.lineCap='round';x.strokeStyle='#123';let d=false;const P=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)*cv.width/r.width,(e.clientY-r.top)*cv.height/r.height]};
    cv.onpointerdown=e=>{d=true;cv.setPointerCapture(e.pointerId);x.beginPath();x.moveTo(...P(e));cv.dataset.signed='1'};cv.onpointermove=e=>{if(d){x.lineTo(...P(e));x.stroke()}};cv.onpointerup=()=>d=false});
  el.querySelectorAll('[data-sigclear]').forEach(b=>b.onclick=()=>{const cv=el.querySelector(`canvas[data-i="${b.dataset.sigclear}"]`);cv.getContext('2d').clearRect(0,0,cv.width,cv.height);delete cv.dataset.signed});
  $('#kExit').onclick=async()=>{if((window.EMT_API&&ROLE!=='fidele')||AUTH.hash){const v=await askCode();if(v===null)return;if(!(await exitOk(v))){toast('Code incorrect',1);return}}el.remove();UI.kio=null;render()};
  if(K.done){$('#kNext').onclick=()=>{UI.kio={f,vals:{},msg:''};drawKiosk()};return}
  $('#kForm').onsubmit=async e=>{e.preventDefault();const fm=e.target,vals={};let miss='';
    (f.champs||[]).forEach((c,i)=>{let v;if(c.type==='multi')v=[...fm.querySelectorAll(`input[name="k${i}"]:checked`)].map(x=>x.value).join(', ');else if(c.type==='case')v=fm.elements['k'+i].checked?'Oui':'Non';else if(c.type==='signature'){const cv=el.querySelector(`canvas[data-i="${i}"]`);v=cv.dataset.signed?cv.toDataURL('image/png'):''}else v=fm.elements['k'+i].value.trim();vals[i]=v;if(c.requis&&(!v||v==='Non'&&c.type==='case'))miss=miss||c.label});
    if(miss){K.vals=vals;K.msg='Champ obligatoire : '+miss;drawKiosk();return}
    const ok=await save('reponses',{formId:f.id,at:new Date().toISOString(),valeurs:vals});if(ok){if(f.creerMembre&&ROLE!=='fidele')await createMemberFrom(f,{valeurs:vals},true);K.done=1;drawKiosk()}};
}
async function createMemberFrom(f,r,silent){
  const m={statut:'Visiteur',fonction:'Fidèle',dateAdhesion:today()};(f.champs||[]).forEach((c,i)=>{if(c.map&&r.valeurs[i]){let v=r.valeurs[i];if(c.map==='sexe')v=/^f/i.test(v)?'F':/^[mh]/i.test(v)?'M':'';if(c.map==='dateNaissance')v=toIsoDate(v)||v;m[c.map]=v}});
  if(!m.nom&&!m.prenom){if(!silent)toast('Aucun champ « nom » relié dans ce formulaire',1);return}
  const t=waNum(m.telephone);if(t&&S.members.some(x=>waNum(x.telephone)===t)){if(!silent)toast('Ce numéro existe déjà dans les membres',1);return}
  const id=await save('members',m);if(id){await accueilAuto({...m,id});if(!silent)toast('Fiche membre créée')}
}
function formResponses(f){
  if(!f){UI.formResp=null;return''}
  const R=S.reponses.filter(r=>r.formId===f.id).sort((a,b)=>String(b.at).localeCompare(String(a.at)));
  return`<div class="toolbar"><button class="btn sm" data-act="closeResp">‹ Formulaires</button><b>${esc(f.titre)}</b><span class="sp"></span><button class="btn sm" data-act="respExport" data-id="${f.id}">Excel</button></div>
  ${R.length?R.map(r=>`<div class="card" style="margin-bottom:10px"><div style="display:flex;gap:8px;align-items:center;margin-bottom:6px"><b style="flex:1">${new Date(r.at).toLocaleString(LOC(),{dateStyle:'medium',timeStyle:'short'})}</b>${(f.champs||[]).some(c=>c.map)?`<button class="btn sm" data-act="respMember" data-id="${r.id}">Créer la fiche membre</button>`:''}<button class="btn sm danger" data-act="respDel" data-id="${r.id}">✕</button></div><dl class="kv">${(f.champs||[]).map((c,i)=>`<dt>${esc(c.label)}</dt><dd>${c.type==='signature'&&r.valeurs[i]?`<img src="${esc(r.valeurs[i])}" style="max-width:220px;border:1px solid var(--bd);border-radius:6px">`:esc(r.valeurs[i]||'—')}</dd>`).join('')}</dl></div>`).join(''):'<div class="card empty">Aucune réponse.</div>'}`;
}

/* ---------- sondages & élections ---------- */
const myVote=s=>S.votes.find(v=>v.id===s.id+'__'+(ME&&ME.id||'local'));
function results(s){const r={};(s.options||[]).forEach(o=>r[o]=num((s.manuel||{})[o]));S.votes.filter(v=>v.sid===s.id).forEach(v=>{if(r[v.choix]!==undefined)r[v.choix]++});return r}
function vVotes(){
  const l=[...S.sondages].sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
  return`<div class="toolbar"><div class="muted small">Votes en ligne (personnes ayant accès à l'application) et/ou saisie des voix d'une assemblée.</div><span class="sp"></span><button class="btn primary" data-act="newVote">+ Sondage / élection</button></div>
  ${l.length?l.map(s=>{const r=results(s),tot=Object.values(r).reduce((a,b)=>a+b,0),mv=myVote(s),open=s.ouvert!==false&&(!s.fin||s.fin>=today());
   return`<div class="card" style="margin-bottom:10px"><div style="display:flex;gap:8px;align-items:center"><span class="badge">${s.type==='election'?'Élection':'Sondage'}</span><b style="flex:1">${esc(s.question)}</b><span class="badge ${open?'b-done':'b-inactif'}">${open?'Ouvert':'Clos'}</span></div>
   <div class="muted small" style="margin:4px 0 10px">${tot} voix${s.fin?' · fin le '+fdate(s.fin):''}${s.anonyme?' · vote anonyme':''}</div>
   ${(s.options||[]).map(o=>`<div style="display:flex;gap:10px;align-items:center;margin-bottom:6px">${open?`<input type="radio" name="v_${s.id}" data-act="vote" data-id="${s.id}" data-k="${esc(o)}"${mv&&mv.choix===o?' checked':''} style="width:18px;height:18px">`:''}<span style="width:34%;min-width:90px">${esc(o)}</span><div style="flex:1">${bar(tot?r[o]/tot*100:0)}</div><span class="small" style="width:70px;text-align:right">${r[o]} · ${tot?Math.round(r[o]/tot*100):0} %</span></div>`).join('')}
   <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">${mv?'<span class="small pos">✓ Vous avez voté</span>':''}<span class="sp" style="flex:1"></span><button class="btn sm" data-act="voteManual" data-id="${s.id}">Saisir des voix</button><button class="btn sm" data-act="votePdf" data-id="${s.id}">Procès-verbal PDF</button><button class="btn sm" data-act="editVote" data-id="${s.id}">Modifier</button></div></div>`}).join(''):'<div class="card empty">Aucun sondage.</div>'}`;
}
function voteForm(s){openForm({title:s?'Modifier':'Nouveau sondage / élection',values:s?{...s,options:(s.options||[]).join('\n')}:{type:'sondage',ouvert:true},fields:[{k:'type',label:'Type',type:'select',options:[['sondage','Sondage'],['election','Élection']]},{k:'fin',label:'Date de fin',type:'date'},{k:'question',label:'Question / poste à pourvoir',req:1,full:1},{k:'options',label:'Choix ou candidats (un par ligne)',type:'textarea',full:1,rows:5},{k:'anonyme',label:'Vote anonyme (les noms des votants ne sont pas affichés)',type:'checkbox',full:1},{k:'ouvert',label:'Vote ouvert',type:'checkbox',full:1}],
  onSave:d=>{const o=d.options.split('\n').map(x=>x.trim()).filter(Boolean);if(o.length<2){toast('Au moins 2 choix',1);return false}return save('sondages',{...(s||{}),...d,options:o})},onDelete:s?()=>removeDoc('sondages',s.id):null})}
function voteManualForm(s){const m=s.manuel||{};openForm({title:'Voix exprimées en assemblée',values:Object.fromEntries((s.options||[]).map((o,i)=>['o'+i,m[o]||''])),fields:(s.options||[]).map((o,i)=>({k:'o'+i,label:o,type:'number'})),onSave:d=>save('sondages',{...s,manuel:Object.fromEntries((s.options||[]).map((o,i)=>[o,num(d['o'+i])]))})})}
function votePdf(s){const r=results(s),tot=Object.values(r).reduce((a,b)=>a+b,0),d=pdfDoc(s.type==='election'?'Procès-verbal d\'élection':'Résultats du sondage',fdate(today()));
  d.para(s.question,12);d.table([{t:'Choix / candidat',w:.5},{t:'Voix',w:.25,a:'r'},{t:'%',w:.25,a:'r'}],Object.entries(r).sort((a,b)=>b[1]-a[1]).map(([k,v])=>[k,v,tot?Math.round(v/tot*1000)/10+' %':'—']).concat([{bold:1,cells:['Total des voix',tot,'100 %']}]));
  d.signatures(['Le Président de séance','Le Secrétaire','Les Scrutateurs']);savePDF(`Resultats ${s.question.slice(0,30)}.pdf`,d.finish())}

/* ---------- rendez-vous ---------- */
const RSTAT=['Demandé','Confirmé','Terminé','Annulé'];
function freeSlots(){
  const dis=cfg().dispos||[],out=[];for(let k=0;k<14&&out.length<8;k++){const d=new Date();d.setDate(d.getDate()+k);const ds=iso(d);
   dis.filter(x=>+x.jour===d.getDay()).forEach(x=>{for(let t=hm(x.debut);t+30<=hm(x.fin);t+=30){const s={debut:pad(Math.floor(t/60))+':'+pad(t%60),fin:pad(Math.floor((t+30)/60))+':'+pad((t+30)%60)};
    if(k===0&&t<=new Date().getHours()*60+new Date().getMinutes())continue;if(!S.rdv.some(r=>r.date===ds&&r.statut!=='Annulé'&&overlap({debut:r.heure,fin:addMin(r.heure,num(r.duree)||30)},s)))out.push({ds,...s})}})}
  return out.slice(0,8);
}
function vRdv(){
  const l=S.rdv.filter(r=>UI.rdvF==='tous'||(r.date||'')>=today()).sort((a,b)=>((a.date||'')+(a.heure||'')).localeCompare((b.date||'')+(b.heure||'')));
  const fs=freeSlots();
  return`<div class="toolbar"><div class="tabs">${[['avenir','À venir'],['tous','Tous']].map(([k,t])=>`<button class="tab${UI.rdvF===k?' on':''}" data-act="rdvF" data-k="${k}">${t}</button>`).join('')}</div><span class="sp"></span><button class="btn" data-act="editDispos">Mes disponibilités</button><button class="btn primary" data-act="newRdv">+ Rendez-vous</button></div>
  <div class="card" style="margin-bottom:12px"><h2>Prochains créneaux libres</h2>${fs.length?fs.map(x=>`<button class="tab" data-act="newRdvAt" data-k="${x.ds}|${x.debut}" style="margin:0 6px 6px 0">${fday(x.ds)} ${x.debut}</button>`).join(''):'<div class="muted small">Définissez vos disponibilités (ex. mardi 10:00–12:00) pour voir les créneaux libres.</div>'}</div>
  <div class="list">${l.length?l.map(r=>{const m=memberById(r.membreId),nom=m?fullName(m):r.nom,tel=m?m.telephone:r.telephone,cf=S.rdv.some(o=>o.id!==r.id&&o.date===r.date&&o.statut!=='Annulé'&&r.statut!=='Annulé'&&(o.avec||'')===(r.avec||'')&&overlap({debut:o.heure,fin:addMin(o.heure,num(o.duree)||30)},{debut:r.heure,fin:addMin(r.heure,num(r.duree)||30)}));
   return`<div class="row" data-act="editRdv" data-id="${r.id}"><div class="grow"><div class="t">${esc(nom||'—')} · ${esc(r.motif||'')}</div><div class="st">${fday(r.date)} ${esc(r.heure||'')} (${num(r.duree)||30} min) · avec ${esc(r.avec||cfg().pasteur)}</div></div>${cf?'<span class="badge b-todo">Conflit</span>':''}<span class="badge ${r.statut==='Confirmé'?'b-done':r.statut==='Annulé'?'b-inactif':r.statut==='Terminé'?'':'b-encours'}">${esc(r.statut||'Demandé')}</span>${waLink(tel)&&r.statut!=='Annulé'?`<a class="btn sm wa" target="_blank" rel="noopener" href="${esc(waLink(tel,`Bonjour ${m&&m.prenom||nom}, votre rendez-vous avec ${r.avec||'le pasteur '+cfg().pasteur} est ${r.statut==='Confirmé'?'confirmé':'prévu'} le ${fday(r.date)} à ${r.heure}. — ${cfg().nom}`))}">WhatsApp</a>`:''}</div>`}).join(''):'<div class="empty">Aucun rendez-vous.</div>'}</div>`;
}
function rdvForm(r,pre){openForm({title:r?'Modifier le rendez-vous':'Nouveau rendez-vous',values:r||{date:pre?pre[0]:today(),heure:pre?pre[1]:'10:00',duree:30,avec:'Pasteur '+cfg().pasteur,statut:'Confirmé'},
  fields:[{k:'membreId',label:'Membre',type:'select',options:memberOptions()},{k:'nom',label:'Ou nom'},{k:'telephone',label:'Téléphone',type:'tel'},{k:'avec',label:'Avec'},{k:'date',label:'Date',type:'date',req:1},{k:'heure',label:'Heure',type:'time',req:1},{k:'duree',label:'Durée (min)',type:'number'},{k:'statut',label:'Statut',type:'select',options:RSTAT},{k:'motif',label:'Motif',full:1,ph:'Conseil, prière, mariage, baptême…'},{k:'notes',label:'Notes',type:'textarea',full:1}],
  onSave:d=>(!d.membreId&&!d.nom)?(toast('Choisissez un membre ou un nom',1),false):save('rdv',{...(r||{}),...d}),onDelete:r?()=>removeDoc('rdv',r.id):null})}
function disposForm(){const d=cfg().dispos||[];openForm({title:'Disponibilités hebdomadaires',values:{t:d.map(x=>`${JOURS[+x.jour]};${x.debut};${x.fin}`).join('\n')},fields:[{k:'t',label:'Une plage par ligne : Jour;début;fin (ex. Mardi;10:00;12:00)',type:'textarea',rows:6,full:1}],
  onSave:x=>saveConfig({dispos:x.t.split('\n').map(l=>l.split(';').map(s=>s.trim())).filter(a=>a.length>=3).map(([j,a,b])=>({jour:JOURS.findIndex(J=>J.toLowerCase()===j.toLowerCase()),debut:a,fin:b})).filter(x=>x.jour>=0&&hm(x.debut)!==null&&hm(x.fin)!==null)})})}

/* ---------- médiathèque, verset, encart web ---------- */
const MTABS=[['predic','Prédications & vidéos'],['verset','Verset du jour'],['web','Encart site internet']];
function vMedia(){
  const sub={predic:vPredic,verset:vVerset,web:vWeb}[UI.mTab]||vPredic;
  return`<div class="tabs" style="margin-bottom:12px">${MTABS.map(([k,l])=>`<button class="tab${UI.mTab===k?' on':''}" data-act="mTab" data-k="${k}">${l}</button>`).join('')}</div>`+sub();
}
function vPredic(){
  const q=UI.medQ.toLowerCase(),l=[...S.medias].filter(m=>!q||[m.titre,m.predicateur,m.reference,m.serie].join(' ').toLowerCase().includes(q)).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  return`<div class="toolbar"><input class="inp" id="medQ" data-bind="medQ" value="${esc(UI.medQ)}" placeholder="Rechercher titre, prédicateur, passage…" style="flex:1"><button class="btn primary" data-act="newMedia">+ Prédication / vidéo</button></div>
  <div class="list">${l.length?l.map(m=>`<div class="row" style="cursor:default"><div class="grow"><div class="t">${esc(m.titre)}${m.publie?' <span class="badge b-done">publié</span>':''}</div><div class="st">${fdate(m.date)} · ${esc(m.predicateur||'')}${m.reference?' · '+esc(m.reference):''}${m.serie?' · série '+esc(m.serie):''}</div>${m.resume?`<div class="small" style="margin-top:4px;white-space:pre-wrap">${esc(m.resume)}</div>`:''}</div>${m.lien&&/^https?:\/\//.test(m.lien)?`<a class="btn sm" target="_blank" rel="noopener" href="${esc(m.lien)}">▶ Voir</a>`:''}<button class="btn sm" data-act="aiResume" data-id="${m.id}" ${m.notes?'':'disabled title="Ajoutez des notes"'}>✨ Résumé</button><button class="btn sm" data-act="editMedia" data-id="${m.id}">Modifier</button></div>`).join(''):'<div class="empty">Aucune prédication enregistrée.</div>'}</div>`;
}
function mediaForm(m){openForm({title:m?'Modifier':'Nouvelle prédication / vidéo',values:m||{date:today(),predicateur:'Pasteur '+cfg().pasteur,type:'Prédication'},fields:[{k:'titre',label:'Titre',req:1,full:1},{k:'date',label:'Date',type:'date'},{k:'type',label:'Type',type:'select',options:['Prédication','Enseignement','Louange','Témoignage','Émission (studio)','Autre']},{k:'predicateur',label:'Prédicateur / intervenant'},{k:'reference',label:'Passage biblique'},{k:'serie',label:'Série'},{k:'lien',label:'Lien vidéo / audio (YouTube, Facebook…)',full:1},{k:'notes',label:'Notes de la prédication',type:'textarea',full:1,rows:5},{k:'resume',label:'Résumé',type:'textarea',full:1},{k:'publie',label:'Afficher sur l\'encart du site internet',type:'checkbox',full:1}],onSave:d=>save('medias',{...(m||{}),...d}),onDelete:m?()=>removeDoc('medias',m.id):null})}
async function aiCall(prompt,json){let s=null;try{s=window.claude?await window.claude.use('sample'):null}catch(e){}if(!s){toast("L'IA n'est pas disponible ici",1);return null}
  try{return json?await s.json(prompt,{modelTier:'quick'}):(await s(prompt,{modelTier:'quick'})).text}catch(e){toast(e&&e.code==='not_granted'?"Accès à l'IA refusé":"Échec de l'IA"+(e&&e.message?' : '+e.message:''),1);return null}}
function vVerset(){const v=verseDuJour();
  return`<div class="card" style="text-align:center;padding:28px 18px"><div class="muted small">${v.date?fday(v.date):''}</div><div style="font-size:19px;font-style:italic;margin:12px auto;max-width:560px">${v.texte?'« '+esc(v.texte)+' »':'Aucun verset défini.'}</div><b style="color:var(--brand-d)">${esc(v.ref||'')}</b></div>
  <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn primary" data-act="pickVerset">📖 Choisir dans la liste</button><button class="btn" data-act="editVerset">Modifier</button><button class="btn" data-act="aiVerset" ${UI.aiBusy4?'disabled':''}>${UI.aiBusy4?'…':'✨ Proposer un verset (IA)'}</button>${v.texte?`<button class="btn" data-act="copyVerset">Copier pour WhatsApp</button>`:''}</div>
  <div class="muted small" style="margin-top:8px">Le verset apparaît sur le tableau de bord, dans l'encart du site internet et peut être partagé sur WhatsApp. Vérifiez toujours le texte proposé par l'IA dans votre Bible.</div>`}
function vWeb(){
  const h=webSnippet();
  return`<div class="card" style="margin-bottom:12px"><h2>Encart pour le site internet de l'église</h2><div class="muted small" style="margin-bottom:10px">Copiez ce code HTML et collez-le dans votre site (bloc « HTML personnalisé »). Il contient le verset du jour, les horaires des cultes, les prochains événements et les dernières prédications publiées. Recopiez-le après chaque mise à jour.</div><button class="btn primary" data-act="copyWeb">Copier le code HTML</button></div>
  <div class="card"><h2>Aperçu</h2><div style="border:1px dashed var(--bd);border-radius:10px;padding:10px;background:#fff">${h}</div></div>`;
}
function webSnippet(){
  const c=cfg(),v=verseDuJour(),up=[];for(let i=0;i<45&&up.length<5;i++){const d=new Date();d.setDate(d.getDate()+i);const ds=iso(d);S.events.filter(e=>occurs(e,ds)).forEach(e=>up.push({ds,e}))}
  const meds=S.medias.filter(m=>m.publie).sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,4);
  const st='font-family:Arial,sans-serif;color:#1b2a2e;max-width:640px;margin:auto';
  return`<div style="${st}">${v.texte?`<div style="background:#e6ecf6;border-radius:12px;padding:18px;text-align:center;margin-bottom:16px"><div style="font-size:12px;color:#1f3f75;text-transform:uppercase;letter-spacing:1px">Verset du jour</div><p style="font-size:18px;font-style:italic;margin:8px 0">« ${esc(v.texte)} »</p><b style="color:#14294d">${esc(v.ref||'')}</b></div>`:''}
<h3 style="color:#14294d;margin:14px 0 6px">Nos cultes</h3><ul style="padding-left:18px;margin:0">${c.programmes.map(p=>`<li>${JOURS[+p.jour]}${p.debut?' '+esc(p.debut)+(p.fin?'–'+esc(p.fin):''):''} : ${esc(p.titre)}</li>`).join('')}</ul>
${up.length?`<h3 style="color:#14294d;margin:14px 0 6px">Prochains événements</h3><ul style="padding-left:18px;margin:0">${up.map(x=>`<li><b>${esc(x.e.titre)}</b> – ${fday(x.ds)}${x.e.heure?' à '+esc(x.e.heure):''}${x.e.lieu?' ('+esc(x.e.lieu)+')':''}</li>`).join('')}</ul>`:''}
${meds.length?`<h3 style="color:#14294d;margin:14px 0 6px">Dernières prédications</h3><ul style="padding-left:18px;margin:0">${meds.map(m=>`<li>${m.lien&&/^https?:\/\//.test(m.lien)?`<a href="${esc(m.lien)}" style="color:#1f3f75">${esc(m.titre)}</a>`:esc(m.titre)} – ${esc(m.predicateur||'')}, ${fdate(m.date)}</li>`).join('')}</ul>`:''}
<p style="font-size:12px;color:#6a7a7f;margin-top:14px">${esc(c.nom)} · <b>${esc(visio(c))}</b>${c.adresse?' · '+esc(c.adresse):''}${c.telephone?' · '+esc(c.telephone):''}</p></div>`;
}

/* ---------- tableau de bord personnalisable ---------- */
function verseDuJour(){const v=cfg().verset||{};if(v.texte)return v;try{const d=new Date(),n=Math.floor((d-new Date(d.getFullYear(),0,0))/864e5),x=VERSETS[n%VERSETS.length];return{texte:x[1],ref:x[0],auto:1}}catch(e){return{}}}
const DBLOCKS=[['today',"À faire aujourd'hui"],['kpis','Chiffres clés'],['quick','Saisie rapide'],['jauges','Jauges (indicateurs)'],['donuts','Graphiques en anneau'],['verset','Verset du jour'],['fin','Histogramme recettes / dépenses'],['resultat','Gain / perte par mois'],['prets','Prêts : encore dû à l\'église'],['crois','Nouveaux membres par mois'],['agenda','7 prochains jours'],['freq','Fréquentation'],['rdv','Rendez-vous du jour'],['salles','Réservations du jour'],['suivis','Suivis en attente'],['anniv','Anniversaires du mois'],['campagnes','Campagnes de dons'],['inscr','Inscriptions aux événements']];
function dashHidden(){try{const v=localStorage.getItem('emt_dash');return v?JSON.parse(v):['crois']}catch(e){return['crois']}}
function vDashboard(){
  const H=dashHidden(),c=cfg(),m=S.members,mois=today().slice(0,7),td=today();
  const actifs=m.filter(x=>x.statut==='Membre actif'||!x.statut).length,nouveaux=m.filter(x=>(x.dateAdhesion||String(x.createdAt||'')).slice(0,7)===mois).length;
  const att=[...S.attendance].sort((a,b)=>(a.date||'').localeCompare(b.date||'')),last4=att.slice(-4),moy=last4.length?Math.round(last4.reduce((s,a)=>s+attTotal(a),0)/last4.length):0;
  const tot=sumAll(accountBalances());
  const B={};
  B.today=backupBanner()+todayCard();B.quick=quickCard();Object.assign(B,dashCharts());
  B.kpis=`<div class="grid4" style="margin-bottom:12px"><div class="card kpi"><div class="l">Membres actifs</div><div class="v">${actifs}</div><div class="s">${m.length} personnes enregistrées</div></div><div class="card kpi"><div class="l">Nouveaux ce mois</div><div class="v">${nouveaux}</div><div class="s">${m.filter(x=>x.statut==='Visiteur').length} visiteurs au total</div></div><div class="card kpi"><div class="l">Présence moyenne</div><div class="v">${moy}</div><div class="s">sur les ${last4.length} derniers cultes</div></div><div class="card kpi"><div class="l">Trésorerie (tous comptes)</div><div class="v" style="font-size:17px">${money(tot.CDF,'CDF')}</div><div class="s">${money(tot.USD,'USD')}</div></div></div>`;
  const v=verseDuJour();B.verset=v.texte?`<div class="card" style="margin-bottom:12px;text-align:center"><div class="muted small">Verset du jour</div><div style="font-style:italic;font-size:16px;margin:6px 0">« ${esc(v.texte)} »</div><b style="color:var(--brand-d)">${esc(v.ref||'')}</b></div>`:'';
  const up=[];for(let i=0;i<7;i++){const d=new Date();d.setDate(d.getDate()+i);const ds=iso(d);dayItems(ds).forEach(x=>up.push({...x,ds}))}
  const card=(t,h)=>`<div class="card">${t?`<h2>${t}</h2>`:''}${h}</div>`;
  const line=(t,s,kind)=>`<div style="display:flex;gap:10px;padding:6px 0;border-top:1px solid var(--bd)">${kind?`<span class="pill k-${kind}" style="width:6px;padding:0;margin:0"></span>`:''}<div style="flex:1;min-width:0"><div style="font-weight:600">${t}</div><div class="muted small">${s}</div></div></div>`;
  B.agenda=card('Les 7 prochains jours',up.length?up.slice(0,10).map(x=>line(esc(x.titre),fday(x.ds)+(x.heure?' · '+esc(x.heure)+(x.fin?'–'+esc(x.fin):''):''),x.kind)).join(''):'<div class="muted">Rien de prévu.</div>');
  B.freq=card('Fréquentation récente',att.length?attChart(att.slice(-8)):'<div class="muted">Aucune présence enregistrée.</div>');
  const rd=S.rdv.filter(r=>r.date===td&&r.statut!=='Annulé').sort((a,b)=>(a.heure||'').localeCompare(b.heure||''));
  B.rdv=card('Rendez-vous du jour',rd.length?rd.map(r=>line(esc(r.heure||'')+' · '+esc(r.membreId?fullName(memberById(r.membreId)||{}):r.nom),esc(r.motif||''))).join(''):'<div class="muted small">Aucun rendez-vous aujourd\'hui.</div>');
  const rs=resItems(td);B.salles=card('Réservations du jour',rs.length?rs.map(x=>line(esc(x.ressource)+' · '+esc(x.objet),x.debut?esc(x.debut)+'–'+esc(x.fin||''):'Journée')).join(''):'<div class="muted small">Aucune réservation aujourd\'hui.</div>');
  const fu=S.followups.filter(f=>f.statut!=='Terminé').sort((a,b)=>(a.echeance||'9').localeCompare(b.echeance||'9'));
  B.suivis=card(`Suivis en attente (${fu.length})`,fu.length?fu.slice(0,6).map(f=>`<div class="row" style="padding:8px 0" data-act="editFollow" data-id="${f.id}"><div class="grow"><div class="t">${esc(f.membreId?fullName(memberById(f.membreId)||{}):f.personne)} · ${esc(f.type)}</div><div class="st">${f.echeance?'Échéance '+fdate(f.echeance):''}</div></div></div>`).join(''):'<div class="muted">Aucun suivi en attente.</div>');
  const bd=m.filter(x=>x.dateNaissance&&x.dateNaissance.slice(5,7)===mois.slice(5)).sort((a,b)=>a.dateNaissance.slice(8).localeCompare(b.dateNaissance.slice(8)));
  B.anniv=card('Anniversaires du mois',bd.length?bd.map(b=>`<div class="row" style="padding:8px 0" data-act="viewMember" data-id="${b.id}">${avatar(b)}<div class="grow"><div class="t">${esc(fullName(b))}</div><div class="st">${parse(b.dateNaissance).toLocaleDateString(LOC(),{day:'numeric',month:'long'})}</div></div></div>`).join(''):'<div class="muted">Aucun anniversaire ce mois-ci.</div>');
  const cp=S.campagnes.filter(x=>x.statut!=='clos'&&(!x.fin||x.fin>=td));B.campagnes=card('Campagnes de dons',cp.length?cp.map(x=>{const r=campReal(x),o=num(x.objectif)||1;return`<div style="margin:8px 0"><div style="display:flex"><b style="flex:1">${esc(x.nom)}</b><span class="small">${money(r,x.devise||'USD')} / ${money(num(x.objectif),x.devise||'USD')}</span></div>${bar(r/o*100)}</div>`}).join(''):'<div class="muted small">Aucune campagne active.</div>');
  const ev=S.events.filter(e=>e.inscriptions&&(e.date||'')>=td);B.inscr=card('Inscriptions aux événements',ev.length?ev.map(e=>{const n=inscrOf(e.id).reduce((s,i)=>s+(num(i.qte)||1),0);return line(esc(e.titre),fday(e.date)+' · '+n+(num(e.places)?' / '+num(e.places):'')+' inscrit(s)')}).join(''):'<div class="muted small">Aucun événement avec inscriptions à venir.</div>');
  const full=['today','quick','kpis','jauges','donuts','verset'],vis=DBLOCKS.map(b=>b[0]).filter(k=>!H.includes(k)&&B[k]);
  const pairs=vis.filter(k=>!full.includes(k));
  return`<div style="display:flex;justify-content:flex-end;margin:-4px 0 8px"><button class="btn sm" data-act="dashCustom">Personnaliser</button></div>`+vis.filter(k=>full.includes(k)).map(k=>B[k]).join('')+`<div class="grid2">${pairs.map(k=>B[k]).join('')}</div>`;
}
function dashCustomForm(){const H=dashHidden();openForm({title:'Personnaliser le tableau de bord',values:{v:DBLOCKS.map(b=>b[0]).filter(k=>!H.includes(k))},fields:[{k:'v',label:'Blocs affichés (sur cet appareil)',type:'multi',full:1,options:DBLOCKS}],onSave:d=>{try{localStorage.setItem('emt_dash',JSON.stringify(DBLOCKS.map(b=>b[0]).filter(k=>!d.v.includes(k))))}catch(e){}render();return true}})}

/* ---------- sites / antennes ---------- */
const SITECOLS=['members','attendance','events','transactions','checkins','lots','plans','inscriptions','rdv','reservations'];
const sites=()=>cfg().sites||[];
function withSite(fn){
  if(!UI.site||sites().length<2)return fn();
  const first=sites()[0],bak={};SITECOLS.forEach(c=>{bak[c]=S[c];S[c]=S[c].filter(x=>(x.site||first)===UI.site)});
  try{return fn()}finally{Object.assign(S,bak)}
}
function siteBar(){const L=sites();if(L.length<2)return'';return`<div style="padding:10px 14px;border-bottom:1px solid var(--bd)"><select class="inp" data-site="1" style="width:100%">${[['','Tous les sites']].concat(L).map(o=>opt(o,UI.site)).join('')}</select></div>`}

/* ---------- langues ---------- */

const TRD={en:{"(finances, rapports),": "(finances, reports),", "(membres, groupes, présences, suivis),": "(members, groups, attendance, follow-ups),", "(tableau de bord et calendrier, sans modification).": "(dashboard and calendar, no changes).", "(tout sauf les paramètres),": "(everything except settings),", "A cessé de venir (raison inconnue)": "Stopped coming (unknown reason)", "A rejoint une autre église": "Joined another church", "Absent répété": "Repeatedly absent", "Absents à accompagner": "Absentees to follow up", "Accueil automatique des nouveaux venus": "Automatic welcome of newcomers", "Achat parcelle": "Plot purchase", "Action de grâce": "Thanksgiving", "Adjoint": "Deputy", "Administrateur": "Administrator", "Adresse": "Address", "Adresse (quartier, commune)": "Address (neighbourhood, district)", "Afficher sur l'encart du site internet": "Show on the website widget", "Aide": "Help", "Ajouter un bloc (glissez la poignée ⠿ ou utilisez ↑ ↓ pour réordonner) :": "Add a block (drag the handle ⠿ or use ↑ ↓ to reorder):", "Ajoutez d'abord des salles ou du matériel": "First add rooms or equipment", "Ajoutez les enveloppes et l'offrande générale.": "Add the envelopes and the general offering.", "Ajoutez vos salles et votre matériel (bouton « Salles & matériel »).": "Add your rooms and equipment (\"Rooms & equipment\" button).", "Album photo": "Photo album", "Alerte si stock ≤": "Alert if stock ≤", "Amortissement annuel": "Annual depreciation", "Analyse": "Analytics", "Ancien": "Elder", "Anglais": "English", "Anniversaire": "Birthday", "Anniversaires d'aujourd'hui": "Today's birthdays", "Anniversaires de la semaine": "Birthdays this week", "Anniversaires du mois": "Birthdays this month", "Annonce": "Announcement", "Annonce générale": "General announcement", "Annuler": "Cancel", "Annulé": "Cancelled", "Année complète": "Full year", "Aperçu": "Preview", "Apparence": "Appearance", "Appel téléphonique": "Phone call", "Articles": "Items", "Assistant IA": "AI assistant", "Au": "To", "Aucun album. Créez le premier !": "No album yet. Create the first one!", "Aucun article. Ajoutez chaises, instruments, sonorisation, vaisselle, fournitures…": "No items. Add chairs, instruments, sound system, dishes, supplies…", "Aucun bien enregistré.": "No assets recorded.", "Aucun bulletin pour le moment.": "No newsletter yet.", "Aucun chant. Ajoutez le répertoire de la chorale.": "No songs. Add the choir's repertoire.", "Aucun envoi enregistré.": "No messages sent yet.", "Aucun formulaire.": "No forms.", "Aucun groupe. Créez vos départements pour y rattacher les membres.": "No groups. Create your departments to assign members.", "Aucun inventaire réalisé.": "No stock count done yet.", "Aucun lot.": "No batches.", "Aucun message. Lancez la discussion !": "No messages. Start the conversation!", "Aucun mouvement.": "No movements.", "Aucun plan. Créez le plan du prochain culte.": "No plan. Create the plan for the next service.", "Aucun projet. Cliquez sur « + Nouveau projet » pour commencer.": "No projects. Click \"+ New project\" to start.", "Aucun prêt en cours.": "No current loans.", "Aucun rendez-vous aujourd'hui.": "No appointments today.", "Aucun rendez-vous.": "No appointments.", "Aucun rôle.": "No roles.", "Aucun rôle. Exemples : Accueil, Protocole, Sonorisation, Chorale, Intercession, Offrandes, Moniteur.": "No roles. Examples: Welcome, Ushers, Sound, Choir, Intercession, Offerings, Teacher.", "Aucun sondage.": "No polls.", "Aucun suivi ici.": "No follow-ups here.", "Aucun événement avec inscriptions à venir.": "No upcoming events with registration.", "Aucun événement avec inscriptions.": "No events with registration.", "Aucune": "None", "Aucune activité enregistrée pour l'instant.": "No activity recorded yet.", "Aucune campagne active.": "No active campaign.", "Aucune contribution liée à un membre cette année. Choisissez le membre lors de la saisie d'une dîme ou d'un don.": "No contribution linked to a member this year. Choose the member when entering a tithe or gift.", "Aucune contribution liée à un membre pour cette année.": "No contribution linked to a member for this year.", "Aucune indisponibilité à venir.": "No upcoming unavailability.", "Aucune ligne.": "No lines.", "Aucune opération.": "No transactions.", "Aucune prédication enregistrée.": "No sermon recorded.", "Aucune réservation aujourd'hui.": "No bookings today.", "Aujourd'hui": "Today", "Auteur / artiste": "Author / artist", "Autre": "Other", "Autre entrée": "Other income", "Autre sortie": "Other expense", "Avancement": "Progress", "Avec": "With", "Banque": "Bank", "Baptisé(e) par immersion": "Baptised by immersion", "Baptême": "Baptism", "Baptêmes": "Baptisms", "Bienvenue à un visiteur": "Welcome a visitor", "Bon": "Good", "Budget": "Budget", "Bulletin": "Newsletter", "Bâtiment": "Building", "Bâtiments, terrain (parcelle), véhicules, sonorisation, mobilier… Amortissement linéaire.": "Buildings, land (plot), vehicles, sound system, furniture… Straight-line depreciation.", "Bénévole": "Volunteer", "Bénévoles": "Volunteers", "Caisse (espèces)": "Cash box", "Caisse générale": "General fund", "Calendrier": "Calendar", "Campagnes de dons": "Giving campaigns", "Case Oui": "Yes checkbox", "Cases multiples": "Multiple checkboxes", "Catégorie": "Category", "Catégorie de recette": "Income category", "Catégories d'entrées": "Income categories", "Catégories d'entrées (une par ligne)": "Income categories (one per line)", "Catégories de sorties": "Expense categories", "Catégories de sorties (une par ligne)": "Expense categories (one per line)", "Ce que l'application ne fait pas": "What the app does not do", "Changer mon code": "Change my code", "Chant": "Song", "Chants": "Songs", "Chaque mois": "Every month", "Chaque personne avec qui vous partagez la page apparaît ici après sa première connexion. Choisissez ce qu'elle peut voir :": "Each person you share the page with appears here after their first login. Choose what they can see:", "Chaque compte apparaît ici après sa première connexion. Choisissez ce qu'il peut voir :": "Each account appears here after its first login. Choose what it can see:", "Chaque semaine": "Every week", "Chef de famille": "Head of family", "Choisir les personnes…": "Choose people…", "Choix ou candidats (un par ligne)": "Choices or candidates (one per line)", "Choix séparés par des virgules": "Choices separated by commas", "Chorale, jeunesse, mamans, papas, intercesseurs, protocole, école du dimanche…": "Choir, youth, mothers, fathers, intercessors, ushers, Sunday school…", "Choriste": "Choir member", "Classique": "Classic", "Clôture des inscriptions": "Registration closes", "Clôturer et enregistrer le dépôt": "Close and record the deposit", "Cochez « Ouvrir les inscriptions » dans un événement (Calendrier ou ici) pour gérer participants, billets et paiements.": "Tick \"Open registration\" in an event (Calendar or here) to manage participants, tickets and payments.", "Collecte du dimanche (enveloppes)": "Sunday collection (envelopes)", "Combien de nouveaux venus cette année et quels groupes grandissent ?": "How many newcomers this year and which groups are growing?", "Commencer un inventaire": "Start a stock count", "Comment la présence du dimanche a-t-elle évolué ces derniers mois ?": "How has Sunday attendance changed in recent months?", "Communication": "Communication", "Comptage": "Headcount", "Comptage après chaque culte ou réunion.": "Headcount after each service or meeting.", "Compte": "Account", "Compte (où est l'argent)": "Account (where the money is)", "Compte achat parcelle": "Plot purchase account", "Compte de résultat – dépenses": "Income statement – expenses", "Compte de résultat – recettes": "Income statement – income", "Comptes": "Accounts", "Comptes : caisse, banque, mobile money (un par ligne)": "Accounts: cash, bank, mobile money (one per line)", "Comptez réellement chaque article (par exemple une fois par an). Les écarts sont enregistrés comme ajustements et un procès-verbal PDF est produit.": "Physically count each item (e.g. once a year). Differences are recorded as adjustments and a PDF report is produced.", "Compté par": "Counted by", "Configurer": "Configure", "Confirmer le code": "Confirm the code", "Confirmé": "Confirmed", "Confié à": "Assigned to", "Conférence / séminaire": "Conference / seminar", "Conjoint(e)": "Spouse", "Connexion protégée par votre compte Claude et votre code personnel.": "Login protected by your Claude account and your personal code.", "Connexion protégée par votre compte Claude.": "Login protected by your Claude account.", "Conseil, prière, mariage, baptême…": "Counselling, prayer, marriage, baptism…", "Consultation seulement (aucune modification)": "View only (no changes)", "Contacts de l'église": "Church contacts", "Contribution parcelle": "Plot contribution", "Copier dans la fiche membre": "Copy into member record", "Copier le code HTML": "Copy the HTML code", "Copier le message": "Copy the message", "Copier les numéros": "Copy the numbers", "Copier les e-mails": "Copy the e-mails", "Copier pour WhatsApp": "Copy for WhatsApp", "Croissance": "Growth", "Créer votre code": "Create your code", "Créez d'abord des groupes dans « Groupes & départements ».": "First create groups in \"Groups & departments\".", "Créez un budget ou une campagne": "Create a budget or a campaign", "Créez un bulletin hebdomadaire à imprimer ou partager sur WhatsApp.": "Create a weekly newsletter to print or share on WhatsApp.", "Culte": "Service", "Culte & bénévoles": "Worship & volunteers", "Culte / réunion": "Service / meeting", "Culte du dimanche": "Sunday service", "Culte spécial": "Special service", "Cultes, baptêmes, mariages, évangélisation, travaux de la parcelle…": "Services, baptisms, weddings, evangelism, work on the plot…", "Célibataire": "Single", "Date": "Date", "Date (début de semaine)": "Date (start of week)", "Date d'acquisition": "Acquisition date", "Date d'arrivée / adhésion": "Arrival / joining date", "Date de départ (si parti)": "Departure date (if left)", "Date de fin": "End date", "Date de mariage": "Wedding date", "Date de naissance": "Date of birth", "Date du baptême": "Baptism date", "Date du départ": "Departure date", "Demande de prière": "Prayer request", "Demandé": "Requested", "Depuis le compte": "From account", "Dernier culte": "Last service", "Description": "Description", "Deuil / funérailles": "Bereavement / funeral", "Devise": "Currency", "Devise du budget": "Budget currency", "Diaconesse": "Deaconess", "Diacre": "Deacon", "Dim": "Sun", "Dimanche": "Sunday", "Discussion entre les personnes qui ont accès à l'application.": "Chat between people who have access to the app.", "Discussions": "Chats", "Disponibilités hebdomadaires": "Weekly availability", "Divorcé(e)": "Divorced", "Dollars ($)": "Dollars ($)", "Don": "Gift", "Donateurs identifiés": "Identified donors", "Dons": "Giving", "Dons par mois (équivalent $)": "Giving per month ($ equivalent)", "Dont visiteurs": "Of which visitors", "Durée (min)": "Duration (min)", "Début": "Start", "Décès": "Death", "Définissez des rôles et créez des plans de culte.": "Define roles and create service plans.", "Déménagement / changement de ville": "Moved / changed city", "Départ": "Departure", "Départs": "Departures", "Départs sur la période": "Departures in the period", "Dépenses": "Expenses", "Déposé sur le compte": "Deposited to account", "Désaccord / conflit": "Disagreement / conflict", "Désactivé": "Disabled", "Désignation": "Description", "Détails": "Details", "Dîme": "Tithe", "E-mail": "E-mail", "Effectif en fin de mois": "Membership at month end", "Emplacement": "Location", "Emplacement / n° de série": "Location / serial number", "En attente": "Pending", "En cours": "In progress", "En panne": "Broken", "En panne / réparation": "Broken / under repair", "En retard": "Late", "En réparation": "Under repair", "Encart pour le site internet de l'église": "Widget for the church website", "Encart site internet": "Website widget", "Enfant": "Child", "Enfants": "Children", "Enregistrer": "Save", "Enregistrer comme modèle": "Save as template", "Enregistrer dans l'historique": "Save to history", "Enregistrer et entrer": "Save and enter", "Enregistrer les présences": "Record attendance", "Enseignement": "Teaching", "Entretien": "Maintenance", "Entrées du mois": "Income this month", "Entrées par catégorie": "Income by category", "Enveloppes": "Envelopes", "Envoyer": "Send", "Ex. « Responsable chorale » : Culte & bénévoles + Calendrier. Les rôles créés apparaissent dans la liste des utilisateurs.": "E.g. \"Choir leader\": Worship & volunteers + Calendar. Created roles appear in the user list.", "Famille / foyer": "Family / household", "Familles": "Families", "Femme": "Woman", "Femmes": "Women", "Fiche d'accueil des visiteurs, demande de baptême, inscription à l'école du dimanche, demande de prière…": "Visitor welcome card, baptism request, Sunday school registration, prayer request…", "Fidèle": "Member", "Filtres": "Filters", "Filtres · IA": "Filters · AI", "Fin": "End", "Finances": "Finances", "Fonction dans l'église": "Role in the church", "Fonds": "Funds", "Fonds (affectation)": "Fund (allocation)", "Fonds (caisse du projet)": "Fund (project cash box)", "Fonds / affectations (un par ligne)": "Funds / allocations (one per line)", "Formulaires": "Forms", "Formulaires & votes": "Forms & votes", "Francs congolais": "Congolese francs", "Francs congolais (FC)": "Congolese francs (FC)", "Français": "French", "Fréquentation récente": "Recent attendance", "Glisser pour déplacer": "Drag to move", "Grille du mois": "Monthly grid", "Groupes": "Groups", "Groupes & départements": "Groups & departments", "Groupes / départements": "Groups / departments", "Heure": "Time", "Historique": "History", "Homme": "Man", "Hommes": "Men", "Hommes et femmes": "Men and women", "Honoraires": "Fees", "Hors service": "Out of service", "Immobilisations": "Fixed assets", "Importer": "Import", "Inactif": "Inactive", "Indicateurs": "Indicators", "Indisponibilité": "Unavailability", "Indisponibilités": "Unavailability", "Informations de l'église": "Church information", "Informatique": "IT equipment", "Inscriptions": "Registrations", "Inscriptions aux événements": "Event registrations", "Intitulé": "Title", "Inventaire": "Inventory", "Inventaire physique": "Stock count", "Invitation à un événement": "Event invitation", "Jeu": "Thu", "Jeudi": "Thursday", "Jour": "Day", "Journal PDF": "PDF journal", "Journal d'activité": "Activity log", "Jusqu'au (si répété)": "Until (if repeated)", "L'assistant IA (Rapports → Assistant IA) répond sur vos données ; ce guide explique l'utilisation.": "The AI assistant (Reports → AI assistant) answers about your data; this guide explains how to use the app.", "Langue": "Language", "Langue des menus": "Menu language", "Le dimanche": "On Sunday", "Lecteur": "Reader", "Lecteur (consultation)": "Reader (view only)", "Lecture seule": "Read only", "Les comptes se modifient dans Paramètres → Informations de l'église.": "Accounts are edited in Settings → Church information.", "Libellé / motif": "Label / reason", "Lien (vidéo, partition)": "Link (video, sheet music)", "Lien dans la famille": "Family relationship", "Lien vidéo / audio (YouTube, Facebook…)": "Video / audio link (YouTube, Facebook…)", "Lieu / adresse": "Place / address", "Liste de choix": "Choice list", "Lots & enveloppes": "Batches & envelopes", "Louange": "Praise", "Louange & adoration (chorale)": "Praise & worship (choir)", "Louange, adoration, grâce…": "Praise, worship, grace…", "Loyer": "Rent", "Lun": "Mon", "Lundi": "Monday", "Malade": "Sick", "Mar": "Tue", "Mardi": "Tuesday", "Mariage": "Wedding", "Marié(e)": "Married", "Matériel": "Equipment", "Matériel (un par ligne : Nom;quantité)": "Equipment (one per line: Name;quantity)", "Matériel / sono": "Equipment / sound", "Matériel prêté et pas encore rendu (enregistrez un « Prêt » puis un « Retour de prêt » avec la même personne).": "Equipment lent and not yet returned (record a \"Loan\" then a \"Loan return\" with the same person).", "Membre": "Member", "Membre (dîme, don…)": "Member (tithe, gift…)", "Membre actif": "Active member", "Membre concerné": "Member concerned", "Membres": "Members", "Membres actifs": "Active members", "Membres par statut": "Members by status", "Mer": "Wed", "Mercredi": "Wednesday", "Mes disponibilités": "My availability", "Message après l'envoi": "Message after sending", "Message d'introduction": "Introduction message", "Messages": "Messages", "Mobilier": "Furniture", "Mode borne": "Kiosk mode", "Mode tablette": "Tablet mode", "Modifier": "Edit", "Modifier l'événement": "Edit event", "Modifier le programme": "Edit programme", "Modifier le suivi": "Edit follow-up", "Modifier les rôles": "Edit roles", "Modifier la fiche": "Edit record", "Modifier le projet": "Edit project", "Mois": "Month", "Moniteur (école du dimanche)": "Teacher (Sunday school)", "Montant": "Amount", "Motif": "Reason", "Motif du départ": "Reason for leaving", "Motifs de départ": "Reasons for leaving", "Mouvements": "Movements", "Moyenne mensuelle": "Monthly average", "Médiathèque": "Media library", "Nom": "Name", "Nom de l'église": "Church name", "Nom du groupe": "Group name", "Nom du rôle": "Role name", "Nombre": "Number", "Nombre de places": "Number of places", "Nos cultes": "Our services", "Note / responsable": "Note / person in charge", "Notes": "Notes", "Notes (prédicateur, thème…)": "Notes (preacher, theme…)", "Notes / compte rendu": "Notes / report", "Notes / historique": "Notes / history", "Notes / premières lignes": "Notes / first lines", "Notes de la prédication": "Sermon notes", "Nouveau bien": "New asset", "Nouveau chant": "New song", "Nouveau code": "New code", "Nouveau converti": "New convert", "Nouveau groupe": "New group", "Nouveau programme": "New programme", "Nouveau projet": "New project", "Nouveau rendez-vous": "New appointment", "Nouveau rôle": "New role", "Nouveau sondage / élection": "New poll / election", "Nouveau suivi": "New follow-up", "Nouveaux": "New", "Nouveaux ce mois": "New this month", "Nouveaux membres": "New members", "Nouveaux membres par mois": "New members per month", "Nouveaux par mois": "New per month", "Nouveaux sur la période": "New in the period", "Nouvel album": "New album", "Nouvel article": "New item", "Nouvel événement": "New event", "Nouvelle entrée de caisse": "New cash income", "Nouvelle sortie de caisse": "New cash expense", "Nouvelle personne": "New person", "Nouvelle prédication / vidéo": "New sermon / video", "Nouvelle ville / église": "New city / church", "Nouvelle ville / nouvelle église": "New city / new church", "N° de bon": "Voucher no.", "N° de pièce": "Document no.", "N° de série / marque": "Serial no. / brand", "N° du lot": "Batch no.", "Objectif": "Target", "Objectif financier": "Financial target", "Offrande": "Offering", "Opérations": "Transactions", "Ordre du culte": "Order of service", "Ordre du culte, chants et équipe de service.": "Order of service, songs and service team.", "Ou nom": "Or name", "Ou nom (si non enregistré)": "Or name (if not registered)", "Ou nom (visiteur)": "Or name (visitor)", "Ouvrier": "Worker", "Ouvriers et responsables": "Workers and leaders", "Ouvrir les inscriptions": "Open registration", "Où se trouve l'argent : caisse, banque, mobile money.": "Where the money is: cash, bank, mobile money.", "Par sexe": "By gender", "Par statut": "By status", "Par tranche d'âge": "By age group", "Paragraphe": "Paragraph", "Paramètres": "Settings", "Parent": "Parent", "Partager (WhatsApp)": "Share (WhatsApp)", "Parti(e)": "Left", "Pas de lien membre": "No member link", "Passage biblique": "Bible passage", "Pasteur": "Pastor", "Pasteur / ancien": "Pastor / elder", "Pasteur principal": "Senior pastor", "Personnaliser": "Customize", "Personne d'autre ne s'est encore connecté.": "Nobody else has logged in yet.", "Personnes (filtre)": "People (filter)", "Plans de culte": "Service plans", "Pointage par nom": "Check-in by name", "Posez une question sur les membres, la présence, les finances ou les suivis. L'assistant lit un résumé des données de l'application ; il ne peut rien modifier.": "Ask a question about members, attendance, finances or follow-ups. The assistant reads a summary of the app's data; it cannot change anything.", "Postnom": "Middle name", "Premiers pas": "Getting started", "Prochains créneaux libres": "Next free slots", "Prochains événements": "Upcoming events", "Profession": "Occupation", "Programme de la semaine": "This week's programme", "Programme hebdomadaire": "Weekly programme", "Programmes hebdomadaires": "Weekly programmes", "Projets & collectes": "Projects & collections", "Projets & promesses": "Projects & pledges", "Projets / collecte": "Projects / collection", "Prédicateur / intervenant": "Preacher / speaker", "Prédication": "Sermon", "Prédications & vidéos": "Sermons & videos", "Prénom": "First name", "Présence au dernier culte": "Attendance at last service", "Présence moy.": "Avg. attendance", "Présence moyenne": "Average attendance", "Présence moyenne par mois": "Average attendance per month", "Présences": "Attendance", "Présent": "Present", "Présentation d'enfant": "Child dedication", "Prêts en cours": "Current loans", "Quantité": "Quantity", "Quelles dépenses ont le plus augmenté ?": "Which expenses increased the most?", "Question": "Question", "Question / poste à pourvoir": "Question / position to fill", "Rappel du culte": "Service reminder", "Rapport PDF": "PDF report", "Rapport mensuel": "Monthly report", "Rapports": "Reports", "Rapprochement": "Reconciliation", "Rapprocher": "Reconcile", "Recettes": "Income", "Recettes (en dollars)": "Income (in dollars)", "Recettes du mois (équiv. $)": "Income this month ($ equiv.)", "Recettes et dépenses (6 mois, équiv. $)": "Income and expenses (6 months, $ equiv.)", "Rechercher par titre, tonalité, thème…": "Search by title, key, theme…", "Rechercher titre, prédicateur, passage…": "Search title, preacher, passage…", "Rechercher un article, un emplacement…": "Search an item, a location…", "Rechercher un nom, un téléphone…": "Search a name, a phone…", "Rechercher…": "Search…", "Relevés": "Statements", "Rendez-vous": "Appointments", "Rendez-vous du jour": "Today's appointments", "Responsable": "Leader", "Responsable de département": "Department leader", "Restaurer…": "Restore…", "Retour au village / à l'étranger": "Returned home / abroad", "Reçu de (si non membre)": "Received from (if not a member)", "Rien pour cette semaine.": "Nothing this week.", "Rien de prévu.": "Nothing planned.", "Réalisé": "Actual", "Référence": "Reference", "Répartitions": "Breakdowns", "Répétition": "Rehearsal", "Réservable (apparaît dans Salles & matériel)": "Bookable (appears in Rooms & equipment)", "Réservations du jour": "Today's bookings", "Résultat": "Result", "Résume les recettes par catégorie ce trimestre.": "Summarise income by category this quarter.", "Résumé": "Summary", "Réunion": "Meeting", "Réunion (jour et heure)": "Meeting (day and time)", "Réunion spéciale": "Special meeting", "Réunions comptées": "Meetings counted", "Rôles de service": "Service roles", "Rôles personnalisés": "Custom roles", "Saisie rapide": "Quick entry", "Saisissez le solde du relevé": "Enter the statement balance", "Saisissez les enveloppes de la collecte, vérifiez, puis clôturez : les recettes sont enregistrées en une fois dans la comptabilité.": "Enter the collection envelopes, check, then close: the income is recorded in the accounts in one go.", "Salle réservée": "Booked room", "Salles & matériel": "Rooms & equipment", "Salles (une par ligne : Nom;capacité)": "Rooms (one per line: Name;capacity)", "Sam": "Sat", "Samedi": "Saturday", "Sauvegarde des données": "Data backup", "Se déconnecter": "Log out", "Se connecter": "Log in", "Secrétaire": "Secretary", "Sexe": "Gender", "Sigle": "Acronym", "Signature": "Signature", "Sites / antennes (un par ligne, le premier = site principal ; laisser vide si un seul)": "Sites / branches (one per line, the first = main site; leave empty if only one)", "Social / assistance": "Social / assistance", "Solde du relevé": "Statement balance", "Solde pointé": "Ticked balance", "Solde selon vos livres": "Balance per your books", "Sondage": "Poll", "Sondages & élections": "Polls & elections", "Sonorisation / instruments": "Sound / instruments", "Sortie / retraite": "Outing / retreat", "Sorties du mois": "Expenses this month", "Sorties par catégorie": "Expenses by category", "Sortir": "Log out", "Statut": "Status", "Stock bas": "Low stock", "Suivis": "Follow-ups", "Suivis pastoraux": "Pastoral care", "Suivis pastoraux réalisés": "Pastoral follow-ups done", "Suivis terminés": "Follow-ups completed", "Supprimer": "Delete", "Sécurité": "Security", "Sécurité et sauvegarde": "Security and backup", "Série": "Series", "Tableau de bord": "Dashboard", "Taux du jour": "Today's rate", "Terminé": "Done", "Terminés": "Completed", "Terminés ce mois": "Completed this month", "Terrain": "Land", "Texte": "Text", "Texte WhatsApp": "WhatsApp text", "Texte court": "Short text", "Texte du verset": "Verse text", "Thème": "Theme", "Titre": "Title", "Titre affiché (ex. Visionnaire)": "Displayed title (e.g. Visionary)", "Titre du chant": "Song title", "Tonalité": "Key", "Total": "Total", "Total tous comptes": "Total all accounts", "Tous": "All", "Tous les articles": "All items", "Tous les comptes": "All accounts", "Tous les fonds": "All funds", "Tous les groupes": "All groups", "Tous les responsables": "All leaders", "Tous les statuts": "All statuses", "Tout afficher": "Show all", "Tout cocher": "Tick all", "Tout le monde (sauf inactifs)": "Everyone (except inactive)", "Toutes catégories": "All categories", "Toutes les 2 semaines": "Every 2 weeks", "Traduire : Anglais": "Translate: English", "Traduire : Lingala": "Translate: Lingala", "Traduire : Swahili": "Translate: Swahili", "Transport": "Transport", "Trésorerie (tous comptes)": "Cash position (all accounts)", "Trésorier": "Treasurer", "Type": "Type", "Télécharger la sauvegarde": "Download the backup", "Téléchargez régulièrement une copie complète (fichier .json). Elle permet de tout restaurer en cas de problème.": "Regularly download a full copy (.json file). It lets you restore everything if something goes wrong.", "Téléphone": "Phone", "Témoignage": "Testimony", "Un projet = une récolte de fonds (achat de la parcelle, construction, mission…). Chaque dimanche, enregistrez les contributions et les noms des personnes.": "A project = a fundraising (plot purchase, construction, mission…). Every Sunday, record the contributions and the people's names.", "Un rôle par ligne : Nom;nombre requis": "One role per line: Name;number required", "Une question ?": "A question?", "Unité": "Unit", "Usé": "Worn", "Utilisateurs et rôles": "Users and roles", "Valeur d'acquisition": "Acquisition value", "Valeur estimée": "Estimated value", "Valeur nette actuelle": "Current net value", "Valeur résiduelle": "Residual value", "Valeur unitaire": "Unit value", "Valider le rapprochement": "Validate reconciliation", "Veillée de prière": "Prayer vigil", "Ven": "Fri", "Vendredi": "Friday", "Verre (transparent)": "Glass (transparent)", "Vers le compte": "To account", "Verset biblique": "Bible verse", "Verset du jour": "Verse of the day", "Veuf / veuve": "Widowed", "Ville": "City", "Virement entre comptes": "Transfer between accounts", "Visionnaire :": "Visionary:", "Visite à domicile": "Home visit", "Visiteur": "Visitor", "Visiteurs": "Visitors", "Visiteurs et nouveaux convertis": "Visitors and new converts", "Vote anonyme (les noms des votants ne sont pas affichés)": "Anonymous vote (voters' names are not shown)", "Vote ouvert": "Voting open", "Votes en ligne (personnes ayant accès à l'application) et/ou saisie des voix d'une assemblée.": "Online votes (people with access to the app) and/or entering the votes of an assembly.", "Votre message…": "Your message…", "Votre question…": "Your question…", "Vous nous avez manqué": "We missed you", "Véhicule": "Vehicle", "automatique": "automatic", "des membres actifs ont donné": "of active members gave", "ex. Dépôt des offrandes à la banque": "e.g. Depositing offerings at the bank", "ex. Sol, Ré": "e.g. G, D", "ex. Samedi 14h": "e.g. Saturday 2pm", "min": "min", "minutes": "minutes", "non budgété": "not budgeted", "requis": "required", "À faire": "To do", "À faire aujourd'hui": "To do today", "À venir": "Upcoming", "Écart": "Difference", "Échéance": "Due date", "École de prière": "Prayer school", "École du dimanche": "Sunday school", "Écrans visibles": "Visible screens", "Écrivez votre message… Utilisez {prenom} pour personnaliser.": "Write your message… Use {prenom} to personalise.", "Élection": "Election", "Électricité / eau": "Electricity / water", "Émission (studio)": "Broadcast (studio)", "Équipe de service": "Service team", "État": "Condition", "État civil": "Marital status", "États financiers": "Financial statements", "États financiers PDF": "Financial statements PDF", "Évangélisation": "Evangelism", "Évangélisation / mission": "Evangelism / mission", "Évangéliste": "Evangelist", "Évolution de l'effectif": "Membership change", "Évolution mois par mois": "Month by month", "Événement": "Event", "Événements & salles": "Events & rooms", "Événements du mois": "Events this month", "— Choisir un modèle —": "— Choose a template —", "‹ Bulletins": "‹ Newsletters", "‹ Formulaires": "‹ Forms", "‹ Lots": "‹ Batches", "‹ Plans": "‹ Plans", "‹ Projets": "‹ Projects", "‹ Albums": "‹ Albums", "‹ Événements": "‹ Events", "→ Adresse": "→ Address", "→ E-mail": "→ E-mail", "→ Naissance": "→ Birth date", "→ Nom": "→ Name", "→ Postnom": "→ Middle name", "→ Prénom": "→ First name", "→ Sexe (M/F)": "→ Gender (M/F)", "→ Téléphone": "→ Phone", "⇄ Virement": "⇄ Transfer", "≈ total $": "≈ total $", "✓ Terminé": "✓ Done", "✨ Améliorer le ton": "✨ Improve the tone", "✨ Proposer un verset (IA)": "✨ Suggest a verse (AI)", "📖 Choisir dans la liste": "📖 Choose from the list", "📖 Choisir un passage dans la liste": "📖 Choose a passage from the list", "📖 Insérer un verset": "📖 Insert a verse", "+ Ajouter": "+ Add", "+ Entrée": "+ Income", "− Sortie": "− Expense", "+ Offrande": "+ Offering", "+ Dîme": "+ Tithe", "+ Autre recette": "+ Other income", "− Dépense": "− Expense", "+ Nouveau projet": "+ New project", "+ Collecte du jour": "+ Today's collection", "+ Une contribution": "+ One contribution", "+ Promesse": "+ Pledge", "+ Suivi": "+ Follow-up", "+ Nouveau suivi": "+ New follow-up", "+ Nouveau groupe": "+ New group", "+ Événement": "+ Event", "+ Enregistrer": "+ Record", "+ Nouvel album": "+ New album", "+ Ajouter des photos": "+ Add photos", "+ Article": "+ Item", "+ Rendez-vous": "+ Appointment", "+ Formulaire": "+ Form", "+ Fiche visiteur prête": "+ Ready-made visitor card", "+ Sondage / élection": "+ Poll / election", "+ Prédication / vidéo": "+ Sermon / video", "+ Nouveau plan": "+ New plan", "+ Chant": "+ Song", "+ Indisponibilité": "+ Unavailability", "+ Nouveau lot": "+ New batch", "+ Ligne": "+ Line", "+ Offrande générale (anonyme)": "+ General offering (anonymous)", "+ Nouveau bulletin": "+ New newsletter", "+ Réserver": "+ Book", "+ Inscription": "+ Registration", "+ Ajouter un bien": "+ Add an asset", "+ Rôle": "+ Role", "+ Question": "+ Question", "+ Élément": "+ Item", "+ Section": "+ Section", "+ Présences": "+ Attendance", "+ Événement ce jour": "+ Event on this day", "+ 5 lignes": "+ 5 lines", "Fiche PDF": "Record PDF", "Attestation PDF": "Certificate PDF", "Rendu": "Returned", "Rappel": "Reminder", "Réintégrer": "Reinstate", "Souhaiter": "Send wishes", "Inviter": "Invite", "Paiement": "Payment", "Réponses": "Responses", "Couverture": "Cover", "Légende": "Caption", "Télécharger": "Download", "Fermer": "Close", "Effacer": "Clear", "Valider": "Validate", "Clôturer": "Close", "Restaurer": "Restore", "Confirmation": "Confirmation", "Supprimer définitivement cet élément ?": "Delete this item permanently?", "Supprimé": "Deleted", "Fiche enregistrée": "Record saved", "Mon espace": "My space", "Mon accès": "My access", "Ma fiche": "My record", "Mes contributions": "My contributions", "Votes en cours": "Current votes", "Demander": "Request", "M'inscrire": "Register", "Remplir": "Fill in", "Modifier mes coordonnées": "Edit my details", "Demander un rendez-vous": "Request an appointment", "Mes coordonnées": "My details", "Connexion": "Log in", "Créer un compte": "Create an account", "Mot de passe oublié ?": "Forgot password?", "Mot de passe": "Password", "Adresse e-mail": "E-mail address", "Créer mon compte": "Create my account", "Nom complet": "Full name", "Continuer avec Google": "Continue with Google", "ou": "or", "Bon retour": "Welcome back", "Bienvenue": "Welcome", "Code oublié ?": "Forgot code?", "Code d'accès": "Access code", "Entrer": "Enter", "Chargement…": "Loading…", "Ce qu'il faut retenir": "Key takeaways", "Graphiques": "Charts", "Rapport de": "Report for", "Contributeurs": "Contributors", "Collectes": "Collections", "Collectes par date": "Collections by date", "Total récolté": "Total collected", "Reste à récolter": "Remaining to collect", "Détail des contributions": "Contribution details", "Enregistrer une collecte": "Record a collection", "Saisissez en une fois toutes les personnes qui ont contribué aujourd'hui.": "Enter in one go everyone who contributed today.", "Enregistrer la collecte": "Save the collection", "Fois": "Times", "Personnes": "People", "Promis": "Pledged", "Hors projets (offrandes, dîmes…)": "Outside projects (offerings, tithes…)", "Tous (projets ou non)": "All (projects or not)", "Recettes par projet": "Income by project", "Ce mois-ci": "This month", "Arrivé(e) du (mois)": "Arrived from (month)", "au (mois)": "to (month)", "Effacer les filtres": "Clear filters", "Envoyer un message à ce résultat": "Send a message to these results", "Rechercher avec l'IA": "Search with AI", "Âge min.": "Min. age", "Âge max.": "Max. age", "Présent 30 derniers jours": "Present last 30 days", "Liste": "List", "Famille": "Family", "Toutes": "All", "Oui": "Yes", "Non": "No", "Non (absent)": "No (absent)", "Hommes / Femmes": "Men / Women", "Évolution (12 dernières réunions)": "Trend (last 12 meetings)", "Les 7 prochains jours": "The next 7 days", "Chiffres clés": "Key figures", "Jauges (indicateurs)": "Gauges (indicators)", "Graphiques en anneau": "Donut charts", "Histogramme recettes / dépenses": "Income / expense histogram", "Personnaliser le tableau de bord": "Customize the dashboard", "Blocs affichés (sur cet appareil)": "Blocks shown (on this device)", "Aucun comptage": "No headcount", "Pas encore de données.": "No data yet.", "Recettes et dépenses (6 mois, équivalent $)": "Income and expenses (6 months, $ equivalent)", "Accueillir": "Welcome", "Exporter": "Export", "Excel": "Excel", "PDF": "PDF", "SMS": "SMS", "WhatsApp": "WhatsApp", "Lingala": "Lingala", "Swahili": "Swahili", "Tshiluba": "Tshiluba", "Kikongo": "Kikongo", "English": "English", "Kiswahili": "Kiswahili", "Traduit les menus, onglets et boutons principaux sur cet appareil ; les textes détaillés restent en français.": "Translates the interface on this device; your own data (names, notes…) stays as typed.", "Dernière connexion :": "Last login:", "Rôle :": "Role:", "Pour obtenir plus d'accès, demandez à l'administrateur de l'application.": "To get more access, ask the app administrator.", "Quitter": "Exit", "Quitter le mode borne (code requis)": "Exit kiosk mode (code required)", "Enregistrez votre présence": "Record your attendance", "Tapez votre numéro de téléphone": "Type your phone number", "Me trouver": "Find me", "Nouvelle réponse": "New response", "Code administrateur": "Admin code", "Activé": "Enabled", "Actif": "Active", "Ouvert": "Open", "Clos": "Closed", "Clôturé": "Closed", "Réservé": "Booked", "Libre": "Free", "Disponible": "Available", "Payé": "Paid", "Gratuit": "Free", "À payer": "To pay", "Accepté": "Accepted", "Refusé": "Declined", "Equipe": "Team", "personne(s)": "person(s)", "personnes enregistrées": "people registered", "visiteurs au total": "visitors in total", "contribution(s)": "contribution(s)", "contributeur(s)": "contributor(s)", "élément(s)": "item(s)", "réponse(s)": "response(s)", "champ(s)": "field(s)", "photo(s)": "photo(s)", "inscrit(s)": "registered", "opération(s) non rapprochée(s)": "unreconciled transaction(s)", "bloc(s)": "block(s)", "membre(s)": "member(s)", "sur les": "over the", "derniers cultes": "last services", "derniers mois": "last months", "dernières réunions": "last meetings", "Créer le budget": "Create the budget", "Participation": "Participation", "Par catégorie": "By category", "Contributions par membre – année": "Contributions per member – year", "Absents": "Absent", "Présents": "Present", "Suivis en attente": "Pending follow-ups", "Opérations à pointer": "Transactions to tick", "Solde": "Balance", "Recettes et dépenses par mois (équivalent $)": "Income and expenses per month ($ equivalent)", "3 derniers mois": "Last 3 months", "6 derniers mois": "Last 6 months", "12 derniers mois": "Last 12 months", "24 derniers mois": "Last 24 months", "Anniversaires des 7 prochains jours": "Birthdays in the next 7 days", "Dépense": "Expense", "Recette": "Income", "Choisissez un code de 4 à 6 chiffres. Il vous sera demandé à chaque ouverture.": "Choose a 4 to 6 digit code. You will be asked for it each time you open the app.", "Durée d'amortissement (ans, 0 = terrain)": "Depreciation period (years, 0 = land)", "Définissez vos disponibilités (ex. mardi 10:00–12:00) pour voir les créneaux libres.": "Set your availability (e.g. Tuesday 10:00–12:00) to see free slots.", "Faites le pointage par nom pendant au moins 2 cultes : les membres absents à toutes les dernières réunions apparaîtront ici.": "Check in by name for at least 2 services: members absent from all recent meetings will appear here.", "L'application se verrouille après 15 minutes sans activité. Votre code d'accès vous est personnel : personne d'autre, même l'administrateur, ne peut le voir.": "The app locks after 15 minutes of inactivity. Your access code is personal: nobody else, not even the administrator, can see it.", "Mobile money": "Mobile money", "Du": "From", "Taux : 1 $ = … FC": "Rate: 1 $ = … FC", "Total $": "Total $", "Total FC": "Total FC", "Types de billets (un par ligne : Nom;prix;devise) — ex. Adulte;10;USD": "Ticket types (one per line: Name;price;currency) — e.g. Adult;10;USD", "Une plage par ligne : Jour;début;fin (ex. Mardi;10:00;12:00)": "One slot per line: Day;start;end (e.g. Tuesday;10:00;12:00)", "ex. Famille MWELA": "e.g. MWELA family", "Résultat (Année": "Result (Year", "membres actifs": "active members", "baptême(s)": "baptism(s)", "opération(s) cochée(s)": "transaction(s) ticked", "unités": "units", "mois": "months", "joignable(s) par téléphone": "reachable by phone", "accepté": "accepted", "en attente": "pending", "refusé": "declined", "Référence (ex. Jean 3:16)": "Reference (e.g. John 3:16)", "Pour quoi ? (offrande ordinaire ou projet)": "What for? (regular offering or project)", "Dépense pour": "Expense for", "Offrande / dîme ordinaire (caisse générale)": "Regular offering / tithe (general fund)", "Fonctionnement ordinaire de l'église": "Regular church running costs", "Clôturer le projet": "Close the project", "Rouvrir": "Reopen", "Projets clôturés": "Closed projects", "Date de fin passée": "End date passed", "Projet clôturé": "Project closed", "Projet rouvert": "Project reopened", "Aucun projet en cours. Cliquez sur « + Nouveau projet » pour commencer.": "No ongoing project. Click \"+ New project\" to start.", "Un projet = une récolte de fonds (achat de la parcelle, construction, mission…). Chaque dimanche, enregistrez les contributions et les noms des personnes. Quand le projet est terminé, ouvrez-le et cliquez sur « Clôturer le projet ».": "A project = a fundraising (plot purchase, construction, mission…). Every Sunday, record the contributions and people's names. When the project is finished, open it and click \"Close the project\".", "Tous les membres": "All members", "Réunion de groupe": "Group meeting", "Permanent": "Regular", "Irrégulier": "Irregular", "Rarement présent": "Rarely present", "Permanent = présent à au moins 75 % des séances · Irrégulier = 40 à 74 % · Rarement = moins de 40 %.": "Regular = present at 75 % or more of sessions · Irregular = 40 to 74 % · Rarely = under 40 %.", "Finances limitées : seulement les offrandes ordinaires (caisse générale) et ses dépenses — pas les dîmes, projets, parcelle ni les autres fonds": "Limited finances: only regular offerings (general fund) and its expenses — no tithes, projects, plot or other funds", "Accès limité : vous voyez et saisissez seulement les offrandes ordinaires de la caisse générale et ses dépenses.": "Limited access: you only see and enter regular offerings of the general fund and its expenses.", "Offrande ordinaire (caisse générale)": "Regular offering (general fund)", "Offrandes ordinaires": "Regular offerings", "Prêts": "Loans", "Prêt accordé": "Loan given", "Remboursement de prêt": "Loan repayment", "Remboursement": "Repayment", "+ Remboursement": "+ Repayment", "+ Nouveau prêt": "+ New loan", "Nouveau prêt d'argent": "New cash loan", "Modifier le prêt": "Edit loan", "Prêté à (membre)": "Lent to (member)", "Date du prêt": "Loan date", "À rendre avant le (facultatif)": "To repay by (optional)", "Montant prêté": "Amount lent", "Pris dans le compte": "Taken from account", "Motif / conditions": "Reason / terms", "Déposé dans le compte": "Deposited to account", "Encore dû à l'église": "Still owed to the church", "Prêts remboursés": "Repaid loans", "Déjà remboursé": "Already repaid", "Reste à rendre": "Left to repay", "Remboursements": "Repayments", "Remboursé": "Repaid", "Aucun remboursement pour l'instant.": "No repayment yet.", "‹ Prêts": "‹ Loans", "L'argent prêté sort de la caisse mais n'est pas une dépense : il reste dû à l'église. Chaque remboursement le fait revenir dans la caisse.": "Money lent leaves the cash box but is not an expense: it is still owed to the church. Each repayment brings it back.", "Aucun prêt enregistré. Cliquez sur « + Nouveau prêt » quand l'église prête de l'argent à quelqu'un.": "No loan recorded. Click \"+ New loan\" when the church lends money to someone.", "Quantité en stock (corrigez si besoin)": "Quantity in stock (correct if needed)", "Correction manuelle de la quantité": "Manual quantity correction", "Modifier le mouvement": "Edit movement", "Quantité (+ ou −)": "Quantity (+ or −)", "Le stock deviendrait négatif": "Stock would become negative", "Ajustement inventaire": "Stock adjustment", "Gain / perte par mois": "Profit / loss per month", "Gain / perte par mois (équiv. $)": "Profit / loss per month ($ equiv.)", "Prêts : encore dû à l'église": "Loans: still owed to the church", "Vert = recettes plus grandes que les dépenses ; rouge = l'église a dépensé plus qu'elle n'a reçu. Les prêts ne comptent pas.": "Green = income above expenses; red = the church spent more than it received. Loans are not counted.", "Aucun prêt en cours. Tout l'argent prêté a été rendu.": "No current loan. All money lent has been returned.", "Journal": "Log", "Logo et couleur de l'église": "Church logo and colour", "📷 Changer le logo": "📷 Change logo", "Couleur principale": "Main colour", "Autre…": "Other…", "🪪 Carte": "🪪 Card", "🪪 Cartes": "🪪 Cards", "📷 Scanner les cartes": "📷 Scan cards", "Contribution enregistrée ✓": "Contribution recorded ✓", "Voulez-vous lui envoyer un reçu ?": "Would you like to send a receipt?", "Plus tard": "Later", "📄 Reçu PDF": "📄 PDF receipt", "📲 Envoyer (WhatsApp…)": "📲 Send (WhatsApp…)", "🧾 Reçu du donateur": "🧾 Donor receipt", "Ma carte de membre": "My member card", "Montrez ce code à l'accueil pour enregistrer votre présence.": "Show this code at the welcome desk to record your attendance.", "Télécharger ma carte (PDF)": "Download my card (PDF)", "Sauvegarder maintenant": "Back up now", "Aucune sauvegarde faite": "No backup made", "Gardez une copie de toutes les données de l'église en lieu sûr.": "Keep a copy of all church data in a safe place.", "Sauvegardes automatiques": "Automatic backups", "Aucune modification enregistrée pour le moment.": "No change recorded yet.", "Ajout": "Added", "Modification": "Change", "Suppression": "Deletion", "Tous les mois": "All months", "Terminer": "Finish", "Compris": "Got it", "Administrateur (accès total)": "Administrator (full access)"},sw:{"(finances, rapports),": "(fedha, ripoti),", "(membres, groupes, présences, suivis),": "(washiriki, vikundi, mahudhurio, ufuatiliaji),", "(tableau de bord et calendrier, sans modification).": "(dashibodi na kalenda, bila kubadilisha).", "(tout sauf les paramètres),": "(kila kitu isipokuwa mipangilio),", "A cessé de venir (raison inconnue)": "Ameacha kuja (sababu haijulikani)", "A rejoint une autre église": "Amejiunga na kanisa lingine", "Absent répété": "Kutohudhuria mara kwa mara", "Absents à accompagner": "Wasiohudhuria wa kufuatilia", "Accueil automatique des nouveaux venus": "Kukaribisha wageni wapya kiotomatiki", "Achat parcelle": "Ununuzi wa kiwanja", "Action de grâce": "Shukrani", "Adjoint": "Msaidizi", "Administrateur": "Msimamizi", "Adresse": "Anwani", "Adresse (quartier, commune)": "Anwani (mtaa, wilaya)", "Afficher sur l'encart du site internet": "Onyesha kwenye kisanduku cha tovuti", "Aide": "Msaada", "Ajouter un bloc (glissez la poignée ⠿ ou utilisez ↑ ↓ pour réordonner) :": "Ongeza kipande (buruta ⠿ au tumia ↑ ↓ kupanga):", "Ajoutez d'abord des salles ou du matériel": "Ongeza kwanza vyumba au vifaa", "Ajoutez les enveloppes et l'offrande générale.": "Ongeza bahasha na sadaka ya jumla.", "Ajoutez vos salles et votre matériel (bouton « Salles & matériel »).": "Ongeza vyumba na vifaa vyako (kitufe « Vyumba na vifaa »).", "Album photo": "Albamu ya picha", "Alerte si stock ≤": "Tahadhari ikiwa akiba ≤", "Amortissement annuel": "Uchakavu wa mwaka", "Analyse": "Uchambuzi", "Ancien": "Mzee wa kanisa", "Anglais": "Kiingereza", "Anniversaire": "Siku ya kuzaliwa", "Anniversaires d'aujourd'hui": "Siku za kuzaliwa za leo", "Anniversaires de la semaine": "Siku za kuzaliwa wiki hii", "Anniversaires du mois": "Siku za kuzaliwa mwezi huu", "Annonce": "Tangazo", "Annonce générale": "Tangazo la jumla", "Annuler": "Ghairi", "Annulé": "Imeghairiwa", "Année complète": "Mwaka mzima", "Aperçu": "Onyesho", "Apparence": "Mwonekano", "Appel téléphonique": "Simu", "Articles": "Vitu", "Assistant IA": "Msaidizi wa AI", "Au": "Hadi", "Aucun album. Créez le premier !": "Hakuna albamu. Unda ya kwanza!", "Aucun article. Ajoutez chaises, instruments, sonorisation, vaisselle, fournitures…": "Hakuna vitu. Ongeza viti, vyombo vya muziki, spika, vyombo, vifaa…", "Aucun bien enregistré.": "Hakuna mali iliyoandikishwa.", "Aucun bulletin pour le moment.": "Hakuna jarida bado.", "Aucun chant. Ajoutez le répertoire de la chorale.": "Hakuna nyimbo. Ongeza nyimbo za kwaya.", "Aucun envoi enregistré.": "Hakuna ujumbe uliotumwa.", "Aucun formulaire.": "Hakuna fomu.", "Aucun groupe. Créez vos départements pour y rattacher les membres.": "Hakuna vikundi. Unda idara zako ili kuweka washiriki.", "Aucun inventaire réalisé.": "Hakuna hesabu ya mali iliyofanyika.", "Aucun lot.": "Hakuna makundi.", "Aucun message. Lancez la discussion !": "Hakuna ujumbe. Anzisha mazungumzo!", "Aucun mouvement.": "Hakuna mienendo.", "Aucun plan. Créez le plan du prochain culte.": "Hakuna mpango. Unda mpango wa ibada ijayo.", "Aucun projet. Cliquez sur « + Nouveau projet » pour commencer.": "Hakuna miradi. Bonyeza « + Mradi mpya » kuanza.", "Aucun prêt en cours.": "Hakuna mikopo inayoendelea.", "Aucun rendez-vous aujourd'hui.": "Hakuna miadi leo.", "Aucun rendez-vous.": "Hakuna miadi.", "Aucun rôle.": "Hakuna majukumu.", "Aucun rôle. Exemples : Accueil, Protocole, Sonorisation, Chorale, Intercession, Offrandes, Moniteur.": "Hakuna majukumu. Mifano: Mapokezi, Itifaki, Sauti, Kwaya, Maombezi, Sadaka, Mwalimu.", "Aucun sondage.": "Hakuna kura za maoni.", "Aucun suivi ici.": "Hakuna ufuatiliaji hapa.", "Aucun événement avec inscriptions à venir.": "Hakuna matukio yajayo yenye usajili.", "Aucun événement avec inscriptions.": "Hakuna matukio yenye usajili.", "Aucune": "Hakuna", "Aucune activité enregistrée pour l'instant.": "Hakuna shughuli iliyoandikishwa bado.", "Aucune campagne active.": "Hakuna kampeni inayoendelea.", "Aucune contribution liée à un membre cette année. Choisissez le membre lors de la saisie d'une dîme ou d'un don.": "Hakuna mchango uliounganishwa na mshiriki mwaka huu. Chagua mshiriki unapoandika zaka au zawadi.", "Aucune contribution liée à un membre pour cette année.": "Hakuna mchango uliounganishwa na mshiriki kwa mwaka huu.", "Aucune indisponibilité à venir.": "Hakuna kutopatikana kunakokuja.", "Aucune ligne.": "Hakuna mistari.", "Aucune opération.": "Hakuna miamala.", "Aucune prédication enregistrée.": "Hakuna mahubiri yaliyoandikishwa.", "Aucune réservation aujourd'hui.": "Hakuna uhifadhi leo.", "Aujourd'hui": "Leo", "Auteur / artiste": "Mwandishi / msanii", "Autre": "Nyingine", "Autre entrée": "Mapato mengine", "Autre sortie": "Matumizi mengine", "Avancement": "Maendeleo", "Avec": "Pamoja na", "Banque": "Benki", "Baptisé(e) par immersion": "Amebatizwa kwa kuzamishwa", "Baptême": "Ubatizo", "Baptêmes": "Ubatizo", "Bienvenue à un visiteur": "Kumkaribisha mgeni", "Bon": "Nzuri", "Budget": "Bajeti", "Bulletin": "Jarida", "Bâtiment": "Jengo", "Bâtiments, terrain (parcelle), véhicules, sonorisation, mobilier… Amortissement linéaire.": "Majengo, kiwanja, magari, vifaa vya sauti, samani… Uchakavu wa moja kwa moja.", "Bénévole": "Mhudumu", "Bénévoles": "Wahudumu", "Caisse (espèces)": "Sanduku la fedha", "Caisse générale": "Mfuko mkuu", "Calendrier": "Kalenda", "Campagnes de dons": "Kampeni za matoleo", "Case Oui": "Kisanduku cha Ndiyo", "Cases multiples": "Visanduku vingi", "Catégorie": "Aina", "Catégorie de recette": "Aina ya mapato", "Catégories d'entrées": "Aina za mapato", "Catégories d'entrées (une par ligne)": "Aina za mapato (moja kwa mstari)", "Catégories de sorties": "Aina za matumizi", "Catégories de sorties (une par ligne)": "Aina za matumizi (moja kwa mstari)", "Ce que l'application ne fait pas": "Programu haifanyi nini", "Changer mon code": "Badilisha nambari yangu", "Chant": "Wimbo", "Chants": "Nyimbo", "Chaque mois": "Kila mwezi", "Chaque personne avec qui vous partagez la page apparaît ici après sa première connexion. Choisissez ce qu'elle peut voir :": "Kila mtu unayeshiriki naye ukurasa huonekana hapa baada ya kuingia mara ya kwanza. Chagua anachoweza kuona:", "Chaque compte apparaît ici après sa première connexion. Choisissez ce qu'il peut voir :": "Kila akaunti huonekana hapa baada ya kuingia mara ya kwanza. Chagua inachoweza kuona:", "Chaque semaine": "Kila wiki", "Chef de famille": "Kiongozi wa familia", "Choisir les personnes…": "Chagua watu…", "Choix ou candidats (un par ligne)": "Machaguo au wagombea (mmoja kwa mstari)", "Choix séparés par des virgules": "Machaguo yaliyotenganishwa kwa koma", "Chorale, jeunesse, mamans, papas, intercesseurs, protocole, école du dimanche…": "Kwaya, vijana, akina mama, akina baba, waombezi, itifaki, shule ya Jumapili…", "Choriste": "Mwanakwaya", "Classique": "Kawaida", "Clôture des inscriptions": "Mwisho wa usajili", "Clôturer et enregistrer le dépôt": "Funga na uandikishe amana", "Cochez « Ouvrir les inscriptions » dans un événement (Calendrier ou ici) pour gérer participants, billets et paiements.": "Weka alama « Fungua usajili » kwenye tukio (Kalenda au hapa) kusimamia washiriki, tiketi na malipo.", "Collecte du dimanche (enveloppes)": "Mchango wa Jumapili (bahasha)", "Combien de nouveaux venus cette année et quels groupes grandissent ?": "Wageni wapya wangapi mwaka huu na vikundi gani vinakua?", "Commencer un inventaire": "Anza kuhesabu mali", "Comment la présence du dimanche a-t-elle évolué ces derniers mois ?": "Mahudhurio ya Jumapili yamebadilikaje miezi ya karibuni?", "Communication": "Mawasiliano", "Comptage": "Hesabu", "Comptage après chaque culte ou réunion.": "Hesabu baada ya kila ibada au mkutano.", "Compte": "Akaunti", "Compte (où est l'argent)": "Akaunti (pesa ziko wapi)", "Compte achat parcelle": "Akaunti ya kununua kiwanja", "Compte de résultat – dépenses": "Taarifa ya mapato – matumizi", "Compte de résultat – recettes": "Taarifa ya mapato – mapato", "Comptes": "Akaunti", "Comptes : caisse, banque, mobile money (un par ligne)": "Akaunti: fedha taslimu, benki, pesa ya simu (moja kwa mstari)", "Comptez réellement chaque article (par exemple une fois par an). Les écarts sont enregistrés comme ajustements et un procès-verbal PDF est produit.": "Hesabu kila kitu kwa kweli (mfano mara moja kwa mwaka). Tofauti zinaandikwa kama marekebisho na ripoti ya PDF hutolewa.", "Compté par": "Imehesabiwa na", "Configurer": "Sanidi", "Confirmer le code": "Thibitisha nambari", "Confirmé": "Imethibitishwa", "Confié à": "Amepewa", "Conférence / séminaire": "Kongamano / semina", "Conjoint(e)": "Mwenzi", "Connexion protégée par votre compte Claude et votre code personnel.": "Kuingia kunalindwa na akaunti yako ya Claude na nambari yako binafsi.", "Connexion protégée par votre compte Claude.": "Kuingia kunalindwa na akaunti yako ya Claude.", "Conseil, prière, mariage, baptême…": "Ushauri, maombi, ndoa, ubatizo…", "Consultation seulement (aucune modification)": "Kutazama tu (bila kubadilisha)", "Contacts de l'église": "Mawasiliano ya kanisa", "Contribution parcelle": "Mchango wa kiwanja", "Copier dans la fiche membre": "Nakili kwenye kadi ya mshiriki", "Copier le code HTML": "Nakili msimbo wa HTML", "Copier le message": "Nakili ujumbe", "Copier les numéros": "Nakili nambari", "Copier les e-mails": "Nakili barua pepe", "Copier pour WhatsApp": "Nakili kwa WhatsApp", "Croissance": "Ukuaji", "Créer votre code": "Unda nambari yako", "Créez d'abord des groupes dans « Groupes & départements ».": "Unda kwanza vikundi katika « Vikundi na idara ».", "Créez un budget ou une campagne": "Unda bajeti au kampeni", "Créez un bulletin hebdomadaire à imprimer ou partager sur WhatsApp.": "Unda jarida la kila wiki la kuchapisha au kushiriki kwenye WhatsApp.", "Culte": "Ibada", "Culte & bénévoles": "Ibada na wahudumu", "Culte / réunion": "Ibada / mkutano", "Culte du dimanche": "Ibada ya Jumapili", "Culte spécial": "Ibada maalum", "Cultes, baptêmes, mariages, évangélisation, travaux de la parcelle…": "Ibada, ubatizo, harusi, uinjilisti, kazi za kiwanja…", "Célibataire": "Hajaoa / hajaolewa", "Date": "Tarehe", "Date (début de semaine)": "Tarehe (mwanzo wa wiki)", "Date d'acquisition": "Tarehe ya ununuzi", "Date d'arrivée / adhésion": "Tarehe ya kuwasili / kujiunga", "Date de départ (si parti)": "Tarehe ya kuondoka (ikiwa ameondoka)", "Date de fin": "Tarehe ya mwisho", "Date de mariage": "Tarehe ya ndoa", "Date de naissance": "Tarehe ya kuzaliwa", "Date du baptême": "Tarehe ya ubatizo", "Date du départ": "Tarehe ya kuondoka", "Demande de prière": "Ombi la maombi", "Demandé": "Imeombwa", "Depuis le compte": "Kutoka akaunti", "Dernier culte": "Ibada ya mwisho", "Description": "Maelezo", "Deuil / funérailles": "Msiba / mazishi", "Devise": "Sarafu", "Devise du budget": "Sarafu ya bajeti", "Diaconesse": "Shemasi wa kike", "Diacre": "Shemasi", "Dim": "Jpi", "Dimanche": "Jumapili", "Discussion entre les personnes qui ont accès à l'application.": "Mazungumzo kati ya watu wenye ufikiaji wa programu.", "Discussions": "Mazungumzo", "Disponibilités hebdomadaires": "Upatikanaji wa kila wiki", "Divorcé(e)": "Ametalikiana", "Dollars ($)": "Dola ($)", "Don": "Zawadi", "Donateurs identifiés": "Wachangiaji waliotambuliwa", "Dons": "Matoleo", "Dons par mois (équivalent $)": "Matoleo kwa mwezi (sawa na $)", "Dont visiteurs": "Kati yao wageni", "Durée (min)": "Muda (dakika)", "Début": "Mwanzo", "Décès": "Kifo", "Définissez des rôles et créez des plans de culte.": "Weka majukumu na unda mipango ya ibada.", "Déménagement / changement de ville": "Kuhama / kubadilisha mji", "Départ": "Kuondoka", "Départs": "Walioondoka", "Départs sur la période": "Walioondoka katika kipindi", "Dépenses": "Matumizi", "Déposé sur le compte": "Imewekwa kwenye akaunti", "Désaccord / conflit": "Kutokubaliana / mgogoro", "Désactivé": "Imezimwa", "Désignation": "Jina la kitu", "Détails": "Maelezo", "Dîme": "Zaka", "E-mail": "Barua pepe", "Effectif en fin de mois": "Idadi mwishoni mwa mwezi", "Emplacement": "Mahali", "Emplacement / n° de série": "Mahali / nambari ya mfululizo", "En attente": "Inasubiri", "En cours": "Inaendelea", "En panne": "Imeharibika", "En panne / réparation": "Imeharibika / matengenezo", "En retard": "Imechelewa", "En réparation": "Katika matengenezo", "Encart pour le site internet de l'église": "Kisanduku cha tovuti ya kanisa", "Encart site internet": "Kisanduku cha tovuti", "Enfant": "Mtoto", "Enfants": "Watoto", "Enregistrer": "Hifadhi", "Enregistrer comme modèle": "Hifadhi kama kiolezo", "Enregistrer dans l'historique": "Hifadhi kwenye historia", "Enregistrer et entrer": "Hifadhi na ingia", "Enregistrer les présences": "Andika mahudhurio", "Enseignement": "Mafundisho", "Entretien": "Matengenezo", "Entrées du mois": "Mapato ya mwezi", "Entrées par catégorie": "Mapato kwa aina", "Enveloppes": "Bahasha", "Envoyer": "Tuma", "Ex. « Responsable chorale » : Culte & bénévoles + Calendrier. Les rôles créés apparaissent dans la liste des utilisateurs.": "Mfano « Kiongozi wa kwaya »: Ibada na wahudumu + Kalenda. Majukumu yaliyoundwa huonekana kwenye orodha ya watumiaji.", "Famille / foyer": "Familia / kaya", "Familles": "Familia", "Femme": "Mwanamke", "Femmes": "Wanawake", "Fiche d'accueil des visiteurs, demande de baptême, inscription à l'école du dimanche, demande de prière…": "Fomu ya kukaribisha wageni, ombi la ubatizo, usajili wa shule ya Jumapili, ombi la maombi…", "Fidèle": "Muumini", "Filtres": "Vichujio", "Filtres · IA": "Vichujio · AI", "Fin": "Mwisho", "Finances": "Fedha", "Fonction dans l'église": "Huduma kanisani", "Fonds": "Mifuko", "Fonds (affectation)": "Mfuko (mgao)", "Fonds (caisse du projet)": "Mfuko (sanduku la mradi)", "Fonds / affectations (un par ligne)": "Mifuko / migao (mmoja kwa mstari)", "Formulaires": "Fomu", "Formulaires & votes": "Fomu na kura", "Francs congolais": "Faranga za Kongo", "Francs congolais (FC)": "Faranga za Kongo (FC)", "Français": "Kifaransa", "Fréquentation récente": "Mahudhurio ya karibuni", "Glisser pour déplacer": "Buruta kusogeza", "Grille du mois": "Jedwali la mwezi", "Groupes": "Vikundi", "Groupes & départements": "Vikundi na idara", "Groupes / départements": "Vikundi / idara", "Heure": "Saa", "Historique": "Historia", "Homme": "Mwanaume", "Hommes": "Wanaume", "Hommes et femmes": "Wanaume na wanawake", "Honoraires": "Malipo ya huduma", "Hors service": "Haitumiki", "Immobilisations": "Mali za kudumu", "Importer": "Leta", "Inactif": "Asiye hai", "Indicateurs": "Viashiria", "Indisponibilité": "Kutopatikana", "Indisponibilités": "Kutopatikana", "Informations de l'église": "Taarifa za kanisa", "Informatique": "Vifaa vya kompyuta", "Inscriptions": "Usajili", "Inscriptions aux événements": "Usajili wa matukio", "Intitulé": "Kichwa", "Inventaire": "Orodha ya mali", "Inventaire physique": "Kuhesabu mali", "Invitation à un événement": "Mwaliko wa tukio", "Jeu": "Alh", "Jeudi": "Alhamisi", "Jour": "Siku", "Journal PDF": "Daftari PDF", "Journal d'activité": "Kumbukumbu za shughuli", "Jusqu'au (si répété)": "Hadi (ikirudiwa)", "L'assistant IA (Rapports → Assistant IA) répond sur vos données ; ce guide explique l'utilisation.": "Msaidizi wa AI (Ripoti → Msaidizi wa AI) hujibu kuhusu data yako; mwongozo huu unaeleza matumizi.", "Langue": "Lugha", "Langue des menus": "Lugha ya menyu", "Le dimanche": "Siku ya Jumapili", "Lecteur": "Msomaji", "Lecteur (consultation)": "Msomaji (kutazama tu)", "Lecture seule": "Kusoma tu", "Les comptes se modifient dans Paramètres → Informations de l'église.": "Akaunti hubadilishwa katika Mipangilio → Taarifa za kanisa.", "Libellé / motif": "Maelezo / sababu", "Lien (vidéo, partition)": "Kiungo (video, nota)", "Lien dans la famille": "Uhusiano katika familia", "Lien vidéo / audio (YouTube, Facebook…)": "Kiungo cha video / sauti (YouTube, Facebook…)", "Lieu / adresse": "Mahali / anwani", "Liste de choix": "Orodha ya machaguo", "Lots & enveloppes": "Makundi na bahasha", "Louange": "Sifa", "Louange & adoration (chorale)": "Sifa na kuabudu (kwaya)", "Louange, adoration, grâce…": "Sifa, kuabudu, neema…", "Loyer": "Kodi ya nyumba", "Lun": "Jtt", "Lundi": "Jumatatu", "Malade": "Mgonjwa", "Mar": "Jnn", "Mardi": "Jumanne", "Mariage": "Harusi", "Marié(e)": "Ameoa / ameolewa", "Matériel": "Vifaa", "Matériel (un par ligne : Nom;quantité)": "Vifaa (kimoja kwa mstari: Jina;idadi)", "Matériel / sono": "Vifaa / sauti", "Matériel prêté et pas encore rendu (enregistrez un « Prêt » puis un « Retour de prêt » avec la même personne).": "Vifaa vilivyokopeshwa na bado havijarudishwa (andika « Mkopo » kisha « Kurudisha mkopo » kwa mtu yule yule).", "Membre": "Mshiriki", "Membre (dîme, don…)": "Mshiriki (zaka, zawadi…)", "Membre actif": "Mshiriki hai", "Membre concerné": "Mshiriki husika", "Membres": "Washiriki", "Membres actifs": "Washiriki hai", "Membres par statut": "Washiriki kwa hali", "Mer": "Jtn", "Mercredi": "Jumatano", "Mes disponibilités": "Upatikanaji wangu", "Message après l'envoi": "Ujumbe baada ya kutuma", "Message d'introduction": "Ujumbe wa utangulizi", "Messages": "Ujumbe", "Mobilier": "Samani", "Mode borne": "Hali ya kioski", "Mode tablette": "Hali ya tablet", "Modifier": "Hariri", "Modifier l'événement": "Hariri tukio", "Modifier le programme": "Hariri ratiba", "Modifier le suivi": "Hariri ufuatiliaji", "Modifier les rôles": "Hariri majukumu", "Modifier la fiche": "Hariri kadi", "Modifier le projet": "Hariri mradi", "Mois": "Mwezi", "Moniteur (école du dimanche)": "Mwalimu (shule ya Jumapili)", "Montant": "Kiasi", "Motif": "Sababu", "Motif du départ": "Sababu ya kuondoka", "Motifs de départ": "Sababu za kuondoka", "Mouvements": "Mienendo", "Moyenne mensuelle": "Wastani wa mwezi", "Médiathèque": "Maktaba ya media", "Nom": "Jina", "Nom de l'église": "Jina la kanisa", "Nom du groupe": "Jina la kikundi", "Nom du rôle": "Jina la jukumu", "Nombre": "Namba", "Nombre de places": "Idadi ya nafasi", "Nos cultes": "Ibada zetu", "Note / responsable": "Maelezo / mhusika", "Notes": "Maelezo", "Notes (prédicateur, thème…)": "Maelezo (mhubiri, mada…)", "Notes / compte rendu": "Maelezo / ripoti", "Notes / historique": "Maelezo / historia", "Notes / premières lignes": "Maelezo / mistari ya kwanza", "Notes de la prédication": "Maelezo ya mahubiri", "Nouveau bien": "Mali mpya", "Nouveau chant": "Wimbo mpya", "Nouveau code": "Nambari mpya", "Nouveau converti": "Mwongofu mpya", "Nouveau groupe": "Kikundi kipya", "Nouveau programme": "Ratiba mpya", "Nouveau projet": "Mradi mpya", "Nouveau rendez-vous": "Miadi mpya", "Nouveau rôle": "Jukumu jipya", "Nouveau sondage / élection": "Kura mpya / uchaguzi", "Nouveau suivi": "Ufuatiliaji mpya", "Nouveaux": "Wapya", "Nouveaux ce mois": "Wapya mwezi huu", "Nouveaux membres": "Washiriki wapya", "Nouveaux membres par mois": "Washiriki wapya kwa mwezi", "Nouveaux par mois": "Wapya kwa mwezi", "Nouveaux sur la période": "Wapya katika kipindi", "Nouvel album": "Albamu mpya", "Nouvel article": "Kitu kipya", "Nouvel événement": "Tukio jipya", "Nouvelle entrée de caisse": "Mapato mapya", "Nouvelle sortie de caisse": "Matumizi mapya", "Nouvelle personne": "Mtu mpya", "Nouvelle prédication / vidéo": "Mahubiri / video mpya", "Nouvelle ville / église": "Mji / kanisa jipya", "Nouvelle ville / nouvelle église": "Mji mpya / kanisa jipya", "N° de bon": "Nambari ya risiti", "N° de pièce": "Nambari ya hati", "N° de série / marque": "Nambari ya mfululizo / chapa", "N° du lot": "Nambari ya kundi", "Objectif": "Lengo", "Objectif financier": "Lengo la fedha", "Offrande": "Sadaka", "Opérations": "Miamala", "Ordre du culte": "Mpangilio wa ibada", "Ordre du culte, chants et équipe de service.": "Mpangilio wa ibada, nyimbo na timu ya huduma.", "Ou nom": "Au jina", "Ou nom (si non enregistré)": "Au jina (ikiwa hajaandikishwa)", "Ou nom (visiteur)": "Au jina (mgeni)", "Ouvrier": "Mtumishi", "Ouvriers et responsables": "Watumishi na viongozi", "Ouvrir les inscriptions": "Fungua usajili", "Où se trouve l'argent : caisse, banque, mobile money.": "Pesa ziko wapi: fedha taslimu, benki, pesa ya simu.", "Par sexe": "Kwa jinsia", "Par statut": "Kwa hali", "Par tranche d'âge": "Kwa umri", "Paragraphe": "Aya", "Paramètres": "Mipangilio", "Parent": "Mzazi", "Partager (WhatsApp)": "Shiriki (WhatsApp)", "Parti(e)": "Ameondoka", "Pas de lien membre": "Hakuna kiungo cha mshiriki", "Passage biblique": "Kifungu cha Biblia", "Pasteur": "Mchungaji", "Pasteur / ancien": "Mchungaji / mzee", "Pasteur principal": "Mchungaji mkuu", "Personnaliser": "Badilisha", "Personne d'autre ne s'est encore connecté.": "Hakuna mwingine aliyeingia bado.", "Personnes (filtre)": "Watu (kichujio)", "Plans de culte": "Mipango ya ibada", "Pointage par nom": "Kuandikisha kwa jina", "Posez une question sur les membres, la présence, les finances ou les suivis. L'assistant lit un résumé des données de l'application ; il ne peut rien modifier.": "Uliza swali kuhusu washiriki, mahudhurio, fedha au ufuatiliaji. Msaidizi husoma muhtasari wa data; hawezi kubadilisha chochote.", "Postnom": "Jina la kati", "Premiers pas": "Hatua za kwanza", "Prochains créneaux libres": "Nafasi zijazo zilizo wazi", "Prochains événements": "Matukio yajayo", "Profession": "Kazi", "Programme de la semaine": "Ratiba ya wiki", "Programme hebdomadaire": "Ratiba ya kila wiki", "Programmes hebdomadaires": "Ratiba za kila wiki", "Projets & collectes": "Miradi na michango", "Projets & promesses": "Miradi na ahadi", "Projets / collecte": "Miradi / mchango", "Prédicateur / intervenant": "Mhubiri / mzungumzaji", "Prédication": "Mahubiri", "Prédications & vidéos": "Mahubiri na video", "Prénom": "Jina la kwanza", "Présence au dernier culte": "Mahudhurio ibada iliyopita", "Présence moy.": "Wastani wa mahudhurio", "Présence moyenne": "Wastani wa mahudhurio", "Présence moyenne par mois": "Wastani wa mahudhurio kwa mwezi", "Présences": "Mahudhurio", "Présent": "Yupo", "Présentation d'enfant": "Kuweka wakfu mtoto", "Prêts en cours": "Mikopo inayoendelea", "Quantité": "Idadi", "Quelles dépenses ont le plus augmenté ?": "Matumizi gani yameongezeka zaidi?", "Question": "Swali", "Question / poste à pourvoir": "Swali / nafasi ya kujaza", "Rappel du culte": "Ukumbusho wa ibada", "Rapport PDF": "Ripoti PDF", "Rapport mensuel": "Ripoti ya mwezi", "Rapports": "Ripoti", "Rapprochement": "Ulinganisho", "Rapprocher": "Linganisha", "Recettes": "Mapato", "Recettes (en dollars)": "Mapato (kwa dola)", "Recettes du mois (équiv. $)": "Mapato ya mwezi (sawa na $)", "Recettes et dépenses (6 mois, équiv. $)": "Mapato na matumizi (miezi 6, sawa na $)", "Rechercher par titre, tonalité, thème…": "Tafuta kwa kichwa, ufunguo, mada…", "Rechercher titre, prédicateur, passage…": "Tafuta kichwa, mhubiri, kifungu…", "Rechercher un article, un emplacement…": "Tafuta kitu, mahali…", "Rechercher un nom, un téléphone…": "Tafuta jina, simu…", "Rechercher…": "Tafuta…", "Relevés": "Taarifa", "Rendez-vous": "Miadi", "Rendez-vous du jour": "Miadi ya leo", "Responsable": "Kiongozi", "Responsable de département": "Kiongozi wa idara", "Restaurer…": "Rejesha…", "Retour au village / à l'étranger": "Amerudi kijijini / nje ya nchi", "Reçu de (si non membre)": "Imepokelewa kutoka (ikiwa si mshiriki)", "Rien pour cette semaine.": "Hakuna kitu wiki hii.", "Rien de prévu.": "Hakuna kilichopangwa.", "Réalisé": "Halisi", "Référence": "Rejea", "Répartitions": "Mgawanyo", "Répétition": "Mazoezi", "Réservable (apparaît dans Salles & matériel)": "Inaweza kuhifadhiwa (huonekana katika Vyumba na vifaa)", "Réservations du jour": "Uhifadhi wa leo", "Résultat": "Matokeo", "Résume les recettes par catégorie ce trimestre.": "Fupisha mapato kwa aina robo hii.", "Résumé": "Muhtasari", "Réunion": "Mkutano", "Réunion (jour et heure)": "Mkutano (siku na saa)", "Réunion spéciale": "Mkutano maalum", "Réunions comptées": "Mikutano iliyohesabiwa", "Rôles de service": "Majukumu ya huduma", "Rôles personnalisés": "Majukumu maalum", "Saisie rapide": "Kuingiza haraka", "Saisissez le solde du relevé": "Weka salio la taarifa", "Saisissez les enveloppes de la collecte, vérifiez, puis clôturez : les recettes sont enregistrées en une fois dans la comptabilité.": "Ingiza bahasha za mchango, hakiki, kisha funga: mapato huandikwa kwenye hesabu mara moja.", "Salle réservée": "Chumba kilichohifadhiwa", "Salles & matériel": "Vyumba na vifaa", "Salles (une par ligne : Nom;capacité)": "Vyumba (kimoja kwa mstari: Jina;uwezo)", "Sam": "Jmo", "Samedi": "Jumamosi", "Sauvegarde des données": "Nakala ya data", "Se déconnecter": "Toka", "Se connecter": "Ingia", "Secrétaire": "Katibu", "Sexe": "Jinsia", "Sigle": "Kifupisho", "Signature": "Sahihi", "Sites / antennes (un par ligne, le premier = site principal ; laisser vide si un seul)": "Matawi (moja kwa mstari, la kwanza = kuu; acha wazi ikiwa ni moja)", "Social / assistance": "Msaada wa kijamii", "Solde du relevé": "Salio la taarifa", "Solde pointé": "Salio lililothibitishwa", "Solde selon vos livres": "Salio kwa vitabu vyako", "Sondage": "Kura ya maoni", "Sondages & élections": "Kura na uchaguzi", "Sonorisation / instruments": "Sauti / vyombo vya muziki", "Sortie / retraite": "Matembezi / mafungo", "Sorties du mois": "Matumizi ya mwezi", "Sorties par catégorie": "Matumizi kwa aina", "Sortir": "Toka", "Statut": "Hali", "Stock bas": "Akiba ndogo", "Suivis": "Ufuatiliaji", "Suivis pastoraux": "Ufuatiliaji wa kichungaji", "Suivis pastoraux réalisés": "Ufuatiliaji uliofanyika", "Suivis terminés": "Ufuatiliaji uliokamilika", "Supprimer": "Futa", "Sécurité": "Usalama", "Sécurité et sauvegarde": "Usalama na nakala", "Série": "Mfululizo", "Tableau de bord": "Dashibodi", "Taux du jour": "Kiwango cha leo", "Terminé": "Imekamilika", "Terminés": "Zimekamilika", "Terminés ce mois": "Zimekamilika mwezi huu", "Terrain": "Kiwanja", "Texte": "Maandishi", "Texte WhatsApp": "Maandishi ya WhatsApp", "Texte court": "Maandishi mafupi", "Texte du verset": "Maandishi ya mstari", "Thème": "Mada", "Titre": "Kichwa", "Titre affiché (ex. Visionnaire)": "Cheo kinachoonyeshwa (mfano Mwenye maono)", "Titre du chant": "Kichwa cha wimbo", "Tonalité": "Ufunguo", "Total": "Jumla", "Total tous comptes": "Jumla ya akaunti zote", "Tous": "Zote", "Tous les articles": "Vitu vyote", "Tous les comptes": "Akaunti zote", "Tous les fonds": "Mifuko yote", "Tous les groupes": "Vikundi vyote", "Tous les responsables": "Viongozi wote", "Tous les statuts": "Hali zote", "Tout afficher": "Onyesha zote", "Tout cocher": "Weka alama zote", "Tout le monde (sauf inactifs)": "Kila mtu (isipokuwa wasio hai)", "Toutes catégories": "Aina zote", "Toutes les 2 semaines": "Kila wiki 2", "Traduire : Anglais": "Tafsiri: Kiingereza", "Traduire : Lingala": "Tafsiri: Kilingala", "Traduire : Swahili": "Tafsiri: Kiswahili", "Transport": "Usafiri", "Trésorerie (tous comptes)": "Hali ya fedha (akaunti zote)", "Trésorier": "Mweka hazina", "Type": "Aina", "Télécharger la sauvegarde": "Pakua nakala", "Téléchargez régulièrement une copie complète (fichier .json). Elle permet de tout restaurer en cas de problème.": "Pakua mara kwa mara nakala kamili (faili .json). Inakuwezesha kurejesha kila kitu ikiwa kuna tatizo.", "Téléphone": "Simu", "Témoignage": "Ushuhuda", "Un projet = une récolte de fonds (achat de la parcelle, construction, mission…). Chaque dimanche, enregistrez les contributions et les noms des personnes.": "Mradi = uchangishaji (ununuzi wa kiwanja, ujenzi, misheni…). Kila Jumapili, andika michango na majina ya watu.", "Un rôle par ligne : Nom;nombre requis": "Jukumu moja kwa mstari: Jina;idadi inayohitajika", "Une question ?": "Una swali?", "Unité": "Kipimo", "Usé": "Imechakaa", "Utilisateurs et rôles": "Watumiaji na majukumu", "Valeur d'acquisition": "Thamani ya ununuzi", "Valeur estimée": "Thamani inayokadiriwa", "Valeur nette actuelle": "Thamani halisi ya sasa", "Valeur résiduelle": "Thamani iliyobaki", "Valeur unitaire": "Thamani ya kimoja", "Valider le rapprochement": "Thibitisha ulinganisho", "Veillée de prière": "Kesha la maombi", "Ven": "Iju", "Vendredi": "Ijumaa", "Verre (transparent)": "Kioo (angavu)", "Vers le compte": "Kwenda akaunti", "Verset biblique": "Mstari wa Biblia", "Verset du jour": "Mstari wa siku", "Veuf / veuve": "Mjane", "Ville": "Mji", "Virement entre comptes": "Uhamisho kati ya akaunti", "Visionnaire :": "Mwenye maono:", "Visite à domicile": "Kutembelea nyumbani", "Visiteur": "Mgeni", "Visiteurs": "Wageni", "Visiteurs et nouveaux convertis": "Wageni na waongofu wapya", "Vote anonyme (les noms des votants ne sont pas affichés)": "Kura ya siri (majina ya wapiga kura hayaonyeshwi)", "Vote ouvert": "Kura iko wazi", "Votes en ligne (personnes ayant accès à l'application) et/ou saisie des voix d'une assemblée.": "Kura mtandaoni (watu wenye ufikiaji wa programu) na/au kuingiza kura za mkutano.", "Votre message…": "Ujumbe wako…", "Votre question…": "Swali lako…", "Vous nous avez manqué": "Tumekukosa", "Véhicule": "Gari", "automatique": "kiotomatiki", "des membres actifs ont donné": "ya washiriki hai walitoa", "ex. Dépôt des offrandes à la banque": "mfano Kuweka sadaka benki", "ex. Sol, Ré": "mfano G, D", "ex. Samedi 14h": "mfano Jumamosi saa 8 mchana", "min": "dak", "minutes": "dakika", "non budgété": "haijapangiwa bajeti", "requis": "inahitajika", "À faire": "Ya kufanya", "À faire aujourd'hui": "Ya kufanya leo", "À venir": "Zijazo", "Écart": "Tofauti", "Échéance": "Tarehe ya mwisho", "École de prière": "Shule ya maombi", "École du dimanche": "Shule ya Jumapili", "Écrans visibles": "Skrini zinazoonekana", "Écrivez votre message… Utilisez {prenom} pour personnaliser.": "Andika ujumbe wako… Tumia {prenom} kubinafsisha.", "Élection": "Uchaguzi", "Électricité / eau": "Umeme / maji", "Émission (studio)": "Kipindi (studio)", "Équipe de service": "Timu ya huduma", "État": "Hali", "État civil": "Hali ya ndoa", "États financiers": "Taarifa za fedha", "États financiers PDF": "Taarifa za fedha PDF", "Évangélisation": "Uinjilisti", "Évangélisation / mission": "Uinjilisti / misheni", "Évangéliste": "Mwinjilisti", "Évolution de l'effectif": "Mabadiliko ya idadi", "Évolution mois par mois": "Mwezi kwa mwezi", "Événement": "Tukio", "Événements & salles": "Matukio na vyumba", "Événements du mois": "Matukio ya mwezi", "— Choisir un modèle —": "— Chagua kiolezo —", "‹ Bulletins": "‹ Majarida", "‹ Formulaires": "‹ Fomu", "‹ Lots": "‹ Makundi", "‹ Plans": "‹ Mipango", "‹ Projets": "‹ Miradi", "‹ Albums": "‹ Albamu", "‹ Événements": "‹ Matukio", "→ Adresse": "→ Anwani", "→ E-mail": "→ Barua pepe", "→ Naissance": "→ Kuzaliwa", "→ Nom": "→ Jina", "→ Postnom": "→ Jina la kati", "→ Prénom": "→ Jina la kwanza", "→ Sexe (M/F)": "→ Jinsia (M/F)", "→ Téléphone": "→ Simu", "⇄ Virement": "⇄ Uhamisho", "≈ total $": "≈ jumla $", "✓ Terminé": "✓ Imekamilika", "✨ Améliorer le ton": "✨ Boresha mtindo", "✨ Proposer un verset (IA)": "✨ Pendekeza mstari (AI)", "📖 Choisir dans la liste": "📖 Chagua kwenye orodha", "📖 Choisir un passage dans la liste": "📖 Chagua kifungu kwenye orodha", "📖 Insérer un verset": "📖 Weka mstari", "+ Ajouter": "+ Ongeza", "+ Entrée": "+ Mapato", "− Sortie": "− Matumizi", "+ Offrande": "+ Sadaka", "+ Dîme": "+ Zaka", "+ Autre recette": "+ Mapato mengine", "− Dépense": "− Matumizi", "+ Nouveau projet": "+ Mradi mpya", "+ Collecte du jour": "+ Mchango wa leo", "+ Une contribution": "+ Mchango mmoja", "+ Promesse": "+ Ahadi", "+ Suivi": "+ Ufuatiliaji", "+ Nouveau suivi": "+ Ufuatiliaji mpya", "+ Nouveau groupe": "+ Kikundi kipya", "+ Événement": "+ Tukio", "+ Enregistrer": "+ Andika", "+ Nouvel album": "+ Albamu mpya", "+ Ajouter des photos": "+ Ongeza picha", "+ Article": "+ Kitu", "+ Rendez-vous": "+ Miadi", "+ Formulaire": "+ Fomu", "+ Fiche visiteur prête": "+ Fomu ya mgeni tayari", "+ Sondage / élection": "+ Kura / uchaguzi", "+ Prédication / vidéo": "+ Mahubiri / video", "+ Nouveau plan": "+ Mpango mpya", "+ Chant": "+ Wimbo", "+ Indisponibilité": "+ Kutopatikana", "+ Nouveau lot": "+ Kundi jipya", "+ Ligne": "+ Mstari", "+ Offrande générale (anonyme)": "+ Sadaka ya jumla (bila jina)", "+ Nouveau bulletin": "+ Jarida jipya", "+ Réserver": "+ Hifadhi nafasi", "+ Inscription": "+ Usajili", "+ Ajouter un bien": "+ Ongeza mali", "+ Rôle": "+ Jukumu", "+ Question": "+ Swali", "+ Élément": "+ Kipengele", "+ Section": "+ Sehemu", "+ Présences": "+ Mahudhurio", "+ Événement ce jour": "+ Tukio siku hii", "+ 5 lignes": "+ Mistari 5", "Fiche PDF": "Kadi PDF", "Attestation PDF": "Cheti PDF", "Rendu": "Imerudishwa", "Rappel": "Ukumbusho", "Réintégrer": "Rudisha", "Souhaiter": "Tuma salamu", "Inviter": "Alika", "Paiement": "Malipo", "Réponses": "Majibu", "Couverture": "Jalada", "Légende": "Maelezo ya picha", "Télécharger": "Pakua", "Fermer": "Funga", "Effacer": "Futa", "Valider": "Thibitisha", "Clôturer": "Funga", "Restaurer": "Rejesha", "Confirmation": "Uthibitisho", "Supprimer définitivement cet élément ?": "Futa kipengele hiki kabisa?", "Supprimé": "Imefutwa", "Fiche enregistrée": "Kadi imehifadhiwa", "Mon espace": "Nafasi yangu", "Mon accès": "Ufikiaji wangu", "Ma fiche": "Kadi yangu", "Mes contributions": "Michango yangu", "Votes en cours": "Kura zinazoendelea", "Demander": "Omba", "M'inscrire": "Jiandikishe", "Remplir": "Jaza", "Modifier mes coordonnées": "Hariri taarifa zangu", "Demander un rendez-vous": "Omba miadi", "Mes coordonnées": "Taarifa zangu", "Connexion": "Kuingia", "Créer un compte": "Fungua akaunti", "Mot de passe oublié ?": "Umesahau nenosiri?", "Mot de passe": "Nenosiri", "Adresse e-mail": "Barua pepe", "Créer mon compte": "Fungua akaunti yangu", "Nom complet": "Jina kamili", "Continuer avec Google": "Endelea na Google", "ou": "au", "Bon retour": "Karibu tena", "Bienvenue": "Karibu", "Code oublié ?": "Umesahau nambari?", "Code d'accès": "Nambari ya kuingia", "Entrer": "Ingia", "Chargement…": "Inapakia…", "Ce qu'il faut retenir": "Mambo muhimu", "Graphiques": "Michoro", "Rapport de": "Ripoti ya", "Contributeurs": "Wachangiaji", "Collectes": "Michango", "Collectes par date": "Michango kwa tarehe", "Total récolté": "Jumla iliyokusanywa", "Reste à récolter": "Kilichobaki kukusanya", "Détail des contributions": "Maelezo ya michango", "Enregistrer une collecte": "Andika mchango", "Saisissez en une fois toutes les personnes qui ont contribué aujourd'hui.": "Ingiza kwa mara moja wote waliochangia leo.", "Enregistrer la collecte": "Hifadhi mchango", "Fois": "Mara", "Personnes": "Watu", "Promis": "Imeahidiwa", "Hors projets (offrandes, dîmes…)": "Nje ya miradi (sadaka, zaka…)", "Tous (projets ou non)": "Zote (miradi au la)", "Recettes par projet": "Mapato kwa mradi", "Ce mois-ci": "Mwezi huu", "Arrivé(e) du (mois)": "Aliwasili kuanzia (mwezi)", "au (mois)": "hadi (mwezi)", "Effacer les filtres": "Futa vichujio", "Envoyer un message à ce résultat": "Tuma ujumbe kwa matokeo haya", "Rechercher avec l'IA": "Tafuta kwa AI", "Âge min.": "Umri wa chini", "Âge max.": "Umri wa juu", "Présent 30 derniers jours": "Alikuwepo siku 30 zilizopita", "Liste": "Orodha", "Famille": "Familia", "Toutes": "Zote", "Oui": "Ndiyo", "Non": "Hapana", "Non (absent)": "Hapana (hayupo)", "Hommes / Femmes": "Wanaume / Wanawake", "Évolution (12 dernières réunions)": "Mwenendo (mikutano 12 iliyopita)", "Les 7 prochains jours": "Siku 7 zijazo", "Chiffres clés": "Takwimu muhimu", "Jauges (indicateurs)": "Vipimo (viashiria)", "Graphiques en anneau": "Michoro ya duara", "Histogramme recettes / dépenses": "Mchoro wa mapato / matumizi", "Personnaliser le tableau de bord": "Badilisha dashibodi", "Blocs affichés (sur cet appareil)": "Vipande vinavyoonyeshwa (kwenye kifaa hiki)", "Aucun comptage": "Hakuna hesabu", "Pas encore de données.": "Hakuna data bado.", "Recettes et dépenses (6 mois, équivalent $)": "Mapato na matumizi (miezi 6, sawa na $)", "Accueillir": "Karibisha", "Exporter": "Hamisha", "Excel": "Excel", "PDF": "PDF", "SMS": "SMS", "WhatsApp": "WhatsApp", "Lingala": "Kilingala", "Swahili": "Kiswahili", "Tshiluba": "Kiluba", "Kikongo": "Kikongo", "English": "Kiingereza", "Kiswahili": "Kiswahili", "Traduit les menus, onglets et boutons principaux sur cet appareil ; les textes détaillés restent en français.": "Hutafsiri kiolesura kwenye kifaa hiki; data yako (majina, maelezo…) inabaki kama ilivyoandikwa.", "Dernière connexion :": "Kuingia mara ya mwisho:", "Rôle :": "Jukumu:", "Pour obtenir plus d'accès, demandez à l'administrateur de l'application.": "Ili kupata ufikiaji zaidi, muulize msimamizi wa programu.", "Quitter": "Toka", "Quitter le mode borne (code requis)": "Toka hali ya kioski (nambari inahitajika)", "Enregistrez votre présence": "Andika mahudhurio yako", "Tapez votre numéro de téléphone": "Andika nambari yako ya simu", "Me trouver": "Nitafute", "Nouvelle réponse": "Jibu jipya", "Code administrateur": "Nambari ya msimamizi", "Activé": "Imewashwa", "Actif": "Hai", "Ouvert": "Wazi", "Clos": "Imefungwa", "Clôturé": "Umefungwa", "Réservé": "Imehifadhiwa", "Libre": "Wazi", "Disponible": "Inapatikana", "Payé": "Imelipwa", "Gratuit": "Bure", "À payer": "Ya kulipa", "Accepté": "Imekubaliwa", "Refusé": "Imekataliwa", "Equipe": "Timu", "personne(s)": "mtu/watu", "personnes enregistrées": "watu walioandikishwa", "visiteurs au total": "wageni kwa jumla", "contribution(s)": "mchango/michango", "contributeur(s)": "mchangiaji/wachangiaji", "élément(s)": "kipengele/vipengele", "réponse(s)": "jibu/majibu", "champ(s)": "sehemu", "photo(s)": "picha", "inscrit(s)": "waliojiandikisha", "opération(s) non rapprochée(s)": "miamala isiyolinganishwa", "bloc(s)": "kipande/vipande", "membre(s)": "mshiriki/washiriki", "sur les": "katika", "derniers cultes": "ibada zilizopita", "derniers mois": "miezi iliyopita", "dernières réunions": "mikutano iliyopita", "Créer le budget": "Unda bajeti", "Participation": "Ushiriki", "Par catégorie": "Kwa aina", "Contributions par membre – année": "Michango kwa mshiriki – mwaka", "Absents": "Wasiohudhuria", "Présents": "Waliohudhuria", "Suivis en attente": "Ufuatiliaji unaosubiri", "Opérations à pointer": "Miamala ya kuthibitisha", "Solde": "Salio", "Recettes et dépenses par mois (équivalent $)": "Mapato na matumizi kwa mwezi (sawa na $)", "3 derniers mois": "Miezi 3 iliyopita", "6 derniers mois": "Miezi 6 iliyopita", "12 derniers mois": "Miezi 12 iliyopita", "24 derniers mois": "Miezi 24 iliyopita", "Anniversaires des 7 prochains jours": "Siku za kuzaliwa siku 7 zijazo", "Dépense": "Matumizi", "Recette": "Mapato", "Choisissez un code de 4 à 6 chiffres. Il vous sera demandé à chaque ouverture.": "Chagua nambari ya tarakimu 4 hadi 6. Utaulizwa kila unapofungua.", "Durée d'amortissement (ans, 0 = terrain)": "Muda wa uchakavu (miaka, 0 = kiwanja)", "Définissez vos disponibilités (ex. mardi 10:00–12:00) pour voir les créneaux libres.": "Weka upatikanaji wako (mfano Jumanne 10:00–12:00) kuona nafasi zilizo wazi.", "Faites le pointage par nom pendant au moins 2 cultes : les membres absents à toutes les dernières réunions apparaîtront ici.": "Andika mahudhurio kwa jina kwa angalau ibada 2: washiriki wasiohudhuria mikutano yote ya karibuni wataonekana hapa.", "L'application se verrouille après 15 minutes sans activité. Votre code d'accès vous est personnel : personne d'autre, même l'administrateur, ne peut le voir.": "Programu hujifunga baada ya dakika 15 bila shughuli. Nambari yako ni binafsi: hakuna mwingine, hata msimamizi, anayeweza kuiona.", "Mobile money": "Pesa ya simu", "Du": "Kuanzia", "Taux : 1 $ = … FC": "Kiwango: 1 $ = … FC", "Total $": "Jumla $", "Total FC": "Jumla FC", "Types de billets (un par ligne : Nom;prix;devise) — ex. Adulte;10;USD": "Aina za tiketi (moja kwa mstari: Jina;bei;sarafu) — mfano Mtu mzima;10;USD", "Une plage par ligne : Jour;début;fin (ex. Mardi;10:00;12:00)": "Nafasi moja kwa mstari: Siku;mwanzo;mwisho (mfano Jumanne;10:00;12:00)", "ex. Famille MWELA": "mfano Familia ya MWELA", "Résultat (Année": "Matokeo (Mwaka", "membres actifs": "washiriki hai", "baptême(s)": "ubatizo", "opération(s) cochée(s)": "miamala iliyothibitishwa", "unités": "vipimo", "mois": "miezi", "joignable(s) par téléphone": "wanaopatikana kwa simu", "accepté": "imekubaliwa", "en attente": "inasubiri", "refusé": "imekataliwa", "Référence (ex. Jean 3:16)": "Rejea (mfano Yohana 3:16)", "Pour quoi ? (offrande ordinaire ou projet)": "Kwa ajili ya nini? (sadaka ya kawaida au mradi)", "Dépense pour": "Matumizi kwa ajili ya", "Offrande / dîme ordinaire (caisse générale)": "Sadaka / zaka ya kawaida (mfuko mkuu)", "Fonctionnement ordinaire de l'église": "Uendeshaji wa kawaida wa kanisa", "Clôturer le projet": "Funga mradi", "Rouvrir": "Fungua tena", "Projets clôturés": "Miradi iliyofungwa", "Date de fin passée": "Tarehe ya mwisho imepita", "Projet clôturé": "Mradi umefungwa", "Projet rouvert": "Mradi umefunguliwa tena", "Aucun projet en cours. Cliquez sur « + Nouveau projet » pour commencer.": "Hakuna mradi unaoendelea. Bonyeza « + Mradi mpya » kuanza.", "Un projet = une récolte de fonds (achat de la parcelle, construction, mission…). Chaque dimanche, enregistrez les contributions et les noms des personnes. Quand le projet est terminé, ouvrez-le et cliquez sur « Clôturer le projet ».": "Mradi = uchangishaji (ununuzi wa kiwanja, ujenzi, misheni…). Kila Jumapili, andika michango na majina ya watu. Mradi ukiisha, ufungue na ubonyeze « Funga mradi ».", "Tous les membres": "Washiriki wote", "Réunion de groupe": "Mkutano wa kikundi", "Permanent": "Wa kudumu", "Irrégulier": "Si wa kawaida", "Rarement présent": "Huhudhuria mara chache", "Permanent = présent à au moins 75 % des séances · Irrégulier = 40 à 74 % · Rarement = moins de 40 %.": "Wa kudumu = yupo katika angalau 75 % ya vipindi · Si wa kawaida = 40 hadi 74 % · Mara chache = chini ya 40 %.", "Finances limitées : seulement les offrandes ordinaires (caisse générale) et ses dépenses — pas les dîmes, projets, parcelle ni les autres fonds": "Fedha zenye mipaka: sadaka za kawaida tu (mfuko mkuu) na matumizi yake — si zaka, miradi, kiwanja wala mifuko mingine", "Accès limité : vous voyez et saisissez seulement les offrandes ordinaires de la caisse générale et ses dépenses.": "Ufikiaji wenye mipaka: unaona na kuandika sadaka za kawaida za mfuko mkuu na matumizi yake tu.", "Offrande ordinaire (caisse générale)": "Sadaka ya kawaida (mfuko mkuu)", "Offrandes ordinaires": "Sadaka za kawaida", "Prêts": "Mikopo", "Prêt accordé": "Mkopo uliotolewa", "Remboursement de prêt": "Malipo ya mkopo", "Remboursement": "Malipo", "+ Remboursement": "+ Malipo", "+ Nouveau prêt": "+ Mkopo mpya", "Nouveau prêt d'argent": "Mkopo mpya wa fedha", "Modifier le prêt": "Hariri mkopo", "Prêté à (membre)": "Amekopeshwa (mshiriki)", "Date du prêt": "Tarehe ya mkopo", "À rendre avant le (facultatif)": "Kurudishwa kabla ya (si lazima)", "Montant prêté": "Kiasi kilichokopeshwa", "Pris dans le compte": "Imetoka akaunti", "Motif / conditions": "Sababu / masharti", "Déposé dans le compte": "Imewekwa kwenye akaunti", "Encore dû à l'église": "Bado inadaiwa na kanisa", "Prêts remboursés": "Mikopo iliyolipwa", "Déjà remboursé": "Tayari imelipwa", "Reste à rendre": "Kilichobaki kulipwa", "Remboursements": "Malipo", "Remboursé": "Imelipwa", "Aucun remboursement pour l'instant.": "Hakuna malipo bado.", "‹ Prêts": "‹ Mikopo", "L'argent prêté sort de la caisse mais n'est pas une dépense : il reste dû à l'église. Chaque remboursement le fait revenir dans la caisse.": "Pesa iliyokopeshwa inatoka kwenye sanduku lakini si matumizi: bado inadaiwa na kanisa. Kila malipo yanairudisha.", "Aucun prêt enregistré. Cliquez sur « + Nouveau prêt » quand l'église prête de l'argent à quelqu'un.": "Hakuna mkopo ulioandikishwa. Bonyeza « + Mkopo mpya » kanisa linapomkopesha mtu pesa.", "Quantité en stock (corrigez si besoin)": "Idadi iliyopo (sahihisha ikihitajika)", "Correction manuelle de la quantité": "Marekebisho ya idadi", "Modifier le mouvement": "Hariri mwenendo", "Quantité (+ ou −)": "Idadi (+ au −)", "Le stock deviendrait négatif": "Akiba ingekuwa hasi", "Ajustement inventaire": "Marekebisho ya akiba", "Gain / perte par mois": "Faida / hasara kwa mwezi", "Gain / perte par mois (équiv. $)": "Faida / hasara kwa mwezi (sawa na $)", "Prêts : encore dû à l'église": "Mikopo: bado inadaiwa na kanisa", "Vert = recettes plus grandes que les dépenses ; rouge = l'église a dépensé plus qu'elle n'a reçu. Les prêts ne comptent pas.": "Kijani = mapato zaidi ya matumizi; nyekundu = kanisa limetumia zaidi ya lilivyopokea. Mikopo haihesabiwi.", "Aucun prêt en cours. Tout l'argent prêté a été rendu.": "Hakuna mkopo unaoendelea. Pesa zote zilizokopeshwa zimerudishwa.", "Journal": "Kumbukumbu", "Logo et couleur de l'église": "Nembo na rangi ya kanisa", "📷 Changer le logo": "📷 Badilisha nembo", "Couleur principale": "Rangi kuu", "Autre…": "Nyingine…", "🪪 Carte": "🪪 Kadi", "🪪 Cartes": "🪪 Kadi", "📷 Scanner les cartes": "📷 Changanua kadi", "Contribution enregistrée ✓": "Mchango umeandikishwa ✓", "Voulez-vous lui envoyer un reçu ?": "Unataka kumtumia risiti?", "Plus tard": "Baadaye", "📄 Reçu PDF": "📄 Risiti PDF", "📲 Envoyer (WhatsApp…)": "📲 Tuma (WhatsApp…)", "🧾 Reçu du donateur": "🧾 Risiti ya mtoaji", "Ma carte de membre": "Kadi yangu ya mshiriki", "Montrez ce code à l'accueil pour enregistrer votre présence.": "Onyesha msimbo huu mapokezi kuandikisha mahudhurio yako.", "Télécharger ma carte (PDF)": "Pakua kadi yangu (PDF)", "Sauvegarder maintenant": "Hifadhi nakala sasa", "Aucune sauvegarde faite": "Hakuna nakala iliyofanywa", "Gardez une copie de toutes les données de l'église en lieu sûr.": "Weka nakala ya data zote za kanisa mahali salama.", "Sauvegardes automatiques": "Nakala za kiotomatiki", "Aucune modification enregistrée pour le moment.": "Hakuna mabadiliko yaliyoandikishwa bado.", "Ajout": "Kuongeza", "Modification": "Badiliko", "Suppression": "Kufuta", "Tous les mois": "Miezi yote", "Terminer": "Maliza", "Compris": "Nimeelewa", "Administrateur (accès total)": "Msimamizi (ufikiaji kamili)"}};
const getLang=()=>{try{return localStorage.getItem('emt_lang')||'fr'}catch(e){return'fr'}};
const LOC=()=>({en:'en-GB',sw:'sw-KE'}[getLang()]||'fr-FR');
const TRX={en:[
 [/^(\d+) sur (\d+)$/,'$1 of $2'],[/^Dépenses (.+?) : (.*)$/,'Expenses $1: $2'],[/^Recettes (.+?) : (.*)$/,'Income $1: $2'],
 [/^Situation des comptes au (.+)$/,'Account balances at $1'],[/^Échéance (.+)$/,'Due $1'],[/^([^·]*) à (\d\d:\d\d)$/,'$1 at $2'],
 [/^Résultat \(Année (\d{4})\)$/,'Result (Year $1)'],[/^Rapport de (.+?) – (.+)$/,'Report for $1 – $2'],
 [/^Aucun budget pour (\d{4})\. .*/,'No budget for $1. Click "Create the budget" to set an amount per category; actual figures are calculated automatically from transactions.'],
 [/^Durée totale : (.+?) · fin prévue à (.+)$/,'Total duration: $1 · planned end at $2'],
 [/^Nous sommes à (.+?) % de l'année$/,'We are $1 % through the year'],
 [/^solde : (.+)$/,'balance: $1'],
 [/^sur les (\d+) derniers cultes$/,'over the last $1 services'],
 [/^≈ (.+?) \$ au total \(1 \$ = (.+?) FC\)$/,'≈ $1 $ in total (1 $ = $2 FC)'],
 [/^≈ (.+?) \$ au taux de (.+?) FC$/,'≈ $1 $ at the rate of $2 FC'],
 [/^équiv\. \$, (\d+) derniers mois$/,'$ equiv., last $1 months'],
 [/^· (\d+) caractères$/,'· $1 characters'],
 [/^Les montants dans l'autre devise sont convertis au taux de (.+?) FC pour 1 \$\.$/,'Amounts in the other currency are converted at $1 FC for 1 $.'],
 [/^Participation (\d{4})$/,'Participation $1'],[/^Projet : (.+?)( \(clôturé\))?$/,(a,b,c)=>'Project: '+b+(c?' (closed)':'')],
 [/^(\d+) personnes?$/,'$1 people'],[/^(\d+) membres?$/,'$1 members'],[/^(\d+) visiteurs?$/,'$1 visitors'],[/^(\d+) présents?$/,'$1 present'],[/^(\d+) absents?$/,'$1 absent'],
 [/^(\d+) ans$/,'$1 years'],[/^il y a (\d+) jours?$/,'$1 days ago'],[/^dans (\d+) jours?$/,'in $1 days']
],sw:[
 [/^(\d+) sur (\d+)$/,'$1 kati ya $2'],[/^Dépenses (.+?) : (.*)$/,'Matumizi $1: $2'],[/^Recettes (.+?) : (.*)$/,'Mapato $1: $2'],
 [/^Situation des comptes au (.+)$/,'Hali ya akaunti tarehe $1'],[/^Échéance (.+)$/,'Mwisho $1'],[/^([^·]*) à (\d\d:\d\d)$/,'$1 saa $2'],
 [/^Résultat \(Année (\d{4})\)$/,'Matokeo (Mwaka $1)'],[/^Rapport de (.+?) – (.+)$/,'Ripoti ya $1 – $2'],
 [/^Aucun budget pour (\d{4})\. .*/,'Hakuna bajeti ya $1. Bonyeza « Unda bajeti » kuweka kiasi kwa kila aina; halisi huhesabiwa kiotomatiki kutoka kwa miamala.'],
 [/^Durée totale : (.+?) · fin prévue à (.+)$/,'Muda wote: $1 · mwisho unatarajiwa saa $2'],
 [/^Nous sommes à (.+?) % de l'année$/,'Tumefikia $1 % ya mwaka'],
 [/^solde : (.+)$/,'salio: $1'],
 [/^sur les (\d+) derniers cultes$/,'katika ibada $1 zilizopita'],
 [/^≈ (.+?) \$ au total \(1 \$ = (.+?) FC\)$/,'≈ $1 $ kwa jumla (1 $ = $2 FC)'],
 [/^≈ (.+?) \$ au taux de (.+?) FC$/,'≈ $1 $ kwa kiwango cha $2 FC'],
 [/^équiv\. \$, (\d+) derniers mois$/,'sawa na $, miezi $1 iliyopita'],
 [/^· (\d+) caractères$/,'· herufi $1'],
 [/^Les montants dans l'autre devise sont convertis au taux de (.+?) FC pour 1 \$\.$/,'Kiasi katika sarafu nyingine hubadilishwa kwa $1 FC kwa 1 $.'],
 [/^Participation (\d{4})$/,'Ushiriki $1'],[/^Projet : (.+?)( \(clôturé\))?$/,(a,b,c)=>'Mradi: '+b+(c?' (umefungwa)':'')],
 [/^(\d+) personnes?$/,'watu $1'],[/^(\d+) membres?$/,'washiriki $1'],[/^(\d+) visiteurs?$/,'wageni $1'],[/^(\d+) présents?$/,'$1 waliohudhuria'],[/^(\d+) absents?$/,'$1 wasiohudhuria'],
 [/^(\d+) ans$/,'miaka $1'],[/^il y a (\d+) jours?$/,'siku $1 zilizopita'],[/^dans (\d+) jours?$/,'baada ya siku $1']
]};
function trS(s,D,d){
  if(D[s]!==undefined)return D[s];for(const[r,v]of(TRX[getLang()]||[]))if(r.test(s))return s.replace(r,v);if((d=d||0)>3)return s;let m;
  for(const sep of[' · ',' – ',' — ',' : ',' → ']){if(s.includes(sep)){const p=s.split(sep),q=p.map(x=>trS(x,D,d+1));if(q.some((x,i)=>x!==p[i]))return q.join(sep)}}
  if((m=s.match(/^([+−‹→✓] ?)(.+)$/))){const r=trS(m[2],D,d+1);if(r!==m[2])return m[1]+r}
  if((m=s.match(/^(.*?)( \*)$/))&&D[m[1]])return D[m[1]]+m[2];
  if((m=s.match(/^(.+?)\s*\(([\d\s]+)\)$/))){const r=trS(m[1],D,d+1);if(r!==m[1])return r+' ('+m[2]+')'}
  if((m=s.match(/^([+−\-]?[\d][\d\s.,]*\s?%?)\s+(.+)$/))){const r=trS(m[2],D,d+1);if(r!==m[2])return m[1]+' '+r}
  if((m=s.match(/^(\d\d:\d\d)\s+(.+)$/))){const r=trS(m[2],D,d+1);if(r!==m[2])return m[1]+' '+r}
  if((m=s.match(/^(.+?)\s+(\d{4})$/))){const r=trS(m[1],D,d+1);if(r!==m[1])return r+' '+m[2]}
  if((m=s.match(/^(.+?)\s*:$/))){const r=trS(m[1],D,d+1);if(r!==m[1])return r+' :'}
  return s;
}
function TR(t){const L=getLang();if(L==='fr'||t==null)return t;const D=TRD[L];if(!D)return t;const s=String(t).trim();if(!s)return t;const r=trS(s,D);return r===s?t:String(t).replace(s,r)}
const NOTR=n=>{for(let e=n.nodeType===1?n:n.parentNode;e&&e!==document.body;e=e.parentNode){if(e.tagName==='TEXTAREA'||e.tagName==='SCRIPT'||e.tagName==='STYLE'||(e.dataset&&e.dataset.notr!==undefined)||(e.classList&&e.classList.contains('bub')))return true}return false};
const ORIG=new WeakMap();
function trText(n){const o=ORIG.has(n)?ORIG.get(n):n.data;const r=TR(o);if(r!==o){ORIG.set(n,o);if(n.data!==r)n.data=r}}
function trNode(root){if(getLang()==='fr'||!root||NOTR(root))return;
  if(root.nodeType===3){trText(root);return}
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(!NOTR(n))trText(n)}
  if(root.querySelectorAll)root.querySelectorAll('[placeholder],[title]').forEach(e=>{['placeholder','title'].forEach(a=>{const k='data-o'+a,t=e.getAttribute(k)||e.getAttribute(a);if(t){const r=TR(t);if(r!==t){e.setAttribute(k,t);e.setAttribute(a,r)}}})})}
function setLang(l){try{localStorage.setItem('emt_lang',l)}catch(x){}document.documentElement.lang=l;
  const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(ORIG.has(n)){n.data=ORIG.get(n);ORIG.delete(n)}}
  document.querySelectorAll('[data-oplaceholder],[data-otitle]').forEach(e=>{['placeholder','title'].forEach(a=>{const o=e.getAttribute('data-o'+a);if(o!=null){e.setAttribute(a,o);e.removeAttribute('data-o'+a)}})});
  trNode(document.body)}
new MutationObserver(ms=>{if(getLang()==='fr')return;ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1||n.nodeType===3)trNode(n)}))}).observe(document.body,{childList:true,subtree:true});
document.documentElement.lang=getLang();
if(getLang()!=='fr')setTimeout(()=>trNode(document.body),0);

/* ---------- aide ---------- */
function vAide(){
  const S2=[['Premiers pas','1. Paramètres → Modifier : nom, adresse, ville, taux du dollar, caisses et comptes.\n2. Groupes : créez vos départements (chorale, jeunesse, mamans…).\n3. Membres : ajoutez les personnes ou importez votre liste Excel (Importer, format CSV).\n4. Partagez la page avec vos responsables (bouton Partager, niveau Contributor) puis donnez-leur un rôle dans Paramètres.'],
  ['Le dimanche','• Avant : Culte & bénévoles → plan du culte, équipe, invitations WhatsApp.\n• À l\'entrée : Présences → Mode borne (les membres tapent leur numéro) ou Pointage par nom.\n• Visiteurs : Formulaires → Fiche visiteur en mode tablette (crée la fiche membre et le suivi d\'accueil).\n• Collecte : Dons → Nouveau lot, saisir les enveloppes puis Clôturer.\n• Après : Présences → Reporter dans le comptage.'],
  ['Finances','• Chaque entrée/sortie a un fonds (à quoi sert l\'argent) et un compte (où il se trouve : caisse, banque, mobile money).\n• Virement : dépôt de la caisse à la banque.\n• Rapprochement : comparer avec le relevé ou le comptage de caisse.\n• Budget et États financiers en PDF pour le comité.\n• Imprimer un bon : ouvrir l\'opération → Imprimer le bon.'],
  ['Communication','• Messages : choisir les destinataires, le canal et un modèle ; chaque bouton ouvre WhatsApp avec le message personnalisé.\n• L\'IA peut améliorer le ton ou traduire en lingala, swahili, anglais.\n• Bulletin : composer puis exporter en PDF ou en texte WhatsApp.'],
  ['Sécurité et sauvegarde','• Chaque utilisateur a son code personnel ; verrouillage après 15 min.\n• Paramètres → Télécharger la sauvegarde : faites-le chaque mois.\n• Les rôles masquent des écrans mais toute personne avec qui la page est partagée peut techniquement lire les données : ne partagez qu\'avec des personnes de confiance.'],
  ['Ce que l\'application ne fait pas','• Pas d\'envoi automatique de SMS, e-mails ou notifications (les messages passent par WhatsApp/votre téléphone).\n• Pas de paiement en ligne (les paiements sont enregistrés à la main).\n• Les membres n\'ont pas de compte : seules les personnes avec qui vous partagez la page l\'utilisent.']];
  return`<div class="card" style="margin-bottom:12px;display:flex;align-items:center;gap:10px"><div style="flex:1"><b>Une question ?</b><div class="muted small">L'assistant IA (Rapports → Assistant IA) répond sur vos données ; ce guide explique l'utilisation.</div></div><button class="btn primary" data-act="goIA">Assistant IA</button></div>
  ${S2.map(([t,b],i)=>`<details class="card" style="margin-bottom:10px"${i?'':' open'}><summary style="font-weight:600;cursor:pointer">${t}</summary><div style="white-space:pre-wrap;margin-top:10px;line-height:1.6">${esc(b)}</div></details>`).join('')}`;
}

/* ================= ALBUM PHOTO & INVENTAIRE ================= */
const blobUrl=id=>id?(id.startsWith('blob:')?id:(window.EMT_ASSET_BASE||'/_blob/')+id):'';
async function getAssets(){try{return window.claude?await window.claude.use('assets'):null}catch(e){return null}}
function shrink(file,max,q){return new Promise((res,rej)=>{const u=URL.createObjectURL(file),im=new Image();im.onload=()=>{const r=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*r);c.height=Math.round(im.height*r);c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);c.toBlob(b=>b?res(b):rej(),'image/jpeg',q)};im.onerror=()=>{URL.revokeObjectURL(u);rej()};im.src=u})}
async function uploadPhoto(file){
  const full=await shrink(file,1600,.82),thumb=await shrink(file,420,.72);
  const A=await getAssets();
  if(!A){if(db)throw{code:'not_granted'};return{id:URL.createObjectURL(full),thumb:URL.createObjectURL(thumb)}}
  const f=await A.upload(full,{type:'image/jpeg'}),t=await A.upload(thumb,{type:'image/jpeg'});return{id:f.id,thumb:t.id};
}
const upErr=e=>e&&e.code==='not_granted'?"Votre rôle ne permet pas d'ajouter des photos.":e&&e.code==='quota_or_state'?"Espace de stockage des photos plein.":e&&e.code==='too_large'?"Photo trop lourde.":"Échec de l'envoi de la photo.";

/* ---------- album ---------- */
function vAlbum(){
  if(UI.album)return albumView(S.albums.find(a=>a.id===UI.album));
  const l=[...S.albums].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  return`<div class="toolbar"><div class="muted small">Cultes, baptêmes, mariages, évangélisation, travaux de la parcelle…</div><span class="sp"></span><button class="btn primary" data-act="newAlbum">+ Nouvel album</button></div>
  ${l.length?`<div class="grid3">${l.map(a=>{const P=S.photos.filter(p=>p.albumId===a.id),cov=P.find(p=>p.id===a.couverture)||P[0];return`<div class="card" style="padding:0;overflow:hidden;cursor:pointer" data-act="openAlbum" data-id="${a.id}"><div style="aspect-ratio:4/3;background:#e6ecf6 ${cov?`url('${blobUrl(cov.thumb||cov.assetId)}') center/cover`:''};display:grid;place-items:center;color:#8aa">${cov?'':'Aucune photo'}</div><div style="padding:10px 12px"><b>${esc(a.titre)}</b><div class="muted small">${fdate(a.date)} · ${P.length} photo(s)</div></div></div>`}).join('')}</div>`:'<div class="card empty">Aucun album. Créez le premier !</div>'}`;
}
function albumView(a){
  if(!a){UI.album=null;return''}
  const P=S.photos.filter(p=>p.albumId===a.id).sort((x,y)=>String(x.at).localeCompare(String(y.at)));
  return`<div class="toolbar"><button class="btn sm" data-act="closeAlbum">‹ Albums</button><b style="margin-left:6px">${esc(a.titre)}</b><span class="muted small">${fdate(a.date)}</span><span class="sp"></span><button class="btn sm" data-act="editAlbum" data-id="${a.id}">Modifier</button><label class="btn sm primary" style="display:inline-block">${UI.upBusy?'Envoi '+UI.upBusy:'+ Ajouter des photos'}<input type="file" id="photoIn" accept="image/*" multiple style="display:none"></label></div>
  ${a.description?`<div class="muted" style="margin-bottom:10px">${esc(a.description)}</div>`:''}
  ${P.length?`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:6px">${P.map((p,i)=>`<div data-act="lightbox" data-i="${i}" style="aspect-ratio:1;border-radius:8px;cursor:pointer;background:#e6ecf6 url('${blobUrl(p.thumb||p.assetId)}') center/cover"${p.legende?` title="${esc(p.legende)}"`:''}></div>`).join('')}</div>`:'<div class="card empty">Aucune photo. Ajoutez-en depuis votre téléphone ou ordinateur (elles sont réduites automatiquement).</div>'}`;
}
function lightbox(i){
  const P=S.photos.filter(p=>p.albumId===UI.album).sort((x,y)=>String(x.at).localeCompare(String(y.at)));const p=P[i];if(!p)return;
  let el=$('#lbx');if(!el){el=document.createElement('div');el.id='lbx';el.className='modal open';el.style.cssText='background:rgba(0,0,0,.92);z-index:120;align-items:center;flex-direction:column;padding:12px';document.body.appendChild(el)}
  el.innerHTML=`<div style="display:flex;gap:8px;width:100%;max-width:1000px;color:#fff;align-items:center"><span class="small" style="flex:1">${i+1} / ${P.length}</span><button class="btn sm" id="lbCov">Couverture</button><button class="btn sm" id="lbLeg">Légende</button><button class="btn sm" id="lbDl">Télécharger</button><button class="btn sm danger" id="lbDel">Supprimer</button><button class="btn sm" id="lbX">✕</button></div>
  <div style="flex:1;display:flex;align-items:center;gap:8px;width:100%;max-width:1000px;min-height:0;margin:10px 0"><button class="btn" id="lbP" ${i?'':'disabled'}>‹</button><img src="${blobUrl(p.assetId)}" style="flex:1;min-width:0;max-height:78vh;object-fit:contain" alt=""><button class="btn" id="lbN" ${i<P.length-1?'':'disabled'}>›</button></div>
  <div style="color:#fff;min-height:20px">${esc(p.legende||'')}</div>`;
  const go=j=>lightbox(j);el.querySelector('#lbX').onclick=()=>el.remove();el.querySelector('#lbP').onclick=()=>go(i-1);el.querySelector('#lbN').onclick=()=>go(i+1);
  el.onkeydown=null;document.onkeydown=e=>{if(!$('#lbx'))return;if(e.key==='ArrowLeft'&&i)go(i-1);if(e.key==='ArrowRight'&&i<P.length-1)go(i+1);if(e.key==='Escape')el.remove()};
  let x0=null;el.ontouchstart=e=>x0=e.touches[0].clientX;el.ontouchend=e=>{if(x0===null)return;const dx=e.changedTouches[0].clientX-x0;if(dx>50&&i)go(i-1);else if(dx<-50&&i<P.length-1)go(i+1);x0=null};
  el.querySelector('#lbCov').onclick=async()=>{const a=S.albums.find(x=>x.id===UI.album);if(await save('albums',{...a,couverture:p.id}))toast('Couverture définie')};
  el.querySelector('#lbLeg').onclick=()=>{el.remove();openForm({title:'Légende',values:p,fields:[{k:'legende',label:'Légende',full:1}],onSave:d=>save('photos',{...p,...d})})};
  el.querySelector('#lbDl').onclick=async()=>{try{const b=await (await fetch(blobUrl(p.assetId))).blob();const dl=await window.claude.use('downloads');await dl.save({filename:`photo-${i+1}.jpg`,data:b})}catch(e){if(!e||e.code!=='declined')toast('Téléchargement indisponible',1)}};
  el.querySelector('#lbDel').onclick=()=>{el.remove();confirmBox('Supprimer définitivement cette photo ?',async()=>{const A=await getAssets();if(A&&!String(p.assetId).startsWith('blob:')){try{await A.delete(p.assetId);if(p.thumb)await A.delete(p.thumb)}catch(e){toast(e&&e.code==='not_uploader'?'Seul celui qui a ajouté la photo peut la supprimer':'Échec',1);return false}}return removeDoc('photos',p.id)})};
}
async function addPhotos(files){
  const a=UI.album;let n=0;for(const f of files){UI.upBusy=`${n+1}/${files.length}…`;render();try{const r=await uploadPhoto(f);await save('photos',{albumId:a,assetId:r.id,thumb:r.thumb,legende:'',at:new Date().toISOString()});n++}catch(e){toast(upErr(e),1);break}}
  UI.upBusy=0;render();if(n)toast(n+' photo(s) ajoutée(s)');
}
function albumForm(a){openForm({title:a?'Modifier l\'album':'Nouvel album',values:a||{date:today()},fields:[{k:'titre',label:'Titre',req:1,full:1},{k:'date',label:'Date',type:'date'},{k:'description',label:'Description',type:'textarea',full:1}],
  onSave:async d=>{const id=await save('albums',{...(a||{}),...d});if(id&&!a){UI.album=id;render()}return id},
  onDelete:a?async()=>{if(S.photos.some(p=>p.albumId===a.id)){toast('Supprimez d\'abord les photos de l\'album',1);return false}const ok=await removeDoc('albums',a.id);if(ok){UI.album=null;render()}return ok}:null})}

/* ---------- inventaire ---------- */
const ETATS=['Bon','Usé','En réparation','En panne','Hors service'];
const MVT={entree:['Entrée (achat, don)','+'],sortie:['Sortie (consommé, donné)','−'],pret:['Prêt','−'],retour:['Retour de prêt','+'],perte:['Perte / casse','−'],ajust:['Ajustement inventaire','±']};
const ITABS=[['articles','Articles'],['mouvements','Mouvements'],['prets','Prêts en cours'],['comptage','Inventaire physique']];
function materielList(){return(cfg().materiel||[]).concat(S.articles.filter(a=>a.reservable).map(a=>({nom:a.nom,quantite:num(a.quantite)})))}
function vInventaire(){
  const sub={articles:vArticles,mouvements:vMouvements,prets:vPrets,comptage:vComptageInv}[UI.iTab]||vArticles;
  return`<div class="tabs" style="margin-bottom:12px">${ITABS.map(([k,l])=>`<button class="tab${UI.iTab===k?' on':''}" data-act="iTab" data-k="${k}">${l}</button>`).join('')}</div>`+sub();
}
function prets(){const o={};S.mouvements.filter(m=>m.type==='pret'||m.type==='retour').forEach(m=>{const k=m.articleId+'|'+(m.membreId||m.par||'');o[k]=(o[k]||0)+(m.type==='pret'?1:-1)*num(m.qte)});return Object.entries(o).filter(([,q])=>q>0).map(([k,q])=>{const[a,p]=k.split('|');return{articleId:a,qui:p,qte:q}})}
/* Catégories d'inventaire organisées par famille */
const INV_FAM=[
 ['🎵 Musique & louange',['Instruments de musique','Guitares / basses','Claviers / pianos','Batterie / drum','Percussions (tam-tam, djembé…)','Micros','Pupitres / partitions']],
 ['🔊 Sonorisation & audiovisuel',['Baffles / enceintes','Table de mixage','Amplificateurs','Câbles & connectique','Projecteur / écran','Caméras / diffusion en direct','Éclairage / projecteurs']],
 ['⚡ Énergie & électricité',['Groupe électrogène','Carburant','Rallonges / multiprises','Batteries / onduleurs','Ampoules / lampes']],
 ['🪑 Mobilier',['Chaises','Bancs','Tables','Chaire / pupitre de prédication','Estrade / podium','Armoires / étagères','Ventilateurs / climatiseurs']],
 ['🎀 Textile & décoration',['Housses de chaises','Nappes','Rideaux','Tapis','Banderoles / bâches','Fleurs / décoration']],
 ['⛪ Culte & sacrements',['Paniers d\'offrandes','Sainte-Cène (coupes, plateaux)','Matériel de baptême','Bibles','Recueils de cantiques','Toges / tenues']],
 ['🍽️ Cuisine & accueil',['Vaisselle','Marmites / casseroles','Glacières / bidons d\'eau','Réchauds / bonbonnes de gaz']],
 ['💻 Bureau & informatique',['Ordinateurs','Imprimante / photocopieuse','Téléphones / tablettes','Fournitures de bureau']],
 ['🧹 Entretien & sécurité',['Produits d\'entretien','Balais / seaux','Outils','Extincteurs','Trousse de secours']],
 ['🧸 École du dimanche',['Matériel pédagogique / jouets','Petites chaises / tables']],
 ['🚐 Véhicule & transport',['Véhicule','Pièces / accessoires']]
];
const INV_OLD={'Sonorisation':1,'Instruments':0,'Mobilier':3,'Vaisselle / cuisine':6,'Décoration':4,'Informatique':7,'Fournitures de bureau':7,'Entretien':8,'Vêtements / toges':5,'Livres / bibles':5};
function famOf(c){if(!c)return'📦 Autre';for(const[f,l]of INV_FAM)if(l.includes(c))return f;if(c in INV_OLD)return INV_FAM[INV_OLD[c]][0];return'📦 Autre'}
const famIdx=f=>{const i=INV_FAM.findIndex(x=>x[0]===f);return i<0?99:i};
function invCatOptions(cur){const known=new Set(INV_FAM.flatMap(x=>x[1])),mine=[...new Set(S.articles.map(a=>a.categorie).concat(cur||[]).filter(c=>c&&!known.has(c)))].sort();
  return[['','— Choisir —']].concat(INV_FAM.map(([g,l])=>({group:g,items:l})),mine.length?[{group:'📦 Mes autres catégories',items:mine}]:[],[{group:'➕ Nouvelle',items:[['__autre','Autre (préciser ci-dessous)…']]}])}
function vArticles(){
  const q=UI.invQ.toLowerCase(),C=UI.invCat,l=[...S.articles].filter(a=>(!q||[a.nom,a.emplacement,a.categorie,famOf(a.categorie),a.notes].join(' ').toLowerCase().includes(q))&&(!C||(C.startsWith('F:')?famOf(a.categorie)===C.slice(2):a.categorie===C))).sort((a,b)=>famIdx(famOf(a.categorie))-famIdx(famOf(b.categorie))||(a.nom||'').localeCompare(b.nom||'','fr'));
  const cats=[...new Set(S.articles.map(a=>a.categorie).filter(Boolean))].sort();
  const low=S.articles.filter(a=>num(a.seuil)&&num(a.quantite)<=num(a.seuil)),bad=S.articles.filter(a=>['En panne','Hors service','En réparation'].includes(a.etat));
  const val={CDF:0,USD:0};S.articles.forEach(a=>val[a.devise==='CDF'?'CDF':'USD']+=num(a.valeurUnit)*num(a.quantite));
  return`<div class="grid4" style="margin-bottom:12px"><div class="card kpi"><div class="l">Articles</div><div class="v">${S.articles.length}</div><div class="s">${S.articles.reduce((s,a)=>s+num(a.quantite),0)} unités</div></div><div class="card kpi"><div class="l">Valeur estimée</div><div class="v" style="font-size:16px">${money(val.USD,'USD')}</div><div class="s">${money(val.CDF,'CDF')}</div></div><div class="card kpi"><div class="l">Stock bas</div><div class="v ${low.length?'neg':''}">${low.length}</div></div><div class="card kpi"><div class="l">En panne / réparation</div><div class="v ${bad.length?'neg':''}">${bad.length}</div></div></div>
  <div class="toolbar"><input class="inp" id="invQ" data-bind="invQ" value="${esc(UI.invQ)}" placeholder="Rechercher un article, un emplacement…" style="flex:1;min-width:160px"><select class="inp" data-bind="invCat"><option value="">Toutes catégories</option>${[...new Set(S.articles.map(a=>famOf(a.categorie)))].sort((a,b)=>famIdx(a)-famIdx(b)).map(f=>{const cs=cats.filter(c=>famOf(c)===f);return`<optgroup label="${esc(f)}"><option value="F:${esc(f)}"${C==='F:'+f?' selected':''}>Toute la famille (${S.articles.filter(a=>famOf(a.categorie)===f).length})</option>${cs.map(x=>opt(x,C)).join('')}</optgroup>`}).join('')}</select><button class="btn" data-act="pdfInv">PDF</button><button class="btn" data-act="exportInv">Excel</button><button class="btn primary" data-act="newArticle">+ Article</button></div>
  <div class="list">${l.length?l.map((a,i)=>{const fm=famOf(a.categorie),hd=i===0||famOf(l[i-1].categorie)!==fm?`<div class="muted small" style="margin:${i?14:4}px 2px 6px;font-weight:700;letter-spacing:.3px">${esc(fm)} · ${l.filter(x=>famOf(x.categorie)===fm).length}</div>`:'';const lw=num(a.seuil)&&num(a.quantite)<=num(a.seuil);return hd+`<div class="row" data-act="editArticle" data-id="${a.id}">${a.photo?`<div style="width:42px;height:42px;border-radius:8px;flex:none;background:#e6ecf6 url('${blobUrl(a.photo)}') center/cover"></div>`:`<div class="av" style="background:#8fa6cc;border-radius:8px">${esc((a.nom||'?')[0].toUpperCase())}</div>`}<div class="grow"><div class="t">${esc(a.nom)}${a.reservable?' <span class="badge">réservable</span>':''}</div><div class="st">${esc([a.categorie,a.emplacement,a.responsable&&memberById(a.responsable)?'resp. '+fullName(memberById(a.responsable)):''].filter(Boolean).join(' · '))}</div></div><span class="badge ${a.etat==='Bon'||!a.etat?'b-done':a.etat==='Usé'?'b-encours':'b-todo'}">${esc(a.etat||'Bon')}</span><div class="amt ${lw?'neg':''}" style="min-width:64px">${num(a.quantite)} ${esc(a.unite||'')}</div><button class="btn sm" data-act="newMvt" data-id="${a.id}" title="Entrée / sortie / prêt">±</button><button class="btn sm" data-act="editArticle" data-id="${a.id}" title="Modifier">✏️</button></div>`}).join(''):`<div class="empty">${S.articles.length?'Aucun résultat.':'Aucun article. Ajoutez chaises, instruments, sonorisation, vaisselle, fournitures…'}</div>`}</div>`;
}
function articleForm(a){
  openForm({title:a?'Modifier l\'article':'Nouvel article',values:a||{quantite:1,etat:'Bon',devise:'USD',unite:'pièce(s)'},
   fields:[{k:'nom',label:'Désignation',req:1,full:1},{k:'categorie',label:'Catégorie',type:'select',options:invCatOptions(a&&a.categorie)},{k:'catLibre',label:'Nouvelle catégorie (si « Autre »)'},{k:'emplacement',label:'Emplacement',list:[...new Set(S.articles.map(x=>x.emplacement).filter(Boolean))]},
    {k:'quantite',label:a?'Quantité en stock (corrigez si besoin)':'Quantité',type:'number'},{k:'unite',label:'Unité'},{k:'etat',label:'État',type:'select',options:ETATS},{k:'seuil',label:'Alerte si stock ≤',type:'number'},{k:'valeurUnit',label:'Valeur unitaire',type:'number'},{k:'devise',label:'Devise',type:'select',options:[['USD','Dollars ($)'],['CDF','Francs congolais']]},
    {k:'responsable',label:'Responsable',type:'select',options:memberOptions()},{k:'numSerie',label:'N° de série / marque'},{k:'reservable',label:'Réservable (apparaît dans Salles & matériel)',type:'checkbox',full:1},{k:'notes',label:'Notes',type:'textarea',full:1}],
   onSave:async d=>{if(d.categorie==='__autre'){if(!String(d.catLibre||'').trim()){toast('Écrivez le nom de la nouvelle catégorie',1);return false}d.categorie=d.catLibre.trim()}delete d.catLibre;const dq=a?num(d.quantite)-num(a.quantite):0;if(a&&num(d.quantite)<0){toast('Quantité invalide',1);return false}const id=await save('articles',{...(a||{}),...d});if(id&&a&&dq)await save('mouvements',{articleId:a.id,type:'ajust',qte:dq,date:today(),motif:'Correction manuelle de la quantité',par:ME&&ME.name||''});if(id&&!a&&num(d.quantite))await save('mouvements',{articleId:id,type:'entree',qte:num(d.quantite),date:today(),motif:'Stock initial',par:ME&&ME.name||''});return id},
   onDelete:a?()=>removeDoc('articles',a.id):null,
   extra:a?[{label:'Photo',fn:()=>{const i=document.createElement('input');i.type='file';i.accept='image/*';i.onchange=async()=>{if(!i.files[0])return;toast('Envoi…');try{const r=await uploadPhoto(i.files[0]);await save('articles',{...a,photo:r.thumb});toast('Photo ajoutée');closeModal()}catch(e){toast(upErr(e),1)}};i.click()}},{label:'Historique',fn:()=>{UI.iTab='mouvements';UI.mvtArt=a.id;closeModal();render()}}]:[]});
}
function mvtForm(a){
  openForm({title:'Mouvement – '+a.nom+' (stock : '+num(a.quantite)+')',values:{type:'sortie',qte:1,date:today()},
   fields:[{k:'type',label:'Type',type:'select',options:Object.entries(MVT).filter(([k])=>k!=='ajust').map(([k,v])=>[k,v[0]])},{k:'qte',label:'Quantité',type:'number',req:1},{k:'date',label:'Date',type:'date'},{k:'membreId',label:'Personne (prêt / retour)',type:'select',options:memberOptions()},{k:'motif',label:'Motif / bénéficiaire',full:1}],
   onSave:async d=>{const q=num(d.qte);if(q<=0){toast('Quantité invalide',1);return false}const sign=['entree','retour'].includes(d.type)?1:-1,nq=num(a.quantite)+sign*q;
     if(nq<0){toast('Stock insuffisant',1);return false}
     const ok=await save('mouvements',{...d,qte:q,articleId:a.id,par:ME&&ME.name||''});if(!ok)return false;return save('articles',{...a,quantite:nq})}});
}
const mvtEff=m=>m.type==='ajust'?num(m.qte):(['entree','retour'].includes(m.type)?1:-1)*num(m.qte);
function mvtEditForm(m){
  const a=S.articles.find(x=>x.id===m.articleId);if(!a){toast('Article supprimé',1);return}
  openForm({title:'Modifier le mouvement – '+a.nom,values:m,
   fields:[{k:'type',label:'Type',type:'select',options:Object.entries(MVT).map(([k,v])=>[k,v[0]])},{k:'qte',label:m.type==='ajust'?'Quantité (+ ou −)':'Quantité',type:'number',req:1},{k:'date',label:'Date',type:'date'},{k:'membreId',label:'Personne (prêt / retour)',type:'select',options:memberOptions()},{k:'motif',label:'Motif / bénéficiaire',full:1}],
   onSave:async d=>{const n={...m,...d,qte:num(d.qte)};if(n.type!=='ajust'&&n.qte<=0){toast('Quantité invalide',1);return false}
     const nq=num(a.quantite)-mvtEff(m)+mvtEff(n);if(nq<0){toast('Le stock deviendrait négatif',1);return false}
     const ok=await save('mouvements',{...n,modifiePar:ME&&ME.name||''});if(!ok)return false;return save('articles',{...a,quantite:nq})},
   onDelete:async()=>{const nq=num(a.quantite)-mvtEff(m);if(nq<0){toast('Le stock deviendrait négatif',1);return false}await removeDoc('mouvements',m.id);return save('articles',{...a,quantite:nq})}});
}
function vMouvements(){
  const A=UI.mvtArt,l=S.mouvements.filter(m=>!A||m.articleId===A).sort((a,b)=>String(b.date+b.createdAt).localeCompare(String(a.date+a.createdAt))).slice(0,300);
  return`<div class="toolbar"><select class="inp" data-bind="mvtArt"><option value="">Tous les articles</option>${[...S.articles].sort((a,b)=>(a.nom||'').localeCompare(b.nom||'')).map(a=>opt([a.id,a.nom],A)).join('')}</select><span class="sp"></span><button class="btn" data-act="exportMvt">Excel</button></div>
  <div class="list">${l.length?l.map(m=>{const a=S.articles.find(x=>x.id===m.articleId)||{},t=MVT[m.type]||['?',''],p=m.membreId?fullName(memberById(m.membreId)||{}):'';return`<div class="row" data-act="editMvt" data-id="${m.id}"><div class="grow"><div class="t">${esc(a.nom||'(article supprimé)')}</div><div class="st">${fdate(m.date)} · ${esc(t[0])}${p?' · '+esc(p):''}${m.motif?' · '+esc(m.motif):''}${m.par?' · saisi par '+esc(m.par):''}</div></div><div class="amt ${t[1]==='+'?'pos':t[1]==='−'?'neg':''}">${m.type==='ajust'?(num(m.qte)>0?'+':'')+num(m.qte):t[1]+' '+num(m.qte)}</div></div>`}).join(''):'<div class="empty">Aucun mouvement.</div>'}</div>`;
}
function vPrets(){
  const l=prets();
  return`<div class="muted small" style="margin-bottom:8px">Matériel prêté et pas encore rendu (enregistrez un « Prêt » puis un « Retour de prêt » avec la même personne).</div><div class="list">${l.length?l.map(x=>{const a=S.articles.find(y=>y.id===x.articleId)||{},m=memberById(x.qui),last=S.mouvements.filter(v=>v.articleId===x.articleId&&v.type==='pret'&&(v.membreId||v.par||'')===x.qui).sort((p,q)=>(q.date||'').localeCompare(p.date||''))[0];
   return`<div class="row" style="cursor:default"><div class="grow"><div class="t">${esc(a.nom||'?')} × ${x.qte}</div><div class="st">${esc(m?fullName(m):x.qui||'—')}${last?' · depuis le '+fdate(last.date):''}</div></div>${m&&waLink(m.telephone)?`<a class="btn sm wa" target="_blank" rel="noopener" href="${esc(waLink(m.telephone,`Bonjour ${m.prenom||m.nom}, petit rappel : merci de rapporter à l'église ${a.nom} (× ${x.qte}) emprunté${last?' le '+fdate(last.date):''}. Que Dieu vous bénisse ! — ${cfg().nom}`))}">Rappel</a>`:''}<button class="btn sm ok" data-act="retourPret" data-k="${x.articleId}|${x.qui}|${x.qte}">Rendu</button></div>`}).join(''):'<div class="empty">Aucun prêt en cours.</div>'}</div>`;
}
function vComptageInv(){
  const C=UI.comptInv,hist=[...S.comptages].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  if(!C)return`<div class="card" style="margin-bottom:12px"><b>Inventaire physique</b><div class="muted small" style="margin:6px 0 10px">Comptez réellement chaque article (par exemple une fois par an). Les écarts sont enregistrés comme ajustements et un procès-verbal PDF est produit.</div><button class="btn primary" data-act="startComptage" ${S.articles.length?'':'disabled'}>Commencer un inventaire</button></div>
  <div class="list">${hist.length?hist.map(h=>{const e=(h.lignes||[]).filter(x=>x.compte!==x.theorique).length;return`<div class="row" style="cursor:default"><div class="grow"><div class="t">Inventaire du ${fdate(h.date)}</div><div class="st">${(h.lignes||[]).length} articles · ${e} écart(s)${h.par?' · '+esc(h.par):''}</div></div><button class="btn sm" data-act="pdfComptage" data-id="${h.id}">PDF</button></div>`}).join(''):'<div class="empty">Aucun inventaire réalisé.</div>'}</div>`;
  const arts=[...S.articles].sort((a,b)=>((a.emplacement||'')+a.nom).localeCompare((b.emplacement||'')+b.nom,'fr')),done=arts.filter(a=>C[a.id]!==undefined&&C[a.id]!=='').length;
  return`<div class="toolbar"><b>Inventaire en cours · ${done}/${arts.length} compté(s)</b><span class="sp"></span><button class="btn sm" data-act="cancelComptage">Annuler</button><button class="btn sm primary" data-act="validComptage">Valider l'inventaire</button></div>
  <div class="list">${arts.map(a=>{const v=C[a.id],ec=v!==undefined&&v!==''?num(v)-num(a.quantite):null;return`<div class="row" style="cursor:default"><div class="grow"><div class="t">${esc(a.nom)}</div><div class="st">${esc(a.emplacement||'')} · théorique : ${num(a.quantite)}</div></div>${ec!==null&&ec!==0?`<span class="badge b-todo">écart ${ec>0?'+':''}${ec}</span>`:ec===0?'<span class="badge b-done">OK</span>':''}<input class="inp" data-cpt="${a.id}" inputmode="numeric" value="${esc(v??'')}" placeholder="Compté" style="width:90px"></div>`}).join('')}</div>`;
}
async function validComptage(){
  const C=UI.comptInv,lignes=[];
  for(const a of S.articles){const v=C[a.id];if(v===undefined||v==='')continue;const c=num(v),t=num(a.quantite);lignes.push({articleId:a.id,nom:a.nom,emplacement:a.emplacement||'',theorique:t,compte:c});
    if(c!==t){if(!await save('mouvements',{articleId:a.id,type:'ajust',qte:c-t,date:today(),motif:'Inventaire physique',par:ME&&ME.name||''}))return;if(!await save('articles',{...a,quantite:c}))return}}
  const id=await save('comptages',{date:today(),lignes,par:ME&&ME.name||''});if(id){UI.comptInv=null;toast('Inventaire validé');render();pdfComptage(S.comptages.find(x=>x.id===id)||{date:today(),lignes})}
}
function pdfComptage(h){const d=pdfDoc('Procès-verbal d\'inventaire',fdate(h.date));const L=h.lignes||[];
  d.kpis([['Articles comptés',String(L.length)],['Conformes',String(L.filter(x=>x.compte===x.theorique).length)],['Écarts',String(L.filter(x=>x.compte!==x.theorique).length)]]);
  d.table([{t:'Article',w:.36},{t:'Emplacement',w:.24},{t:'Théorique',w:.13,a:'r'},{t:'Compté',w:.13,a:'r'},{t:'Écart',w:.14,a:'r'}],L.map(x=>{const e=x.compte-x.theorique;return{cells:[x.nom,x.emplacement,x.theorique,x.compte,e?(e>0?'+':'')+e:'0'],colors:[0,0,0,0,e<0?[192,57,43]:e>0?[46,139,87]:0]}}));
  d.signatures(['L\'Inventoriste','Le Responsable du matériel','Le Pasteur principal']);savePDF(`Inventaire ${h.date}.pdf`,d.finish())}
function pdfInv(){const d=pdfDoc('Inventaire du matériel','État au '+fdate(today()));const l=[...S.articles].sort((a,b)=>((a.categorie||'')+a.nom).localeCompare((b.categorie||'')+b.nom,'fr'));
  d.table([{t:'Article',w:.3},{t:'Catégorie',w:.16},{t:'Emplacement',w:.16},{t:'État',w:.12},{t:'Qté',w:.08,a:'r'},{t:'Valeur',w:.18,a:'r'}],l.map(a=>[a.nom,a.categorie,a.emplacement,a.etat||'Bon',num(a.quantite),money(num(a.valeurUnit)*num(a.quantite),a.devise)]),{empty:'Aucun article.'});
  d.signatures(['Le Responsable du matériel','Le Pasteur principal']);savePDF(`Inventaire ${cfg().sigle||'EMT'} ${today()}.pdf`,d.finish())}

/* ================= ESPACE FIDÈLE (version autonome) ================= */
function vMonEspace(){
  const mid=ME&&ME.memberId,m=mid&&memberById(mid),c=cfg(),y=String(new Date().getFullYear()),v=verseDuJour();
  const head=`<div class="card" style="margin-bottom:12px"><h2 style="margin:0">Bonjour ${esc(m?(m.prenom||m.nom):(ME&&ME.name)||'')} 👋</h2><div class="muted small">${esc(c.nom)} · <b>${esc(visio(c))}</b></div></div>`
   +(v.texte?`<div class="card" style="margin-bottom:12px;text-align:center"><div class="muted small">Verset du jour</div><div style="font-style:italic;font-size:16px;margin:6px 0">« ${esc(v.texte)} »</div><b style="color:var(--brand-d)">${esc(v.ref||'')}</b></div>`:'');
  const progs=`<div class="card"><h2>Nos cultes</h2>${c.programmes.map(p=>`<div class="small" style="padding:4px 0">${JOURS[+p.jour]}${p.debut?' '+esc(p.debut)+(p.fin?'–'+esc(p.fin):''):''} · <b>${esc(p.titre)}</b></div>`).join('')}</div>`;
  if(!m)return head+`<div class="card" style="margin-bottom:12px;border-left:4px solid var(--warn)"><b>Votre compte n'est pas encore relié à votre fiche de membre.</b><div class="muted small" style="margin-top:6px">Donnez au secrétariat le numéro de téléphone utilisé lors de votre inscription : la liaison se fait automatiquement. Vous pouvez déjà consulter l'album photo, la médiathèque et les événements.</div></div>`+progs;
  const carte=`<div class="card" style="margin-bottom:12px;text-align:center"><h2>Ma carte de membre</h2><div style="display:inline-block;padding:8px;background:#fff;border-radius:10px">${QR.svg(ckUrl(m),4)}</div><div style="margin-top:6px"><b>${esc(fullName(m))}</b> · N° ${esc(memberCode(m))}</div><div class="muted small">Montrez ce code à l'accueil pour enregistrer votre présence.</div><button class="btn sm" style="margin-top:8px" data-act="carteM" data-id="${m.id}">Télécharger ma carte (PDF)</button></div>`;
  const tx=S.transactions.filter(t=>t.membreId===mid&&isIn(t)&&(t.date||'').startsWith(y)).sort((a,b)=>(b.date||'').localeCompare(a.date||'')),tt=sumAll(sumBy(tx,()=>'x'));
  const evs=S.events.filter(e=>e.inscriptions&&(e.date||'')>=today()&&(!e.clotureInscr||e.clotureInscr>=today())).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  const mine=S.inscriptions.filter(i=>i.membreId===mid);
  const polls=S.sondages.filter(s=>s.ouvert!==false&&(!s.fin||s.fin>=today()));
  const rdvs=S.rdv.filter(r=>r.membreId===mid&&(r.date||'')>=today());
  const forms=S.formulaires;
  return head+carte+`<div class="grid2">
  <div class="card"><div style="display:flex;align-items:center;gap:8px"><h2 style="margin:0;flex:1">Ma fiche</h2><button class="btn sm" data-act="meEdit">Modifier mes coordonnées</button></div><dl class="kv" style="margin-top:10px"><dt>Nom</dt><dd>${esc(fullName(m))}</dd><dt>Téléphone</dt><dd>${esc(m.telephone||'—')}</dd><dt>E-mail</dt><dd>${esc(m.email||'—')}</dd><dt>Adresse</dt><dd>${esc(m.adresse||'—')}</dd>${(m.groupes||[]).length?`<dt>Groupes</dt><dd>${(m.groupes||[]).map(g=>groupName(g)?`<span class="chip">${esc(groupName(g))}</span>`:'').join('')}</dd>`:''}</dl></div>
  <div class="card"><div style="display:flex;align-items:center;gap:8px"><h2 style="margin:0;flex:1">Mes contributions ${y}</h2>${tx.length?'<button class="btn sm" data-act="meReleve">Relevé PDF</button>':''}</div><div class="muted small" style="margin:6px 0">${money(tt.CDF,'CDF')} · ${money(tt.USD,'USD')}</div>${tx.slice(0,6).map(t=>`<div class="small" style="display:flex;padding:4px 0;border-top:1px solid var(--bd)"><span style="flex:1">${fdate(t.date)} · ${esc(t.categorie)}</span><b>${money(t.montant,t.devise)}</b></div>`).join('')||'<div class="muted small">Aucune contribution enregistrée.</div>'}</div>
  <div class="card"><h2>Événements</h2>${evs.length?evs.map(e=>{const I=mine.filter(i=>i.eventId===e.id);return`<div style="padding:8px 0;border-top:1px solid var(--bd);display:flex;gap:8px;align-items:center"><div style="flex:1"><b>${esc(e.titre)}</b><div class="muted small">${fday(e.date)}${e.heure?' · '+esc(e.heure):''}${I.length?' · <span class="pos">inscrit(e)</span>'+(I.some(i=>inscrDu(i)>num(i.paye))?' – reste '+I.map(i=>money(inscrDu(i)-num(i.paye),i.devise)).join(', '):''):''}</div></div>${I.length?'':`<button class="btn sm primary" data-act="meInscr" data-id="${e.id}">M'inscrire</button>`}</div>`}).join(''):'<div class="muted small">Aucune inscription ouverte.</div>'}</div>
  <div class="card"><div style="display:flex;align-items:center;gap:8px"><h2 style="margin:0;flex:1">Rendez-vous</h2><button class="btn sm primary" data-act="meRdv">Demander</button></div>${rdvs.length?rdvs.map(r=>`<div class="small" style="padding:6px 0;border-top:1px solid var(--bd)">${fday(r.date)} ${esc(r.heure||'')} · ${esc(r.motif||'')} · <b>${esc(r.statut||'Demandé')}</b></div>`).join(''):'<div class="muted small" style="margin-top:6px">Aucun rendez-vous à venir.</div>'}</div>
  ${polls.length?`<div class="card"><h2>Votes en cours</h2>${polls.map(s=>{const mv=myVote(s);return`<div style="padding:8px 0;border-top:1px solid var(--bd)"><b>${esc(s.question)}</b>${(s.options||[]).map(o=>`<label style="display:flex;gap:8px;align-items:center;margin-top:6px"><input type="radio" name="v_${s.id}" data-act="vote" data-id="${s.id}" data-k="${esc(o)}"${mv&&mv.choix===o?' checked':''}> ${esc(o)}</label>`).join('')}${mv?'<div class="small pos" style="margin-top:4px">✓ Vote enregistré (modifiable tant que le vote est ouvert)</div>':''}</div>`}).join('')}</div>`:''}
  ${forms.length?`<div class="card"><h2>Formulaires</h2>${forms.map(f=>`<div style="display:flex;align-items:center;padding:6px 0;border-top:1px solid var(--bd)"><span style="flex:1">${esc(f.titre)}</span><button class="btn sm" data-act="kiosk" data-id="${f.id}">Remplir</button></div>`).join('')}</div>`:''}
  ${progs}</div>`;
}
const ME_ACT={
  meEdit(){const m=memberById(ME.memberId);if(!m)return;openForm({title:'Mes coordonnées',values:m,fields:[{k:'telephone',label:'Téléphone',type:'tel'},{k:'email',label:'E-mail',type:'email'},{k:'adresse',label:'Adresse',full:1},{k:'profession',label:'Profession'}],onSave:d=>save('members',{...m,...d})})},
  meReleve(){const m=memberById(ME.memberId),y=String(new Date().getFullYear());if(!m)return;const d=pdfDoc('Relevé de contributions','Année '+y);attestationPages(d,m,y,true);savePDF(`Releve ${fullName(m)} ${y}.pdf`,d.finish())},
  meInscr(d){const e=S.events.find(x=>x.id===d.id),m=memberById(ME.memberId);if(!e||!m)return;const B=billetsOf(e);
    openForm({title:'Inscription – '+e.titre,values:{billet:B[0]?B[0].nom:'',qte:1},fields:[{k:'billet',label:'Billet',type:'select',options:B.length?B.map(b=>[b.nom,b.nom+' – '+(b.prix?money(b.prix,b.devise):'gratuit')]):[['','Gratuit']]},{k:'qte',label:'Nombre de personnes',type:'number'},{k:'notes',label:'Remarques',type:'textarea',full:1}],
     onSave:x=>{const b=B.find(z=>z.nom===x.billet)||{prix:0,devise:'CDF'},q=num(x.qte)||1;return save('inscriptions',{...x,qte:q,eventId:e.id,membreId:m.id,nom:fullName(m),telephone:m.telephone||'',montant:b.prix*q,devise:b.devise,paye:0})}})},
  meRdv(){const m=memberById(ME.memberId);if(!m)return;openForm({title:'Demander un rendez-vous',values:{date:today(),heure:'10:00'},fields:[{k:'date',label:'Date souhaitée',type:'date',req:1},{k:'heure',label:'Heure souhaitée',type:'time'},{k:'motif',label:'Motif',full:1,ph:'Conseil, prière, mariage, baptême…'}],
     onSave:x=>save('rdv',{...x,membreId:m.id,nom:fullName(m),telephone:m.telephone||'',statut:'Demandé',duree:30,avec:'Pasteur '+cfg().pasteur})})}
};
async function autoSend(){
  const l=audienceList().filter(m=>waNum(m.telephone)),msgs=l.map(m=>({to:intl(m.telephone),text:fillTpl(UI.msg,m)}));
  if(!msgs.length){toast('Aucun numéro valide',1);return}
  confirmBox(`Envoyer ${msgs.length} message(s) par ${UI.canal==='sms'?'SMS':'WhatsApp'} ? Ce service est facturé par votre fournisseur.`,async()=>{
    try{const r=await window.EMT_API.send(UI.canal,msgs);await save('commlog',{at:new Date().toISOString(),canal:UI.canal,audience:(audiences().find(a=>a[0]===UI.aud)||[])[1]||'',message:UI.msg,nb:msgs.length,envoyes:r.sent,echecs:r.failed,auto:true,uid:ME&&ME.id||''});if(r.failed&&!r.sent){toast('Aucun message envoyé : '+((r.errors||[])[0]||'erreur du fournisseur'),1);return false}toast(`${r.sent} envoyé(s)${r.failed?', '+r.failed+' échec(s) – '+((r.errors||[])[0]||''):''}`,r.failed?1:0);return true}
    catch(e){toast("Échec de l'envoi : "+(e&&e.message||'erreur'),1);return false}},{btn:'Envoyer',done:'Envoi terminé'});
}
async function exitOk(v){if(window.EMT_API)return window.EMT_API.checkPassword(v);return await sha(ME.id+':'+v)===AUTH.hash}

/* ================= SÉLECTEUR DE PASSAGES BIBLIQUES (Louis Segond 1910) ================= */
const LIVRES=[["Genèse",50],["Exode",40],["Lévitique",27],["Nombres",36],["Deutéronome",34],["Josué",24],["Juges",21],["Ruth",4],["1 Samuel",31],["2 Samuel",24],["1 Rois",22],["2 Rois",25],["1 Chroniques",29],["2 Chroniques",36],["Esdras",10],["Néhémie",13],["Esther",10],["Job",42],["Psaumes",150],["Proverbes",31],["Ecclésiaste",12],["Cantique des cantiques",8],["Ésaïe",66],["Jérémie",52],["Lamentations",5],["Ézéchiel",48],["Daniel",12],["Osée",14],["Joël",3],["Amos",9],["Abdias",1],["Jonas",4],["Michée",7],["Nahum",3],["Habacuc",3],["Sophonie",3],["Aggée",2],["Zacharie",14],["Malachie",4],["Matthieu",28],["Marc",16],["Luc",24],["Jean",21],["Actes",28],["Romains",16],["1 Corinthiens",16],["2 Corinthiens",13],["Galates",6],["Éphésiens",6],["Philippiens",4],["Colossiens",4],["1 Thessaloniciens",5],["2 Thessaloniciens",3],["1 Timothée",6],["2 Timothée",4],["Tite",3],["Philémon",1],["Hébreux",13],["Jacques",5],["1 Pierre",5],["2 Pierre",3],["1 Jean",5],["2 Jean",1],["3 Jean",1],["Jude",1],["Apocalypse",22]];
const VERSETS=[
["Genèse 1:1","Au commencement, Dieu créa les cieux et la terre.","création"],
["Genèse 2:24","C'est pourquoi l'homme quittera son père et sa mère, et s'attachera à sa femme, et ils deviendront une seule chair.","mariage famille"],
["Nombres 6:24-26","Que l'Éternel te bénisse, et qu'il te garde! Que l'Éternel fasse luire sa face sur toi, et qu'il t'accorde sa grâce! Que l'Éternel tourne sa face vers toi, et qu'il te donne la paix!","bénédiction paix"],
["Deutéronome 31:6","Fortifiez-vous et ayez du courage! Ne craignez point et ne soyez point effrayés devant eux; car l'Éternel, ton Dieu, marchera lui-même avec toi, il ne te délaissera point, il ne t'abandonnera point.","courage force"],
["Josué 1:9","Ne t'ai-je pas donné cet ordre: Fortifie-toi et prends courage? Ne t'effraie point et ne t'épouvante point, car l'Éternel, ton Dieu, est avec toi dans tout ce que tu entreprendras.","courage force"],
["Josué 24:15","Et si vous ne trouvez pas bon de servir l'Éternel, choisissez aujourd'hui qui vous voulez servir, ou les dieux que servaient vos pères au delà du fleuve, ou les dieux des Amoréens dans le pays desquels vous habitez. Moi et ma maison, nous servirons l'Éternel.","famille engagement"],
["2 Chroniques 7:14","si mon peuple sur qui est invoqué mon nom s'humilie, prie, et cherche ma face, et s'il se détourne de ses mauvaises voies, je l'exaucerai des cieux, je lui pardonnerai son péché, et je guérirai son pays.","prière repentance nation"],
["Psaumes 23:1","L'Éternel est mon berger: je ne manquerai de rien.","confiance provision"],
["Psaumes 27:1","L'Éternel est ma lumière et mon salut: De qui aurais-je crainte? L'Éternel est le soutien de ma vie: De qui aurais-je peur?","confiance courage"],
["Psaumes 34:9","Sentez et voyez combien l'Éternel est bon! Heureux l'homme qui cherche en lui son refuge!","louange bonté"],
["Psaumes 37:5","Recommande ton sort à l'Éternel, Mets en lui ta confiance, et il agira.","confiance"],
["Psaumes 46:2","Dieu est pour nous un refuge et un appui, Un secours qui ne manque jamais dans la détresse.","refuge épreuve"],
["Psaumes 51:12","O Dieu! crée en moi un coeur pur, Renouvelle en moi un esprit bien disposé.","repentance sainteté"],
["Psaumes 91:1-2","Celui qui demeure sous l'abri du Très-Haut Repose à l'ombre du Tout-Puissant. Je dis à l'Éternel: Mon refuge et ma forteresse, Mon Dieu en qui je me confie!","protection refuge"],
["Psaumes 100:4","Entrez dans ses portes avec des louanges, Dans ses parvis avec des cantiques! Célébrez-le, bénissez son nom!","louange adoration culte"],
["Psaumes 103:2","Mon âme, bénis l'Éternel, Et n'oublie aucun de ses bienfaits!","louange reconnaissance"],
["Psaumes 118:24","C'est ici la journée que l'Éternel a faite: Qu'elle soit pour nous un sujet d'allégresse et de joie!","joie culte"],
["Psaumes 119:105","Ta parole est une lampe à mes pieds, Et une lumière sur mon sentier.","parole direction"],
["Psaumes 121:1-2","Je lève mes yeux vers les montagnes... D'où me viendra le secours? Le secours me vient de l'Éternel, Qui a fait les cieux et la terre.","secours confiance"],
["Psaumes 133:1","Voici, oh! qu'il est agréable, qu'il est doux Pour des frères de demeurer ensemble!","unité communion"],
["Psaumes 150:6","Que tout ce qui respire loue l'Éternel! Louez l'Éternel!","louange adoration"],
["Proverbes 3:5-6","Confie-toi en l'Éternel de tout ton coeur, Et ne t'appuie pas sur ta sagesse; Reconnais-le dans toutes tes voies, Et il aplanira tes sentiers.","confiance direction sagesse"],
["Proverbes 18:10","Le nom de l'Éternel est une tour forte; Le juste s'y réfugie, et se trouve en sûreté.","protection refuge"],
["Proverbes 22:6","Instruis l'enfant selon la voie qu'il doit suivre; Et quand il sera vieux, il ne s'en détournera pas.","enfants famille éducation"],
["Ecclésiaste 3:1","Il y a un temps pour tout, un temps pour toute chose sous les cieux:","temps sagesse"],
["Ésaïe 6:8","J'entendis la voix du Seigneur, disant: Qui enverrai-je, et qui marchera pour nous? Je répondis: Me voici, envoie-moi.","mission appel évangélisation"],
["Ésaïe 9:5","Car un enfant nous est né, un fils nous est donné, Et la domination reposera sur son épaule; On l'appellera Admirable, Conseiller, Dieu puissant, Père éternel, Prince de la paix.","Noël Jésus"],
["Ésaïe 40:31","Mais ceux qui se confient en l'Éternel renouvellent leur force. Ils prennent le vol comme les aigles; Ils courent, et ne se lassent point, Ils marchent, et ne se fatiguent point.","force espérance"],
["Ésaïe 41:10","Ne crains rien, car je suis avec toi; Ne promène pas des regards inquiets, car je suis ton Dieu; Je te fortifie, je viens à ton secours, Je te soutiens de ma droite triomphante.","peur courage secours"],
["Ésaïe 43:19","Voici, je vais faire une chose nouvelle, sur le point d'arriver: Ne la connaîtrez-vous pas? Je mettrai un chemin dans le désert, Et des fleuves dans la solitude.","nouveauté espérance"],
["Ésaïe 53:5","Mais il était blessé pour nos péchés, Brisé pour nos iniquités; Le châtiment qui nous donne la paix est tombé sur lui, Et c'est par ses meurtrissures que nous sommes guéris.","croix guérison Pâques"],
["Jérémie 29:11","Car je connais les projets que j'ai formés sur vous, dit l'Éternel, projets de paix et non de malheur, afin de vous donner un avenir et de l'espérance.","espérance avenir"],
["Jérémie 33:3","Invoque-moi, et je te répondrai; Je t'annoncerai de grandes choses, des choses cachées, Que tu ne connais pas.","prière"],
["Lamentations 3:22-23","Les bontés de l'Éternel ne sont pas épuisées, Ses compassions ne sont pas à leur terme; Elles se renouvellent chaque matin. Oh! que ta fidélité est grande!","fidélité grâce"],
["Michée 6:8","On t'a fait connaître, ô homme, ce qui est bien; Et ce que l'Éternel demande de toi, C'est que tu pratiques la justice, Que tu aimes la miséricorde, Et que tu marches humblement avec ton Dieu.","justice humilité"],
["Malachie 3:10","Apportez à la maison du trésor toutes les dîmes, Afin qu'il y ait de la nourriture dans ma maison; Mettez-moi de la sorte à l'épreuve, Dit l'Éternel des armées. Et vous verrez si je n'ouvre pas pour vous les écluses des cieux, Si je ne répands pas sur vous la bénédiction en abondance.","dîme offrande"],
["Matthieu 4:4","Jésus répondit: Il est écrit: L'homme ne vivra pas de pain seulement, mais de toute parole qui sort de la bouche de Dieu.","parole"],
["Matthieu 5:14","Vous êtes la lumière du monde. Une ville située sur une montagne ne peut être cachée;","témoignage"],
["Matthieu 5:16","Que votre lumière luise ainsi devant les hommes, afin qu'ils voient vos bonnes oeuvres, et qu'ils glorifient votre Père qui est dans les cieux.","témoignage oeuvres"],
["Matthieu 6:33","Cherchez premièrement le royaume et la justice de Dieu; et toutes ces choses vous seront données par-dessus.","priorités provision"],
["Matthieu 6:34","Ne vous inquiétez donc pas du lendemain; car le lendemain aura soin de lui-même. A chaque jour suffit sa peine.","inquiétude paix"],
["Matthieu 7:7","Demandez, et l'on vous donnera; cherchez, et vous trouverez; frappez, et l'on vous ouvrira.","prière"],
["Matthieu 11:28","Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos.","repos invitation"],
["Matthieu 18:20","Car là où deux ou trois sont assemblés en mon nom, je suis au milieu d'eux.","assemblée prière communion"],
["Matthieu 28:19-20","Allez, faites de toutes les nations des disciples, les baptisant au nom du Père, du Fils et du Saint-Esprit, et enseignez-leur à observer tout ce que je vous ai prescrit. Et voici, je suis avec vous tous les jours, jusqu'à la fin du monde.","mission évangélisation baptême"],
["Marc 11:24","C'est pourquoi je vous dis: Tout ce que vous demanderez en priant, croyez que vous l'avez reçu, et vous le verrez s'accomplir.","prière foi"],
["Marc 16:15","Puis il leur dit: Allez par tout le monde, et prêchez la bonne nouvelle à toute la création.","mission évangélisation"],
["Luc 1:37","Car rien n'est impossible à Dieu.","foi miracle"],
["Luc 6:38","Donnez, et il vous sera donné: on versera dans votre sein une bonne mesure, serrée, secouée et qui déborde; car on vous mesurera avec la mesure dont vous vous serez servis.","offrande générosité"],
["Jean 1:12","Mais à tous ceux qui l'ont reçue, à ceux qui croient en son nom, elle a donné le pouvoir de devenir enfants de Dieu,","salut identité"],
["Jean 3:16","Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu'il ait la vie éternelle.","salut amour évangélisation"],
["Jean 8:32","vous connaîtrez la vérité, et la vérité vous affranchira.","vérité liberté"],
["Jean 10:10","Le voleur ne vient que pour dérober, égorger et détruire; moi, je suis venu afin que les brebis aient la vie, et qu'elles soient dans l'abondance.","abondance"],
["Jean 11:25","Jésus lui dit: Je suis la résurrection et la vie. Celui qui croit en moi vivra, quand même il serait mort;","résurrection deuil Pâques"],
["Jean 13:34","Je vous donne un commandement nouveau: Aimez-vous les uns les autres; comme je vous ai aimés, vous aussi, aimez-vous les uns les autres.","amour communion"],
["Jean 14:6","Jésus lui dit: Je suis le chemin, la vérité, et la vie. Nul ne vient au Père que par moi.","salut Jésus"],
["Jean 15:5","Je suis le cep, vous êtes les sarments. Celui qui demeure en moi et en qui je demeure porte beaucoup de fruit, car sans moi vous ne pouvez rien faire.","fruit communion"],
["Actes 1:8","Mais vous recevrez une puissance, le Saint-Esprit survenant sur vous, et vous serez mes témoins à Jérusalem, dans toute la Judée, dans la Samarie, et jusqu'aux extrémités de la terre.","mission témoignage Saint-Esprit"],
["Actes 2:38","Pierre leur dit: Repentez-vous, et que chacun de vous soit baptisé au nom de Jésus-Christ, pour le pardon de vos péchés; et vous recevrez le don du Saint-Esprit.","baptême repentance Saint-Esprit"],
["Actes 16:31","Paul et Silas répondirent: Crois au Seigneur Jésus, et tu seras sauvé, toi et ta famille.","salut famille"],
["Romains 1:16","Car je n'ai point honte de l'Évangile: c'est une puissance de Dieu pour le salut de quiconque croit, du Juif premièrement, puis du Grec,","évangélisation salut"],
["Romains 3:23","Car tous ont péché et sont privés de la gloire de Dieu;","péché salut"],
["Romains 6:23","Car le salaire du péché, c'est la mort; mais le don gratuit de Dieu, c'est la vie éternelle en Jésus-Christ notre Seigneur.","salut grâce"],
["Romains 8:28","Nous savons, du reste, que toutes choses concourent au bien de ceux qui aiment Dieu, de ceux qui sont appelés selon son dessein.","confiance épreuve"],
["Romains 8:31","Que dirons-nous donc à l'égard de ces choses? Si Dieu est pour nous, qui sera contre nous?","victoire confiance"],
["Romains 10:9","Si tu confesses de ta bouche le Seigneur Jésus, et si tu crois dans ton coeur que Dieu l'a ressuscité des morts, tu seras sauvé.","salut foi"],
["Romains 10:17","Ainsi la foi vient de ce qu'on entend, et ce qu'on entend vient de la parole de Christ.","foi parole"],
["Romains 12:2","Ne vous conformez pas au siècle présent, mais soyez transformés par le renouvellement de l'intelligence, afin que vous discerniez quelle est la volonté de Dieu, ce qui est bon, agréable et parfait.","transformation sainteté"],
["Romains 15:13","Que le Dieu de l'espérance vous remplisse de toute joie et de toute paix dans la foi, pour que vous abondiez en espérance, par la puissance du Saint-Esprit!","espérance joie bénédiction"],
["1 Corinthiens 10:13","Aucune tentation ne vous est survenue qui n'ait été humaine, et Dieu, qui est fidèle, ne permettra pas que vous soyez tentés au delà de vos forces; mais avec la tentation il préparera aussi le moyen d'en sortir, afin que vous puissiez la supporter.","tentation fidélité"],
["1 Corinthiens 13:4-7","La charité est patiente, elle est pleine de bonté; la charité n'est point envieuse; la charité ne se vante point, elle ne s'enfle point d'orgueil, elle ne fait rien de malhonnête, elle ne cherche point son intérêt, elle ne s'irrite point, elle ne soupçonne point le mal, elle ne se réjouit point de l'injustice, mais elle se réjouit de la vérité; elle excuse tout, elle croit tout, elle espère tout, elle supporte tout.","amour mariage"],
["1 Corinthiens 15:58","Ainsi, mes frères bien-aimés, soyez fermes, inébranlables, travaillant de mieux en mieux à l'oeuvre du Seigneur, sachant que votre travail ne sera pas vain dans le Seigneur.","service persévérance"],
["2 Corinthiens 5:17","Si quelqu'un est en Christ, il est une nouvelle créature. Les choses anciennes sont passées; voici, toutes choses sont devenues nouvelles.","conversion"],
["2 Corinthiens 9:7","Que chacun donne comme il l'a résolu en son coeur, sans tristesse ni contrainte; car Dieu aime celui qui donne avec joie.","offrande générosité"],
["Galates 5:22-23","Mais le fruit de l'Esprit, c'est l'amour, la joie, la paix, la patience, la bonté, la bénignité, la fidélité, la douceur, la tempérance; la loi n'est pas contre ces choses.","Saint-Esprit caractère"],
["Galates 6:9","Ne nous lassons pas de faire le bien; car nous moissonnerons au temps convenable, si nous ne nous relâchons pas.","persévérance service"],
["Éphésiens 2:8-9","Car c'est par la grâce que vous êtes sauvés, par le moyen de la foi. Et cela ne vient pas de vous, c'est le don de Dieu. Ce n'est point par les oeuvres, afin que personne ne se glorifie.","grâce salut"],
["Éphésiens 4:32","Soyez bons les uns envers les autres, compatissants, vous pardonnant réciproquement, comme Dieu vous a pardonné en Christ.","pardon communion"],
["Éphésiens 5:25","Maris, aimez vos femmes, comme Christ a aimé l'Église, et s'est livré lui-même pour elle,","mariage"],
["Éphésiens 6:10","Au reste, fortifiez-vous dans le Seigneur, et par sa force toute-puissante.","force"],
["Philippiens 4:6-7","Ne vous inquiétez de rien; mais en toute chose faites connaître vos besoins à Dieu par des prières et des supplications, avec des actions de grâces. Et la paix de Dieu, qui surpasse toute intelligence, gardera vos coeurs et vos pensées en Jésus-Christ.","prière paix inquiétude"],
["Philippiens 4:13","Je puis tout par celui qui me fortifie.","force victoire"],
["Colossiens 3:23","Tout ce que vous faites, faites-le de bon coeur, comme pour le Seigneur et non pour des hommes,","service travail"],
["1 Thessaloniciens 5:16-18","Soyez toujours joyeux. Priez sans cesse. Rendez grâces en toutes choses, car c'est à votre égard la volonté de Dieu en Jésus-Christ.","joie prière reconnaissance"],
["2 Timothée 1:7","Car ce n'est pas un esprit de timidité que Dieu nous a donné, mais un esprit de force, d'amour et de sagesse.","courage peur"],
["2 Timothée 3:16","Toute Écriture est inspirée de Dieu, et utile pour enseigner, pour convaincre, pour corriger, pour instruire dans la justice,","parole enseignement"],
["2 Timothée 4:2","prêche la parole, insiste en toute occasion, favorable ou non, reprends, censure, exhorte, avec toute douceur et en instruisant.","prédication mission"],
["Hébreux 10:25","N'abandonnons pas notre assemblée, comme c'est la coutume de quelques-uns; mais exhortons-nous réciproquement, et cela d'autant plus que vous voyez s'approcher le jour.","assemblée culte communion"],
["Hébreux 11:1","Or la foi est une ferme assurance des choses qu'on espère, une démonstration de celles qu'on ne voit pas.","foi"],
["Hébreux 11:6","Or sans la foi il est impossible de lui être agréable; car il faut que celui qui s'approche de Dieu croie que Dieu existe, et qu'il est le rémunérateur de ceux qui le cherchent.","foi"],
["Hébreux 13:8","Jésus-Christ est le même hier, aujourd'hui, et éternellement.","fidélité Jésus"],
["Jacques 5:16","Confessez donc vos péchés les uns aux autres, et priez les uns pour les autres, afin que vous soyez guéris. La prière agissante du juste a une grande efficacité.","prière guérison"],
["1 Pierre 3:15","Mais sanctifiez dans vos coeurs Christ le Seigneur, étant toujours prêts à vous défendre, avec douceur et respect, devant quiconque vous demande raison de l'espérance qui est en vous,","témoignage espérance"],
["1 Pierre 5:7","et déchargez-vous sur lui de tous vos soucis, car lui-même prend soin de vous.","inquiétude confiance"],
["1 Jean 1:9","Si nous confessons nos péchés, il est fidèle et juste pour nous les pardonner, et pour nous purifier de toute iniquité.","pardon repentance"],
["1 Jean 4:8","Celui qui n'aime pas n'a pas connu Dieu, car Dieu est amour.","amour"],
["Apocalypse 3:20","Voici, je me tiens à la porte, et je frappe. Si quelqu'un entend ma voix et ouvre la porte, j'entrerai chez lui, je souperai avec lui, et lui avec moi.","invitation salut"],
["Apocalypse 21:4","Il essuiera toute larme de leurs yeux, et la mort ne sera plus, et il n'y aura plus ni deuil, ni cri, ni douleur, car les premières choses ont disparu.","deuil espérance consolation"]];
const normTxt=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
function biblePicker(onPick){
  const st={q:'',theme:'',livre:'Jean',chap:1,v1:'',v2:'',txt:'',busy:0,open:0};
  const themes=[...new Set(VERSETS.flatMap(v=>v[2].split(' ')).filter(t=>!['vie','nouvelle','spirituel','combat'].includes(t)))].sort((a,b)=>a.localeCompare(b,'fr'));
  modal(`<div class="mhead"><h3>📖 Choisir un passage biblique</h3><button class="x" data-act="close">×</button></div><div class="mbody" id="bpBody"></div>`);
  const draw=()=>{
    const q=normTxt(st.q),list=VERSETS.filter(v=>(!st.theme||v[2].split(' ').includes(st.theme))&&(!q||normTxt(v[0]+' '+v[1]+' '+v[2]).includes(q)));
    const nb=(LIVRES.find(l=>l[0]===st.livre)||[,1])[1];
    $('#bpBody').innerHTML=`<div style="display:flex;gap:6px;margin-bottom:8px"><input class="inp" id="bpQ" placeholder="Rechercher : Jean 3, berger, paix…" value="${esc(st.q)}" style="flex:1;min-width:0"><select class="inp" id="bpTh">${[['','Tous les thèmes'],...themes.map(t=>[t,t])].map(o=>opt(o,st.theme)).join('')}</select></div><div class="muted small" style="margin-bottom:6px">${list.length} passage(s) · touchez un passage pour le choisir</div>
    <div class="list" style="max-height:42vh;overflow:auto">${list.length?list.map((v,i)=>`<div class="row" data-bpv="${VERSETS.indexOf(v)}"><div class="grow"><div class="t">${esc(v[0])}</div><div class="st" style="white-space:normal">${esc(v[1])}</div></div></div>`).join(''):'<div class="empty">Aucun verset dans la liste. Utilisez « Autre passage » ci-dessous.</div>'}</div>
    <details id="bpD" style="margin-top:12px"${st.open?' open':''}><summary style="cursor:pointer;font-weight:600">Autre passage (livre, chapitre, versets)</summary>
     <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><select class="inp" id="bpL">${LIVRES.map(l=>opt(l[0],st.livre)).join('')}</select><select class="inp" id="bpC">${Array.from({length:nb},(_,i)=>opt(String(i+1),String(st.chap))).join('')}</select><input class="inp" id="bpV1" inputmode="numeric" placeholder="Verset" value="${esc(st.v1)}" style="width:80px"><input class="inp" id="bpV2" inputmode="numeric" placeholder="à (option)" value="${esc(st.v2)}" style="width:90px"><button class="btn" id="bpAI" ${st.busy?'disabled':''}>${st.busy?'…':'✨ Obtenir le texte'}</button></div>
     <textarea class="inp" id="bpT" rows="4" style="width:100%;margin-top:8px" placeholder="Texte du passage (obtenu par l'IA ou saisi/collé depuis votre Bible)">${esc(st.txt)}</textarea>
     <div class="muted small">Le texte proposé par l'IA (Louis Segond 1910) doit être vérifié dans votre Bible avant publication.</div>
     <div style="margin-top:8px;text-align:right"><button class="btn primary" id="bpUse">Utiliser ce passage</button></div></details>`;
    const q1=$('#bpQ');q1.oninput=e=>{st.q=e.target.value;draw();const n=$('#bpQ');n.focus();n.setSelectionRange(n.value.length,n.value.length)};
    $('#bpTh').onchange=e=>{st.theme=e.target.value;draw()};
    $('#bpBody').querySelectorAll('[data-bpv]').forEach(r=>r.onclick=()=>{const v=VERSETS[+r.dataset.bpv];closeModal();onPick({texte:v[1],ref:v[0]})});
    $('#bpD').ontoggle=()=>{st.open=$('#bpD').open};
    const keep=()=>{st.livre=$('#bpL').value;st.chap=+$('#bpC').value;st.v1=$('#bpV1').value.trim();st.v2=$('#bpV2').value.trim();st.txt=$('#bpT').value};
    $('#bpL').onchange=()=>{keep();st.chap=1;draw()};$('#bpC').onchange=()=>{keep()};
    const ref=()=>`${st.livre} ${st.chap}${st.v1?':'+st.v1+(st.v2&&st.v2!==st.v1?'-'+st.v2:''):''}`;
    $('#bpAI').onclick=async()=>{keep();if(!st.v1){toast('Indiquez au moins le premier verset',1);return}st.busy=1;draw();
      const r=await aiCall(`Donne le texte exact de ${ref()} dans la Bible Louis Segond 1910 (traduction française). Réponds uniquement en JSON {"texte":"…","ref":"${ref()}"} sans numéros de versets ni guillemets autour du texte.`,true);
      st.busy=0;if(r&&r.texte)st.txt=String(r.texte).trim();draw()};
    $('#bpUse').onclick=()=>{keep();if(!st.txt.trim()){toast('Ajoutez le texte du passage',1);return}closeModal();onPick({texte:st.txt.trim(),ref:ref()})};
  };
  draw();setTimeout(()=>{const i=$('#bpQ');if(i)i.focus()},50);
}

/* ---------- fiche de membre PDF ---------- */
const visio=c=>(c.titrePasteur||'Visionnaire')+' : Pasteur '+c.pasteur;
const matricule=m=>'EMT-'+String(m.id||'').replace(/[^A-Za-z0-9]/g,'').slice(-6).toUpperCase();
function pdfFiche(m){
  if(!m)return;const c=cfg(),d=pdfDoc('Fiche de membre',fullName(m)+' · '+matricule(m)),a=ageOf(m);
  const sec=(t,rows)=>{rows=rows.filter(r=>r[1]);if(!rows.length)return;d.h2(t);rows.forEach(([k,v])=>{const L=d.wrap(String(v),d.W-2*d.M-160,10);d.ensure(L.length*14+8);d.text(k,d.M+4,d.y+11,{size:9,color:GREY});L.forEach((l,i)=>d.text(l,d.M+160,d.y+11+i*14,{size:10,bold:i===0&&k==='N° de membre'}));d.y+=L.length*14+6;d.line(d.M,d.y,d.W-d.M,d.y,{color:[226,232,240]});d.y+=2});d.y+=4};
  sec('Identité',[['Nom',m.nom],['Postnom',m.postnom],['Prénom',m.prenom],['Sexe',m.sexe==='M'?'Homme':m.sexe==='F'?'Femme':''],['Date de naissance',m.dateNaissance?fdate(m.dateNaissance)+(a!==null?' ('+a+' ans)':''):''],['État civil',m.etatCivil],['Profession',m.profession]]);
  sec('Coordonnées',[['Téléphone',m.telephone],['E-mail',m.email],['Adresse',m.adresse]]);
  sec('Vie d\'église',[['N° de membre',matricule(m)],['Statut',m.statut||'Membre actif'],['Fonction',m.fonction],['Arrivée / adhésion',fdate(m.dateAdhesion)],['Baptême',m.baptise?'Oui'+(m.dateBapteme?' – le '+fdate(m.dateBapteme):''):'Non'],['Groupes / départements',(m.groupes||[]).map(groupName).filter(Boolean).join(', ')],['Famille',m.famille?m.famille+(m.lienFamille?' ('+m.lienFamille+')':''):''],['Date de mariage',fdate(m.dateMariage)],['Site',m.site],['Origine de la fiche',m.source]]);
  if(m.notes){d.h2('Notes');d.para(m.notes,10)}
  d.y+=6;d.para(`Je soussigné(e) ${fullName(m)} certifie l'exactitude des informations ci-dessus et accepte qu'elles soient conservées par l'${c.nom} pour la vie de l'église.`,9.5);
  d.text(`Fait à ${c.ville||'……………'}, le ${new Date().toLocaleDateString(LOC(),{day:'numeric',month:'long',year:'numeric'})}`,d.W-d.M,d.y+8,{size:10,align:'right'});d.y+=16;
  d.signatures(['Le membre','Le Secrétaire','Le Pasteur principal']);
  savePDF(`Fiche membre ${fullName(m)}.pdf`,d.finish());
}

/* ---------- graphiques du tableau de bord ---------- */
const PAL=['#1f3f75','#e8a53a','#4f8fd6','#c0392b','#2e8b57','#8a6fc7','#6a7a7f','#d46a9c'];
function gauge(pct,label,sub){
  const p=Math.max(0,Math.min(100,Math.round(pct||0))),R=70,cx=90,cy=86,a=Math.PI*(1-p/100),x=cx+R*Math.cos(a),y=cy-R*Math.sin(a);
  const col=p>=75?'#2e8b57':p>=45?'#e8a53a':'#c0392b';
  return`<div style="text-align:center"><svg viewBox="0 0 180 104" style="width:100%;max-width:220px"><path d="M20 86 A70 70 0 0 1 160 86" fill="none" stroke="#e3e8f0" stroke-width="14" stroke-linecap="round"/>${p?`<path d="M20 86 A70 70 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}" fill="none" stroke="${col}" stroke-width="14" stroke-linecap="round"/>`:''}<text x="90" y="80" text-anchor="middle" font-size="24" font-weight="700" fill="#1b2a2e">${p}%</text></svg><div style="font-weight:600;margin-top:-4px">${esc(label)}</div><div class="muted small">${esc(sub||'')}</div></div>`;
}
function donut(title,data){
  data=data.filter(d=>d[1]>0);const tot=data.reduce((s,d)=>s+d[1],0);
  if(!tot)return`<div><div style="font-weight:600;margin-bottom:6px">${esc(title)}</div><div class="muted small">Pas encore de données.</div></div>`;
  let ang=-Math.PI/2,arcs='';const R=52,r=32,c=60;
  data.forEach((d,i)=>{const f=d[1]/tot,a2=ang+f*2*Math.PI,lg=f>.5?1:0,pt=(rad,a)=>`${(c+rad*Math.cos(a)).toFixed(2)} ${(c+rad*Math.sin(a)).toFixed(2)}`;
    arcs+=f>=.999?`<circle cx="${c}" cy="${c}" r="${(R+r)/2}" fill="none" stroke="${PAL[i%8]}" stroke-width="${R-r}"><title>${esc(d[0])} : ${d[1]}</title></circle>`:`<path d="M${pt(R,ang)} A${R} ${R} 0 ${lg} 1 ${pt(R,a2)} L${pt(r,a2)} A${r} ${r} 0 ${lg} 0 ${pt(r,ang)}Z" fill="${PAL[i%8]}"><title>${esc(d[0])} : ${d[1]}</title></path>`;ang=a2});
  return`<div><div style="font-weight:600;margin-bottom:6px">${esc(title)}</div><div style="display:flex;gap:10px;align-items:center"><svg viewBox="0 0 120 120" style="width:110px;flex:none">${arcs}<text x="60" y="64" text-anchor="middle" font-size="16" font-weight="700" fill="#1b2a2e">${Math.round(tot).toLocaleString('fr-FR')}</text></svg><div style="font-size:12px;min-width:0">${data.map((d,i)=>`<div style="display:flex;gap:6px;align-items:center;margin:3px 0"><i style="width:10px;height:10px;border-radius:3px;background:${PAL[i%8]};flex:none"></i><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(d[0])}</span><b>${Math.round(d[1]/tot*100)}%</b></div>`).join('')}</div></div></div>`;
}
function groupBars(labels,series){
  const W=360,H=170,pl=6,pb=22,pt=12,max=Math.max(1,...series.flatMap(s=>s.v)),gw=(W-pl*2)/labels.length,bw=Math.min(14,gw/(series.length+1));
  let g='';labels.forEach((l,i)=>{series.forEach((s,j)=>{const v=s.v[i],h=(H-pb-pt)*v/max,x=pl+i*gw+(gw-bw*series.length)/2+j*bw;g+=`<rect x="${x}" y="${H-pb-h}" width="${bw-2}" height="${Math.max(h,1)}" rx="2" fill="${s.c}"><title>${esc(s.n)} ${esc(l)} : ${Math.round(v).toLocaleString('fr-FR')}</title></rect>`});g+=`<text x="${pl+i*gw+gw/2}" y="${H-7}" text-anchor="middle" font-size="9.5" fill="#6a7a7f">${esc(l)}</text>`});
  return`<div class="chart"><svg viewBox="0 0 ${W} ${H}">${g}</svg></div><div class="legend">${series.map(s=>`<span><i style="background:${s.c}"></i>${esc(s.n)}</span>`).join('')}</div>`;
}
function dashCharts(){
  const M=S.members,actifs=M.filter(x=>!x.statut||x.statut==='Membre actif').length;
  const att=[...S.attendance].sort((a,b)=>(a.date||'').localeCompare(b.date||'')),last=att[att.length-1];
  const fid=actifs&&last?attTotal(last)/Math.max(actifs,attTotal(last))*100:0;
  const fu=S.followups,fuP=fu.length?fu.filter(f=>f.statut==='Terminé').length/fu.length*100:0;
  const y=String(new Date().getFullYear());let g3;
  const B=budgetFor(y);if(B){const R=budgetRows(y),tb=R.e.reduce((s,x)=>s+x.bud,0),tr=R.e.reduce((s,x)=>s+x.r,0);g3=gauge(tb?tr/tb*100:0,'Budget des recettes '+y,money(tr,R.dev)+' / '+money(tb,R.dev))}
  else{const cp=S.campagnes.find(c=>!c.fin||c.fin>=today());g3=cp?gauge(num(cp.objectif)?campReal(cp)/num(cp.objectif)*100:0,cp.nom,money(campReal(cp),cp.devise||'USD')+' / '+money(num(cp.objectif),cp.devise||'USD')):gauge(0,'Objectif financier','Créez un budget ou une campagne')}
  const jauges=`<div class="card" style="margin-bottom:12px"><h2>Indicateurs</h2><div class="grid3">${gauge(fid,'Présence au dernier culte',last?attTotal(last)+' présents · '+actifs+' membres actifs':'Aucun comptage')}${gauge(fuP,'Suivis pastoraux réalisés',fu.filter(f=>f.statut==='Terminé').length+' sur '+fu.length)}${g3}</div></div>`;
  const cnt=f=>{const o={};M.forEach(m=>{const k=f(m);o[k]=(o[k]||0)+1});return Object.entries(o)};
  const mois=today().slice(0,7),rec=sumBy(S.transactions.filter(t=>isIn(t)&&(t.date||'').startsWith(mois)),t=>t.categorie||'—');
  const donuts=`<div class="card" style="margin-bottom:12px"><h2>Répartitions</h2><div class="grid3">${donut('Membres par statut',cnt(m=>m.statut||'Membre actif'))}${donut('Dernier culte',last?[['Hommes',num(last.hommes)],['Femmes',num(last.femmes)],['Enfants',num(last.enfants)]]:[])}${donut('Recettes du mois (équiv. $)',Object.entries(rec).map(([k,v])=>[k,v.USD+v.CDF/(num(cfg().taux)||1)]))}</div></div>`;
  const ms=lastMonths(6),eq=t=>conv(t,'USD');
  const fin=`<div class="card"><h2>Recettes et dépenses (6 mois, équiv. $)</h2>${groupBars(ms.map(mLab),[{n:'Recettes',c:BRC(),v:ms.map(m=>S.transactions.filter(t=>isIn(t)&&(t.date||'').startsWith(m)).reduce((s,t)=>s+eq(t),0))},{n:'Dépenses',c:'#e8a53a',v:ms.map(m=>S.transactions.filter(t=>isOut(t)&&(t.date||'').startsWith(m)).reduce((s,t)=>s+eq(t),0))}])}</div>`;
  const res=ms.map(m=>S.transactions.filter(t=>(t.date||'').startsWith(m)).reduce((s,t)=>s+(isIn(t)?eq(t):isOut(t)?-eq(t):0),0)),cum=res.reduce((a,b)=>a+b,0),fm=v=>Math.round(v).toLocaleString('fr-FR')+' $';
  const nbG=res.filter(v=>v>0).length,nbP=res.filter(v=>v<0).length;
  const resultat=`<div class="card"><h2>Gain / perte par mois (équiv. $)</h2>${plChart(ms.map(mLab),res,fm)}<div class="small" style="display:flex;gap:10px;flex-wrap:wrap;justify-content:space-between;margin-top:4px"><span>Sur 6 mois : <b style="color:${cum>=0?'#2e9e6a':'#d9534f'}">${cum>=0?'gain de ':'perte de '}${fm(Math.abs(cum))}</b></span><span class="muted">${nbG} mois en gain · ${nbP} mois en perte</span></div><div class="muted small" style="margin-top:4px">Vert = recettes plus grandes que les dépenses ; rouge = l'église a dépensé plus qu'elle n'a reçu. Les prêts ne comptent pas.</div></div>`;
  const PL=S.transactions.filter(t=>t.type==='pret'),PO=PL.filter(l=>loanLeft(l)>0.0001),PD={CDF:0,USD:0};PO.forEach(l=>PD[dv(l)]+=loanLeft(l));const PR=PO.filter(l=>l.echeance&&l.echeance<today());
  const prets=`<div class="card" style="cursor:pointer" data-act="goPrets"><h2>Prêts : encore dû à l'église</h2>${PO.length?`<div style="font-size:20px;font-weight:800;color:#d9534f">${both(PD)}</div><div class="small" style="margin:4px 0 8px">${PO.length} prêt(s) en cours${PR.length?` · <b style="color:#d9534f">${PR.length} en retard</b>`:''}</div>${PO.sort((a,b)=>(a.echeance||'9').localeCompare(b.echeance||'9')).slice(0,4).map(l=>`<div style="display:flex;gap:8px;padding:5px 0;border-top:1px solid var(--bd)"><span style="flex:1">${esc(loanWho(l))}${l.echeance&&l.echeance<today()?' <span class="badge b-inactif">en retard</span>':''}</span><b>${money(loanLeft(l),dv(l))}</b></div>`).join('')}`:'<div class="muted small">Aucun prêt en cours. Tout l\'argent prêté a été rendu.</div>'}</div>`;
  const joined=m=>(m.dateAdhesion||String(m.createdAt||'')).slice(0,7);
  const crois=`<div class="card"><h2>Nouveaux membres par mois</h2>${barChart(ms.map(mLab),ms.map(m=>M.filter(x=>joined(x)===m).length))}</div>`;
  return{jauges,donuts,fin,crois,resultat,prets};
}

/* ================= PROJETS & COLLECTES ================= */
const projClos=c=>c.statut==='clos';
const projActif=c=>!projClos(c)&&!(c.fin&&c.fin<today());
const projTx=c=>S.transactions.filter(t=>isIn(t)&&(t.campagneId===c.id||(catOk(c)&&!t.campagneId&&t.categorie===c.categorie&&(!c.debut||(t.date||'')>=c.debut)&&(!c.dateCloture||(t.date||'')<=c.dateCloture))));
const whoOf=t=>t.membreId&&memberById(t.membreId)?fullName(memberById(t.membreId)):(t.tiers||'Anonyme');
const memberByName=n=>{const k=normTxt(n).trim();return k?S.members.find(m=>normTxt(fullName(m))===k||normTxt([m.prenom,m.nom].filter(Boolean).join(' '))===k):null};
function vProjets(){
  if(UI.proj){const c=S.campagnes.find(x=>x.id===UI.proj);if(c)return projDetail(c);UI.proj=null}
  const all=[...S.campagnes].sort((a,b)=>(b.debut||'').localeCompare(a.debut||''));const l=all.filter(c=>!projClos(c)),lc=all.filter(projClos);
  const card=c=>{const T=projTx(c),real=campReal(c),dev=c.devise||'USD',obj=num(c.objectif),n=new Set(T.map(whoOf)).size,cl=projClos(c),fini=!cl&&c.fin&&c.fin<today();return`<div class="card" style="cursor:pointer${cl?';opacity:.75':''}" data-act="openProj" data-id="${c.id}"><div style="display:flex;gap:8px;align-items:center"><b style="flex:1;font-size:15px">${esc(c.nom)}</b><span class="badge ${cl||fini?'b-inactif':'b-done'}">${cl?'Clôturé':fini?'Date de fin passée':'En cours'}</span></div><div style="display:flex;justify-content:space-between;margin:10px 0 4px"><b>${money(real,dev)}</b><span class="muted small">${obj?'objectif '+money(obj,dev):''}</span></div>${obj?bar(real/obj*100):''}<div class="muted small" style="margin-top:6px">${T.length} contribution(s) · ${n} contributeur(s)${cl&&c.dateCloture?' · clôturé le '+fdate(c.dateCloture):''}</div></div>`};
  return`<div class="toolbar"><div class="muted small">Un projet = une récolte de fonds (achat de la parcelle, construction, mission…). Chaque dimanche, enregistrez les contributions et les noms des personnes. Quand le projet est terminé, ouvrez-le et cliquez sur « Clôturer le projet ».</div><span class="sp"></span><button class="btn primary" data-act="newCamp">+ Nouveau projet</button></div>
  ${l.length?`<div class="grid2">${l.map(card).join('')}</div>`:'<div class="card empty">Aucun projet en cours. Cliquez sur « + Nouveau projet » pour commencer.</div>'}
  ${lc.length?`<div class="sec"><h2>Projets clôturés</h2><div class="grid2">${lc.map(card).join('')}</div></div>`:''}`;
}
function projDetail(c){
  const T=projTx(c).sort((a,b)=>(b.date||'').localeCompare(a.date||'')),dev=c.devise||'USD',real=campReal(c),obj=num(c.objectif),P=c.promesses||{};
  const by={};T.forEach(t=>{const k=whoOf(t);by[k]=by[k]||{n:0,v:0,mid:t.membreId};by[k].n++;by[k].v+=conv(t,dev)});
  const dates={};T.forEach(t=>{const d=t.date||'';dates[d]=dates[d]||{n:0,v:0};dates[d].n++;dates[d].v+=conv(t,dev)});
  Object.keys(P).forEach(id=>{const m=memberById(id);if(m&&!by[fullName(m)])by[fullName(m)]={n:0,v:0,mid:id}});
  const rows=Object.entries(by).sort((a,b)=>b[1].v-a[1].v);
  return`<div class="toolbar"><button class="btn sm" data-act="closeProj">‹ Projets</button><b style="margin-left:6px;font-size:15px">${esc(c.nom)}</b><span class="sp"></span><button class="btn sm" data-act="editCamp" data-id="${c.id}">Modifier</button>${projClos(c)?`<button class="btn sm" data-act="rouvrirProj" data-id="${c.id}">Rouvrir</button>`:`<button class="btn sm" data-act="newPromesse" data-id="${c.id}">+ Promesse</button><button class="btn sm danger" data-act="clotProj" data-id="${c.id}">Clôturer le projet</button>`}<button class="btn sm" data-act="projExport" data-id="${c.id}">Excel</button><button class="btn sm" data-act="projPdf" data-id="${c.id}">PDF</button></div>
  <div class="grid4" style="margin-bottom:12px"><div class="card kpi"><div class="l">Total récolté</div><div class="v" style="font-size:18px">${money(real,dev)}</div><div class="s">${obj?Math.round(real/obj*100)+' % de '+money(obj,dev):'pas d\'objectif fixé'}</div></div><div class="card kpi"><div class="l">Contributeurs</div><div class="v">${Object.keys(by).filter(k=>by[k].n).length}</div></div><div class="card kpi"><div class="l">Collectes</div><div class="v">${Object.keys(dates).length}</div></div><div class="card kpi"><div class="l">Reste à récolter</div><div class="v" style="font-size:18px">${obj?money(Math.max(0,obj-real),dev):'—'}</div></div></div>
  ${obj?`<div class="card" style="margin-bottom:12px">${bar(real/obj*100)}</div>`:''}
  ${projClos(c)?`<div class="banner show info" style="margin-bottom:12px">Projet clôturé le ${fdate(c.dateCloture)}. Il n'apparaît plus dans les listes de saisie ; ses chiffres restent consultables ici. Cliquez sur « Rouvrir » pour le relancer.</div>`:''}<div class="card" style="margin-bottom:12px;border-left:4px solid var(--brand)${projClos(c)?';display:none':''}"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><div style="flex:1;min-width:200px"><b>Enregistrer une collecte</b><div class="muted small">Saisissez en une fois toutes les personnes qui ont contribué aujourd'hui.</div></div><button class="btn primary" data-act="collecte" data-id="${c.id}">+ Collecte du jour</button><button class="btn" data-act="newContrib" data-id="${c.id}">+ Une contribution</button></div></div>
  <div class="grid2"><div class="card"><h2>Contributeurs</h2>${rows.length?`<table class="t"><tr><th>Nom</th><th class="n">Fois</th><th class="n">Total</th>${Object.keys(P).length?'<th class="n">Promis</th>':''}</tr>${rows.map(([k,v])=>`<tr><td>${esc(k)}</td><td class="n">${v.n}</td><td class="n">${money(v.v,dev)}</td>${Object.keys(P).length?`<td class="n">${v.mid&&P[v.mid]?money(P[v.mid],dev):''}</td>`:''}</tr>`).join('')}</table>`:'<div class="muted small">Aucune contribution pour le moment.</div>'}</div>
  <div class="card"><h2>Collectes par date</h2>${Object.keys(dates).length?`<table class="t"><tr><th>Date</th><th class="n">Personnes</th><th class="n">Montant</th></tr>${Object.entries(dates).sort((a,b)=>b[0].localeCompare(a[0])).map(([d,v])=>`<tr><td>${fday(d)}</td><td class="n">${v.n}</td><td class="n">${money(v.v,dev)}</td></tr>`).join('')}</table>`:'<div class="muted small">—</div>'}</div></div>
  <div class="sec"><h2>Détail des contributions</h2><div class="list">${T.length?T.slice(0,200).map(t=>`<div class="row" data-act="editTx" data-id="${t.id}"><div class="grow"><div class="t">${esc(whoOf(t))}</div><div class="st">${fdate(t.date)} · ${esc(t.numBon||'')}${t.description?' · '+esc(t.description):''}</div></div><div class="amt pos">+ ${money(t.montant,t.devise)}</div></div>`).join(''):'<div class="empty">Aucune contribution.</div>'}</div></div>`;
}
function contribForm(c){
  const cf=cfg();
  openForm({title:'Contribution – '+c.nom,values:{date:today(),devise:c.devise||'USD',compte:cf.comptes[0]},
   fields:[{k:'nom',label:'Nom de la personne (membre ou visiteur)',full:1,list:sortedMembers().map(fullName),ph:'Laissez vide si anonyme'},{k:'montant',label:'Montant',type:'number',req:1},{k:'devise',label:'Devise',type:'select',options:[['CDF','Francs congolais (FC)'],['USD','Dollars ($)']]},{k:'date',label:'Date',type:'date'},{k:'compte',label:'Compte',type:'select',options:cf.comptes},{k:'description',label:'Remarque',full:1}],
   onSave:d=>{if(!(num(d.montant)>0)){toast('Montant invalide',1);return false}const m=memberByName(d.nom);return save('transactions',{type:'entree',date:d.date||today(),numBon:nextBon('entree'),categorie:c.categorie||'Contribution projet',fonds:c.fonds||cf.fonds[0],compte:d.compte,montant:num(d.montant),devise:d.devise,membreId:m?m.id:'',tiers:m?'':d.nom,description:d.description||('Projet : '+c.nom),campagneId:c.id})}});
}
function collecteForm(c){
  const cf=cfg(),st={date:today(),devise:c.devise||'USD',compte:cf.comptes[0],rows:Array.from({length:5},()=>({nom:'',montant:''}))};
  const names=sortedMembers().map(fullName);
  const draw=()=>{
    const tot=st.rows.reduce((s,r)=>s+num(r.montant),0);
    modal(`<div class="mhead"><h3>Collecte – ${esc(c.nom)}</h3><button class="x" data-act="close">×</button></div><div class="mbody">
    <datalist id="colNames">${names.map(n=>`<option value="${esc(n)}">`).join('')}</datalist>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px"><input type="date" class="inp" id="colD" value="${esc(st.date)}"><select class="inp" id="colDev">${opt(['CDF','FC'],st.devise)}${opt(['USD','$'],st.devise)}</select><select class="inp" id="colC">${cf.comptes.map(x=>opt(x,st.compte)).join('')}</select></div>
    <div class="muted small" style="margin-bottom:6px">Une ligne par personne. Tapez le nom : les membres sont proposés automatiquement ; un visiteur peut être écrit librement. Laissez le nom vide pour « Anonyme ».</div>
    ${st.rows.map((r,i)=>`<div style="display:flex;gap:6px;margin-bottom:6px"><span class="small muted" style="width:20px;padding-top:10px">${i+1}</span><input class="inp" data-cr="${i}:nom" list="colNames" value="${esc(r.nom)}" placeholder="Nom" style="flex:1;min-width:0" autocomplete="off"><input class="inp" data-cr="${i}:montant" inputmode="decimal" value="${esc(r.montant)}" placeholder="Montant" style="width:110px"></div>`).join('')}
    <button class="btn sm" id="colAdd">+ 5 lignes</button>
    <div style="margin-top:12px;font-weight:700" id="colTot">Total : ${money(tot,st.devise)} · ${st.rows.filter(r=>num(r.montant)>0).length} personne(s)</div></div>
    <div class="mfoot"><span class="sp"></span><button class="btn" data-act="close">Annuler</button><button class="btn primary" id="colSave">Enregistrer la collecte</button></div>`);
    const keep=()=>{st.date=$('#colD').value;st.devise=$('#colDev').value;st.compte=$('#colC').value};
    document.querySelectorAll('[data-cr]').forEach(el=>el.oninput=()=>{const[i,k]=el.dataset.cr.split(':');st.rows[+i][k]=el.value;const t=st.rows.reduce((s,r)=>s+num(r.montant),0);$('#colTot').textContent=`Total : ${money(t,$('#colDev').value)} · ${st.rows.filter(r=>num(r.montant)>0).length} personne(s)`});
    $('#colAdd').onclick=()=>{keep();st.rows.push(...Array.from({length:5},()=>({nom:'',montant:''})));draw()};
    $('#colSave').onclick=async()=>{keep();const L=st.rows.filter(r=>num(r.montant)>0);if(!L.length){toast('Aucun montant saisi',1);return}const b=$('#colSave');b.disabled=true;let n=0;
      for(const r of L){b.textContent=`Enregistrement ${n+1}/${L.length}…`;const m=memberByName(r.nom);
        if(!await save('transactions',{type:'entree',date:st.date,numBon:nextBon('entree'),categorie:c.categorie||'Contribution projet',fonds:c.fonds||cf.fonds[0],compte:st.compte,montant:num(r.montant),devise:st.devise,membreId:m?m.id:'',tiers:m?'':(r.nom.trim()||'Anonyme'),description:'Collecte : '+c.nom,campagneId:c.id}))break;n++;await new Promise(z=>setTimeout(z,25))}
      closeModal();toast(n+' contribution(s) enregistrée(s)')};
  };
  draw();
}
function projPdf(c){
  const T=projTx(c).sort((a,b)=>(a.date||'').localeCompare(b.date||'')),dev=c.devise||'USD',real=campReal(c),obj=num(c.objectif),d=pdfDoc('Projet : '+c.nom,'Situation au '+fdate(today()));
  d.kpis([['Total récolté',money(real,dev)],['Objectif',obj?money(obj,dev):'—'],['Avancement',obj?Math.round(real/obj*100)+' %':'—'],['Contributions',String(T.length)]]);
  const by={};T.forEach(t=>{const k=whoOf(t);by[k]=(by[k]||0)+conv(t,dev)});
  d.h2('Contributeurs');d.table([{t:'N°',w:.08,a:'r'},{t:'Nom',w:.6},{t:'Total',w:.32,a:'r'}],Object.entries(by).sort((a,b)=>b[1]-a[1]).map(([k,v],i)=>[i+1,k,money(v,dev)]),{empty:'Aucune contribution.'});
  d.h2('Détail');d.table([{t:'Date',w:.16},{t:'N° bon',w:.14},{t:'Nom',w:.44},{t:'Montant',w:.26,a:'r'}],T.map(t=>[fdate(t.date),t.numBon,whoOf(t),money(t.montant,t.devise)]),{empty:'—'});
  d.signatures(['Le Trésorier','Le Pasteur principal']);savePDF(`Projet ${c.nom} ${today()}.pdf`,d.finish());
}
function quickCard(){
  const c=cfg(),off=c.catEntrees.find(x=>/offrande/i.test(x))||c.catEntrees[0],dim=c.catEntrees.find(x=>/d[îi]me/i.test(x))||c.catEntrees[0];
  if(!allowed('finances')&&!allowed('dons'))return'';
  return`<div class="card" style="margin-bottom:12px"><h2>Saisie rapide</h2><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn ok" data-act="quickTx" data-k="entree|${esc(off)}">+ Offrande</button>${FINLIM()?'':`<button class="btn ok" data-act="quickTx" data-k="entree|${esc(dim)}">+ Dîme</button><button class="btn ok" data-act="quickTx" data-k="entree|">+ Autre recette</button>`}<button class="btn danger" data-act="quickTx" data-k="sortie|">− Dépense</button>${FINLIM()?'':`<button class="btn primary" data-act="goProj">Projets / collecte</button><button class="btn" data-act="goLot">Collecte du dimanche (enveloppes)</button>`}</div></div>`;
}


const projOf=t=>t.campagneId?S.campagnes.find(c=>c.id===t.campagneId):S.campagnes.find(c=>catOk(c)&&isIn(t)&&t.categorie===c.categorie&&(!c.debut||(t.date||'')>=c.debut));
const projName=t=>{const c=projOf(t);return c?c.nom:''};
const projMatch=t=>!UI.finProj||(UI.finProj==='__none'?!projOf(t):(projOf(t)||{}).id===UI.finProj);
/* ---------- graphiques et interprétation dans les PDF ---------- */
const NAVYC=[31,63,117],ORC=[232,165,58];
function pdfBars(d,title,labels,series,fmt){
  fmt=fmt||(v=>Math.round(v).toLocaleString('fr-FR'));const M=d.M,W=d.W-2*M,H=120;d.ensure(H+60);
  d.text(title,M,d.y+10,{size:10,bold:1,color:TEAL});d.y+=20;
  const max=Math.max(1,...series.flatMap(s=>s.v)),gw=W/Math.max(1,labels.length),bw=Math.min(22,gw*.7/series.length),top=d.y,base=d.y+H;
  d.line(M,base,M+W,base,{color:[200,208,220]});
  labels.forEach((l,i)=>{series.forEach((s,j)=>{const v=s.v[i]||0,h=H*v/max,x=M+i*gw+(gw-bw*series.length)/2+j*bw;if(h>0)d.rect(x,base-h,bw-2,h,{fill:s.c});if(v)d.text(fmt(v),x+(bw-2)/2,base-h-3,{size:6.5,align:'center',color:[60,70,80],max:gw})});
    d.text(l,M+i*gw+gw/2,base+11,{size:7.5,align:'center',color:GREY,max:gw})});
  d.y=base+18;
  if(series.length>1){let x=M;series.forEach(s=>{d.rect(x,d.y,8,8,{fill:s.c});d.text(s.n,x+12,d.y+7.5,{size:8});x+=d.width(s.n,8)+30});d.y+=16}
  d.y+=8;
}
function pdfHBars(d,title,items,fmt){
  items=items.filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,8);if(!items.length)return;
  const M=d.M,W=d.W-2*M,lw=150,vw=90,bwMax=W-lw-vw,tot=items.reduce((s,x)=>s+x[1],0),max=items[0][1];d.ensure(items.length*16+40);
  d.text(title,M,d.y+10,{size:10,bold:1,color:TEAL});d.y+=20;
  items.forEach(([l,v],i)=>{d.text(l,M,d.y+9,{size:8.5,max:lw-8});d.rect(M+lw,d.y+1,Math.max(2,bwMax*v/max),10,{fill:i?[127,160,210]:NAVYC});d.text(fmt(v)+' · '+Math.round(v/tot*100)+' %',M+W,d.y+9,{size:8,align:'right',color:[60,70,80]});d.y+=16});d.y+=10;
}
function interpretation(m){
  const taux=num(cfg().taux)||1,eq=o=>o.USD+o.CDF/taux,pm=iso(new Date(+m.slice(0,4),+m.slice(5,7)-2,1)).slice(0,7);
  const avg=mm=>{const a=S.attendance.filter(x=>(x.date||'').startsWith(mm));return a.length?a.reduce((s,x)=>s+attTotal(x),0)/a.length:null};
  const fin=mm=>{const t=S.transactions.filter(x=>(x.date||'').startsWith(mm));return{r:eq(sumAll(sumBy(t.filter(isIn),()=>'x'))),d:eq(sumAll(sumBy(t.filter(isOut),()=>'x'))),rc:sumBy(t.filter(isIn),x=>x.categorie||'—'),dc:sumBy(t.filter(isOut),x=>x.categorie||'—')}};
  const pct=(a,b)=>b?Math.round((a-b)/b*100):null,usd=v=>money(v,'USD'),out=[];
  const a1=avg(m),a0=avg(pm);
  if(a1===null)out.push("Aucune présence n'a été enregistrée ce mois-ci : pensez à faire le comptage après chaque culte.");
  else{const p=pct(a1,a0);out.push(`Présence moyenne de ${Math.round(a1)} personnes par réunion`+(p===null?'.':p===0?', stable par rapport au mois précédent.':`, soit ${p>0?'une hausse':'une baisse'} de ${Math.abs(p)} % par rapport au mois précédent (${Math.round(a0)}).`));
    const at=S.attendance.filter(x=>(x.date||'').startsWith(m)).sort((x,y)=>attTotal(y)-attTotal(x))[0];if(at)out.push(`La réunion la plus fréquentée a été « ${at.culte} » du ${fdate(at.date)} avec ${attTotal(at)} personnes.`)}
  const F=fin(m),F0=fin(pm),res=F.r-F.d;
  if(!F.r&&!F.d)out.push("Aucune opération financière n'a été enregistrée ce mois-ci.");
  else{out.push(`Recettes de ${usd(F.r)} et dépenses de ${usd(F.d)} (équivalent en dollars) : ${res>=0?'excédent':'déficit'} de ${usd(Math.abs(res))}.`+(F.r?` Les dépenses représentent ${Math.round(F.d/F.r*100)} % des recettes.`:''));
    const p=pct(F.r,F0.r);if(p!==null)out.push(`Les recettes sont en ${p>=0?'hausse':'baisse'} de ${Math.abs(p)} % par rapport au mois précédent.`);
    const tr=Object.entries(F.rc).map(([k,v])=>[k,eq(v)]).sort((a,b)=>b[1]-a[1])[0];if(tr&&F.r)out.push(`Principale source de recettes : ${tr[0]} (${Math.round(tr[1]/F.r*100)} % du total).`);
    const td=Object.entries(F.dc).map(([k,v])=>[k,eq(v)]).sort((a,b)=>b[1]-a[1])[0];if(td&&F.d)out.push(`Principal poste de dépense : ${td[0]} (${Math.round(td[1]/F.d*100)} % des dépenses).`);
    if(res<0)out.push('Attention : le mois est déficitaire, il est conseillé de revoir les dépenses ou de mobiliser les recettes.')}
  const nv=S.members.filter(x=>(x.dateAdhesion||'').startsWith(m)).length,bp=S.members.filter(x=>(x.dateBapteme||'').startsWith(m)).length;
  out.push(nv?`${nv} nouvelle(s) personne(s) enregistrée(s)${bp?` et ${bp} baptême(s)`:''} ce mois-ci.`:"Aucun nouveau membre enregistré ce mois-ci.");
  {const dp=S.members.filter(x=>(x.dateDepart||'').startsWith(m));if(dp.length){const mo={};dp.forEach(x=>{const k=x.motifDepart||'motif non précisé';mo[k]=(mo[k]||0)+1});out.push(`${dp.length} départ(s) ce mois-ci (${Object.entries(mo).map(([k,v])=>v+' : '+k.toLowerCase()).join(', ')}) ; solde net de ${nv-dp.length>=0?'+':''}${nv-dp.length} personne(s).`)}}
  const late=S.followups.filter(f=>f.statut!=='Terminé'&&f.echeance&&f.echeance<today()).length;if(late)out.push(`${late} suivi(s) pastoral(aux) en retard à traiter.`);
  S.campagnes.filter(c=>!c.fin||c.fin>=m+'-01').forEach(c=>{const o=num(c.objectif),r=campReal(c);if(o)out.push(`Projet « ${c.nom} » : ${money(r,c.devise||'USD')} récoltés sur ${money(o,c.devise||'USD')} (${Math.round(r/o*100)} %).`)});
  return out;
}
function pdfInterp(d,lines){d.h2('Ce qu\'il faut retenir');lines.forEach(l=>{const L=d.wrap(l,d.W-2*d.M-14,9.5);d.ensure(L.length*13+4);d.text('•',d.M+2,d.y+9.5,{size:10,color:TEAL,bold:1});L.forEach((x,i)=>d.text(x,d.M+14,d.y+9.5+i*13,{size:9.5}));d.y+=L.length*13+3});d.y+=6}

/* ---------- départs ---------- */
const MOTIFS_DEPART=['Déménagement / changement de ville','A rejoint une autre église','Retour au village / à l\'étranger','Décès','Désaccord / conflit','A cessé de venir (raison inconnue)','Autre'];
const isGone=m=>m.statut==='Parti(e)';
function departForm(m){
  openForm({title:'Enregistrer un départ – '+fullName(m),values:{dateDepart:today(),motifDepart:MOTIFS_DEPART[0]},
   fields:[{k:'dateDepart',label:'Date du départ',type:'date',req:1},{k:'motifDepart',label:'Motif',type:'select',options:MOTIFS_DEPART},{k:'destination',label:'Nouvelle ville / nouvelle église',full:1,ph:'ex. Kolwezi, Église …'},{k:'noteDepart',label:'Remarque',type:'textarea',full:1,rows:2}],
   onSave:async d=>{const ok=await save('members',{...m,...d,statut:'Parti(e)',statutAvantDepart:m.statut||'Membre actif'});if(ok){toast('Départ enregistré');setTimeout(()=>viewMember(m.id),100)}return ok}});
}
async function reintegrer(m){const{dateDepart,motifDepart,destination,noteDepart,statutAvantDepart,...rest}=m;if(await save('members',{...rest,statut:statutAvantDepart||'Membre actif',dateRetour:today(),dateDepart:'',motifDepart:'',destination:'',noteDepart:''})){toast('Membre réintégré');setTimeout(()=>viewMember(m.id),100)}}

/* ---------- export ---------- */
async function exportCSV(name,rows){
  const csv='﻿'+rows.map(r=>r.map(v=>{v=String(v??'');return/[;"\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}).join(';')).join('\r\n');
  let dl=null;try{dl=window.claude?await window.claude.use('downloads'):null}catch(e){}
  if(dl){try{await dl.save({filename:name,data:csv});return}catch(e){}}
  try{await navigator.clipboard.writeText(csv);toast('Copié : collez dans Excel')}catch(e){toast('Export indisponible ici',1)}
}
const ACT={
  menu(){$('#side').classList.toggle('open');$('#scrim').classList.toggle('open')},
  close:closeModal,
  newMember:()=>memberForm(),viewMember:d=>viewMember(d.id),editMember:d=>memberForm(memberById(d.id)),
  newGroup:()=>groupForm(),viewGroup:d=>viewGroup(d.id),editGroup:d=>groupForm(S.groups.find(g=>g.id===d.id)),
  calPrev(){UI.cal=new Date(UI.cal.getFullYear(),UI.cal.getMonth()-1,1);render()},calNext(){UI.cal=new Date(UI.cal.getFullYear(),UI.cal.getMonth()+1,1);render()},calToday(){UI.cal=new Date(now.getFullYear(),now.getMonth(),1);render()},
  viewDay:d=>viewDay(d.date),newEvent:d=>eventForm(null,d.date),editEvent:d=>eventForm(S.events.find(e=>e.id===d.id)),
  newAtt:()=>attForm(),newAttDate:d=>attForm(null,d.date),editAtt:d=>attForm(S.attendance.find(a=>a.id===d.id)),
  fuTab(d){UI.fu=d.k;render()},newFollow:()=>followForm(),newFollowFor:d=>followForm(null,d.id),editFollow:d=>followForm(S.followups.find(f=>f.id===d.id)),
  async doneFollow(d){const f=S.followups.find(x=>x.id===d.id);if(f&&await save('followups',{...f,statut:'Terminé'}))toast('Suivi terminé')},
  newTx:d=>txForm(null,d.type),editTx:d=>{const t=S.transactions.find(t=>t.id===d.id);if(!t)return;if(t.type==='pret')return loanForm(t);if(t.type==='rembpret')return repayForm(S.transactions.find(x=>x.id===t.pretId),t);txForm(t)},
  newLoan:()=>loanForm(),dlAutoBk:async d=>{try{const t=await window.EMT_BACKUP.download(d.k);const dl=await window.claude.use('downloads');await dl.save({filename:d.k,data:t});toast('Sauvegarde téléchargée')}catch(e){toast('Échec : '+(e.message||e),1)}},
  rsAutoBk:async d=>{try{const t=await window.EMT_BACKUP.download(d.k);restore(new File([t],d.k,{type:'application/json'}))}catch(e){toast('Échec : '+(e.message||e),1)}},carteM:d=>pdfCartes([memberById(d.id)]),cartesAll:()=>pdfCartes(sortedMembers().filter(m=>m.statut!=='Inactif'&&!isGone(m))),scanCard:()=>scanCard(),scanStop:()=>scanStop(),
  recuPdf:d=>{const t=S.transactions.find(x=>x.id===d.id)||UI.recuT;closeModal();if(t)recuPDF(t)},recuShare:d=>{const t=S.transactions.find(x=>x.id===d.id)||UI.recuT;closeModal();if(t)recuShare(t)},pdfJournalFin:()=>pdfJournalFin(),
  logoReset:async()=>{const c={...cfg()};delete c.logo;if(await saveConfig(c)){_thm='';toast('Logo d\'origine rétabli');setTimeout(()=>location.reload(),600)}},setColor:async d=>{if(await saveConfig({...cfg(),couleur:d.k}))toast('Couleur appliquée')},goPrets(){UI.loan=null;UI.finTab='prets';location.hash='finances';render()},repayLoan:d=>repayForm(S.transactions.find(t=>t.id===d.id)),openLoan(d){UI.loan=d.id;render()},closeLoan(){UI.loan=null;render()},finAll(){UI.finMonth='';render()},
  editConfig:configForm,newProg:()=>progForm(null),editProg:d=>progForm(+d.i),
  pdfRapport:()=>pdfRapport(),pdfJournal:()=>pdfJournal(),pdfMembres:()=>pdfMembres(),pdfAttestation:d=>pdfAttestation(d.id),
  setTheme(d){applyTheme(d.k);render()},
  eTab(d){UI.eTab=d.k;UI.evSel=null;render()},openEv(d){UI.evSel=d.id;render()},closeEv(){UI.evSel=null;render()},
  evShare(d){const e=S.events.find(x=>x.id===d.id);if(e)copyText(eventText(e),'Annonce copiée : collez-la dans WhatsApp')},
  evExport(d){const e=S.events.find(x=>x.id===d.id);exportCSV('inscriptions-'+slug(e.titre)+'.csv',[['Nom','Téléphone','Billet','Quantité','Montant','Payé','Reste','Devise','Notes']].concat(inscrOf(e.id).map(i=>[i.nom,i.telephone||(memberById(i.membreId)||{}).telephone,i.billet,num(i.qte)||1,inscrDu(i),num(i.paye),inscrDu(i)-num(i.paye),i.devise,i.notes])))},
  evPdf(d){const e=S.events.find(x=>x.id===d.id),I=inscrOf(e.id),dd=pdfDoc('Liste des inscrits',e.titre+' · '+fday(e.date));dd.table([{t:'N°',w:.06,a:'r'},{t:'Nom',w:.32},{t:'Billet',w:.18},{t:'Qté',w:.08,a:'r'},{t:'Dû',w:.18,a:'r'},{t:'Reste',w:.18,a:'r'}],I.map((i,k)=>[k+1,i.nom,i.billet,num(i.qte)||1,money(inscrDu(i),i.devise),money(inscrDu(i)-num(i.paye),i.devise)]),{empty:'Aucun inscrit.'});savePDF('Inscrits '+e.titre+'.pdf',dd.finish())},
  newInscr(d){inscrForm(S.events.find(x=>x.id===d.id))},editInscr(d){const i=S.inscriptions.find(x=>x.id===d.id);if(i)inscrForm(S.events.find(x=>x.id===i.eventId),i)},payInscr(d){const i=S.inscriptions.find(x=>x.id===d.id);if(i)payForm(i)},
  newRes:()=>resForm(),editRes(d){resForm(S.reservations.find(x=>x.id===d.id))},editRessources:()=>ressourcesForm(),
  newBien:()=>bienForm(),editBien:d=>bienForm(S.biens.find(x=>x.id===d.id)),
  foTab(d){UI.foTab=d.k;UI.form=null;UI.formResp=null;render()},newForm(){UI.form={titre:'Nouveau formulaire',description:'',merci:'Merci !',champs:[{label:'Nom',type:'texte',map:'nom',requis:true}]};render()},newFormVisiteur(){UI.form=visiteurForm();render()},
  editForm(d){const f=S.formulaires.find(x=>x.id===d.id);if(f){UI.form=JSON.parse(JSON.stringify(f));render()}},closeForm(){UI.form=null;render()},
  async saveForm(){const f=UI.form,id=f.id||('f'+Date.now());if(await save('formulaires',{...f,id})){f.id=id;toast('Formulaire enregistré');render()}},
  delForm(){const id=UI.form.id;confirmBox('Supprimer ce formulaire ?',async()=>{const ok=await removeDoc('formulaires',id);if(ok){UI.form=null;render()}return ok})},
  fkAdd(){UI.form.champs.push({label:'',type:'texte',map:'',requis:false});render()},fkUp(d){const a=UI.form.champs,i=+d.i;if(i>0){[a[i-1],a[i]]=[a[i],a[i-1]];render()}},fkDel(d){UI.form.champs.splice(+d.i,1);render()},
  kiosk(d){const f=S.formulaires.find(x=>x.id===d.id);if(f)kiosk(f)},formResp(d){UI.formResp=d.id;render()},closeResp(){UI.formResp=null;render()},
  respExport(d){const f=S.formulaires.find(x=>x.id===d.id);exportCSV('reponses-'+slug(f.titre)+'.csv',[['Date'].concat((f.champs||[]).map(c=>c.label))].concat(S.reponses.filter(r=>r.formId===f.id).map(r=>[r.at].concat((f.champs||[]).map((c,i)=>c.type==='signature'?(r.valeurs[i]?'signé':''):r.valeurs[i])))))},
  respMember(d){const r=S.reponses.find(x=>x.id===d.id);if(r)createMemberFrom(S.formulaires.find(f=>f.id===r.formId),r)},respDel(d){confirmBox('Supprimer cette réponse ?',()=>removeDoc('reponses',d.id))},
  newVote:()=>voteForm(),editVote:d=>voteForm(S.sondages.find(x=>x.id===d.id)),voteManual:d=>voteManualForm(S.sondages.find(x=>x.id===d.id)),votePdf:d=>votePdf(S.sondages.find(x=>x.id===d.id)),
  async vote(d){const u=ME&&ME.id||'local';if(await save('votes',{id:d.id+'__'+u,sid:d.id,choix:d.k}))toast('Vote enregistré')},
  rdvF(d){UI.rdvF=d.k;render()},newRdv:()=>rdvForm(),newRdvAt:d=>rdvForm(null,d.k.split('|')),editRdv:d=>rdvForm(S.rdv.find(x=>x.id===d.id)),editDispos:()=>disposForm(),
  mTab(d){UI.mTab=d.k;render()},newMedia:()=>mediaForm(),editMedia:d=>mediaForm(S.medias.find(x=>x.id===d.id)),
  async aiResume(d){const m=S.medias.find(x=>x.id===d.id);if(!m)return;toast('Résumé en cours…');const t=await aiCall(`Voici les notes d'une prédication intitulée « ${m.titre} » (${m.reference||''}). Rédige en français un résumé de 3 à 5 phrases puis 3 points clés sous forme de tirets. Pas de titre.

${String(m.notes).slice(0,20000)}`);if(t)await save('medias',{...m,resume:t.trim()})},
  editVerset(){const v=cfg().verset||{};openForm({title:'Verset du jour',values:v,fields:[{k:'texte',label:'Texte',type:'textarea',full:1,req:1},{k:'ref',label:'Référence',full:1}],onSave:d=>saveConfig({verset:{...d,date:today()}})})},
  async aiVerset(){UI.aiBusy4=1;render();const r=await aiCall(`Propose un verset biblique encourageant pour le verset du jour d'une église (date ${today()}), dans la traduction Louis Segond 1910. Réponds uniquement en JSON {"texte":"…","ref":"Livre chapitre:verset"}.`,true);UI.aiBusy4=0;if(r&&r.texte)await saveConfig({verset:{texte:String(r.texte),ref:String(r.ref||''),date:today()}});render()},
  copyVerset(){const v=verseDuJour();copyText(`📖 *Verset du jour*
_« ${v.texte} »_
*${v.ref||''}*
— ${cfg().nom}`,'Verset copié')},copyWeb(){copyText(webSnippet(),'Code HTML copié')},
  dashCustom:()=>dashCustomForm(),goIA(){UI.rTab='ia';location.hash='rapports'},
  newAlbum:()=>albumForm(),openAlbum(d){UI.album=d.id;render()},closeAlbum(){UI.album=null;render()},editAlbum:d=>albumForm(S.albums.find(x=>x.id===d.id)),lightbox:d=>lightbox(+d.i),
  iTab(d){UI.iTab=d.k;if(d.k!=='mouvements')UI.mvtArt='';render()},newArticle:()=>articleForm(),editArticle:d=>articleForm(S.articles.find(x=>x.id===d.id)),editMvt:d=>{const m=S.mouvements.find(x=>x.id===d.id);if(m)mvtEditForm(m)},newMvt(d){const a=S.articles.find(x=>x.id===d.id);if(a)mvtForm(a)},
  async retourPret(d){const[aid,qui,q]=d.k.split('|'),a=S.articles.find(x=>x.id===aid);if(!a)return;const isM=!!memberById(qui);if(await save('mouvements',{articleId:aid,type:'retour',qte:num(q),date:today(),membreId:isM?qui:'',par:isM?(ME&&ME.name||''):qui,motif:'Retour'}))if(await save('articles',{...a,quantite:num(a.quantite)+num(q)}))toast('Retour enregistré')},
  startComptage(){UI.comptInv={};render()},cancelComptage(){UI.comptInv=null;render()},validComptage(){confirmBox('Valider l\'inventaire ? Les quantités seront corrigées selon le comptage.',async()=>{await validComptage();return true},{btn:'Valider',done:'Inventaire validé'})},
  pdfComptage(d){const h=S.comptages.find(x=>x.id===d.id);if(h)pdfComptage(h)},pdfInv:()=>pdfInv(),
  exportInv(){exportCSV('inventaire.csv',[['Article','Catégorie','Emplacement','État','Quantité','Unité','Valeur unitaire','Devise','N° série']].concat(S.articles.map(a=>[a.nom,a.categorie,a.emplacement,a.etat,num(a.quantite),a.unite,a.valeurUnit,a.devise,a.numSerie])))},
  exportMvt(){exportCSV('mouvements-stock.csv',[['Date','Article','Type','Quantité','Personne','Motif','Saisi par']].concat(S.mouvements.map(m=>[m.date,(S.articles.find(a=>a.id===m.articleId)||{}).nom,(MVT[m.type]||[''])[0],m.qte,m.membreId?fullName(memberById(m.membreId)||{}):'',m.motif,m.par])))},
  ...ME_ACT,autoSend:()=>autoSend(),
  bulVerse(d){const i=+d.i;biblePicker(v=>{const b=UI.bul.blocs[i];b.texte=v.texte;b.ref=v.ref;render()})},
  pickVerset(){biblePicker(v=>saveConfig({verset:{...v,date:today()}}))},
  insVerse(){biblePicker(v=>{UI.msg=(UI.msg?UI.msg.replace(/\s+$/,'')+'\n\n':'')+`📖 « ${v.texte} » (${v.ref})`;render()})},
  pdfFiche:d=>pdfFiche(memberById(d.id)),
  openProj(d){UI.proj=d.id;render()},
  clotProj(d){const c=S.campagnes.find(x=>x.id===d.id);if(!c)return;confirmBox(`Clôturer le projet « ${c.nom} » ? Il n'apparaîtra plus dans les listes de saisie. Tout ce qui a été récolté reste enregistré, et vous pourrez le rouvrir plus tard.`,()=>save('campagnes',{...c,statut:'clos',dateCloture:today()}),{btn:'Clôturer',done:'Projet clôturé'})},
  rouvrirProj(d){const c=S.campagnes.find(x=>x.id===d.id);if(c)save('campagnes',{...c,statut:'',dateCloture:''}).then(ok=>ok&&toast('Projet rouvert'))},closeProj(){UI.proj=null;render()},collecte(d){collecteForm(S.campagnes.find(x=>x.id===d.id))},newContrib(d){contribForm(S.campagnes.find(x=>x.id===d.id))},
  projPdf(d){projPdf(S.campagnes.find(x=>x.id===d.id))},projExport(d){const c=S.campagnes.find(x=>x.id===d.id);exportCSV('projet-'+slug(c.nom)+'.csv',[['Date','N° bon','Nom','Montant','Devise','Compte','Remarque']].concat(projTx(c).map(t=>[t.date,t.numBon,whoOf(t),t.montant,t.devise,t.compte,t.description])))},
  quickTx(d){const[type,cat]=d.k.split('|');txForm(null,type,cat?{categorie:cat}:{})},goProj(){UI.proj=null;location.hash='projets'},goLot(){UI.dTab='lots';location.hash='dons'},
  crExport(){const n=+UI.crN||12,F=UI.crF,joined=m=>(m.dateAdhesion||String(m.createdAt||'')).slice(0,7),M=S.members.filter(m=>(!F.sexe||m.sexe===F.sexe)&&(!F.groupe||(m.groupes||[]).includes(F.groupe))&&(!F.statut||(m.statut||'Membre actif')===F.statut));
    exportCSV('croissance.csv',[['Mois','Début','Nouveaux','Départs','Fin','Baptêmes']].concat(lastMonths(n).map(mm=>{const dp=m=>(m.dateDepart||'').slice(0,7),d=M.filter(m=>joined(m)&&joined(m)<mm&&!(dp(m)&&dp(m)<mm)).length,nv=M.filter(m=>joined(m)===mm).length,pa=M.filter(m=>dp(m)===mm).length;return[mm,d,nv,pa,d+nv-pa,M.filter(m=>(m.dateBapteme||'').startsWith(mm)).length]})))},
  departM:d=>departForm(memberById(d.id)),reintegrer:d=>reintegrer(memberById(d.id)),
  toggleF(){UI.showF=!UI.showF;render()},mfClear(){UI.mf={...FDEF};UI.aiMsg='';render()},mView(){UI.mView=UI.mView==='familles'?'liste':'familles';render()},importCSV:()=>importForm(),
  mfMsg(){UI.aud='manuel';UI.audSel=[...UI.lastList];UI.comTab='messages';UI.sent={};location.hash='communication'},
  aiRewrite:d=>aiRewrite(d.k),
  pTab(d){UI.pTab=d.k;render()},ckF(d){UI.ckF=d.k;render()},ckToggle:d=>ckToggle(d.id),borne:()=>borne(),ckReport:()=>ckReport(),
  ckExport(){const c=checkinFor(UI.ckDate,UI.ckCulte)||{presents:{}};exportCSV(`presents-${UI.ckDate}.csv`,[['Nom','Téléphone','Arrivée']].concat(Object.entries(c.presents).map(([id,t])=>[fullName(memberById(id)||{}),(memberById(id)||{}).telephone,t])))},
  newFollowAbs:d=>followForm(null,d.id),accueilForm:()=>accueilForm(),
  cTab(d){UI.cTab=d.k;render()},newPlan(){UI.plan=newPlan();render()},openPlan(d){const p=S.plans.find(x=>x.id===d.id);if(p){UI.plan=JSON.parse(JSON.stringify(p));render()}},closePlan(){UI.plan=null;render()},
  async savePlan(){const p=UI.plan,id=p.id||('p'+Date.now());if(await save('plans',{...p,id})){p.id=id;toast('Plan enregistré');render()}},
  delPlan(){const id=UI.plan.id;confirmBox('Supprimer ce plan ?',async()=>{const ok=await removeDoc('plans',id);if(ok){UI.plan=null;render()}return ok})},
  async planModel(){const{id,date,...m}=UI.plan;const nom=m.titre;const l=(cfg().planModeles||[]).filter(x=>x.nom!==nom);l.push({...m,nom,equipe:(m.equipe||[]).map(a=>({role:a.role,membreId:a.membreId}))});if(await saveConfig({planModeles:l}))toast('Modèle « '+nom+' » enregistré')},
  planWa(){copyText(planText(UI.plan),'Plan copié pour WhatsApp')},pdfPlan:()=>pdfPlan(),
  piAdd(d){UI.plan.items.push({type:d.k,titre:d.k==='section'?'Nouvelle section':'',duree:d.k==='section'?0:5,note:''});render()},
  piUp(d){const a=UI.plan.items,i=+d.i;if(i>0){[a[i-1],a[i]]=[a[i],a[i-1]];render()}},piDown(d){const a=UI.plan.items,i=+d.i;if(i<a.length-1){[a[i+1],a[i]]=[a[i],a[i+1]];render()}},piDel(d){UI.plan.items.splice(+d.i,1);render()},
  peAdd(){(UI.plan.equipe=UI.plan.equipe||[]).push({role:'',membreId:'',statut:'attente'});render()},peDel(d){UI.plan.equipe.splice(+d.i,1);render()},
  newSong:()=>songForm(),editSong:d=>songForm(S.songs.find(x=>x.id===d.id)),exportSongs(){exportCSV('chants.csv',[['Titre','Auteur','Tonalité','Thème','Langue']].concat(S.songs.map(s=>[s.titre,s.artiste,s.tonalite,s.theme,s.langue])))},
  editRolesServ:()=>rolesServForm(),newIndispo:()=>indispoForm(),editIndispo:d=>indispoForm(S.indispos.find(x=>x.id===d.id)),
  dTab(d){UI.dTab=d.k;render()},
  newLot(){const c=cfg(),n=S.lots.reduce((m,l)=>Math.max(m,num(l.numero)),0)+1;UI.lot={numero:String(n),date:today(),culte:progTitles()[0],compte:c.comptes[0],comptePar:'',lignes:[],statut:'ouvert'};render()},
  openLot(d){const l=S.lots.find(x=>x.id===d.id);if(l){UI.lot=JSON.parse(JSON.stringify(l));render()}},closeLot(){UI.lot=null;render()},
  async saveLot(){const L=UI.lot,id=L.id||('lot'+Date.now());if(await save('lots',{...L,id})){L.id=id;toast('Lot enregistré')}},
  delLot(){const id=UI.lot.id;confirmBox('Supprimer ce lot ?',async()=>{const ok=await removeDoc('lots',id);if(ok){UI.lot=null;render()}return ok})},
  clotureLot:()=>clotureLot(),
  lkAdd(d){const c=cfg(),cat=d.k==='offrande'?(c.catEntrees.find(x=>/offrande/i.test(x))||c.catEntrees[0]):(c.catEntrees.find(x=>/d[îi]me/i.test(x))||c.catEntrees[0]);UI.lot.lignes.push({enveloppe:'',membreId:'',categorie:cat,fonds:c.fonds[0],mode:'Espèces',montant:'',devise:'CDF'});render()},
  lkDel(d){UI.lot.lignes.splice(+d.i,1);render()},
  newCamp:()=>campForm(),editCamp:d=>campForm(S.campagnes.find(x=>x.id===d.id)),newPromesse:d=>promesseForm(S.campagnes.find(x=>x.id===d.id)),
  pdfRelevesAll:()=>pdfRelevesAll(),pdfAttY(d){const m=memberById(d.id);if(!m)return;const dd=pdfDoc('Attestation de contributions','Année '+UI.relYear);attestationPages(dd,m,UI.relYear,true);savePDF(`Attestation ${fullName(m)} ${UI.relYear}.pdf`,dd.finish())},
  rTab(d){UI.rTab=d.k;render()},aiReset(){UI.aiChat=[];render()},aiSugg:d=>aiAsk(d.k),
  newCRole:()=>customRoleForm(),editCRole:d=>customRoleForm((cfg().customRoles||[]).find(x=>x.id===d.id)),backup:()=>backup(),
  finTab(d){UI.finTab=d.k;render()},newTransfer:()=>transferForm(),goRappro(d){UI.finTab='rappro';UI.rcCompte=d.k;render()},
  editBudget:()=>budgetForm(),pdfBudget:()=>pdfBudget(),pdfEtats:()=>pdfEtats(),
  async pointe(d){const t=S.transactions.find(x=>x.id===d.id);if(t)await save('transactions',{...t,pointe:!t.pointe})},
  async pointAll(){const c=cfg(),C=UI.rcCompte||c.comptes[0];for(const t of S.transactions.filter(t=>!t.rapproche&&!t.pointe&&amountFor(t,C,UI.rcDev)!==0&&(t.date||'')<=UI.rcDate)){if(!await save('transactions',{...t,pointe:true}))break}},
  validRappro:()=>validRappro(),
  comTab(d){UI.comTab=d.k;render()},setCanal(d){UI.canal=d.k;UI.sent={};render()},
  audToggle(d){const i=UI.audSel.indexOf(d.id);if(i<0)UI.audSel.push(d.id);else UI.audSel.splice(i,1);UI.sent={};render()},
  insVar(d){UI.msg+=(UI.msg&&!/\s$/.test(UI.msg)?' ':'')+d.k;render();const t=$('#msgTxt');if(t){t.focus();t.setSelectionRange(t.value.length,t.value.length)}},
  copyNums(){copyText(audienceList().map(m=>intl(m.telephone)).filter(Boolean).join(', '),'Numéros copiés')},
  copyEmails(){copyText(audienceList().map(m=>m.email).filter(Boolean).join(', '),'Adresses copiées')},
  copyMsg(){copyText(fillTpl(UI.msg,null).replace(/\s+,/g,','),'Message copié')},
  async logMsg(){const l=audienceList();if(await save('commlog',{at:new Date().toISOString(),canal:UI.canal,audience:(audiences().find(a=>a[0]===UI.aud)||[])[1]||'',message:UI.msg,nb:l.length,uid:ME&&ME.id||''}))toast('Ajouté à l\'historique')},
  reuseMsg(d){const x=S.commlog.find(y=>y.id===d.id);if(x){UI.msg=x.message||'';UI.canal=x.canal||'whatsapp';UI.comTab='messages';UI.sent={};render()}},
  newBul(){UI.bul=newBulletin();render()},openBul(d){const b=S.bulletins.find(x=>x.id===d.id);if(b)UI.bul=JSON.parse(JSON.stringify(b));render()},closeBul(){UI.bul=null;render()},
  bulAdd(d){UI.bul.blocs.push({type:d.k,titre:'',texte:'',ref:''});render()},
  bulUp(d){const i=+d.i,a=UI.bul.blocs;if(i>0){[a[i-1],a[i]]=[a[i],a[i-1]];render()}},
  bulDown(d){const i=+d.i,a=UI.bul.blocs;if(i<a.length-1){[a[i+1],a[i]]=[a[i],a[i+1]];render()}},
  bulDel(d){UI.bul.blocs.splice(+d.i,1);render()},
  async saveBul(){const b=UI.bul;const id=b.id||('b'+Date.now());if(await save('bulletins',{...b,id})){b.id=id;toast('Bulletin enregistré');render()}},
  delBul(){const id=UI.bul.id;confirmBox('Supprimer ce bulletin ?',async()=>{const ok=await removeDoc('bulletins',id);if(ok){UI.bul=null;render()}return ok})},
  copyBul(){copyText(bulText(UI.bul),'Texte copié : collez-le dans WhatsApp')},pdfBul:()=>pdfBul(),lock:()=>lock(),changePin(){if(AUTH.canPin)loginScreen('create')},
  exportMembers(){exportCSV('membres-emt.csv',[['Nom','Postnom','Prénom','Sexe','Naissance','Téléphone','E-mail','Adresse','Statut','Fonction','Adhésion','Baptisé','Groupes']].concat(sortedMembers().map(m=>[m.nom,m.postnom,m.prenom,m.sexe,m.dateNaissance,m.telephone,m.email,m.adresse,m.statut,m.fonction,m.dateAdhesion,m.baptise?'Oui':'Non',(m.groupes||[]).map(groupName).filter(Boolean).join(', ')])))},
  exportGroup(d){const g=S.groups.find(x=>x.id===d.id);exportCSV('groupe-'+(g.nom||'').replace(/\W+/g,'-')+'.csv',[['Nom','Téléphone']].concat(sortedMembers().filter(m=>(m.groupes||[]).includes(d.id)).map(m=>[fullName(m),m.telephone])))},
  exportTx(){const l=S.transactions.filter(t=>(!UI.finMonth||(t.date||'').startsWith(UI.finMonth))&&(!UI.finFund||t.fonds===UI.finFund)&&projMatch(t)).sort((a,b)=>(a.date||'').localeCompare(b.date||''));exportCSV('finances-emt'+(UI.finMonth?'-'+UI.finMonth:'')+'.csv',[['Date','N° bon','Type','Catégorie','Projet','Fonds','Compte','Montant','Devise','Membre / tiers','Libellé']].concat(l.map(t=>[t.date,t.numBon,t.type==='sortie'?'Sortie':t.type==='pret'?'Prêt accordé':t.type==='rembpret'?'Remboursement de prêt':t.type==='transfert'?'Virement':'Entrée',t.categorie,projName(t),t.fonds,t.type==='transfert'?acct(t)+' → '+t.compteDest:acct(t),(t.type==='sortie'||t.type==='pret')?-num(t.montant):num(t.montant),t.devise,t.membreId?fullName(memberById(t.membreId)||{}):t.tiers,t.description])))},
  exportReport(){const m=UI.repMonth,tx=S.transactions.filter(t=>(t.date||'').startsWith(m));const att=S.attendance.filter(a=>(a.date||'').startsWith(m));
    const rows=[['Rapport mensuel',cfg().nom,monthLabel(m)],[],['Présences'],['Date','Réunion','Hommes','Femmes','Enfants','Visiteurs','Total']].concat(att.map(a=>[a.date,a.culte,num(a.hommes),num(a.femmes),num(a.enfants),num(a.visiteurs),attTotal(a)]),[[],['Finances'],['Type','Catégorie','FC','$']]);
    const add=(type,o)=>Object.entries(o).forEach(([k,v])=>rows.push([type,k,v.CDF,v.USD]));
    add('Entrée',sumBy(tx.filter(isIn),t=>t.categorie));add('Sortie',sumBy(tx.filter(t=>t.type==='sortie'),t=>t.categorie));
    exportCSV('rapport-emt-'+m+'.csv',rows)}
};
document.addEventListener('click',e=>{
  const al=e.target.closest('a[href]');if(al){if(al.dataset.sent){UI.sent[al.dataset.sent]=1;setTimeout(render,300)}return}
  const a=e.target.closest('[data-act]');if(!a)return;
  e.stopPropagation();
  const k=a.dataset.act;
  if((ROLES[ROLE]||{}).ro&&/^(new|edit|done|changeP)/.test(k)&&k!=='changePin'){toast('Accès en lecture seule',1);return}
  const f=ACT[k];if(f){if(/^(pdf|export|ev(Pdf|Export)|ckExport|respExport)/.test(k))withSite(()=>f(a.dataset));else f(a.dataset)}
});
document.addEventListener('input',e=>{const ds=e.target.dataset||{};
  if(ds.pk&&UI.plan){const[i,k]=ds.pk.split(':');UI.plan.items[+i][k]=k==='duree'?num(e.target.value):e.target.value;return}
  if(ds.pe&&UI.plan){const[i,k]=ds.pe.split(':');UI.plan.equipe[+i][k]=e.target.value;return}
  if(ds.pf&&UI.plan){UI.plan[ds.pf]=e.target.value;return}
  if(ds.lk&&UI.lot){const[i,k]=ds.lk.split(':');UI.lot.lignes[+i][k]=e.target.value;return}
  if(ds.lf&&UI.lot){UI.lot[ds.lf]=e.target.value;return}
  if(ds.fk&&UI.form){const[i,k]=ds.fk.split(':');UI.form.champs[+i][k]=e.target.type==='checkbox'?e.target.checked:e.target.value;return}
  if(ds.ff&&UI.form){UI.form[ds.ff]=e.target.value;return}
  if(ds.cpt&&UI.comptInv){UI.comptInv[ds.cpt]=e.target.value;return}
  if(ds.mf)return;
  if(ds.tpl){UI.msg=fillTplKeep(TPL[e.target.value]||'');render();return}
  if(ds.bk&&UI.bul){const[i,k]=ds.bk.split(':');UI.bul.blocs[+i][k]=e.target.value;return}
  if(ds.bulf&&UI.bul){UI.bul[ds.bulf]=e.target.value;if(ds.bulf==='date')render();return}
  if(ds.bind==='aud'||ds.bind==='canal')UI.sent={};
  if(ds.logo){logoUpload(e.target.files[0]);return}if(ds.color){saveConfig({...cfg(),couleur:e.target.value});return}if(ds.bind){UI[ds.bind]=e.target.value;render()}else if(ds.roleUid)setRole(ds.roleUid,e.target.value)});
document.addEventListener('submit',e=>{const id=e.target.id;if(id==='chatForm'){e.preventDefault();sendChat()}else if(id==='aiForm'){e.preventDefault();aiSearch()}else if(id==='aiChatForm'){e.preventDefault();aiAsk()}});
document.addEventListener('change',e=>{const t=e.target,ds=t.dataset||{};
  if(ds.mf){UI.mf[ds.mf]=t.value;render();return}
  if(ds.crf){UI.crF[ds.crf]=t.value;render();return}
  if(ds.site!==undefined&&t.tagName==='SELECT'){UI.site=t.value;try{localStorage.setItem('emt_site',t.value)}catch(x){}render();return}
  if(ds.lang){setLang(t.value);render();return}
  if(ds.fk||ds.ff){if(t.tagName==='SELECT')render();return}
  if(ds.pk||ds.pe||ds.pf||ds.lk||ds.lf){if(t.tagName==='SELECT'||t.type==='date'||t.type==='time')render();return}
  if(ds.actChange==='fromModel'&&t.value!==''){const m=(cfg().planModeles||[])[+t.value];if(m){UI.plan=newPlan(m);render()}return}
  if(ds.cpt)return;
  if(t.id==='photoIn'&&t.files.length){addPhotos([...t.files]);t.value='';return}
  if(t.id==='restoreIn'&&t.files[0]){restore(t.files[0]);t.value=''}});
let dragI=null;
document.addEventListener('dragstart',e=>{const h=e.target.closest&&e.target.closest('.hdl');if(h){dragI=+h.dataset.i;try{e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(dragI))}catch(x){}}});
document.addEventListener('dragover',e=>{if(dragI!==null&&e.target.closest&&e.target.closest('.blk')){e.preventDefault();document.querySelectorAll('.blk').forEach(b=>b.classList.remove('over'));e.target.closest('.blk').classList.add('over')}});
document.addEventListener('drop',e=>{const b=e.target.closest&&e.target.closest('.blk');if(dragI!==null&&b&&UI.bul){e.preventDefault();const to=+b.dataset.i,arr=UI.bul.blocs,[x]=arr.splice(dragI,1);arr.splice(to,0,x);dragI=null;render()}});
document.addEventListener('dragend',()=>{dragI=null;document.querySelectorAll('.blk.over').forEach(b=>b.classList.remove('over'))});
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal()});
window.addEventListener('hashchange',()=>{if(ckHash()){render();return}$('#side').classList.remove('open');$('#scrim').classList.remove('open');render();window.scrollTo(0,0)});
ckHash();

/* ---------- rendu ---------- */
const VIEWS={projets:vProjets,monespace:vMonEspace,album:vAlbum,inventaire:vInventaire,evenements:vEvenements,formulaires:vFormulaires,rdv:vRdv,mediatheque:vMedia,aide:vAide,culte:vCulte,dons:vDons,communication:vCommunication,dashboard:vDashboard,membres:vMembres,groupes:vGroupes,calendrier:vCalendrier,presences:vPresences,suivis:vSuivis,finances:vFinances,rapports:vRapports,parametres:vParametres};
function render(){
  const r=route(),c=cfg();
  updateRole();applyTheme();ckPending();setTimeout(autoBackup,1500);setTimeout(loadAutoBk,50);
  $('#nav').innerHTML=NAV.filter(([k])=>allowed(k)&&(k!=='monespace'||ROLE==='fidele'||(ME&&ME.memberId))).map(([k,l])=>`<a href="#${k}" class="${k===r?'on':''}"><svg viewBox="0 0 24 24">${IC[k]}</svg>${l}</a>`).join('');
  $('#title').textContent=(NAV.find(n=>n[0]===r)||[])[1];
  $('#cname').textContent=c.nom;$('#cpast').innerHTML=c.pasteur?esc(c.titrePasteur||'Visionnaire')+' :<br><b>Pasteur '+esc(c.pasteur)+'</b>':'';if($('#logo img'))document.documentElement.style.setProperty('--wm',`url("${$('#logo img').src}")`);
  document.title=(c.sigle||'EMT')+' – Gestion de l\'église';
  const ae=document.activeElement,fid=ae&&ae.id&&$('#view').contains(ae)?ae.id:null,pos=fid&&ae.selectionStart;
  $('#view').innerHTML=withSite(()=>VIEWS[r]());$('#siteBar').innerHTML=siteBar();
  if(fid){const el=document.getElementById(fid);if(el){el.focus();try{el.setSelectionRange(pos,pos)}catch(e){}}}
  $('#who').innerHTML=`<img src="${esc(ME?ME.avatarUrl:'')}" alt="" style="${ME?'':'display:none'}"><div class="grow"><div style="font-weight:600">${esc(ME&&ME.name||(mode==='local'?'Démonstration':'Connecté'))}</div><div class="muted">${esc((ROLES[ROLE]||{}).l||'')}</div></div><button class="btn sm" data-act="lock" title="Se déconnecter">Sortir</button>`;
  if(r==='parametres'||r==='communication')fillNames();
  const cb=document.getElementById('chatBox');if(cb)cb.scrollTop=cb.scrollHeight;
}
applyTheme(getTheme());
render();
(async()=>{
  if(!window.claude||!window.claude.use){mode='local';setBanner("Mode démonstration : les données saisies ne seront pas conservées.",'warn');loginScreen('demo');return}
  try{db=await window.claude.use('db')}catch(e){db=null}
  try{USER=await window.claude.use('user')}catch(e){USER=null}
  try{ME=USER?await USER.me():null}catch(e){ME=null}
  if(!db){mode='local';setBanner("Connexion à la base indisponible (connectez-vous à Claude) : les données saisies ne seront pas conservées.",'warn');loginScreen('demo');render();return}
  mode='db';subscribe();updateRole();render();
  if(window.EMT_STANDALONE){await(window.EMT_READY?window.EMT_READY():0);render();unlock()}
  else if(ME&&ME.id){
    AUTH.canPin=true;
    try{const sn=await pinDoc().get();AUTH.hash=sn.exists?(sn.data().pinHash||null):null}catch(e){}
    let fresh=false;try{fresh=Date.now()-(+sessionStorage.getItem('emt_unlock')||0)<15*60*1000}catch(e){}
    if(fresh&&AUTH.hash)unlock();else loginScreen(AUTH.hash?'pin':'create');
  }else loginScreen('enter');
})();
