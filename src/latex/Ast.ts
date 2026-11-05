// AST node definitions for the LaTeX -> HTML converter.
// Ported from the Go package keystroke/latek/ast. Each node knows how to
// render itself to HTML.

import { TokenType } from './Token';

export interface Node {
    tokenLiteral(): string;
    toString(): string;
    renderHTML(): string;
}

/** Base class for all LaTeX nodes (Go: LaTeXNode). */
export class LaTeXNode implements Node {
    constructor(
        public type: TokenType,
        public content: string = '',
        public children: Node[] = [],
    ) {}

    tokenLiteral(): string {
        return this.content;
    }

    toString(): string {
        return this.content;
    }

    renderHTML(): string {
        return this.content;
    }

    protected renderChildrenHTML(): string {
        let result = '';
        for (const child of this.children) {
            result += child.renderHTML();
        }
        return result;
    }
}

/** Root LaTeX document. */
export class DocumentNode extends LaTeXNode {
    documentClass: string = 'article';
    packages: string[] = [];

    constructor(children: Node[]) {
        super(TokenType.EOF, '', children); // Document has no specific token type
    }

    renderHTML(): string {
        let result = '<!DOCTYPE html>\n<html>\n<head>\n';
        result += '<meta charset="UTF-8">\n';
        result += '<title>LaTeX Document</title>\n';
        result += '<style>\n';
        result += "body { font-family: 'Times New Roman', serif; margin: 40px; }\n";
        result += 'h1 { font-size: 1.5em; margin-top: 1.5em; }\n';
        result += 'h2 { font-size: 1.3em; margin-top: 1.3em; }\n';
        result += 'h3 { font-size: 1.1em; margin-top: 1.1em; }\n';
        result += "code { font-family: 'Courier New', monospace; }\n";
        result += 'pre { background-color: #f5f5f5; padding: 10px; }\n';
        result += 'blockquote { margin-left: 2em; font-style: italic; }\n';
        result += 'table { border-collapse: collapse; margin: 1em 0; }\n';
        result += 'th, td { border: 1px solid #ccc; padding: 0.5em; }\n';
        result += 'th { background-color: #f0f0f0; font-weight: bold; }\n';
        result += '</style>\n';
        result += '</head>\n<body>\n';
        result += this.renderChildrenHTML();
        result += '</body>\n</html>';
        return result;
    }
}

function sectionTokenType(level: number): TokenType {
    switch (level) {
        case 1: return TokenType.SECTION;
        case 2: return TokenType.SUBSECTION;
        case 3: return TokenType.SUBSUBSECTION;
        case 4: return TokenType.PARAGRAPH;
        case 5: return TokenType.SUBPARAGRAPH;
        // Go leaves the type as the empty string for other levels; TypeScript
        // has no empty TokenType, so ILLEGAL is used instead.
        default: return TokenType.ILLEGAL;
    }
}

/** \section, \subsection, ... */
export class SectionNode extends LaTeXNode {
    constructor(public level: number, public title: string) {
        super(sectionTokenType(level), title, []);
    }

    renderHTML(): string {
        // Map LaTeX section levels to HTML headers (capped at h6)
        const headerLevel = this.level > 6 ? 6 : this.level;
        const digit = String.fromCharCode(48 + headerLevel);
        return '<h' + digit + '>' + htmlEscape(this.title) + '</h' + digit + '>\n';
    }
}

/** Plain text content. */
export class TextNode extends LaTeXNode {
    constructor(public text: string) {
        super(TokenType.TEXT, text, []);
    }

    renderHTML(): string {
        return htmlEscape(this.text);
    }
}

/** LaTeX commands with content: \textbf{}, \href{}{}, \\, \hrule, ... */
export class CommandNode extends LaTeXNode {
    constructor(
        type: TokenType,
        public command: string,
        public value: string,
        public options: string,
    ) {
        super(type, value, []);
    }

