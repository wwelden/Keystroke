import { MarkdownNode, LinkNode } from './Ast';
import { TokenType } from './Token';

export class Renderer {
    render(node: MarkdownNode): string {
        switch (node.type) {
            case TokenType.HEADER1:
                return `<h1>${this.renderChildren(node)}</h1>`;
            case TokenType.PARAGRAPH:
                return `<p>${this.renderChildren(node)}</p>`;
            case TokenType.UNORDERED_LIST:
                return `<ul>${this.renderChildren(node)}</ul>`;
            case TokenType.LIST_ITEM:
                return `<li>${this.renderChildren(node)}</li>`;
            case TokenType.CHECKLIST:
                return `<li><input type="checkbox">${this.renderChildren(node)}</li>`;
            case TokenType.CHECKLIST_CHECKED:
                return `<li><input type="checkbox" checked>${this.renderChildren(node)}</li>`;
            case TokenType.BLOCKQUOTE:
                return `<blockquote>${this.renderChildren(node)}</blockquote>`;
            case TokenType.HORIZONTAL_RULE:
                return `<hr>`;
            case TokenType.TEXT:
                return node.value || "";
            case TokenType.EOF:
                return "";
            case TokenType.ILLEGAL:
                return "";
            case TokenType.INLINE_CODE:
                return `<code>${this.renderChildren(node)}</code>`;
            case TokenType.CODE_BLOCK:
                return `<pre><code>${this.renderChildren(node)}</code></pre>`;
            case TokenType.LINK_TEXT_START:
                const linkNode = node as LinkNode;
                return `<a href="${linkNode.url}">${linkNode.text}</a>`;
            case TokenType.DOCUMENT:
                return node.children.map(child => this.render(child)).join("");
            case TokenType.ITALIC:
                return `<i>${this.renderChildren(node)}</i>`;
            case TokenType.STRIKETHROUGH:
                return `<s>${this.renderChildren(node)}</s>`;
            case TokenType.BOLD:
                return `<b>${this.renderChildren(node)}</b>`;
            case TokenType.HEADER2:
                return `<h2>${this.renderChildren(node)}</h2>`;
            case TokenType.HEADER3:
                return `<h3>${this.renderChildren(node)}</h3>`;
            case TokenType.HEADER4:
                return `<h4>${this.renderChildren(node)}</h4>`;
            case TokenType.HEADER5:
                return `<h5>${this.renderChildren(node)}</h5>`;
            case TokenType.HEADER6:
                return `<h6>${this.renderChildren(node)}</h6>`;
            case TokenType.ORDERED_LIST:
                return `<ol>${this.renderChildren(node)}</ol>`;
            case TokenType.NEWLINE:
                return "<br>";
            case TokenType.SPACE:
                return " ";
            case TokenType.TAB:
                return "&emsp;";
            default:
                return `<span>${node.value || ""}</span>`;
        }
    }




    private renderChildren(node: MarkdownNode): string {
        return node.children.map(child => this.render(child)).join(" "); // this is what is giving space in the header. it should be space tokens
    }
}