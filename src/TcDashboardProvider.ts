import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export class TcDashboardProvider implements vscode.TreeDataProvider<AdrItem> {

    getTreeItem(element: AdrItem): vscode.TreeItem {
        return element;
    }

    async getChildren(): Promise<AdrItem[]> {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders) {
            return [new AdrItem("No workspace open", "", 0)];
        }

        const adrDir = path.join(folders[0].uri.fsPath, "docs", "decisions");

        if (!fs.existsSync(adrDir)) {
            return [new AdrItem("No ADR directory found", "", 0)];
        }

        const files = fs.readdirSync(adrDir).filter(f => f.endsWith(".md"));

        if (files.length === 0) {
            return [new AdrItem("No ADRs found", "", 0)];
        }

        return files.map(f => {
            const filePath = path.join(adrDir, f);
            const content = fs.readFileSync(filePath, "utf8");
            const confidence = parseTcConfidence(content);
            const benefit = parseTcBenefit(content);
            return new AdrItem(f, benefit, confidence);
        });
    }
}

function parseTcConfidence(content: string): number {
    const match = content.match(/tc-confidence:\s*(\d)/);
    return match ? parseInt(match[1]) : 0;
}

function parseTcBenefit(content: string): string {
    const match = content.match(/tc-benefit:\s*(.+)/);
    return match ? match[1].trim() : "No TC annotation";
}

class AdrItem extends vscode.TreeItem {
    constructor(label: string, benefit: string, confidence: number) {
        super(label);
        this.tooltip = benefit;
        this.description = confidence > 0 ? `confidence: ${confidence}/5` : "";
    }
}