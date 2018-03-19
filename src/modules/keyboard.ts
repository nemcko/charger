'use strict'

import { CallbackFunction, WatchJS, watch, unwatch, callWatchers } from './operators/base';

declare var async: any;

abstract class KeySender {
    private _keySender: any;
    constructor(
        private _gui: NwJs.NW,
    ) {
        this._keySender = this._gui.require('node-key-sender');
        let layout1 = {
            '0': 'numpad0',
            '1': 'numpad1',
            '2': 'numpad2',
            '3': 'numpad3',
            '4': 'numpad4',
            '5': 'numpad5',
            '6': 'numpad6',
            '7': 'numpad7',
            '8': 'numpad8',
            '9': 'numpad9'
        };
        this._keySender.aggregateKeyboardLayout(layout1);
    }
    public get keySender(): any {
        return this._keySender;
    }

}

export class KbEvents extends KeySender {
    //public keyboard = Keysim.Keyboard.US_ENGLISH;
    private _codes = {
        'backspace': 8,
        'tab': 9,
        'enter': 13,
        'shift': 16,
        'ctrl': 17,
        'alt': 18,
        'pause/break': 19,
        'caps lock': 20,
        'esc': 27,
        'space': 32,
        'page up': 33,
        'page down': 34,
        'end': 35,
        'home': 36,
        'left': 37,
        'up': 38,
        'right': 39,
        'down': 40,
        'insert': 45,
        'delete': 46,
        'command': 91,
        'left command': 91,
        'right command': 93,
        'numpad *': 106,
        'numpad +': 107,
        'numpad -': 109,
        'numpad .': 110,
        'numpad /': 111,
        'num lock': 144,
        'scroll lock': 145,
        'my computer': 182,
        'my calculator': 183,
        ';': 186,
        '=': 187,
        ',': 188,
        '-': 189,
        '.': 190,
        '/': 191,
        '`': 192,
        '[': 219,
        '\\': 220,
        ']': 221,
        "'": 222
    };
    private _webview: any;

    constructor(gui: NwJs.NW) {
        super(gui);
    }

    set webview(wv: any) {
        this._webview = wv;
    }
    get webview(): any {
        return this._webview;
    }

    public sendKey(keyCode: string) {
        return this.keySender.sendKey(keyCode);
    }

    public sendText(text: string) {
        return this.keySender.sendText(text);
    }

    public startBatch() {
        return this.keySender.startBatch();
    }

    public sendBatch() {
        return this.keySender.sendBatch();
    }

    public batchTypeKey(keyCode: string, waitMillisec?: number) {
        return this.keySender.batchTypeKey(keyCode, waitMillisec);
    }

    public batchTypeText(text: string) {
        return this.keySender.batchTypeText(text);
    }
  
