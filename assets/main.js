async function loadCV() {
  try {
    const res = await fetch('data/cv.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`cv.json fetch failed: ${res.status}`);
    const cv = await res.json();
    initSite(cv);
  } catch (err) {
    document.getElementById('content').innerHTML =
      `<section><h2>Error</h2><p>Could not load CV data. Ensure data/cv.json exists and is valid JSON.</p><pre>${err.message}</pre></section>`;
  }
}

function initSite(cv) {
  const title = cv.meta?.name ? `${cv.meta.name} — Portfolio` : 'Portfolio';
  document.title = title;
  document.getElementById('site-title').textContent = title;
  document.getElementById('name').textContent = cv.meta?.name || 'Your Name';
  document.getElementById('name-foot').textContent = cv.meta?.name || 'Your Name';
  document.getElementById('tagline').textContent = cv.meta?.tagline || '';
  document.getElementById('year').textContent = new Date().getFullYear();

  const links = [];
  const p = cv.meta?.profiles || {};
  if (cv.meta?.cv_pdf) links.push(linkBtn('Download CV (PDF)', cv.meta.cv_pdf));
  if (p.orcid) links.push(linkBtn('ORCID', p.orcid));
  if (p.scholar) links.push(linkBtn('Google Scholar', p.scholar));
  if (p.scopus) links.push(linkBtn('Scopus', p.scopus));
  if (p.linkedin) links.push(linkBtn('LinkedIn', p.linkedin));
  document.getElementById('quick-links').replaceChildren(...links);

  const routes = [
    { id:'about', label:'About', render: () => renderAbout(cv) },
    { id:'research', label:'Research', render: () => renderResearch(cv) },
    { id:'publications', label:'Publications', render: () => renderPublications(cv) },
    { id:'teaching', label:'Teaching', render: () => renderTeaching(cv) },
    { id:'awards', label:'Awards', render: () => renderAwards(cv) },
    { id:'service', label:'Service', render: () => renderService(cv) },
    { id:'contact', label:'Contact', render: () => renderContact(cv) }
  ];

  const nav = document.getElementById('nav');
  routes.forEach(r => {
    const a = document.createElement('a');
    a.href = `#/${r.id}`;
    a.textContent = r.label;
    a.onclick = () => setActive(r.id);
    nav.appendChild(a);
  });

  window.addEventListener('hashchange', () => route(routes));
  route(routes);
}

function setActive(id) {
  [...document.querySelectorAll('nav a')].forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === `#/${id}`);
  });
}

function route(routes) {
  const id = (location.hash.replace('#/', '') || 'about');
  const route = routes.find(r => r.id === id) || routes[0];
  setActive(route.id);
  const content = document.getElementById('content');
  content.innerHTML = '';
  content.appendChild(route.render());
}

/* Renderers */
function renderAbout(cv) {
  const s = document.createElement('section');
  s.innerHTML = `<h2>About</h2>
  <div class="grid-2">
    <div>${md(cv.about?.summary_md || 'Add a short bio in about.summary_md')}</div>
    <div>
      <div class="list">
        ${(cv.about?.keypoints || []).map(k => `<div class="item">${k}</div>`).join('') || `<div class="empty">No highlights yet.</div>`}
      </div>
    </div>
  </div>`;
  return s;
}

function renderResearch(cv) {
  const s = document.createElement('section');
  s.innerHTML = `<h2>Research</h2>`;
  const list = document.createElement('div');
  list.className = 'list';
  const tags = cv.meta?.tagline ? cv.meta.tagline.split('•').map(t => t.trim()) : [];
  if (tags.length === 0) list.innerHTML = `<div class="empty">No research areas provided.</div>`;
  else list.innerHTML = tags.map(t => `<div class="item"><span class="badge">Area</span> ${t}</div>`).join('');
  s.appendChild(list);
  return s;
}

function renderPublications(cv) {
  const pubs = (cv.publications || []).slice().sort((a,b) => (b.year||0)-(a.year||0));
  const s = document.createElement('section');
  s.innerHTML = `<h2>Publications</h2>`;
  const list = document.createElement('div');
  list.className = 'list';
  if (pubs.length === 0) list.innerHTML = `<div class="empty">No publications yet.</div>`;
  else list.innerHTML = pubs.map(p => `
    <div class="item">
      <h3>${esc(p.title || 'Untitled')}</h3>
      <div class="meta">${esc((p.authors||[]).join(', '))} • ${esc(p.venue||'')} • ${p.year||''}</div>
      <div>${(p.tags||[]).map(t=>`<span class="badge">${esc(t)}</span>`).join('')}</div>
      <div>${linkMaybe('DOI', p.links?.doi || p.doi)} ${linkMaybe('Publisher', p.links?.publisher)}</div>
    </div>`).join('');
  s.appendChild(list);
  return s;
}

