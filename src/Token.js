"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keywords = exports.Token = exports.TokenType = void 0;
// Define all possible token types
var TokenType;
(function (TokenType) {
    // Headers
    TokenType["HEADER1"] = "HEADER1";
    TokenType["HEADER2"] = "HEADER2";
    TokenType["HEADER3"] = "HEADER3";
    TokenType["HEADER4"] = "HEADER4";
    TokenType["HEADER5"] = "HEADER5";
    TokenType["HEADER6"] = "HEADER6";
    // Lists
    TokenType["UNORDERED_LIST"] = "UNORDERED_LIST";
    TokenType["ORDERED_LIST"] = "ORDERED_LIST";
    TokenType["LIST_ITEM"] = "LIST_ITEM";
    TokenType["CHECKLIST"] = "CHECKLIST";
    TokenType["CHECKLIST_CHECKED"] = "CHECKLIST_CHECKED";
    // Text formatting
    TokenType["BOLD"] = "BOLD";
    TokenType["ITALIC"] = "ITALIC";
    TokenType["STRIKETHROUGH"] = "STRIKETHROUGH";
    TokenType["UNDERLINE"] = "UNDERLINE";
    TokenType["SUPERSCRIPT"] = "SUPERSCRIPT";
    TokenType["SUBSCRIPT"] = "SUBSCRIPT";
    // HIGHLIGHT = 'HIGHLIGHT',
    // COLOR = 'COLOR',
    TokenType["MATH"] = "MATH";
    // Code
    TokenType["INLINE_CODE"] = "INLINE_CODE";
    TokenType["CODE_BLOCK"] = "CODE_BLOCK";
    // Links and images
    TokenType["LINK"] = "LINK";
    TokenType["LINK_TEXT_START"] = "LINK_TEXT_START";
    TokenType["LINK_TEXT_END"] = "LINK_TEXT_END";
    TokenType["LINK_URL_START"] = "LINK_URL_START";
    TokenType["LINK_URL_END"] = "LINK_URL_END";
    // IMAGE = 'IMAGE',
    // Other
    TokenType["BLOCKQUOTE"] = "BLOCKQUOTE";
    TokenType["HORIZONTAL_RULE"] = "HORIZONTAL_RULE";
    TokenType["TEXT"] = "TEXT";
    TokenType["EOF"] = "EOF";
    TokenType["ILLEGAL"] = "ILLEGAL";
    TokenType["DOCUMENT"] = "DOCUMENT";
    TokenType["PARAGRAPH"] = "PARAGRAPH";
    //whitespace
    TokenType["SPACE"] = "SPACE";
    TokenType["TAB"] = "TAB";
    TokenType["NEWLINE"] = "NEWLINE";
    // Parentheses
    TokenType["LEFT_PARENTHESIS"] = "LEFT_PARENTHESIS";
    TokenType["RIGHT_PARENTHESIS"] = "RIGHT_PARENTHESIS";
    TokenType["LEFT_BRACKET"] = "LEFT_BRACKET";
    TokenType["RIGHT_BRACKET"] = "RIGHT_BRACKET";
    TokenType["LEFT_BRACE"] = "LEFT_BRACE";
    TokenType["RIGHT_BRACE"] = "RIGHT_BRACE";
})(TokenType || (exports.TokenType = TokenType = {}));
class Token {
    constructor(type, literal) {
        this.type = type;
        this.literal = literal;
    }
}
exports.Token = Token;
// Map of markdown symbols to their corresponding token types
exports.keywords = {
    '#': TokenType.HEADER1,
    '##': TokenType.HEADER2,
    '###': TokenType.HEADER3,
    '####': TokenType.HEADER4,
    '#####': TokenType.HEADER5,
    '######': TokenType.HEADER6,
    '*': TokenType.UNORDERED_LIST,
    '1.': TokenType.ORDERED_LIST,
    '-': TokenType.LIST_ITEM,
    '- [ ]': TokenType.CHECKLIST,
    '- [x]': TokenType.CHECKLIST_CHECKED,
    '**': TokenType.BOLD,
    '_': TokenType.ITALIC,
    '~~': TokenType.STRIKETHROUGH,
    '`': TokenType.INLINE_CODE,
    '```': TokenType.CODE_BLOCK,
    // '[': TokenType.LINK_TEXT_START,
    // ']': TokenType.LINK_TEXT_END,
    // '(': TokenType.LINK_URL_START,
    // ')': TokenType.LINK_URL_END,
    // '![': TokenType.IMAGE,
    '>': TokenType.BLOCKQUOTE,
    '---': TokenType.HORIZONTAL_RULE,
    '$': TokenType.MATH,
    '^': TokenType.SUPERSCRIPT,
    '~': TokenType.SUBSCRIPT,
    '(': TokenType.LEFT_PARENTHESIS,
    ')': TokenType.RIGHT_PARENTHESIS,
    '[': TokenType.LEFT_BRACKET,
    ']': TokenType.RIGHT_BRACKET,
    '{': TokenType.LEFT_BRACE,
    '}': TokenType.RIGHT_BRACE,
};