    public sleep = function (time: number) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }

    public watchfor = function (obj: any, member: string, callback: CallbackFunction) {
        return new Promise((resolve) => {
            watch(obj, member, () => {
                callback();
                resolve();
            })
        });
    }

    protected exeCode(code: string) {
        let info = {
            code: `
        var KeyEvent = function(data, type) {
                this.keyCode = 'keyCode' in data ? data.keyCode : 0;
                this.charCode = 'charCode' in data ? data.charCode : 0;

                var modifiers = 'modifiers' in data ? data.modifiers : [];

                this.ctrlKey = false;
                this.metaKey = false;
                this.altKey = false;
                this.shiftKey = false;

                for (var i = 0; i < modifiers.length; i++) {
                    this[modifiers[i] + 'Key'] = true;
                }

                this.type = type || 'keypress';
            };

            KeyEvent.prototype.toNative = function() {
                var event = document.createEventObject ? document.createEventObject() : document.createEvent('Events');

                if (event.initEvent) {
                    event.initEvent(this.type, true, true);
                }

                event.keyCode = this.keyCode;
                event.which = this.charCode || this.keyCode;
                event.shiftKey = this.shiftKey;
                event.metaKey = this.metaKey;
                event.altKey = this.altKey;
                event.ctrlKey = this.ctrlKey;

                return event;
            };

            KeyEvent.prototype.fire = function(element) {
                var event = this.toNative();
                if (element.dispatchEvent) {
                    element.dispatchEvent(event);
                    return;
                }

                element.fireEvent('on' + this.type, event);
            };

            // simulates complete key event as if the user pressed the key in the browser
            // triggers a keydown, then a keypress, then a keyup
            KeyEvent.simulate = function(charCode, keyCode, modifiers, element, repeat) {
                if (modifiers === undefined || modifiers === null) {
                    modifiers = [];
                }

                if (element === undefined) {
                    element = document;
                }

                if (repeat === undefined) {
                    repeat = 1;
                }

                var modifierToKeyCode = {
                    'shift': 16,
                    'ctrl': 17,
                    'alt': 18,
                    'meta': 91
                };

                // if the key is a modifier then take it out of the regular
                // keypress/keydown
                if (keyCode == 16 || keyCode == 17 || keyCode == 18 || keyCode == 91) {
                    repeat = 0;
                }

                var modifiersToInclude = [];
                var keyEvents = [];

                // modifiers would go down first
                for (var i = 0; i < modifiers.length; i++) {
                    modifiersToInclude.push(modifiers[i]);
                    keyEvents.push(new KeyEvent({
                        charCode: 0,
                        keyCode: modifierToKeyCode[modifiers[i]],
                        modifiers: modifiersToInclude
                    }, 'keydown'));
                }

                // @todo factor in duration for these
                while (repeat > 0) {
                    keyEvents.push(new KeyEvent({
                        charCode: 0,
                        keyCode: keyCode,
                        modifiers: modifiersToInclude
                    }, 'keydown'));

                    keyEvents.push(new KeyEvent({
                        charCode: charCode,
                        keyCode: charCode,
                        modifiers: modifiersToInclude
                    }, 'keypress'));

                    repeat--;
                }

                keyEvents.push(new KeyEvent({
                    charCode: 0,
                    keyCode: keyCode,
                    modifiers: modifiersToInclude
                }, 'keyup'));

                // now lift up the modifier keys
                for (i = 0; i < modifiersToInclude.length; i++) {
                    var modifierKeyCode = modifierToKeyCode[modifiersToInclude[i]];
                    modifiersToInclude.splice(i, 1);
                    keyEvents.push(new KeyEvent({
                        charCode: 0,
                        keyCode: modifierKeyCode,
                        modifiers: modifiersToInclude
                    }, 'keyup'));
                }

                for (i = 0; i < keyEvents.length; i++) {
                    //console.log('firing ' + 'type: ' + keyEvents[i].type + ', keyCode: ' + keyEvents[i].keyCode + ', charCode: ' + keyEvents[i].charCode);
                    keyEvents[i].fire(element);
                }
            };

            var wv = {
                id: function (id) {
                    if (typeof id == 'object')
                        return id;
                    else {
                        if ( id ) 
                            return document.getElementById(id);
                        else 
                            return document.activeElement;
                    }
                },
                qs: function (id) {
                    return document.querySelectorAll(id)
                },
                next: function (id) {
                    var elem;
                    if (typeof id == 'object')
                        elem = id;
                    else {
                        if ( id ) 
                            elem = document.getElementById(id);
                        else 
                            elem = document.activeElement;
                    }
                    var universe = document.querySelectorAll('input, button, select, textarea, a[href]');
                    var list = Array.prototype.filter.call(universe, function (item) { return item.tabIndex >= "0" });
                    var index = list.indexOf(elem);
                    var el = list[index + 1] || list[0];
                    document.activeElement.blur();
                    el.focus();
                    return el;
                },
                enter: function(id){
                    //var e = document.createEvent("KeyboardEvent");
                    //if (e.initKeyboardEvent) {  // Chrome, IE
                    //    e.initKeyboardEvent("keyup", true, true,null, "Enter", 0, "", false, "");
                    //} else { // FireFox
                    //    e.initKeyEvent("keyup", true, true,null, false, false, false, false, 13, 0);
                    //}
                    //var elem = (typeof id == 'object' ? id : document.getElementById(id));
                    //elem.focus();
                    //elem.dispatchEvent(e);
                    KeyEvent.simulate(0, 13);
                },
                tab: function(id){
                    var elem;
                    if (typeof id == 'object')
                        elem = id;
                    else {
                        if ( id ) 
                            elem = document.getElementById(id);
                        else 
                            elem = document.activeElement;
                    }

                    var e = document.createEvent("KeyboardEvent");
                    if (e.initKeyboardEvent) {  // Chrome, IE
                        e.initKeyboardEvent("keyup", true, true,window, "tab", 0, "", false, "");
                    } else { // FireFox
                        e.initKeyEvent("keyup", true, true,window, false, false, false, false, 9, 0);
                    }
                    elem.dispatchEvent(e);
                    //KeyEvent.simulate(0, 9,null,elem);
//console.log(document.activeElement.tagName);
//console.log(document.activeElement===elem);
                },
                text: function(id,str){
                    var elem = (typeof id == 'object' ? id : document.getElementById(id));
                    //elem.focus();
                    for(var i = 0, length = str.length; i < length; i++) {
                        var e = document.createEvent("KeyboardEvents");
                        if (e.initKeyboardEvent) {  // Chrome, IE
                            e.initKeyboardEvent("keypress", true, true, document.defaultView,  str.charCodeAt(i), 0, "", false, "");
                        } else { // FireFox
                            e.initKeyEvent("keypress", true, true,document.defaultView, false, false, false, false, str.charCodeAt(i), 0);
                        }
                        elem.dispatchEvent(e);

                        //KeyEvent.simulate(str.charCodeAt(i),  str.charCodeAt(i),null,elem);
                        //KeyEvent.simulate(str.charCodeAt(i),  str.charCodeAt(i));

                        //var evt = document.createEvent("KeyboardEvent");
                        //(evt.initKeyEvent || evt.initKeyboardEvent)("keypress", true, true, window, 0, 0, 0, 0, 0, str[i].charCodeAt(0)) 
                        //body.dispatchEvent(evt);
                    }
                }
            };


            ${code}
        `, runAt: 'document_end' };
        return new Promise(resolve => {
            try {
                this._webview.executeScript(info, (x: any) => resolve());
            } catch (e) {
                resolve();
            };
        });
    }

    protected exeJs(path: string) {
        return new Promise(resolve => {
            try {
                this._webview.executeScript({ file: path, runAt: 'document_start' }, (x: any) => resolve());
            } catch (e) {
                resolve();
            };
        });
    }

    public wvExec(...codes: string[]) {
        return Promise.all(codes.map(code => this.exeCode(code))).then(() => this);
    };

    public wvScript(...files: string[]) {
        return Promise.all(files.map(path => this.exeJs(path))).then(() => this);
    };

    public wvVal(code: string) {
        //return Promise.all(codes.map(code => this.exeValue(code))).then(() => this);
        //    protected exeVal(code: string) {
        let info = {
            code: `
            var wv = {
                id: function (id) {
                    if (typeof id == 'object')
                        return id;
                    else {
                        if ( id ) 
                            return document.getElementById(id);
                        else 
                            return document.activeElement;
                    }
                },
                qs: function (id) {
                    return document.querySelectorAll(id)
                },
            };
            ${code}
        `, runAt: 'document_end'
        };
        return new Promise(resolve => {
            try {
                this._webview.executeScript(info, (x: any) => resolve(x));
            } catch (e) {
                resolve(null);
            };

        });
    };

    public getElement(wnd: NwJs.Window, id?: string, cb?: CallbackFunction) {
        if (wnd && wnd.window && wnd.window.document) {
            let retval = function (el: any, err: string) {
                if (el) {
                    if (cb)
                        return cb(null, el);
                    else
                        return el;
                } else {
                    if (cb)
                        return cb(err);
                    else
                        return null;
                }
            };
            if (id) {
                let el = wnd.window.document.getElementById(id);
                return retval(el, "Unknown element " + id);
            } else {
                let el = wnd.window.document.activeElement;
                return retval(el, "Unknown active element");
            }
        } else {
            if (cb)
                return cb("Unknown window, document");
            else
                return null;
        }
    }

    public getNext(wnd: NwJs.Window, id?: string, cb?: CallbackFunction) {
        let findNextElement = function (elem: any) {
            let universe = wnd.window.document.querySelectorAll('input, button, select, textarea, a[href]');
            let list = Array.prototype.filter.call(universe, function (item: any) { return item.tabIndex >= "0" });
            let index = list.indexOf(elem);
            let el = list[index + 1] || list[0];
            if (cb) cb(null, el);
            return el;
        };

        if (typeof id === 'object') {
            return findNextElement(id);
        } else {
            this.getElement(wnd, id, (err: string, elem: any) => {
                if (err) {
                    if (cb)
                        return cb(err);
                    else
                        return null;
                }
                return findNextElement(elem);
            });
        }
    }

    public focusNext(wnd: NwJs.Window, id?: string, cb?: CallbackFunction) {
        let elem: any = this.getNext(wnd, id);
        if (elem) elem.focus();
    }

    public text(wnd: NwJs.Window, id: string, txt: string, callback?: CallbackFunction) {
        this.getElement(wnd, id, (err: string, elem: any) => {
            if (err) {
                if (callback)
                    return callback(err);
                else
                    return;
            }
            elem.value = txt;
            if (callback) callback(null);
        });

    }

}



