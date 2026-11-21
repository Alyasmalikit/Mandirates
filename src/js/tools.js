(function(){
var $=function(i){return document.getElementById(i)},E=MR.el,inr=MR.inr,rows=[],demo=false,list=[];
var slug=function(s){return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'na'};
function chart(box,v,label){box.textContent='';var NS='http://www.w3.org/2000/svg',a=v.filter(function(x){return x!=null}),mn=Math.min.apply(null,a),mx=Math.max.apply(null,a),sp=(mx-mn)||1,W=600,H=150,s=document.createElementNS(NS,'svg');
s.setAttribute('viewBox','0 0 '+W+' '+H);s.setAttribute('class','sv');s.setAttribute('role','img');s.setAttribute('aria-label',label);var pts=[];v.forEach(function(x,i){if(x!=null)pts.push((i*W/Math.max(1,v.length-1)).toFixed(1)+','+(H-8-(x-mn)/sp*(H-24)).toFixed(1))});
var p=document.createElementNS(NS,'polyline');p.setAttribute('points',pts.join(' '));p.setAttribute('fill','none');p.setAttribute('stroke','#1b6b3b');p.setAttribute('stroke-width','3');p.setAttribute('stroke-linejoin','round');s.appendChild(p);box.appendChild(s)}
function trend(){var r=list[+$('tc').value];if(!r)return;var o=$('to');o.textContent='Loading history…';$('tsv').textContent='';
fetch('/data/series/'+slug(r.state)+'.json').then(function(x){if(!x.ok)throw 0;return x.json()}).then(function(j){var v=j.v&&j.v[r.market+'|'+r.commodity+'|'+r.variety];if(!v)throw 0;show(v.slice(-30),false)}).catch(function(){var n=0;if(demo)show(MRL.demoSeries(r.md,r.md%997+7),true);else{o.textContent='History is still building for this mandi. It grows by one day every day, so charts appear after a few days of saved prices.'}})}
function show(v,sample){var st=MRL.stats(v),o=$('to');if(!st||st.n<3){o.textContent='Not enough saved days yet to draw a trend.';return}chart($('tsv'),v,'Price trend chart');o.textContent='';var p=E('span',MRL.signal(st.vs),'pill');o.appendChild(p);
o.appendChild(E('div',st.n+' days · high '+inr(st.max)+' · low '+inr(st.min)+' · average '+inr(st.avg)+' · today '+st.vs.toFixed(1)+'% vs average'));if(sample)o.appendChild(E('div','Sample history for design preview only.','err'))}
function sell(){var q=+$('sq').value||0,o=$('so2'),c=$('so').value,k=MRL.COORDS[c];o.textContent='';if(!k||q<=0)return;var L=MRL.rank(rows,$('sc').value,q,k[0],k[1],+$('sr').value||0,1.3);
if(!L.length){o.appendChild(E('p','No mandis with a known location for this crop yet.','mut'));return}var near=L.slice().sort(function(a,b){return a.km-b.km})[0],top=L[0],gain=top.net-near.net;
o.appendChild(E('div','Best: '+top.market+' ('+top.state+') · you keep '+inr(top.net),'big up'));o.appendChild(E('p',gain>1?'That is '+inr(gain)+' more than the nearest mandi ('+near.market+').':top.market+' is also the nearest.'));
var t=E('table'),h=E('tr');['Mandi','Price','Distance','Transport','You keep'].forEach(function(x){h.appendChild(E('th',x))});t.appendChild(h);L.slice(0,12).forEach(function(x,i){var r=E('tr');if(i===0)r.className='best';[x.market,inr(x.md),Math.round(x.km)+' km',inr(x.cost),inr(x.net)].forEach(function(v){r.appendChild(E('td',v))});t.appendChild(r)});var w=E('div',null,'tw');w.appendChild(t);o.appendChild(w);
var all=rows.filter(function(r){return r.commodity===$('sc').value}).length;o.appendChild(E('p','Distance is estimated as 1.3 × straight line. '+L.length+' of '+all+' mandis for this crop have a known location. Ask your transporter for a real quote.','hint'))}
var alerts=MR.ld('mr-alerts');
function renderAlerts(){var u=$('al');u.textContent='';if(!alerts.length)u.appendChild(E('li','No alerts yet.','mut'));alerts.forEach(function(a,i){var r=rows.filter(function(x){return x.commodity+'|'+x.market===a.k})[0],hit=r&&MRL.triggered(a,r.md),li=E('li');li.appendChild(E('span',(hit?'🔔 Triggered: ':'')+a.k.replace('|',', ')+' '+a.dir+' '+inr(a.t)+(r?' (now '+inr(r.md)+')':''),hit?'up':''));var b=E('button','Remove','btn r');b.type='button';b.onclick=function(){alerts.splice(i,1);MR.sv('mr-alerts',alerts);renderAlerts()};li.appendChild(b);u.appendChild(li)})}
function calc(){var r=MRL.netProfit($('b').value,$('s').value,$('n').value,$('t').value,$('c').value),o=$('po');o.textContent='';o.appendChild(E('div',(r.net>=0?'Profit ':'Loss ')+inr(Math.abs(r.net)),'big '+(r.net>=0?'up':'dn')));o.appendChild(E('p','Commission '+inr(r.comm)+' · Return on money '+r.roi.toFixed(1)+'%','mut'))}
MR.prices().then(function(p){rows=p.rows;demo=p.demo;MR.banner(p);
list=MRL.sortRows(rows.filter(function(r){return r.variety!==undefined}),'commodity',true).slice(0,500);
list.forEach(function(r,i){var o=E('option',r.commodity+', '+r.market+' ('+r.state+')');o.value=i;$('tc').appendChild(o);var a=E('option',r.commodity+', '+r.market);a.value=r.commodity+'|'+r.market;$('ac').appendChild(a)});
var cn={};rows.forEach(function(r){cn[r.commodity]=(cn[r.commodity]||0)+1});var cs=MRL.cropsOf(rows);MR.fill($('sc'),cs);$('sc').value=cs.slice().sort(function(a,b){return cn[b]-cn[a]})[0];MR.fill($('so'),Object.keys(MRL.COORDS).map(function(k){return k.charAt(0).toUpperCase()+k.slice(1)}).sort());
var o=document.querySelectorAll('#so option');o.forEach(function(x){x.value=x.textContent.toLowerCase()});$('so').value='ludhiana';
trend();sell();renderAlerts()});
['sc','sq','so','sr'].forEach(function(i){$(i).addEventListener('input',sell)});$('tc').addEventListener('input',trend);
['b','s','n','t','c'].forEach(function(i){$(i).addEventListener('input',calc)});
$('aa').addEventListener('click',function(){var t=+$('at').value;if(t>0&&$('ac').value){alerts.push({k:$('ac').value,dir:$('ad').value,t:t});MR.sv('mr-alerts',alerts);renderAlerts()}});
calc();
})();
