// ═════════ 積點樂園（國小版／國中版共用程式）═════════
// 由 es/index.html 或 jh/index.html 設定 window.EDITION 後載入
const ED=(window.EDITION==="es")?"es":"jh";
const EDN={
  es:{name:"國小版",who:"弟弟點數",p:"弟",lv:[4,5,6],def:4,scope:"小四～小六的英文、數學"},
  jh:{name:"國中版",who:"柚子點數",p:"柚",lv:[7,8,9],def:7,scope:"國一～國三的英文、數學、特訓區與社會複習"}
}[ED];
const BASE="../";           // 題庫放在上一層資料夾，兩版共用
const RATE=5;              // 5 點 = 1 分鐘 3C 時間
document.body.insertAdjacentHTML("afterbegin",`
<header><div class="hbar">
  <div class="logo">🏆 積點樂園</div>
  <span class="local ed">${EDN.name}</span>
  <div class="spacer"></div>
  <button class="gear" id="gear" aria-label="設定">⚙️</button>
</div>
<div class="pbar">
  <button class="pts act ${ED==="jh"?"yz":""}" id="ptsBtn" aria-label="點數紀錄"><span class="p">${EDN.p}</span><span class="pl">${EDN.who}</span><b id="pv">0</b></button>
  <button class="rdm" id="rdmBtn">🎁 兌換 3C 時間</button>
</div></header>

<main class="wrap" id="app"></main>

<div class="scrim" id="scrim"></div>
<div class="sheet" id="sheet">
  <div class="grab"></div>
  <div class="sw" id="sw"></div>
  <div class="spos" id="sipa"></div>
  <div class="szh" id="szh"></div>
  <div class="strbox" id="strbox"><div class="sen" id="sen"></div><button class="trbtn" id="sTr">🈶 看整句翻譯</button><div class="szh2" id="str"></div></div>
  <div class="sbtns">
    <button class="sbtn pri" id="sSay">🔊 發音</button>
    <button class="sbtn" id="sSlow">🐢 慢速</button>
    <button class="sbtn" id="sSent">📢 唸這句</button>
  </div>
</div>
<div class="modal" id="modal"><div class="mbox">
  <h3>設定</h3>
  <div class="mset">
    <div class="mline"><b>題庫</b><span id="cinfo">—</span></div>
    <button class="mbtn" id="mUpd">🔄 檢查題庫更新</button>
    <label class="mbtn">📥 匯入題庫檔（.json）<input type="file" id="mImp" accept=".json,application/json" hidden></label>
    <button class="mbtn" id="mClrImp">🗑 移除匯入的題目</button>
    <div class="mmsg" id="mmsg"></div>
  </div>
  <div class="mpts"><button id="mHist">📜 點數紀錄</button><button id="rz">點數歸零</button></div>
  <div class="mpts"><button id="mExp">📤 匯出紀錄</button><button id="mImpR">📥 匯入紀錄</button></div>
  <div id="xbox"></div>
  <a class="mbtn" id="mEd" href="../?pick=1" style="margin-bottom:12px">🔀 切換到${ED==="es"?"國中版":"國小版"}</a>
  <p>${EDN.name}：${EDN.scope}。點數只算在「${EDN.who}」。<br>點數與作答紀錄只存在這台裝置中，清除後無法復原。</p>
  <div class="mrow"><button id="mClose">關閉</button><button class="danger" id="mReset">清除全部紀錄</button></div>
</div></div>
<div class="toast" id="toast"></div>
<div class="kp" id="kp"><div class="kpg">
  <button data-k="7">7</button><button data-k="8">8</button><button data-k="9">9</button><button class="fn" data-k="bs">⌫</button>
  <button data-k="4">4</button><button data-k="5">5</button><button data-k="6">6</button><button class="fn" data-k="/">分數 /</button>
  <button data-k="1">1</button><button data-k="2">2</button><button data-k="3">3</button><button class="fn" data-k="-">負 −</button>
  <button data-k="0">0</button><button class="fn" data-k=".">.</button><button class="fn" data-k="又">又</button><button class="go" data-k="ok">確定</button>
</div></div>

`);

let PASSAGES=[], DICT={}, CONTENT={version:0,updated:""};
const IMP_KEY="eng-points-imported-v1";
function getImported(){try{return JSON.parse(localStorage.getItem(IMP_KEY)||"null")}catch(e){return null}}
function validate(c){
  if(!c||!Array.isArray(c.passages)) throw new Error("檔案中找不到 passages 陣列");
  c.passages.forEach((p,i)=>{
    const tag=`第 ${i+1} 篇（${p.id||"無 id"}）`;
    if(!p.id||!p.title||!p.text||!p.level) throw new Error(tag+"缺少 id / title / text / level");
    if(![4,5,6,7,8,9].includes(+p.level)) throw new Error(tag+"的 level 必須是 4～9（4＝小四…9＝國三）");
    const blanks=(p.text.match(/\{[^}]+\}/g)||[]).length;
    if(blanks!==(p.cloze||[]).length) throw new Error(`${tag}：文中 {} 挖空 ${blanks} 個，但 cloze 有 ${(p.cloze||[]).length} 題`);
    (p.qs||[]).forEach(q=>{if(!q.q||!Array.isArray(q.opts)||q.opts.length<2) throw new Error(tag+"有題目格式錯誤")});
    p.level=+p.level;
  });
  return c;
}
let MATH=[], MATHV=0, MIMP=0, SOC={version:0,units:[]};
const MIMP_KEY="eng-points-imported-math-v1";
function applyMath(m){
  let imp=null; try{imp=JSON.parse(localStorage.getItem(MIMP_KEY)||"null")}catch(e){}
  const map=new Map((m.units||[]).map(u=>[u.id,u])); MIMP=0;
  if(imp) imp.units.forEach(u=>{map.set(u.id,u);MIMP++});
  MATH=[...map.values()]; MATHV=m.version||0;
}
function validateMath(c){
  c.units.forEach((u,i)=>{
    const tag=`數學第 ${i+1} 單元（${u.id||"無 id"}）`;
    if(!u.id||!u.title||![4,5,6,7,8,9].includes(+u.level)||!Array.isArray(u.qs)) throw new Error(tag+"缺少 id / title / level(4～9) / qs");
    u.level=+u.level;
    u.qs.forEach((q,j)=>{
      if(q.t==="num"){ if(!q.q||!parseNum(String(q.ans))) throw new Error(`${tag} 第 ${j+1} 題的 ans 格式無法辨識`); }
      else if(!q.q||!Array.isArray(q.opts)||q.opts.length<2) throw new Error(`${tag} 第 ${j+1} 題格式錯誤`);
    });
  });
  return c;
}
function applyContent(base){
  const imp=getImported();
  const map=new Map(); (base.passages||[]).forEach(p=>map.set(p.id,p));
  let impN=0; if(imp){ imp.passages.forEach(p=>{map.set(p.id,p); impN++;}); }
  PASSAGES=[...map.values()];
  DICT=Object.assign({},base.dict||{},imp&&imp.dict||{});
  CONTENT={version:base.version||0,updated:base.updated||"",impN};
}
async function loadContent(){
  let base=null;
  try{ const r=await fetch(BASE+"content.json?t="+Date.now(),{cache:"no-store"}); if(r.ok) base=await r.json(); }catch(e){}
  if(!base){ try{ const r=await fetch(BASE+"content.json"); if(r.ok) base=await r.json(); }catch(e){} }
  if(!base) base={version:0,passages:[],dict:{}};
  applyContent(base);
  let m=null;
  try{ const r=await fetch(BASE+"math.json?t="+Date.now(),{cache:"no-store"}); if(r.ok) m=await r.json(); }catch(e){}
  if(!m){ try{ const r=await fetch(BASE+"math.json"); if(r.ok) m=await r.json(); }catch(e){} }
  applyMath(m||{version:0,units:[]});
  PASSAGES=PASSAGES.filter(p=>EDN.lv.includes(p.level));
  MATH=MATH.filter(u=>EDN.lv.includes(u.level));
  if(ED==="jh"){
    let so=null;
    try{ const r=await fetch(BASE+"social.json?t="+Date.now(),{cache:"no-store"}); if(r.ok) so=await r.json(); }catch(e){}
    if(!so){ try{ const r=await fetch(BASE+"social.json"); if(r.ok) so=await r.json(); }catch(e){} }
    SOC=so||{version:0,units:[]};
  }
  return base;
}


// ───────── state ─────────
const OLD_KEY="eng-points-reading-v1";        // 拆版前（兩人共用）的舊資料
const KEY="eng-points-"+ED+"-v1";
let S={pts:0,log:[],done:{},level:EDN.def,seen:[]};
try{const raw=localStorage.getItem(KEY); if(raw) S=Object.assign(S,JSON.parse(raw)); else migrateOld();}catch(e){}
if(typeof S.pts!=="number") S.pts=0;
if(!Array.isArray(S.log)) S.log=[];
if(!EDN.lv.includes(S.level)) S.level=EDN.def;
if(ED==="es"&&(S.subj==="drill"||S.subj==="soc")) S.subj="en";
// 第一次開啟新版：從舊的共用資料中，拿出屬於這一版的點數與作答紀錄（舊資料保留不刪）
function migrateOld(){
  let o=null; try{o=JSON.parse(localStorage.getItem(OLD_KEY)||"null")}catch(e){}
  if(!o) return;
  let pts=o.pts;
  if(!pts){ pts={didi:0,yuzu:o.points||0}; if(!o.fix1&&(o.points||0)>=350){ pts.yuzu-=350; pts.didi+=350; } }
  const mine=id=>{const m=/^[gm](\d)-/.exec(id); if(!m) return ED==="jh"; return EDN.lv.includes(+m[1]);};
  const pick=obj=>{const r={}; Object.keys(obj||{}).forEach(k=>{if(mine(k)) r[k]=obj[k]}); return r;};
  S.done=pick(o.done); S.math=pick(o.math);
  if(ED==="jh"&&o.drill) S.drill=o.drill;
  ["seen","mseen","cver","mver","look","dtopic","dmode"].forEach(k=>{if(o[k]!==undefined) S[k]=o[k]});
  if(o.subj&&(ED==="jh"||o.subj!=="drill")) S.subj=o.subj;
  if(EDN.lv.includes(o.level)) S.level=o.level;
  S.pts=Math.max(0,ED==="es"?pts.didi:pts.yuzu)||0;
  S.log=[{t:Date.now(),n:S.pts,r:"從拆版前的舊紀錄轉入",k:"in",b:S.pts}];
  S.migrated=Date.now();
  try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function rec(pid){return S.done[pid]||(S.done[pid]={qs:{},cl:{},listened:false,words:[]})}
const $=s=>document.querySelector(s);
function esc(s){return s.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}

function updatePills(){ const v=$("#pv"); if(v) v.textContent=S.pts; }
// 目前在做哪一份練習（寫進點數紀錄）
function ctxLabel(){
  if(scur) return "社會｜"+scur.title;
  if(qz) return "社會｜"+(qz.mode==="mock"?"段考模擬考":"錯題本");
  if(dcur) return "特訓｜"+TOPICS[dcur.tp].t;
  if(mcur) return "數學｜"+mcur.title;
  if(cur) return "英文｜"+cur.title;
  return "";
}
function logPush(n,r,k){ S.log.push({t:Date.now(),n,r,k,b:S.pts}); if(S.log.length>5000) S.log.splice(0,S.log.length-5000); }
function toast(msg,ms){const t=$("#toast"); t.textContent=msg; t.classList.add("on"); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove("on"),ms||1600);}
function addPoints(n,msg){
  if(!n){ toast(msg,1800); return; }
  S.pts+=n; const c=ctxLabel(), m=(msg&&msg!=="答對了！")?msg.replace(/！$/,""):"";
  logPush(n,(c||"練習")+(m?"・"+m:""),"earn"); save(); updatePills();
  const p=$("#ptsBtn"); p.classList.remove("bump"); void p.offsetWidth; p.classList.add("bump");
  toast(`+${n} ${EDN.who}　${msg||""}`,1500);
}
updatePills();