//export class KbEvents {
//    //public keyboard = Keysim.Keyboard.US_ENGLISH;
//    private _codes = {
//        'backspace': 8,
//        'tab': 9,
//        'enter': 13,
//        'shift': 16,
//        'ctrl': 17,
//        'alt': 18,
//        'pause/break': 19,
//        'caps lock': 20,
//        'esc': 27,
//        'space': 32,
//        'page up': 33,
//        'page down': 34,
//        'end': 35,
//        'home': 36,
//        'left': 37,
//        'up': 38,
//        'right': 39,
//        'down': 40,
//        'insert': 45,
//        'delete': 46,
//        'command': 91,
//        'left command': 91,
//        'right command': 93,
//        'numpad *': 106,
//        'numpad +': 107,
//        'numpad -': 109,
//        'numpad .': 110,
//        'numpad /': 111,
//        'num lock': 144,
//        'scroll lock': 145,
//        'my computer': 182,
//        'my calculator': 183,
//        ';': 186,
//        '=': 187,
//        ',': 188,
//        '-': 189,
//        '.': 190,
//        '/': 191,
//        '`': 192,
//        '[': 219,
//        '\\': 220,
//        ']': 221,
//        "'": 222
//    };

//    constructor(
//        private _gui: NwJs.NW
//    ) { }

