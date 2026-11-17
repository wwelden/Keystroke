import { Lexer } from './Lexer';
import { Parser } from './Parser';
import { Renderer } from './Renderer';
import * as fs from 'fs';
import * as path from 'path';

export const DEFAULT_INPUT_PATH = path.join(__dirname, '..', 'tests', 'test-files', 'file1.md');
export const DEFAULT_OUTPUT_DIR = path.join(__dirname, '..', 'output');

// Resolve the CLI argument against the caller's working directory,
// falling back to the bundled sample file when no argument is given.
export function resolveInputPath(arg: string | undefined, cwd: string = process.cwd()): string {
    return arg ? path.resolve(cwd, arg) : DEFAULT_INPUT_PATH;
}

export function compileMarkdown(markdownInput: string): string {
    const lexer = new Lexer(markdownInput);
    const parser = new Parser(lexer);
    const documentNode = parser.parse();
    return new Renderer().render(documentNode);
}

// Compile a Markdown file to `<outputDir>/<name>.html` and return the output path.
export function compileFile(inputPath: string, outputDir: string = DEFAULT_OUTPUT_DIR): string {
    const markdownInput = fs.readFileSync(inputPath, 'utf8');
    const htmlOutput = compileMarkdown(markdownInput);
    const outputPath = path.join(outputDir, `${path.basename(inputPath, path.extname(inputPath))}.html`);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputPath, htmlOutput);
    return outputPath;
}

// Run the CLI and return its exit code.
export function main(
    argv: string[],
    cwd: string = process.cwd(),
    outputDir: string = DEFAULT_OUTPUT_DIR
): number {
    const inputPath = resolveInputPath(argv[0], cwd);
    try {
        const outputPath = compileFile(inputPath, outputDir);
        console.log(`HTML file generated successfully at: ${outputPath}`);
        return 0;
    } catch (error) {
        console.error(`Error compiling ${inputPath}: ${error instanceof Error ? error.message : error}`);
        return 1;
    }
}

if (require.main === module) {
    process.exitCode = main(process.argv.slice(2));
}
