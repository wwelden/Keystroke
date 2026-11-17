import { htmlToLatex, htmlToLatexBodyOnly } from "../../src/html";

// Golden outputs for HTML -> LaTeX conversion. The inputs started as a parity
// suite against the original Go implementation (Keystroke2/html), but parity was
// intentionally dropped (#24): Go lost content on almost every input (spaces
// between words, sibling list items and table rows, words after inline tags,
// text read out of order). These fixtures lock in the correct output instead.
const goldenCases: { input: string; body: string; full: string }[] = [
  {
    input: "<h1>Title</h1><p>This is <strong>bold</strong> text.</p>",
    body: "\\section{Title}\n\nThis is \\textbf{bold} text.",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\n\\section{Title}\n\nThis is \\textbf{bold} text.\n\n\\end{document}",
  },
  {
    input: "<p>Hello, world! 100% & more</p>",
    body: "Hello, world! 100\\% \\& more",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\n\nHello, world! 100\\% \\& more\n\n\\end{document}",
  },
  {
    input: "<ul><li>Item 1</li><li>Item 2</li></ul>",
    body: "\\begin{itemize}\n\\item Item 1\n\\item Item 2\n\\end{itemize}",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\n\\begin{itemize}\n\\item Item 1\n\\item Item 2\n\\end{itemize}\n\n\\end{document}",
  },
  {
    input: "<ol><li>One</li></ol>",
    body: "\\begin{enumerate}\n\\item One\n\\end{enumerate}",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\n\\begin{enumerate}\n\\item One\n\\end{enumerate}\n\n\\end{document}",
  },
  {
    input: "<a href=\"https://example.com\">Link text</a>",
    body: "\\href{https://example.com}{Link text}",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\n\\href{https://example.com}{Link text}\n\\end{document}",
  },
  {
    input: "<pre class=\"language-go\">func main() {}</pre>",
    body: "\\begin{lstlisting}[language=go]\nfunc main() \\{\\}\n\\end{lstlisting}",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\n\\begin{lstlisting}[language=go]\nfunc main() \\{\\}\n\\end{lstlisting}\n\n\\end{document}",
  },
  {
    input: "<table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>",
    body: "\\begin{tabular}{ll}\n\\toprule\n\\textbf{A} & \\textbf{B} \\\\\n\\midrule\n1 & 2 \\\\\n\\bottomrule\n\\end{tabular}",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\n\\begin{tabular}{ll}\n\\toprule\n\\textbf{A} & \\textbf{B} \\\\\n\\midrule\n1 & 2 \\\\\n\\bottomrule\n\\end{tabular}\n\n\\end{document}",
  },
  {
    input: "<blockquote><p>Quote <code>x</code>.</p></blockquote>",
    body: "\\begin{quote}\n\nQuote \\texttt{x}.\n\n\\end{quote}",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\n\\begin{quote}\n\nQuote \\texttt{x}.\n\n\\end{quote}\n\n\\end{document}",
  },
  {
    input: "<p>a &amp; b &lt;c&gt;</p>",
    body: "a \\& b <c>",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\n\na \\& b <c>\n\n\\end{document}",
  },
  {
    input: "<div><span>hi there</span></div>",
    body: "hi there",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\nhi there\n\\end{document}",
  },
  {
    input: "line<br/>next<hr>",
    body: "line\n\\\\\n\nnext\n\\hrule",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\nline\n\\\\\n\nnext\n\\hrule\n\n\\end{document}",
  },
  {
    input: "<h1>Unclosed tag",
    body: "\\section{Unclosed tag}",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\n\\section{Unclosed tag}\n\\end{document}",
  },
  {
    input: "<p>under_score snake-case x^2 ~tilde {b} $5 #1 \\back</p>",
    body: "under\\_score snake-case x\\textasciicircum 2 \\textasciitilde tilde \\{b\\} \\$5 \\#1 \\textbackslash back",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\n\nunder\\_score snake-case x\\textasciicircum 2 \\textasciitilde tilde \\{b\\} \\$5 \\#1 \\textbackslash back\n\n\\end{document}",
  },
  {
    input: "<h2>Sub</h2><h3>S3</h3><h4>P</h4><h5>SP</h5><h6>SP6</h6>",
    body: "\\subsection{Sub}\n\\subsubsection{S3}\n\\paragraph{P}\n\\subparagraph{SP}\n\\subparagraph{SP6}",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\n\\subsection{Sub}\n\\subsubsection{S3}\n\\paragraph{P}\n\\subparagraph{SP}\n\\subparagraph{SP6}\n\\end{document}",
  },
  {
    input: "<u>u</u><s>s</s><sup>2</sup><sub>i</sub><b>b</b><i>i</i><em>e</em>",
    body: "\\underline{u}\n\\sout{s}\n\\textsuperscript{2}\n\\textsubscript{i}\n\\textbf{b}\n\\textit{i}\n\\textit{e}",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\n\\underline{u}\n\\sout{s}\n\\textsuperscript{2}\n\\textsubscript{i}\n\\textbf{b}\n\\textit{i}\n\\textit{e}\n\\end{document}",
  },
  {
    input: "Plain text, here. And more!",
    body: "Plain text, here. And more!",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\nPlain text, here. And more!\n\\end{document}",
  },
  {
    input: "<p>café</p>",
    body: "café",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\n\ncafé\n\n\\end{document}",
  },
  {
    input: "<img src=\"x.png\"/><p>after</p>",
    body: "after",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\n\nafter\n\n\\end{document}",
  },
  {
    input: "\n\t\t<h1>Title</h1>\n\t\t<p>This is a <strong>bold</strong> and <em>italic</em> text.</p>\n\t\t<ul>\n\t\t\t<li>First item</li>\n\t\t\t<li>Second item</li>\n\t\t</ul>\n\t\t<p>Visit <a href=\"https://example.com\">our site</a>.</p>\n\t",
    body: "\\section{Title}\n\nThis is a \\textbf{bold} and \\textit{italic} text.\n\n\\begin{itemize}\n\\item First item\n\\item Second item\n\\end{itemize}\n\n\nVisit \\href{https://example.com}{our site}.",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\n\\section{Title}\n\nThis is a \\textbf{bold} and \\textit{italic} text.\n\n\\begin{itemize}\n\\item First item\n\\item Second item\n\\end{itemize}\n\n\nVisit \\href{https://example.com}{our site}.\n\n\\end{document}",
  },
  {
    input: "<table>\n<tr>\n<th>Header 1</th>\n<th>Header 2</th>\n</tr>\n<tr>\n<td>Cell 1</td>\n<td>Cell 2</td>\n</tr>\n</table>",
    body: "\\begin{tabular}{ll}\n\\toprule\n\\textbf{Header 1} & \\textbf{Header 2} \\\\\n\\midrule\nCell 1 & Cell 2 \\\\\n\\bottomrule\n\\end{tabular}",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\n\\begin{tabular}{ll}\n\\toprule\n\\textbf{Header 1} & \\textbf{Header 2} \\\\\n\\midrule\nCell 1 & Cell 2 \\\\\n\\bottomrule\n\\end{tabular}\n\n\\end{document}",
  },
];

describe("htmlToLatex golden outputs", () => {
  it.each(goldenCases.map(c => [c.input, c] as const))("%j", (_input, c) => {
    expect(htmlToLatexBodyOnly(c.input)).toBe(c.body);
    expect(htmlToLatex(c.input)).toBe(c.full);
  });
});
