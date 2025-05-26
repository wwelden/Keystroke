"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentNode = exports.EOFNode = exports.IllegalNode = exports.CodeBlockNode = exports.InlineCodeNode = exports.CodeRelatedNode = exports.StrikethroughNode = exports.ItalicNode = exports.BoldNode = exports.NewlineNode = exports.SpaceNode = exports.BlankNode = exports.TabNode = exports.WhitespaceNode = exports.TextFormattingNode = exports.ParenthesisNode = exports.SubscriptNode = exports.SuperscriptNode = exports.MathNode = exports.LinkNode = exports.HorizontalRuleNode = exports.TextNode = exports.BlockquoteNode = exports.ChecklistCheckedNode = exports.ChecklistNode = exports.ListItemNode = exports.ListRelatedNode = exports.ListNode = exports.ParagraphNode = exports.Header6Node = exports.Header5Node = exports.Header4Node = exports.Header3Node = exports.Header2Node = exports.Header1Node = exports.HeaderNode = exports.MarkdownNode = void 0;
const Token_1 = require("./Token");
class MarkdownNode {
    constructor(type, value) {
        this.type = type;
        this.value = value;
        this.children = [];
    }
    render() {
        switch (this.type) {
            case Token_1.TokenType.HEADER1:
                return `<h1>${this.children.map(child => child.render()).join("")}</h1>`;
            case Token_1.TokenType.BOLD:
                return `<strong>${this.children.map(child => child.render()).join("")}</strong>`;
            case Token_1.TokenType.PARAGRAPH:
                return `<p>${this.children.map(child => child.render()).join("")}</p>`;
            // Add cases for other node types
            default:
                return this.value;
        }
    }
}
exports.MarkdownNode = MarkdownNode;
class HeaderNode extends MarkdownNode {
    constructor(type, value, level, text = '', children = []) {
        super(type, value);
        this.type = type;
        this.value = value;
        this.level = level;
        this.text = text;
        this.children = children;
    }
}
exports.HeaderNode = HeaderNode;
class Header1Node extends HeaderNode {
    constructor(token) {
        super(Token_1.TokenType.HEADER1, token.literal, 1);
    }
}
exports.Header1Node = Header1Node;
class Header2Node extends HeaderNode {
    constructor(token) {
        super(Token_1.TokenType.HEADER2, token.literal, 2);
    }
}
exports.Header2Node = Header2Node;
class Header3Node extends HeaderNode {
    constructor(token) {
        super(Token_1.TokenType.HEADER3, token.literal, 3);
    }
}
exports.Header3Node = Header3Node;
class Header4Node extends HeaderNode {
    constructor(token) {
        super(Token_1.TokenType.HEADER4, token.literal, 4);
    }
}
exports.Header4Node = Header4Node;
class Header5Node extends HeaderNode {
    constructor(token) {
        super(Token_1.TokenType.HEADER5, token.literal, 5);
    }
}
exports.Header5Node = Header5Node;
class Header6Node extends HeaderNode {
    constructor(token) {
        super(Token_1.TokenType.HEADER6, token.literal, 6);
    }
}
exports.Header6Node = Header6Node;
class ParagraphNode extends MarkdownNode {
    constructor(token, text) {
        super(Token_1.TokenType.TEXT, token.literal);
        this.text = text;
    }
}
exports.ParagraphNode = ParagraphNode;
class ListNode extends MarkdownNode {
    constructor(token, ordered, items = []) {
        super(token.type, token.literal);
        this.ordered = ordered;
        this.items = items;
        this.children = items;
    }
}
exports.ListNode = ListNode;
class ListRelatedNode extends MarkdownNode {
    constructor(type, value, text) {
        super(type, value);
        this.type = type;
        this.value = value;
        this.text = text;
    }
}
exports.ListRelatedNode = ListRelatedNode;
class ListItemNode extends ListRelatedNode {
    constructor(token, text) {
        super(Token_1.TokenType.LIST_ITEM, token.literal, text);
        this.children.push(new TextNode(token, text));
    }
}
exports.ListItemNode = ListItemNode;
class ChecklistNode extends ListRelatedNode {
    constructor(token, text) {
        super(Token_1.TokenType.CHECKLIST, token.literal, text);
        this.children.push(new TextNode(token, text));
    }
}
exports.ChecklistNode = ChecklistNode;
class ChecklistCheckedNode extends ListRelatedNode {
    constructor(token, text) {
        super(Token_1.TokenType.CHECKLIST_CHECKED, token.literal, text);
        this.children.push(new TextNode(token, text));
    }
}
exports.ChecklistCheckedNode = ChecklistCheckedNode;
class BlockquoteNode extends MarkdownNode {
    constructor(token, text) {
        super(Token_1.TokenType.BLOCKQUOTE, token.literal);
        this.text = text;
        this.children = [new TextNode(token, text)];
    }
}
exports.BlockquoteNode = BlockquoteNode;
class TextNode extends MarkdownNode {
    constructor(token, text) {
        super(Token_1.TokenType.TEXT, token.literal);
        this.value = text;
    }
}
exports.TextNode = TextNode;
class HorizontalRuleNode extends MarkdownNode {
    constructor(token) {
        super(Token_1.TokenType.HORIZONTAL_RULE, token.literal);
    }
}
exports.HorizontalRuleNode = HorizontalRuleNode;
class LinkNode extends MarkdownNode {
    constructor(token, text, url) {
        super(Token_1.TokenType.LINK, token.literal);
        this.text = text;
        this.url = url;
    }
}
exports.LinkNode = LinkNode;
class MathNode extends MarkdownNode {
    constructor(token, text) {
        super(Token_1.TokenType.MATH, token.literal);
        this.text = text;
        // this.children.push(new TextNode(token, text));
    }
}
exports.MathNode = MathNode;
class SuperscriptNode extends MarkdownNode {
    constructor(token, text) {
        super(Token_1.TokenType.SUPERSCRIPT, token.literal);
        this.text = text;
    }
}
exports.SuperscriptNode = SuperscriptNode;
class SubscriptNode extends MarkdownNode {
    constructor(token, text) {
        super(Token_1.TokenType.SUBSCRIPT, token.literal);
        this.text = text;
    }
}
exports.SubscriptNode = SubscriptNode;
class ParenthesisNode extends MarkdownNode {
    constructor(token, text) {
        super(Token_1.TokenType.LEFT_PARENTHESIS, token.literal);
        this.text = text;
        this.children.push(new TextNode(token, text));
    }
}
exports.ParenthesisNode = ParenthesisNode;
class TextFormattingNode extends MarkdownNode {
    constructor(type, value, text) {
        super(type, value);
        this.type = type;
        this.value = value;
        this.text = text;
    }
}
exports.TextFormattingNode = TextFormattingNode;
class WhitespaceNode extends MarkdownNode {
    constructor(type, value, text) {
        super(type, value);
        this.type = type;
        this.value = value;
        this.text = text;
    }
}
exports.WhitespaceNode = WhitespaceNode;
class TabNode extends WhitespaceNode {
    constructor(token) {
        super(Token_1.TokenType.TAB, token.literal, '');
    }
}
exports.TabNode = TabNode;
class BlankNode extends ParagraphNode {
    constructor(token) {
        super(token, '');
    }
}
exports.BlankNode = BlankNode;
class SpaceNode extends WhitespaceNode {
    constructor(token) {
        super(Token_1.TokenType.SPACE, token.literal, '');
    }
}
exports.SpaceNode = SpaceNode;
class NewlineNode extends WhitespaceNode {
    constructor(token) {
        super(Token_1.TokenType.NEWLINE, token.literal, '');
    }
}
exports.NewlineNode = NewlineNode;
class BoldNode extends TextFormattingNode {
    constructor(token, text) {
        super(Token_1.TokenType.BOLD, token.literal, text);
    }
}
exports.BoldNode = BoldNode;
class ItalicNode extends TextFormattingNode {
    constructor(token, text) {
        super(Token_1.TokenType.ITALIC, token.literal, text);
    }
}
exports.ItalicNode = ItalicNode;
class StrikethroughNode extends TextFormattingNode {
    constructor(token, text) {
        super(Token_1.TokenType.STRIKETHROUGH, token.literal, text);
    }
}
exports.StrikethroughNode = StrikethroughNode;
class CodeRelatedNode extends MarkdownNode {
    constructor(type, value, code) {
        super(type, value);
        this.type = type;
        this.value = value;
        this.code = code;
    }
}
exports.CodeRelatedNode = CodeRelatedNode;
class InlineCodeNode extends CodeRelatedNode {
    constructor(token, code) {
        super(Token_1.TokenType.INLINE_CODE, token.literal, code);
    }
}
exports.InlineCodeNode = InlineCodeNode;
class CodeBlockNode extends CodeRelatedNode {
    constructor(token, code, language) {
        super(Token_1.TokenType.CODE_BLOCK, token.literal, code);
        this.language = language;
    }
}
exports.CodeBlockNode = CodeBlockNode;
class IllegalNode extends MarkdownNode {
    constructor(token) {
        super(Token_1.TokenType.ILLEGAL, token.literal);
    }
}
exports.IllegalNode = IllegalNode;
class EOFNode extends MarkdownNode {
    constructor(token) {
        super(Token_1.TokenType.EOF, token.literal);
    }
}
exports.EOFNode = EOFNode;
class DocumentNode extends MarkdownNode {
    constructor(children = []) {
        super(Token_1.TokenType.DOCUMENT, "document");
        this.children = children;
    }
    render() {
        return this.children.map(child => child.render()).join("\n");
    }
}
exports.DocumentNode = DocumentNode;
