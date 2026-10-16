let lang='en';const T=(e,a)=>lang==='ar'?a:e;const $=i=>document.getElementById(i);
const prof=[.2,.15,.12,.12,.15,.25,.5,.85,1,.8,.6,.55,.6,.65,.6,.65,.8,1,.95,.8,.6,.45,.35,.25];
const CW={motorway:4,trunk:3,primary:2,secondary:1},CC={motorway:'#c2410c',trunk:'#d97706',primary:'#2563eb',secondary:'#64748b'},CT={motorway:5,trunk:4,primary:3,secondary:2};
const EP=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];
const S={tab:'explore',hour:8,mode:'off',hs:[],sel:null,hi:0,gain:[10,10,10,10],roads:[],imps:[],cur:[],notes:'',cand:[],stat:'',tileErr:false};
const map=L.map('map',{zoomControl:true}).setView([21.5433,39.1728],12);
const tl=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);
let tOk=0,tBad=0;
function mapMsg(h){const m=$('mapmsg');if(!h){m.style.display='none';return}m.innerHTML=h;m.style.display='block'}
tl.on('tileload',()=>{tOk++;if(tOk>=2)mapMsg('')});
tl.on('tileerror',()=>{tBad++;if(tOk===0&&tBad>=4){S.tileErr=true;mapMsg(`<b>${T('Map tiles could not load.','تعذّر تحميل بلاط الخريطة.')}</b> ${navigator.onLine?T('The OpenStreetMap tile server may be busy or blocked on this network.','قد يكون خادم بلاط OpenStreetMap مشغولًا أو محجوبًا على هذه الشبكة.'):T('You appear to be offline.','يبدو أنك غير متصل.')}<br><button class="b" onclick="tBad=0;mapMsg('');tl.redraw()">${T('Retry','إعادة المحاولة')}</button>`)}});
window.addEventListener('online',()=>{tBad=0;tl.redraw()});
const roadL=L.layerGroup().addTo(map),ixL=L.layerGroup().addTo(map),hsL=L.layerGroup().addTo(map),prL=L.layerGroup().addTo(map),curL=L.layerGroup().addTo(map);
const OPT=[
{en:'Signal-timing change',ar:'تعديل توقيت الإشارات',get e(){return T('Low','منخفض')},get d(){return T('Low','منخفض')},p:['Fast to trial, no construction, reversible.','سريع التجربة، بلا إنشاءات، قابل للتراجع.'],c:['Only helps signalised junctions.','يفيد التقاطعات المُشارة فقط.']},
{en:'Intersection redesign',ar:'إعادة تصميم التقاطع',get e(){return T('High','مرتفع')},get d(){return T('High','مرتفع')},p:['Can remove conflicting movements.','قد يزيل الحركات المتعارضة.'],c:['Construction disruption; land and utilities impacts.','تعطيل أثناء الإنشاء؛ أثر على الأراضي والمرافق.']},
{en:'Additional lane',ar:'مسار إضافي',get e(){return T('Medium','متوسط')},get d(){return T('Medium','متوسط')},p:['Adds link capacity.','يزيد سعة الرابط.'],c:['May move the bottleneck downstream or induce traffic.','قد ينقل الاختناق أو يولّد مرورًا.']},
{en:'Proposed connecting road',ar:'طريق ربط مقترح',get e(){return T('High','مرتفع')},get d(){return T('Medium–High','متوسط–مرتفع')},p:['Adds route choice across the network.','يضيف خيارات للمسار.'],c:['Land, environment and cost unknowns; new junctions add conflicts.','أراضٍ وبيئة وتكلفة مجهولة؛ التقاطعات الجديدة تضيف تعارضات.']}];
const hash=id=>{const x=Math.sin((id%100003)*12.9898)*43758.5453;return x-Math.floor(x)};
const val=(c,h=S.hour)=>Math.min(100,Math.round(c.w*14*(.4+.6*c.h)*prof[h]));
const colr=v=>v<40?'#1f9d68':v<70?'#e8a20c':'#d63b3b';
const nmOf=n=>n||T('unnamed road','طريق بدون اسم');

