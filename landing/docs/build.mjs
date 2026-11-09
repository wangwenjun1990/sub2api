import { readFile, writeFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from '../../frontend/node_modules/marked/lib/marked.esm.js';

const root = dirname(fileURLToPath(import.meta.url));
const pages = [
  ['quickstart', '快速开始', '↗', 'GPT / CODEX · GET STARTED'],
  ['node', 'Node.js 与 npm', '⬡', 'RUNTIME'],
  ['codex', '安装 Codex', '>_', 'CODEX CLI'],
  ['cc-switch', 'CC Switch 配置', '⇄', 'CC SWITCH'],
  ['configuration', '配置详解', '⚙', 'CONFIGURATION'],
  ['faq', '常见问题', '?', 'TROUBLESHOOTING']
];
const escape = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const [source, template, css, js, images] = await Promise.all([
  readFile(join(root, 'content.md'), 'utf8').then(s => s.replace(/^\uFEFF/, '')), readFile(join(root, 'template.html'), 'utf8').then(s => s.replace(/^\uFEFF/, '')),
  readFile(join(root, 'styles.css'), 'utf8').then(s => s.replace(/^\uFEFF/, '')), readFile(join(root, 'app.js'), 'utf8').then(s => s.replace(/^\uFEFF/, '')), readdir(join(root, 'images'))
]);
const sections = [...source.matchAll(/<!-- page:([a-z-]+) -->([\s\S]*?)(?=<!-- page:|$)/g)];
if (sections.length !== pages.length) throw new Error('正文需要与 pages 对应的六个 page 标记。');
const articles = pages.map(([id, title, icon, eyebrow], index) => {
  const section = sections.find(match => match[1] === id);
  if (!section) throw new Error(`缺少文档页：${id}`);
  let count = 0;
  const renderer = new marked.Renderer();
  renderer.heading = function ({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    return `<h${depth} id="${id}-section-${++count}">${text}</h${depth}>\n`;
  };
  renderer.code = ({ text, lang }) => `<div class="code-block"><div class="code-header"><span>${escape(lang || 'text')}</span><button type="button" class="copy-button" aria-label="复制代码">复制</button></div><pre><code>${escape(text)}</code></pre></div>\n`;
  const parse = md => marked.parse(md, { renderer, gfm: true });
  let md = section[2].trim().replace(/<!-- screenshot:([a-z-]+)\s*\|\s*(.*?) -->/g, (_, slug, caption) => {
    const image = images.find(file => file.match(/\.(png|jpe?g|webp|gif)$/i) && file.replace(/\.[^.]+$/, '') === slug);
    if (image) return `\n<figure><img src="images/${escape(image)}" alt="${escape(caption)}" loading="lazy"><figcaption>${escape(caption)}</figcaption></figure>\n`;
    return `\n<figure class="screenshot-placeholder"><span aria-hidden="true">▧</span><figcaption>${escape(caption)}<small>操作图示 · 待补充</small></figcaption></figure>\n`;
  });
  md = md.replace(/^:::(windows|linux)\s*\r?\n([\s\S]*?)^:::\s*$/gm, (_, os, body) => `\n<section data-os="${os}"${os === 'linux' ? ' hidden' : ''}>\n${parse(body)}\n</section>\n`);
  const html = parse(md)
    .replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>')
    .replace(/<a href="(https?:[^\"]*)"/g, '<a href="$1" target="_blank" rel="noopener noreferrer"');
  const previous = pages[index - 1], next = pages[index + 1];
  const pagination = `<nav class="pagination" aria-label="前后文档">${previous ? `<a href="#${previous[0]}"><small>← 上一篇</small>${previous[1]}</a>` : '<span></span>'}${next ? `<a href="#${next[0]}"><small>下一篇 →</small>${next[1]}</a>` : '<a href="#quickstart"><small>已完成入门指南</small>回到快速开始 ↗</a>'}</nav>`;
  return `<article class="article" id="${id}" data-title="${title}"${index ? ' hidden' : ''}><p class="page-eyebrow">${eyebrow}</p>${html}${pagination}</article>`;
}).join('\n');
const nav = pages.map(([id, title, icon], index) => `<a class="nav-link${index ? '' : ' active'}" href="#${id}"${index ? '' : ' aria-current="page"'}><span class="nav-icon" aria-hidden="true">${icon.replace(/>/g, '&gt;')}</span>${title}</a>`).join('\n');
let output = template;
for (const [key, value] of Object.entries({ CSS: css, JS: js, ARTICLES: articles, NAV: nav })) output = output.replace(`%%${key}%%`, () => value);
if (/%%[A-Z]+%%/.test(output)) throw new Error('页面仍有未替换的模板标记。');
await writeFile(join(root, 'index.html'), output, 'utf8');
console.log(`已生成 landing/docs/index.html：${pages.length} 页，${Buffer.byteLength(output)} bytes，可直接双击打开。`);


