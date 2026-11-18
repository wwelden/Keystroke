import { MarkdownNode, LinkNode, CodeBlockNode, MathNode, SuperscriptNode, SubscriptNode } from './Ast';
import { TokenType } from './Token';

function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export class Renderer {
    render(node: MarkdownNode): string {
        switch (node.type) {
            case TokenType.HEADER1:
                return `<h1>${this.renderChildren(node).trim()}</h1>\n`;
            case TokenType.PARAGRAPH:
                return `${node.value || ""}`;
            case TokenType.UNORDERED_LIST:
                return `<ul>${this.renderChildren(node)}</ul>\n`;
            case TokenType.LIST_ITEM:
                return `<li>${this.renderChildren(node)}</li>\n`;
            case TokenType.CHECKLIST:
                return `<li><label><input type="checkbox">${this.renderChildren(node)}</label></li>\n`;
            case TokenType.CHECKLIST_CHECKED:
                return `<li><label><input type="checkbox" checked>${this.renderChildren(node)}</label></li>\n`;
            case TokenType.BLOCKQUOTE:
                return `<blockquote>${this.renderChildren(node)}</blockquote>\n`;
            case TokenType.HORIZONTAL_RULE:
                return `<hr>\n`;
            case TokenType.TEXT:
                return node.value || "";
            case TokenType.EOF:
                return "";
            case TokenType.ILLEGAL:
                return "";
            case TokenType.INLINE_CODE:
                return `<code>${this.renderChildren(node)}</code>`;
            case TokenType.CODE_BLOCK: {
                // Code is shown verbatim: escaped, never parsed as markdown.
                const block = node as CodeBlockNode;
                const cls = block.language ? ` class="language-${escapeHtml(block.language)}"` : '';
                return `<pre><code${cls}>${escapeHtml(block.code)}</code></pre>\n`;
            }
            case TokenType.LINK:
                const linkNode = node as LinkNode;
                return `<a href="${linkNode.url}">${linkNode.text}</a>`;
            case TokenType.LEFT_BRACKET:
                return `<span>[</span>`;
            case TokenType.LEFT_PARENTHESIS:
                return `(${this.renderChildren(node)})`;
            case TokenType.DOCUMENT:
                return node.children.map(child => this.render(child)).join("");
            case TokenType.ITALIC:
                return `<i>${this.renderChildren(node)}</i>`;
            case TokenType.STRIKETHROUGH:
                return `<s>${this.renderChildren(node)}</s>`;
            case TokenType.BOLD:
                return `<b>${this.renderChildren(node)}</b>`;
            case TokenType.HEADER2:
                return `<h2>${this.renderChildren(node).trim()}</h2>\n`;
            case TokenType.HEADER3:
                return `<h3>${this.renderChildren(node).trim()}</h3>\n`;
            case TokenType.HEADER4:
                return `<h4>${this.renderChildren(node).trim()}</h4>\n`;
            case TokenType.HEADER5:
                return `<h5>${this.renderChildren(node).trim()}</h5>\n`;
            case TokenType.HEADER6:
                return `<h6>${this.renderChildren(node).trim()}</h6>\n`;
            case TokenType.ORDERED_LIST: {
                // The list's value is its first marker, e.g. `3.`.
                const start = parseInt(node.value, 10);
                const attr = start === 1 || isNaN(start) ? '' : ` start="${start}"`;
                return `<ol${attr}>${this.renderChildren(node)}</ol>\n`;
            }
            case TokenType.NEWLINE:
                return "<br>\n";
            case TokenType.SPACE:
                return " ";
            case TokenType.TAB:
                return "&emsp;";
            case TokenType.MATH:
                if (node instanceof MathNode && node.text && node.text.trim()) {
                    return `<span class="math">${node.text}</span>`;
                }
                return `<span class="math">${this.renderChildren(node).trim()}</span>`;
            case TokenType.SUPERSCRIPT: {
                const text = node instanceof SuperscriptNode ? node.text : '';
                return `<sup>${text || this.renderChildren(node)}</sup>`;
            }
            case TokenType.SUBSCRIPT: {
                const text = node instanceof SubscriptNode ? node.text : '';
                return `<sub>${text || this.renderChildren(node)}</sub>`;
            }
            default:
                return `<span>${node.value || ""}</span>\n`;
        }
    }

    private renderChildren(node: MarkdownNode): string {
        // Don't join with spaces - let the actual Space nodes handle spacing
        return node.children.map(child => this.render(child)).join("");
    }
}
