import { htmlToLatex, htmlToLatexBodyOnly } from "../../src/html";

// Outputs captured from the original Go implementation (Keystroke2/html) via
// html.HTMLToLaTeX / html.HTMLToLaTeXBodyOnly. These lock the TypeScript port to
// byte-for-byte parity with Go, including its known quirks (dropped spaces between
// words, skipped sibling elements, out-of-order punctuation text).
const goldenCases: { input: string; body: string; full: string }[] = [
  {
    input: "<h1>Title</h1><p>This is <strong>bold</strong> text.</p>",
    body: "\\section{Title}\nThis\nis\n\\textbf{bold}",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\n\\section{Title}\nThis\nis\n\\textbf{bold}\n\n\\end{document}",
  },
  {
    input: "<p>Hello, world! 100% & more</p>",
    body: "Hello! 100\\% \\& more</p>world",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\n\nHello! 100\\% \\& more</p>world\n\n\\end{document}",
  },
  {
    input: "<ul><li>Item 1</li><li>Item 2</li></ul>",
    body: "\\begin{itemize}\n\\item Item1\n\\end{itemize}\n\n\\begin{itemize}\n\\end{itemize}",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\n\\begin{itemize}\n\\item Item1\n\\end{itemize}\n\n\\begin{itemize}\n\\end{itemize}\n\n\\end{document}",
  },
  {
    input: "<ol><li>One</li></ol>",
    body: "\\begin{enumerate}\n\\item One\n\\end{enumerate}",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\n\\begin{enumerate}\n\\item One\n\\end{enumerate}\n\n\\end{document}",
  },
  {
    input: "<a href=\"https://example.com\">Link text</a>",
    body: "\\href{https://example.com}{Linktext}",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\n\\href{https://example.com}{Linktext}\n\\end{document}",
  },
  {
    input: "<pre class=\"language-go\">func main() {}</pre>",
    body: "\\begin{lstlisting}[language=go]\nfuncmain\\{\\}\n\\end{lstlisting}",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\n\\begin{lstlisting}[language=go]\nfuncmain\\{\\}\n\\end{lstlisting}\n\n\\end{document}",
  },
  {
    input: "<table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>",
    body: "\\begin{tabular}{l}\n\\toprule\n\\textbf{A} \\\\\n\\midrule\n \\\\\n\\bottomrule\n\\end{tabular}\n\n2",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\n\\begin{tabular}{l}\n\\toprule\n\\textbf{A} \\\\\n\\midrule\n \\\\\n\\bottomrule\n\\end{tabular}\n\n2\n\n\\end{document}",
  },
  {
    input: "<blockquote><p>Quote <code>x</code>.</p></blockquote>",
    body: "\\begin{quote}\n\nQuote\\texttt{x}\n\n\\end{quote}",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\n\\begin{quote}\n\nQuote\\texttt{x}\n\n\\end{quote}\n\n\\end{document}",
  },
  {
    input: "<p>a &amp; b &lt;c&gt;</p>",
    body: "a; b <c>amp",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\n\na; b <c>amp\n\n\\end{document}",
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
    body: "\\section{Unclosedtag}",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\n\\section{Unclosedtag}\n\\end{document}",
  },
  {
    input: "<p>under_score snake-case x^2 ~tilde {b} $5 #1 \\back</p>",
    body: "under\\_scoresnake-casex\\textasciitilde tilde \\{b\\} \\$5 \\#1 \\textbackslash back2",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\n\nunder\\_scoresnake-casex\\textasciitilde tilde \\{b\\} \\$5 \\#1 \\textbackslash back2\n\n\\end{document}",
  },
  {
    input: "<h2>Sub</h2><h3>S3</h3><h4>P</h4><h5>SP</h5><h6>SP6</h6>",
    body: "\\subsection{Sub}\nS3\n\\subsubsection{\\paragraph{P}SP}\nSP6\n\\subparagraph{}",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\n\\subsection{Sub}\nS3\n\\subsubsection{\\paragraph{P}SP}\nSP6\n\\subparagraph{}\n\\end{document}",
  },
  {
    input: "<u>u</u><s>s</s><sup>2</sup><sub>i</sub><b>b</b><i>i</i><em>e</em>",
    body: "\\underline{u}\ns\n\\sout{\\textsuperscript{2}i}\nb\n\\textbf{\\textit{i}e}",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\n\\underline{u}\ns\n\\sout{\\textsuperscript{2}i}\nb\n\\textbf{\\textit{i}e}\n\\end{document}",
  },
  {
    input: "Plain text, here. And more!",
    body: "Plain\ntext\n. And more!\nhere",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\nPlain\ntext\n. And more!\nhere\n\\end{document}",
  },
  {
    input: "<p>caf\u00e9</p>",
    body: "caf",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\n\ncaf\n\n\\end{document}",
  },
  {
    input: "<img src=\"x.png\"/><p>after</p>",
    body: "after",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\nafter\n\n\\end{document}",
  },
  {
    input: "\n\t\t<h1>Title</h1>\n\t\t<p>This is a <strong>bold</strong> and <em>italic</em> text.</p>\n\t\t<ul>\n\t\t\t<li>First item</li>\n\t\t\t<li>Second item</li>\n\t\t</ul>\n\t\t<p>Visit <a href=\"https://example.com\">our site</a>.</p>\n\t",
    body: "\\section{Title}\nThis\nis\na\n\\textbf{bold}\n\\textit{italic}\n\n\\begin{itemize}\n\\item Firstitem\n\\end{itemize}\n\n\n\nVisit\\href{https://example.com}{oursite}",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\n\\section{Title}\nThis\nis\na\n\\textbf{bold}\n\\textit{italic}\n\n\\begin{itemize}\n\\item Firstitem\n\\end{itemize}\n\n\n\nVisit\\href{https://example.com}{oursite}\n\n\\end{document}",
  },
  {
    input: "<table>\n<tr>\n<th>Header 1</th>\n<th>Header 2</th>\n</tr>\n<tr>\n<td>Cell 1</td>\n<td>Cell 2</td>\n</tr>\n</table>",
    body: "\\begin{tabular}{l}\n\\toprule\n\\textbf{Header1} \\\\\n\\midrule\n\\bottomrule\n\\end{tabular}\n\nCell 1\nCell 2",
    full: "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{ulem}\n\\usepackage{hyperref}\n\\usepackage{listings}\n\\usepackage{booktabs}\n\\usepackage{array}\n\\usepackage{graphicx}\n\\begin{document}\n\n\\begin{tabular}{l}\n\\toprule\n\\textbf{Header1} \\\\\n\\midrule\n\\bottomrule\n\\end{tabular}\n\nCell 1\nCell 2\n\n\\end{document}",
  },
];

describe("htmlToLatex parity with the Go implementation", () => {
  it.each(goldenCases.map(c => [c.input, c] as const))("%j", (_input, c) => {
    expect(htmlToLatexBodyOnly(c.input)).toBe(c.body);
    expect(htmlToLatex(c.input)).toBe(c.full);
  });
});
