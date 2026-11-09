(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const articles = $$('.article');
  const sidebar = $('#sidebar');
  const menu = $('.menu-toggle');
  const backdrop = $('.mobile-backdrop');
  const dialog = $('#search-dialog');
  const searchInput = $('#search-input');
  const results = $('#search-results');
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* file/private mode */ } }
  };
  let currentArticle = articles[0];
  let tocHeadings = [];
  let os = storage.get('queqiao-docs-os') || (/Linux/.test(navigator.platform) ? 'linux' : 'windows');
  if (!['windows', 'linux'].includes(os)) os = 'windows';
  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const dark = theme === 'dark';
    $('.theme-toggle').textContent = dark ? '☀' : '☾';
    $('.theme-toggle').setAttribute('aria-label', dark ? '切换到浅色模式' : '切换到深色模式');
    $('meta[name="theme-color"]').content = dark ? '#14121a' : '#faf9fc';
  }
  const savedTheme = storage.get('queqiao-docs-theme');
  setTheme(['light', 'dark'].includes(savedTheme) ? savedTheme : 'light');
  $('.theme-toggle').addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    setTheme(theme); storage.set('queqiao-docs-theme', theme);
  });
  function closeMenu() {
    sidebar.classList.remove('open'); backdrop.hidden = true;
    menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', '打开文档目录');
  }
  menu.addEventListener('click', () => {
    const open = !sidebar.classList.contains('open');
    sidebar.classList.toggle('open', open); backdrop.hidden = !open;
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? '关闭文档目录' : '打开文档目录');
  });
  backdrop.addEventListener('click', closeMenu);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', () => { if (innerWidth > 760) closeMenu(); });
  function updateTocActive() {
    if (!tocHeadings.length) return;
    let active = tocHeadings[0];
    for (const heading of tocHeadings) { if (heading.getBoundingClientRect().top <= 145) active = heading; }
    $$('#toc a').forEach(a => {
      const selected = a.dataset.heading === active.id;
      a.classList.toggle('active', selected);
      if (selected) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
  }
  function buildToc() {
    const toc = $('#toc'); toc.replaceChildren();
    tocHeadings = $$('h2', currentArticle).filter(h => !h.closest('[hidden]'));
    tocHeadings.forEach(heading => {
      const link = document.createElement('a'); link.href = '#' + currentArticle.id + '/' + encodeURIComponent(heading.id);
      link.textContent = heading.textContent; link.dataset.heading = heading.id; toc.append(link);
    });
    updateTocActive();
  }
  function setOs(value) {
    os = value; storage.set('queqiao-docs-os', os);
    $$('[data-os]').forEach(el => { el.hidden = el.dataset.os !== os; });
    $$('[data-set-os]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.setOs === os)));
    buildToc();
  }
  $$('[data-set-os]').forEach(button => button.addEventListener('click', () => setOs(button.dataset.setOs)));
  function route() {
    let hash;
    try { hash = decodeURIComponent(location.hash.slice(1)); } catch { hash = ''; }
    const [id, headingId] = hash.split('/');
    const next = articles.find(article => article.id === id) || articles[0];
    const changed = next !== currentArticle;
    currentArticle = next;
    $('.guide-group').open = true;
    articles.forEach(article => { article.hidden = article !== next; });
    $$('.nav-link').forEach(link => {
      const selected = link.hash === '#' + next.id;
      link.classList.toggle('active', selected);
      if (selected) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    $('#breadcrumb-title').textContent = next.dataset.title;
    document.title = next.dataset.title + ' · GPT 指南 · 鹊桥文档';
    buildToc(); closeMenu();
    requestAnimationFrame(() => {
      const heading = headingId ? document.getElementById(headingId) : null;
      if (heading && next.contains(heading) && !heading.closest('[hidden]')) heading.scrollIntoView({ behavior: 'instant', block: 'start' });
      else window.scrollTo({ top: 0, behavior: 'instant' });
      if (changed) $('#main').focus({ preventScroll: true });
      updateTocActive();
    });
  }
  window.addEventListener('hashchange', route);
  let scrollScheduled = false;
  window.addEventListener('scroll', () => {
    if (scrollScheduled) return;
    scrollScheduled = true;
    requestAnimationFrame(() => { updateTocActive(); scrollScheduled = false; });
  }, { passive: true });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (link && link.hash === location.hash) { closeMenu(); route(); }
  });
  let toastTimer;
  function toast(message) {
    const el = $('#toast'); el.textContent = message; el.classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 2500);
  }
  async function copyCode(button) {
    const code = $('code', button.closest('.code-block'));
    let copied = false;
    try { await navigator.clipboard.writeText(code.textContent); copied = true; } catch {
      const range = document.createRange(); range.selectNodeContents(code);
      const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range);
      try { copied = document.execCommand('copy'); } catch { /* Keep text selected for manual copying. */ }
      if (copied) selection.removeAllRanges();
    }
    button.textContent = copied ? '已复制' : '已选中';
    toast(copied ? '命令已复制' : '已选中代码，请按 Ctrl+C 复制');
    setTimeout(() => { button.textContent = '复制'; }, 2200);
  }
  $$('.copy-button').forEach(button => button.addEventListener('click', () => copyCode(button)));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); dialog.close(); }
  });
  const searchIndex = articles.flatMap(article => {
    const entries = [{ page: article.id, title: article.dataset.title, heading: '', text: '' }];
    let current = entries[0];
    for (const child of article.children) {
      if (child.matches('h2')) {
        current = { page: article.id, title: child.textContent, heading: child.id, text: '', pageTitle: article.dataset.title }; entries.push(current);
      } else if (!child.matches('.pagination,.page-eyebrow')) current.text += ' ' + child.textContent;
    }
    return entries;
  });
  function renderSearch() {
    const query = searchInput.value.trim().toLocaleLowerCase(); results.replaceChildren();
    let matches = searchIndex.filter(entry => !query || (entry.title + entry.text).toLocaleLowerCase().includes(query));
    if (!query) matches = matches.filter(entry => !entry.heading);
    matches.slice(0, 18).forEach(entry => {
      const link = document.createElement('a'); link.className = 'search-result';
      link.href = '#' + entry.page + (entry.heading ? '/' + encodeURIComponent(entry.heading) : '');
      const title = document.createElement('strong'); title.textContent = (entry.pageTitle ? entry.pageTitle + ' / ' : '') + entry.title;
      const snippet = document.createElement('p');
      const text = entry.text.replace(/\s+/g, ' ').trim();
      const position = query ? Math.max(0, text.toLocaleLowerCase().indexOf(query) - 28) : 0;
      snippet.textContent = (position ? '…' : '') + text.slice(position, position + 105) + (text.length > position + 105 ? '…' : '');
      link.append(title, snippet); link.addEventListener('click', () => dialog.close()); results.append(link);
    });
    if (!matches.length) { const empty = document.createElement('p'); empty.className = 'search-empty'; empty.textContent = '没有找到相关内容，试试「npm」「密钥」或「配置」。'; results.append(empty); }
  }
  function openSearch() { closeMenu(); renderSearch(); dialog.showModal(); searchInput.focus(); }
  $('.search-trigger').addEventListener('click', openSearch);
  searchInput.addEventListener('input', renderSearch);
  searchInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); $('.search-result', results)?.click(); }
    if (event.key === 'ArrowDown') { event.preventDefault(); $('.search-result', results)?.focus(); }
  });
  results.addEventListener('keydown', event => {
    const links = $$('.search-result', results); const i = links.indexOf(document.activeElement);
    if (event.key === 'ArrowDown') { event.preventDefault(); links[Math.min(i + 1, links.length - 1)]?.focus(); }
    if (event.key === 'ArrowUp') { event.preventDefault(); if (i <= 0) searchInput.focus(); else links[i - 1]?.focus(); }
  });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); if (dialog.open) dialog.close(); else openSearch(); }
  });
  setOs(os); route();
})();


