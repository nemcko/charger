/// <reference path='../../../typings/node/node.d.ts' />
/// <reference path='../../../typings/nwjs/nwjs.d.ts' />

import events = require('events');
import * as http from 'http';
import * as Url from 'url';
import * as operators from './list';
import { Charger } from '../main';
import { KbEvents } from '../keyboard';

export type CallbackFunction = (...args: any[]) => void;

const APIREGEXP = /AT\*KUPON=([0-9 ]+)\,([0-9 ]+)\,([0-9 ]+)/g;
//const APIREGEXP = /\nok\nAT\*KUPON=([0-9]+)\,([0-9]+)\,([0-9]+)/g;
declare var async: any;

//const EV_ENTER = document.createEvent("KeyboardEvent");
//if (EV_ENTER.initKeyboardEvent) {  // Chrome, IE
//    EV_ENTER.initKeyboardEvent("keyup", true, true, document.defaultView, "Enter", 0, "", false, "");
//} else { // FireFox
//    EV_ENTER.initKeyEvent("keyup", true, true, document.defaultView, false, false, false, false, 13, 0);
//}


export interface ICard {
    CreditCard: string,
    Owner: string,
    Expiration: string[],
    ValidationCode: string
}

export var WatchJS = require("watch")
export var watch = WatchJS.watch;
export var unwatch = WatchJS.unwatch;
export var callWatchers = WatchJS.callWatchers;

export type LoadPageFunction = (paydata: PayData, callback: CallbackFunction) => void;

export class PayData {
    constructor(
        public name: string,
        public coupon: string,
        public telnum: string,
        public nominal: string,
        public confdata: any,
        public id: number,
        public finish: boolean,
        public crtime: number,
        public card?: ICard
    ) { };
}

