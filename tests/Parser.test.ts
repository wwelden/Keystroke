import { Lexer } from '../src/Lexer';
import { Parser } from '../src/Parser';
import { TokenType } from '../src/Token';
import {
    DocumentNode,
    Header1Node,
    BoldNode,
    ItalicNode,
    ListNode,
    ChecklistNode,
    ChecklistCheckedNode,
    BlockquoteNode,
    HorizontalRuleNode,
    LinkNode,
    MathNode,
    SuperscriptNode,
    SubscriptNode,
} from '../src/Ast';

describe('Parser', () => {
    function parse(input: string): DocumentNode {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        return parser.parse();
    }

    describe('Headers', () => {
        it('should parse header1', () => {
            const doc = parse('# Hello World');
            expect(doc.children.length).toBeGreaterThan(0);
            expect(doc.children[0]).toBeInstanceOf(Header1Node);
            expect(doc.children[0].type).toBe(TokenType.HEADER1);
        });
    });

    describe('Text Formatting', () => {
        it('should parse bold text', () => {
            const doc = parse('**bold text**');
            expect(doc.children.length).toBeGreaterThan(0);
            expect(doc.children[0]).toBeInstanceOf(BoldNode);
            expect(doc.children[0].type).toBe(TokenType.BOLD);
        });

        it('should parse italic text', () => {
            const doc = parse('_italic text_');
            expect(doc.children.length).toBeGreaterThan(0);
            expect(doc.children[0]).toBeInstanceOf(ItalicNode);
            expect(doc.children[0].type).toBe(TokenType.ITALIC);
        });
    });

    describe('Lists', () => {
        it('should parse unordered list', () => {
            const input = '* Item 1\n* Item 2';
            const doc = parse(input);
            expect(doc.children.length).toBeGreaterThan(0);
            // Check that we have list-related nodes
            const hasListNodes = doc.children.some(child =>
                child.type === TokenType.UNORDERED_LIST ||
                child.type === TokenType.LIST_ITEM
            );
            expect(hasListNodes).toBe(true);
        });

        it('should parse checklist items', () => {
            const input = '- [ ] Todo\n- [x] Done';
            const doc = parse(input);
            expect(doc.children.length).toBeGreaterThan(0);
            // Check that we have checklist-related nodes
            const hasChecklistNodes = doc.children.some(child =>
                child.type === TokenType.CHECKLIST ||
                child.type === TokenType.CHECKLIST_CHECKED
            );
            expect(hasChecklistNodes).toBe(true);
        });
    });

    describe('Links', () => {
        it('should parse links', () => {
            const doc = parse('[Example](https://example.com)');
            expect(doc.children.length).toBeGreaterThan(0);
            // Check that we have link-related nodes
            const hasLinkNodes = doc.children.some(child =>
                child.type === TokenType.LINK ||
                child instanceof LinkNode
            );
            expect(hasLinkNodes).toBe(true);
        });
    });

    describe('Blockquotes', () => {
        it('should parse blockquotes', () => {
            const doc = parse('> This is a quote');
            expect(doc.children.length).toBeGreaterThan(0);
            expect(doc.children[0]).toBeInstanceOf(BlockquoteNode);
            expect(doc.children[0].type).toBe(TokenType.BLOCKQUOTE);
        });
    });

    describe('Horizontal Rules', () => {
        it('should parse horizontal rules', () => {
            const doc = parse('---');
            expect(doc.children.length).toBeGreaterThan(0);
            expect(doc.children[0]).toBeInstanceOf(HorizontalRuleNode);
            expect(doc.children[0].type).toBe(TokenType.HORIZONTAL_RULE);
        });
    });

    describe('Mixed Content', () => {
        it('should parse mixed markdown content', () => {
            const input = `# Header
**Bold text**
> Blockquote
- [ ] Todo item
[Link](https://example.com)`;

            const doc = parse(input);
            expect(doc.children.length).toBeGreaterThan(0);

            // Check that we have various types of nodes
            const nodeTypes = doc.children.map(child => child.type);
            expect(nodeTypes).toContain(TokenType.HEADER1);
            expect(nodeTypes).toContain(TokenType.BOLD);
            expect(nodeTypes).toContain(TokenType.BLOCKQUOTE);
        });
    });

    describe('Math', () => {
        it('should parse math expressions', () => {
            const doc = parse('$1+2=3$');
            expect(doc.children.length).toBeGreaterThan(0);
            // Check that we have math-related nodes
            const hasMathNodes = doc.children.some(child =>
                child.type === TokenType.MATH ||
                child instanceof MathNode
            );
            expect(hasMathNodes).toBe(true);
        });

                it('should parse superscript', () => {
            const doc = parse('$x^2$');
            expect(doc.children.length).toBeGreaterThan(0);
            // Check that we have superscript nodes inside math nodes
            const hasSuperscriptNodes = doc.children.some(child =>
                child instanceof MathNode && child.children.some(grandchild =>
                    grandchild.type === TokenType.SUPERSCRIPT ||
                    grandchild instanceof SuperscriptNode
                )
            );
            expect(hasSuperscriptNodes).toBe(true);
        });

                it('should parse subscript', () => {
            const doc = parse('$x~n$');
            expect(doc.children.length).toBeGreaterThan(0);
            // Check that we have subscript nodes inside math nodes
            const hasSubscriptNodes = doc.children.some(child =>
                child instanceof MathNode && child.children.some(grandchild =>
                    grandchild.type === TokenType.SUBSCRIPT ||
                    grandchild instanceof SubscriptNode
                )
            );
            expect(hasSubscriptNodes).toBe(true);
        });

        it('should parse complex math expressions', () => {
            const doc = parse('$f(x) = x^2 + y~1$');
            expect(doc.children.length).toBeGreaterThan(0);
            // Check that we have math-related nodes
            const hasMathNodes = doc.children.some(child =>
                child.type === TokenType.MATH ||
                child instanceof MathNode
            );
            expect(hasMathNodes).toBe(true);
        });
    });
});
