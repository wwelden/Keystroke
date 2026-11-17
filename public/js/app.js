(function () {
    const SAMPLES = {
        tour: `# Keystroke

A **Markdown compiler** written in _TypeScript_.

## Text Formatting
**Bold text**
*Italic text*
~~Strikethrough~~
\`inline code\`

## Links
[Keystroke on GitHub](https://github.com/wwelden/Keystroke)

## Blockquotes
> Programs must be written for people to read.

---

### Math
$1+2+3=6$
$x^2 + y~1$
`,
        math: `# Math Expressions

Wrap math in dollar signs. Use ^ for superscript and ~ for subscript.

$a^2 + b^2 = c^2$

$x~1 + x~2$

$e^(i*pi) + 1 = 0$
`,
        lists: `## Lists
- Item 1
- Item 2
- Item 3

## Checklist
- [ ] Write the lexer
- [x] Write the parser
- [x] Render to HTML
`,
    };

    const PREVIEW_CSS = `
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
               color: #1f2328; line-height: 1.6; padding: 1.25rem 1.5rem; margin: 0; }
        h1, h2 { border-bottom: 1px solid #d8dee4; padding-bottom: .3em; }
        h1, h2, h3, h4, h5, h6 { margin: .8em 0 .4em; }
        code { background: #eff1f3; padding: .15em .4em; border-radius: 4px;
               font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .9em; }
        pre code { display: block; padding: 1em; overflow-x: auto; }
        blockquote { border-left: 4px solid #d0d7de; color: #59636e; margin: .5em 0; padding: 0 1em; }
        li { margin: .15em 0 .15em 1.25em; }
        hr { border: 0; border-top: 2px solid #d8dee4; margin: 1.5em 0; }
        a { color: #0969da; }
        .math { font-family: "Cambria Math", "Latin Modern Math", Georgia, serif; font-style: italic;
                background: #f6f8fa; padding: .1em .35em; border-radius: 4px; }
    `;

    const editor = document.getElementById('editor');
    const preview = document.getElementById('preview');
    const htmlOut = document.getElementById('html-out');
    const tokensOut = document.getElementById('tokens-out');
    const astOut = document.getElementById('ast-out');
    const stats = document.getElementById('stats');
    const sample = document.getElementById('sample');
    const tabs = document.querySelectorAll('.tab');
    const views = document.querySelectorAll('.view');

    let activeView = 'preview';

    function escapeHtml(s) {
        return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function astToPlain(node) {
        const out = { type: node.type };
        for (const key of Object.keys(node)) {
            if (key === 'type' || key === 'children') continue;
            const v = node[key];
            if (v !== '' && v !== undefined && v !== null && typeof v !== 'object') out[key] = v;
        }
        if (node.children && node.children.length) out.children = node.children.map(astToPlain);
        return out;
    }

    function update() {
        const md = editor.value;
        const t0 = performance.now();
        let html;
        try {
            html = Keystroke.compile(md);
        } catch (err) {
            html = `<p style="color:#cf222e">Compile error: ${escapeHtml(String(err))}</p>`;
        }
        const ms = performance.now() - t0;
        stats.textContent = `${md.length} chars · compiled in ${ms.toFixed(2)} ms`;

        if (activeView === 'preview') {
            preview.srcdoc = `<!DOCTYPE html><html><head><style>${PREVIEW_CSS}</style></head><body>${html}</body></html>`;
        } else if (activeView === 'html') {
            htmlOut.textContent = html;
        } else if (activeView === 'tokens') {
            const tokens = Keystroke.tokenize(md);
            tokensOut.innerHTML = tokens.map(t =>
                `<span class="token" title="${escapeHtml(JSON.stringify(t.literal))}">` +
                `<b>${escapeHtml(t.type)}</b>${t.literal.trim() ? ' ' + escapeHtml(t.literal) : ''}</span>`
            ).join('');
        } else if (activeView === 'ast') {
            astOut.textContent = JSON.stringify(astToPlain(Keystroke.parse(md)), null, 2);
        }
        try { localStorage.setItem('keystroke:md', md); } catch (_) { /* ignore */ }
    }

    let pending;
    editor.addEventListener('input', () => {
        cancelAnimationFrame(pending);
        pending = requestAnimationFrame(update);
    });

    // Tab inserts spaces, but focus must never be trapped (WCAG 2.1.2):
    // Shift+Tab always moves focus back, and Esc releases the editor so the
    // next Tab moves focus forward (the same escape hatch CodeMirror uses).
    let tabReleased = false;
    editor.addEventListener('keydown', e => {
        if (e.isComposing) return;
        if (e.key === 'Escape') {
            tabReleased = true;
            return;
        }
        if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey && !tabReleased) {
            e.preventDefault();
            const { selectionStart: s, selectionEnd: end } = editor;
            editor.setRangeText('    ', s, end, 'end');
            update();
            return;
        }
        tabReleased = false;
    });
    editor.addEventListener('blur', () => { tabReleased = false; });

    function selectTab(tab, { focus = false } = {}) {
        if (focus) tab.focus();
        if (tab.dataset.view === activeView) return;
        activeView = tab.dataset.view;
        tabs.forEach(t => {
            const selected = t === tab;
            t.classList.toggle('active', selected);
            t.setAttribute('aria-selected', String(selected));
            t.tabIndex = selected ? 0 : -1;
        });
        views.forEach(v => v.classList.toggle('active', v.dataset.view === activeView));
        update();
    }

    tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => selectTab(tab));
        tab.addEventListener('keydown', e => {
            if (e.altKey || e.ctrlKey || e.metaKey) return;
            const last = tabs.length - 1;
            const next = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last }[e.key];
            if (next === undefined) return;
            e.preventDefault();
            selectTab(tabs[next], { focus: true });
        });
    });

    sample.addEventListener('change', () => {
        if (SAMPLES[sample.value]) {
            editor.value = SAMPLES[sample.value];
            update();
        }
        sample.value = '';
    });

    let saved = null;
    try { saved = localStorage.getItem('keystroke:md'); } catch (_) { /* ignore */ }
    editor.value = saved || SAMPLES.tour;
    update();
})();
