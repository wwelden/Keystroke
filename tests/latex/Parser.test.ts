import { Lexer } from '../../src/latex/Lexer';
import { Parser } from '../../src/latex/Parser';
import { TokenType } from '../../src/latex/Token';
import {
    Node,
    SectionNode,
    TextNode,
    CommandNode,
    EnvironmentNode,
    ItemNode,
    TableRowNode,
    MathNode,
    CommentNode,
} from '../../src/latex/Ast';

function newParser(input: string): Parser {
    return new Parser(new Lexer(input));
}

function findEnvironment(children: Node[], name?: string): EnvironmentNode | undefined {
    return children.find(
        (c): c is EnvironmentNode => c instanceof EnvironmentNode && (name === undefined || c.environment === name),
    );
}

describe('latex Parser', () => {
    it('constructor sets lexer and no errors', () => {
        const p = newParser('\\section{Test}');
        expect(p['lexer']).toBeDefined();
        expect(p['errors']).toHaveLength(0);
    });

    it('parses an empty document', () => {
        const doc = newParser('').parseDocument();
        expect(doc).toBeDefined();
        expect(doc.children).toHaveLength(0);
    });

    it('parses a simple section', () => {
        const doc = newParser('\\section{Introduction}').parseDocument();
        expect(doc.children).toHaveLength(1);
        const section = doc.children[0];
        expect(section).toBeInstanceOf(SectionNode);
        expect((section as SectionNode).level).toBe(1);
        expect((section as SectionNode).title).toBe('Introduction');
    });

    it('parses multiple sections', () => {
        const doc = newParser('\\section{First}\\subsection{Second}').parseDocument();
        expect(doc.children.length).toBeGreaterThanOrEqual(2);
        const sections = doc.children.filter((c): c is SectionNode => c instanceof SectionNode);
        expect(sections.some((s) => s.level === 1)).toBe(true);
        expect(sections.some((s) => s.level === 2)).toBe(true);
    });

    it.each([
        ['\\section{Title}', 1],
        ['\\subsection{Title}', 2],
        ['\\subsubsection{Title}', 3],
        ['\\paragraph{Title}', 4],
        ['\\subparagraph{Title}', 5],
    ])('parseSection %s -> level %i', (input, level) => {
        const doc = newParser(input).parseDocument();
        expect(doc.children).toHaveLength(1);
        expect(doc.children[0]).toBeInstanceOf(SectionNode);
        expect((doc.children[0] as SectionNode).level).toBe(level);
    });

    it.each([
        ['\\textbf{bold}', TokenType.TEXTBF],
        ['\\textit{italic}', TokenType.TEXTIT],
        ['\\underline{underlined}', TokenType.UNDERLINE],
        ['\\sout{strikethrough}', TokenType.SOUT],
        ['\\textsuperscript{super}', TokenType.TEXTSUPERSCRIPT],
        ['\\textsubscript{sub}', TokenType.TEXTSUBSCRIPT],
        ['\\texttt{code}', TokenType.TEXTTT],
    ])('parseCommand %s', (input, type) => {
        const doc = newParser(input).parseDocument();
        expect(doc.children).toHaveLength(1);
        expect(doc.children[0]).toBeInstanceOf(CommandNode);
        expect((doc.children[0] as CommandNode).type).toBe(type);
    });

    it('parses itemize environment', () => {
        const doc = newParser('\\begin{itemize}\\item First\\item Second\\end{itemize}').parseDocument();
        expect(doc.children.length).toBeGreaterThan(0);
        const env = findEnvironment(doc.children);
        expect(env).toBeDefined();
        expect(env!.environment).toBe('itemize');
        expect(env!.type).toBe(TokenType.ITEMIZE);
    });

    it('parses enumerate environment', () => {
        const doc = newParser('\\begin{enumerate}\\item First\\item Second\\end{enumerate}').parseDocument();
        const env = findEnvironment(doc.children);
        expect(env).toBeDefined();
        expect(env!.environment).toBe('enumerate');
        expect(env!.type).toBe(TokenType.ENUMERATE);
    });

    it('parses items inside an environment', () => {
        const doc = newParser('\\begin{itemize}\\item Test item\\end{itemize}').parseDocument();
        const env = findEnvironment(doc.children);
        expect(env).toBeDefined();
        expect(env!.children.some((c) => c instanceof ItemNode)).toBe(true);
    });

    it('parses href', () => {
        const doc = newParser('\\href{https://example.com}{Link text}').parseDocument();
        expect(doc.children).toHaveLength(1);
        const cmd = doc.children[0] as CommandNode;
        expect(cmd).toBeInstanceOf(CommandNode);
        expect(cmd.type).toBe(TokenType.HREF);
        expect(cmd.value).toBe('Link text');
        expect(cmd.options).toBe('https://example.com');
    });

    it('parses line break', () => {
        const doc = newParser('\\\\').parseDocument();
        expect(doc.children).toHaveLength(1);
        expect(doc.children[0]).toBeInstanceOf(CommandNode);
        expect((doc.children[0] as CommandNode).type).toBe(TokenType.LINEBREAK);
    });

    it('parses hrule', () => {
        const doc = newParser('\\hrule').parseDocument();
        expect(doc.children).toHaveLength(1);
        expect(doc.children[0]).toBeInstanceOf(CommandNode);
        expect((doc.children[0] as CommandNode).type).toBe(TokenType.HRULE);
    });

    it.each([
        ['$E = mc^2$', false],
        ['$$\\sum_{i=1}^{n} i$$', true],
    ])('parseMath %s', (input, isDisplay) => {
        const doc = newParser(input).parseDocument();
        expect(doc.children).toHaveLength(1);
        expect(doc.children[0]).toBeInstanceOf(MathNode);
        expect((doc.children[0] as MathNode).isDisplay).toBe(isDisplay);
    });

    it('parses text', () => {
        const doc = newParser('Hello World').parseDocument();
        expect(doc.children.some((c) => c instanceof TextNode)).toBe(true);
    });

    it('parses comment', () => {
        const doc = newParser('% This is a comment').parseDocument();
        expect(doc.children).toHaveLength(1);
        expect(doc.children[0]).toBeInstanceOf(CommentNode);
        expect((doc.children[0] as CommentNode).type).toBe(TokenType.COMMENT);
    });

    it('getEnvironmentType maps environment names', () => {
        const p = newParser('');
        const cases: Array<[string, TokenType]> = [
            ['itemize', TokenType.ITEMIZE],
            ['enumerate', TokenType.ENUMERATE],
            ['tabular', TokenType.TABULAR],
            ['quote', TokenType.QUOTE],
            ['lstlisting', TokenType.LSTLISTING],
            ['unknown', TokenType.BEGIN],
        ];
        for (const [name, expected] of cases) {
            expect([name, p['getEnvironmentType'](name)]).toEqual([name, expected]);
        }
    });

    it('curTokenIs', () => {
        const p = newParser('\\section');
        expect(p['curTokenIs'](TokenType.SECTION)).toBe(true);
        expect(p['curTokenIs'](TokenType.TEXTBF)).toBe(false);
    });

    it('peekTokenIs', () => {
        const p = newParser('\\section{');
        expect(p['peekTokenIs'](TokenType.LBRACE)).toBe(true);
        expect(p['peekTokenIs'](TokenType.RBRACE)).toBe(false);
    });

    it('getErrors collects peek errors', () => {
        const p = newParser('');
        expect(p.getErrors()).toHaveLength(0);
        p['peekError'](TokenType.LBRACE);
        const errors = p.getErrors();
        expect(errors).toHaveLength(1);
        expect(errors[0]).toContain('expected next token to be');
        expect(errors[0]).toBe('expected next token to be LBRACE, got EOF instead');
    });

    it('parses a complex document without errors', () => {
        const input = `
		\\section{Introduction}

		This is a test document with \\textbf{bold} and \\textit{italic} text.

		\\subsection{Lists}

		\\begin{itemize}
		\\item First item
		\\item Second item with \\texttt{code}
		\\end{itemize}

		\\subsection{Math}

		Inline math: $E = mc^2$

		Display math:
		$$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$

		\\subsection{Links}

		Visit \\href{https://golang.org}{Go website}.
	`;
        const p = newParser(input);
        const doc = p.parseDocument();
        expect(p.getErrors()).toEqual([]);
        expect(doc.children.length).toBeGreaterThan(0);
        expect(doc.children.filter((c) => c instanceof SectionNode).length).toBeGreaterThan(0);
    });

    it('parses tabular content into rows', () => {
        const doc = newParser('\\begin{tabular}{ll}Cell1 & Cell2 \\\\ Cell3 & Cell4 \\\\\\end{tabular}').parseDocument();
        const table = findEnvironment(doc.children, 'tabular');
        expect(table).toBeDefined();
        expect(table!.children.some((c) => c instanceof TableRowNode)).toBe(true);
    });

    it('skips \\documentclass', () => {
        const doc = newParser('\\documentclass[12pt]{article}').parseDocument();
        expect(doc.children).toHaveLength(0);
    });

    it('expectPeek advances on match and records an error otherwise', () => {
        const p = newParser('\\section{');
        expect(p['expectPeek'](TokenType.LBRACE)).toBe(true);
        expect(p['expectPeek'](TokenType.RBRACE)).toBe(false);
        expect(p.getErrors().length).toBeGreaterThan(0);
    });
});
