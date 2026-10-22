import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createClient} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
import {getBrowser,getPage,closeBrowser} from '../../.agents/skills/chrome-devtools/scripts/lib/browser.js';
const scenario=process.argv[2]||'primary';
const baseUrl=process.env.RESOLVER_AUDIT_URL||'http://127.0.0.1:3026';
const tag=process.env.RESOLVER_AUDIT_TAG||'';
if(!/^[a-zA-Z0-9_-]*$/.test(tag))throw new Error('Invalid evidence filename tag');
if(!['primary','deterministic','semantic','invalidation','stale'].includes(scenario))throw new Error('Unknown browser scenario');
const source=JSON.parse(await fs.readFile(`docs/live-evidence/studionet-20261021-${scenario==='primary'?'primary':'positive'}.json`,'utf8'));
const watchId=scenario==='primary'?source.watch_id:source.scenarios[scenario].watch_id;
const client=createClient({chain:studionet});
const watch=JSON.parse(String(await client.readContract({address:source.contract,functionName:'get_watch',args:[watchId],transactionHashVariant:'latest-final'})));
const stats=JSON.parse(String(await client.readContract({address:source.contract,functionName:'get_stats',args:[],transactionHashVariant:'latest-final'})));
const report={kind:'browser-live-readback',url:baseUrl,scenario,checked_at:new Date().toISOString(),contract:source.contract,watch_id:watchId,expected:watch,stats,assertions:[],errors:[],limitation:'Real browser reads of the deployed contract. Signing journey was SDK, not browser extension; no mocked RPC or injected signer.'};
try{
 const browser=await getBrowser({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),page=await getPage(browser);
 page.on('pageerror',e=>report.errors.push(e.message));
 for(const viewport of [{name:'desktop',width:1440,height:1100},{name:'mobile',width:390,height:844}]){
  await page.setViewport({width:viewport.width,height:viewport.height});
  await page.goto(baseUrl,{waitUntil:'networkidle2',timeout:60000});
  const contract=await page.$eval('.contract-field input',el=>el.value);assert.equal(contract,source.contract);
  await page.locator('.watch-loader input').fill(watchId);
  await page.locator('.watch-loader button').click();
  await page.waitForFunction(()=>document.querySelector('.terminal')?.textContent.includes('Latest-final contract state synchronized.'),{timeout:90000});
  const state=await page.evaluate(()=>({status:document.querySelector('.state-pill')?.textContent,verdict:document.querySelector('.verdict b')?.textContent,identity:document.querySelector('.identity b')?.textContent,metrics:[...document.querySelectorAll('.hero-metrics b')].map(e=>Number(e.textContent)),disabled:[...document.querySelectorAll('.actionbar button')].every(b=>b.disabled),width:document.documentElement.scrollWidth,viewport:innerWidth,logos:[...document.images].every(i=>i.complete&&i.naturalWidth>0),body:document.body.textContent}));
  assert.equal(state.status,watch.status.replaceAll('_',' '));assert.equal(state.verdict,watch.verdict||'NOT ASSESSED');assert.equal(state.identity,watch.ens_name);
  assert.deepEqual(state.metrics,[stats.watches,stats.assessments,stats.promotions]);assert.ok(state.disabled);assert.ok(state.width<=state.viewport);assert.ok(state.logos);
  if(watch.verdict!=='CONTINUITY')assert.ok(!state.body.includes('REVIEWED CONTINUITY'));
  if(watch.verified_block>0)assert.ok(state.body.includes(Number(watch.verified_block).toLocaleString('en-US')),'dated verified block visible');
  report.assertions.push({viewport:viewport.name,pass:true,checks:['deployment address','live state','live verdict','identity','live counters','unsigned actions blocked','no overflow','logo loaded'],observed:state});
  await page.screenshot({path:`docs/screenshots/${tag}live-${scenario}-${viewport.name}.png`,fullPage:true});
 }
 assert.deepEqual(report.errors,[]);report.passed=true;console.log(JSON.stringify({passed:true,viewports:report.assertions.length}));
}catch(e){report.error=String(e.stack||e);throw e}finally{await fs.writeFile(`docs/live-evidence/${tag}browser-${scenario}-readback.json`,JSON.stringify(report,null,2)+'\n');await closeBrowser()}
