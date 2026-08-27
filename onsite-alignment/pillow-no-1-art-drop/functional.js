#!/usr/bin/env node
/**
 * Interaction checks for pillow-art-drop.html. The other half of audit.js:
 * that one measures layout and contrast, this one clicks things.
 *
 *   node functional.js
 *
 * Playwright comes from the repo e2e workspace, so there is nothing to install.
 */
const path=require('path');
const E2E=path.resolve('/Users/nicolatracey/LUMAS ART Dropbox/Nicola Tracey/Mac (2)/Desktop/CODE/lumassprykerng/tests/e2e/node_modules/@playwright/test');
const {chromium}=require(E2E);
const U='http://localhost:8947/pillow-art-drop.html';
const ok=(c,m)=>console.log((c?'  PASS  ':'  FAIL  ')+m);
(async()=>{
 const b=await chromium.launch();

 // --- carousels scroll (the grid-vs-flex trap) -------------------------
 let p=await b.newPage({viewport:{width:1440,height:900}});
 await p.goto(U+'?phase=PUBLIC'); await p.waitForTimeout(900);
 for (const name of ['rooms','works']) {
   const sel=`[data-carousel="${name}"]`;
   const before=await p.$eval(sel+' .carousel__track',t=>t.scrollLeft);
   await p.click(sel+' .carousel__btn[data-dir="1"]');
   await p.waitForTimeout(800);
   const after=await p.$eval(sel+' .carousel__track',t=>t.scrollLeft);
   ok(after>before, `${name} carousel scrolls on click (${before} -> ${Math.round(after)})`);
   // keyboard
   await p.focus(sel+' .carousel__track');
   await p.keyboard.press('ArrowRight'); await p.waitForTimeout(800);
   const kb=await p.$eval(sel+' .carousel__track',t=>t.scrollLeft);
   ok(kb>after, `${name} carousel responds to ArrowRight (${Math.round(after)} -> ${Math.round(kb)})`);
   const dis=await p.$eval(sel+' .carousel__btn[data-dir="-1"]',b=>b.disabled);
   ok(dis===false, `${name} prev button enabled once scrolled`);
 }

 // --- newsletter validation -------------------------------------------
 await p.goto(U+'?phase=REVEAL'); await p.waitForTimeout(600);
 await p.click('#close .nl__row button[type="submit"]');
 await p.waitForTimeout(200);
 let errShown=await p.$eval('#err-close',e=>!e.hidden);
 let invalid=await p.$eval('#email-close',e=>e.getAttribute('aria-invalid'));
 ok(errShown&&invalid==='true','empty email shows the error and marks the field invalid');
 await p.fill('#email-close','collector@example.com');
 await p.click('#close .nl__row button[type="submit"]');
 await p.waitForTimeout(500);
 const success=await p.$eval('#close [data-nl-success]',e=>!e.hidden);
 ok(success,'valid email swaps the form for the confirmation');

 // --- nav drawer -------------------------------------------------------
 const m=await b.newPage({viewport:{width:390,height:844}});
 await m.goto(U); await m.waitForTimeout(600);
 ok(await m.$eval('#nav-drawer',e=>e.hidden),'drawer starts closed');
 await m.click('.nav__burger'); await m.waitForTimeout(250);
 ok(await m.$eval('#nav-drawer',e=>!e.hidden) && await m.$eval('.nav__burger',e=>e.getAttribute('aria-expanded'))==='true',
    'burger opens the drawer and updates aria-expanded');

 // --- dev switcher + simulated clock ----------------------------------
 await m.goto(U+'?dev=1'); await m.waitForTimeout(700);
 const buttons=await m.$$eval('#dev button',bs=>bs.map(b=>b.textContent));
 ok(buttons.join(',')==='REVEAL,EARLY_ACCESS,PUBLIC,ENDED','dev switcher renders all four phases');
 await m.click('#dev button:nth-child(3)'); // PUBLIC
 await m.waitForTimeout(700);
 const meta=await m.$eval('.dev__meta',e=>e.textContent);
 const cd=await m.$eval('#cd-close',e=>e.textContent.replace(/\s+/g,' ').trim());
 ok(/now: 12\.09/.test(meta),'dev clock time-travels into PUBLIC ('+meta.split(' · ')[0]+')');
 ok(/^02TAGE|^\d\dTAGE/.test(cd.replace(/ /g,'')),'countdown is plausible inside the phase: '+cd);
 ok(/1 Bild-Platzhalter/.test(meta),'readiness meter counts the portrait placeholder');

 // --- one h1, source order = tab order --------------------------------
 const h1s=await p.$$eval('h1',e=>e.length);
 ok(h1s===1,`exactly one <h1> (${h1s})`);
 const heads=await p.$$eval('h1,h2,h3',es=>es.filter(e=>e.offsetParent!==null).map(e=>e.tagName+' '+e.textContent.trim().slice(0,28)));
 console.log('  heading outline:'); heads.forEach(h=>console.log('    '+h));

 // --- ENDED keeps a live route to the PDP ------------------------------
 await p.goto(U+'?phase=ENDED'); await p.waitForTimeout(600);
 const ctas=await p.$$eval('a[data-buy]:not([hidden])',as=>as.filter(a=>a.offsetParent!==null).map(a=>a.textContent.trim()+' -> '+a.getAttribute('href')));
 ok(ctas.length>0 && ctas.every(c=>c.includes('/pillow_no_1/')),'ENDED still routes to the PDP: '+JSON.stringify(ctas));

 await b.close();
})();