export function crc(str: string): number {
    let b_table = "00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D".split(' ').map(function (s) { return parseInt(s, 16) });
    let crc: number = -1;

    for (var i = 0, iTop = str.length; i < iTop; i++) {
        crc = (crc >>> 8) ^ b_table[(crc ^ str.charCodeAt(i)) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
};

export abstract class Operator extends events.EventEmitter {
    private _gui: NwJs.NW;
    protected charger: Charger;
    protected wnd: NwJs.Window = null;
    protected wndCard: NwJs.Window = null;
    //protected webview: any = null;
    protected running: boolean = false;
    protected keyboard: KbEvents;
    protected code: string;
    protected name: string;
    protected oid: string;
    protected url: string;
    protected prefix: string[];
    protected newurl: string;
    protected nextPage: LoadPageFunction = null;

    public debug: boolean = false;

    constructor(charger: Charger, gui: NwJs.NW, oid: string) {
        super();
        this.charger = charger;
        this._gui = gui;
        this.keyboard = new KbEvents(gui);
        this.oid = oid;
    };

    public isOurNumber(telnum: string): boolean {
        return this.prefix.indexOf((telnum + '0000').substr(0, 4)) >= 0;
    }

    get gui(): NwJs.NW {
        return this._gui;
    }

    public getName(): string {
        return this.name;
    }

    public downloadData(parentobj: any, next: CallbackFunction) {
        let apiUrl = parentobj.confdata.apiUrlTempl.replace('$oid', this.oid);
        let self = this;

        http.get(apiUrl, function (res: any) {
            const { statusCode } = res;
            const contentType = res.headers['content-type'];

            let error;

            if (statusCode !== 200) {
                error = new Error('Request Failed.\n' +
                    `Status Code: ${statusCode}`);
            }
            //else if (!/^application\/json/.test(contentType)) {
            //    error = new Error('Invalid content-type.\n' +
            //        `Expected application/json but received ${contentType}`);
            //}

            if (error) {
                console.error(apiUrl);
                console.error(error.message);
                res.resume();
                return;
            }

            res.setEncoding('utf8');
            res.on("data", function (data: string) {
                let matches = APIREGEXP.exec(data);
                if (matches) {
                    //console.log(data)
                    let id = crc(data);
                    if (!parentobj.payids.existId(id.toString())) {
                        let paydata: PayData = {
                            id: id,
                            name: self.getName(),
                            coupon: matches[1].replace(' ',''),
                            telnum: matches[2].replace(' ',''),
                            nominal: matches[3].replace(' ',''),
                            confdata: parentobj.confdata,
                            finish: false,
                            crtime: new Date().getTime()
                        };
                        parentobj.payids.check(paydata, (expired: boolean) => {
                            if (expired) parentobj.emit('expired', paydata);
                            return self.acknowledge(parentobj, paydata, next);
                        });
                    } else {
                        if (next) next();
                    }
                } else {
                    if (next) next();
                }
            });
        }).on('error', function (e) {
            self.emit('api error', `WebServer api ${apiUrl} not connected.`);
            if (next) next();
        });

    }

    public acknowledge(parentobj: any, paydata: PayData, next: CallbackFunction) {
        let apiUrl = parentobj.confdata.ackUrlTempl.replace('$cid', paydata.coupon);
        let self = this;

        http.get(apiUrl, function (res: any) {
            res.setEncoding('utf8');
            res.on("data", function (data: string) {
                if (next) next();
            });
        }).on('error', function (e) {
            self.emit('api error', `WebServer api ${apiUrl} not connected.`);
            if (next) next();
        });

    }

    public watch(prop: string, handler: Function) {
        var oldval = this[prop];
        var newval = oldval;
        var getter = function () {
            return newval;
        };
        var setter = function (val:any) {
            oldval = newval;
            return newval = handler.call(this, prop, oldval, val);
        };
        if (delete this[prop]) { // can't watch constants
            if (Object.defineProperty) { // ECMAScript 5
                Object.defineProperty(this, prop, {
                    'get': getter,
                    'set': setter
                });
            } else if (Object.prototype['__defineGetter__'] && Object.prototype['__defineSetter__']) { // legacy
                Object.prototype['__defineGetter__'].call(this, prop, getter);
                Object.prototype['__defineSetter__'].call(this, prop, setter);
            }
        }
    }

    public unwatch(prop: string) {
        var val = this[prop];
        delete this[prop]; // remove accessors
        this[prop] = val;
    }

    public openPageWindow(parentobj: any, url: string, paydata: PayData, callback: CallbackFunction) {
        let self = this;
        return new Promise((resolve) => {
            self.gui.Window.open('/views/operators.html', {
                new_instance: false,
                width: paydata.confdata.window_width,
                height: paydata.confdata.window_height,
                focus: true
            }, function (win: NwJs.Window) {
                if (win) {
                    self.close();
                    self.charger.addWnd(win);
                    self.wnd = win;
                    self.wnd.on('loaded', function () {
                        self.keyboard.webview = win.window.document.getElementById('webview');
                        if (self.keyboard.webview.src === "") {

                            if (self.nextPage === self.loadPage) {
                                parentobj.getCardIndex((index: number) => {
                                    paydata.card = parentobj.cards[index];
                                    self.emit('open', paydata);
                                });
                            }

                            self.running = false;
                            self.newurl = "";
                            self.keyboard.webview.addEventListener("loadstop", (event: any) => {
                                event.preventDefault();
                                resolve();
                            });
                            self.keyboard.webview.addEventListener("newwindow", (event: any) => {
                                event.preventDefault();
                                if (event.targetUrl) self.newurl = event.targetUrl;
                            });
                            self.keyboard.webview.src = url;
                        }
                        win.resizeTo(paydata.confdata.window_width, paydata.confdata.window_height);
                    });

                    self.wnd.on('close', function () {
                        self.close();
                    });
                }
            });
        }).then(callback);
    }

    public waitForProp(selector:string,prop:string,callback: CallbackFunction) {
        let self = this;
        return new Promise((resolve) => {
            let idtin = setInterval(function () {
                self.keyboard.wvVal(
                    `document.querySelector('${selector}').${prop}`,
                ).then((ret) => {
                    if (ret[0]) {
                        clearInterval(idtin);
                        idtin = null;
                        resolve(ret[0]);
                    }
                })
            }, 200);
            setTimeout(function () {
                if (idtin) clearInterval(idtin);
                resolve();
            }, 20000);
        }).then(callback);
    }

    public waitForValue(selector: string, callback: CallbackFunction) {
        return this.waitForProp(selector, 'value', callback);
    }

    public waitForText(selector: string, callback: CallbackFunction) {
        return this.waitForProp(selector, 'innerHTML', callback);
    }

    public payment(parentobj: any, paydata: PayData, next: CallbackFunction) {
        let self = this;
        let pgFun = () => Promise.resolve(
            self.openPageWindow(parentobj, self.url, paydata, () => {
                self.nextPage(paydata, () => {
                    console.log('----------------------------------------------');
                    return check();
                });
            })
        );
        let check: CallbackFunction = () => {
            if (this.nextPage)
                return pgFun();
            else
                return next();
        };

        self.nextPage = self.loadPage;


        parentobj.payids.check(paydata, (expired: boolean) => {
            if (expired) {
                self.emit('expired', paydata);
                self.nextPage = null;
                self.close();
                next();
            }
            pgFun();
        });
    }

    protected payCard(paydata: PayData, callback: CallbackFunction) {
        let self = this;
        self.keyboard.startBatch()
            .batchTypeText(paydata.card.CreditCard)
            .batchTypeKey('tab')
            .batchTypeText(paydata.card.Expiration[0])
            .batchTypeKey('tab')
            .batchTypeText(paydata.card.Expiration[1])
            .batchTypeKey('tab')
            .batchTypeText(paydata.card.ValidationCode)
            .batchTypeKey('tab')
            .batchTypeKey('tab')
            .batchTypeKey('tab')
            .batchTypeKey('enter', 2000)
            .sendBatch()
            .then(() => {

                //self.keyboard.sleep(13000).then(() => {
                //    //self.waitForLoad(() => {
                //    self.keyboard.wvVal(
                //        `document.querySelector('div.cardpay-transaction-result').innerHTML`,
                //    ).then((ret) => {
                //        try {
                //            //console.log(JSON.stringify(ret));
                //            if (ret[0].indexOf("cardpay-transaction-success") > 0) {
                //                //if (ret[0].indexOf("cardpay-transaction-failed") > 0) {
                //                self.close();
                //                console.log('succeded.');
                //                self.emit('finish', paydata);
                //                callback();
                //            } else {
                //                self.close();
                //                console.log('failed.');
                //                self.emit('error', paydata, 'bad card data ');
                //                callback('bad card data ');
                //            }
                //        } catch (e) {
                //            self.close();
                //            console.log('failed.');
                //            self.emit('error', paydata, 'error in card data ');
                //            callback('error in card data');
                //        }
                //    })
                //});


                self.waitForText('div.cardpay-transaction-result', (val) => {
                    if (val.indexOf("cardpay-transaction-success") > 0) {
                        //if (val.indexOf("cardpay-transaction-failed") > 0) {
                        self.close();
                        console.log('succeded.');
                        self.emit('finish', paydata);
                        callback();
                    } else {
                        self.close();
                        console.log('failed.');
                        self.emit('error', paydata, 'bad card data ');
                        callback('bad card data ');
                    }
                });

            });




    }

    abstract loadPage: LoadPageFunction;

    protected close() {
        if (this.keyboard.webview) {
            this.keyboard.webview = null;
        }
        if (this.wndCard) {
            this.wndCard.hide();
            this.wndCard.close(true);
            this.wndCard = null;
        }
        if (this.wnd) {
            this.wnd.hide();
            this.wnd.close(true);
            this.wnd = null;
        }
    }

    protected assignOperator(name: string, paydata: PayData): Operator {
        let operator: any = null;
        let self = this;

        self.emit('message', paydata, '>>');
        self.charger.operators.forEach(function (op: any) {
            if (op.constructor.name === name) {
                operator = op;
                self.emit('message', paydata, op.getName());
                self.close();
            }
        });
        return operator;
    }

}

/*
                <div class="cardpay-transaction-result">
                    <h2 class="cardpay-transaction-success">Vaša transakcia bola úspešne spracovaná.</h2>

                <div class="cardpay-transaction-result">
                    <h2 class="cardpay-transaction-failed">Vaša transakcia nebola vykonaná!</h2>
*/




        //self.gui.Window.open('/views/operators.html', {
        //    new_instance: false,
        //    width: paydata.confdata.window_width,
        //    height: paydata.confdata.window_height,
        //    focus: true
        //}, function (win: NwJs.Window) {
        //    if (win) {
        //        self.charger.addWnd(win);
        //        self.wnd = win;
        //        self.wnd.on('loaded', function () {
        //            self.keyboard.webview = win.window.document.getElementById('webview');
        //            if (self.keyboard.webview.src === "") {
        //                self.running = false;
        //                self.newurl = "";
        //                self.keyboard.webview.addEventListener("loadstop", (event: any) => {
        //                    event.preventDefault();
        //                    self.loadPage(paydata, (err: string) => {
        //                        console.log('----------------------------------------------');
        //                        if (next) next(err);
        //                    });
        //                });
        //                self.keyboard.webview.addEventListener("newwindow", (event: any) => {
        //                    event.preventDefault();
        //                    if (event.targetUrl) self.newurl = event.targetUrl;
        //                });
        //                self.keyboard.webview.src = self.url;
        //            }
        //            win.resizeTo(paydata.confdata.window_width, paydata.confdata.window_height);

        //            //try {
        //            //    self.loadPage(paydata, next);
        //            //} catch (e) {
        //            //    self.close();
        //            //    self.emit('error', paydata, e);
        //            //    if (next) next();
        //            //}
        //        });

        //        self.wnd.on('close', function () {
        //            self.close();
        //        });

        //    }
        //});
        //});



/*
        self.charger.keySender.sendKey('@27').then(() => {
            self.gui.Window.open(this.url, {
                new_instance: false,
                width: paydata.confdata.window_width,
                height: paydata.confdata.window_height,
                focus: true
            }, function (win: NwJs.Window) {
                if (win) {
                    self.charger.addWnd(win);
                    self.wnd = win;
                    self.wnd.on('loaded', function () {
                        try {
                            self.loadPage(paydata, next);
                        } catch (e) {
                            self.close();
                            self.emit('error', paydata, e);
                            if (next) next();
                        }
                    });

                    self.wnd.on('close', function () {
                        self.close();
                    });

                    self.emit('open', paydata);
                }
            });
        });
*/


        //self.charger.keyboard.wvExec(self.webview,
        //    `wv.id('cardNumber').value = '${paydata.card.CreditCard}';`,
        //    `wv.id('cardExpirationMonth').value = '${paydata.card.Expiration[0]}';`,
        //    `wv.id('cardExpirationYear').value = '${paydata.card.Expiration[1]}';`,
        //    `wv.id('cardVerificationValue').value = '${paydata.card.ValidationCode}';`,
        //    `wv.next(wv.next(wv.next('cardVerificationValue'))).click();`,
        //).then(s => {
        //    setTimeout(() => {
        //        self.webview.executeScript({
        //            //code: `document.querySelector('h2.cardpay-transaction-success').innerHTML='O.k.'`,
        //            code: `document.querySelector('h2.cardpay-transaction-failed').innerHTML='O.k.'`,
        //            runAt: 'document_end'
        //        }, (result: any) => {
        //            //console.log(result);
        //            self.close();
        //            if (result) {
        //                self.emit('finish', paydata);
        //                callback();
        //            } else {
        //                self.emit('error', paydata, 'bad card data ');
        //                callback('bad card data ');
        //            }
        //        });
        //    }, 7000);
        //});


        //setTimeout(() => {


        //    self.charger.keyboard.text(self.wnd, 'cardNumber', paydata.card.CreditCard, (err, elem) => {
        //        if (err) return callback(err);
        //        self.charger.keyboard.text(self.wnd, 'cardExpirationMonth', paydata.card.Expiration[0], (err, elem) => {
        //            if (err) return callback(err);
        //            self.charger.keyboard.text(self.wnd, 'cardExpirationYear', paydata.card.Expiration[1], (err, elem) => {
        //                if (err) return callback(err);
        //                self.charger.keyboard.text(self.wnd, 'cardVerificationValue', paydata.card.ValidationCode, (err, elem) => {
        //                    if (err) return callback(err);
        //                    //self.wnd.window.document.getElementById('logon').target = "_blank";
        //                    self.wnd.window.document.getElementById('processTransaction').click();
        //                });
        //            });
        //        });
        //    });









        //    ////self.wnd.window.window.nw = self.wnd;
        //    //self.wnd.window.document.getElementById('logon').target = "_blank";
        //    //self.wnd.window.document.getElementById('cardNumber').value = paydata.card.CreditCard;
        //    //self.wnd.window.document.getElementById('cardExpirationMonth').value = paydata.card.Expiration[0];
        //    //self.wnd.window.document.getElementById('cardExpirationYear').value = paydata.card.Expiration[1];
        //    //self.wnd.window.document.getElementById('cardVerificationValue').value = paydata.card.ValidationCode;
        //    //self.wnd.window.document.forms[0].submit();
        //    ////self.wnd.window.document.getElementbyId('logon').submit();
        //    ////self.wnd.window.document.getElementById('processTransaction').click();


        //                //if (self.wnd
        //                //    && self.wnd.window
        //                //    && self.wnd.window.document
        //                //    //&& self.wnd.window.document.querySelector('h2.cardpay-transaction-success')) {
        //                //    && self.wnd.window.document.querySelector('h2.cardpay-transaction-failed')) {
        //                //    self.close();
        //                //    self.emit('finish', paydata);
        //                //    callback();
        //                //} else {
        //                //    self.close();
        //                //    self.emit('error', paydata, 'bad card data ');
        //                //    callback('bad card data ');
        //                //}


        //}, 2000);



        //async.series([
        //    (next: CallbackFunction) => {
        //        setTimeout(next, 2000);
        //    },
        //    (next: CallbackFunction) => {
        //        self.charger.keyboard.text(self.wnd, 'cardnumber', paydata.card.CreditCard, next);
        //    },
        //    (next: CallbackFunction) => {
        //        self.charger.keyboard.text(self.wnd, 'cardexpirationmonth', paydata.card.Expiration[0], next);
        //    },
        //    (next: CallbackFunction) => {
        //        self.charger.keyboard.text(self.wnd, 'cardexpirationyear', paydata.card.Expiration[1], next);
        //    },
        //    (next: CallbackFunction) => {
        //        self.charger.keyboard.text(self.wnd, 'cardverificationvalue', paydata.card.ValidationCode, next);
        //    },
        //    //(next: CallbackFunction) => {
        //    //    self.charger.keyboard.getElement(self.wnd, 'processtransaction', (err, elem) => {
        //    //        if (err) return next(err);
        //    //        elem.click();
        //    //        next();
        //    //    });
        //    //},
        //    (next: CallbackFunction) => {
        //        setTimeout(function () {
        //            if (self.wnd
        //                && self.wnd.window
        //                && self.wnd.window.document
        //                //&& self.wnd.window.document.queryselector('h2.cardpay-transaction-success')) {
        //                && self.wnd.window.document.queryselector('h2.cardpay-transaction-failed')) {
        //                self.close();
        //                self.emit('finish', paydata);
        //                next();
        //            } else {
        //                self.close();
        //                self.emit('error', paydata, 'bad card data ');
        //                next();
        //            }
        //        }, 20000);
        //    },
        //], (err: string, results: any) => { callback() });









        //setTimeout(() => {
        //    self.charger.keySender.startBatch()
        //        .batchTypeText(paydata.card.CreditCard)
        //        .batchTypeKey('tab')
        //        .batchTypeText(paydata.card.Expiration[0])
        //        .batchTypeKey('tab')
        //        .batchTypeText(paydata.card.Expiration[1])
        //        .batchTypeKey('tab')
        //        .batchTypeText(paydata.card.ValidationCode)
        //        .batchTypeKey('tab')
        //        .batchTypeKey('tab')
        //        .batchTypeKey('tab')
        //        .batchTypeKey('enter', 2000)
        //        .sendBatch()
        //        .then(() => {
        //            //self.wnd.window.document.getElementById('logon').submit();
        //            //self.wnd.window.document.getElementById('processTransaction').click();
        //            //setTimeout(function () {
        //            //self.charger.keySender.sendKey('enter').then(() => {
        //            if (self.wnd
        //                && self.wnd.window
        //                && self.wnd.window.document
        //                //&& self.wnd.window.document.querySelector('h2.cardpay-transaction-success')) {
        //                && self.wnd.window.document.querySelector('h2.cardpay-transaction-failed')) {
        //                self.close();
        //                self.emit('finish', paydata);
        //                callback();
        //            } else {
        //                self.close();
        //                self.emit('error', paydata, 'bad card data ');
        //                callback('bad card data ');
        //            }
        //            //});
        //            //}, 20000);
        //        });
        //}, 2000);    
