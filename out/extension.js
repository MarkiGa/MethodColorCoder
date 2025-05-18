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
exports.activateDeactivateLogic = activateDeactivateLogic;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(require("vscode"));
const ts = __importStar(require("typescript"));
//settings
let set_opacity = vscode.workspace.getConfiguration('MethodColorCoder').get('overlayOpacity');
let set_randomColor = vscode.workspace.getConfiguration('MethodColorCoder').get('RandomColorIntensity');
function getMethodsFromAST(sourceCode) {
    const sourceFile = ts.createSourceFile("temp.ts", sourceCode, ts.ScriptTarget.Latest, true);
    let methodRanges = [];
    function visit(node) {
        if (ts.isFunctionDeclaration(node) //|| 
        // ts.isMethodDeclaration(node) || 
        // ts.isArrowFunction(node) ||
        // ts.isFunctionExpression(node)
        ) {
            const methodName = node.name?.getText() ?? "Anonymous";
            methodRanges.push({
                name: methodName,
                start: node.pos,
                end: node.end,
            });
        }
        ts.forEachChild(node, visit);
    }
    visit(sourceFile);
    return methodRanges;
}
function handleSettingsChange() {
    const config = vscode.workspace.getConfiguration('MethodColorCoder');
    set_opacity = config.get('overlayOpacity');
    set_randomColor = config.get('RandomColorIntensity');
    Object.keys(methodDecorations).forEach(key => {
        methodDecorations[key].dispose(); // Löscht die Dekoration aus dem Editor
    });
    Object.keys(methodDecorations).forEach(key => {
        delete methodDecorations[key]; // Entfernt die Einträge aus dem Objekt    
    });
    let editor = vscode.window.activeTextEditor; // update highlight
    if (editor) {
        highlightMethods(editor);
    }
}
const methodDecorations = {};
const storedOptionsDec = {};
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('MethodColorCoder.overlayOpacity')) {
            handleSettingsChange();
        }
        if (event.affectsConfiguration('MethodColorCoder.RandomColorIntensity')) {
            handleSettingsChange();
        }
    });
    console.log("Welcome!!");
    let edito = vscode.window.activeTextEditor;
    let text = edito ? edito.document.getText() : undefined;
    let ret = getMethodsFromAST(text ? text : "");
    let editor = vscode.window.activeTextEditor;
    if (editor) {
        highlightMethods(editor);
    }
    // Reagiere auf Dokument-Änderungen
    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            highlightMethods(editor);
        }
    });
    vscode.workspace.onDidChangeTextDocument(event => {
        let editor = vscode.window.activeTextEditor;
        if (editor && event.document === editor.document) {
            highlightMethods(editor);
        }
    });
}
function highlightMethods(editor) {
    if (!activated) {
        return;
    }
    let actualProgrammingLanguage = '';
    if (editor) {
        actualProgrammingLanguage = editor.document.languageId;
        // console.log(`ActualLanguaeis: ${actualProgrammingLanguage}`);
    }
    else {
        // console.log("No active doc!");
    }
    switch (actualProgrammingLanguage) {
        case "typescript":
            typescriptJavascriptHighlight(editor);
            break;
        case "javascript":
            typescriptJavascriptHighlight(editor);
            break;
        case "python":
            pythonHighlight(editor);
            break;
        default:
            break;
    }
}
function typescriptJavascriptHighlight(editor) {
    let listFuc = getMethodsFromAST(editor.document.getText());
    addCheckDecStart();
    for (let i = 0; i < listFuc.length; i++) {
        let startPos = editor.document.positionAt(listFuc[i].start + 10);
        let endPos = editor.document.positionAt(listFuc[i].end);
        let methodName = listFuc[i].name;
        addCheckDecLoop(methodName, startPos, endPos);
    }
    addCheckDecFinalize(editor);
}
let decorations = {};
let existingMethods = new Set();
let newMethods = new Set();
function addCheckDecStart() {
    newMethods.clear();
    decorations = {};
}
function addCheckDecLoop(methodName, startPos, endPos) {
    newMethods.add(methodName);
    if (!methodDecorations[methodName]) {
        // console.log(methodName+"new createed");
        const tempOptions = {
            backgroundColor: getWeightedHueFromString(methodName),
            isWholeLine: true
        };
        methodDecorations[methodName] = vscode.window.createTextEditorDecorationType(tempOptions);
        storedOptionsDec[methodName] = tempOptions;
    }
    if (!decorations[methodName]) {
        decorations[methodName] = [];
    }
    decorations[methodName].push({ range: new vscode.Range(startPos, endPos) });
}
function addCheckDecFinalize(editor) {
    existingMethods.forEach(method => {
        if (!newMethods.has(method) && methodDecorations[method]) {
            editor.setDecorations(methodDecorations[method], []); // Entfernt Dekoration
            delete methodDecorations[method]; // Lösche aus der Map
            delete storedOptionsDec[method];
        }
    });
    Object.keys(decorations).forEach(method => {
        editor.setDecorations(methodDecorations[method], decorations[method]);
    });
    existingMethods = newMethods;
}
function pythonHighlight(editor) {
    let text = editor.document.getText();
    text = text ? text : "";
    //     const lines = text.split("\n");
    //     const methodRegex = /^def (\w+)\(/gm; // Sucht alle Methoden in Python-Dateien
    //     addCheckDecStart();
    //     try {
    //         for (let i = 0; i < lines.length; i++) {
    //             const matchPy = methodRegex.exec(lines[i]);
    //             if (matchPy) {
    //                 let methodName = matchPy[1];
    //                 let startPos = i;
    //                 const lineMatch = lines[i].match(/^(\s*)/);
    //                 let indentLevel = 0;
    //                 let _temp = lines[i].match(/^(\s*)/);
    //                 if(_temp){ indentLevel = _temp[0].length;}
    //                 let endPos = startPos;
    //                 for (let j = i + 1; j < lines.length; j++) {
    //                     if (lines[j].trim().startsWith("#")) {continue;}
    //                     let currentIndent=0;
    //                     const _temp2 = lines[j].match(/^(\s*)/);
    //                     if(_temp2){currentIndent = _temp2[0].length;}
    //                     if (lines[j].trim() === "" || currentIndent > indentLevel) {
    //                         endPos = j;
    //                     } else {
    //                         break;
    //                     }
    //                 }
    //                 console.warn("FoundMeth: ", methodName, startPos, endPos);
    //                 const sPos = editor.document.positionAt(startPos);
    //                 const sPoss = editor.document.lineAt(startPos).range.start;
    //                 const ePos = editor.document.positionAt(endPos);
    //                 const ePoss = editor.document.lineAt(endPos).range.start;
    //                 if(sPos && ePos){
    //                     addCheckDecLoop(methodName,sPoss,ePoss);
    //                 }else {console.warn("not possible to convert?!");}
    //             }
    //         }
    // } catch {
    //     console.warn("Catch!");
    // }
    //     // // const methods: string[] = [];
    //     // let match;
    //     // while ((match = methodRegex.exec(text?text:""))) {
    //     //     methods.push(match[1]); // Speichert den Namen der Methode
    //     // }
    //     // console.log("Gefundene Methoden:", methods);
    //     // methods.forEach(name => {
    //     //     const start = text.indexOf(`def ${name}(`);
    //     //     const startPos = vscode.window.activeTextEditor?.document.positionAt(start);
    //     //     const endPos = vscode.window.activeTextEditor?.document.positionAt(start + name.length);
    //     //     addCheckDecLoop(name, startPos, endPos)
    //     // });
    const classRegex = /^class (\w+):/gm; // Klassen erkennen
    const methodRegex = /^\s*def (\w+)\(/gm; // Methoden erkennen (beliebige Einrückung zulassen)
    const lines = text.split("\n");
    const methods = [];
    let classIndentLevels = [];
    for (let i = 0; i < lines.length; i++) {
        let classMatch = classRegex.exec(lines[i]);
        if (classMatch) {
            let classIndent = lines[i].match(/^(\s*)/)?.[0].length || 0;
            classIndentLevels.push(classIndent);
        }
        let methodMatch = methodRegex.exec(lines[i]);
        if (methodMatch) {
            let methodIndent = lines[i].match(/^(\s*)/)?.[0].length || 0;
            let insideClass = classIndentLevels.some(indent => methodIndent > indent);
            if (insideClass) {
                console.log(`Methoden innerhalb einer Klasse erkannt: ${methodMatch[1]}`);
            }
            else {
                console.log(`Eigenständige Methode erkannt: ${methodMatch[1]}`);
            }
        }
    }
    methods.forEach(name => {
        const sPoss = editor.document.lineAt(name.start).range.start;
        const ePoss = editor.document.lineAt(name.end).range.start;
        if (sPoss && ePoss) {
            addCheckDecLoop(name.name, sPoss, ePoss);
        }
    });
    addCheckDecFinalize(editor);
}
function getMethodColor(methodName) {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgba(${r}, ${g}, ${b}, ${set_opacity})`;
}
function getHueFromString(methodName) {
    if (methodName.length < 3)
        return `hsla(0, 100.00%, 50.00%, ${set_opacity})`;
    // Erste 3 Zeichen in Zahlen umwandeln
    const hash = methodName.charCodeAt(0) + methodName.charCodeAt(1) + methodName.charCodeAt(2);
    // Auf den Bereich von 0 bis 360 mappen
    const hue = hash % 360;
    return `hsla(${hue}, 100%, 50%, ${set_opacity})`; // Maximale Sättigung und mittlere Helligkeit
}
function getWeightedHueFromString(str) {
    let weight = 0;
    let bright = 0;
    let toWhite = 0;
    for (let i = 0; i < str.length; i++) {
        let val = (str.charCodeAt(0) * 10.32 * (set_randomColor ? set_randomColor : 1));
        bright += str.charCodeAt(0) * 1234;
        toWhite += str.charCodeAt(0) * 68;
        val = ((1 / (i + 1)) * (1 / (i + 1))) * val;
        weight += val;
    }
    const hash = (weight) % 360;
    bright %= 40;
    bright += 60;
    toWhite %= 40;
    toWhite += 45;
    return `hsl(${hash}, ${bright}%, ${toWhite}%, ${set_opacity})`; // Maximale Sättigung und mittlere Helligkeit
}
// The command has been defined in the package.json file
// Now provide the implementation of the command with registerCommand
// The commandId parameter must match the command field in package.json
const disposable = vscode.commands.registerCommand('MethodColorCoder.deactivate', () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInformationMessage('Deactivate!');
    activateDeactivateLogic(false);
});
const reactivate = vscode.commands.registerCommand('MethodColorCoder.reactivate', () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInformationMessage('Reactivated!');
    activateDeactivateLogic(true);
});
// context.subscriptions.push(disposable);
let activated = true;
// This method is called when your extension is deactivated
function activateDeactivateLogic(activate) {
    activated = activate;
    handleSettingsChange();
}
//# sourceMappingURL=extension.js.map