import os,sys,json,re,subprocess,glob,tempfile,shutil
ok=bad=0
def t(n,c):
    global ok,bad
    if c:ok+=1;print('PASS',n)
    else:bad+=1;print('FAIL',n)
tmp=tempfile.mkdtemp();d=json.load(open('data/sample.json'))
d.append(dict(state="Punjab",district="Ludhiana",market="<script>alert(1)</script>",commodity="Wheat",variety="x",arrival_date="14/11/2026",min_price=1,max_price=3,modal_price=2))
d.append(dict(state="Punjab",district="Ludhiana",market="Stale",commodity="Wheat",variety="Dara",arrival_date="01/11/2026",min_price=1,max_price=9,modal_price=5))
d.append(dict(state="Punjab",district="Ludhiana",market="Ludhiana",commodity="Wheat",variety="Dara",arrival_date="10/11/2026",min_price=9,max_price=9,modal_price=9))  # older duplicate
json.dump(d,open(tmp+'/d.json','w'))
env=dict(os.environ,DATA=tmp+'/d.json',OUT=tmp+'/o',DATA_GOV_API_KEY='')
r=subprocess.run([sys.executable,'scripts/build.py'],env=env,capture_output=True,text=True);print(r.stdout.strip())
t('build exits cleanly',r.returncode==0)
O=tmp+'/o';pages=glob.glob(O+'/mandi-prices/**/index.html',recursive=True)
t('pages generated (>10)',len(pages)>10)
allh={p:open(p,encoding='utf-8').read() for p in pages}
t('zero-price row dropped',not any('Maize' in h for h in allh.values()))
t('XSS escaped',not any('<script>alert' in h for h in allh.values()) and any('&lt;script&gt;' in h for h in allh.values()))
t('older duplicate row not used',not any('<td>₹9</td><td>₹9</td><td>₹9</td>' in h for h in allh.values()))
t('every page: one h1 + canonical + title',all(len(re.findall('<h1',h))==1 and 'rel="canonical"' in h and '<title>' in h for h in allh.values()))
def ldok(h):
    try:json.loads(re.search(r'ld\+json">(.*?)</script>',h,re.S).group(1));return True
    except:return False
t('JSON-LD valid on every page',all(ldok(h) for h in allh.values()))
t('no NaN/None/undefined',not any(re.search(r'NaN|None|undefined',h) for h in allh.values()))
crop=[h for p,h in allh.items() if p.endswith('wheat/index.html') and 'ludhiana' in p][0]
t('answer-first sentence on crop page','Wheat price in Ludhiana district today is ₹2,440' in crop)
t('FAQPage on crop pages','FAQPage' in crop)
sm=open(O+'/sitemap.xml').read()
t('sitemap lists every page',sm.count('<loc>')==len(pages)+2)
t('CSV files written',len(glob.glob(O+'/**/prices.csv',recursive=True))>=10)
t('CSP has no unsafe-inline on generated pages',not any('unsafe-inline' in h for h in allh.values()))
t('no external requests',not any(re.search(r'(src|href)="https?://(?!mandirates)',h) for h in allh.values()))
t('largest page < 15KB',max(len(h.encode()) for h in allh.values())<15000)
fail=subprocess.run([sys.executable,'scripts/build.py'],env=dict(os.environ,DATA=tmp+'/none.json',OUT=tmp+'/x',DATA_GOV_API_KEY='bad'),capture_output=True,text=True)
t('feed failure stops build (site unchanged)',fail.returncode!=0 and not os.path.exists(tmp+'/x/mandi-prices'))
print(f'\n{ok} passed, {bad} failed');shutil.rmtree(tmp);sys.exit(1 if bad else 0)
