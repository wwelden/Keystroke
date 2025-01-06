// Define all possible token types
export enum TokenType {
    // Headers
    HEADER1 = 'HEADER1',
    HEADER2 = 'HEADER2',
    HEADER3 = 'HEADER3',
    HEADER4 = 'HEADER4',
    HEADER5 = 'HEADER5',
    HEADER6 = 'HEADER6',

    // Lists
    UNORDERED_LIST = 'UNORDERED_LIST',
    ORDERED_LIST = 'ORDERED_LIST',
    LIST_ITEM = 'LIST_ITEM',
    CHECKLIST = 'CHECKLIST',
    CHECKLIST_CHECKED = 'CHECKLIST_CHECKED',

    // Text formatting
    BOLD = 'BOLD',
    ITALIC = 'ITALIC',
    STRIKETHROUGH = 'STRIKETHROUGH',

    // Code
    INLINE_CODE = 'INLINE_CODE',
    CODE_BLOCK = 'CODE_BLOCK',
    CODE_BLOCK_END = 'CODE_BLOCK_END',
    CODE_BLOCK_LANGUAGE = 'CODE_BLOCK_LANGUAGE',
    CODE_BLOCK_LANGUAGE_END = 'CODE_BLOCK_LANGUAGE_END',
    CODE = 'CODE',

    // Links and images
    LINK = 'LINK',
    LINK_TEXT = 'LINK_TEXT',
    LINK_URL = 'LINK_URL',
    LINK_URL_END = 'LINK_URL_END',
    // IMAGE = 'IMAGE',

    // Other
    BLOCKQUOTE = 'BLOCKQUOTE',
    HORIZONTAL_RULE = 'HORIZONTAL_RULE',
    TEXT = 'TEXT',           // Regular text
    EOF = 'EOF',            // End of file
    ILLEGAL = 'ILLEGAL'     // Unknown token
}

export class Token {
    constructor(
        public type: TokenType,
        public literal: string
    ) {}
}

// Map of markdown symbols to their corresponding token types
export const keywords: { [key: string]: TokenType } = {
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

    '[': TokenType.LINK,
    ']': TokenType.LINK_TEXT,
    '(': TokenType.LINK_URL,
    ')': TokenType.LINK_URL_END,
    // '![': TokenType.IMAGE,

    '>': TokenType.BLOCKQUOTE,
    '---': TokenType.HORIZONTAL_RULE
};