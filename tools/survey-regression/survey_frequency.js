#!/usr/bin/env node
'use strict';
const fs=require('node:fs'), path=require('node:path'), {execFileSync}=require('node:child_process'), {chromium}=require('playwright');
const SHA=process.env.TESTED_SHA||'1a0ec054db7d3ea181042271f350b757125935b0', CAP=77;
const html=path.resolve(__dirname,'../../index.html'), out=path.resolve(process.env.OUTPUT_CSV||path.join(__dirname,'artifacts/survey-frequency.csv'));
const blocked='Failed to load resource: net::ERR_FAILED';
const csv=v=>'"'+String(v).replace(/"/g,'""')+'"';
function summary(s){console.log(s);if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,s+'\n');}
async function main(){
 if(!/^[0-9a-f]{40}$/.test(SHA))throw Error('TESTED_SHA must be a full 40-character SHA');
 const a=execFileSync('git',['rev-parse','HEAD:index.html'],{encoding:'utf8'}).trim(), b=execFileSync('git',['rev-parse',SHA+':index.html'],{encoding:'utf8'}).trim();
 if(a!==b)throw Error('Read-only source guard failed: checked-out index.html differs from '+SHA);
 const browser=await chromium.launch({headless:true}), rows=[], configs=[], incomplete=[];
 try{
  const url='file://'+html, boot=await browser.newContext();
  await boot.route(/^https?:\/\//,r=>r.abort());
  const bp=await boot.newPage();await bp.route('**/chess.js/0.10.3/chess.min.js',r=>r.fulfill({path:require.resolve('chess.js'),contentType:'application/javascript'}));
  await bp.goto(url);await bp.waitForFunction(()=>typeof archetypes==='object'&&typeof choosePicksForRun==='function');
  const dims=await bp.evaluate(()=>({archetypes:Object.keys(archetypes),experiences:Object.keys(LEVEL_BANDS)}));await boot.close();
  if(dims.archetypes.length!==6||dims.experiences.length!==5)throw Error('Expected 6 archetypes × 5 experience levels');
  for(const archetype of dims.archetypes)for(const experience of dims.experiences)for(const strength of ['normal','strong']){
   const ctx=await browser.newContext();await ctx.route(/^https?:\/\//,r=>r.abort());const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&m.text()!==blocked)errors.push(m.text());});
   await page.route('**/chess.js/0.10.3/chess.min.js',r=>r.fulfill({path:require.resolve('chess.js'),contentType:'application/javascript'}));
   await page.goto(url);await page.waitForFunction(()=>typeof archetypes==='object'&&typeof choosePicksForRun==='function');
   const r=await page.evaluate(({archetype,experience,strength,cap})=>{
    localStorage.removeItem(PICKS_KEY);localStorage.removeItem(GM_ROTATION_KEY);skillLevelKey=experience;lastExtremeCount=strength==='strong'?4:0;
    const band=LEVEL_BANDS[skillLevelKey]||LEVEL_BANDS.none, high=Math.min(5,band[1]+(strength==='strong'?1:0));
    const candidates=side=>{
     if(typeof ecoCandidatesFor!=='function')throw Error('ecoCandidatesFor unavailable; cannot report remaining candidates');
     let raw=ecoCandidatesFor(archetype,side,band[0],high);
     if(!raw.length)raw=ecoCandidatesFor(archetype,side,1,5);
     const vals=Array.isArray(raw)?raw:(raw&&typeof raw==='object'?Object.values(raw):[]);
     const codes=[...new Set(vals.map(x=>typeof x==='string'?x:(x&&(x.eco||x.code||x.ECO)||'')).filter(Boolean))];
     if(!codes.length)throw Error('No '+side+' candidates returned for '+archetype+'/'+experience+'/'+strength);
     return codes;
    };
    const pool={white:candidates('white'),black:candidates('black')}, seen=new Map();let prev=null,exhausted=false,reason='',n=0;
    for(let survey=1;survey<=cap;survey++){
     choosePicksForRun(archetype);const w=currentPicks?.whiteSystem?.eco, b=currentPicks?.blackSystem?.eco;
     if(!w||!b)throw Error('Missing White or Black ECO at survey '+survey);
     for(const [eco,side] of [[w,'white'],[b,'black']]){const k=eco+'|'+side,x=seen.get(k);if(x)x.count++;else seen.set(k,{eco,side,count:1,first:survey});}
     n=survey;const pair=w+'/'+b;if(prev!==null&&pair===prev){exhausted=true;reason='both candidate lists exhausted (pair repeated at survey '+survey+')';break;}prev=pair;
    }
    if(!exhausted)reason='retake cap reached ('+cap+') before exhaustion';
    const observed={white:new Set([...seen.values()].filter(x=>x.side==='white').map(x=>x.eco)),black:new Set([...seen.values()].filter(x=>x.side==='black').map(x=>x.eco))};
    return {appearances:[...seen.values()],n,exhausted,reason,remaining:exhausted?{white:[],black:[]}:{white:pool.white.filter(x=>!observed.white.has(x)),black:pool.black.filter(x=>!observed.black.has(x))}};
   },{archetype,experience,strength,cap:CAP});
   await ctx.close();if(errors.length)throw Error(archetype+'/'+experience+'/'+strength+' page errors: '+errors.join('; '));
   const c={archetype,experience,strength,surveys:r.n,status:r.exhausted?'COMPLETE':'INCOMPLETE',reason:r.reason,remaining:r.remaining};configs.push(c);if(!r.exhausted)incomplete.push(c);
   for(const x of r.appearances)rows.push([x.eco,x.side,archetype,experience,strength,x.count,x.first,SHA]);
  }
 }finally{await browser.close();}
 fs.mkdirSync(path.dirname(out),{recursive:true});
 const header=['ECO','side','archetype','experience','strength','appearance count','first-seen survey number','tested SHA'];
 fs.writeFileSync(out,[header,...rows].map(r=>r.map(csv).join(',')).join('\n')+'\n','utf8');
 const done=configs.length-incomplete.length;
 const lines=['## Survey frequency audit','','- Checked-out commit: '+(process.env.GITHUB_SHA||'local run'),'- Tested site-code SHA: '+SHA,'- Source guard: PASS — index.html blob matches tested SHA.','- Configurations completed: '+configs.length+' / 60','- Retake cap: '+CAP,'- Stop reasons: '+done+' exhausted; '+incomplete.length+' reached cap before exhaustion.','- CSV rows: '+rows.length,'- CSV path: '+path.relative(process.cwd(),out),'- INCOMPLETE flags: '+(incomplete.length?incomplete.length+' configuration(s)':'none'),''];
 if(incomplete.length){lines.push('### INCOMPLETE configurations and remaining candidates','');for(const c of incomplete)lines.push('- '+c.archetype+' / '+c.experience+' / '+c.strength+' — '+c.reason+'; White remaining: '+(c.remaining.white.join(', ')||'none')+'; Black remaining: '+(c.remaining.black.join(', ')||'none'));lines.push('');}
 summary(lines.join('\n'));
}
main().catch(e=>{summary('## Survey frequency audit — FAILED\n\n- Error: '+String(e.stack||e)+'\n');process.exitCode=1;});
