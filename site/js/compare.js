(function(){
var $=function(i){return document.getElementById(i)},E=MR.el,inr=MR.inr,rows=[],sel={},MAX=8;
function list(){return MRL.forCrop(rows,$('cr').value).filter(function(r){var q=$('mf').value.toLowerCase().trim();return!q||(r.market+' '+r.state+' '+r.district).toLowerCase().indexOf(q)>-1}).slice(0,60)}
function chosen(){return MRL.forCrop(rows,$('cr').value).filter(function(r){return sel[MRL.key(r)+'|'+r.state]})}
function draw(){var c=MRL.compare(chosen()),tb=$('tb'),n=c.length;tb.textContent='';
document.querySelectorAll('#pk label').forEach(function(l){var i=l.firstChild;l.className=(!i.checked&&!MRL.canAdd(n,MAX))?'off':'';i.disabled=!i.checked&&!MRL.canAdd(n,MAX)});
$('sm').textContent=n?c[0].r.market+' pays the most: '+inr(c[0].r.md)+' per quintal'+(n>1?'. Lowest listed is '+inr(c[n-1].r.md)+', which is '+inr(c[0].r.md-c[n-1].r.md)+' less.':''):'Tick mandis to compare (up to 8).';
c.forEach(function(x,i){var tr=E('tr');if(i===0)tr.className='best';[x.r.market+' ('+x.r.state+')',inr(x.r.mn),inr(x.r.md),inr(x.r.mx)].forEach(function(v){tr.appendChild(E('td',v))});tr.appendChild(E('td',i===0?'Best':'−'+inr(x.diff)+' ('+x.pct.toFixed(1)+'%)',i===0?'up':'dn'));
var bt=E('td'),w=E('div',null,'bt'),b=E('i');b.style.width=x.w.toFixed(1)+'%';w.appendChild(b);bt.appendChild(w);tr.appendChild(bt);tb.appendChild(tr)})}
function pick(){var p=$('pk');p.textContent='';list().forEach(function(r){var k=MRL.key(r)+'|'+r.state,l=E('label'),c=E('input');c.type='checkbox';c.checked=!!sel[k];c.addEventListener('change',function(){if(c.checked)sel[k]=1;else delete sel[k];draw()});l.appendChild(c);l.appendChild(document.createTextNode(r.market+', '+r.state+' · '+inr(r.md)));p.appendChild(l)});draw()}
function init(){var q=new URLSearchParams(location.search).get('crop'),cs=MRL.cropsOf(rows),n={};rows.forEach(function(r){n[r.commodity]=(n[r.commodity]||0)+1});MR.fill($('cr'),cs);$('cr').value=cs.slice().sort(function(a,b){return n[b]-n[a]})[0];if(q&&cs.indexOf(q)>-1)$('cr').value=q;autosel();pick()}
function autosel(){sel={};MRL.forCrop(rows,$('cr').value).slice(0,3).forEach(function(r){sel[MRL.key(r)+'|'+r.state]=1})}
MR.prices().then(function(p){rows=p.rows;MR.banner(p);init()});
$('cr').addEventListener('input',function(){autosel();$('mf').value='';pick()});$('mf').addEventListener('input',pick);
$('dl').addEventListener('click',function(){MR.download('mandi-comparison.csv',MRL.toCsv(chosen()))});
})();