    renderHTML(): string {
        let content = this.renderChildrenHTML();
        if (content === '') {
            content = htmlEscape(this.value);
        }

        switch (this.type) {
            case TokenType.TEXTBF: return '<strong>' + content + '</strong>';
            case TokenType.TEXTIT: return '<em>' + content + '</em>';
            case TokenType.UNDERLINE: return '<u>' + content + '</u>';
            case TokenType.SOUT: return '<s>' + content + '</s>';
            case TokenType.TEXTSUPERSCRIPT: return '<sup>' + content + '</sup>';
            case TokenType.TEXTSUBSCRIPT: return '<sub>' + content + '</sub>';
            case TokenType.TEXTTT: return '<code>' + content + '</code>';
            case TokenType.HREF:
                // \href{url}{text}: url is stored in options, text in value
                return '<a href="' + htmlEscape(this.options) + '">' + content + '</a>';
            case TokenType.LINEBREAK: return '<br>\n';
            case TokenType.HRULE: return '<hr>\n';
            default: return content;
        }
    }
}

/** \begin{env} ... \end{env} */
export class EnvironmentNode extends LaTeXNode {
    constructor(
        type: TokenType,
        public environment: string,
        public options: string,
    ) {
        super(type, '', []);
    }

    renderHTML(): string {
        const content = this.renderChildrenHTML();

        switch (this.environment) {
            case 'itemize':
                return '<ul>\n' + content + '</ul>\n';
            case 'enumerate':
                return '<ol>\n' + content + '</ol>\n';
            case 'quote':
                return '<blockquote>\n' + content + '</blockquote>\n';
            case 'lstlisting':
                if (this.options !== '') {
                    const lang = extractLanguage(this.options);
                    if (lang !== '') {
                        return '<pre><code class="language-' + lang + '">' + content + '</code></pre>\n';
                    }
                }
                return '<pre><code>' + content + '</code></pre>\n';
            case 'tabular':
                return '<table>\n' + content + '</table>\n';
            default:
                return '<div class="' + this.environment + '">\n' + content + '</div>\n';
        }
    }
}

/** \item inside a list environment. */
export class ItemNode extends LaTeXNode {
    constructor() {
        super(TokenType.ITEM, '', []);
    }

    renderHTML(): string {
        return '<li>' + this.renderChildrenHTML() + '</li>\n';
    }
}

/** A table row; rows are separated by \\, cells by &. */
export class TableRowNode extends LaTeXNode {
    cells: Node[] = [];

    constructor() {
        super(TokenType.AMPERSAND, '', []);
    }

    renderHTML(): string {
        let result = '<tr>';
        for (const cell of this.cells) {
            result += cell.renderHTML();
        }
        result += '</tr>\n';
        return result;
    }
}

/** A table cell. */
export class TableCellNode extends LaTeXNode {
    constructor(public isHeader: boolean) {
        super(TokenType.AMPERSAND, '', []);
    }

    renderHTML(): string {
        const content = this.renderChildrenHTML();
        if (this.isHeader) {
            return '<th>' + content + '</th>';
        }
        return '<td>' + content + '</td>';
    }
}

/** $...$ or $$...$$ */
export class MathNode extends LaTeXNode {
    constructor(content: string, public isDisplay: boolean) {
        super(isDisplay ? TokenType.MATH_DISPLAY : TokenType.MATH_INLINE, content, []);
    }

    renderHTML(): string {
        // Rendered as code with a math class; MathJax/KaTeX can pick it up.
        const escapedContent = htmlEscape(this.content);
        if (this.isDisplay) {
            return '<div class="math-display"><code>' + escapedContent + '</code></div>\n';
        }
        return '<span class="math-inline"><code>' + escapedContent + '</code></span>';
    }
}

/** % comment */
export class CommentNode extends LaTeXNode {
    constructor(public comment: string) {
        super(TokenType.COMMENT, comment, []);
    }

    renderHTML(): string {
        return '<!-- ' + htmlEscape(this.comment) + ' -->\n';
    }
}

// Helper functions

export function htmlEscape(s: string): string {
    return s
        .split('&').join('&amp;')
        .split('<').join('&lt;')
        .split('>').join('&gt;')
        .split('"').join('&quot;')
        .split("'").join('&#39;');
}

/** Extracts the language from lstlisting options like "language=go". */
export function extractLanguage(options: string): string {
    if (options.includes('language=')) {
        const parts = options.split('language=');
        if (parts.length > 1) {
            let lang = parts[1].split(',')[0];
            lang = lang.split(']')[0];
            return lang.trim();
        }
    }
    return '';
}
