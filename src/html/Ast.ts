import { Attributes, TokenType } from "./Token";
import { trimSpace } from "./strings";

// Base interface for all HTML AST nodes
export interface Node {
    tokenLiteral(): string;
    toString(): string;
    renderLaTeX(): string;
}

// '' mirrors Go's zero-value TokenType (e.g. a bare HTMLNode or an out-of-range header level)
export type NodeType = TokenType | '';

export interface HTMLNodeInit {
    type?: NodeType;
    tagName?: string;
    content?: string;
    attributes?: Attributes;
    children?: Node[];
}

// Base class for all HTML nodes
export class HTMLNode implements Node {
    public type: NodeType;
    public tagName: string;
    public content: string;
    public attributes: Attributes;
    public children: Node[];

    constructor(init: HTMLNodeInit = {}) {
        this.type = init.type ?? '';
        this.tagName = init.tagName ?? '';
        this.content = init.content ?? '';
        this.attributes = init.attributes ?? {};
        this.children = init.children ?? [];
    }

    tokenLiteral(): string {
        return this.content;
    }

    toString(): string {
        return this.content;
    }

    renderLaTeX(): string {
        switch (this.type) {
            case TokenType.H1:
                return "\\section{" + this.renderChildrenLaTeX() + "}";
            case TokenType.H2:
                return "\\subsection{" + this.renderChildrenLaTeX() + "}";
            case TokenType.H3:
                return "\\subsubsection{" + this.renderChildrenLaTeX() + "}";
            case TokenType.H4:
                return "\\paragraph{" + this.renderChildrenLaTeX() + "}";
            case TokenType.H5:
            case TokenType.H6:
                return "\\subparagraph{" + this.renderChildrenLaTeX() + "}";
            case TokenType.P:
                return "\n" + this.renderChildrenLaTeX() + "\n";
            case TokenType.B:
            case TokenType.STRONG:
                return "\\textbf{" + this.renderChildrenLaTeX() + "}";
            case TokenType.I:
            case TokenType.EM:
                return "\\textit{" + this.renderChildrenLaTeX() + "}";
            case TokenType.U:
                return "\\underline{" + this.renderChildrenLaTeX() + "}";
            case TokenType.S:
                return "\\sout{" + this.renderChildrenLaTeX() + "}";
            case TokenType.SUP:
                return "\\textsuperscript{" + this.renderChildrenLaTeX() + "}";
            case TokenType.SUB:
                return "\\textsubscript{" + this.renderChildrenLaTeX() + "}";
            default:
                return this.content;
        }
    }

    protected renderChildrenLaTeX(): string {
        return this.children.map(child => child.renderLaTeX()).join("");
    }
}

// Root HTML document
export class DocumentNode extends HTMLNode {
    constructor(children: Node[] = []) {
        super({ type: TokenType.DOCUMENT, tagName: "document", children });
    }

    renderLaTeX(): string {
        let result = "";
        result += "\\documentclass{article}\n";
        result += "\\usepackage[utf8]{inputenc}\n";
        result += "\\usepackage{ulem}\n";     // for strikethrough
        result += "\\usepackage{hyperref}\n"; // for links
        result += "\\usepackage{listings}\n"; // for code blocks
        result += "\\usepackage{booktabs}\n"; // for tables
        result += "\\usepackage{array}\n";    // for tables
        result += "\\begin{document}\n\n";

        for (const child of this.children) {
            result += child.renderLaTeX();
            result += "\n";
        }

        result += "\\end{document}";
        return result;
    }
}

const headerTypes: { [level: number]: TokenType } = {
    1: TokenType.H1,
    2: TokenType.H2,
    3: TokenType.H3,
    4: TokenType.H4,
    5: TokenType.H5,
    6: TokenType.H6,
};

// H1-H6 tags
export class HeaderNode extends HTMLNode {
    public level: number;

    constructor(level: number, content: string = "", attributes: Attributes = {}) {
        super({
            type: headerTypes[level] ?? '',
            tagName: "h" + String.fromCharCode(48 + level),
            content,
            attributes,
        });
        this.level = level;
    }

