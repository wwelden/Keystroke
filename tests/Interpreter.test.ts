import { Lexer } from '../src/Lexer';
import { Parser } from '../src/Parser';
import { Renderer } from '../src/Renderer';

describe('Markdown Interpreter', () => {
    function processMarkdown(input: string): string {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const renderer = new Renderer();
        const ast = parser.parse();
        return renderer.render(ast);
    }

    describe('Headers', () => {
        it('should process headers correctly', () => {
            const input = '# Header 1 \n## Header 2 \n### Header 3';
            const expected = '<h1>Header 1</h1>\n<h2>Header 2</h2>\n<h3>Header 3</h3>\n';
            expect(processMarkdown(input)).toBe(expected);
        });
    });

    describe('Text Formatting', () => {
        it('should process bold text correctly', () => {
            const input = '**Bold text**';
            const expected = '<b>Bold text</b>';
            expect(processMarkdown(input)).toBe(expected);
        });

        it('should process italic text correctly', () => {
            const input = '_Italic text_';
            const expected = '<i>Italic text</i>';
            expect(processMarkdown(input)).toBe(expected);
        });
    });

    // Regression for #23: lists group their items, strip markers, and parse
    // inline content.
    describe('Lists', () => {
        it.each([
            ['* one\n* two', '<ul><li>one</li>\n<li>two</li>\n</ul>\n'],
            ['- one\n- two', '<ul><li>one</li>\n<li>two</li>\n</ul>\n'],
            ['- **bold** item', '<ul><li><b>bold</b> item</li>\n</ul>\n'],
            ['1. first\n2. second', '<ol><li>first</li>\n<li>second</li>\n</ol>\n'],
            ['- [ ] Todo\n- [x] Done',
                '<ul><li><input type="checkbox"> Todo</li>\n<li><input type="checkbox" checked> Done</li>\n</ul>\n'],
        ])('%j renders as one list', (input, expected) => {
            expect(processMarkdown(input)).toBe(expected);
        });

        it.each([
            ['* a\nhello', '<ul><li>a</li>\n</ul>\nhello'],
            ['- a\n# H', '<ul><li>a</li>\n</ul>\n<h1>H</h1>\n'],
            ['1. a\nafter', '<ol><li>a</li>\n</ol>\nafter'],
        ])('%j keeps the line after the list', (input, expected) => {
            expect(processMarkdown(input)).toBe(expected);
        });

        it('parses inline content inside items', () => {
            expect(processMarkdown('* _i_ ~~s~~ [link](http://x.com) `code`')).toBe(
                '<ul><li><i>i</i> <s>s</s> <a href="http://x.com">link</a> <code>code</code></li>\n</ul>\n'
            );
            expect(processMarkdown('- [x] **done** (soon)')).toBe(
                '<ul><li><input type="checkbox" checked> <b>done</b> (soon)</li>\n</ul>\n'
            );
        });

        it('groups -, * and checklist items into one list', () => {
            expect(processMarkdown('- a\n* b\n- [ ] c')).toBe(
                '<ul><li>a</li>\n<li>b</li>\n<li><input type="checkbox"> c</li>\n</ul>\n'
            );
        });

        it('starts a new list for a different list kind or after a blank line', () => {
            expect(processMarkdown('1. a\n- b')).toBe('<ol><li>a</li>\n</ol>\n<ul><li>b</li>\n</ul>\n');
            expect(processMarkdown('- a\n\n- b')).toBe('<ul><li>a</li>\n</ul>\n<br>\n<ul><li>b</li>\n</ul>\n');
        });

        it('keeps later items after an unclosed [ in an item', () => {
            expect(processMarkdown('- see [note\n- next')).toBe(
                '<ul><li>see [note</li>\n<li>next</li>\n</ul>\n'
            );
        });

        it.each([
            ['- x^(a\n- next', '<ul><li>x<sup>(a</sup></li>\n<li>next</li>\n</ul>\n'],
            ['- x~(a\n- next', '<ul><li>x<sub>(a</sub></li>\n<li>next</li>\n</ul>\n'],
        ])('keeps later items after an unclosed ( in %j', (input, expected) => {
            expect(processMarkdown(input)).toBe(expected);
        });

        it.each([
            ['- [x](https://example.com)', '<ul><li><a href="https://example.com">x</a></li>\n</ul>\n'],
            ['- [ ](u) gap', '<ul><li><a href="u"> </a> gap</li>\n</ul>\n'],
            ['- [x] Done', '<ul><li><input type="checkbox" checked> Done</li>\n</ul>\n'],
            ['- [x]', '<ul><li><input type="checkbox" checked></li>\n</ul>\n'],
            ['- [ ]\n- b', '<ul><li><input type="checkbox"></li>\n<li>b</li>\n</ul>\n'],
        ])('%j needs whitespace or end of line after ] to be a checkbox', (input, expected) => {
            expect(processMarkdown(input)).toBe(expected);
        });

        it('treats - [X] as a checked box', () => {
            expect(processMarkdown('- [X] done')).toBe('<ul><li><input type="checkbox" checked> done</li>\n</ul>\n');
        });

        it('keeps the start number of an ordered list', () => {
            expect(processMarkdown('3. c\n4. d')).toBe('<ol start="3"><li>c</li>\n<li>d</li>\n</ol>\n');
        });

        it.each([
            ['-5 degrees', '-5 degrees'],
            ['-- x', '-- x'],
            ['1.5 apples', '1.5 apples'],
        ])('%j is not a list', (input, expected) => {
            expect(processMarkdown(input)).toBe(expected);
        });

        it('renders the playground "Lists & checklists" sample', () => {
            const input = '## Lists\n- Item 1\n- Item 2\n- Item 3\n\n## Checklist\n' +
                '- [ ] Write the lexer\n- [x] Write the parser\n- [x] Render to HTML\n';
            expect(processMarkdown(input)).toBe(
                '<h2>Lists</h2>\n' +
                '<ul><li>Item 1</li>\n<li>Item 2</li>\n<li>Item 3</li>\n</ul>\n' +
                '<br>\n' +
                '<h2>Checklist</h2>\n' +
                '<ul><li><input type="checkbox"> Write the lexer</li>\n' +
                '<li><input type="checkbox" checked> Write the parser</li>\n' +
                '<li><input type="checkbox" checked> Render to HTML</li>\n</ul>\n'
            );
        });
    });

    describe('Links', () => {
        it('should process links correctly', () => {
            const input = '[Example](https://example.com)';
            const expected = '<a href="https://example.com">Example</a>';
            expect(processMarkdown(input)).toBe(expected);
        });

        // Regression for #26: brackets without an immediate `(url)` are text.
        it.each([
            ['[note] text', '[note] text'],
            ['box [x] here', 'box [x] here'],
            ['[a]b', '[a]b'],
            ['x [a]*b*', 'x [a]<i>b</i>'],
            ['[abc', '[abc'],
            ['[abc\nnext', '[abc<br>\nnext'],
            ['see [t](u) now', 'see <a href="u">t</a> now'],
        ])('%j renders brackets correctly', (input, expected) => {
            expect(processMarkdown(input)).toBe(expected);
        });

        it('does not link `[a] (b)` (space before the paren)', () => {
            // Paragraph-level parens are dropped separately (#33), so pin the
            // full output inside a list item, where they survive.
            expect(processMarkdown('- [a] (b)')).toBe('<ul><li>[a] (b)</li>\n</ul>\n');
            const html = processMarkdown('[a] (b)');
            expect(html.startsWith('[a] ')).toBe(true);
            expect(html).not.toContain('<a');
        });

        it('keeps bracket text literal inside list items', () => {
            expect(processMarkdown('- item [x] y\n- [abc\n- [t](u)')).toBe(
                '<ul><li>item [x] y</li>\n<li>[abc</li>\n<li><a href="u">t</a></li>\n</ul>\n'
            );
        });
    });

    describe('Math', () => {
        it('should process math expressions correctly', () => {
            const input = '$1+2=3 $';
            const expected = '<span class="math">1+2=3</span>';
            expect(processMarkdown(input)).toBe(expected);
        });

        it('should process superscript correctly', () => {
            const input = '$x ^2  $';
            const expected = '<span class="math">x <sup>2</sup></span>';
            expect(processMarkdown(input)).toBe(expected);
        });

        it('should process subscript correctly', () => {
            const input = '$x ~n  $';
            const expected = '<span class="math">x <sub>n</sub></span>';
            expect(processMarkdown(input)).toBe(expected);
        });
    });

    describe('Parentheses (#33)', () => {
        it('should keep literal parentheses in prose', () => {
            expect(processMarkdown('hello (world)')).toBe('hello (world)');
        });

        it('should keep unbalanced parentheses in prose', () => {
            expect(processMarkdown('(a b')).toBe('(a b');
            expect(processMarkdown('a b)')).toBe('a b)');
        });

        it('should keep parentheses inside headings, emphasis and quotes', () => {
            expect(processMarkdown('# Heading (draft)')).toBe('<h1>Heading (draft)</h1>\n');
            expect(processMarkdown('**bold (x)**')).toBe('<b>bold (x)</b>');
            expect(processMarkdown('> quote (x)')).toBe('<blockquote>quote (x)</blockquote>\n');
        });

        it('should still use parentheses as link destinations and math content', () => {
            expect(processMarkdown('[Example](https://example.com)')).toBe('<a href="https://example.com">Example</a>');
            expect(processMarkdown('$f(x)$')).toBe('<span class="math">f(x)</span>');
        });
    });

    describe('Inline content in containers (#34)', () => {
        it('should keep inline code inside headings', () => {
            expect(processMarkdown('# Title `code`')).toBe('<h1>Title <code>code</code></h1>\n');
        });

        it('should keep a lone $ literal and still close the container', () => {
            expect(processMarkdown('**Price: $5** after')).toBe('<b>Price: $5</b> after');
            expect(processMarkdown('_a $5_ b')).toBe('<i>a $5</i> b');
            expect(processMarkdown('~~a $5~~ b')).toBe('<s>a $5</s> b');
            expect(processMarkdown('**$5** and **$6**')).toBe('<b>$5</b> and <b>$6</b>');
            expect(processMarkdown('# Cost $5')).toBe('<h1>Cost $5</h1>\n');
            expect(processMarkdown('> pay $5 now')).toBe('<blockquote>pay $5 now</blockquote>\n');
            expect(processMarkdown('- [ ] buy for $5')).toBe('<ul><li><input type="checkbox"> buy for $5</li>\n</ul>\n');
            expect(processMarkdown('# **cost $5** $x$')).toBe('<h1><b>cost $5</b> <span class="math">x</span></h1>\n');
        });

        it('should still render paired $ math inside emphasis', () => {
            expect(processMarkdown('**a $x$ b**')).toBe('<b>a <span class="math">x</span> b</b>');
        });

        it('should keep a tab after inline content in a container', () => {
            expect(processMarkdown('# **one**\ttwo')).toBe('<h1><b>one</b>&emsp;two</h1>\n');
            expect(processMarkdown('> **one**\ttwo')).toBe('<blockquote><b>one</b>&emsp;two</blockquote>\n');
        });

        it('should keep inline code inside bold, italic and strikethrough', () => {
            expect(processMarkdown('**a `b` c**')).toBe('<b>a <code>b</code> c</b>');
            expect(processMarkdown('_a `b` c_')).toBe('<i>a <code>b</code> c</i>');
            expect(processMarkdown('~~a `b` c~~')).toBe('<s>a <code>b</code> c</s>');
        });

        it('should keep links inside blockquotes and headings', () => {
            expect(processMarkdown('> [link](url)')).toBe('<blockquote><a href="url">link</a></blockquote>\n');
            expect(processMarkdown('## See [docs](https://example.com)')).toBe('<h2>See <a href="https://example.com">docs</a></h2>\n');
        });

        it('should keep math inside blockquotes and emphasis', () => {
            expect(processMarkdown('> area $r^2$')).toBe('<blockquote>area <span class="math">r<sup>2</sup></span></blockquote>\n');
            expect(processMarkdown('**$x^2$**')).toBe('<b><span class="math">x<sup>2</sup></span></b>');
        });

        it('should keep inline code and links inside checklist items', () => {
            expect(processMarkdown('- [ ] run `test`')).toBe('<ul><li><input type="checkbox"> run <code>test</code></li>\n</ul>\n');
            expect(processMarkdown('- [x] read [docs](url)')).toBe('<ul><li><input type="checkbox" checked> read <a href="url">docs</a></li>\n</ul>\n');
        });

        it.each(['^', '~'])('should stop an unclosed %s math group at the line boundary', marker => {
            const tag = marker === '^' ? 'sup' : 'sub';
            expect(processMarkdown('$x' + marker + '(2)$')).toBe('<span class="math">x<' + tag + '>(2)</' + tag + '></span>');
            // An unclosed $ is literal (#57); the group still stops at the newline
            expect(processMarkdown('$x' + marker + '(\nnext')).toBe('$x<' + tag + '>(</' + tag + '><br>\nnext');
            // In a heading the unclosed $ is literal, and the next line stays outside
            const result = processMarkdown('# $x' + marker + '(\nnext');
            expect(result).not.toContain('class="math"');
            expect(result.startsWith('<h1>$x')).toBe(true);
            expect(result.endsWith('</h1>\nnext')).toBe(true);
        });

        it('should not let unterminated inline code or links swallow the next line', () => {
            expect(processMarkdown('# a `b\nnext')).toBe('<h1>a <code>b</code></h1>\nnext');
            expect(processMarkdown('**a [b\nnext')).toBe('<b>a [b</b><br>\nnext');
        });
    });

    describe('Complex Documents', () => {
        it('should process mixed content correctly', () => {
            const input = `# Title
**Bold**and*italic*
* List item 1
* List item 2
> Quote
[Link](https://example.com)`;

            const expected = '<h1>Title</h1>\n<b>Bold</b>and<i>italic</i><br>\n<ul><li>List item 1</li>\n<li>List item 2</li>\n</ul>\n<blockquote>Quote</blockquote>\n<a href="https://example.com">Link</a>';
            expect(processMarkdown(input)).toBe(expected);
        });

        it('should process math with mixed formatting correctly', () => {
            const input = '$f(x) = x ^2 + y ~1  $';
            const expected = '<span class="math">f(x) = x <sup>2</sup> + y <sub>1</sub></span>';
            expect(processMarkdown(input)).toBe(expected);
        });
    });

    // Regression for #20: text right after an inline construct was dropped.
    describe('Text after inline constructs', () => {
        it.each([
            ['**bold**x', '<b>bold</b>x'],
            ['**bold**, then', '<b>bold</b>, then'],
            ['**bold** then', '<b>bold</b> then'],
            ['a*b*c', 'a<i>b</i>c'],
            ['~~gone~~!', '<s>gone</s>!'],
            ['see [link](http://x.com).', 'see <a href="http://x.com">link</a>.'],
            ['`code`.', '<code>code</code>.'],
            ['$x$.', '<span class="math">x</span>.'],
            ['x^2 outside math', 'x<sup>2</sup> outside math'],
            ['y~1 outside math', 'y<sub>1</sub> outside math'],
            ['H~2~O', 'H<sub>2</sub>O'],
            ['**b**\n---tail', '<b>b</b><br>\n<hr>\ntail'],
            ['---tail', '<hr>\ntail'],
            ['x^2^ y', 'x<sup>2</sup> y'],
            ['x^2^.', 'x<sup>2</sup>.'],
            ['$x^2^ + y~1~$', '<span class="math">x<sup>2</sup> + y<sub>1</sub></span>'],
        ])('%j preserves following text', (input, expected) => {
            expect(processMarkdown(input)).toBe(expected);
        });
    });

    // Regression for #58: an unparenthesized script ends at the operand, so it
    // keeps a leading sign and leaves any following operator outside.
    describe('Unparenthesized script operands', () => {
        const math = (html: string) => `<span class="math">${html}</span>`;
        it.each([
            ['$x^2+y$', math('x<sup>2</sup>+y')],
            ['$y~i+1$', math('y<sub>i</sub>+1')],
            ['$x^2-1$', math('x<sup>2</sup>-1')],
            ['$x^-2$', math('x<sup>-2</sup>')],
            ['$x~-1$', math('x<sub>-1</sub>')],
            ['$x^-2+y$', math('x<sup>-2</sup>+y')],
            ['$e^-x$', math('e<sup>-x</sup>')],
            ['$x^+2$', math('x<sup>+2</sup>')],
            ['$x^2.5$', math('x<sup>2.5</sup>')],
            ['$x^.5$', math('x<sup>.5</sup>')],
            ['$x^-.5+y$', math('x<sup>-.5</sup>+y')],
            ['$x^10$', math('x<sup>10</sup>')],
            ['$x^-2^$', math('x<sup>-2</sup>')],
            ['x^2+y', 'x<sup>2</sup>+y'],
            ['x^a+b^', 'x<sup>a+b</sup>'],
            ['$x^(a+b)$', math('x<sup>(a+b)</sup>')],
        ])('%j', (input, expected) => {
            expect(processMarkdown(input)).toBe(expected);
        });
    });

    // Regression for #21: block markers only count at the start of a line.
    describe('Block markers only at line start', () => {
        it.each([
            ['C# is great', 'C# is great'],
            ['a > b', 'a > b'],
            ['well-known term', 'well-known term'],
            ['x - y', 'x - y'],
            ['a --- b', 'a --- b'],
            ['a * b', 'a * b'],
            ['a\t* b', 'a\t* b'],
            ['x *', 'x *'],
            ['**b**---tail', '<b>b</b>---tail'],
            ['#hashtag', '#hashtag'],
            ['####### seven', '####### seven'],
            ['**b** - *i* and ~~s~~', '<b>b</b> - <i>i</i> and <s>s</s>'],
            ['*a* b', '<i>a</i> b'],
        ])('%j stays inline', (input, expected) => {
            expect(processMarkdown(input)).toBe(expected);
        });

        it.each([
            ['# Title', '<h1>Title</h1>\n'],
            ['#', '<h1></h1>\n'],
            ['  # Indented', '  <h1>Indented</h1>\n'],
            ['> quote', '<blockquote>quote</blockquote>\n'],
            ['- item', '<ul><li>item</li>\n</ul>\n'],
            ['---', '<hr>\n'],
            ['-----', '<hr>\n'],
            ['- [ ] todo', '<ul><li><input type="checkbox"> todo</li>\n</ul>\n'],
            ['text\n# H\nC# x\n> q', 'text<br>\n<h1>H</h1>\nC# x<br>\n<blockquote>q</blockquote>\n'],
        ])('%j is still a block', (input, expected) => {
            expect(processMarkdown(input)).toBe(expected);
        });
    });
});
