// HTML renderer for the LaTeX AST. Ported from the Go package keystroke/latek/render.

import { Node, DocumentNode, htmlEscape } from './Ast';

/** Configurable rendering options. Omitted fields behave like Go zero values. */
export interface RenderOptions {
    includeDoctype?: boolean;
    includeStyle?: boolean;
    customCSS?: string;
    title?: string;
    language?: string;
    bodyOnly?: boolean;
}

// Kept byte-for-byte identical to the Go raw string (including the doubled
// backslashes, which MathJax's JS config then reads as single backslashes).
const MATHJAX_CONFIG = String.raw`
<script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
<script>
MathJax = {
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']]
  }
};
</script>
</head>`;

export class Renderer {
    render(node: Node | null | undefined): string {
        if (node === null || node === undefined) {
            return '';
        }
        return node.renderHTML();
    }

    renderToString(node: Node | null | undefined): string {
        return this.render(node);
    }

    /** Renders a complete LaTeX document to HTML. */
    renderDocument(doc: DocumentNode | null | undefined): string {
        if (doc === null || doc === undefined) {
            return '';
        }
        return doc.renderHTML();
    }

    /** Renders only the document body content without the HTML wrapper. */
    renderBodyOnly(doc: DocumentNode | null | undefined): string {
        if (doc === null || doc === undefined) {
            return '';
        }

        let result = '';
        for (const child of doc.children) {
            result += this.render(child);
        }
        return result.trim();
    }

    renderWithOptions(doc: DocumentNode | null | undefined, options: RenderOptions): string {
        if (doc === null || doc === undefined) {
            return '';
        }

        if (options.bodyOnly) {
            return this.renderBodyOnly(doc);
        }

        let result = '';

        if (options.includeDoctype) {
            result += '<!DOCTYPE html>\n';
        }

        result += '<html';
        if (options.language) {
            result += ' lang="' + options.language + '"';
        }
        result += '>\n<head>\n';
        result += '<meta charset="UTF-8">\n';
        result += '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n';

        const title = options.title ? options.title : 'LaTeX Document';
        result += '<title>' + htmlEscape(title) + '</title>\n';

        if (options.includeStyle) {
            result += '<style>\n';
            result += getDefaultCSS();
            if (options.customCSS) {
                result += '\n/* Custom CSS */\n';
                result += options.customCSS;
            }
            result += '\n</style>\n';
        }

        result += '</head>\n<body>\n';

        for (const child of doc.children) {
            result += this.render(child);
        }

        result += '</body>\n</html>';
        return result;
    }

    /** Renders with MathJax support for mathematical expressions. */
    renderWithMathJax(doc: DocumentNode | null | undefined): string {
        const result = this.renderWithOptions(doc, {
            includeDoctype: true,
            includeStyle: true,
            title: 'LaTeX Document with Math',
        });

        // Insert MathJax before the first </head>. A replacer function is used
        // so the "$$" in the config is not treated as a replacement pattern.
        return result.replace('</head>', () => MATHJAX_CONFIG);
    }

    /** Collapses triple newlines and trims surrounding whitespace. */
    cleanOutput(html: string): string {
        return html.split('\n\n\n').join('\n\n').trim();
    }
}

export function getDefaultCSS(): string {
    return `body {
    font-family: 'Times New Roman', serif;
    line-height: 1.6;
    margin: 40px;
    color: #333;
}

h1, h2, h3, h4, h5, h6 {
    color: #2c3e50;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
}

h1 { font-size: 2em; }
h2 { font-size: 1.5em; }
h3 { font-size: 1.3em; }
h4 { font-size: 1.1em; }
h5, h6 { font-size: 1em; }

p {
    margin: 1em 0;
    text-align: justify;
}

strong {
    font-weight: bold;
}

em {
    font-style: italic;
}

u {
    text-decoration: underline;
}

s {
    text-decoration: line-through;
}

sup {
    vertical-align: super;
    font-size: smaller;
}

sub {
    vertical-align: sub;
    font-size: smaller;
}

code {
    font-family: 'Courier New', monospace;
    background-color: #f8f8f8;
    padding: 2px 4px;
    border-radius: 3px;
    font-size: 0.9em;
}

pre {
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 10px;
    overflow-x: auto;
    margin: 1em 0;
}

pre code {
    background-color: transparent;
    padding: 0;
    border-radius: 0;
}

blockquote {
    margin: 1em 2em;
    padding: 0.5em 1em;
    border-left: 4px solid #ddd;
    font-style: italic;
    background-color: #f9f9f9;
}

ul, ol {
    margin: 1em 0;
    padding-left: 2em;
}

li {
    margin: 0.5em 0;
}

table {
    border-collapse: collapse;
    margin: 1em 0;
    width: 100%;
}

th, td {
    border: 1px solid #ddd;
    padding: 8px 12px;
    text-align: left;
}

th {
    background-color: #f2f2f2;
    font-weight: bold;
}

tr:nth-child(even) {
    background-color: #f9f9f9;
}

a {
    color: #3498db;
    text-decoration: none;
}

a:hover {
    text-decoration: underline;
}

hr {
    border: none;
    border-top: 1px solid #ddd;
    margin: 2em 0;
}

.math-display {
    text-align: center;
    margin: 1em 0;
}

.math-inline {
    display: inline;
}

.math-display code,
.math-inline code {
    background-color: #fff;
    border: 1px solid #e0e0e0;
    padding: 4px 8px;
}`;
}