    renderLaTeX(): string {
        switch (this.level) {
            case 1:
                return "\\section{" + this.renderChildrenLaTeX() + "}";
            case 2:
                return "\\subsection{" + this.renderChildrenLaTeX() + "}";
            case 3:
                return "\\subsubsection{" + this.renderChildrenLaTeX() + "}";
            case 4:
                return "\\paragraph{" + this.renderChildrenLaTeX() + "}";
            case 5:
            case 6:
                return "\\subparagraph{" + this.renderChildrenLaTeX() + "}";
            default:
                return this.renderChildrenLaTeX();
        }
    }
}

// P tags
export class ParagraphNode extends HTMLNode {
    constructor(content: string = "", attributes: Attributes = {}) {
        super({ type: TokenType.P, tagName: "p", content, attributes });
    }

    renderLaTeX(): string {
        const content = this.renderChildrenLaTeX();
        if (trimSpace(content) === "") {
            return "";
        }
        return "\n" + content + "\n";
    }
}

// Plain text content
export class TextNode extends HTMLNode {
    public text: string;

    constructor(text: string) {
        super({ type: TokenType.TEXT, tagName: "text", content: text });
        this.text = text;
    }

    renderLaTeX(): string {
        // Escape special LaTeX characters.
        // Order matters: backslash first to avoid double-escaping.
        return this.text
            .split("\\").join("\\textbackslash ")
            .split("{").join("\\{")
            .split("}").join("\\}")
            .split("$").join("\\$")
            .split("&").join("\\&")
            .split("%").join("\\%")
            .split("#").join("\\#")
            .split("^").join("\\textasciicircum ")
            .split("_").join("\\_")
            .split("~").join("\\textasciitilde ");
    }
}

function formattingTokenType(formatType: string): TokenType {
    switch (formatType.toLowerCase()) {
        case "b":
        case "strong":
            return TokenType.STRONG;
        case "i":
        case "em":
            return TokenType.EM;
        case "u":
            return TokenType.U;
        case "s":
            return TokenType.S;
        case "sup":
            return TokenType.SUP;
        case "sub":
            return TokenType.SUB;
        default:
            return TokenType.SPAN; // default fallback
    }
}

// Text formatting tags (b/strong, i/em, u, s, sup, sub)
export class FormattingNode extends HTMLNode {
    public formatType: string;

    constructor(formatType: string, content: string = "", attributes: Attributes = {}) {
        super({ type: formattingTokenType(formatType), tagName: formatType, content, attributes });
        this.formatType = formatType;
    }

    renderLaTeX(): string {
        const content = this.renderChildrenLaTeX();
        switch (this.formatType.toLowerCase()) {
            case "b":
            case "strong":
                return "\\textbf{" + content + "}";
            case "i":
            case "em":
                return "\\textit{" + content + "}";
            case "u":
                return "\\underline{" + content + "}";
            case "s":
                return "\\sout{" + content + "}";
            case "sup":
                return "\\textsuperscript{" + content + "}";
            case "sub":
                return "\\textsubscript{" + content + "}";
            default:
                return content;
        }
    }
}

// UL and OL tags
export class ListNode extends HTMLNode {
    public ordered: boolean;
    public items: ListItemNode[] = [];

    constructor(ordered: boolean, attributes: Attributes = {}) {
        super({
            type: ordered ? TokenType.OL : TokenType.UL,
            tagName: ordered ? "ol" : "ul",
            attributes,
        });
        this.ordered = ordered;
    }

    renderLaTeX(): string {
        const env = this.ordered ? "enumerate" : "itemize";
        let result = "\\begin{" + env + "}\n";
        for (const child of this.children) {
            result += child.renderLaTeX();
        }
        result += "\\end{" + env + "}\n";
        return result;
    }
}

// LI tags
export class ListItemNode extends HTMLNode {
    constructor(content: string = "", attributes: Attributes = {}) {
        super({ type: TokenType.LI, tagName: "li", content, attributes });
    }

    renderLaTeX(): string {
        return "\\item " + this.renderChildrenLaTeX() + "\n";
    }
}

