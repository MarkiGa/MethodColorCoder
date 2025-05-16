// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import * as ts from "typescript";

//settings
let set_opacity = vscode.workspace.getConfiguration('MethodColorCoder').get<number>('overlayOpacity');
let set_randomColor = vscode.workspace.getConfiguration('MethodColorCoder').get<number>('RandomColorIntensity');


function getMethodsFromAST(sourceCode: string) {
    const sourceFile = ts.createSourceFile("temp.ts", sourceCode, ts.ScriptTarget.Latest, true);
    let methodRanges: { name: string; start: number; end: number }[] = [];
    
    function visit(node: ts.Node) {
        if (
            ts.isFunctionDeclaration(node) //|| 
            // ts.isMethodDeclaration(node) || 
            // ts.isArrowFunction(node) ||
            // ts.isFunctionExpression(node)
        ) {
            const methodName = (node as any).name?.getText() ?? "Anonymous";
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
    set_opacity = config.get<number>('overlayOpacity');
    set_randomColor = config.get<number>('RandomColorIntensity');

    Object.keys(methodDecorations).forEach(key => {
    methodDecorations[key].dispose(); // Löscht die Dekoration aus dem Editor
    });
    Object.keys(methodDecorations).forEach(key => {
        delete methodDecorations[key]; // Entfernt die Einträge aus dem Objekt    
    });

    let editor = vscode.window.activeTextEditor;        // update highlight
    if (editor) {
        highlightMethods(editor);
    }
}



const methodDecorations: { [key: string]: vscode.TextEditorDecorationType } = {};
const storedOptionsDec: { [key: string]: vscode.DecorationRenderOptions } = {};

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('MethodColorCoder.overlayOpacity')) {
            handleSettingsChange();
        } if (event.affectsConfiguration('MethodColorCoder.RandomColorIntensity')) {
            handleSettingsChange();
        }
    });

	console.log("Welcome!!");

	let edito = vscode.window.activeTextEditor;
	let text = edito ? edito.document.getText():undefined;
	let ret = getMethodsFromAST(text?text:"");
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

let existingMethods = new Set<string>();

function highlightMethods(editor: vscode.TextEditor) {
    if(!activated){return;}
    let actualProgrammingLanguage : string = '';
    if (editor) {
        actualProgrammingLanguage = editor.document.languageId;
        // console.log(`ActualLanguaeis: ${actualProgrammingLanguage}`);
    } else {
        // console.log("No active doc!");
    }

    switch (actualProgrammingLanguage) {
        case "typescript":
            typescriptJavascriptHighlight(editor);
            break;
        case "javascript":
            typescriptJavascriptHighlight(editor);
            break;
        default:
            break;
    }
}

function typescriptJavascriptHighlight (editor:vscode.TextEditor){
    
	let listFuc = getMethodsFromAST(editor.document.getText());

	let newMethods = new Set<string>();

    let decorations: { [key: string]: vscode.DecorationOptions[] } = {};
	
    let match;
	
	for (let i = 0; i < listFuc.length; i++) {

        let startPos = editor.document.positionAt(listFuc[i].start + 10);
        let endPos = editor.document.positionAt(listFuc[i].end);
		
		let methodName = listFuc[i].name;
		newMethods.add(methodName);	
		
		if (!methodDecorations[methodName]) {
			// console.log(methodName+"new createed");
            const tempOptions : vscode.DecorationRenderOptions = {
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

function getMethodColor(methodName: string): string {
	const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgba(${r}, ${g}, ${b}, ${set_opacity})`;
}
function getHueFromString(methodName: string): string {
    if (methodName.length < 3) return `hsla(0, 100.00%, 50.00%, ${set_opacity})`;
    // Erste 3 Zeichen in Zahlen umwandeln
    const hash = methodName.charCodeAt(0) + methodName.charCodeAt(1) + methodName.charCodeAt(2);
    // Auf den Bereich von 0 bis 360 mappen
    const hue = hash % 360;
    return `hsla(${hue}, 100%, 50%, ${set_opacity})`; // Maximale Sättigung und mittlere Helligkeit
}
function getWeightedHueFromString(str: string): string {
	let weight = 0;
    let bright = 0;
    let toWhite = 0;
	for (let i = 0; i < str.length; i++) {
		let val = (str.charCodeAt(0)*10.32*(set_randomColor?set_randomColor:1));
        bright+= str.charCodeAt(0)*1234;
        toWhite+= str.charCodeAt(0)*68;
		val = ((1/(i+1))*(1/(i+1)))*val;
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
	const disposable = vscode.commands.registerCommand('highlighter.deactivate', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Deactivate!');
        activateDeactivateLogic(false);
	});
	const reactivate = vscode.commands.registerCommand('highlighter.reactivate', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Reactivated!');
        activateDeactivateLogic(true);
	});

	// context.subscriptions.push(disposable);

let activated = true;
// This method is called when your extension is deactivated

export function activateDeactivateLogic (activate : boolean){
    activated = activate;
    handleSettingsChange();
}
