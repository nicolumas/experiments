#!/usr/bin/env node
/**
 * Interaction checks for penguins-art-drop.html. The other half of audit.js:
 * that one measures layout and contrast, this one clicks things.
 *
 *   node functional.js
 *
 * Playwright comes from the repo e2e workspace, so there is nothing to install.
 */
const path=require('path');
const E2E=path.resolve('/Users/nicolatracey/LUMAS ART Dropbox/Nicola Tracey/Mac (2)/Desktop/CODE/lumassprykerng/tests/e2e/node_modules/@playwright/test');
const {chromium}=require(E2E);
// see audit.js: CHROME_PATH overrides the pinned browser revision
const LAUNCH=process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{};
const U=process.argv[2]||'http://localhost:8947/penguins-art-drop.html';
const ok=(c,m)=>console.log((c?'  PASS  ':'  FAIL  ')+m);
(async()=>{
 const b=await chromium.launch(LAUNCH);

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
 await p.goto(U+'?phase=ANNOUNCE'); await p.waitForTimeout(600);
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
 ok(buttons.join(',')==='ANNOUNCE,EARLY_ACCESS,PUBLIC,ENDED','dev switcher renders all four phases');
 await m.click('#dev button:nth-child(3)'); // PUBLIC
 await m.waitForTimeout(700);
 const meta=await m.$eval('.dev__meta',e=>e.textContent);
 const cd=await m.$eval('#cd-close',e=>e.textContent.replace(/\s+/g,' ').trim());
 ok(/now: 21\.12/.test(meta),'dev clock time-travels into PUBLIC ('+meta.split(' · ')[0]+')');
 ok(/^02TAGE|^\d\dTAGE/.test(cd.replace(/ /g,'')),'countdown is plausible inside the phase: '+cd);
 // The readiness meter counts RENDERED .fallback blocks, i.e. assets that
 // failed to load. The twelve stand-in panels DO load, so a clean meter is
 // still the right expectation here; audit.js is what asserts the stand-in set.
 // sheet. It counted 1 while the artist portrait was still a placeholder block;
 // asserting 0 is what keeps a future missing asset from shipping quietly.
 ok(/0 Bild-Platzhalter/.test(meta),'readiness meter reports no image placeholders: '+meta);

 // --- one h1, source order = tab order --------------------------------
 const h1s=await p.$$eval('h1',e=>e.length);
 ok(h1s===1,`exactly one <h1> (${h1s})`);
 const heads=await p.$$eval('h1,h2,h3',es=>es.filter(e=>e.offsetParent!==null).map(e=>e.tagName+' '+e.textContent.trim().slice(0,28)));
 console.log('  heading outline:'); heads.forEach(h=>console.log('    '+h));

 // --- ENDED must NOT route to the PDP ----------------------------------
 // The inverse of the Pillow build. That drop was a price window, so ENDED kept
 // a live CTA to a work that was still for sale. This one closes for good and
 // the article is deactivated on 23.12. at 00:00, so any surviving PDP link in
 // ENDED would send a buyer to a page that cannot sell.
 await p.goto(U+'?phase=ENDED'); await p.waitForTimeout(600);
 const buys=await p.$$eval('a[data-buy]',as=>as.filter(a=>a.offsetParent!==null).map(a=>a.textContent.trim()));
 ok(buys.length===0,'ENDED shows no buy CTA ('+JSON.stringify(buys)+')');
 const pdpLinks=await p.$$eval('a[href]',as=>as.filter(a=>a.offsetParent!==null&&a.getAttribute('href').includes('/penguins_in_japan/')).map(a=>a.textContent.trim()));
 ok(pdpLinks.length===0,'ENDED links nowhere near the PDP ('+JSON.stringify(pdpLinks)+')');
 const onward=await p.$$eval('a[href="#more-works"]',as=>as.filter(a=>a.offsetParent!==null).map(a=>a.textContent.trim()));
 ok(onward.length>=1,'ENDED offers the works rail instead: '+JSON.stringify(onward));

 // --- ANNOUNCE must not link to a PDP that is not published yet ---------
 await p.goto(U+'?phase=ANNOUNCE'); await p.waitForTimeout(600);
 const earlyPdp=await p.$$eval('a[href]',as=>as.filter(a=>a.offsetParent!==null&&a.getAttribute('href').includes('/penguins_in_japan/')).map(a=>a.textContent.trim()));
 ok(earlyPdp.length===0,'ANNOUNCE links nowhere near the unpublished PDP ('+JSON.stringify(earlyPdp)+')');

 await b.close();
})();