// A tags
export class LinkNode extends HTMLNode {
    public url: string;
    public text: string;

    constructor(url: string, text: string = "", attributes: Attributes = {}) {
        super({ type: TokenType.A, tagName: "a", content: text, attributes });
        this.url = url;
        this.text = text;
    }

    renderLaTeX(): string {
        let text = this.renderChildrenLaTeX();
        if (text === "") {
            text = this.text;
        }
        return "\\href{" + this.url + "}{" + text + "}";
    }
}

// CODE tags
export class CodeNode extends HTMLNode {
    public language: string;

    constructor(content: string = "", language: string = "", attributes: Attributes = {}) {
        super({ type: TokenType.CODE, tagName: "code", content, attributes });
        this.language = language;
    }

    renderLaTeX(): string {
        return "\\texttt{" + this.renderChildrenLaTeX() + "}";
    }
}

// PRE tags (code blocks)
export class PreNode extends HTMLNode {
    public language: string;

    constructor(content: string = "", language: string = "", attributes: Attributes = {}) {
        super({ type: TokenType.PRE, tagName: "pre", content, attributes });
        this.language = language;
    }

    renderLaTeX(): string {
        let result = "\\begin{lstlisting}";
        if (this.language !== "") {
            result += "[language=" + this.language + "]";
        }
        result += "\n";
        result += this.renderChildrenLaTeX();
        result += "\n\\end{lstlisting}\n";
        return result;
    }
}

// BLOCKQUOTE tags
export class BlockquoteNode extends HTMLNode {
    constructor(content: string = "", attributes: Attributes = {}) {
        super({ type: TokenType.BLOCKQUOTE, tagName: "blockquote", content, attributes });
    }

    renderLaTeX(): string {
        return "\\begin{quote}\n" + this.renderChildrenLaTeX() + "\n\\end{quote}\n";
    }
}

// TABLE tags
export class TableNode extends HTMLNode {
    public rows: TableRowNode[] = [];

    constructor(attributes: Attributes = {}) {
        super({ type: TokenType.TABLE, tagName: "table", attributes });
    }

    renderLaTeX(): string {
        if (this.rows.length === 0) {
            return "";
        }

        // Count columns from first row
        const colCount = this.rows[0].cells.length;

        let result = "\\begin{tabular}{" + "l".repeat(colCount) + "}\n";
        result += "\\toprule\n";

        this.rows.forEach((row, i) => {
            result += row.renderLaTeX();
            if (i === 0) {
                result += "\\midrule\n";
            }
        });

        result += "\\bottomrule\n";
        result += "\\end{tabular}\n";
        return result;
    }
}

// TR tags
export class TableRowNode extends HTMLNode {
    public cells: TableCellNode[] = [];

    constructor(attributes: Attributes = {}) {
        super({ type: TokenType.TR, tagName: "tr", attributes });
    }

    renderLaTeX(): string {
        return this.cells.map(cell => cell.renderLaTeX()).join(" & ") + " \\\\\n";
    }
}

// TD and TH tags
export class TableCellNode extends HTMLNode {
    public isHeader: boolean;

    constructor(content: string = "", isHeader: boolean = false, attributes: Attributes = {}) {
        super({
            type: isHeader ? TokenType.TH : TokenType.TD,
            tagName: isHeader ? "th" : "td",
            content,
            attributes,
        });
        this.isHeader = isHeader;
    }

    renderLaTeX(): string {
        const content = this.renderChildrenLaTeX();
        if (this.isHeader) {
            return "\\textbf{" + content + "}";
        }
        return content;
    }
}

// BR tags
export class BreakNode extends HTMLNode {
    constructor() {
        super({ type: TokenType.BR, tagName: "br" });
    }

    renderLaTeX(): string {
        return "\\\\\n";
    }
}

// HR tags
export class HorizontalRuleNode extends HTMLNode {
    constructor(attributes: Attributes = {}) {
        super({ type: TokenType.HR, tagName: "hr", attributes });
    }

    renderLaTeX(): string {
        return "\\hrule\n";
    }
}
