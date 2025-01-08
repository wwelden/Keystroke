// import { Parser } from '../src/Parser';
// import { Lexer } from '../src/Lexer';
// import { TokenType } from '../src/Token';

// describe('Parser', () => {
//     // Helper function to create parser with input
//     const createParser = (input: string): Parser => {
//         const lexer = new Lexer(input);
//         return new Parser(lexer);
//     };

//     describe('constructor', () => {
//         it('should initialize with empty input', () => {
//             const parser = createParser('');
//             expect(parser).toBeDefined();
//         });
//     });

//     describe('parseHeader', () => {
//         it('should parse header1', () => {
//             const parser = createParser('# Header');
//             const header = parser['parseHeader']();
//             expect(header.type).toBe(TokenType.HEADER1);
//             expect(header.level).toBe(1);
//             expect(header.children[0].value).toBe('Header');
//         });

//         it('should parse headers of different levels', () => {
//             const headers = [
//                 { input: '## Header2', type: TokenType.HEADER2, level: 2 },
//                 { input: '### Header3', type: TokenType.HEADER3, level: 3 },
//                 { input: '#### Header4', type: TokenType.HEADER4, level: 4 },
//                 { input: '##### Header5', type: TokenType.HEADER5, level: 5 },
//                 { input: '###### Header6', type: TokenType.HEADER6, level: 6 }
//             ];

//             headers.forEach(({ input, type, level }) => {
//                 const parser = createParser(input);
//                 const header = parser['parseHeader']();
//                 expect(header.type).toBe(type);
//                 expect(header.level).toBe(level);
//                 expect(header.children[0].value).toBe(`Header${level}`);
//             });
//         });
//     });

//     describe('parseList', () => {
//         it('should parse unordered list', () => {
//             const parser = createParser('* Item');
//             const list = parser['parseList']();
//             expect(list.type).toBe(TokenType.UNORDERED_LIST);
//             expect(list.ordered).toBe(false);
//         });
//     });

//     describe('parseText', () => {
//         it('should parse plain text', () => {
//             const parser = createParser('Simple text');
//             const text = parser['parseText']();
//             expect(text.type).toBe(TokenType.TEXT);
//             expect(text.text).toBe('Simple text');
//         });
//     });

//     describe('parseBlockquote', () => {
//         it('should parse blockquote', () => {
//             const parser = createParser('> Quote text');
//             const blockquote = parser['parseBlockquote']();
//             expect(blockquote.type).toBe(TokenType.BLOCKQUOTE);
//             expect(blockquote.text).toBe('Quote text');
//         });
//     });

//     describe('parseHorizontalRule', () => {
//         it('should parse horizontal rule', () => {
//             const parser = createParser('---');
//             const hr = parser['parseHorizontalRule']();
//             expect(hr.type).toBe(TokenType.HORIZONTAL_RULE);
//         });
//     });

//     describe('parseLink', () => {
//         it('should parse link with text and url', () => {
//             const parser = createParser('[Link text](https://example.com)');
//             const link = parser['parseLink']();
//             expect(link.type).toBe(TokenType.LINK_TEXT_START);
//             expect(link.text).toBe('Link text');
//             expect(link.url).toBe('https://example.com');
//         });

//         it('should parse link URL', () => {
//             const parser = createParser('(https://example.com)');
//             const linkUrl = parser['parseLink']();
//             expect(linkUrl.type).toBe(TokenType.LINK_URL_START);
//             expect(linkUrl.url).toBe('https://example.com');
//         });
//     });

//     describe('Text Formatting', () => {
//         it('should parse bold text', () => {
//             const parser = createParser('**bold text**');
//             const bold = parser['parseBold']();
//             expect(bold.type).toBe(TokenType.BOLD);
//             expect(bold.text).toBe('bold text');
//         });

//         it('should parse italic text', () => {
//             const parser = createParser('_italic text_');
//             const italic = parser['parseItalic']();
//             expect(italic.type).toBe(TokenType.ITALIC);
//             expect(italic.text).toBe('italic text');
//         });

//         it('should parse strikethrough text', () => {
//             const parser = createParser('~~strikethrough text~~');
//             const strike = parser['parseStrikethrough']();
//             expect(strike.type).toBe(TokenType.STRIKETHROUGH);
//             expect(strike.text).toBe('strikethrough text');
//         });
//     });

//     describe('Code', () => {
//         it('should parse inline code', () => {
//             const parser = createParser('`code`');
//             const code = parser['parseCode']();
//             expect(code.type).toBe(TokenType.INLINE_CODE);
//             expect(code.code).toBe('code');
//         });

//         it('should parse code block', () => {
//             const parser = createParser('```\ncode block\n```');
//             const codeBlock = parser['parseCodeBlock']();
//             expect(codeBlock.type).toBe(TokenType.CODE_BLOCK);
//             expect(codeBlock.code).toBe('code block');
//         });
//     });

//     describe('Checklists', () => {
//         it('should parse unchecked checkbox', () => {
//             const parser = createParser('- [ ] Todo item');
//             const checkbox = parser['parseCheckbox']();
//             expect(checkbox.type).toBe(TokenType.CHECKLIST);
//             expect(checkbox.text).toBe('Todo item');
//         });

//         it('should parse checked checkbox', () => {
//             const parser = createParser('- [x] Done item');
//             const checkbox = parser['parseCheckboxChecked']();
//             expect(checkbox.type).toBe(TokenType.CHECKLIST_CHECKED);
//             expect(checkbox.text).toBe('Done item');
//         });
//     });

//     describe('Error Handling', () => {
//         it('should handle errors for invalid tokens', () => {
//             const parser = createParser('Invalid token');
//             parser['addError']('Test error');
//             expect(parser['errors']).toContain('Test error');
//         });

//         it('should handle peek errors', () => {
//             const parser = createParser('# Header');
//             parser['peekError'](TokenType.BOLD);
//             expect(parser['errors'].length).toBeGreaterThan(0);
//         });
//     });
// });