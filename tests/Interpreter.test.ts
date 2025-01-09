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
            const expected = '<b>Bold text</b>\n';
            expect(processMarkdown(input)).toBe(expected);
        });

        it('should process italic text correctly', () => {
            const input = '_Italic text_';
            const expected = '<i>Italic text</i>\n';
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
            const expected = '<a href="https://example.com">Example</a>\n';
            expect(processMarkdown(input)).toBe(expected);
        });
    });

    describe('Math', () => {
        it('should process math expressions correctly', () => {
            const input = '$1+2=3 $';
            const expected = '<span class="math">1+2=3</span>\n';
            expect(processMarkdown(input)).toBe(expected);
        });

        it('should process superscript correctly', () => {
            const input = '$x ^2  $';
            const expected = '<span class="math">x <sup>2  </sup></span>\n';
            expect(processMarkdown(input)).toBe(expected);
        });

        it('should process subscript correctly', () => {
            const input = '$x ~n  $';
            const expected = '<span class="math">x <sub>n  </sub></span>\n';
            expect(processMarkdown(input)).toBe(expected);
        });
    });

    describe('Complex Documents', () => {
        it('should process mixed content correctly', () => {
            const input = `# Title
**Bold** and _italic_
* List item 1
* List item 2
> Quote
[Link](https://example.com)`;

            const expected = '<h1>Title</h1>\n<b>Bold</b>\n and <i>italic</i>\n<ul><li>List item 1</li>\n<li>List item 2</li>\n</ul>\n<blockquote>Quote</blockquote>\n<a href="https://example.com">Link</a>\n';
            expect(processMarkdown(input)).toBe(expected);
        });

        it('should process math with mixed formatting correctly', () => {
            const input = '$f(x) = x ^2 + y ~1  $';
            const expected = '<span class="math">f(x) = x<sup>2</sup> + y<sub>1</sub></span>\n';
            expect(processMarkdown(input)).toBe(expected);
        });
    });
});
