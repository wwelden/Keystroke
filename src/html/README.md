# HTML to LaTeX Converter

TypeScript port of the Go `keystroke/html` package. Converts HTML to LaTeX with a
hand-written lexer and parser (no DOM, no runtime dependencies), so it runs in the
browser as well as in Node.

## Architecture

1. **Lexer** (`Lexer.ts`): tokenizes HTML input
2. **Parser** (`Parser.ts`): builds an abstract syntax tree (AST)
3. **AST** (`Ast.ts`): HTML elements as tree nodes, each able to render itself to LaTeX
4. **Renderer** (`Renderer.ts`): turns a document AST into LaTeX output (preamble, body-only, options)

## Supported HTML Elements

### Headers
- `<h1>` → `\section{}`
- `<h2>` → `\subsection{}`
- `<h3>` → `\subsubsection{}`
- `<h4>` → `\paragraph{}`
- `<h5>`, `<h6>` → `\subparagraph{}`

### Text Formatting
- `<strong>`, `<b>` → `\textbf{}`
- `<em>`, `<i>` → `\textit{}`
- `<u>` → `\underline{}`
- `<s>` → `\sout{}`
- `<sup>` → `\textsuperscript{}`
- `<sub>` → `\textsubscript{}`

### Lists
- `<ul>` → `\begin{itemize}...\end{itemize}`
- `<ol>` → `\begin{enumerate}...\end{enumerate}`
- `<li>` → `\item`

### Code
- `<code>` → `\texttt{}`
- `<pre>` → `\begin{lstlisting}...\end{lstlisting}`

### Other Elements
- `<p>` → paragraph breaks
- `<a>` → `\href{url}{text}`
- `<blockquote>` → `\begin{quote}...\end{quote}`
- `<br>` → `\\`
- `<hr>` → `\hrule`

### Tables
- `<table>` → `\begin{tabular}...\end{tabular}`
- `<tr>` → table rows with `&` separators
- `<td>`, `<th>` → table cells (headers are bold)

## Usage

```ts
import { htmlToLatex, htmlToLatexBodyOnly, parseHtml, Converter } from "./html";

const latex = htmlToLatex(`<h1>Title</h1><p>This is <strong>bold</strong> text.</p>`);

// Without document preamble
const body = htmlToLatexBodyOnly(html);

// With custom options
const custom = htmlToLatex(html, {
    includeDocumentClass: true,
    includePackages: true,
    documentClass: "report",
    customPackages: ["amsmath", "amssymb"],
});

// Reusable converter instance
const converter = new Converter();
const result = converter.convert(html);

// AST plus parser errors
const { document, errors } = parseHtml(html);
```

### Quick Conversion Functions

```ts
h1ToSection("Chapter Title");      // \section{Chapter Title}
boldToTextbf("Important");         // \textbf{Important}
italicToTextit("Emphasis");        // \textit{Emphasis}
codeToTexttt("variable");          // \texttt{variable}
linkToHref("url", "text");         // \href{url}{text}
```

## LaTeX Packages Required

```latex
\usepackage[utf8]{inputenc}  % For UTF-8 support
\usepackage{ulem}            % For strikethrough (\sout)
\usepackage{hyperref}        % For links (\href)
\usepackage{listings}        % For code blocks
\usepackage{booktabs}        % For tables
\usepackage{array}           % For tables
```

## Notes

- HTML entities (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&apos;`, `&nbsp;`) are decoded.
- Special LaTeX characters in text are escaped.
- The parser is forgiving of malformed HTML and never throws.
- Table columns default to left-aligned (`l`).
- Code blocks take a language from `class="language-xxx"`.
- This is a faithful port, so it keeps the Go version's known limitations. See
  `tests/html/GoParity.test.ts` for real outputs.
