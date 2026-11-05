// Public API of the LaTeX -> HTML converter.
// Ported from the Go package keystroke/latek (latex_to_html.go).

import { Lexer } from './Lexer';
import { Parser } from './Parser';
import { Renderer, RenderOptions } from './Renderer';
import { DocumentNode } from './Ast';

export { Lexer } from './Lexer';
export { Parser } from './Parser';
export { Renderer, getDefaultCSS } from './Renderer';
export type { RenderOptions } from './Renderer';
export { Token, TokenType, newToken, newTokenWithValue, newTokenWithOptions } from './Token';
export type { Node } from './Ast';
export {
    LaTeXNode,
    DocumentNode,
    SectionNode,
    TextNode,
    CommandNode,
    EnvironmentNode,
    ItemNode,
    TableRowNode,
    TableCellNode,
    MathNode,
    CommentNode,
} from './Ast';

export interface ParseResult {
    document: DocumentNode;
    errors: string[];
}

function parse(input: string): Parser {
    return new Parser(new Lexer(input));
}

/**
 * Converts LaTeX to a full HTML document. Without options this uses the
 * document's built-in template (Go: LaTeXToHTML); with options it behaves like
 * latexToHtmlWithOptions.
 */
export function latexToHtml(input: string, options?: RenderOptions): string {
    const doc = parse(input).parseDocument();
    const renderer = new Renderer();
    if (options !== undefined) {
        return renderer.renderWithOptions(doc, options);
    }
    return renderer.renderDocument(doc);
}

/** Converts LaTeX to HTML without the document wrapper. */
export function latexToHtmlBodyOnly(input: string): string {
    return new Renderer().renderBodyOnly(parse(input).parseDocument());
}

/** Converts LaTeX to HTML with custom options. */
export function latexToHtmlWithOptions(input: string, options: RenderOptions): string {
    return new Renderer().renderWithOptions(parse(input).parseDocument(), options);
}

/** Converts LaTeX to a full HTML document that loads MathJax. */
export function latexToHtmlWithMathJax(input: string): string {
    return new Renderer().renderWithMathJax(parse(input).parseDocument());
}

/** Parses LaTeX and returns the AST together with any parse errors. */
export function parseLatex(input: string): ParseResult {
    const parser = parse(input);
    const document = parser.parseDocument();
    return { document, errors: parser.getErrors() };
}

/** Reusable LaTeX -> HTML converter. */
export class Converter {
    private renderer: Renderer;

    constructor() {
        this.renderer = new Renderer();
    }

    convert(input: string): string {
        return latexToHtml(input);
    }

    convertWithOptions(input: string, options: RenderOptions): string {
        return latexToHtmlWithOptions(input, options);
    }

    convertBodyOnly(input: string): string {
        return latexToHtmlBodyOnly(input);
    }

    convertWithMathJax(input: string): string {
        return latexToHtmlWithMathJax(input);
    }

    /** Parses LaTeX and returns the AST for further processing. */
    convertToAST(input: string): DocumentNode {
        return parse(input).parseDocument();
    }

    /** Renders an AST to a full HTML document. */
    renderAST(doc: DocumentNode): string {
        return this.renderer.renderDocument(doc);
    }
}

// Quick conversion functions for common LaTeX commands.
//
// NOTE: faithful to Go, these do NOT HTML-escape their input. The Go helper
// `htmlEscape` in latex_to_html.go delegates to Renderer.CleanOutput (collapse
// triple newlines + trim) rather than to an escaper.
function quickClean(s: string): string {
    return new Renderer().cleanOutput(s);
}

export function sectionToH1(text: string): string {
    return '<h1>' + quickClean(text) + '</h1>';
}

export function subsectionToH2(text: string): string {
    return '<h2>' + quickClean(text) + '</h2>';
}

export function subsubsectionToH3(text: string): string {
    return '<h3>' + quickClean(text) + '</h3>';
}

export function textbfToStrong(text: string): string {
    return '<strong>' + quickClean(text) + '</strong>';
}

export function textitToEm(text: string): string {
    return '<em>' + quickClean(text) + '</em>';
}

export function textttToCode(text: string): string {
    return '<code>' + quickClean(text) + '</code>';
}

export function hrefToLink(url: string, text: string): string {
    return '<a href="' + quickClean(url) + '">' + quickClean(text) + '</a>';
}

// Predefined rendering options. These are functions (as in Go) so callers get
// a fresh object they can mutate.

/** Standard HTML rendering options. */
export function defaultOptions(): RenderOptions {
    return {
        includeDoctype: true,
        includeStyle: true,
        title: 'LaTeX Document',
        language: 'en',
        bodyOnly: false,
    };
}

/** Minimal HTML rendering options (body only). */
export function minimalOptions(): RenderOptions {
    return {
        includeDoctype: false,
        includeStyle: false,
        bodyOnly: true,
    };
}

/** Options suitable for academic documents. */
export function academicOptions(title: string): RenderOptions {
    return {
        includeDoctype: true,
        includeStyle: true,
        title,
        language: 'en',
        customCSS: `
.theorem, .lemma, .proof {
    margin: 1em 0;
    padding: 1em;
    border-left: 4px solid #007acc;
    background-color: #f0f8ff;
}

.theorem-title, .lemma-title {
    font-weight: bold;
    margin-bottom: 0.5em;
}

.proof::after {
    content: "∎";
    float: right;
}

.equation {
    text-align: center;
    margin: 1em 0;
}`,
        bodyOnly: false,
    };
}
