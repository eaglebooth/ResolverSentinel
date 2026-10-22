import {getBrowser,getPage,closeBrowser} from '../../.agents/skills/chrome-devtools/scripts/lib/browser.js';
import {writeFileSync} from 'node:fs';
const address='0xf0090b257FF2178B84faE25f137a49Edf6a70938';
try{
 const browser=await getBrowser({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),page=await getPage(browser);
 await page.goto(`https://explorer-studio.genlayer.com/address/${address}`,{waitUntil:'networkidle2',timeout:60000});
 await page.waitForFunction(()=>document.body.textContent.includes('Deploy Tx'),{timeout:60000});
 const observed=await page.evaluate(()=>({text:document.body.textContent,links:[...document.querySelectorAll('a[href]')].map(a=>({text:a.textContent,href:a.href}))}));
 writeFileSync('docs/live-evidence/explorer-deployment-page.json',JSON.stringify({checked_at:new Date().toISOString(),address,...observed},null,2)+'\n');
 console.log(JSON.stringify(observed.links.filter(l=>l.href.includes('/tx/')),null,2));
}finally{await closeBrowser()}
