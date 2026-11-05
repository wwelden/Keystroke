import { Lexer } from "./Lexer";
import { Parser } from "./Parser";
import { Renderer, RenderOptions } from "./Renderer";
import { DocumentNode } from "./Ast";

export { Lexer } from "./Lexer";
export { Parser } from "./Parser";
export { Renderer } from "./Renderer";
export type { RenderOptions } from "./Renderer";
export { Token, TokenType, newToken, newTokenWithAttributes } from "./Token";
export type { Attributes } from "./Token";
export * from "./Ast";

export interface ParseResult {
    document: DocumentNode;
    errors: string[];
}

// Parses HTML and returns the AST along with any parser errors
export function parseHtml(input: string): ParseResult {
    const parser = new Parser(new Lexer(input));
    const document = parser.parseDocument();
    return { document, errors: parser.getErrors() };
}

/**
 * Converts HTML to a complete LaTeX document (with preamble).
 * When `options` is given, rendering is controlled by those options instead
 * (equivalent to htmlToLatexWithOptions).
 */
export function htmlToLatex(input: string, options?: RenderOptions): string {
    if (options !== undefined) {
        return htmlToLatexWithOptions(input, options);
    }
    return new Renderer().renderDocument(parseHtml(input).document);
}

// Converts HTML to LaTeX without document preamble
export function htmlToLatexBodyOnly(input: string): string {
    return new Renderer().renderBodyOnly(parseHtml(input).document);
}

// Converts HTML to LaTeX with custom options
export function htmlToLatexWithOptions(input: string, options: RenderOptions): string {
    return new Renderer().renderWithOptions(parseHtml(input).document, options);
}

// Reusable HTML to LaTeX converter
export class Converter {
    private renderer = new Renderer();

    convert(input: string): string {
        return htmlToLatex(input);
    }

    convertWithOptions(input: string, options: RenderOptions): string {
        return htmlToLatexWithOptions(input, options);
    }

    convertBodyOnly(input: string): string {
        return htmlToLatexBodyOnly(input);
    }

    convertToAST(input: string): DocumentNode {
        return parseHtml(input).document;
    }

    renderAST(doc: DocumentNode): string {
        return this.renderer.renderDocument(doc);
    }
}

// Quick conversion functions for common use cases

export function h1ToSection(text: string): string {
    return "\\section{" + text + "}";
}

export function h2ToSubsection(text: string): string {
    return "\\subsection{" + text + "}";
}

export function h3ToSubsubsection(text: string): string {
    return "\\subsubsection{" + text + "}";
}

export function boldToTextbf(text: string): string {
    return "\\textbf{" + text + "}";
}

export function italicToTextit(text: string): string {
    return "\\textit{" + text + "}";
}

export function codeToTexttt(text: string): string {
    return "\\texttt{" + text + "}";
}

export function linkToHref(url: string, text: string): string {
    return "\\href{" + url + "}{" + text + "}";
}