//    public getElement(wnd: NwJs.Window, id?: string, cb?: CallbackFunction) {
//        if (wnd && wnd.window && wnd.window.document) {
//            let retval = function (el: any, err: string) {
//                if (el) {
//                    if (cb)
//                        return cb(null, el);
//                    else
//                        return el;
//                } else {
//                    if (cb)
//                        return cb(err);
//                    else
//                        return null;
//                }
//            };
//            if (id) {
//                let el = wnd.window.document.getElementById(id);
//                return retval(el, "Unknown element " + id);
//            } else {
//                let el = wnd.window.document.activeElement;
//                return retval(el, "Unknown active element");
//            }
//        } else {
//            if (cb)
//                return cb("Unknown window, document");
//            else
//                return null;
//        }
//    }

//    public getNext(wnd: NwJs.Window, id?: string, cb?: CallbackFunction) {
//        let findNextElement = function (elem: any) {
//            let universe = wnd.window.document.querySelectorAll('input, button, select, textarea, a[href]');
//            let list = Array.prototype.filter.call(universe, function (item: any) { return item.tabIndex >= "0" });
//            let index = list.indexOf(elem);
//            let el = list[index + 1] || list[0];
//            if (cb) cb(null, el);
//            return el;
//        };

//        if (typeof id === 'object') {
//            return findNextElement(id);
//        } else {
//            this.getElement(wnd, id, (err: string, elem: any) => {
//                if (err) {
//                    if (cb)
//                        return cb(err);
//                    else
//                        return null;
//                }
//                return findNextElement(elem);
//            });
//        }
//    }

//    public focusNext(wnd: NwJs.Window, id?: string, cb?: CallbackFunction) {
//        let elem: any = this.getNext(wnd, id);
//        if (elem) elem.focus();
//    }

//    public text(wnd: NwJs.Window, id: string, txt: string, callback?: CallbackFunction) {
//        this.getElement(wnd, id, (err: string, elem: any) => {
//            if (err) {
//                if (callback)
//                    return callback(err);
//                else
//                    return;
//            }
//            elem.value = txt;
//            if (callback) callback(null);
//        });

//    }

//}

