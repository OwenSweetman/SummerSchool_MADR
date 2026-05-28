import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export class TcDashboardProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    
    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(): Promise<vscode.TreeItem[]> {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders) {
            return [new vscode.TreeItem("No workspace open")];
        }

        const adrDir = path.join(folders[0].uri.fsPath, "docs", "decisions");
        
        if (!fs.existsSync(adrDir)) {
            return [new vscode.TreeItem("No ADR directory found")];
        }

        const files = fs.readdirSync(adrDir).filter(f => f.endsWith(".md"));
        
        if (files.length === 0) {
            return [new vscode.TreeItem("No ADRs found")];
        }

        return files.map(f => new vscode.TreeItem(f));
    }
}