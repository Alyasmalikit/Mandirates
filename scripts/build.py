import json,os,re,csv,sys,html,datetime,collections
from urllib.parse import urlencode
from urllib.request import urlopen
BASE=os.environ.get('SITE_URL','https://mandirates.pages.dev').rstrip('/')
OUT=os.environ.get('OUT','site');DATA=os.environ.get('DATA','data/sample.json');KEY=os.environ.get('DATA_GOV_API_KEY','')
RID='9ef84268-d588-465a-a308-a864a43d0070'  # Agmarknet daily mandi prices (verify on data.gov.in)
e=lambda s:html.escape(str(s),quote=True)
def slug(s):return re.sub(r'[^a-z0-9]+','-',str(s).lower()).strip('-') or 'na'
def fetch():
    rows=[];off=0
    while off<30000:
        q=urlencode({'api-key':KEY,'format':'json','limit':1000,'offset':off})
        with urlopen(f'https://api.data.gov.in/resource/{RID}?{q}',timeout=30) as r:d=json.load(r)
        rec=d.get('records',[])
        if not rec:break
        rows+=rec;off+=1000
    return rows
def num(v):
    try:return int(float(v))
    except:return 0
def dt(s):
    try:return datetime.datetime.strptime(str(s),'%d/%m/%Y')
    except:return datetime.datetime(1970,1,1)
def clean(raw):
    best={}
    for r in raw:
        r={k.lower():v for k,v in r.items()}
        row=dict(state=str(r.get('state','')).strip(),district=str(r.get('district','')).strip(),market=str(r.get('market','')).strip(),commodity=str(r.get('commodity','')).strip(),variety=str(r.get('variety','')).strip(),date=str(r.get('arrival_date','')),mn=num(r.get('min_price')),mx=num(r.get('max_price')),md=num(r.get('modal_price')))
        if not(row['state'] and row['district'] and row['market'] and row['commodity']):continue
        if row['md']<=0 or row['mn']<0 or row['mx']<row['mn']:continue   # drop zero / broken prices
        k=(row['state'],row['district'],row['market'],row['commodity'],row['variety'])
        if k not in best or dt(row['date'])>dt(best[k]['date']):best[k]=row
    return list(best.values())
DEMO=not KEY
def page(path,title,desc,crumbs,h1,lead,body,extra=None):
    bl={"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":i+1,"name":n,"item":BASE+p} for i,(n,p) in enumerate(crumbs)]}
    ld=json.dumps({"@context":"https://schema.org","@graph":[bl]+(extra or [])},ensure_ascii=False).replace('</','<\\/')
    nav=' › '.join(f'<a href="{p}">{e(n)}</a>' for n,p in crumbs[:-1])
    nav=(nav+' › ' if nav else '')+e(crumbs[-1][0])
    demo='<p class="note">Demo data for testing. Live prices appear once the daily feed is connected.</p>' if DEMO else ''
    h=f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(title)}</title><meta name="description" content="{e(desc)}"><link rel="canonical" href="{BASE+path}">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'">
