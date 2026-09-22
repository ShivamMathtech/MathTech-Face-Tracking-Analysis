import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const server=spawn('python',['../scripts/serve.py'],{stdio:'ignore'});
let browser;
try{
 for(let i=0;i<30;i++){try{if((await fetch('http://127.0.0.1:8080')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage();const outside=[];const errors=[];
 page.on('request',r=>{if(r.url().startsWith('http')&&!r.url().startsWith('http://127.0.0.1:8080'))outside.push(r.url());});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8080');await page.getByTestId('media-upload').setInputFiles('../docs/reference-ui.png');
 await page.getByRole('button',{name:'Lock Face',exact:true}).waitFor();
 for(let i=0;i<100;i++){if(await page.getByRole('button',{name:'Lock Face',exact:true}).isEnabled())break;await new Promise(r=>setTimeout(r,300));}
 assert.equal(await page.getByRole('button',{name:'Lock Face',exact:true}).isEnabled(),true,'Bundled local model must infer in prebuilt mode');assert.deepEqual(outside,[]);assert.deepEqual(errors,[]);console.log('Prebuilt app: real image inference passed, zero external network requests, zero page errors.');
}finally{await browser?.close();server.kill();}
