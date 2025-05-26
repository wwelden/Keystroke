"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Renderer = void 0;
const Token_1 = require("./Token");
class Renderer {
    render(node) {
        switch (node.type) {
            case Token_1.TokenType.HEADER1:
                return `<h1>${this.renderChildren(node)}</h1>\n`;
            case Token_1.TokenType.PARAGRAPH:
                return `${node.value || ""}`;
            case Token_1.TokenType.UNORDERED_LIST:
                return `<ul>${this.renderChildren(node)}</ul>\n`;
            case Token_1.TokenType.LIST_ITEM:
                return `<li>${this.renderChildren(node)}</li>\n`;
            case Token_1.TokenType.CHECKLIST:
                return `<li><input type="checkbox">${this.renderChildren(node)}</li>\n`;
            case Token_1.TokenType.CHECKLIST_CHECKED:
                return `<li><input type="checkbox" checked>${this.renderChildren(node)}</li>\n`;
            case Token_1.TokenType.BLOCKQUOTE:
                return `<blockquote>${this.renderChildren(node)}</blockquote>\n`;
            case Token_1.TokenType.HORIZONTAL_RULE:
                return `<hr>\n`;
            case Token_1.TokenType.TEXT:
                return node.value || "";
            case Token_1.TokenType.EOF:
                return "";
            case Token_1.TokenType.ILLEGAL:
                return "";
            case Token_1.TokenType.INLINE_CODE:
                return `<code>${this.renderChildren(node)}</code>\n`;
            case Token_1.TokenType.CODE_BLOCK:
                return `<pre><code>${this.renderChildren(node)}</code></pre>\n`;
            case Token_1.TokenType.LEFT_BRACKET:
                const linkNode = node;
                return `<a href="${linkNode.url}">${linkNode.text}</a>\n`;
            case Token_1.TokenType.LEFT_PARENTHESIS:
                return `(${this.renderChildren(node)})`;
            case Token_1.TokenType.DOCUMENT:
                return node.children.map(child => this.render(child)).join("");
            case Token_1.TokenType.ITALIC:
                return `<i>${this.renderChildren(node)}</i>\n`;
            case Token_1.TokenType.STRIKETHROUGH:
                return `<s>${this.renderChildren(node)}</s>\n`;
            case Token_1.TokenType.BOLD:
                return `<b>${this.renderChildren(node)}</b>\n`;
            case Token_1.TokenType.HEADER2:
                return `<h2>${this.renderChildren(node)}</h2>\n`;
            case Token_1.TokenType.HEADER3:
                return `<h3>${this.renderChildren(node)}</h3>\n`;
            case Token_1.TokenType.HEADER4:
                return `<h4>${this.renderChildren(node)}</h4>\n`;
            case Token_1.TokenType.HEADER5:
                return `<h5>${this.renderChildren(node)}</h5>\n`;
            case Token_1.TokenType.HEADER6:
                return `<h6>${this.renderChildren(node)}</h6>\n`;
            case Token_1.TokenType.ORDERED_LIST:
                return `<ol>${this.renderChildren(node)}</ol>\n`;
            case Token_1.TokenType.NEWLINE:
                return "<br>\n";
            case Token_1.TokenType.SPACE:
                return " ";
            case Token_1.TokenType.TAB:
                return "&emsp;";
            case Token_1.TokenType.MATH:
                return `<span class="math">${this.renderChildren(node)}</span>\n`;
            case Token_1.TokenType.SUPERSCRIPT:
                return `<sup>${this.renderChildren(node)}</sup>`;
            case Token_1.TokenType.SUBSCRIPT:
                return `<sub>${this.renderChildren(node)}</sub>`;
            default:
                return `<span>${node.value || ""}</span>\n`;
        }
    }
    renderChildren(node) {
        // Don't join with spaces - let the actual Space nodes handle spacing
        return node.children.map(child => this.render(child)).join("");
    }
}
exports.Renderer = Renderer;
