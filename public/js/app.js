(function () {
    const SAMPLES = {
        tour: `# Keystroke

A **Markdown compiler** written in _TypeScript_.

## Text Formatting
**Bold text**
*Italic text*
~~Strikethrough~~
\`inline code\`

## Lists
- A hand-written lexer
- A recursive-descent parser
- [x] Render to HTML
- [ ] Ordered lists that keep their numbering

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
    const SAMPLE_NAMES = { tour: 'feature tour', math: 'math sample', lists: 'lists sample' };

    // The proof is typeset with the page's palette. Colors come in as CSS variables
    // (see previewVars) so the proof follows the light/dark theme.
    const BLOCKS = 'h1, h2, h3, h4, h5, h6, ul, ol, blockquote, hr';
    const PREVIEW_CSS = `
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=DM+Mono&display=swap');
        body { font: 18px/1.6 "Newsreader", Georgia, serif; color: var(--ink); background: var(--sheet);
               margin: 0 auto; padding: 22px 44px 80px; max-width: 640px; font-optical-sizing: auto; }
        h1 { font-size: 2.3em; font-weight: 500; line-height: 1.08; letter-spacing: -.02em; margin: .2em 0 .5em; }
        h2 { font: 400 .72em "DM Mono", monospace; letter-spacing: .16em; text-transform: uppercase;
             color: var(--accent); margin: 1.8em 0 .5em; }
        h3 { font-size: 1.25em; font-style: italic; font-weight: 400; margin: 1.2em 0 .2em; }
        h4, h5, h6 { font-size: 1em; font-weight: 600; margin: 1em 0 .2em; }
        /* The renderer emits a <br> for every newline; blocks already have margins. */
        :is(${BLOCKS}) + br, br:has(+ :is(${BLOCKS})) { display: none; }
        code { font-family: "DM Mono", monospace; font-size: .78em; background: var(--code);
               padding: .12em .4em; border-radius: 3px; }
        pre code { display: block; padding: 1em; overflow-x: auto; }
        a { color: var(--ink); text-decoration-color: var(--accent); text-underline-offset: 3px; }
        blockquote { font-size: 1.25em; font-style: italic; line-height: 1.4; margin: .6em 0;
                     padding: 0 0 0 .8em; border-left: 2px solid var(--accent); color: var(--ink-2); }
        hr { border: 0; text-align: center; margin: 1.6em 0; }
        hr::after { content: "⁂"; color: var(--ink-3); letter-spacing: .4em; }
        ul, ol { padding-left: 1.2em; margin: .2em 0; }
        li { margin: .15em 0; }
        li::marker { color: var(--ink-3); }
        input[type=checkbox] { accent-color: var(--accent); margin-right: .35em; }
        .math { font-style: italic; }
        .compile-error { color: var(--danger); font: 14px/1.5 "DM Mono", monospace; }
    `;
    const PREVIEW_VARS = ['--ink', '--ink-2', '--ink-3', '--sheet', '--accent', '--code', '--danger'];

    const $ = id => document.getElementById(id);
    const root = document.documentElement;
    const body = document.body;
    const editor = $('editor');
    const highlightEl = $('highlight');
    const preview = $('preview');
    const sample = $('sample');
    const stats = $('stats');
    const saveState = $('save-state');
    const sourceName = $('source-name');
    const pageCount = $('page-count');
    const manuscript = $('manuscript');
    const proof = $('proof');
    const hood = $('hood');
    const hoodToggle = $('hood-toggle');
    const cheat = $('cheat');
    const cheatToggle = $('cheat-toggle');
    const themeButton = $('theme');
    const modeButtons = document.querySelectorAll('.seg button');

    function escapeHtml(s) {
        return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function setText(el, text) {
        if (el.textContent !== text) el.textContent = text;
    }

    // Insert text at the selection through the browser's editing commands so ⌘Z can undo it.
    // Fires an input event, which recompiles.
    function insertText(text) {
        editor.focus();
        if (!document.execCommand('insertText', false, text)) {
            editor.setRangeText(text, editor.selectionStart, editor.selectionEnd, 'end');
            editor.dispatchEvent(new Event('input'));
        }
    }

    // Keyboard users get a focus ring and the Tab hint on the editor; pointer users don't.
    document.addEventListener('keydown', e => { if (e.key === 'Tab') body.classList.add('keyboard'); }, true);
    document.addEventListener('pointerdown', () => body.classList.remove('keyboard'), true);

    // ── Source highlighting ────────────────────────────────────────
    // A display-only approximation of the syntax, drawn under a transparent textarea.
    function highlightLine(line) {
        let l = escapeHtml(line);
        if (/^#{1,6} /.test(line)) return l.replace(/^(#+ )(.*)$/, '<span class="hl-m">$1</span><span class="hl-h">$2</span>');
        if (/^&gt; /.test(l)) return l.replace(/^(&gt; )(.*)$/, '<span class="hl-m">$1</span><span class="hl-q">$2</span>');
        if (/^-{3,}\s*$/.test(line)) return `<span class="hl-m">${l}</span>`;
        l = l.replace(/^(\s*)(- \[[ x]\] |[-*] |\d+\. )/, '$1<span class="hl-m">$2</span>');
        return l
            .replace(/(`[^`]+`)/g, '<span class="hl-c">$1</span>')
            .replace(/(\$[^$]+\$)/g, '<span class="hl-x">$1</span>')
            .replace(/(\*\*|~~)(.+?)\1/g, '<span class="hl-m">$1</span>$2<span class="hl-m">$1</span>')
            .replace(/(^|[^*])\*([^*]+)\*/g, '$1<span class="hl-m">*</span><em>$2</em><span class="hl-m">*</span>')
            .replace(/(^|[^\w])_([^_]+)_(?!\w)/g, '$1<span class="hl-m">_</span><em>$2</em><span class="hl-m">_</span>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<span class="hl-m">[</span>$1<span class="hl-m">](</span><span class="hl-u">$2</span><span class="hl-m">)</span>');
    }

    function renderHighlight() {
        // The trailing newline keeps the overlay as tall as the textarea when the text ends in one.
        highlightEl.innerHTML = editor.value.split('\n').map(highlightLine).join('\n') + '\n';
        highlightEl.scrollTop = editor.scrollTop;
    }
    editor.addEventListener('scroll', () => { highlightEl.scrollTop = editor.scrollTop; });

    // ── Proof ──────────────────────────────────────────────────────
    // SECURITY: the compiler passes raw HTML through, so the proof frame must never
    // get `allow-scripts`. Without it, nothing in the frame can run; allow-same-origin
    // only lets this page update the frame's body in place, which keeps the proof's
    // scroll position and fonts while typing. With both flags, user HTML would run
    // with full access to this page.
    let proofReady = false;
    let proofHtml = '';

    function proofDoc() {
        const doc = proofReady && preview.contentDocument;
        return doc && doc.getElementById('vars') ? doc : null;
    }

    function previewVars() {
        const cs = getComputedStyle(root);
        const vars = PREVIEW_VARS.map(v => `${v}: ${cs.getPropertyValue(v).trim()}`).join('; ');
        return `:root { color-scheme: ${cs.colorScheme}; ${vars} }`;
    }

    // A rough page count for the proof label, at US Letter height (11in × 96px).
    function updatePageCount() {
        const doc = proofDoc();
        if (!doc || preview.clientWidth === 0) return;
        const pages = Math.max(1, Math.ceil(doc.body.scrollHeight / 1056));
        setText(pageCount, `≈ ${pages} page${pages === 1 ? '' : 's'}`);
    }

    function writeProof() {
        const doc = proofDoc();
        if (!doc) return;
        doc.getElementById('vars').textContent = previewVars();
        doc.body.innerHTML = proofHtml;
        updatePageCount();
    }

    preview.addEventListener('load', () => {
        proofReady = true;
        const doc = proofDoc();
        if (!doc) return;
        // Scripts can't run in the frame, so the page handles its links and shortcuts.
        doc.addEventListener('click', e => {
            const link = e.target.closest('a[href]');
            if (!link) return;
            e.preventDefault();
            if (/^https?:$/.test(link.protocol)) window.open(link.href, '_blank', 'noopener');
        });
        doc.addEventListener('keydown', handleShortcut);
        doc.fonts.ready.then(updatePageCount);
        writeProof();
    });
    new ResizeObserver(updatePageCount).observe(preview);
    preview.srcdoc = `<!DOCTYPE html><html><head><style id="vars"></style><style>${PREVIEW_CSS}</style></head><body></body></html>`;

    // ── Under the hood ─────────────────────────────────────────────
    function astText(node, depth = 0) {
        const value = String(node.text || node.value || '').trim();
        let out = `${'  '.repeat(depth)}<b>${escapeHtml(node.type)}</b>${value ? ' ' + escapeHtml(value.slice(0, 48)) : ''}\n`;
        for (const child of node.children || []) {
            if (child.type === 'SPACE' || child.type === 'NEWLINE') continue;
            out += astText(child, depth + 1);
        }
        return out;
    }

    // Long streams are shown a page at a time so typing stays responsive.
    // When tokens are hidden the panel says so and offers to show the rest.
    // Editing the text goes back to the first page.
    const TOKEN_PAGE = 5000;
    let tokenLimit = TOKEN_PAGE;
    let tokenSource = null;

    function renderTokens(md) {
        if (md !== tokenSource) {
            tokenSource = md;
            tokenLimit = TOKEN_PAGE;
        }
        const out = $('tokens-out');
        const tokens = Keystroke.tokenize(md).filter(t => t.type !== 'SPACE' && t.type !== 'NEWLINE');
        const shown = Math.min(tokens.length, tokenLimit);
        let html = tokens.slice(0, shown).map(t =>
            `<span class="token" title="${escapeHtml(JSON.stringify(t.literal))}"><b>${escapeHtml(t.type)}</b>` +
            `${t.type === 'TEXT' ? ' ' + escapeHtml(t.literal) : ''}</span>`
        ).join('');
        if (shown < tokens.length) {
            const total = tokens.length.toLocaleString();
            const note = `Showing the first ${shown.toLocaleString()} of ${total} tokens.`;
            const more = Math.min(TOKEN_PAGE, tokens.length - shown).toLocaleString();
            html = `<p class="token-note">${note} The rest are hidden below.</p>` + html +
                `<p class="token-note">${note} ` +
                `<button type="button" data-tokens="more">Show ${more} more</button> ` +
                `<button type="button" data-tokens="all">Show all ${total}</button></p>`;
        }
        out.innerHTML = html;
        $('tokens-count').textContent = tokens.length.toLocaleString();
    }

    $('tokens-out').addEventListener('click', e => {
        const button = e.target.closest('button[data-tokens]');
        if (!button) return;
        const which = button.dataset.tokens;
        tokenLimit = which === 'all' ? Infinity : tokenLimit + TOKEN_PAGE;
        renderTokens(tokenSource);
        // The clicked button was replaced; keep focus nearby for keyboard users.
        const out = $('tokens-out');
        (out.querySelector(`button[data-tokens="${which}"]`) || out.closest('[tabindex]') || out).focus();
    });

    function renderHood(md, html) {
        try {
            renderTokens(md);
            const tree = astText(Keystroke.parse(md));
            $('ast-out').innerHTML = tree;
            $('ast-count').textContent = tree.split('\n').length - 1;
        } catch (err) {
            $('ast-out').textContent = `Could not parse: ${err}`;
        }
        $('html-out').textContent = html;
        $('html-count').textContent = `${html.length} B`;
    }

    // ── Compile ────────────────────────────────────────────────────
    function update() {
        const md = editor.value;
        renderHighlight();
        const t0 = performance.now();
        let html;
        let failed = false;
        try {
            html = Keystroke.compile(md);
        } catch (err) {
            failed = true;
            html = `<p class="compile-error">Compile error: ${escapeHtml(String(err))}</p>`;
        }
        const ms = performance.now() - t0;
        proofHtml = html;

        // Save first, so a failure further down can never lose an edit.
        if (unsavedEdit && editingDraft) saveDraft();
        unsavedEdit = false;
        renderSaveState();

        writeProof();
        const words = (md.match(/[\p{L}\p{N}’']+/gu) || []).length;
        const detail = failed ? 'compile error'
            : `${words ? `${Math.max(1, Math.round(words / 230))} min read · ` : ''}compiled in ${ms.toFixed(2)} ms`;
        stats.innerHTML = `${words} word${words === 1 ? '' : 's'}<span class="extra"> · ${detail}</span>`;
        $('hood-ms').textContent = failed ? 'compile error' : `${ms.toFixed(2)} ms`;
        if (body.classList.contains('hood-open')) renderHood(md, html);
    }

    // ── Draft ──────────────────────────────────────────────────────
    // The draft is saved only when the user edits it. A loaded sample is
    // scratch space: editing it must not replace the saved draft, and the
    // "Your draft" option in the sample menu brings the draft back.
    const DRAFT_KEY = 'keystroke:md';
    let editingDraft = true;
    let unsavedEdit = false;
    let draftSaved = false;
    let draftOption = null;
    let sourceLabel = 'your draft';

    function loadDraft() {
        try { return localStorage.getItem(DRAFT_KEY); } catch (_) { return null; }
    }

    // Safari ignores `hidden` on <option>, so add the element only once a draft exists.
    function showDraftOption() {
        if (draftOption) return;
        draftOption = new Option('Your draft', 'draft');
        sample.add(draftOption, 1);
    }

    function saveDraft() {
        try { localStorage.setItem(DRAFT_KEY, editor.value); } catch (_) { return; }
        draftSaved = true;
        showDraftOption();
    }

    function renderSaveState() {
        setText(sourceName, sourceLabel);
        const saved = editingDraft && draftSaved;
        saveState.classList.toggle('saved', saved);
        saveState.classList.toggle('unsaved', !editingDraft);
        // Only touch the live region when the message changes, so it isn't re-announced per keystroke.
        setText(saveState, !editingDraft ? 'Sample · edits aren’t saved'
            : saved ? 'Draft saved' : 'Edits save in this browser');
    }

    let pending;
    editor.addEventListener('input', () => {
        unsavedEdit = true;
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
            insertText('    ');
            return;
        }
        tabReleased = false;
    });
    editor.addEventListener('blur', () => { tabReleased = false; });

    sample.addEventListener('change', () => {
        if (unsavedEdit) { cancelAnimationFrame(pending); update(); }
        const isDraft = sample.value === 'draft';
        const text = isDraft ? loadDraft() : SAMPLES[sample.value];
        if (typeof text === 'string') {
            // With no saved draft there is nothing to protect, so edits to
            // the sample become the draft.
            editingDraft = isDraft || loadDraft() === null;
            sourceLabel = editingDraft ? 'your draft' : SAMPLE_NAMES[sample.value];
            unsavedEdit = false;
            editor.value = text;
            editor.scrollTop = 0;
            update();
        }
        sample.value = '';
    });

    // ── Layout: manuscript / side by side / proof ─────────────────
    const narrow = matchMedia('(max-width: 860px)');
    let chosenMode = 'both';

    function applyMode() {
        // Side by side doesn't fit a phone; show the manuscript there instead.
        const mode = chosenMode === 'both' && narrow.matches ? 'write' : chosenMode;
        body.dataset.mode = mode;
        modeButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
        manuscript.inert = mode === 'proof';
        proof.inert = mode === 'write';
    }
    modeButtons.forEach(b => b.addEventListener('click', () => { chosenMode = b.dataset.mode; applyMode(); }));
    narrow.addEventListener('change', applyMode);

    // ── Theme ──────────────────────────────────────────────────────
    // Follow the system until the reader picks a theme, then remember the pick.
    // The inline script in <head> applies a saved pick before first paint.
    const THEME_KEY = 'keystroke:theme';
    const prefersDark = matchMedia('(prefers-color-scheme: dark)');
    let themePick = root.dataset.theme || null;

    function applyTheme() {
        if (themePick) root.dataset.theme = themePick; else delete root.dataset.theme;
        const dark = themePick ? themePick === 'dark' : prefersDark.matches;
        root.dataset.resolved = dark ? 'dark' : 'light';
        themeButton.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
        writeProof();
    }
    themeButton.addEventListener('click', () => {
        themePick = root.dataset.resolved === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem(THEME_KEY, themePick); } catch (_) { /* keep it for this visit */ }
        applyTheme();
    });
    prefersDark.addEventListener('change', applyTheme);

    // ── Drawer and syntax menu ────────────────────────────────────
    function isOpen(name) {
        return body.classList.contains(`${name}-open`);
    }

    function setOpen(name, open) {
        const panel = name === 'hood' ? hood : cheat;
        const toggle = name === 'hood' ? hoodToggle : cheatToggle;
        const wasOpen = isOpen(name);
        body.classList.toggle(`${name}-open`, open);
        toggle.setAttribute('aria-expanded', String(open));
        panel.inert = !open;
        // Return focus to the toggle when a panel holding focus closes.
        if (wasOpen && !open && panel.contains(document.activeElement)) toggle.focus();
    }
    setOpen('hood', false);
    setOpen('cheat', false);

    function toggleHood() {
        setOpen('cheat', false);
        setOpen('hood', !isOpen('hood'));
        if (isOpen('hood')) renderHood(editor.value, proofHtml);
    }
    hoodToggle.addEventListener('click', toggleHood);
    $('hood-close').addEventListener('click', () => setOpen('hood', false));

    cheatToggle.addEventListener('click', () => {
        setOpen('hood', false);
        const open = !isOpen('cheat');
        setOpen('cheat', open);
        if (open) cheat.querySelector('button').focus();
    });

    // Each item wraps the selection (or a placeholder) in its syntax, then selects
    // the wrapped text so typing replaces it.
    cheat.addEventListener('click', e => {
        const item = e.target.closest('button[data-before]');
        if (!item) return;
        setOpen('cheat', false);
        if (body.dataset.mode === 'proof') { chosenMode = narrow.matches ? 'write' : 'both'; applyMode(); }
        const { before, after = '', placeholder = '' } = item.dataset;
        const start = editor.selectionStart;
        const inner = editor.value.slice(start, editor.selectionEnd) || placeholder;
        insertText(before + inner + after);
        editor.setSelectionRange(start + before.length, start + before.length + inner.length);
    });
    cheat.addEventListener('focusout', e => {
        if (isOpen('cheat') && !cheat.contains(e.relatedTarget) && e.relatedTarget !== cheatToggle) setOpen('cheat', false);
    });
    cheat.addEventListener('keydown', e => {
        const items = [...cheat.querySelectorAll('button')];
        const i = items.indexOf(document.activeElement);
        const next = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: items.length - 1 }[e.key];
        if (next === undefined) return;
        e.preventDefault();
        items[(next + items.length) % items.length].focus();
    });

    // Shared by this page and the proof frame (key events in the frame don't reach this document).
    function handleShortcut(e) {
        if (e.key === 'Escape') {
            if (isOpen('cheat')) setOpen('cheat', false);
            else if (isOpen('hood') && document.activeElement !== editor) setOpen('hood', false);
        }
        if ((e.metaKey || e.ctrlKey) && e.key === '.') {
            e.preventDefault();
            toggleHood();
        }
    }
    document.addEventListener('keydown', handleShortcut);
    document.addEventListener('click', e => {
        if (isOpen('cheat') && !cheat.contains(e.target) && !cheatToggle.contains(e.target)) setOpen('cheat', false);
    });

    // ── Start ──────────────────────────────────────────────────────
    const saved = loadDraft();
    if (saved !== null) { showDraftOption(); draftSaved = true; }
    editor.value = saved ?? SAMPLES.tour;
    applyTheme();
    applyMode();
    update();
})();