// seeded shuffle so option order stays stable for each question
function seeded(str){let h=2166136261;for(const c of str){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return()=>{h^=h<<13;h^=h>>>17;h^=h<<5;return((h>>>0)%10000)/10000}}
function order(n,seed){const r=seeded(seed),a=[...Array(n).keys()];for(let i=n-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

// ───────── text parsing ─────────
const LV={4:{n:"小四",d:"入門"},5:{n:"小五",d:"初級"},6:{n:"小六",d:"銜接"},7:{n:"國一",d:"基礎"},8:{n:"國二",d:"進階"},9:{n:"國三",d:"會考"}};
function splitSents(par){
  const out=[]; let start=0;
  const re=/[.!?]+["”]?(\s+|$)/g; let m;
  while((m=re.exec(par))){
    const end=m.index+m[0].length;
    const seg=par.slice(start,end);
    if(/\b(Mr|Mrs|Ms|Dr)\.\s*$/.test(seg)) continue;
    const next=par.slice(end);
    if(next && /^[a-z]/.test(next)) continue;
    out.push(seg); start=end;
  }
  if(start<par.length && par.slice(start).trim()) out.push(par.slice(start));
  // 合併「Amy asks.」這類說話者短句
  const merged=[];
  for(const s of out){ if(merged.length && /^\s*[A-Z][\w']*( [A-Z][\w']*)? (asks|says|said|asked|answered)\.\s*$/.test(s)) merged[merged.length-1]+=s; else merged.push(s); }
  return merged;
}
function parse(p){
  // → paragraphs[ sentences[ {text, tokens:[{t:'w'|'x', s, blank}], si} ] ]
  let bi=0, si=0;
  return p.text.split("\n").map(par=>{
    const sents=splitSents(par);
    return sents.map(raw=>{
      const tokens=[]; const re=/\{([^}]+)\}|([A-Za-z]+(?:['’-][A-Za-z]+)*)|([^A-Za-z{]+)/g; let m;
      while((m=re.exec(raw))){
        if(m[1]) tokens.push({t:"w",s:m[1],blank:bi++});
        else if(m[2]) tokens.push({t:"w",s:m[2]});
        else tokens.push({t:"x",s:m[3]});
      }
      return {text:raw.replace(/[{}]/g,"").trim(),tokens,si:si++};
    });
  });
}
function trOf(si){return cur&&Array.isArray(cur.tr)&&cur.tr[si]||null}
function wordify(s){ // 把文字中的英文單字包成可點的 span
  return String(s).split(/([A-Za-z]+(?:['’-][A-Za-z]+)*)/).map((x,i)=>i%2?`<span class="w" data-w="${esc(x)}">${esc(x)}</span>`:esc(x)).join("");
}
function lookup(w){
  let k=w.toLowerCase().replace(/’/g,"'");
  const D=Object.assign({},DICT,(cur&&cur.dict)||{});
  if(D[k]) return {k,v:D[k]};
  const k2=k.replace(/'s$/,"");
  if(D[k2]) return {k:k2,v:D[k2]+(k2!==k?"（此處為所有格 's：…的）":"")};
  if(false) return {k:k2,v:DICT[k2]+(k2!==k?"（此處為所有格 's：…的）":"")};
  return {k,v:"（查無翻譯）"};
}

// ───────── speech ─────────
const synth=window.speechSynthesis;
let voice=null;
function pickVoice(){
  if(!synth) return;
  const vs=synth.getVoices(); if(!vs.length) return;
  const pref=["Samantha","Google US English","Microsoft Aria","Microsoft Jenny","Karen","Daniel"];
  voice=pref.map(n=>vs.find(v=>v.name.includes(n)&&/^en/i.test(v.lang))).find(Boolean)
     ||vs.find(v=>/^en[-_]US/i.test(v.lang))||vs.find(v=>/^en/i.test(v.lang))||null;
}
if(synth){pickVoice(); synth.onvoiceschanged=pickVoice;}
let rate=parseFloat(S.rate||0.85);
let reading={on:false,idx:0,gen:0,sents:[],pid:null};
function utter(text,r){const u=new SpeechSynthesisUtterance(text);u.lang="en-US";if(voice)u.voice=voice;u.rate=r;return u}
function sayOnce(text,r){
  if(!synth){showWarn();return}
  stopReading(true); synth.cancel(); synth.speak(utter(text,r));
}
function showWarn(){const w=$("#warn"); if(w) w.style.display="block"}

function readFrom(i){
  if(!synth){showWarn();return}
  const g=++reading.gen; reading.on=true; reading.idx=i; synth.cancel(); updatePlayer();
  const step=()=>{
    if(g!==reading.gen) return;
    clearSpeakMarks();
    if(reading.idx>=reading.sents.length){
      reading.on=false; reading.idx=0; updatePlayer();
      const r=rec(reading.pid); if(!r.listened){r.listened=true; save(); addPoints(5,"聽完全文");}
      return;
    }
    const s=reading.sents[reading.idx];
    s.el.classList.add("cur");
    if(!$("#text").classList.contains("hide")) s.el.scrollIntoView({block:"center",behavior:"smooth"});
    const u=utter(s.text,rate);
    u.onboundary=e=>{ if(g!==reading.gen||e.name&&e.name!=="word") return;
      document.querySelectorAll(".w.speak").forEach(x=>x.classList.remove("speak"));
      const hit=s.spans.find(o=>e.charIndex>=o.a&&e.charIndex<o.b); if(hit) hit.el.classList.add("speak"); };
    u.onend=()=>{ if(g!==reading.gen) return; reading.idx++; updateProg(); step(); };
    u.onerror=u.onend;
    synth.speak(u);
  };
  updateProg(); step();
}
function stopReading(keepIdx){
  reading.gen++; reading.on=false; if(!keepIdx) reading.idx=0;
  if(synth) synth.cancel(); clearSpeakMarks(); updatePlayer(); updateProg();
}
function clearSpeakMarks(){document.querySelectorAll(".sent.cur,.w.speak").forEach(x=>x.classList.remove("cur","speak"))}
function updatePlayer(){const b=$("#playBtn"); if(!b) return;
  b.innerHTML=reading.on?"⏸ 暫停":(reading.idx>0?"▶ 繼續播放":"▶ 播放全文");}
function updateProg(){const i=$("#prog i"); if(i&&reading.sents.length) i.style.width=(reading.idx/reading.sents.length*100)+"%"}

// ───────── word sheet ─────────
let sheetCtx=null;
function openSheet(word,sentText,el,trText){
  document.querySelectorAll(".w.sel").forEach(x=>x.classList.remove("sel"));
  if(el) el.classList.add("sel");
  const {k,v}=lookup(word); const m=v.match(/^([a-z./]+)\s+(.*)$/i);
  $("#sw").textContent=k; $("#sipa").textContent=m?m[1]:""; $("#szh").textContent=m?m[2]:v;
  sheetCtx={word:k,sent:sentText};
  $("#sSent").style.display=sentText?"":"none";
  $("#strbox").style.display=trText?"":"none";
  $("#sen").textContent=sentText||""; $("#str").textContent=trText||""; $("#str").classList.remove("on"); $("#sTr").style.display="";
  $("#scrim").classList.add("on"); $("#sheet").classList.add("on");
  sayOnce(k,0.8);
  if(cur){const r=rec(cur.id); if(!r.words.includes(k)){r.words.push(k); save(); renderVocab();}}
}
function closeSheet(){$("#scrim").classList.remove("on");$("#sheet").classList.remove("on");document.querySelectorAll(".w.sel").forEach(x=>x.classList.remove("sel"))}
$("#scrim").onclick=closeSheet;
$("#sSay").onclick=()=>sheetCtx&&sayOnce(sheetCtx.word,0.8);
$("#sSlow").onclick=()=>sheetCtx&&sayOnce(sheetCtx.word,0.45);
$("#sSent").onclick=()=>sheetCtx&&sayOnce(sheetCtx.sent,rate);
$("#sTr").onclick=()=>{$("#str").classList.add("on");$("#sTr").style.display="none";};

// settings
function cinfo(){$("#cinfo").textContent=`英文 v${CONTENT.version}・${PASSAGES.length} 篇｜數學 v${MATHV}・${MATH.length} 單元`+(ED==="jh"?`｜社會 v${SOC.version}・${SOC.units.length} 單元`:"")+((CONTENT.impN||MIMP)?"（含匯入）":"");}
$("#gear").onclick=()=>{cinfo();$("#mmsg").textContent="";$("#modal").classList.add("on")};
$("#mUpd").onclick=async()=>{const before=PASSAGES.length,v=CONTENT.version;$("#mmsg").textContent="檢查中…";
  await loadContent(); cinfo();
  $("#mmsg").textContent=CONTENT.version>v?`已更新到 v${CONTENT.version}，新增 ${PASSAGES.length-before} 篇`:(navigator.onLine===false?"目前離線，使用已下載的題庫":"已是最新題庫");
  cur?openPassage(cur.id,tab):home();};
$("#mImp").onchange=e=>{const f=e.target.files[0]; if(!f) return; const rd=new FileReader();
  rd.onload=()=>{try{const raw=JSON.parse(rd.result);
      if(raw&&Array.isArray(raw.units)){ const c=validateMath(raw); let old=null; try{old=JSON.parse(localStorage.getItem(MIMP_KEY)||"null")}catch(e){}
        const m=new Map(((old&&old.units)||[]).map(u=>[u.id,u])); c.units.forEach(u=>m.set(u.id,u));
        localStorage.setItem(MIMP_KEY,JSON.stringify({units:[...m.values()]}));
        loadContent().then(()=>{cinfo();$("#mmsg").style.color="var(--ok)";$("#mmsg").textContent=`數學題匯入成功，目前共 ${MATH.length} 單元`;S.subj="math";save();home();}); return; }
      const c=validate(raw); const old=getImported();
      if(old){const m=new Map(old.passages.map(p=>[p.id,p])); c.passages.forEach(p=>m.set(p.id,p)); c.passages=[...m.values()]; c.dict=Object.assign({},old.dict||{},c.dict||{});}
      localStorage.setItem(IMP_KEY,JSON.stringify({passages:c.passages,dict:c.dict||{}}));
      loadContent().then(()=>{cinfo();$("#mmsg").style.color="var(--ok)";$("#mmsg").textContent=`匯入成功，目前共 ${PASSAGES.length} 篇`;home();});
    }catch(err){$("#mmsg").style.color="var(--bad)";$("#mmsg").textContent="匯入失敗："+err.message}};
  rd.readAsText(f); e.target.value="";};
$("#mClrImp").onclick=()=>{try{localStorage.removeItem(IMP_KEY);localStorage.removeItem(MIMP_KEY)}catch(e){} loadContent().then(()=>{cinfo();$("#mmsg").textContent="已移除匯入的題目";home();});};
$("#mClose").onclick=()=>$("#modal").classList.remove("on");
function confirm2(btn,label,fn){ if(btn.dataset.armed){fn(); btn.dataset.armed=""; btn.textContent=label; btn.classList.remove("warn2"); return;}
  btn.dataset.armed="1"; btn.textContent="再按一次確認"; btn.classList.add("warn2");
  setTimeout(()=>{btn.dataset.armed=""; btn.textContent=label; btn.classList.remove("warn2");},3000); }
$("#rz").onclick=()=>confirm2($("#rz"),"點數歸零",()=>{const n=S.pts; if(n){S.pts=0; logPush(-n,"設定：點數歸零","reset");} save();updatePills();$("#mmsg").style.color="var(--ok)";$("#mmsg").textContent=`${EDN.who}已歸零`;});
// ── 匯出／匯入紀錄：iPhone/iPad 的「主畫面 App」和 Safari 儲存空間是分開的，用一段代碼搬資料 ──
const XKEYS=[OLD_KEY,"eng-points-es-v1","eng-points-jh-v1"];
function xEncode(){const o={app:"jifen",v:1,t:Date.now()}; XKEYS.forEach(k=>{try{const v=localStorage.getItem(k); if(v) o[k]=JSON.parse(v);}catch(e){}});
  return "JIFEN1:"+btoa(unescape(encodeURIComponent(JSON.stringify(o))));}
function xDecode(t){t=(t||"").replace(/\s+/g,""); const i=t.indexOf("JIFEN1:"); if(i<0) throw new Error("找不到代碼開頭 JIFEN1:");
  const o=JSON.parse(decodeURIComponent(escape(atob(t.slice(i+7))))); if(!o||o.app!=="jifen") throw new Error("代碼格式不對"); return o;}
function xPts(o,ed){const k="eng-points-"+ed+"-v1"; if(o[k]&&typeof o[k].pts==="number") return o[k].pts;
  const old=o[OLD_KEY]; if(!old) return null; let p=old.pts; if(!p){p={didi:0,yuzu:old.points||0}; if(!old.fix1&&(old.points||0)>=350){p.yuzu-=350;p.didi+=350;}}
  return ed==="es"?p.didi:p.yuzu;}
$("#mExp").onclick=()=>{const code=xEncode();
  $("#xbox").innerHTML=`<div class="xb"><b>📤 匯出代碼</b><small>已含國小版、國中版與舊紀錄。到另一個地方（例如主畫面的 App）→ ⚙️ →「📥 匯入紀錄」貼上。</small><textarea id="xta" readonly>${code}</textarea><button id="xcp">📋 複製代碼</button><span id="xmsg"></span></div>`;
  const ta=$("#xta"); const cp=()=>{ta.focus();ta.select();ta.setSelectionRange(0,ta.value.length);
    (navigator.clipboard?navigator.clipboard.writeText(code):Promise.reject()).then(()=>{$("#xmsg").textContent="✅ 已複製"}).catch(()=>{try{document.execCommand("copy");$("#xmsg").textContent="✅ 已複製"}catch(e){$("#xmsg").textContent="請長按上方代碼 → 全選 → 拷貝"}});};
  $("#xcp").onclick=cp; cp();};
$("#mImpR").onclick=()=>{
  $("#xbox").innerHTML=`<div class="xb"><b>📥 匯入紀錄</b><small>把匯出的代碼貼在下面。匯入後，這台裝置目前的${EDN.who}紀錄會被取代。</small><textarea id="xta" placeholder="長按 → 貼上（代碼以 JIFEN1: 開頭）"></textarea><div id="xpv"></div><button id="xgo" disabled>確認匯入</button></div>`;
  const ta=$("#xta"), go=$("#xgo"); let o=null;
  ta.oninput=()=>{o=null; go.disabled=true; if(!ta.value.trim()){$("#xpv").textContent="";return;}
    try{o=xDecode(ta.value); const es=xPts(o,"es"), jh=xPts(o,"jh");
      $("#xpv").innerHTML=`代碼內容：弟弟點數 <b>${es??"—"}</b>、柚子點數 <b>${jh??"—"}</b><br>這是${EDN.name}，匯入後${EDN.who}會變成 <b>${xPts(o,ED)??0}</b> 點。`; go.disabled=false;}
    catch(e){$("#xpv").innerHTML=`<span class="badc">代碼無法辨識：${esc(e.message)}</span>`;}};
  go.onclick=()=>confirm2(go,"確認匯入",()=>{ if(!o) return;
    XKEYS.forEach(k=>{ if(o[k]) localStorage.setItem(k,JSON.stringify(o[k])); });
    if(!o[KEY]) localStorage.removeItem(KEY);   // 只有舊紀錄 → 重新開啟時自動轉入
    location.reload(); });
};
$("#mHist").onclick=()=>{$("#modal").classList.remove("on"); openWallet("hist");};
$("#mEd").onclick=()=>{try{localStorage.removeItem("eng-edition")}catch(e){}};
$("#mReset").onclick=()=>confirm2($("#mReset"),"清除全部紀錄",()=>{S={pts:0,log:[],done:{},level:S.level,cver:S.cver,mver:S.mver,seen:S.seen,mseen:S.mseen};save();updatePills();$("#modal").classList.remove("on");home()});

// ───────── views ─────────
let cur=null, tab="read";
function stats(p){
  const r=S.done[p.id]||{qs:{},cl:{}};
  const qd=Object.keys(r.qs).length, qok=Object.values(r.qs).filter(x=>x.ok).length;
  const cd=Object.keys(r.cl).length, cok=Object.values(r.cl).filter(x=>x.ok).length;
  const words=p.text.replace(/[{}]/g,"").match(/[A-Za-z]+/g).length;
  return {r,qd,qok,cd,cok,words};
}
function subjBar(){const s=S.subj||"en";const L=[["en","📖 英文"],["math","🔢 數學"]].concat(ED==="jh"?[["drill","⚡ 特訓"],["soc","🌏 社會"]]:[]);
  return `<div class="subj">${L.map(([k,t])=>`<button class="sj ${s===k?"on":""}" data-s="${k}">${t}</button>`).join("")}</div>`}
function bindSubj(){document.querySelectorAll(".sj").forEach(b=>b.onclick=()=>{S.subj=b.dataset.s;save();home()})}
function home(){
  stopReading(); closeSheet(); kpClose(); cur=null; mcur=null; location.hash="";
  dcur=null; scur=null; qz=null; wv=null;
  if(S.subj==="math") return mathHome();
  if(S.subj==="drill"&&ED==="jh") return drillHome();
  if(S.subj==="soc"&&ED==="jh") return socHome();
  const list=PASSAGES.filter(p=>p.level===S.level);
  $("#app").innerHTML=`
  ${subjBar()}
  <section class="hero"><h1>英文短文閱讀</h1>
  <p>${ED==="es"?"小四到小六共三級，從生活短文開始。":"國一到國三共三級，依會考程度設計。"}每篇可整篇聽讀、點單字看翻譯與發音，並完成文意理解與克漏字賺積點。</p></section>
  <div class="levels">${EDN.lv.map(l=>`<button class="lv ${l===S.level?"on":""}" data-l="${l}"><b>${LV[l].n}</b><small>${LV[l].d}</small></button>`).join("")}</div>
  <div class="plist">${list.map((p,i)=>{const s=stats(p);return `
    <button class="pcard" data-id="${p.id}">
      <div class="pnum">${i+1}</div>
      <div class="pinfo"><div class="t">${esc(p.title)}${(S.seen||[]).includes(p.id)?"":'<span class="new">NEW</span>'}</div><div class="z">${p.zh}・約 ${s.words} 字</div>
        <div class="badges">
          <span class="bdg ${s.r.listened?"done":""}">🎧 ${s.r.listened?"已聽完":"聽讀"}</span>
          <span class="bdg ${s.qd===p.qs.length?"done":""}">✅ 理解 ${s.qok}/${p.qs.length}</span>
          <span class="bdg ${s.cd===p.cloze.length?"done":""}">✏️ 克漏字 ${s.cok}/${p.cloze.length}</span>
        </div></div>
      <div class="chev">›</div>
    </button>`}).join("")}</div>
  <p class="hint">🎯 積點規則：聽完全文 +5｜文意理解首答正確 +10｜克漏字首答正確 +5</p>`;
  document.querySelectorAll(".lv").forEach(b=>b.onclick=()=>{S.level=+b.dataset.l;save();home()});
  document.querySelectorAll(".pcard").forEach(b=>b.onclick=()=>openPassage(b.dataset.id,"read"));
  bindSubj(); window.scrollTo(0,0);
}
function openPassage(id,t){
  stopReading(); closeSheet();
  cur=PASSAGES.find(p=>p.id===id); if(!cur) return home(); tab=t||"read"; location.hash=id;
  S.seen=S.seen||[]; if(!S.seen.includes(id)){S.seen.push(id);save();}
  const s=stats(cur);
  $("#app").innerHTML=`
    <button class="back" id="back">‹ ${LV[cur.level].n}文章列表</button>
    <h2 class="ptitle">${esc(cur.title)}</h2>
    <p class="psub">${cur.zh}・${LV[cur.level].n}（${LV[cur.level].d}）・約 ${s.words} 字</p>
    <div class="tabs">
      <button class="tab ${tab==="read"?"on":""}" data-t="read">📖 閱讀聽力</button>
      <button class="tab ${tab==="qs"?"on":""}" data-t="qs">✅ 文意理解</button>
      <button class="tab ${tab==="cl"?"on":""}" data-t="cl">✏️ 克漏字</button>
    </div>
    <div id="pane"></div>`;
  $("#back").onclick=home;
  document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{stopReading();closeSheet();tab=b.dataset.t;document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("on",x===b));renderPane()});
  $("#pane").addEventListener("click",e=>{
    if(tab==="read") return;
    const w=e.target.closest(".w"); if(!w) return;
    if(w.closest(".opt")&&!S.look) return;
    e.stopPropagation(); e.preventDefault();
    const ctx=w.closest("[data-say]");
    openSheet(w.dataset.w, ctx?ctx.dataset.say:null, w, null);
  },true);
  renderPane(); window.scrollTo(0,0);
}
function renderPane(){ if(tab==="read") renderRead(); else if(tab==="qs") renderQs(); else renderCloze(); }

function renderRead(){
  const paras=parse(cur);
  $("#pane").innerHTML=`
    <div class="player">
      <button class="play" id="playBtn">▶ 播放全文</button>
      <button class="stopb" id="stopBtn">⏹</button>
      <div class="speeds">${[0.6,0.75,0.85,1].map(r=>`<button class="spd ${r===rate?"on":""}" data-r="${r}">${r}x</button>`).join("")}</div>
      <div class="toggles"><button class="tg" id="hideTg">🙈 隱藏文字（純聽力）</button><button class="tg ${S.showTr?"on":""}" id="trTg">🈶 逐句翻譯</button></div>
      <div class="prog" id="prog"><i></i></div>
    </div>
    <div class="warn" id="warn">這個環境不支援語音朗讀（常見於 App 內建瀏覽器）。請用 Android 的 Chrome 或 iPhone 的 Safari 開啟，或安裝到主畫面。</div>
    <div class="text" id="text"></div>
    <p class="hint">👆 點任一單字：看中文意思、聽發音（可慢速），還能看「整句翻譯」或唸出整句。<br>🈶 開啟「逐句翻譯」可在每句下方顯示中文。播放中會以黃色標示正在唸的句子。</p>
    <div class="vocab" id="vocab"></div>`;
  const box=$("#text"); reading.sents=[]; reading.pid=cur.id; reading.idx=0;
  paras.forEach(par=>{
    const pe=document.createElement("p");
    par.forEach(sent=>{
      const se=document.createElement("span"); se.className="sent";
      const info={text:sent.text,el:se,spans:[]}; let off=0;
      sent.tokens.forEach(tk=>{
        if(tk.t==="x"){ se.appendChild(document.createTextNode(tk.s)); off+=tk.s.length; return;}
        const w=document.createElement("span"); w.className="w"; w.textContent=tk.s;
        info.spans.push({a:off,b:off+tk.s.length,el:w}); off+=tk.s.length;
        w.onclick=e=>{e.stopPropagation(); openSheet(tk.s,sent.text,w,trOf(sent.si))};
        se.appendChild(w);
      });
      reading.sents.push(info); pe.appendChild(se);
      const z=trOf(sent.si); if(z){const ze=document.createElement("span"); ze.className="zh"; ze.textContent=z; pe.appendChild(ze);}
      pe.appendChild(document.createTextNode(" "));
    });
    box.appendChild(pe);
  });
  if(!synth) showWarn();
  if(S.showTr) box.classList.add("trmode");
  if(!cur.tr) $("#trTg").style.display="none";
  $("#trTg").onclick=e=>{S.showTr=!S.showTr; save(); box.classList.toggle("trmode",S.showTr); e.currentTarget.classList.toggle("on",S.showTr);};
  $("#playBtn").onclick=()=>{ if(reading.on) stopReading(true); else readFrom(reading.idx); };
  $("#stopBtn").onclick=()=>stopReading(false);
  document.querySelectorAll(".spd").forEach(b=>b.onclick=()=>{
    rate=+b.dataset.r; S.rate=rate; save();
    document.querySelectorAll(".spd").forEach(x=>x.classList.toggle("on",x===b));
    if(reading.on) readFrom(reading.idx);
  });
  $("#hideTg").onclick=e=>{const on=box.classList.toggle("hide"); e.currentTarget.classList.toggle("on",on);
    e.currentTarget.textContent=on?"👀 顯示文字":"🙈 隱藏文字（純聽力）";};
  renderVocab();
}
function renderVocab(){
  const v=$("#vocab"); if(!v||!cur) return;
  const ws=(S.done[cur.id]||{words:[]}).words||[];
  v.innerHTML=ws.length?`<h3>📒 本篇查過的單字（${ws.length}）</h3><div class="chips">${ws.map(w=>{const z=lookup(w).v.replace(/^[a-z./]+\s+/i,"").split(/[；（]/)[0];return `<button class="chip" data-w="${esc(w)}">${esc(w)}<span>${esc(z)}</span></button>`}).join("")}</div>`:"";
  v.querySelectorAll(".chip").forEach(c=>c.onclick=()=>openSheet(c.dataset.w,null,null));
}

const KEYS="ABCD";
function lookBar(){return `<div class="lookbar"><button class="tg ${S.look?"on":""}" id="lookTg">🔍 選項查單字：${S.look?"開":"關"}</button><span class="hint">題目裡的單字可直接點選查詢；開啟後，點選項裡的單字也只會查字、不會作答。</span></div>`}
function bindLook(fn){const b=$("#lookTg"); if(b) b.onclick=()=>{S.look=!S.look; save(); const y=window.scrollY; fn(); window.scrollTo(0,y);};}
function renderQs(){
  const r=rec(cur.id);
  const done=Object.keys(r.qs).length, ok=Object.values(r.qs).filter(x=>x.ok).length;
  let h="";
  if(done===cur.qs.length) h+=`<div class="sum"><div><div class="big">${ok} / ${cur.qs.length}</div><div class="s">文意理解完成</div></div><button id="redo">重新作答</button></div>`;
  h+=lookBar();
  cur.qs.forEach((q,qi)=>{
    const ord=order(q.opts.length,cur.id+"q"+qi), a=r.qs[qi];
    h+=`<div class="q"><div class="qh"><span class="n">${qi+1}.</span><span data-say="${esc(q.q)}">${wordify(q.q)}</span></div>`;
    ord.forEach((oi,pos)=>{
      let c=""; if(a){ if(oi===0) c="ok"; else if(oi===a.pick) c="bad"; }
      h+=`<button class="opt ${c}" data-q="${qi}" data-o="${oi}" ${a?'data-done="1"':""}><span class="k">${KEYS[pos]}</span><span data-say="${esc(q.opts[oi])}">${wordify(q.opts[oi])}</span></button>`;
    });
    if(a) h+=`<div class="exp">${a.ok?'<b class="okc">答對了！</b>':'<b class="badc">正確答案是 '+KEYS[ord.indexOf(0)]+'。</b>'} ${esc(q.exp)}</div>`;
    h+=`</div>`;
  });
  $("#pane").innerHTML=h;
  document.querySelectorAll(".opt[data-q]").forEach(b=>b.onclick=()=>{
    if(b.dataset.done) return;
    const qi=+b.dataset.q, oi=+b.dataset.o, okk=oi===0;
    r.qs[qi]={pick:oi,ok:okk}; const first=!(r.qPaid||{})[qi];
    r.qPaid=r.qPaid||{}; r.qPaid[qi]=true; save();
    if(okk&&first) addPoints(10,"答對了！");
    const y=window.scrollY; renderQs(); window.scrollTo(0,y);
  });
  const rd=$("#redo"); if(rd) rd.onclick=()=>{r.qs={};save();renderQs();window.scrollTo(0,0)};
  bindLook(renderQs);
}

let clCur=0;
function renderCloze(){
  const r=rec(cur.id); const paras=parse(cur);
  const done=Object.keys(r.cl).length, ok=Object.values(r.cl).filter(x=>x.ok).length;
  if(r.cl[clCur]) { const nx=cur.cloze.findIndex((_,i)=>!r.cl[i]); if(nx>=0) clCur=nx; }
  let h="";
  if(done===cur.cloze.length) h+=`<div class="sum"><div><div class="big">${ok} / ${cur.cloze.length}</div><div class="s">克漏字完成</div></div><button id="clListen">🔊 聽全文</button><button id="redo">重做</button></div>`;
  else h+=`<p class="hint" style="margin:0 0 10px">點選文中空格或下方題目作答。每格首答正確 +5 點。</p>`;
  h+=lookBar();
  h+=`<div class="ctext">`;
  paras.forEach(par=>{h+="<p>"; par.forEach(sent=>sent.tokens.forEach(tk=>{
    if(tk.blank!==undefined){const a=r.cl[tk.blank]; const c=a?(a.ok?"ok":"bad"):(tk.blank===clCur?"cur":"");
      h+=`<span class="blank ${c}" data-b="${tk.blank}">(${tk.blank+1}) ${a?esc(cur.cloze[tk.blank].opts[0]):"&nbsp;"}</span>`;}
    else h+=tk.t==="w"?`<span class="w" data-w="${esc(tk.s)}">${esc(tk.s)}</span>`:esc(tk.s);
  })); h+="</p>";});
  h+=`</div>`;
  cur.cloze.forEach((c,ci)=>{
    const ord=order(c.opts.length,cur.id+"c"+ci), a=r.cl[ci];
    h+=`<div class="q cq" id="cq${ci}"><div class="qh"><span class="n">(${ci+1})</span><span style="color:var(--muted);font-weight:700;font-size:14px">選出最適合的答案</span></div><div class="opts2">`;
    ord.forEach((oi,pos)=>{let cc=""; if(a){ if(oi===0) cc="ok"; else if(oi===a.pick) cc="bad"; }
      h+=`<button class="opt ${cc}" data-c="${ci}" data-o="${oi}" ${a?'data-done="1"':""}><span class="k">${KEYS[pos]}</span><span data-say="${esc(c.opts[oi])}">${wordify(c.opts[oi])}</span></button>`;});
    h+=`</div>`;
    if(a) h+=`<div class="exp">${a.ok?'<b class="okc">答對了！</b>':'<b class="badc">正確答案：'+esc(c.opts[0])+'</b>'} ${esc(c.exp)}</div>`;
    h+=`</div>`;
  });
  $("#pane").innerHTML=h;
  document.querySelectorAll(".blank").forEach(b=>b.onclick=()=>{
    clCur=+b.dataset.b; document.querySelectorAll(".blank").forEach(x=>x.classList.toggle("cur",x===b&&!x.classList.contains("ok")&&!x.classList.contains("bad")));
    const t=$("#cq"+clCur); t.scrollIntoView({block:"center",behavior:"smooth"}); t.classList.remove("flash"); void t.offsetWidth; t.classList.add("flash");
  });
  document.querySelectorAll(".opt[data-c]").forEach(b=>b.onclick=()=>{
    if(b.dataset.done) return;
    const ci=+b.dataset.c, oi=+b.dataset.o, okk=oi===0;
    r.cl[ci]={pick:oi,ok:okk}; r.cPaid=r.cPaid||{}; const first=!r.cPaid[ci]; r.cPaid[ci]=true; save();
    if(okk&&first) addPoints(5,"克漏字答對！");
    const y=window.scrollY; renderCloze(); window.scrollTo(0,y);
  });
  const rd=$("#redo"); if(rd) rd.onclick=()=>{r.cl={};clCur=0;save();renderCloze();window.scrollTo(0,0)};
  bindLook(renderCloze);
  const cl=$("#clListen"); if(cl) cl.onclick=()=>{tab="read";document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("on",x.dataset.t==="read"));renderPane();readFrom(0)};
}


// ───────── 數學 ─────────
let mcur=null, kpQ=null, kpVal="";
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b]}return a}
function parseNum(s){
  s=String(s).replace(/[−–]/g,"-").replace(/[,\s%]/g,"");
  let m;
  if((m=s.match(/^(-?)(\d+)又(\d+)\/(\d+)$/))){const w=+m[2],a=+m[3],b=+m[4]; if(!b) return null; const n=w*b+a; return {n:m[1]?-n:n,d:b,kind:"mixed",fa:a,fb:b};}
  if((m=s.match(/^(-?)(\d+)\/(\d+)$/))){const a=+m[2],b=+m[3]; if(!b) return null; return {n:m[1]?-a:a,d:b,kind:"frac",fa:a,fb:b};}
  if((m=s.match(/^(-?)(\d*)\.?(\d*)$/))&&(m[2]||m[3])){const k=m[3].length, d=10**k, n=+(m[2]||0)*d+(+(m[3]||0)); return {n:m[1]?-n:n,d,kind:"dec"};}
  return null;
}
function sameVal(a,b){return a.n*b.d===b.n*a.d}
function fmt(s){
  s=esc(String(s));
  s=s.replace(/√\{([^}]+)\}/g,'√<span class="ov">$1</span>');
  s=s.replace(/\[([^\]\/]+)\/([^\]]+)\]/g,'<span class="frac"><span>$1</span><span>$2</span></span>');
  s=s.replace(/\^\{([^}]+)\}/g,'<sup>$1</sup>').replace(/\^(−?-?[\w.]+)/g,'<sup>$1</sup>');
  s=s.replace(/_(\w)/g,'<sub>$1</sub>');
  return s;
}
function ansMarkup(a){a=String(a).replace(/^-/,"−");return a.replace(/(\d+)又(\d+)\/(\d+)/,"$1[$2/$3]").replace(/(^|[^\d\[])(\d+)\/(\d+)/,"$1[$2/$3]")}
function mrec(id){S.math=S.math||{};return S.math[id]||(S.math[id]={a:{},paid:{}})}
function mstats(u){const r=(S.math||{})[u.id]||{a:{}};const done=Object.keys(r.a).length, ok=Object.values(r.a).filter(x=>x.ok).length;return {done,ok}}
function mathHome(){
  const list=MATH.filter(u=>u.level===S.level);
  $("#app").innerHTML=`${subjBar()}
  <section class="hero"><h1>數學練習</h1>
  <p>${ED==="es"?"小四到小六":"國一到國三"}，依 108 課綱主題分單元。每單元先看重點，再做選擇題與計算題，每題附詳解。</p></section>
  <div class="levels">${EDN.lv.map(l=>`<button class="lv ${l===S.level?"on":""}" data-l="${l}"><b>${LV[l].n}</b><small>${LV[l].d}</small></button>`).join("")}</div>
  <div class="plist">${list.length?list.map((u,i)=>{const s=mstats(u);return `
    <button class="pcard" data-id="${u.id}">
      <div class="pnum" style="background:#FFF3D6;color:#B87500">${i+1}</div>
      <div class="pinfo"><div class="t">${esc(u.title)}${(S.mseen||[]).includes(u.id)?"":'<span class="new">NEW</span>'}</div><div class="z">${LV[u.level].n}・${u.qs.length} 題</div>
        <div class="badges"><span class="bdg ${s.done===u.qs.length?"done":""}">✏️ 已作答 ${s.done}/${u.qs.length}</span><span class="bdg ${s.done&&s.ok===s.done?"done":""}">✅ 答對 ${s.ok}</span></div></div>
      <div class="chev">›</div></button>`}).join(""):'<p class="hint">這個年級還沒有題目。</p>'}</div>
  <p class="hint">🎯 積點規則：每題首次作答正確 +10。計算題用下方鍵盤作答，分數用「/」，帶分數用「又」（例：2又1/3）。</p>`;
  document.querySelectorAll(".lv").forEach(b=>b.onclick=()=>{S.level=+b.dataset.l;save();home()});
  document.querySelectorAll(".pcard").forEach(b=>b.onclick=()=>openUnit(b.dataset.id));
  bindSubj(); window.scrollTo(0,0);
}
function openUnit(id){
  stopReading(); closeSheet(); kpClose();
  mcur=MATH.find(u=>u.id===id); if(!mcur) return home(); cur=null; location.hash=id;
  S.mseen=S.mseen||[]; if(!S.mseen.includes(id)){S.mseen.push(id);save();}
  renderUnit(); window.scrollTo(0,0);
}
function renderUnit(){
  const u=mcur, r=mrec(u.id), s=mstats(u);
  let h=`<button class="back" id="back">‹ ${LV[u.level].n}數學單元</button>
    <h2 class="ptitle">${esc(u.title)}</h2><p class="psub">${LV[u.level].n}（${LV[u.level].d}）・${u.qs.length} 題</p><div style="height:14px"></div>`;
  if(u.key&&u.key.length) h+=`<div class="keyc"><h3>📌 重點整理</h3><ul>${u.key.map(k=>`<li>${fmt(k)}</li>`).join("")}</ul></div>`;
  if(s.done===u.qs.length) h+=`<div class="sum"><div><div class="big">${s.ok} / ${u.qs.length}</div><div class="s">本單元完成</div></div><button id="redo">重新練習</button></div>`;
  u.qs.forEach((q,qi)=>{
    const a=r.a[qi];
    h+=`<div class="q" id="mq${qi}"><div class="qh"><span class="n">${qi+1}.</span><span>${fmt(q.q)}</span></div>`;
    if(q.t==="num"){
      const shown=a?a.v:(kpQ===qi?kpVal:"");
      h+=`<div class="nrow"><div class="nin ${a?(a.ok?"ok":"bad"):(kpQ===qi?"act":"")}" data-n="${qi}">${shown?fmt(ansMarkup(shown)):(kpQ===qi?"":'<span class="ph">點這裡作答</span>')}${!a&&kpQ===qi?'<span class="caret"></span>':""}</div>${q.unit?`<span class="nunit">${esc(q.unit)}</span>`:""}</div>
        <div class="nmsg" id="nmsg${qi}"></div>`;
      if(a) h+=`<div class="exp">${a.ok?'<b class="okc">答對了！</b>':'<b class="badc">正確答案：'+fmt(ansMarkup(q.ans))+(q.unit?" "+esc(q.unit):"")+'</b>'}<br>${fmt(q.exp)}</div>`;
    }else{
      const ord=order(q.opts.length,u.id+"m"+qi);
      ord.forEach((oi,pos)=>{let c=""; if(a){ if(oi===0) c="ok"; else if(oi===a.pick) c="bad"; }
        h+=`<button class="opt ${c}" data-q="${qi}" data-o="${oi}" ${a?"disabled":""}><span class="k">${KEYS[pos]}</span><span>${fmt(q.opts[oi])}</span></button>`;});
      if(a) h+=`<div class="exp">${a.ok?'<b class="okc">答對了！</b>':'<b class="badc">正確答案是 '+KEYS[ord.indexOf(0)]+'。</b>'} ${fmt(q.exp)}</div>`;
    }
    h+=`</div>`;
  });
  $("#app").innerHTML=h;
  $("#back").onclick=home;
  document.querySelectorAll(".opt[data-q]").forEach(b=>b.onclick=()=>{
    const qi=+b.dataset.q, oi=+b.dataset.o; markM(qi,{pick:oi,ok:oi===0});
  });
  document.querySelectorAll(".nin").forEach(b=>b.onclick=()=>{const qi=+b.dataset.n; if(r.a[qi]) return; if(kpQ!==qi){kpQ=qi;kpVal="";} kpOpen(); keepY(renderUnit); setTimeout(()=>{const e=$("#mq"+qi); if(e) e.scrollIntoView({block:"center",behavior:"smooth"})},50);});
  const rd=$("#redo"); if(rd) rd.onclick=()=>{r.a={};save();renderUnit();window.scrollTo(0,0)};
}
function keepY(fn){const y=window.scrollY; fn(); window.scrollTo(0,y);}
function markM(qi,res){
  const r=mrec(mcur.id); r.a[qi]=res; const first=!r.paid[qi]; r.paid[qi]=true; save();
  if(res.ok&&first) addPoints(10,"答對了！");
  keepY(renderUnit);
}
function kpOpen(){$("#kp").classList.add("on");document.body.classList.add("kpon")}
function kpClose(){kpQ=null;kpVal="";$("#kp").classList.remove("on");document.body.classList.remove("kpon")}
function submitNum(){
  if(kpQ==="d") return drillNum();
  const q=mcur.qs[kpQ], qi=kpQ, msg=t=>{const e=$("#nmsg"+qi); if(e) e.textContent=t;};
  const v=parseNum(kpVal); if(!v){msg(kpVal?"格式看不懂，請檢查一下（分數用 /，帶分數用「又」）":"請先輸入答案");return;}
  const ans=parseNum(q.ans);
  if(sameVal(v,ans)){
    if((v.kind==="frac"||v.kind==="mixed")&&gcd(v.fa,v.fb)!==1){msg("答案的值對了，但請約分成最簡分數再按確定");return;}
    if(v.kind==="mixed"&&v.fa>=v.fb){msg("帶分數的分數部分要小於分母，請再化簡");return;}
  }
  const val=kpVal; kpClose(); markM(qi,{v:val,ok:sameVal(v,ans)});
}
document.querySelectorAll("#kp button").forEach(b=>b.onclick=()=>{
  if(kpQ===null) return; const k=b.dataset.k;
  if(k==="ok") return submitNum();
  if(k==="bs") kpVal=kpVal.slice(0,-1);
  else if(k==="-"){ kpVal=kpVal.startsWith("-")?kpVal.slice(1):"-"+kpVal; }
  else if(kpVal.length<14) kpVal+=k;
  const e=$("#nmsg"+kpQ); if(e) e.textContent="";
  const box=document.querySelector(`.nin[data-n="${kpQ}"]`);
  if(box) box.innerHTML=(kpVal?fmt(ansMarkup(kpVal)):"")+'<span class="caret"></span>';
});
document.addEventListener("click",e=>{ if(kpQ!==null&&kpQ!=="d"&&!e.target.closest("#kp")&&!e.target.closest(".nin")){ const q=kpQ; kpClose(); const box=document.querySelector(`.nin[data-n="${q}"]`); if(box) box.innerHTML='<span class="ph">點這裡作答</span>'; box&&box.classList.remove("act"); } });

// ───────── 特別練習區：公因數與公倍數（程式出題）─────────
let dcur=null;
const DMODES={
  std:{n:"標準分解式",g:"國一",d:"質因數分解、標準分解式、因數個數"},
  gl:{n:"最大公因數與最小公倍數",g:"國一",d:"大數、三數、用標準分解式求 (a,b)、[a,b]"},
  rel:{n:"性質與關係",g:"國一",d:"兩數乘積、可能的組數、倍數個數"},
  app:{n:"會考應用題",g:"國一～國三",d:"餘數、種樹、齒輪、堆正方體、發車時刻"},
  alg:{n:"公因式",g:"國二",d:"單項式的最大公因式、提公因式分解"},
  chal:{n:"會考挑戰",g:"國三",d:"完全平方數、未知指數、因數個數綜合"}
};
const R=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const lcm=(a,b)=>a/gcd(a,b)*b;
const PR=[2,3,5,7,11,13,17,19,23,29,31,37,41,43,47];
function pf(n){const o=[];for(const p of PR){let e=0;while(n%p===0){n/=p;e++}if(e)o.push([p,e])}if(n>1)o.push([n,1]);return o}
const ex=(p,e)=>e>1?`${p}^${e}`:`${p}`;
function pfStr(n){return pf(n).map(([p,e])=>ex(p,e)).join(" × ")||"1"}
function divCount(n){return pf(n).reduce((s,[,e])=>s*(e+1),1)}
function divisors(n){const o=[];for(let i=1;i<=n;i++)if(n%i===0)o.push(i);return o}
// 以指數陣列表示 2,3,5,7
const P4=[2,3,5,7];
const eStr=E=>P4.map((p,i)=>E[i]?ex(p,E[i]):"").filter(Boolean).join(" × ")||"1";
const eVal=E=>P4.reduce((s,p,i)=>s*p**(E[i]||0),1);
function pairWithGcd(gMin,gMax,mMin,mMax,max){
  for(let t=0;t<300;t++){const g=R(gMin,gMax),m1=R(mMin,mMax),m2=R(mMin,mMax);
    if(m1===m2||gcd(m1,m2)!==1)continue; const a=g*m1,b=g*m2; if(a>max||b>max)continue; return a<b?[a,b]:[b,a];}
  return [84,126];
}
function shortDiv(a,b){
  let x=a,y=b,steps=[],ps=[];
  for(const p of PR){while(x%p===0&&y%p===0){steps.push(`${p}）${x}　${y}`);x/=p;y/=p;ps.push(p)}}
  const g=ps.reduce((s,p)=>s*p,1);
  if(!ps.length) return {txt:`${a} 和 ${b} 互質，(a, b) = 1，[a, b] = ${a*b}。`,g:1,l:a*b};
  return {txt:`短除法：${steps.join("；")}，剩下 ${x}、${y} 互質。最大公因數 = ${ps.join(" × ")} = ${g}；最小公倍數 = ${g} × ${x} × ${y} = ${g*x*y}。`,g,l:g*x*y};
}
function mcOf(correct,wrongs,q,exp){
  const w=[...new Set(wrongs.map(String))].filter(x=>x!==String(correct));
  if(w.length<3) return null;
  return {t:"mc",q,opts:[String(correct),...w.slice(0,3)],exp};
}
function randE(maxs,minNonZero=2){let E;do{E=maxs.map(m=>R(0,m))}while(E.filter(Boolean).length<minNonZero);return E}
function mono(c,x,y){ // 係數、x 次方、y 次方 → 字串
  const v=(s,e)=>e===0?"":e===1?s:`${s}^${e}`;
  const cs=(c===1&&(x||y))?"":String(c);
  return cs+v("x",x)+v("y",y)||"1";
}

function genQ(mode){
  for(let t=0;t<50;t++){ const q=genQ1(mode); if(q) return q; }
  return genQ1("gl")||{t:"num",q:"12 和 18 的最大公因數是多少？",ans:"6",exp:"(12, 18) = 6。"};
}
function genQ1(mode){
  const T={
    std:["pfMC","pfMC","divCntE","divCntN","isFac","pfNum"],
    gl:["gcdB","lcmB","gcd3","lcm3","stdG","stdL"],
    rel:["relL","relO","pairs","pairMC","multOr","cfCnt"],
    app:["remSame","remShort","remDist","tree","gear","cube","bus","sqCut"],
    alg:["mGCF","mGCF","fac2","fac2","fac3"],
    chal:["sqMin","cubeMin","sqDiv","expG","expL","pairs","kDiv"]
  }[mode];
  const k=pick(T); let a,b,c,E,F,sd;
  switch(k){
  // ── 標準分解式 ──
  case "pfMC": { E=randE([4,3,2,1],2); const N=eVal(E); if(N<60||N>3000) return null;
    const w=[];
    // 不是「標準」：把 2^2 寫成 4 或 3^2 寫成 9
    if(E[0]>=2){const F2=[...E];F2[0]-=2; w.push(("4 × "+eStr(F2)).replace(/ × 1$/,""));}
    if(E[1]>=2){const F2=[...E];F2[1]-=2; w.push(("9 × "+eStr(F2)).replace(/ × 1$/,""));}
    for(let i=0;i<4&&w.length<5;i++){ if(E[i]){const F2=[...E];F2[i]++;w.push(eStr(F2));} if(E[i]>1){const F2=[...E];F2[i]--;w.push(eStr(F2));} }
    { const F2=[...E]; const i=E.findIndex(x=>x>0), j=E.findIndex((x,ix)=>ix>i&&x>0); if(j>0&&E[i]!==E[j]){[F2[i],F2[j]]=[F2[j],F2[i]];w.push(eStr(F2));} }
    const sh=w.sort(()=>Math.random()-.5);
    return mcOf(eStr(E),sh,`${N} 的標準分解式是？`,`標準分解式要把 ${N} 分解成「質數」的乘積，並由小到大以指數表示：${N} = ${eStr(E)}。4、9 不是質數，不能出現在標準分解式中。`);}
  case "pfNum": { E=randE([4,3,2,1],2); const N=eVal(E); if(N>2000) return null;
    return {t:"num",q:`若 ${eStr(E)} = N，則 N = ?`,ans:String(N),exp:`${eStr(E)} = ${P4.filter((p,i)=>E[i]).map((p,i)=>p**E[P4.indexOf(p)]).join(" × ")} = ${N}。`};}
  case "divCntE": { E=randE([5,4,3,2],2); const n=E.reduce((s,e)=>s*(e+1),1);
    return {t:"num",q:`${eStr(E)} 的正因數共有幾個？`,ans:String(n),unit:"個",exp:`正因數個數 = 各指數加 1 後相乘：${E.filter(Boolean).map(e=>`(${e} + 1)`).join(" × ")} = ${n}。`};}
  case "divCntN": { E=randE([4,3,2,1],2); const N=eVal(E); if(N<48||N>1000) return null; const n=divCount(N);
    return {t:"num",q:`${N} 的正因數共有幾個？`,ans:String(n),unit:"個",exp:`先寫標準分解式：${N} = ${eStr(E)}。正因數個數 = ${E.filter(Boolean).map(e=>`(${e} + 1)`).join(" × ")} = ${n}。`};}
  case "isFac": { E=randE([4,3,2,1],3); const okE=E.map(e=>R(0,e)); if(okE.every(x=>!x)) return null;
    const w=[]; for(let i=0;i<4;i++){const F2=[...okE];F2[i]=E[i]+1;w.push(eStr(F2));}
    { const F2=[...okE]; const z=E.findIndex(x=>x===0); if(z>=0){F2[z]=1;w.push(eStr(F2));} }
    return mcOf(eStr(okE),w.sort(()=>Math.random()-.5),`下列哪一個是 ${eStr(E)} 的因數？`,`因數的每個質因數次方都不能超過原數：${eStr(okE)} 符合；其他選項有某個質因數次方太高，或出現原數沒有的質因數。`);}
  // ── 最大公因數、最小公倍數 ──
  case "gcdB": [a,b]=pairWithGcd(6,40,2,11,700); sd=shortDiv(a,b);
    return {t:"num",q:`求 (${a}, ${b}) = ?`,ans:String(sd.g),exp:`(a, b) 表示最大公因數。${sd.txt}`};
  case "lcmB": [a,b]=pairWithGcd(3,24,2,9,400); sd=shortDiv(a,b);
    return {t:"num",q:`求 [${a}, ${b}] = ?`,ans:String(sd.l),exp:`[a, b] 表示最小公倍數。${sd.txt}`};
  case "gcd3": case "lcm3": { const g=R(2,12); let m; do{m=[R(2,9),R(2,9),R(2,9)]}while(new Set(m).size<3||gcd(gcd(m[0],m[1]),m[2])!==1);
    [a,b,c]=m.map(x=>x*g).sort((x,y)=>x-y); const G=gcd(gcd(a,b),c), L=lcm(lcm(a,b),c); if(L>5000) return null;
    const base=`${a} = ${pfStr(a)}，${b} = ${pfStr(b)}，${c} = ${pfStr(c)}。`;
    return k==="gcd3"?{t:"num",q:`求 (${a}, ${b}, ${c}) = ?`,ans:String(G),exp:base+`共同質因數取最低次方相乘：(${a}, ${b}, ${c}) = ${pfStr(G)} = ${G}。`}
                     :{t:"num",q:`求 [${a}, ${b}, ${c}] = ?`,ans:String(L),exp:base+`所有質因數取最高次方相乘：[${a}, ${b}, ${c}] = ${pfStr(L)} = ${L}。`};}
  case "stdG": case "stdL": { E=randE([4,3,2,2],3); F=randE([4,3,2,2],3); if(E.join()===F.join()) return null;
    const G=E.map((e,i)=>Math.min(e,F[i])), L=E.map((e,i)=>Math.max(e,F[i])); if(G.every(x=>!x)) return null;
    const isG=k==="stdG", ans=isG?G:L, wrong=isG?L:G;
    const w=[eStr(wrong), eStr(E.map((e,i)=>e+F[i]))]; for(let i=0;i<4;i++){const X=[...ans]; if(X[i]){X[i]--; w.push(eStr(X));} const Y=[...ans]; Y[i]++; w.push(eStr(Y));}
    return mcOf(eStr(ans),w,`a = ${eStr(E)}，b = ${eStr(F)}，則 ${isG?"(a, b)":"[a, b]"} = ?`,
      isG?`最大公因數：只取「共同」的質因數，次方取「較小」的 → ${eStr(G)}。`:`最小公倍數：所有出現的質因數都要取，次方取「較大」的 → ${eStr(L)}。`);}
  // ── 性質與關係 ──
  case "relL": { [a,b]=pairWithGcd(4,20,2,9,300); const g=gcd(a,b),l=lcm(a,b);
    return {t:"num",q:`兩個正整數的乘積為 ${a*b}，最大公因數為 ${g}，則它們的最小公倍數為多少？`,ans:String(l),exp:`兩正整數 a、b 滿足 a × b = (a, b) × [a, b]，所以 [a, b] = ${a*b} ÷ ${g} = ${l}。`};}
  case "relO": { [a,b]=pairWithGcd(4,20,2,9,300); const g=gcd(a,b),l=lcm(a,b); const [x,y]=pick([0,1])?[a,b]:[b,a];
    return {t:"num",q:`兩個正整數的最大公因數為 ${g}、最小公倍數為 ${l}，已知其中一數為 ${x}，另一數為多少？`,ans:String(y),exp:`a × b = (a, b) × [a, b] = ${g} × ${l} = ${g*l}，另一數 = ${g*l} ÷ ${x} = ${y}。`};}
  case "pairs": { const g=R(2,12); const q=pick([6,10,12,15,18,20,24,28,30,36,40,42,60]); const l=g*q;
    let cnt=0, list=[]; for(let i=1;i*i<q;i++) if(q%i===0&&gcd(i,q/i)===1){cnt++;list.push(`(${g*i}, ${g*q/i})`);}
    return {t:"num",q:`兩正整數 a、b（a < b）的最大公因數為 ${g}、最小公倍數為 ${l}，符合條件的 (a, b) 共有幾組？`,ans:String(cnt),unit:"組",
      exp:`設 a = ${g}m、b = ${g}n，m、n 互質且 m × n = ${l} ÷ ${g} = ${q}。把 ${q} 拆成兩個互質的數相乘：可得 ${list.join("、")}，共 ${cnt} 組。`};}
  case "pairMC": { [a,b]=pairWithGcd(3,15,2,9,200); const g=gcd(a,b),l=lcm(a,b);
    const w=[]; for(let t=0;t<30&&w.length<6;t++){const [x,y]=pairWithGcd(2,15,2,9,200); if(gcd(x,y)!==g||lcm(x,y)!==l) w.push(`${x} 和 ${y}`);}
    w.push(`${g} 和 ${l*2}`, `${g*2} 和 ${l}`);
    const fw=w.filter(s=>{const [x,y]=s.split(" 和 ").map(Number);return !(gcd(x,y)===g&&lcm(x,y)===l)});
    return mcOf(`${a} 和 ${b}`,fw,`下列哪一組數的最大公因數是 ${g}、最小公倍數是 ${l}？`,`${a} = ${pfStr(a)}，${b} = ${pfStr(b)}：(${a}, ${b}) = ${g}，[${a}, ${b}] = ${l}。也可用 ${a} × ${b} = ${a*b} = ${g} × ${l} 快速檢查。`);}
  case "multOr": { a=pick([2,3,4,5,6]); do{b=pick([3,4,5,6,7,8,9])}while(b===a||b%a===0||a%b===0); const N=pick([50,60,80,100,120,150,200]);
    const L=lcm(a,b), A=Math.floor(N/a), B=Math.floor(N/b), C=Math.floor(N/L);
    return pick([0,1])?{t:"num",q:`1 到 ${N} 的正整數中，是 ${a} 的倍數「或」是 ${b} 的倍數的數共有幾個？`,ans:String(A+B-C),unit:"個",exp:`${a} 的倍數 ${A} 個，${b} 的倍數 ${B} 個，兩者都是（即 ${L} 的倍數）${C} 個被重複計算：${A} + ${B} − ${C} = ${A+B-C}。`}
      :{t:"num",q:`1 到 ${N} 的正整數中，同時是 ${a} 和 ${b} 的倍數的數共有幾個？`,ans:String(C),unit:"個",exp:`同時是 ${a} 和 ${b} 的倍數，就是 [${a}, ${b}] = ${L} 的倍數：${N} ÷ ${L} = ${(N/L).toFixed(2).replace(/\.?0+$/,"")}，取整數部分得 ${C} 個。`};}
  case "cfCnt": { E=randE([5,4,3,2],2); F=randE([5,4,3,2],2); const G=E.map((e,i)=>Math.min(e,F[i])); if(G.every(x=>!x)) return null; const n=G.reduce((s,e)=>s*(e+1),1); if(n<3) return null;
    return {t:"num",q:`a = ${eStr(E)}，b = ${eStr(F)}，a 和 b 的正公因數共有幾個？`,ans:String(n),unit:"個",exp:`公因數就是 (a, b) 的因數。(a, b) = ${eStr(G)}，因數個數 = ${G.filter(Boolean).map(e=>`(${e} + 1)`).join(" × ")} = ${n}。`};}
  // ── 會考應用題 ──
  case "remSame": { a=R(3,12); do{b=R(4,15)}while(b===a); const r=R(1,Math.min(a,b)-1); const L=lcm(a,b); if(L>200) return null;
    return {t:"num",q:`有一個大於 ${r} 的正整數，除以 ${a} 和除以 ${b} 都餘 ${r}。這個數最小是多少？`,ans:String(L+r),exp:`這個數減去 ${r} 後是 ${a} 和 ${b} 的公倍數，最小為 [${a}, ${b}] = ${L}，所以這個數最小是 ${L} + ${r} = ${L+r}。`};}
  case "remShort": { a=R(3,9); do{b=R(4,12)}while(b===a); const L=lcm(a,b); if(L>150) return null;
    return {t:"num",q:`某正整數除以 ${a} 餘 ${a-1}，除以 ${b} 餘 ${b-1}。這個數最小是多少？`,ans:String(L-1),exp:`除以 ${a} 餘 ${a-1}、除以 ${b} 餘 ${b-1}，表示這個數「加 1」後能被 ${a} 和 ${b} 整除。[${a}, ${b}] = ${L}，所以最小是 ${L} − 1 = ${L-1}。`};}
  case "remDist": { const g=R(5,15); let m1,m2; do{m1=R(3,9);m2=R(3,9)}while(m1===m2||gcd(m1,m2)!==1); const r1=R(1,g-1), r2=R(1,g-1); const x=g*m1+r1, y=g*m2+r2;
    return {t:"num",q:`把 ${x} 顆糖果平分給一群學生，剩下 ${r1} 顆；把 ${y} 塊餅乾平分給同一群學生，剩下 ${r2} 塊。這群學生最多有幾位？`,ans:String(g),unit:"位",
      exp:`人數能整除 ${x} − ${r1} = ${x-r1} 和 ${y} − ${r2} = ${y-r2}，且要大於剩下的數量 ${Math.max(r1,r2)}。(${x-r1}, ${y-r2}) = ${g}，符合條件，所以最多 ${g} 位。`};}
  case "tree": { [a,b]=pairWithGcd(3,12,2,7,90); const g=gcd(a,b), n=2*(a+b)/g;
    return {t:"num",q:`一塊長 ${b} 公尺、寬 ${a} 公尺的長方形空地，要在四周等距離種樹，四個角都要種，且樹的間隔愈大愈好。最少要種幾棵樹？`,ans:String(n),unit:"棵",
      exp:`間隔要同時整除 ${b} 和 ${a}，最大為 (${b}, ${a}) = ${g} 公尺。周長 2 × (${b} + ${a}) = ${2*(a+b)} 公尺，圍成一圈時棵數 = 周長 ÷ 間隔 = ${2*(a+b)} ÷ ${g} = ${n} 棵。`};}
  case "gear": { [a,b]=pairWithGcd(2,8,3,9,72); const L=lcm(a,b);
    return {t:"num",q:`甲齒輪有 ${b} 齒、乙齒輪有 ${a} 齒，兩齒輪互相咬合。開始時某兩齒相對，甲齒輪至少要轉幾圈，這兩齒才會再次相對？`,ans:String(L/b),unit:"圈",
      exp:`兩齒再次相對時，轉過的齒數要同時是 ${b} 和 ${a} 的倍數，最少為 [${b}, ${a}] = ${L} 齒。甲轉 ${L} ÷ ${b} = ${L/b} 圈（乙轉 ${L/a} 圈）。`};}
  case "cube": { let m; do{m=[R(2,6),R(2,8),R(3,10)]}while(new Set(m).size<3); [a,b,c]=m.sort((x,y)=>x-y); const L=lcm(lcm(a,b),c); if(L>30) return null; const n=(L/a)*(L/b)*(L/c);
    return {t:"num",q:`用長 ${c} 公分、寬 ${b} 公分、高 ${a} 公分的長方體積木，以相同方向堆成一個正方體，最少需要幾塊？`,ans:String(n),unit:"塊",
      exp:`正方體邊長要同時是 ${c}、${b}、${a} 的倍數，最小為 [${c}, ${b}, ${a}] = ${L} 公分。塊數 = (${L} ÷ ${c}) × (${L} ÷ ${b}) × (${L} ÷ ${a}) = ${L/c} × ${L/b} × ${L/a} = ${n}。`};}
  case "bus": { [a,b]=pairWithGcd(2,10,2,7,45); const L=lcm(a,b); if(L>180||L<20) return null; const h=R(6,8), mm=pick([0,10,15,20,30]);
    const t=h*60+mm+L, ts=x=>`${Math.floor(x/60)}:${String(x%60).padStart(2,"0")}`;
    const w=[ts(h*60+mm+a*b), ts(t-a), ts(t+b), ts(t+a), ts(t-gcd(a,b))];
    return mcOf(ts(t),w,`A 路公車每 ${a} 分鐘發一班，B 路公車每 ${b} 分鐘發一班。若兩路公車在 ${ts(h*60+mm)} 同時發車，下一次同時發車是幾點幾分？`,`下一次同時發車要經過 [${a}, ${b}] = ${L} 分鐘，${ts(h*60+mm)} 再過 ${L} 分鐘是 ${ts(t)}。`);}
  case "sqCut": { [a,b]=pairWithGcd(3,15,2,7,120); const g=gcd(a,b), n=(a/g)*(b/g);
    return {t:"num",q:`把一張長 ${b} 公分、寬 ${a} 公分的長方形紙，剪成大小相同、邊長盡量大的正方形，且沒有剩。可以剪成幾個正方形？`,ans:String(n),unit:"個",
      exp:`正方形邊長最大為 (${b}, ${a}) = ${g} 公分。長可剪 ${b} ÷ ${g} = ${b/g} 個，寬可剪 ${a} ÷ ${g} = ${a/g} 個，共 ${b/g} × ${a/g} = ${n} 個。`};}
  // ── 國二：公因式 ──
  case "mGCF": { const g=R(2,9); let m1,m2; do{m1=R(1,6);m2=R(1,6)}while(m1===m2||gcd(m1,m2)!==1);
    const x1=R(1,4),x2=R(1,4),y1=R(0,3),y2=R(1,3); const A=mono(g*m1,x1,y1), B=mono(g*m2,x2,y2);
    const ans=mono(g,Math.min(x1,x2),Math.min(y1,y2));
    const w=[mono(g,Math.max(x1,x2),Math.max(y1,y2)), mono(g*m1*m2,Math.min(x1,x2),Math.min(y1,y2)), mono(g,Math.min(x1,x2),Math.max(y1,y2)), mono(g,Math.max(x1,x2),Math.min(y1,y2)), mono(1,Math.min(x1,x2),Math.min(y1,y2)), mono(g*2,Math.min(x1,x2),Math.min(y1,y2))];
    return mcOf(ans,w,`${A} 和 ${B} 的最大公因式是？`,`係數取最大公因數 (${g*m1}, ${g*m2}) = ${g}；每個文字取「共同」且次方「較小」的：x 取 ${Math.min(x1,x2)} 次${Math.min(y1,y2)?`、y 取 ${Math.min(y1,y2)} 次`:"，y 不是共同因式"}。最大公因式 = ${ans}。`);}
  case "fac2": { const g=R(2,8); let p,q2; do{p=R(1,6);q2=R(1,7)}while(gcd(p,q2)!==1||p===q2); const m=R(2,4), n=R(1,m-1);
    const t1=mono(g*p,m,0), t2=mono(g*q2,n,0), out=mono(g,n,0), inn1=mono(p,m-n,0);
    const ans=`${out}(${inn1} + ${q2})`, sign=pick(["+","−"]);
    const A=`${out}(${inn1} ${sign} ${q2})`;
    const w=[`${mono(1,n,0)}(${mono(g*p,m-n,0)} ${sign} ${g*q2})`, `${g}(${mono(p,m,0)} ${sign} ${mono(q2,n,0)})`, `${out}(${mono(p,m-n,0)} ${sign==="+"?"−":"+"} ${q2})`, `${mono(g,m,0)}(${p} ${sign} ${q2})`];
    return mcOf(A,w,`把 ${t1} ${sign} ${t2} 因式分解，結果是？`,`兩項的最大公因式是 ${out}（係數 (${g*p}, ${g*q2}) = ${g}，x 取較小次方 ${n}）。提出後：${t1} ${sign} ${t2} = ${A}。只提出 x 或只提出 ${g}，括號內仍有公因式，不算完全分解。`);}
  case "fac3": { const g=R(2,6); const c=[R(1,5),R(1,5),R(1,5)]; if(gcd(gcd(c[0],c[1]),c[2])!==1) return null;
    const terms=[mono(g*c[0],2,1),mono(g*c[1],1,2),mono(g*c[2],1,1)], inner=[mono(c[0],1,0),mono(c[1],0,1),String(c[2])];
    const ans=`${mono(g,1,1)}(${inner[0]} + ${inner[1]} − ${inner[2]})`;
    const w=[`${mono(g,1,1)}(${inner[0]} + ${inner[1]} − 1)`, `${mono(1,1,1)}(${mono(g*c[0],1,0)} + ${mono(g*c[1],0,1)} − ${g*c[2]})`, `${mono(g,2,2)}(${inner[0]} + ${inner[1]} − ${inner[2]})`, `${g}(${mono(c[0],2,1)} + ${mono(c[1],1,2)} − ${mono(c[2],1,1)})`];
    return mcOf(ans,w,`把 ${terms[0]} + ${terms[1]} − ${terms[2]} 因式分解，結果是？`,`三項的最大公因式為 ${mono(g,1,1)}，每一項各除以 ${mono(g,1,1)}：${terms[0]} ÷ ${mono(g,1,1)} = ${inner[0]}、${terms[1]} ÷ ${mono(g,1,1)} = ${inner[1]}、${terms[2]} ÷ ${mono(g,1,1)} = ${inner[2]}。只提出 ${g} 或只提出 xy，括號內仍有公因式，不算完全分解。`);}
  // ── 國三：會考挑戰 ──
  case "sqMin": case "cubeMin": { const K=k==="sqMin"?2:3; E=randE([5,4,3,2],2); const N=eVal(E); if(N>5000) return null;
    const need=E.map(e=>(K-e%K)%K); const n=eVal(need); if(n===1) return null;
    return {t:"num",q:`若 ${N} × n 是一個${K===2?"完全平方數":"完全立方數"}，則最小的正整數 n 是多少？`,ans:String(n),
      exp:`${N} = ${eStr(E)}。${K===2?"完全平方數":"完全立方數"}的每個質因數次方都是 ${K} 的倍數，需補上 ${eStr(need)}，所以 n = ${n}（${N} × ${n} = ${eStr(E.map((e,i)=>e+need[i]))}）。`};}
  case "sqDiv": { E=randE([6,4,4,2],2); const n=E.reduce((s,e)=>s*(Math.floor(e/2)+1),1); if(n<2) return null;
    return {t:"num",q:`${eStr(E)} 的正因數中，有幾個是完全平方數？`,ans:String(n),unit:"個",
      exp:`完全平方數因數的每個質因數次方都要是偶數（含 0）。${E.map((e,i)=>e?`${P4[i]} 的次方可取 ${[...Array(Math.floor(e/2)+1).keys()].map(x=>2*x).join("、")}（${Math.floor(e/2)+1} 種）`:"").filter(Boolean).join("；")}。共 ${n} 個。`};}
  case "expG": case "expL": { const q2=R(2,5), p3=R(2,5); const isG=k==="expG";
    const m=isG?R(0,q2-1):R(q2+1,q2+3), n=isG?R(0,p3-1):R(p3+1,p3+3); if(isG&&m===0&&n===0) return null;
    const res=isG?[m,n]:[m,n];
    const A=`2^m × ${ex(3,p3)}`, B=`${ex(2,q2)} × 3^n`, cond=`${isG?"(a, b)":"[a, b]"} = ${eStr([res[0],res[1],0,0])}`;
    return {t:"num",q:`a = ${A}，b = ${B}（m、n 為正整數或 0）。若 ${cond}，則 m + n = ?`,ans:String(m+n),
      exp:isG?`(a, b) 的次方取較小者：2 的次方 = min(m, ${q2}) = ${m}，因為 ${m} < ${q2}，所以 m = ${m}；3 的次方 = min(${p3}, n) = ${n}，因為 ${n} < ${p3}，所以 n = ${n}。m + n = ${m+n}。`
             :`[a, b] 的次方取較大者：2 的次方 = max(m, ${q2}) = ${m}，因為 ${m} > ${q2}，所以 m = ${m}；3 的次方 = max(${p3}, n) = ${n}，因為 ${n} > ${p3}，所以 n = ${n}。m + n = ${m+n}。`};}
  case "kDiv": { const tbl={4:6,6:12,8:24,9:36,10:48,12:60}; const kk=pick(Object.keys(tbl)); const v=tbl[kk];
    return {t:"num",q:`正因數恰好有 ${kk} 個的正整數中，最小的是多少？`,ans:String(v),exp:`${v} = ${pfStr(v)}，正因數個數 = ${pf(v).map(([,e])=>`(${e} + 1)`).join(" × ")} = ${kk}。比 ${v} 小的數都不是恰好 ${kk} 個正因數，所以最小是 ${v}。`};}
  }
  return null;
}

// ───────── 特訓：國一四則運算（有理數，精確分數計算）─────────
const OMODES={
  as:{n:"整數加減",g:"國一",d:"正負數加減、去括號、絕對值、數線距離"},
  md:{n:"整數乘除與指數",g:"國一",d:"由左往右、−3² 與 (−3)²、正負號判斷"},
  mix:{n:"整數四則混合",g:"國一",d:"先乘除後加減、括號、指數、分配律"},
  fr:{n:"分數四則",g:"國一",d:"負分數加減乘除、帶分數、運算順序"},
  ch:{n:"綜合挑戰",g:"國一",d:"分數次方、絕對值、分配律簡算、(−1)ⁿ"}
};
const Qn=(n,d=1)=>{if(d<0){n=-n;d=-d} const g=gcd(n,d)||1; return {n:n/g,d:d/g}};
const Qadd=(a,b)=>Qn(a.n*b.d+b.n*a.d,a.d*b.d), Qsub=(a,b)=>Qn(a.n*b.d-b.n*a.d,a.d*b.d);
const Qmul=(a,b)=>Qn(a.n*b.n,a.d*b.d), Qdiv=(a,b)=>Qn(a.n*b.d,a.d*b.n);
const Qpow=(a,e)=>Qn(a.n**e,a.d**e), Qabs=a=>Qn(Math.abs(a.n),a.d), I=n=>Qn(n,1);
const Qstr=a=>a.d===1?String(a.n):`${a.n}/${a.d}`;               // 答案字串（-7/12）
const Qtxt=a=>{const s=a.n<0?"−":"", n=Math.abs(a.n); return a.d===1?s+n:s+`[${n}/${a.d}]`}; // 顯示
const Qmk=a=>a.n<0?`(${Qtxt(a)})`:Qtxt(a);                         // 非首項：負數加括號
const Qmk0=Qtxt;
const nz=(a,b)=>{let x;do{x=R(a,b)}while(!x);return x};
const sgn=()=>pick([1,-1]);
function rfrac(maxD=12){for(;;){const d=R(2,maxD), n=R(1,Math.floor(d*1.6)); const q=Qn(sgn()*n,d); if(q.d>1) return q;}}
function mixed(){ // 帶分數
  const w=R(1,3), d=R(2,6), p=R(1,d-1); if(gcd(p,d)!==1) return null; const s=sgn();
  return {v:Qn(s*(w*d+p),d), t:`${s<0?"−":""}${w}[${p}/${d}]`, mk:s<0?`(−${w}[${p}/${d}])`:`${w}[${p}/${d}]`};
}
const asQ=(expr,v,exp)=>({t:"num",q:`計算：${expr} = ?`,ans:Qstr(v),exp});

function genOps(mode){ for(let t=0;t<60;t++){const q=genOps1(mode); if(q) return q;} return genOps1("as"); }
function genOps1(mode){
  const T={as:["a3","a3","paren","abs","dist","a4"], md:["mdv","dvm","pow","pow","pmd","msign","prod"], mix:["m1","m2","m3","m4","m5","dist99"],
           fr:["fas","fas","fmd","ford","fmix","fint","fpar"], ch:["cpow","cdist","cneg1","cnest","fmd","cabs"]}[mode];
  const k=pick(T);
  switch(k){
  // ── 整數加減 ──
  case "a3": { const a=I(nz(-60,60)), b=I(nz(-60,60)), c=I(nz(-60,60)); const o1=pick(["+","−"]), o2=pick(["+","−"]); if(a.n>0&&b.n>0&&c.n>0) return null;
    const t2=o1==="+"?b:Qn(-b.n), t3=o2==="+"?c:Qn(-c.n), s1=Qadd(a,t2), v=Qadd(s1,t3);
    return asQ(`${Qmk0(a)} ${o1} ${Qmk(b)} ${o2} ${Qmk(c)}`,v,`減去一數等於加上它的相反數，改寫成 ${Qmk0(a)} + ${Qmk(t2)} + ${Qmk(t3)}。${Qmk0(a)} + ${Qmk(t2)} = ${Qtxt(s1)}，${Qmk0(s1)} + ${Qmk(t3)} = ${Qtxt(v)}。`);}
  case "a4": { const xs=[I(nz(-40,40)),I(nz(-40,40)),I(nz(-40,40)),I(nz(-40,40))]; const os=["+",pick(["+","−"]),pick(["+","−"]),pick(["+","−"])]; if(xs.every(x=>x.n>0)) return null;
    const ts=xs.map((x,i)=>os[i]==="−"?Qn(-x.n):x); const pos=ts.filter(x=>x.n>0).reduce((s,x)=>s+x.n,0), neg=ts.filter(x=>x.n<0).reduce((s,x)=>s+x.n,0);
    const expr=Qmk0(xs[0])+xs.slice(1).map((x,i)=>` ${os[i+1]} ${Qmk(x)}`).join("");
    return asQ(expr,I(pos+neg),`先把減號改成加上相反數：${ts.map((x,i)=>i?Qmk(x):Qmk0(x)).join(" + ")}。正數合計 ${pos}，負數合計 ${neg<0?"−"+(-neg):0}，${pos} + ${Qmk(I(neg))} = ${Qtxt(I(pos+neg))}。`);}
  case "paren": { const a=I(nz(-50,50)), b=I(nz(-50,50)), c=I(nz(-50,50)); const inner=Qsub(b,c), v=Qsub(a,inner);
    return asQ(`${Qmk0(a)} − (${Qmk0(b)} − ${Qmk(c)})`,v,`先算括號：${Qmk0(b)} − ${Qmk(c)} = ${Qtxt(inner)}；再算 ${Qmk0(a)} − ${Qmk(inner)} = ${Qtxt(v)}。`);}
  case "abs": { const a=I(-R(2,30)), b=I(nz(-30,30)), c=I(nz(-30,30)); const in2=Qsub(b,c), v=Qsub(Qabs(a),Qabs(in2));
    return asQ(`|${Qmk0(a)}| − |${Qmk0(b)} − ${Qmk(c)}|`,v,`|${Qmk0(a)}| = ${Qtxt(Qabs(a))}；${Qmk0(b)} − ${Qmk(c)} = ${Qtxt(in2)}，|${Qtxt(in2)}| = ${Qtxt(Qabs(in2))}；${Qtxt(Qabs(a))} − ${Qtxt(Qabs(in2))} = ${Qtxt(v)}。`);}
  case "dist": { const a=nz(-40,10), b=nz(-10,40); if(a===b) return null; const d=Math.abs(a-b);
    return {t:"num",q:`數線上 A 點表示 ${Qtxt(I(a))}，B 點表示 ${Qtxt(I(b))}，A、B 兩點的距離是多少？`,ans:String(d),exp:`兩點距離 = |大數 − 小數| = |${Qmk0(I(Math.max(a,b)))} − ${Qmk(I(Math.min(a,b)))}| = ${d}。`};}
  // ── 整數乘除與指數 ──
  case "mdv": { const c=I(nz(-9,9)); if(Math.abs(c.n)<2) return null; const kk=nz(-12,12), a=I(c.n*kk), b=I(nz(-9,9)); const p=Qmul(a,b), v=Qdiv(p,c);
    return asQ(`${Qmk0(a)} × ${Qmk(b)} ÷ ${Qmk(c)}`,v,`由左往右：${Qmk0(a)} × ${Qmk(b)} = ${Qtxt(p)}，${Qmk0(p)} ÷ ${Qmk(c)} = ${Qtxt(v)}。`);}
  case "dvm": { const b=I(nz(-9,9)); if(Math.abs(b.n)<2) return null; const kk=nz(-9,9), a=I(b.n*kk), c=I(nz(-8,8)); if(Math.abs(c.n)<2) return null; const q1=Qdiv(a,b), v=Qmul(q1,c);
    return asQ(`${Qmk0(a)} ÷ ${Qmk(b)} × ${Qmk(c)}`,v,`乘除同級，要由左往右算：${Qmk0(a)} ÷ ${Qmk(b)} = ${Qtxt(q1)}，${Qmk0(q1)} × ${Qmk(c)} = ${Qtxt(v)}。（不可以先算 ${Qmk(b)} × ${Qmk(c)}）`);}
  case "pow": { const b=R(2,5), e=R(2,b<=3?5:3), f=pick([0,1,2]); const p=b**e;
    if(f===0){const v=I((-b)**e); return asQ(`(−${b})^${e}`,v,`(−${b})^${e} 表示 ${e} 個 (−${b}) 相乘，${e%2?"奇數":"偶數"}個負數相乘為${e%2?"負":"正"}：${Qtxt(v)}。`);}
    if(f===1){const v=I(-p); return asQ(`−${b}^${e}`,v,`−${b}^${e} 是 ${b}^${e} 的相反數（負號不在次方裡）：${b}^${e} = ${p}，所以答案是 −${p}。`);}
    {const v=I(-((-b)**e)); return asQ(`−(−${b})^${e}`,v,`先算 (−${b})^${e} = ${Qtxt(I((-b)**e))}，再取相反數：${Qtxt(v)}。`);} }
  case "pmd": { const a=R(2,5), c=I(nz(-6,6)); if(Math.abs(c.n)<2) return null; const sq=a*a; const b=I(Math.abs(c.n)/gcd(sq,Math.abs(c.n))*nz(-4,4));
    const p=Qmul(I(sq),b), v=Qdiv(p,c);
    return asQ(`(−${a})^2 × ${Qmk(b)} ÷ ${Qmk(c)}`,v,`先算指數：(−${a})^2 = ${sq}；再由左往右：${sq} × ${Qmk(b)} = ${Qtxt(p)}，${Qmk0(p)} ÷ ${Qmk(c)} = ${Qtxt(v)}。`);}
  case "msign": { const pool=[];
    for(let i=0;i<40;i++){ const a=R(2,5), e=R(2,4), f=R(0,6); let s,v;
      if(f===0){s=`(−${a})^${e}`;v=(-a)**e} else if(f===1){s=`−${a}^${e}`;v=-(a**e)} else if(f===2){s=`−(−${a})`;v=a}
      else if(f===3){const b=R(2,9);s=`(−${a}) × (−${b})`;v=a*b} else if(f===4){const b=R(2,9);s=`(−${a}) × ${b}`;v=-a*b}
      else if(f===5){s=`|−${a*3}|`;v=a*3} else {const n=R(10,99);s=`(−1)^{${n}} × (−${a})`;v=((n%2)?-1:1)*-a}
      if(!pool.some(x=>x.s===s)) pool.push({s,v}); }
    const negs=pool.filter(x=>x.v<0), poss=pool.filter(x=>x.v>0); if(!negs.length||poss.length<3) return null;
    const c=pick(negs), w=poss.sort(()=>Math.random()-.5).slice(0,3);
    return {t:"mc",q:"下列哪一個算式的值是「負數」？",opts:[c.s,...w.map(x=>x.s)],exp:`${c.s} = ${Qtxt(I(c.v))}；其他：${w.map(x=>`${x.s} = ${x.v}`).join("，")}。`};}
  case "prod": { const n=R(3,5), neg=R(2,n); const fs=[...Array(n)].map((_,i)=>i<neg?-(i+1):(i+1)); const v=fs.reduce((s,x)=>s*x,1);
    return asQ(fs.map((x,i)=>i?Qmk(I(x)):Qmk0(I(x))).join(" × "),I(v),`共有 ${neg} 個負數，${neg%2?"奇數個負數相乘為負":"偶數個負數相乘為正"}；絕對值相乘 = ${Math.abs(v)}，答案 ${Qtxt(I(v))}。`);}
  // ── 整數四則混合 ──
  case "m1": { const a=I(nz(-50,50)), b=I(nz(-12,12)), c=I(nz(-12,12)); const p=Qmul(b,c), v=Qsub(a,p);
    return asQ(`${Qmk0(a)} − ${Qmk(b)} × ${Qmk(c)}`,v,`先乘後減：${Qmk0(b)} × ${Qmk(c)} = ${Qtxt(p)}；${Qmk0(a)} − ${Qmk(p)} = ${Qtxt(v)}。`);}
  case "m2": { const a=I(nz(-20,20)), b=I(nz(-20,20)), c=I(nz(-6,6)), e=I(nz(-6,6)); if(Math.abs(e.n)<2) return null; const d=I(e.n*nz(-9,9));
    const s=Qsub(a,b), p=Qmul(s,c), q=Qdiv(d,e), v=Qadd(p,q);
    return asQ(`(${Qmk0(a)} − ${Qmk(b)}) × ${Qmk(c)} + ${Qmk(d)} ÷ ${Qmk(e)}`,v,`括號：${Qmk0(a)} − ${Qmk(b)} = ${Qtxt(s)}；乘除：${Qmk0(s)} × ${Qmk(c)} = ${Qtxt(p)}，${Qmk0(d)} ÷ ${Qmk(e)} = ${Qtxt(q)}；最後 ${Qmk0(p)} + ${Qmk(q)} = ${Qtxt(v)}。`);}
  case "m3": { const b=I(nz(-9,9)); if(Math.abs(b.n)<2) return null; const a=I(b.n*nz(-12,12)), c=I(nz(-9,9)), d=I(nz(-9,9)); const q=Qdiv(a,b), p=Qmul(c,d), v=Qsub(q,p);
    return asQ(`${Qmk0(a)} ÷ ${Qmk(b)} − ${Qmk(c)} × ${Qmk(d)}`,v,`先算乘除：${Qmk0(a)} ÷ ${Qmk(b)} = ${Qtxt(q)}，${Qmk0(c)} × ${Qmk(d)} = ${Qtxt(p)}；再減：${Qmk0(q)} − ${Qmk(p)} = ${Qtxt(v)}。`);}
  case "m4": { const p=R(2,5), q=I(nz(-9,9)), r=I(nz(-9,9)), s=I(nz(-9,9)); const sq=p*p, in1=Qsub(r,s), m=Qmul(q,in1), v=Qadd(I(-sq),m);
    return asQ(`−${p}^2 + ${Qmk(q)} × (${Qmk0(r)} − ${Qmk(s)})`,v,`−${p}^2 = −${sq}（不是 ${sq}）；括號：${Qmk0(r)} − ${Qmk(s)} = ${Qtxt(in1)}；${Qmk0(q)} × ${Qmk(in1)} = ${Qtxt(m)}；−${sq} + ${Qmk(m)} = ${Qtxt(v)}。`);}
  case "m5": { const a=I(nz(-9,9)), b=I(nz(-12,12)), c=R(2,4); const in1=Qadd(b,I(c*c)), v=Qmul(a,in1);
    return asQ(`${Qmk0(a)} × [${Qmk0(b)} + (−${c})^2]`,v,`先算中括號內：(−${c})^2 = ${c*c}，${Qmk0(b)} + ${c*c} = ${Qtxt(in1)}；${Qmk0(a)} × ${Qmk(in1)} = ${Qtxt(v)}。`);}
  case "dist99": { const a=R(12,48), m=pick([99,101,98,102]); const v=I(-a*m), dlt=m-100;
    return asQ(`(−${a}) × ${m}`,v,`利用分配律：(−${a}) × (100 ${dlt<0?"−":"+"} ${Math.abs(dlt)}) = −${a*100} ${dlt<0?"+":"−"} ${a*Math.abs(dlt)} = ${Qtxt(v)}。`);}
  // ── 分數四則 ──
  case "fas": { const a=rfrac(), b=rfrac(); const o=pick(["+","−"]); const v=o==="+"?Qadd(a,b):Qsub(a,b);
    const L=lcm(a.d,b.d);
    return asQ(`${Qmk0(a)} ${o} ${Qmk(b)}`,v,`${o==="−"?"減去一數等於加上它的相反數；":""}通分（公分母 ${L}）：${Qmk0(a)} ${o} ${Qmk(b)} = ${Qtxt(v)}。${v.d>1?"記得約成最簡分數。":""}`);}
  case "fmd": { const a=rfrac(9), b=rfrac(9), c=rfrac(9); const p=Qmul(a,b), v=Qdiv(p,c); if(Math.abs(v.n)>60||v.d>40) return null;
    return asQ(`${Qmk0(a)} × ${Qmk(b)} ÷ ${Qmk(c)}`,v,`除以 ${Qmk(c)} 等於乘以它的倒數 ${Qmk(Qdiv(I(1),c))}。由左往右：${Qmk0(a)} × ${Qmk(b)} = ${Qtxt(p)}，${Qmk0(p)} × ${Qmk(Qdiv(I(1),c))} = ${Qtxt(v)}。`);}
  case "ford": { const a=rfrac(8), b=rfrac(8), c=rfrac(8); const p=Qmul(b,c), v=Qsub(a,p); if(v.d>48) return null;
    return asQ(`${Qmk0(a)} − ${Qmk(b)} × ${Qmk(c)}`,v,`先乘後減：${Qmk0(b)} × ${Qmk(c)} = ${Qtxt(p)}；${Qmk0(a)} − ${Qmk(p)} = ${Qtxt(v)}。`);}
  case "fmix": { const x=mixed(), y=mixed(); if(!x||!y) return null; const o=pick(["+","−"]); const v=o==="+"?Qadd(x.v,y.v):Qsub(x.v,y.v);
    return asQ(`${x.t} ${o} ${y.mk}`,v,`帶分數先化成假分數：${x.t} = ${Qtxt(x.v)}，${y.t} = ${Qtxt(y.v)}；${Qmk0(x.v)} ${o} ${Qmk(y.v)} = ${Qtxt(v)}。`);}
  case "fint": { const d=R(2,9), n=R(1,d-1); if(gcd(n,d)!==1) return null; const a=Qn(sgn()*n,d), kk=d*R(1,4)*sgn(), m=I(nz(-12,12)); const p=Qmul(a,I(kk)), v=Qsub(p,m);
    return asQ(`${Qmk0(a)} × ${Qmk(I(kk))} − ${Qmk(m)}`,v,`先乘：${Qmk0(a)} × ${Qmk(I(kk))} = ${Qtxt(p)}；再減：${Qmk0(p)} − ${Qmk(m)} = ${Qtxt(v)}。`);}
  case "fpar": { const a=rfrac(6), b=rfrac(6), c=rfrac(6); const s=Qadd(a,b); if(!s.n) return null; const v=Qdiv(s,c); if(v.d>36||Math.abs(v.n)>60) return null;
    return asQ(`(${Qmk0(a)} + ${Qmk(b)}) ÷ ${Qmk(c)}`,v,`先算括號：${Qmk0(a)} + ${Qmk(b)} = ${Qtxt(s)}；${Qmk0(s)} ÷ ${Qmk(c)} = ${Qmk0(s)} × ${Qmk(Qdiv(I(1),c))} = ${Qtxt(v)}。`);}
  // ── 綜合挑戰 ──
  case "cpow": { const base=pick([Qn(-1,2),Qn(1,2),Qn(-1,3),Qn(2,3),Qn(-2,3),Qn(-3,2)]), e=base.d===2&&Math.abs(base.n)===1?pick([2,3,4]):pick([2,3]);
    const pw=Qpow(base,e), M=I(base.d**e*R(1,3)*sgn()), x=rfrac(6), y=rfrac(6); const p=Qmul(pw,M), q=Qdiv(Qabs(x),Qabs(y)), v=Qsub(p,q); if(v.d>36) return null;
    return asQ(`${Qmk(base)}^${e} × ${Qmk(M)} − |${Qmk0(x)}| ÷ ${Qmk(Qabs(y))}`,v,`指數：${Qmk(base)}^${e} = ${Qtxt(pw)}；絕對值：|${Qmk0(x)}| = ${Qtxt(Qabs(x))}；乘除：${Qmk0(pw)} × ${Qmk(M)} = ${Qtxt(p)}，${Qtxt(Qabs(x))} ÷ ${Qmk(Qabs(y))} = ${Qtxt(q)}；最後 ${Qmk0(p)} − ${Qmk(q)} = ${Qtxt(v)}。`);}
  case "cdist": { const d1=pick([2,3,4,5,6,8]), d2=pick([3,4,6,8,12]); if(d1===d2) return null; const n1=R(1,d1-1), n2=R(1,d2-1); if(gcd(n1,d1)!==1||gcd(n2,d2)!==1) return null;
    const N=I(-lcm(d1,d2)*R(1,3)), a=Qn(n1,d1), b=Qn(n2,d2), s=Qadd(a,b), v=Qmul(s,N);
    return asQ(`${Qmk0(a)} × ${Qmk(N)} + ${Qmk(b)} × ${Qmk(N)}`,v,`利用分配律：(${Qmk0(a)} + ${Qmk(b)}) × ${Qmk(N)} = ${Qtxt(s)} × ${Qmk(N)} = ${Qtxt(v)}。（也可分別相乘：${Qtxt(Qmul(a,N))} + ${Qmk(Qmul(b,N))}）`);}
  case "cneg1": { const n1=R(2020,2035), n2=R(2020,2035), kk=R(2,9), k2=R(2,9); const p1=n1%2?-1:1, p2=n2%2?-1:1; const v=I(p1-p2*kk+k2);
    return asQ(`(−1)^{${n1}} − (−1)^{${n2}} × ${kk} + |−${k2}|`,v,`(−1) 的奇數次方 = −1、偶數次方 = 1：(−1)^{${n1}} = ${p1<0?"−1":"1"}，(−1)^{${n2}} = ${p2<0?"−1":"1"}；${p1<0?"−1":"1"} − ${Qmk(I(p2*kk))} + ${k2} = ${Qtxt(v)}。`);}
  case "cnest": { const b=R(2,4), c=I(nz(-9,9)), d=I(nz(-9,9)), f=rfrac(5); const s=Qadd(c,d); if(!s.n) return null; const p=Qmul(I(-b*b),s), v=Qdiv(p,f); if(v.d>30) return null;
    return asQ(`−${b}^2 × [${Qmk0(c)} + ${Qmk(d)}] ÷ ${Qmk(f)}`,v,`−${b}^2 = −${b*b}；中括號：${Qmk0(c)} + ${Qmk(d)} = ${Qtxt(s)}；由左往右：−${b*b} × ${Qmk(s)} = ${Qtxt(p)}，${Qmk0(p)} ÷ ${Qmk(f)} = ${Qtxt(v)}。`);}
  case "cabs": { const a=rfrac(8), b=rfrac(8), c=I(R(2,4)); const s=Qsub(a,b), v=Qmul(Qabs(s),Qn(-c.n)); if(v.d>40||!s.n) return null;
    return asQ(`|${Qmk0(a)} − ${Qmk(b)}| × (−${c.n})`,v,`絕對值內：${Qmk0(a)} − ${Qmk(b)} = ${Qtxt(s)}，|${Qtxt(s)}| = ${Qtxt(Qabs(s))}；${Qtxt(Qabs(s))} × (−${c.n}) = ${Qtxt(v)}。`);}
  }
  return null;
}

const TOPICS={
  ops:{t:"四則運算",icon:"➗",lv:"國一",modes:OMODES,gen:genOps,tip:"建議順序：整數加減 → 整數乘除與指數 → 整數四則混合 → 分數四則 → 綜合挑戰。"},
  gcd:{t:"公因數與公倍數",icon:"🔢",lv:"國一～國三",modes:DMODES,gen:genQ,tip:"建議順序：標準分解式 → 最大公因數與最小公倍數 → 性質與關係 → 會考應用題 → 公因式 → 會考挑戰。"}
};
function multOf(s){return s>=10?3:s>=5?2:s>=3?1.5:1}
function drillStats(){S.drill=S.drill||{};return S.drill}
const skey=(tp,m)=>tp==="gcd"?m:`${tp}:${m}`;
function drillHome(){
  const st=drillStats();
  $("#app").innerHTML=`${subjBar()}
  <section class="hero"><h1>⚡ 特別練習區</h1><p>題目由程式隨機產生、做不完，適合大量練習。連續答對越多，點數加成越高！</p>
  <div class="rules" style="margin-top:10px">每題答對 <b>10 點</b>，連對加成：<br>連對 3 題 <b>×1.5</b>｜連對 5 題 <b>×2</b>｜連對 10 題 <b>×3</b><br>一回 10 題全對，再加 <b>50 點</b>。答錯連對歸零。</div></section>
  ${Object.entries(TOPICS).map(([tp,T])=>`<div class="dcard"><h3>${T.icon} ${T.t}（${T.lv}）</h3>
    <div class="modes">${Object.entries(T.modes).map(([k,m])=>{const s=st[skey(tp,k)]||{};return `<button class="mode" data-t="${tp}" data-m="${k}"><b>${m.n}</b><small>${m.g}・${m.d}</small><span class="st">${s.n?`已練 ${s.n} 題・答對 ${s.ok}・最高連對 ${s.best||0}`:"開始練習 ›"}</span></button>`}).join("")}</div>
    <p class="hint">${T.tip}</p></div>`).join("")}`;
  document.querySelectorAll(".mode").forEach(b=>b.onclick=()=>{S.dtopic=b.dataset.t;S.dmode=b.dataset.m;save();startDrill(b.dataset.t,b.dataset.m)});
  bindSubj(); window.scrollTo(0,0);
}
function startDrill(tp,mode){
  if(!TOPICS[tp]) tp="ops";
  const T=TOPICS[tp]; if(!T.modes[mode]) mode=Object.keys(T.modes)[0];
  kpClose(); cur=null; mcur=null; location.hash="drill-"+tp;
  dcur={tp,mode,i:0,n:10,ok:0,streak:0,earned:0,q:T.gen(mode),ans:null};
  renderDrill(); window.scrollTo(0,0);
}
function renderDrill(){
  const d=dcur, T=TOPICS[d.tp], M=T.modes[d.mode], q=d.q, m=multOf(d.streak), done=d.i>=d.n;
  let h=`<button class="back" id="back">‹ 特別練習區</button>
    <h2 class="ptitle">${T.t}・${M.n}</h2><p class="psub">${M.g}・本回已得 ${d.earned} 點</p>
    <div class="dbar"><div class="dprog"><i style="width:${Math.min(d.i,d.n)/d.n*100}%"></i></div><span class="mult ${m>1?"hot":""}">加成 ×${m}</span></div>
    <div class="streak">🔥 連對 ${d.streak} 題　｜　第 ${Math.min(d.i+1,d.n)} / ${d.n} 題</div>`;
  if(done){
    h+=`<div class="sum"><div><div class="big">${d.ok} / ${d.n}</div><div class="s">本回得 ${d.earned} 點${d.ok===d.n?"（含全對獎勵 50）":""}</div></div></div>
      <button class="nextb" id="again">再來一回 ▶</button>`;
  }else{
    const a=d.ans;
    h+=`<div class="q"><div class="qh"><span style="font-size:${q.q.length<40?"19px":"inherit"}">${fmt(q.q)}</span></div>`;
    if(q.t==="num"){
      h+=`<div class="nrow"><div class="nin ${a?(a.ok?"ok":"bad"):"act"}" data-n="d">${a?fmt(ansMarkup(a.v)):(kpVal?fmt(ansMarkup(kpVal)):"")}${a?"":'<span class="caret"></span>'}</div>${q.unit?`<span class="nunit">${esc(q.unit)}</span>`:""}</div><div class="nmsg" id="nmsgd"></div>`;
    }else{
      const ord=d.ord||(d.ord=order(q.opts.length,String(Math.random())));
      ord.forEach((oi,pos)=>{let c=""; if(a){ if(oi===0) c="ok"; else if(oi===a.pick) c="bad"; }
        h+=`<button class="opt ${c}" data-o="${oi}" ${a?"disabled":""}><span class="k">${KEYS[pos]}</span><span>${fmt(q.opts[oi])}</span></button>`;});
    }
    if(a) h+=`<div class="exp">${a.ok?`<b class="okc">答對了！+${a.pts} 點</b>`:`<b class="badc">正確答案：${fmt(ansMarkup(q.t==="num"?q.ans:q.opts[0]))}${q.unit?" "+esc(q.unit):""}</b>`}<br>${fmt(q.exp)}</div>`;
    h+=`</div>`;
    if(a) h+=`<button class="nextb" id="next">${d.i+1>=d.n?"看結果":"下一題 ▶"}</button>`;
  }
  $("#app").innerHTML=h;
  $("#back").onclick=()=>{S.subj="drill";home()};
  const ag=$("#again"); if(ag) ag.onclick=()=>startDrill(d.tp,d.mode);
  const nx=$("#next"); if(nx) nx.onclick=()=>{d.i++; if(d.i<d.n){d.q=T.gen(d.mode);d.ans=null;d.ord=null;} else if(d.ok===d.n){d.earned+=50;addPoints(50,"全對獎勵！");}
    renderDrill(); window.scrollTo(0,0); if(d.i<d.n&&d.q.t==="num"){kpQ="d";kpVal="";kpOpen();}};
  document.querySelectorAll(".opt[data-o]").forEach(b=>b.onclick=()=>drillAnswer({pick:+b.dataset.o,ok:+b.dataset.o===0}));
  const box=document.querySelector('.nin[data-n="d"]'); if(box&&!d.ans) box.onclick=()=>{kpQ="d";kpOpen()};
  if(!done&&!d.ans&&q.t==="num"){kpQ="d";kpOpen();}
}
function drillAnswer(res){
  const d=dcur; if(d.ans) return;
  const st=drillStats(), key=skey(d.tp,d.mode), s=st[key]||(st[key]={n:0,ok:0,best:0}); s.n++;
  if(res.ok){ d.streak++; d.ok++; s.ok++; s.best=Math.max(s.best,d.streak); const pts=Math.round(10*multOf(d.streak)); res.pts=pts; d.earned+=pts; save(); addPoints(pts,d.streak>=3?`連對 ${d.streak}！`:"答對了！"); }
  else { d.streak=0; save(); }
  d.ans=res; renderDrill();
}
function drillNum(){
  const v=parseNum(kpVal), msg=t=>{const e=$("#nmsgd"); if(e) e.textContent=t;};
  if(!v){msg(kpVal?"格式看不懂，請再檢查一下（分數用 /，帶分數用「又」，負號按「負 −」）":"請先輸入答案");return;}
  const ans=parseNum(dcur.q.ans), ok=sameVal(v,ans);
  if(ok&&(v.kind==="frac"||v.kind==="mixed")&&gcd(v.fa,v.fb)!==1){msg("答案的值對了，但請約分成最簡分數再按確定");return;}
  if(ok&&v.kind==="mixed"&&v.fa>=v.fb){msg("帶分數的分數部分要小於分母，請再化簡");return;}
  const val=kpVal; kpClose(); drillAnswer({v:val,ok});
}

// ───────── 🎁 點數兌換 3C 時間＋得點／扣點紀錄 ─────────
let wv=null, wf="all", wlim=120, wdone=null;
const WD="日一二三四五六";
function p2(n){return String(n).padStart(2,"0")}
function dayKey(t){const d=new Date(t);return `${d.getFullYear()}/${p2(d.getMonth()+1)}/${p2(d.getDate())}`}
function dayLabel(t){const d=new Date(t), k=dayKey(t), today=dayKey(Date.now()), yest=dayKey(Date.now()-864e5);
  return (k===today?"今天 ":k===yest?"昨天 ":"")+`${d.getMonth()+1}/${d.getDate()}（${WD[d.getDay()]}）`+(d.getFullYear()!==new Date().getFullYear()?` ${d.getFullYear()}`:"");}
function hm(t){const d=new Date(t);return `${p2(d.getHours())}:${p2(d.getMinutes())}`}
function minTxt(m){return m>=60?`${m} 分鐘（${Math.floor(m/60)} 小時${m%60?` ${m%60} 分`:""}）`:`${m} 分鐘`}
function openWallet(view){
  stopReading(); closeSheet(); kpClose(); cur=null; mcur=null; dcur=null; scur=null; qz=null;
  if(view) wv=view; else if(!wv) wv="rdm";
  if(view) wdone=null;
  location.hash="wallet"; renderWallet(); window.scrollTo(0,0);
}
function walletSum(){let e=0,s=0,m=0; S.log.forEach(x=>{ if(x.n>0) e+=x.n; else s-=x.n; if(x.k==="redeem") m+=x.m||0; }); return {e,s,m};}
function renderWallet(){
  const sm=walletSum();
  let h=`<button class="back" id="back">‹ 回到練習</button>
  <h2 class="ptitle">🎁 我的點數</h2><p class="psub">${EDN.name}・${EDN.who}</p>
  <div class="wbal ${ED}"><div><span>${EDN.who}</span><b>${S.pts}</b></div><div class="wbr">可換 <b>${Math.floor(S.pts/RATE)}</b> 分鐘<small>${RATE} 點 = 1 分鐘</small></div></div>
  <div class="tabs"><button class="tab ${wv==="rdm"?"on":""}" data-w="rdm">🎮 兌換 3C 時間</button><button class="tab ${wv==="hist"?"on":""}" data-w="hist">📜 得點／扣點紀錄</button></div>`;
  if(wv==="rdm"){
    if(wdone) h+=`<div class="wdone"><div class="wd1">✅ 兌換成功</div><div class="wd2">${minTxt(wdone.min)}</div>
      <div class="wd3">扣除 ${wdone.use} 點・剩下 ${S.pts} 點<br>${dayLabel(wdone.t)} ${hm(wdone.t)}</div><div class="wd4">請把這個畫面給爸媽看 👀</div></div>`;
    h+=`<div class="wcard">
      <label class="wlab" for="wIn">要使用多少點？</label>
      <div class="winrow"><input id="wIn" type="number" inputmode="numeric" min="${RATE}" step="${RATE}" placeholder="輸入點數，例如 100" autocomplete="off"><span>點</span></div>
      <div class="wchips">${[25,50,100,150,300].map(v=>`<button data-v="${v}">${v}</button>`).join("")}<button data-v="all">全部</button></div>
      <div class="wcalc" id="wCalc">輸入點數後，這裡會算出可以換幾分鐘。</div>
      <button class="nextb" id="wGo" disabled>計算好了，兌換 ▶</button>
      <div id="wCf"></div></div>`;
    const rs=S.log.filter(x=>x.k==="redeem").slice(-5).reverse();
    if(rs.length) h+=`<h3 class="wh">最近的兌換</h3><div class="hlist">${rs.map(x=>`<div class="hrow"><div class="ht">${dayLabel(x.t)}<br>${hm(x.t)}</div><div class="hr">${esc(x.r)}</div><div class="hn neg">−${-x.n}</div></div>`).join("")}</div>`;
  }else{
    h+=`<div class="wsum"><div><b class="pos">+${sm.e}</b><small>累計得點</small></div><div><b class="neg">−${sm.s}</b><small>累計扣點</small></div><div><b>${sm.m}</b><small>已換分鐘</small></div></div>
      <div class="wf">${[["all","全部"],["earn","得點"],["spend","扣點"]].map(([k,t])=>`<button class="${wf===k?"on":""}" data-f="${k}">${t}</button>`).join("")}</div>`;
    const L=S.log.filter(x=>wf==="all"||(wf==="earn"?x.n>0:x.n<0)).slice().reverse();
    if(!L.length) h+=`<p class="hint">還沒有${wf==="spend"?"扣點":wf==="earn"?"得點":""}紀錄。</p>`;
    else{
      const shown=L.slice(0,wlim), days=new Map();
      shown.forEach(x=>{const k=dayKey(x.t); if(!days.has(k)) days.set(k,[]); days.get(k).push(x);});
      const tot={}; L.forEach(x=>{const k=dayKey(x.t); const o=tot[k]||(tot[k]={e:0,s:0}); if(x.n>0)o.e+=x.n; else o.s-=x.n;});
      days.forEach((arr,k)=>{const o=tot[k];
        h+=`<div class="hday"><span>${dayLabel(arr[0].t)}</span><span>${o.e?`<b class="pos">+${o.e}</b>`:""}${o.e&&o.s?"　":""}${o.s?`<b class="neg">−${o.s}</b>`:""}</span></div><div class="hlist">`+
          arr.map(x=>`<div class="hrow ${x.k||""}"><div class="ht">${hm(x.t)}</div><div class="hr">${x.k==="redeem"?"🎮 ":x.k==="reset"?"⚠️ ":x.k==="in"?"📦 ":""}${esc(x.r||"")}<small>餘 ${x.b}</small></div><div class="hn ${x.n>0?"pos":"neg"}">${x.n>0?"+":"−"}${Math.abs(x.n)}</div></div>`).join("")+`</div>`;});
      if(L.length>wlim) h+=`<button class="mbtn" id="wMore" style="margin-top:10px">顯示更早的紀錄（還有 ${L.length-wlim} 筆）</button>`;
    }
  }
  $("#app").innerHTML=h;
  $("#back").onclick=home;
  document.querySelectorAll(".tab[data-w]").forEach(b=>b.onclick=()=>{wv=b.dataset.w;wdone=null;renderWallet();});
  document.querySelectorAll(".wf button").forEach(b=>b.onclick=()=>{wf=b.dataset.f;wlim=120;renderWallet();});
  const mo=$("#wMore"); if(mo) mo.onclick=()=>{wlim+=200;keepY(renderWallet)};
  const inp=$("#wIn"); if(!inp) return;
  const calc=()=>{
    const v=Math.floor(+inp.value||0), c=$("#wCalc"), go=$("#wGo"); $("#wCf").innerHTML="";
    const m=Math.floor(v/RATE), use=m*RATE; let ok=false;
    if(!v) c.innerHTML="輸入點數後，這裡會算出可以換幾分鐘。";
    else if(v<0) c.innerHTML=`<span class="badc">請輸入正數</span>`;
    else if(m<1) c.innerHTML=`<span class="badc">至少要 ${RATE} 點才能換 1 分鐘</span>`;
    else if(use>S.pts) c.innerHTML=`<span class="badc">點數不夠：目前只有 ${S.pts} 點（最多換 ${Math.floor(S.pts/RATE)} 分鐘）</span>`;
    else{ ok=true; c.innerHTML=`${v} 點 ÷ ${RATE} = <b class="big">${minTxt(m)}</b><br>將扣除 <b>${use}</b> 點，兌換後剩 <b>${S.pts-use}</b> 點`+(v%RATE?`<br><small>不足 ${RATE} 點的 ${v%RATE} 點不會扣</small>`:""); }
    go.disabled=!ok; go.dataset.m=ok?m:"";
  };
  inp.oninput=calc;
  document.querySelectorAll(".wchips button").forEach(b=>b.onclick=()=>{inp.value=b.dataset.v==="all"?Math.floor(S.pts/RATE)*RATE:b.dataset.v; calc();});
  $("#wGo").onclick=()=>{const m=+$("#wGo").dataset.m; if(!m) return; const use=m*RATE;
    $("#wCf").innerHTML=`<div class="wconf"><div>確定要用 <b>${use} 點</b>兌換 <b>${minTxt(m)}</b> 的 3C 時間嗎？<br><small>確認後會從${EDN.who}扣除，無法復原。</small></div>
      <div class="wcb"><button id="wNo">取消</button><button id="wYes">✅ 確認兌換</button></div></div>`;
    $("#wNo").onclick=()=>{$("#wCf").innerHTML=""};
    $("#wYes").onclick=()=>{ if(use>S.pts){calc();return;}
      S.pts-=use; logPush(-use,`兌換 3C 時間 ${m} 分鐘`,"redeem"); S.log[S.log.length-1].m=m; save(); updatePills();
      wdone={min:m,use,t:Date.now()}; renderWallet(); window.scrollTo(0,0); };
    setTimeout(()=>{const e=$("#wCf"); if(e) e.scrollIntoView({block:"center",behavior:"smooth"})},30);
  };
}

// ───────── 🌏 國中社會：段考特別複習 ─────────
let scur=null, stab="key", qz=null, sOnlyWeak=false;
const SOPEN=new Set();
function sst(){S.soc=S.soc||{u:{},wrong:{},mock:{}};return S.soc}
function srec(id){const s=sst();return s.u[id]||(s.u[id]={a:{},paid:{},c:{}})}
function sfmt(s){return esc(String(s)).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>").replace(/\n/g,"<br>")}
function socStats(u){const r=sst().u[u.id]||{a:{},c:{}};const a=Object.values(r.a);
  return {done:a.length, ok:a.filter(x=>x.ok).length, known:Object.values(r.c||{}).filter(v=>v===1).length};}
function wrongKeys(){const w=sst().wrong; return Object.keys(w).filter(k=>{const [id,qi]=k.split(":");const u=SOC.units.find(x=>x.id===id);return u&&u.qs[+qi];});}
function socHome(){
  const units=SOC.units, wk=wrongKeys(), mk=sst().mock||{};
  const grp=[...new Set(units.map(u=>u.sub))];
  $("#app").innerHTML=`${subjBar()}
  <section class="hero"><h1>🌏 ${esc(SOC.title||"社會複習")}</h1><p>${esc(SOC.desc||"")}</p>
  <div class="rules" style="margin-top:10px">選擇題每題首次答對 <b>+10</b>｜模擬考每題答對 <b>+5</b>，100 分再 <b>+50</b>｜錯題本答對 <b>+3</b><br>問答卡用來背誦，自己判斷「會了／還不熟」，不計點。</div></section>
  <div class="sacts">
    <button class="sact mock" id="sMock"><b>📝 段考模擬考</b><small>從選定單元隨機抽 20 題，算分數${mk.best!=null?`・最高 ${mk.best} 分`:""}</small></button>
    <button class="sact wrong" id="sWrong" ${wk.length?"":"disabled"}><b>❌ 錯題本</b><small>${wk.length?`還有 ${wk.length} 題要訂正`:"目前沒有錯題 👍"}</small></button>
  </div>
  ${grp.map(g=>`<h3 class="sgrp">${g==="地理"?"🗺️":"📜"} ${esc(g)}</h3><div class="plist">${units.filter(u=>u.sub===g).map(u=>{const s=socStats(u);return `
    <button class="pcard" data-id="${u.id}">
      <div class="pnum snum ${u.sub==="歷史"?"his":""}">${esc(u.no||"")}</div>
      <div class="pinfo"><div class="t">${esc(u.title)}${u.star?'<span class="star">★ 二段重點</span>':""}</div><div class="z">${esc(u.range||"")}</div>
        <div class="badges"><span class="bdg ${s.done===u.qs.length?"done":""}">✅ 選擇題 ${s.ok}/${u.qs.length}</span>${(u.cards||[]).length?`<span class="bdg ${s.known===u.cards.length?"done":""}">🃏 問答卡 ${s.known}/${u.cards.length}</span>`:""}</div></div>
      <div class="chev">›</div></button>`}).join("")}</div>`).join("")}
  ${SOC.note?`<p class="hint">${esc(SOC.note)}</p>`:""}`;
  document.querySelectorAll(".pcard").forEach(b=>b.onclick=()=>{stab="key";openSoc(b.dataset.id)});
  $("#sMock").onclick=mockPick; const sw=$("#sWrong"); if(sw) sw.onclick=startWrong;
  bindSubj(); window.scrollTo(0,0);
}
function openSoc(id){
  stopReading(); closeSheet(); kpClose(); cur=null; mcur=null; dcur=null; qz=null; wv=null;
  scur=SOC.units.find(u=>u.id===id); if(!scur) return home(); S.subj="soc";
  location.hash="soc-"+id; SOPEN.clear(); renderSoc(); window.scrollTo(0,0);
}
function renderSoc(){
  const u=scur, r=srec(u.id), s=socStats(u), cards=u.cards||[];
  let h=`<button class="back" id="back">‹ 社會複習</button>
    <h2 class="ptitle">${esc(u.title)}</h2><p class="psub">${esc(u.sub)}・${esc(u.range||"")}${u.star?"・★ 第二次段考重點":""}</p>
    <div class="tabs"><button class="tab ${stab==="key"?"on":""}" data-s="key">📌 重點</button><button class="tab ${stab==="qs"?"on":""}" data-s="qs">✅ 選擇題 ${s.ok}/${u.qs.length}</button>${cards.length?`<button class="tab ${stab==="card"?"on":""}" data-s="card">🃏 問答卡</button>`:""}</div>`;
  if(stab==="key"){
    (u.key||[]).forEach(sec=>{ h+=`<div class="keyc"><h3>${sfmt(sec.h)}</h3><ul>${sec.pts.map(p=>`<li>${sfmt(p)}</li>`).join("")}</ul></div>`; });
    if(u.table) u.table.forEach(t=>{h+=`<div class="keyc stbl"><h3>${sfmt(t.h)}</h3><div class="tw"><table><tr>${t.rows[0].map(c=>`<th>${sfmt(c)}</th>`).join("")}</tr>${t.rows.slice(1).map(rw=>`<tr>${rw.map(c=>`<td>${sfmt(c)}</td>`).join("")}</tr>`).join("")}</table></div></div>`;});
    h+=`<button class="nextb" id="toQs">讀完了，去做選擇題 ▶</button>`;
  }else if(stab==="qs"){
    if(s.done===u.qs.length) h+=`<div class="sum"><div><div class="big">${s.ok} / ${u.qs.length}</div><div class="s">本單元完成${s.ok<u.qs.length?"・答錯的題目在錯題本":""}</div></div><button id="redo">重新練習</button></div>`;
    u.qs.forEach((q,qi)=>{const a=r.a[qi], ord=order(q.opts.length,u.id+"s"+qi);
      h+=`<div class="q" id="sq${qi}"><div class="qh"><span class="n">${qi+1}.</span><span>${sfmt(q.q)}</span></div>`;
      ord.forEach((oi,pos)=>{let c=""; if(a){ if(oi===0) c="ok"; else if(oi===a.pick) c="bad"; }
        h+=`<button class="opt ${c}" data-q="${qi}" data-o="${oi}" ${a?"disabled":""}><span class="k">${KEYS[pos]}</span><span>${sfmt(q.opts[oi])}</span></button>`;});
      if(a) h+=`<div class="exp">${a.ok?'<b class="okc">答對了！</b>':'<b class="badc">正確答案是 '+KEYS[ord.indexOf(0)]+'。</b>'} ${sfmt(q.exp||"")}</div>`;
      h+=`</div>`;});
  }else{
    const weak=cards.map((c,ci)=>ci).filter(ci=>r.c[ci]!==1);
    h+=`<div class="lookbar"><button class="tg ${sOnlyWeak?"on":""}" id="weakTg">🎯 只看還不熟：${sOnlyWeak?"開":"關"}</button><span class="hint">已會 ${s.known}/${cards.length}。先想答案，再點「看答案」。</span></div>`;
    const list=sOnlyWeak?weak:cards.map((c,ci)=>ci);
    if(!list.length) h+=`<p class="hint">全部都會了！🎉 可以關掉「只看還不熟」再複習一次。</p>`;
    list.forEach(ci=>{const c=cards[ci], open=SOPEN.has(ci), st=r.c[ci];
      h+=`<div class="q scard ${st===1?"known":st===0?"weak":""}"><div class="qh"><span class="n">${ci+1}.</span><span>${sfmt(c.q)}</span></div>
        ${open?`<div class="exp">${sfmt(c.a)}</div><div class="cbtn"><button class="cw ${st===0?"on":""}" data-c="${ci}" data-v="0">還不熟</button><button class="ck ${st===1?"on":""}" data-c="${ci}" data-v="1">✓ 我會了</button></div>`
        :`<button class="reveal" data-c="${ci}">👀 看答案</button>`}</div>`;});
  }
  $("#app").innerHTML=h;
  $("#back").onclick=()=>{S.subj="soc";home()};
  document.querySelectorAll(".tab[data-s]").forEach(b=>b.onclick=()=>{stab=b.dataset.s;renderSoc();window.scrollTo(0,0)});
  const tq=$("#toQs"); if(tq) tq.onclick=()=>{stab="qs";renderSoc();window.scrollTo(0,0)};
  document.querySelectorAll(".opt[data-q]").forEach(b=>b.onclick=()=>{const qi=+b.dataset.q, oi=+b.dataset.o;
    if(r.a[qi]) return; const ok=oi===0; r.a[qi]={pick:oi,ok}; const k=u.id+":"+qi;
    if(ok) delete sst().wrong[k]; else sst().wrong[k]=1;
    const first=!r.paid[qi]; r.paid[qi]=true; save(); if(ok&&first) addPoints(10,"答對了！"); keepY(renderSoc);});
  const rd=$("#redo"); if(rd) rd.onclick=()=>{r.a={};save();renderSoc();window.scrollTo(0,0)};
  const wt=$("#weakTg"); if(wt) wt.onclick=()=>{sOnlyWeak=!sOnlyWeak;keepY(renderSoc)};
  document.querySelectorAll(".reveal").forEach(b=>b.onclick=()=>{SOPEN.add(+b.dataset.c);keepY(renderSoc)});
  document.querySelectorAll(".cbtn button").forEach(b=>b.onclick=()=>{r.c[+b.dataset.c]=+b.dataset.v;save();keepY(renderSoc)});
}
// 模擬考／錯題本（一次一題）
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function mockPick(){
  scur=null; qz={mode:"pick"}; location.hash="soc-quiz";
  const sel=sst().mockSel||SOC.units.filter(u=>u.star).map(u=>u.id);
  $("#app").innerHTML=`<button class="back" id="back">‹ 社會複習</button>
  <h2 class="ptitle">📝 段考模擬考</h2><p class="psub">勾選要考的單元（預設為 ★ 第二次段考重點）</p>
  <div class="spick">${SOC.units.map(u=>`<label class="sch"><input type="checkbox" value="${u.id}" ${sel.includes(u.id)?"checked":""}><span>${esc(u.sub)}｜${esc(u.title)}${u.star?" ★":""}<small>${u.qs.length} 題</small></span></label>`).join("")}</div>
  <div class="wf" style="margin-top:12px"><span style="align-self:center;color:var(--muted);font-weight:700;font-size:14px">題數</span>${[10,20,30].map(n=>`<button class="${(sst().mockN||20)===n?"on":""}" data-n="${n}">${n} 題</button>`).join("")}</div>
  <p class="nmsg" id="pmsg"></p>
  <button class="nextb" id="goMock">開始考試 ▶</button>`;
  $("#back").onclick=()=>{S.subj="soc";home()};
  document.querySelectorAll(".wf button").forEach(b=>b.onclick=()=>{sst().mockN=+b.dataset.n;save();document.querySelectorAll(".wf button").forEach(x=>x.classList.toggle("on",x===b))});
  $("#goMock").onclick=()=>{
    const ids=[...document.querySelectorAll(".spick input:checked")].map(x=>x.value);
    if(!ids.length){$("#pmsg").textContent="請至少勾選一個單元";return;}
    sst().mockSel=ids; save();
    const pool=[]; SOC.units.filter(u=>ids.includes(u.id)).forEach(u=>u.qs.forEach((q,qi)=>pool.push([u.id,qi])));
    const n=Math.min(sst().mockN||20,pool.length);
    qz={mode:"mock",list:shuffle(pool).slice(0,n),i:0,ok:0,earned:0,ans:null,miss:[]}; renderQz(); window.scrollTo(0,0);
  };
  window.scrollTo(0,0);
}
function startWrong(){
  const list=shuffle(wrongKeys().map(k=>{const [id,qi]=k.split(":");return [id,+qi]}));
  if(!list.length) return;
  scur=null; location.hash="soc-quiz";
  qz={mode:"wrong",list,i:0,ok:0,earned:0,ans:null,miss:[]}; renderQz(); window.scrollTo(0,0);
}
function renderQz(){
  const z=qz, n=z.list.length, done=z.i>=n, mock=z.mode==="mock";
  let h=`<button class="back" id="back">‹ 社會複習</button><h2 class="ptitle">${mock?"📝 段考模擬考":"❌ 錯題本"}</h2>
    <p class="psub">${mock?`每題 ${Math.round(100/n*10)/10} 分`:"答對就從錯題本移除"}・已得 ${z.earned} 點</p>
    <div class="dbar"><div class="dprog"><i style="width:${Math.min(z.i,n)/n*100}%"></i></div><span class="mult">${Math.min(z.i+1,n)} / ${n}</span></div>`;
  if(done){
    const score=Math.round(z.ok/n*100);
    h+=`<div class="sum"><div><div class="big">${mock?score+" 分":z.ok+" / "+n}</div><div class="s">答對 ${z.ok} 題・本回得 ${z.earned} 點${mock&&z.ok===n?"（含滿分獎勵 50）":""}</div></div></div>`;
    if(z.miss.length) h+=`<p class="hint">答錯的 ${z.miss.length} 題已放進錯題本，記得回去訂正。</p>`;
    h+=`<button class="nextb" id="again">${mock?"再考一次 ▶":"回社會複習"}</button>`;
  }else{
    const [id,qi]=z.list[z.i], u=SOC.units.find(x=>x.id===id), q=u.qs[qi], a=z.ans;
    const ord=z.ord||(z.ord=order(q.opts.length,String(Math.random())));
    h+=`<div class="q"><div class="qtag">${esc(u.sub)}｜${esc(u.title)}</div><div class="qh"><span>${sfmt(q.q)}</span></div>`;
    ord.forEach((oi,pos)=>{let c=""; if(a){ if(oi===0) c="ok"; else if(oi===a.pick) c="bad"; }
      h+=`<button class="opt ${c}" data-o="${oi}" ${a?"disabled":""}><span class="k">${KEYS[pos]}</span><span>${sfmt(q.opts[oi])}</span></button>`;});
    if(a) h+=`<div class="exp">${a.ok?`<b class="okc">答對了！${a.pts?`+${a.pts} 點`:""}</b>`:`<b class="badc">正確答案是 ${KEYS[ord.indexOf(0)]}。</b>`} ${sfmt(q.exp||"")}</div>`;
    h+=`</div>`; if(a) h+=`<button class="nextb" id="next">${z.i+1>=n?"看結果":"下一題 ▶"}</button>`;
  }
  $("#app").innerHTML=h;
  $("#back").onclick=()=>{S.subj="soc";home()};
  const ag=$("#again"); if(ag) ag.onclick=()=>{ if(mock) mockPick(); else {S.subj="soc";home();} };
  const nx=$("#next"); if(nx) nx.onclick=()=>{z.i++; z.ans=null; z.ord=null;
    if(z.i>=n){ if(mock){ const sc=Math.round(z.ok/n*100); const m=sst().mock||(sst().mock={}); m.best=Math.max(m.best||0,sc); m.n=(m.n||0)+1; if(z.ok===n&&n>=10){z.earned+=50; addPoints(50,"模擬考滿分！");} save(); } }
    renderQz(); window.scrollTo(0,0);};
  document.querySelectorAll(".opt[data-o]").forEach(b=>b.onclick=()=>{ if(z.ans) return;
    const oi=+b.dataset.o, ok=oi===0, [id,qi]=z.list[z.i], k=id+":"+qi, res={pick:oi,ok};
    if(ok){ z.ok++; const p=mock?5:3; res.pts=p; z.earned+=p; delete sst().wrong[k]; save(); addPoints(p,mock?"模擬考答對":"錯題訂正"); }
    else { sst().wrong[k]=1; z.miss.push(k); save(); }
    z.ans=res; keepY(renderQz); });
}

$("#ptsBtn").onclick=()=>openWallet("hist");
$("#rdmBtn").onclick=()=>openWallet("rdm");

// routing
function route(){const id=location.hash.slice(1);
  if(id&&PASSAGES.some(p=>p.id===id)){ if(!cur||cur.id!==id) openPassage(id,"read"); }
  else if(id&&MATH.some(u=>u.id===id)){ if(!mcur||mcur.id!==id) openUnit(id); }
  else if(id.startsWith("drill-")&&ED==="jh"){ if(!dcur) startDrill(id.slice(6),S.dmode); }
  else if(id==="wallet"){ if(!wv) openWallet(); }
  else if(id.startsWith("soc-")&&ED==="jh"){ const u=SOC.units.find(x=>"soc-"+x.id===id); if(u&&(!scur||scur.id!==u.id)) openSoc(u.id); else if(!u&&!qz) home(); }
  else if(cur||mcur||dcur||scur||qz||wv) home();}
window.addEventListener("hashchange",route);
$("#app").innerHTML='<div class="loading">載入題庫中…</div>';
loadContent().then(()=>{
  if(!PASSAGES.length){$("#app").innerHTML='<div class="loading">題庫載入失敗，請連上網路後重新開啟。</div>';return;}
  if(S.cver&&CONTENT.version>S.cver) setTimeout(()=>addPoints(0,"題庫已更新！"),600);
  if(!S.cver) S.seen=PASSAGES.map(p=>p.id);
  S.cver=CONTENT.version; save();
  const startId=location.hash.slice(1);
  if(S.mver&&MATHV>S.mver) setTimeout(()=>addPoints(0,"數學題庫已更新！"),900);
  if(!S.mver) S.mseen=MATH.map(u=>u.id);
  S.mver=MATHV; save();
  if(startId&&PASSAGES.some(p=>p.id===startId)) openPassage(startId,"read");
  else if(startId&&MATH.some(u=>u.id===startId)) openUnit(startId);
  else if(startId.startsWith("drill-")&&ED==="jh"){S.subj="drill";startDrill(startId.slice(6),S.dmode);}
  else if(startId==="wallet") openWallet();
  else if(startId.startsWith("soc-")&&ED==="jh"&&SOC.units.some(u=>"soc-"+u.id===startId)){S.subj="soc";openSoc(startId.slice(4));}
  else home();
});
if("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(()=>{});
try{localStorage.setItem("eng-edition",ED)}catch(e){}

// 換頁時更新「目前累積到誰」的點數標示
["home","openPassage","openUnit","renderDrill","openWallet","openSoc"].forEach(fn=>{const f=window[fn]; window[fn]=function(){const r=f.apply(this,arguments); updatePills(); return r;};});
updatePills();