async function loadRoads(){
 if(map.getZoom()<13){S.stat=T('Zoom in to level 13 or closer, then tap Load roads.','قرّب الخريطة إلى المستوى 13 أو أكثر ثم اضغط تحميل الطرق.');return render()}
 S.stat=T('Loading real roads from OpenStreetMap…','جارٍ تحميل الطرق الحقيقية من OpenStreetMap…');render();
 const b=map.getBounds(),q=`[out:json][timeout:25];way["highway"~"^(motorway|trunk|primary|secondary)$"](${b.getSouth()},${b.getWest()},${b.getNorth()},${b.getEast()});out geom;`;
 for(const u of EP){try{const r=await fetch(u,{method:'POST',body:'data='+encodeURIComponent(q)});if(!r.ok)throw 0;const j=await r.json();return ingest(j.elements)}catch(e){}}
 S.stat=T('Could not reach the OpenStreetMap road-data service (Overpass). Check your connection, wait a minute and try again. The map itself still works.','تعذّر الوصول إلى خدمة بيانات الطرق (Overpass). تحقق من الاتصال وانتظر دقيقة وأعد المحاولة. الخريطة نفسها تعمل.');render()}
function ingest(els){
 roadL.clearLayers();ixL.clearLayers();const nodes=new Map();let nw=0;
 els.filter(e=>e.type==='way'&&e.geometry).forEach(w=>{nw++;const t=w.tags||{},hw=t.highway,ll=w.geometry.map(p=>[p.lat,p.lon]);
  const pl=L.polyline(ll,{color:CC[hw]||'#888',weight:CT[hw]||2,opacity:.85}).addTo(roadL);
  const lab=nmOf(t.name||t['name:en']||t.ref);
  pl.on('click',ev=>{L.DomEvent.stopPropagation(ev);S.sel={ll:[ev.latlng.lat,ev.latlng.lng],label:lab+' ('+hw+')',type:'road'};
   L.popup().setLatLng(ev.latlng).setContent(`<b>${lab}</b><br>OSM: ${hw}${t.ref?' · '+t.ref:''}<br>lanes: ${t.lanes||'not tagged'} · maxspeed: ${t.maxspeed||'not tagged'}<br><i>${T('OSM tags, may be incomplete','وسوم OSM، قد تكون ناقصة')}</i>`).openOn(map);render()});
  (w.nodes||[]).forEach((id,i)=>{let n=nodes.get(id);if(!n){n={id,ll:ll[i],ways:new Map()};nodes.set(id,n)}n.ways.set(w.id,{n:t.name||t.ref||'',hw})})});
 S.cand=[...nodes.values()].filter(n=>n.ways.size>=2).map(n=>{const ws=[...n.ways.values()];const names=[...new Set(ws.map(x=>x.n).filter(Boolean))];
  return{id:n.id,ll:n.ll,w:ws.reduce((a,x)=>a+(CW[x.hw]||1),0),h:hash(n.id),names,cls:[...new Set(ws.map(x=>x.hw))]}});
 S.cand.sort((a,b)=>b.w-a.w).slice(0,500).forEach(c=>L.circleMarker(c.ll,{radius:3,color:'#111',weight:1,fillColor:'#fff',fillOpacity:1}).addTo(ixL));
 S.stat=T(`Loaded ${nw} real road segments and ${S.cand.length} intersections (OpenStreetMap).`,`تم تحميل ${nw} مقطع طريق حقيقي و${S.cand.length} تقاطع (OpenStreetMap).`);
 hotspots();render()}
function hotspots(){
 hsL.clearLayers();const c=S.cand.map(x=>({...x,v:val(x)})).sort((a,b)=>b.v-a.v),out=[];
 for(const x of c){if(out.length>=8)break;if(out.every(o=>map.distance(o.ll,x.ll)>400))out.push(x)}
 S.hs=out;out.forEach((x,i)=>{x.name=x.names.slice(0,2).join(' × ')||T('Unnamed junction','تقاطع بدون اسم');
  L.marker(x.ll,{icon:L.divIcon({className:'',html:`<div class="hs" style="background:${colr(x.v)}">${i+1}</div>`,iconSize:[26,26]})}).addTo(hsL).on('click',ev=>{L.DomEvent.stopPropagation(ev);S.hi=i;S.sel={ll:x.ll,label:x.name,type:'hs'};render()})});
 if(S.hi>=out.length)S.hi=0}
map.on('click',e=>{if(S.mode==='new'){S.cur.push([e.latlng.lat,e.latlng.lng]);drawCur();render()}});
function drawCur(){curL.clearLayers();if(S.cur.length){L.polyline(S.cur,{color:'#7a4cff',weight:4,dashArray:'8 6'}).addTo(curL);S.cur.forEach(p=>L.circleMarker(p,{radius:4,color:'#7a4cff',fillOpacity:1}).addTo(curL))}}
function drawPr(){prL.clearLayers();S.roads.forEach((r,i)=>{L.polyline(r.pts,{color:'#7a4cff',weight:5,dashArray:'2 8'}).addTo(prL).bindTooltip(T('Proposed road ','طريق مقترح ')+(i+1))});
 S.imps.forEach(m=>L.marker(m.ll).addTo(prL).bindTooltip(m.opt))}
