"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const Lexer_1 = require("./Lexer");
const Parser_1 = require("./Parser");
const Renderer_1 = require("./Renderer");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Function to read markdown file
function readMarkdownFile(filename) {
    const filePath = path.join(__dirname, '..', 'tests', 'test-files', filename);
    try {
        return fs.readFileSync(filePath, 'utf8');
    }
    catch (error) {
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
const filename = process.argv[2] || 'function.md';
const markdownInput = readMarkdownFile(filename);
// Initialize the lexer and parser
const lexer = new Lexer_1.Lexer(markdownInput);
const parser = new Parser_1.Parser(lexer);
const documentNode = parser.parse();
// Render the parsed document
const renderer = new Renderer_1.Renderer();
const htmlOutput = renderer.render(documentNode);
// Write to HTML file
const outputPath = path.join(__dirname, '..', 'output', `${path.basename(filename, '.md')}.html`);
try {
    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(outputPath, htmlOutput);
    console.log(`HTML file generated successfully at: ${outputPath}`);
}
catch (error) {
    console.error('Error writing HTML file:', error);
    process.exit(1);
}
