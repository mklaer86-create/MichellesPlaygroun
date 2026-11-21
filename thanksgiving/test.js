// Browser tests for Thanksgiving Table Talk. Run: node thanksgiving/test.js
const { chromium } = require('playwright');
const path = require('path');
const URL = 'file://' + path.join(__dirname, 'index.html');

let passed = 0, failed = 0;
const ok = (cond, msg) => { if (cond) passed++; else { failed++; console.log('  ✗ ' + msg); } };
async function test(name, fn, page) { const f0 = failed; await fn(); console.log((failed === f0 ? '✓ ' : '✗ ') + name); }

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'null' }).catch(() => {});
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const load = async () => { await page.goto(URL); };
  const state = async () => ({ cat: await page.textContent('#cat'), q: await page.textContent('#q'), meta: await page.textContent('#meta') });
  const chip = name => page.locator('#chips .chip', { hasText: new RegExp('^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') });
  const bank = await (async () => { await load(); return page.evaluate(() => QUESTIONS); })();
  const cats = Object.keys(bank);

  await test('page loads with no errors; Back starts disabled', async () => {
    await load();
    ok(errors.length === 0, 'page errors: ' + errors.join('; '));
    ok(await page.isDisabled('#back'), 'Back should be disabled before any question');
    ok((await page.locator('#chips .chip').count()) === cats.length + 1, 'one chip per category plus All');
  });

  for (const c of cats) {
    await test(`Skip → with only "${c}" shows every ${c} question once, nothing else`, async () => {
      await load(); await chip(c).click();
      ok(await chip(c).getAttribute('aria-pressed') === 'true', 'chip should be highlighted');
      const seen = new Set();
      for (let i = 0; i < bank[c].length; i++) {
        await page.click('#next'); const s = await state();
        ok(s.cat === c, `label "${s.cat}" should be "${c}"`);
        ok(bank[c].includes(s.q), `"${s.q}" is not a ${c} question`);
        ok(!seen.has(s.q), `repeat: ${s.q}`); seen.add(s.q);
      }
      ok(seen.size === bank[c].length, `saw ${seen.size}/${bank[c].length}`);
      await page.click('#next');
      ok((await state()).cat.includes('seen them all'), 'should announce end of round');
      await page.click('#next'); const s = await state();
      ok(s.cat === c && bank[c].includes(s.q), 'new round should continue with the same category');
    });

    await test(`✨ New question with only "${c}" makes fresh ${c} questions`, async () => {
      await load(); await chip(c).click();
      const qs = new Set();
      for (let i = 0; i < 20; i++) {
        await page.click('#gen'); const s = await state();
        ok(s.cat === `${c} · ✨ new`, `label "${s.cat}" should be "${c} · ✨ new"`);
        qs.add(s.q);
      }
      ok(qs.size >= 15, `only ${qs.size} distinct questions in 20 generations`);
    });
  }

  await test('"All" covers every category via Skip', async () => {
    await load(); await chip(cats[0]).click(); await chip('All').click();
    ok(await chip('All').getAttribute('aria-pressed') === 'true', 'All should be highlighted');
    const total = cats.reduce((n, c) => n + bank[c].length, 0), labels = new Set(), qs = new Set();
    for (let i = 0; i < total; i++) { await page.click('#next'); const s = await state(); labels.add(s.cat); qs.add(s.q); }
    ok(qs.size === total, `saw ${qs.size}/${total} unique questions`);
    ok(cats.every(c => labels.has(c)), 'every category should appear');
  });

  await test('picking two categories mixes only those two (Skip and ✨ New)', async () => {
    await load(); await chip("Food & Feast").click(); await chip("Kids' Corner").click();
    const allowed = ["Food & Feast", "Kids' Corner"];
    const n = bank["Food & Feast"].length + bank["Kids' Corner"].length;
    for (let i = 0; i < n; i++) { await page.click('#next'); const s = await state(); ok(allowed.includes(s.cat), `Skip gave "${s.cat}"`); }
    for (let i = 0; i < 20; i++) { await page.click('#gen'); const s = await state(); ok(allowed.some(a => s.cat === `${a} · ✨ new`), `✨ gave "${s.cat}"`); }
  });

  await test('turning off the last category falls back to All', async () => {
    await load(); await chip('Thankful').click(); await chip('Thankful').click();
    ok(await chip('All').getAttribute('aria-pressed') === 'true', 'All should be selected again');
  });

  await test('← Back and Skip → walk through history; ✨ after Back starts a new path', async () => {
    await load(); const h = [];
    for (let i = 0; i < 3; i++) { await page.click('#gen'); h.push((await state()).q); }
    await page.click('#back'); ok((await state()).q === h[1], 'Back → #2');
    await page.click('#back'); ok((await state()).q === h[0], 'Back → #1');
    ok(await page.isDisabled('#back'), 'Back disabled on first question');
    await page.click('#next'); ok((await state()).q === h[1], 'Skip replays → #2');
    await page.click('#next'); ok((await state()).q === h[2], 'Skip replays → #3');
    await page.click('#next'); const s = await state();
    ok(Object.values(bank).flat().includes(s.q), 'Skip past history draws from the list');
    await page.click('#back'); await page.click('#back'); await page.click('#gen');
    const fresh = (await state()).q;
    await page.click('#next'); const after = (await state()).q;
    ok(after !== h[2] && after !== fresh, 'old forward history is dropped after ✨');
    await page.click('#back'); ok((await state()).q === fresh, 'Back returns to the ✨ question');
  });

  await test('Back works after the end-of-round message', async () => {
    await load(); await chip('Thankful').click();
    let last; for (let i = 0; i < bank['Thankful'].length; i++) { await page.click('#next'); last = (await state()).q; }
    await page.click('#next'); await page.click('#back');
    ok((await state()).q === last, 'Back should show the last question before the message');
  });

  await test('Copy puts the question on the clipboard', async () => {
    await load(); await page.click('#gen'); const q = (await state()).q;
    await page.click('#copy'); await page.waitForFunction(() => document.getElementById('copy').textContent !== 'Copy', null, { timeout: 3000 }).catch(() => {});
    ok(await page.textContent('#copy') === 'Copied!', 'button should say Copied!');
    ok(['Copied!', "Can't copy"].includes(await page.textContent('#copy')), 'button gives feedback');
    const clip = await page.evaluate(() => navigator.clipboard.readText()).catch(() => null);
    ok(clip === null || clip === q, `clipboard has "${clip}"`);
    await page.waitForTimeout(1400); ok(await page.textContent('#copy') === 'Copy', 'button label resets');
  });

  await test('tapping the card and keyboard shortcuts work', async () => {
    await load();
    await page.click('.card'); const a = await state(); ok(a.cat.includes('✨'), 'card tap makes a ✨ question');
    await page.keyboard.press('Space'); const b = await state(); ok(b.cat.includes('✨') && b.q !== a.q, 'Space makes a new ✨ question');
    await page.keyboard.press('ArrowLeft'); ok((await state()).q === a.q, '← goes back');
    await page.keyboard.press('ArrowRight'); ok((await state()).q === b.q, '→ skips forward');
  });

  await test('every question pattern is tagged, well-formed and kid-safe', async () => {
    await load();
    const r = await page.evaluate(() => {
      const bad = [], cats = Object.keys(QUESTIONS), cover = {};
      TEMPLATES.forEach((t, i) => {
        if (!t.cats.length || !t.cats.every(c => cats.includes(c))) bad.push(`pattern ${i} has unknown category`);
        t.cats.forEach(c => cover[c] = (cover[c] || 0) + 1);
        for (let k = 0; k < 60; k++) {
          const q = t.make().replace(/\ba ([aeiou])/g, "an $1");
          if (/undefined|\$\{|NaN/.test(q) || !q.endsWith('?')) bad.push(q);
          const m = q.match(/rather .*? (.+?) or (.+?)( at| as|\?)/); if (m && m[1].endsWith(m[2])) bad.push('same choice twice: ' + q);
        }
      });
      return { bad: [...new Set(bad)].slice(0, 5), cover };
    });
    ok(r.bad.length === 0, 'bad output: ' + r.bad.join(' | '));
    for (const c of cats) ok((r.cover[c] || 0) >= 4, `${c} has only ${r.cover[c] || 0} patterns`);
    const words = /\b(kill|dead|die|blood|drunk|beer|wine|sex|hate|stupid|politic|religion)\w*/i;
    const all = Object.values(bank).flat();
    ok(!all.some(q => words.test(q)), 'list has a word not suitable for kids');
  });

  await test('fits a phone screen (no sideways scrolling)', async () => {
    await load();
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'page scrolls sideways');
  });

  ok(errors.length === 0, 'page errors during tests: ' + errors.join('; '));
  console.log(`\n${passed} checks passed, ${failed} failed`);
  await browser.close(); process.exit(failed ? 1 : 0);
})();
