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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    console.log("Welcome!!");
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    // Erstelle eine Dekoration mit Hintergrundfarbe
    // const methodDecoration = vscode.window.createTextEditorDecorationType({
    //     backgroundColor: 'rgba(255, 150, 100, 0.3)',
    //     // borderRadius: '4px'
    // 	isWholeLine: true // Markiert die gesamte Zeile
    // });
    const methodDecorations = {};
    // Reagiere auf Dokument-Änderungen
    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            highlightMethods(editor, methodDecoration);
        }
    });
    vscode.workspace.onDidChangeTextDocument(event => {
        let editor = vscode.window.activeTextEditor;
        if (editor && event.document === editor.document) {
            highlightMethods(editor, methodDecoration);
            console.log("change");
        }
    });
}
// let methodDecorations;
function highlightMethods(editor, decorationType) {
    // const methodPattern = /\b\w+\s*\(/g;  // Erkennung von Methoden mit ()
    const methodPattern = /\b(public|private|protected|static)?\s*\w+\s+(\w+)\s*\([^)]*\)\s*{[^{}]*}/gs; // gute methoden tracking ohne methoden namen
    // const methodPattern = /\b(public|private|protected|static)?\s*(\w+)\s+(\w+)\s*\([^)]*\)\s*{/g;
    // const methodPattern = /\b(public|private|protected|static)?\s*\w+\s+\w+\s*\([^)]*\)\s*{([\s\S]*?)}\s*$/gm;
    // const methodPattern = /\b(public|private|protected|static)?\s*\w+\s+(\w+)\s*\([^)]*\)\s*{/g;
    let text = editor.document.getText();
    let decorations = [];
    let match;
    while ((match = methodPattern.exec(text)) !== null) {
        let startPos = editor.document.positionAt(match.index);
        let endPos = editor.document.positionAt(match.index + match[0].length);
        let methodName = match[2];
        console.log(methodName);
        let backgroundColor = getMethodColor(methodName);
        const decorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: backgroundColor,
            isWholeLine: true
        });
        if (!methodDecorations[methodName]) {
            methodDecorations[methodName] = vscode.window.createTextEditorDecorationType({
                backgroundColor: getMethodColor(methodName),
                isWholeLine: true
            });
        }
        decorations.push({ range: new vscode.Range(startPos, endPos) });
        editor.setDecorations(decorationType, decorations);
    }
}
function getMethodColor(methodName) {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgba(${r}, ${g}, ${b}, 0.05)`;
}
// The command has been defined in the package.json file
// Now provide the implementation of the command with registerCommand
// The commandId parameter must match the command field in package.json
const disposable = vscode.commands.registerCommand('highlighter.helloWorld', () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInformationMessage('Hello World from highlighter!');
});
// context.subscriptions.push(disposable);
// This method is called when your extension is deactivated
function deactivate() { }
//# sourceMappingURL=extension3.js.map