const len=p=>p.reduce((a,x,i)=>i?a+map.distance(p[i-1],x):0,0);
function near(pts){if(pts.length<2)return[];const s=[];for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],n=Math.max(1,Math.ceil(map.distance(a,b)/100));for(let k=0;k<=n;k++)s.push([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n])}
 return S.hs.map((h,i)=>({i,h,d:Math.min(...s.map(p=>map.distance(p,h.ll)))})).filter(x=>x.d<1000)}
const km=m=>(m/1000).toFixed(2)+' km';
const hsel=()=>S.hs.length?`<select onchange="S.hi=+this.value;map.setView(S.hs[S.hi].ll,15);render()">${S.hs.map((h,i)=>`<option value="${i}" ${i===S.hi?'selected':''}>#${i+1} ${h.name} – ${h.v}/100</option>`).join('')}</select>`:`<p class="mut">${T('Load roads first to generate simulated hotspots.','حمّل الطرق أولًا لتوليد النقاط الساخنة المحاكاة.')}</p>`;
const sim=()=>`<span class="chip">${T('SIMULATED','محاكاة')}</span>`;
const hourUI=()=>`<label>${T('Hour (demo daily pattern)','الساعة (نمط يومي تجريبي)')}: ${String(S.hour).padStart(2,'0')}:00</label><input type="range" min="0" max="23" value="${S.hour}" onchange="S.hour=+this.value;hotspots();render()">`;

