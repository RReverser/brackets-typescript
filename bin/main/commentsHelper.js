define(["require", "exports", './logger'], function(require, exports, __Logger__) {
    'use strict';

    
    var Logger = __Logger__;
    
    var Services = TypeScript.Services;

    var EditorManager = brackets.getModule('editor/EditorManager'), DocumentManager = brackets.getModule('document/DocumentManager'), KeyEvent = brackets.getModule('utils/KeyEvent'), StringUtils = brackets.getModule('utils/StringUtils');

    function handleEnterKey(editor) {
        var cursor = editor.getCursorPos(), token = editor._codeMirror.getTokenAt(cursor), insert, newPosition;
        if (token.state.eolState === Services.EndOfLineState.InMultiLineCommentTrivia) {
            if (!StringUtils.endsWith(token.string, '*/') || cursor.ch < token.end) {
                var line = editor.document.getLine(cursor.line), index = line.search(/[\/*]/), indent = line.substr(0, index);

                if (index != -1 && indent.match(/^\s*$/)) {
                    var isFirstLineComment = (line.substr(index, 2) === '/*'), isClosed = false, currentLineNumber = cursor.line + 1, firstNonBlankIndex;
                    while (true) {
                        line = editor.document.getLine(currentLineNumber);
                        if (line === undefined) {
                            break;
                        } else {
                            firstNonBlankIndex = line.search(/[^\s]/);
                            if (line[firstNonBlankIndex] !== '*') {
                                break;
                            }
                            if (line[firstNonBlankIndex + 1] === '/') {
                                isClosed = true;
                                break;
                            }
                        }
                        currentLineNumber++;
                    }
                    if (isFirstLineComment && !isClosed) {
                        insert = '\n' + indent + ' * \n' + indent + ' */';
                        newPosition = {
                            line: cursor.line + 1,
                            ch: indent.length + 3
                        };
                    } else {
                        insert = '\n' + indent + (isFirstLineComment ? ' ' : '') + '* ';
                    }
                }
            }
        }

        if (insert) {
            editor.document.replaceRange(insert, cursor, cursor);
            if (newPosition) {
                editor.setCursorPos(newPosition.line, newPosition.ch, true, true);
            }
            return true;
        }
        return false;
    }

    function handleKey(editor) {
        var cursor = editor.getCursorPos(), token = editor._codeMirror.getTokenAt(cursor);
        if (token.state.eolState === Services.EndOfLineState.InMultiLineCommentTrivia) {
            if (!StringUtils.endsWith(token.string, '*/') || cursor.ch < token.end) {
                var line = editor.document.getLine(cursor.line), index = line.search(/[^\s]/), prefix = line.substr(0, index);

                editor.document.replaceRange('\n' + prefix + (line[index] === '*' ? '' : ' ') + '* ', cursor, cursor);

                return true;
            }
        }
        return false;
    }

    function handleKeyPress(event) {
        if (event.keyCode === KeyEvent.DOM_VK_RETURN) {
            var editor = EditorManager.getFocusedEditor();
            if (editor) {
                if (editor.getModeForSelection() === 'typescript') {
                    if (handleEnterKey(editor)) {
                        event.stopPropagation();
                        event.preventDefault();
                    }
                }
            }
        }
    }

    var keyPressSignal, typeScriptProjectManager;
    function init(signal, projectManager) {
        keyPressSignal = signal;
        typeScriptProjectManager = projectManager;
        signal.add(handleKeyPress);
    }
    exports.init = init;

    function dispose() {
        keyPressSignal.remove(handleKeyPress);
        keyPressSignal = null;
    }
    exports.dispose = dispose;
});