function renderTeaching(cv) {
  const s = document.createElement('section');
  s.innerHTML = `<h2>Teaching</h2>`;
  const list = document.createElement('div'); list.className = 'list';
  const items = cv.teaching || [];
  if (items.length === 0) list.innerHTML = `<div class="empty">No teaching entries.</div>`;
  else list.innerHTML = items.map(c => `
    <div class="item">
      <h3>${esc(c.course || 'Course')}</h3>
      <div class="meta">${esc(c.institution||'')} • ${esc(c.year||'')} • ${c.hours?c.hours+'h':''}</div>
      ${c.materials?.length ? c.materials.map(u => linkBtn('Material', u)).join(' ') : ''}
    </div>`).join('');
  s.appendChild(list);
  return s;
}

function renderAwards(cv) {
  const s = document.createElement('section');
  s.innerHTML = `<h2>Awards</h2>`;
  const list = document.createElement('div'); list.className = 'list';
  const items = cv.awards || [];
  list.innerHTML = items.length ? items.map(a => `
    <div class="item">
      <h3>${esc(a.name || 'Award')}</h3>
      <div class="meta">${a.year || ''}</div>
    </div>`).join('') : `<div class="empty">No awards listed.</div>`;
  s.appendChild(list);
  return s;
}

function renderService(cv) {
  const s = document.createElement('section');
  s.innerHTML = `<h2>Service</h2>`;
  const blocks = [];

  // Editorial roles
  const ed = cv.service?.editorial || [];
  blocks.push(sectionBlock('Editorial Roles', ed.map(e => `
    <div class="item"><h3>${esc(e.role || 'Role')}</h3>
    <div class="meta">${esc(e.journal||'Journal')} • ${esc(e.start || '')} – ${esc(e.end || 'present')}</div>
    <div>${(e.responsibilities||[]).map(r=>`<span class="badge">${esc(r)}</span>`).join(' ')}</div></div>`)));

  // Reviewing summary
  const rs = cv.service?.reviewing_summary;
  if (rs) blocks.push(sectionBlock('Peer Review', [
    `<div class="item"><div class="meta">Total reviews: ${rs.total_reviews || 0}</div>
    <div>${(rs.focus||[]).map(f=>`<span class="badge">${esc(f)}</span>`).join(' ')}</div></div>`
  ]));

  // TPC & Chairs
  const tpc = cv.service?.tpc || [];
  blocks.push(sectionBlock('Technical Program Committees', tpc.map(t => `
    <div class="item"><h3>${esc(t.event)}</h3><div class="meta">${(t.years||[]).join(', ')}</div></div>`)));
  const chairs = cv.service?.chairs || [];
  blocks.push(sectionBlock('Chairs', chairs.map(c => `
    <div class="item"><h3>${esc(c.event)}</h3><div class="meta">${esc(c.role||'')}</div></div>`)));

  s.append(...blocks);
  return s;
}

function renderContact(cv) {
  const s = document.createElement('section');
  const m = cv.meta || {};
  const email = m.email ? `<a class="button" href="mailto:${m.email}">${m.email}</a>` : '';
  const loc = m.location ? `<div class="meta">Location: ${esc(m.location)}</div>` : '';
  const links = [];
  for (const [k,v] of Object.entries(m.profiles||{})) if (v) links.push(linkBtn(cap(k), v));
  s.innerHTML = `<h2>Contact</h2>${email}${loc}<div style="margin-top:.5rem">${links.join(' ')}</div>`;
  return s;
}

/* helpers */
function md(txt){ return esc(txt).replace(/\n/g,'<br>'); }
function esc(s){ return (s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function linkBtn(label, href){ return href ? `<a class="button" href="${href}" target="_blank" rel="noopener">${label}</a>` : ''; }
function linkMaybe(label, href){ return href ? `<a href="${href}" target="_blank" rel="noopener">${label}</a>` : ''; }
function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
function sectionBlock(title, items){
  const wrap = document.createElement('div');
  wrap.innerHTML = `<h3 style="margin-top:1rem">${title}</h3>`;
  const list = document.createElement('div'); list.className = 'list';
  list.innerHTML = items.length ? items.join('') : `<div class="empty">No entries.</div>`;
  wrap.appendChild(list);
  return wrap;
}

loadCV();
