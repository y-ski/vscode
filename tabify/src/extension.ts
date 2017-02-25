'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {window, workspace, commands, Position, Selection, Range, Disposable, ExtensionContext, TextEditor, TextDocument} from 'vscode';
declare function escape(s:string): string;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "tabify" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let tabify = commands.registerCommand('extension.tabify', () => {
        // The code you place here will be executed every time your command is executed
        let tabConv = new TabConverter();
        tabConv.tabify();

        // Display a message box to the user
        // window.showInformationMessage('All tabs had been converted to space!');
    });

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let untabify = commands.registerCommand('extension.untabify', () => {
        // The code you place here will be executed every time your command is executed
        let tabConv = new TabConverter();
        tabConv.untabify();

        // Display a message box to the user
        // window.showInformationMessage('All tabs had been converted to space!');
    });

    context.subscriptions.push(tabify);
    context.subscriptions.push(untabify);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

enum COMMAND {
	TABIFY,
	UNTABIFY
};

class TabConverter {
    private editor: TextEditor;
    private tabSize: string;

    // constructor
    constructor() {
        this.editor = window.activeTextEditor;
        let config = workspace.getConfiguration("editor");
        this.tabSize = config.get("tabSize", "auto");
        if (this.tabSize === "auto") {
            this.tabSize = "4";
        }
    }

    // spacer
    private _sp(num: number): string {
        return Array(num+1).join(' ');
    }
    
    // word count
    private _wc(str: string): number {
        let len = 0;
        str = escape(str);
        for (var i = 0; i < str.length; i++, len++) {
            if (str.charAt(i) == "%") {
            if (str.charAt(++i) == "u") {
                i += 3;
                len++;
            }
            i++;
            }
        }
        return len;
    }

    // untabify text
    private _untabify(str: string, tabSize: number): string {
        tabSize = tabSize || 4;
        let arr = str.split("\n");
        let pos;
        for (var i = 0; i < arr.length; i++) {
            while (arr[i].indexOf("\t") != -1) {
            pos = arr[i].indexOf("\t");
            if (pos == 0) {
                arr[i] = this._sp(tabSize) + arr[i].substr(1);
            } else {
                arr[i] = arr[i].substr(0, pos) +
                        this._sp(tabSize - this._wc(arr[i].substr(0, pos)) % tabSize) +
                        arr[i].substr(pos+1);
            }
            }
        }
        return arr.join("\n");
    }

    // tabify text
    private _tabify(str: string, tabSize: number): string {
        let reg = new RegExp(`[ ]{${tabSize}}`, "ig");
        let repl = "\t";
        return str.replace(reg, repl);
    }

    private _execute(command: COMMAND) {
        if (!this.editor) {
            return;
        }

        let doc = this.editor.document,
            text = '',
            newText = '',
            selection = this.editor.selection;

        if (selection.isEmpty) {
            // whole replace
            text = doc.getText();
            let lines = doc.lineCount,
                lastLine = doc.lineAt(lines -1),
                start = new Position(0, 0),
                end = new Position(lastLine.lineNumber, lastLine.text.length);
            selection = new Selection(start, end);
        } else {
            // selection replace
            text = doc.getText(new Range(selection.start, selection.end));
        }

        switch(command) {
            case COMMAND.TABIFY:
                newText = this._tabify(text, Number(this.tabSize));
                break;

            case COMMAND.UNTABIFY:
                newText = this._untabify(text, Number(this.tabSize));
                break;
        }

        this.editor.edit(edit => {
            edit.replace(selection, newText);
        }).then(bool => {
            if (bool) {
                console.log('executed sucessfully.');
            } else {
                console.log('failed.');
            }
        })
    }

    public untabify() {
        this._execute(COMMAND.UNTABIFY);
    }

    public tabify() {
        this._execute(COMMAND.TABIFY);
    }
}
