const fs=require('fs');const h=fs.readFileSync('marketplace.html','utf8');let p=0,f=0;const t=(n,c)=>{c?p++:f++;console.log(c?'PASS':'FAIL',n)};
const L=new Function(h.split('/*LOGIC*/')[1].split('/*END*/')[0]+';return{phoneOk,mask,validate,filterL,ago}')();
t('valid phone',L.phoneOk('9876543210'));t('rejects 5-start',!L.phoneOk('5876543210'));t('rejects 9 digits',!L.phoneOk('987654321'));t('rejects letters',!L.phoneOk('98765abcde'));
t('mask hides middle',L.mask('9876543210')==='98XXXXXX10');
const ok={crop:'Wheat',qty:10,price:2000,state:'Punjab',phone:'9876543210',consent:true};
t('valid listing passes',L.validate(ok).length===0);
t('missing consent fails',L.validate({...ok,consent:false}).length===1);
t('zero qty fails',L.validate({...ok,qty:0}).length>0);t('absurd price fails',L.validate({...ok,price:99999999}).length>0);
t('empty crop fails',L.validate({...ok,crop:' '}).length>0);t('bad phone fails',L.validate({...ok,phone:'123'}).length>0);
const a=[{kind:'sell',crop:'Wheat',state:'P',district:'Lud',note:'basmati',at:2},{kind:'buy',crop:'Rice',state:'H',district:'K',at:3},{kind:'sell',crop:'Wheat',state:'P',at:1,status:'hidden'}];
t('hidden listings excluded',L.filterL(a,'','','','').length===2);t('filter by kind',L.filterL(a,'buy','','','').length===1);
t('search matches note',L.filterL(a,'','','','basmati').length===1);t('newest first',L.filterL(a,'','','','')[0].at===3);
t('ago minutes',L.ago(0,5*60000)==='5 min ago');t('ago days',L.ago(0,3*86400000)==='3 days ago');
t('no innerHTML',!/innerHTML/.test(h));t('no external src/href',!/(src|href)="https?:\/\/(?!mandirates)/.test(h));
t('inputs labelled',[...h.matchAll(/<(?:input|select|textarea) id="(\w+)"/g)].every(m=>h.includes('for="'+m[1]+'"')||['pm','cs'].includes(m[1])));
t('size <25KB',Buffer.byteLength(h)<25000);console.log(`${p} passed, ${f} failed, ${Buffer.byteLength(h)} bytes`);process.exit(f?1:0)
