import { Node, DocumentNode } from "./Ast";
import { trimSpace } from "./strings";

// Configurable rendering options
export interface RenderOptions {
    includeDocumentClass?: boolean;
    includePackages?: boolean;
    customPackages?: string[];
    documentClass?: string;
}

const STANDARD_PACKAGES = [
    "\\usepackage[utf8]{inputenc}\n",
    "\\usepackage{ulem}\n",     // for strikethrough
    "\\usepackage{hyperref}\n", // for links
    "\\usepackage{listings}\n", // for code blocks
    "\\usepackage{booktabs}\n", // for tables
    "\\usepackage{array}\n",    // for tables
].join("");

export class Renderer {
    render(node: Node | null | undefined): string {
        if (node == null) {
            return "";
        }
        return node.renderLaTeX();
    }

    renderToString(node: Node | null | undefined): string {
        return this.render(node);
    }

    private renderChildren(doc: DocumentNode): string {
        let result = "";
        for (const child of doc.children) {
            result += this.render(child);
            result += "\n";
        }
        return result;
    }

    // Renders a complete HTML document to LaTeX
    renderDocument(doc: DocumentNode | null | undefined): string {
        if (doc == null) {
            return "";
        }

        let result = "\\documentclass{article}\n";
        result += STANDARD_PACKAGES;
        result += "\\usepackage{graphicx}\n"; // for images (if needed later)
        result += "\\begin{document}\n\n";
        result += this.renderChildren(doc);
        result += "\\end{document}";
        return result;
    }

    // Renders with a custom LaTeX preamble (falls back to the default one when empty)
    renderWithCustomPreamble(doc: DocumentNode | null | undefined, preamble: string): string {
        if (doc == null) {
            return "";
        }

        let result = "";
        if (preamble !== "") {
            result += preamble + "\n";
        } else {
            result += "\\documentclass{article}\n";
            result += STANDARD_PACKAGES;
        }

        result += "\\begin{document}\n\n";
        result += this.renderChildren(doc);
        result += "\\end{document}";
        return result;
    }

    // Renders only the document body content without LaTeX preamble
    renderBodyOnly(doc: DocumentNode | null | undefined): string {
        if (doc == null) {
            return "";
        }
        return trimSpace(this.renderChildren(doc));
    }

    renderWithOptions(doc: DocumentNode | null | undefined, options: RenderOptions = {}): string {
        if (doc == null) {
            return "";
        }

        let result = "";

        if (options.includeDocumentClass) {
            const docClass = options.documentClass || "article";
            result += "\\documentclass{" + docClass + "}\n";
        }

        if (options.includePackages) {
            result += STANDARD_PACKAGES;
            for (const pkg of options.customPackages ?? []) {
                result += "\\usepackage{" + pkg + "}\n";
            }
        }

        if (options.includeDocumentClass) {
            result += "\\begin{document}\n\n";
        }

        result += this.renderChildren(doc);

        if (options.includeDocumentClass) {
            result += "\\end{document}";
        }

        return result;
    }

    // Cleans up LaTeX output: collapses one run of triple newlines and trims
    cleanOutput(latex: string): string {
        return trimSpace(latex.split("\n\n\n").join("\n\n"));
    }
}
