import { Lexer } from './Lexer';
import { Parser } from './Parser';
import { Renderer } from './Renderer';
import * as fs from 'fs';
import * as path from 'path';

// Function to read markdown file
function readMarkdownFile(filename: string): string {
    const filePath = path.join(__dirname, '..', 'tests', 'test-files', filename);
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.error(`Error reading file ${filename}:`, error);
        process.exit(1);
    }
}

const markdownTest1 = `
# Hello, World!

This is
**bold**
and
_italic_ text.

- [ ] Task 1
- [x] Task 2
- [ ] Task 3

> This is a blockquote.
 hello a new line

---

This is a horizontal rule.

\`\`\`typescript
const a = 1;
\`\`\`

[Google](https://www.google.com)

###### This is a header6
`;

// Get filename from command line arguments or use default
const filename = process.argv[2] || 'file1.md';
const markdownInput = readMarkdownFile(filename);

// Initialize the lexer and parser
const lexer = new Lexer(markdownInput);
const parser = new Parser(lexer);
const documentNode = parser.parse();

// Render the parsed document
const renderer = new Renderer();
console.log(renderer.render(documentNode));
