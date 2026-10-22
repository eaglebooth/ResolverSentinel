import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
import assert from "node:assert/strict";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const skillRoot=process.env.RESOLVER_BROWSER_SKILL_DIR||path.resolve(root,"../.agents/skills/chrome-devtools/scripts");
const {getBrowser,getPage,closeBrowser}=await import(pathToFileURL(path.join(skillRoot,"lib/browser.js")));
const output=path.join(root,"docs/screenshots");
await fs.mkdir(output,{recursive:true});
const report={kind:"local-browser-audit",url:"http://127.0.0.1:3026",checked_at:new Date().toISOString(),assertions:[],errors:[],screenshots:[]};
try{
  const browser=await getBrowser({headless:true,executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe"});
  const page=await getPage(browser);
  page.on("pageerror",error=>report.errors.push(error.message));
  for(const viewport of [{name:"desktop",width:1440,height:1100},{name:"mobile",width:390,height:844}]){
    await page.setViewport({width:viewport.width,height:viewport.height});
    await page.goto(report.url,{waitUntil:"networkidle2",timeout:60000});
    const state=await page.evaluate(()=>({
      width:document.documentElement.scrollWidth,viewport:innerWidth,
      logo:[...document.images].filter(x=>x.alt.includes("ResolverSentinel")||x.alt.includes("drift shield")).every(x=>x.complete&&x.naturalWidth>0),
      cta:[...document.querySelectorAll(".actionbar button")].every(x=>x.disabled),
      sourceLive:document.body.textContent.includes("SOURCE LIVE"),
    }));
    assert.ok(state.width<=state.viewport,`${viewport.name}: horizontal overflow`);
    assert.ok(state.logo,`${viewport.name}: supplied logo did not load`);
    assert.ok(state.cta,`${viewport.name}: unsigned/unconfigured write must be disabled`);
    assert.equal(state.sourceLive,false);
    report.assertions.push(`${viewport.name}: no overflow, logo loaded, unconfigured writes blocked, no false source-live claim`);
    const image=path.join(output,`${viewport.name}.png`);
    await page.screenshot({path:image,fullPage:true});report.screenshots.push(image);
    for(let i=1;i<5;i++){
      await page.locator(`.rail nav button:nth-child(${i+1})`).click();
      const heading=await page.$eval(".console-head h2",x=>x.textContent);
      assert.ok(heading);report.assertions.push(`${viewport.name}: procedure ${i+1} opens (${heading})`);
    }
  }
  assert.deepEqual(report.errors,[]);
  report.limitation="Local UI/layout smoke test only; no wallet signature or deployed contract exercised.";
  console.log(JSON.stringify({assertions:report.assertions.length,errors:report.errors,screenshots:report.screenshots},null,2));
}finally{
  await fs.writeFile(path.join(root,"docs/BROWSER_AUDIT.json"),JSON.stringify(report,null,2));
  await closeBrowser();
}
