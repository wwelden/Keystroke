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

    // describe('Lists', () => {
    //     it('should process unordered lists correctly', () => {
    //         const input = '* Item 1\n* Item 2';
    //         const expected = '<ul><li>Item 1</li>\n<li>Item 2</li>\n</ul>\n';
    //         expect(processMarkdown(input)).toBe(expected);
    //     });

    //     it('should process checklists correctly', () => {
    //         const input = '- [ ] Todo\n- [x] Done';
    //         const expected = '<li><input type="checkbox">Todo</li>\n<li><input type="checkbox" checked>Done</li>\n';
    //         expect(processMarkdown(input)).toBe(expected);
    //     });
    // });

    describe('Links', () => {
        it('should process links correctly', () => {
            const input = '[Example](https://example.com)';
            const expected = '<a href="https://example.com">Example</a>';
            expect(processMarkdown(input)).toBe(expected);
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
            expect(processMarkdown('- [ ] buy for $5')).toBe('<li><input type="checkbox"> buy for $5</li>\n');
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
            expect(processMarkdown('- [ ] run `test`')).toBe('<li><input type="checkbox"> run <code>test</code></li>\n');
            expect(processMarkdown('- [x] read [docs](url)')).toBe('<li><input type="checkbox" checked> read <a href="url">docs</a></li>\n');
        });

        it.each(['^', '~'])('should stop an unclosed %s math group at the line boundary', marker => {
            const tag = marker === '^' ? 'sup' : 'sub';
            expect(processMarkdown('$x' + marker + '(2)$')).toBe('<span class="math">x<' + tag + '>(2)</' + tag + '></span>');
            expect(processMarkdown('$x' + marker + '(\nnext')).toBe('<span class="math">x<' + tag + '>(</' + tag + '></span><br>\nnext');
            // In a heading the unclosed $ is literal, and the next line stays outside
            const result = processMarkdown('# $x' + marker + '(\nnext');
            expect(result).not.toContain('class="math"');
            expect(result.startsWith('<h1>$x')).toBe(true);
            expect(result.endsWith('</h1>\nnext')).toBe(true);
        });

        it('should not let unterminated inline code or links swallow the next line', () => {
            expect(processMarkdown('# a `b\nnext')).toBe('<h1>a <code>b</code></h1>\nnext');
            expect(processMarkdown('**a [b\nnext')).toBe('<b>a <a href="">b</a></b><br>\nnext');
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

            const expected = '<h1>Title</h1>\n<b>Bold</b>and<i>italic</i><br>\n<ul><li>* List item 1</li>\n</ul>\n List item 2<br>\n<blockquote>Quote</blockquote>\n<a href="https://example.com">Link</a>';
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
            ['- item', '<li> item</li>\n'],
            ['---', '<hr>\n'],
            ['-----', '<hr>\n'],
            ['- [ ] todo', '<li><input type="checkbox"> todo</li>\n'],
            ['text\n# H\nC# x\n> q', 'text<br>\n<h1>H</h1>\nC# x<br>\n<blockquote>q</blockquote>\n'],
        ])('%j is still a block', (input, expected) => {
            expect(processMarkdown(input)).toBe(expected);
        });
    });
});