const V={
explore(){return `<div class="card"><h3>${T('Explore real roads','استكشاف الطرق الحقيقية')}</h3><p class="mut">${T('Pan and zoom to an area (zoom 13+), then load motorway, trunk, primary and secondary roads from OpenStreetMap. Tap a road for its OSM tags.','حرّك وقرّب إلى منطقة (مستوى 13+) ثم حمّل الطرق السريعة والرئيسية من OpenStreetMap. اضغط على طريق لعرض وسومه.')}</p>
 <button class="b" onclick="loadRoads()">${T('Load roads in view','تحميل الطرق في العرض')}</button><button class="b alt" onclick="map.locate({setView:true,maxZoom:15})">📍 ${T('My location','موقعي')}</button>
 <p class="mut">${S.stat}</p>${S.sel?`<p><b>${T('Selected','المحدد')}:</b> ${S.sel.label}</p>`:''}</div>
 <div class="card"><h3>${T('Simulated congestion hotspots','نقاط ازدحام محاكاة')} ${sim()}</h3>${hourUI()}<p class="mut">⚠️ ${T('OpenStreetMap has no traffic data. Hotspot locations are real intersections picked by road importance plus a pseudo-random demo score. They are NOT verified congestion.','لا تحتوي OpenStreetMap على بيانات مرورية. مواقع النقاط تقاطعات حقيقية اختيرت بحسب أهمية الطريق ودرجة تجريبية عشوائية. وهي ليست ازدحامًا مُتحققًا منه.')}</p>
 ${S.hs.map((h,i)=>`<div class="row"><span>#${i+1} ${h.name}</span><b style="color:${colr(h.v)}">${h.v}/100</b></div>`).join('')}</div>`},
propose(){const r=S.roads.map((x,i)=>`<div class="row"><span>${T('Proposed road','طريق مقترح')} ${i+1}</span><span>${km(len(x.pts))}</span></div>`).join('');
 return `<div class="card"><h3>${T('Propose a new road','اقتراح طريق جديد')}</h3><p class="mut">${T('Tap Start drawing, then tap points on the map along the proposed route. Length is geometric (straight segments), not an engineering alignment.','اضغط ابدأ الرسم ثم اضغط نقاطًا على الخريطة على المسار المقترح. الطول هندسي (قطع مستقيمة) وليس مسارًا هندسيًا.')}</p>
 <button class="b" onclick="S.mode=S.mode==='new'?'off':'new';render()">${S.mode==='new'?T('Stop drawing','إيقاف الرسم'):T('Start drawing','ابدأ الرسم')}</button><button class="b alt" onclick="S.cur.pop();drawCur();render()">${T('Undo point','تراجع')}</button>
 <button class="b alt" onclick="if(S.cur.length>1){S.roads.push({pts:S.cur,desc:S.notes});S.cur=[];S.mode='off';S.notes='';drawCur();drawPr()}render()">${T('Save road','حفظ الطريق')}</button>
 <p class="mut">${T('Current points','النقاط الحالية')}: ${S.cur.length}${S.cur.length>1?' · '+km(len(S.cur)):''}</p>
 <label>${T('Describe the proposal','صف الاقتراح')}</label><textarea onchange="S.notes=this.value">${S.notes}</textarea>${r}</div>
 <div class="card"><h3>${T('Propose an improvement','اقتراح تحسين')}</h3><p class="mut">${T('Selected point','النقطة المحددة')}: ${S.sel?S.sel.label:T('none – tap a hotspot or road','لا شيء – اضغط نقطة ساخنة أو طريقًا')}</p>
 <select id="io">${OPT.map(o=>`<option>${T(o.en,o.ar)}</option>`).join('')}</select>
 <button class="b" onclick="if(S.sel){S.imps.push({ll:S.sel.ll,label:S.sel.label,opt:$('io').value});drawPr();render()}">${T('Add improvement here','أضف التحسين هنا')}</button>
 ${S.imps.map(m=>`<div class="row"><span>${m.opt}</span><span class="mut">${m.label}</span></div>`).join('')}</div>`},
compare(){if(!S.hs.length)return `<div class="card"><h3>${T('Planning dashboard','لوحة التخطيط')}</h3>${hsel()}</div>`;const h=S.hs[S.hi];
 return `<div class="card"><h3>${T('Compare solutions','قارن الحلول')} ${sim()}</h3>${hourUI()}<label>${T('Hotspot','النقطة الساخنة')}</label>${hsel()}
 <p class="mut">${T('Crossing roads (OSM)','الطرق المتقاطعة (OSM)')}: ${h.names.join(', ')||'–'} · ${T('simulated score','الدرجة المحاكاة')} <b>${h.v}/100</b></p>
 <table><tr><th>${T('Option','الخيار')}</th><th>${T('Effort','الجهد')}</th><th>${T('Disruption','التعطيل')}</th><th>${T('What-if gain','افتراض الزيادة')}</th><th>${T('Score after','الدرجة بعد')}</th></tr>
 ${OPT.map((o,i)=>`<tr><td>${T(o.en,o.ar)}<br><span class="mut">👍 ${T(o.p[0],o.p[1])}<br>⚠️ ${T(o.c[0],o.c[1])}</span></td><td>${o.e}</td><td>${o.d}</td><td><input type="range" min="0" max="50" value="${S.gain[i]}" onchange="S.gain[${i}]=+this.value;render()"><b>${S.gain[i]}%</b></td><td><b style="color:${colr(h.v/(1+S.gain[i]/100))}">${Math.round(h.v/(1+S.gain[i]/100))}</b></td></tr>`).join('')}</table>
 <p class="mut">⚠️ ${T('What-if gains are YOUR assumptions (same placeholder default for all). Scores are simulated arithmetic, not validated predictions.','الزيادات المفترضة هي افتراضاتك أنت (قيمة نائبة متطابقة للجميع). الدرجات حساب محاكى وليست تنبؤات مُتحقق منها.')}</p></div>
 ${S.roads.map((r,i)=>{const n=near(r.pts);return `<div class="card"><h3>${T('Proposed road','طريق مقترح')} ${i+1} · ${km(len(r.pts))}</h3><p class="mut">${r.desc||''}</p><p>${n.length?T('Simulated hotspots within 1 km of the line (possibly affected, to be studied):','نقاط ساخنة محاكاة ضمن 1 كم من الخط (قد تتأثر، تتطلب دراسة):'):T('No simulated hotspot within 1 km.','لا نقطة ساخنة محاكاة ضمن 1 كم.')}</p>${n.map(x=>`<div class="row"><span>#${x.i+1} ${x.h.name}</span><span>${Math.round(x.d)} m</span></div>`).join('')}
 <p class="mut">${T('Drawbacks to study: land acquisition, environment, cost, new junction conflicts, induced traffic.','سلبيات للدراسة: الاستملاك والبيئة والتكلفة وتعارضات التقاطعات الجديدة والمرور المستحث.')}</p></div>`}).join('')}`},
report(){const h=S.hs[S.hi];if(!h)return `<div class="card">${T('Load roads first.','حمّل الطرق أولًا.')}</div>`;const o=OPT.filter((x,i)=>1);
 const t=[T('JEDDAH TRAFFICFLOW AI – DRAFT PLANNING SUMMARY','جدة ترافيك فلو – ملخص تخطيطي مبدئي'),T('STATUS: Prototype. Road geometry/names/tags: OpenStreetMap contributors (ODbL). Congestion scores and improvements are SIMULATED, not validated, not official.','الحالة: نموذج أولي. هندسة الطرق/الأسماء/الوسوم: مساهمو OpenStreetMap (ODbL). درجات الازدحام والتحسينات محاكاة وغير مُتحقق منها وغير رسمية.'),'',
 T('1. Location','1. الموقع')+': '+h.name+' ('+h.ll[0].toFixed(5)+', '+h.ll[1].toFixed(5)+')',
 T('2. Simulated score','2. الدرجة المحاكاة')+': '+h.v+'/100 @ '+String(S.hour).padStart(2,'0')+':00',
 T('3. Road classes at junction (OSM)','3. فئات الطرق عند التقاطع (OSM)')+': '+h.cls.join(', '),
 T('4. Options considered (what-if, user assumptions)','4. الخيارات المدروسة (افتراضات المستخدم)')+':',...OPT.map((x,i)=>' - '+T(x.en,x.ar)+': '+T('effort','الجهد')+' '+x.e+', '+T('disruption','التعطيل')+' '+x.d+', '+T('assumed gain','الزيادة المفترضة')+' '+S.gain[i]+'% → '+Math.round(h.v/(1+S.gain[i]/100))+'/100'),
 T('5. Proposed new roads','5. طرق جديدة مقترحة')+': '+(S.roads.length?S.roads.map((r,i)=>(i+1)+') '+km(len(r.pts))+(r.desc?' – '+r.desc:'')).join('; '):T('none','لا يوجد')),
 T('6. Proposed improvements','6. تحسينات مقترحة')+': '+(S.imps.length?S.imps.map(m=>m.opt+' @ '+m.label).join('; '):T('none','لا يوجد')),'',
 T('7. Before any decision: collect real counts/speeds/signal data, validate with calibrated modelling, assess cost/land/environment, obtain authority approval.','7. قبل أي قرار: جمع أعداد وسرعات وبيانات إشارات حقيقية، والتحقق بنمذجة معايرة، وتقييم التكلفة والأراضي والبيئة، والحصول على موافقة الجهات المختصة.')].join('\n');S.rt=t;
 return `<div class="card"><h3>${T('Report','التقرير')} ${sim()}</h3>${hsel()}<div class="pre" style="margin-top:10px">${t.replace(/</g,'&lt;')}</div><button class="b" onclick="navigator.clipboard&&navigator.clipboard.writeText(S.rt)">${T('Copy','نسخ')}</button><button class="b alt" onclick="window.print()">${T('Print / PDF','طباعة / PDF')}</button></div>`}
};
const TABS=[['explore','Explore','استكشاف'],['propose','Propose','اقتراح'],['compare','Dashboard','اللوحة'],['report','Report','التقرير']];
function render(){document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';
 $('ttl').textContent=T('Jeddah TrafficFlow AI','جدة ترافيك فلو AI');$('sub').textContent=T('Independent concept · OpenStreetMap layer','نموذج مستقل · طبقة OpenStreetMap');$('lg').textContent=lang==='ar'?'English':'العربية';
 $('wn').innerHTML='<b>'+T('Real:','حقيقي:')+'</b> '+T('road geometry from OpenStreetMap. ','هندسة الطرق من OpenStreetMap. ')+'<b>'+T('Simulated:','محاكى:')+'</b> '+T('all congestion, scores and improvements. No live traffic, government data or trained AI.','كل الازدحام والدرجات والتحسينات. لا بيانات مرورية مباشرة أو حكومية أو ذكاء اصطناعي مدرَّب.');
 $('nv').innerHTML=TABS.map(t=>`<button class="${S.tab===t[0]?'on':''}" onclick="S.tab='${t[0]}';render()">${T(t[1],t[2])}</button>`).join('');
 const y=window.scrollY;$('panel').innerHTML=V[S.tab]();window.scrollTo(0,y)}
$('lg').onclick=()=>{lang=lang==='ar'?'en':'ar';hotspots();render()};
map.on('locationerror',()=>{S.stat=T('Location unavailable. Allow location for Safari in iPhone Settings.','الموقع غير متاح. اسمح لـ Safari بالموقع من إعدادات iPhone.');render()});
render();