<link rel="stylesheet" href="/style.css"><script type="application/ld+json">{ld}</script></head>
<body><header><div><a href="/"><b>MandiRates</b></a></div></header><main>
<nav aria-label="Breadcrumb" class="bc">{nav}</nav><h1>{e(h1)}</h1><p class="ans">{lead}</p>{demo}{body}</main>
<footer>Source: Government of India open data (data.gov.in). Prices are indicative; confirm with the mandi before you trade. © MandiRates</footer></body></html>'''
    p=os.path.join(OUT,path.strip('/'),'index.html');os.makedirs(os.path.dirname(p),exist_ok=True);open(p,'w',encoding='utf-8').write(h);return path
def rs(v):return '₹'+format(v,',d')
def main():
    if KEY:
        try:raw=fetch()
        except Exception as ex:sys.exit(f'Feed failed, site left unchanged: {ex}')
    else:raw=json.load(open(DATA,encoding='utf-8'))
    rows=clean(raw)
    if not rows:sys.exit('No valid rows, site left unchanged')
    os.makedirs(OUT,exist_ok=True)
    open(os.path.join(OUT,'style.css'),'w').write(open('scripts/style.css').read())
    urls=['/','/marketplace.html'];R='/mandi-prices/'
    S=collections.defaultdict(lambda:collections.defaultdict(lambda:collections.defaultdict(list)))
    for r in rows:S[r['state']][r['district']][r['commodity']].append(r)
    page(R,'Mandi Prices Today by State | MandiRates','Browse today\'s mandi prices by state, district and crop across India.',[('Home','/'),('Mandi prices',R)],'Mandi prices by state',f'Choose a state to see today\'s mandi prices. {len(rows)} price records across {len(S)} states.','<ul class="list">'+''.join(f'<li><a href="{R}{slug(s)}/">{e(s)}</a> ({sum(len(d) for d in S[s].values())} crop listings)</li>' for s in sorted(S))+'</ul>');urls.append(R)
    for s in sorted(S):
        sp=f'{R}{slug(s)}/'
        page(sp,f'Mandi Prices in {s} Today | MandiRates',f'Today\'s mandi prices in {s} by district and crop, per quintal.',[('Home','/'),('Mandi prices',R),(s,sp)],f'Mandi prices in {s}',f'Select a district in {e(s)} to see today\'s crop rates per quintal.','<ul class="list">'+''.join(f'<li><a href="{sp}{slug(d)}/">{e(d)}</a> ({len(S[s][d])} crops)</li>' for d in sorted(S[s]))+'</ul>');urls.append(sp)
        for d in sorted(S[s]):
            dp=f'{sp}{slug(d)}/'
            page(dp,f'Mandi Prices in {d}, {s} Today | MandiRates',f'Today\'s mandi rates in {d}, {s}: crop prices per quintal.',[('Home','/'),('Mandi prices',R),(s,sp),(d,dp)],f'Mandi prices in {d}, {s}',f'Latest crop prices in {e(d)} district, per quintal.','<ul class="list">'+''.join(f'<li><a href="{dp}{slug(c)}/">{e(c)}</a>: {rs(max(x["md"] for x in S[s][d][c]))} (highest modal)</li>' for c in sorted(S[s][d]))+'</ul>');urls.append(dp)
            for c in sorted(S[s][d]):
                L=sorted(S[s][d][c],key=lambda x:-x['md']);cp=f'{dp}{slug(c)}/';top=L[0];low=min(x['mn'] for x in L);high=max(x['mx'] for x in L);date=max((x['date'] for x in L),key=dt)
                ans=f'{e(c)} price in {e(d)} district today is {rs(top["md"])} per quintal (modal) at {e(top["market"])} mandi, ranging {rs(low)} to {rs(high)} across {len(L)} listing{"s" if len(L)>1 else ""}. Last updated {e(date)}.'
                plain=f'{c} price in {d} district today is {rs(top["md"])} per quintal (modal) at {top["market"]} mandi, ranging {rs(low)} to {rs(high)}. Last updated {date}.'
                tb='<div class="tw"><table><thead><tr><th>Mandi</th><th>Variety</th><th>Min</th><th>Modal</th><th>Max</th><th>Per kg</th><th>Date</th></tr></thead><tbody>'+''.join(f'<tr{" class=best" if i==0 else ""}><td>{e(x["market"])}</td><td>{e(x["variety"])}</td><td>{rs(x["mn"])}</td><td>{rs(x["md"])}</td><td>{rs(x["mx"])}</td><td>₹{x["md"]/100:.2f}</td><td>{e(x["date"])}</td></tr>' for i,x in enumerate(L))+'</tbody></table></div><p><a href="prices.csv" download>Download CSV</a> · Highest modal price is shaded.</p>'
                faq={"@type":"FAQPage","mainEntity":[{"@type":"Question","name":f"What is the {c} price in {d} today?","acceptedAnswer":{"@type":"Answer","text":plain}}]}
                page(cp,f'{c} Price in {d}, {s} Today | MandiRates',plain[:155],[('Home','/'),('Mandi prices',R),(s,sp),(d,dp),(c,cp)],f'{c} price in {d} today',ans,tb,[faq]);urls.append(cp)
                with open(os.path.join(OUT,cp.strip('/'),'prices.csv'),'w',newline='',encoding='utf-8') as f:
                    w=csv.writer(f);w.writerow(['state','district','market','commodity','variety','date','min','modal','max'])
                    for x in L:w.writerow([x['state'],x['district'],x['market'],x['commodity'],x['variety'],x['date'],x['mn'],x['md'],x['mx']])
    for f in('index.html','marketplace.html','robots.txt','_headers'):open(os.path.join(OUT,f),'w',encoding='utf-8').write(open(f,encoding='utf-8').read())
    t=datetime.date.today().isoformat()
    open(os.path.join(OUT,'sitemap.xml'),'w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join(f'<url><loc>{BASE+u}</loc><lastmod>{t}</lastmod></url>' for u in urls)+'</urlset>')
    print(f'Built {len(urls)} pages from {len(rows)} valid rows ({len(raw)-len(rows)} dropped)')
if __name__=='__main__':main()
