// <reference path='../../typings/async/async.d.ts' />
//// <reference path='../../typings/index.d.ts' />
/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/nwjs/nwjs.d.ts' />
////// <reference path='../../node_modules/rxjs/Rx.d.ts' />
'use strict'

import * as fs from 'fs';
import * as path from 'path';
//import * as http from 'http';
//import * as Url from 'url';

import { Mutex } from 'async-mutex';

import { CallbackFunction, PayData, ICard, crc } from './operators/base';
import * as operators from './operators/list';
import { KbEvents } from './keyboard';

var terminal: any = null;
declare var async: any;

const settings = {
    'timeinterval': 60,
    'window_width': 800,
    'window_height': 600,
    'apiUrlTempl': 'http://eurosoftware.sk/kupon_dobiphone.php?oper=$oid',
    'ackUrlTempl': 'http://eurosoftware.sk/kupon_dobiphone.php?id=$cid',
    'operators': [{
        'type': 'OperTcom',
        'oid': '1'
    }, {
        'type': 'OperOrange',
        'oid': '2'
    }, {
        'type': 'OperFunfon',
        'oid': '4'
 
    }, {
        'type': 'OperJuro',
        'oid': '5'
    }
    ],
    'cardfile': 'C:\\...\\cardfile.csv',
    'email': {
        'sendto': 'sender@gmail.com',
        'sendfrom': 'no-reply@gmail.com',
        'user': 'user@gmail.com',
        'password': 'xxxxxx',
        'host': 'smtp.googlemail.com',
        'port': '465',
        'ssl': true
    }
};
const nodemailer = require('nodemailer');

export class Charger {
    protected idtimer: any = null;
    protected config: Config;
    protected confdata: any;
    protected showInTerminal: CallbackFunction;
    protected cards: ICard[];
    public payids: PayIds;
    public operators: any = [];
    //public keyboard: KbEvents;

    private _gui: NwJs.NW;
    private _transporter: any;
    private _icard: number = -1;
    private _micard: Mutex = new Mutex();
    private _wnds: Array<NwJs.Window> = [];
    private _lastPid: string = '';

    constructor(term: any, gui: NwJs.NW, showInTerminal: CallbackFunction) {
        this._gui = gui;
        this.config = new Config(gui);
        this.payids = new PayIds(gui);
        this.showInTerminal = showInTerminal;
        this.init(term, gui);

    }

    public init(term: any, nw: NwJs.NW) {
        if (!terminal) {
            terminal = term;
            terminal.open();
            terminal.lock = true;
            terminal.cursorOff();
            terminal.clear();
            terminal.printRowFromString(0, ' The terminal is active ', 1);
        }
    }

    protected createOperator(className: string, ...args: any[]) {
        return new (<any>operators)[className](...args)
            .on('open', (paydata: PayData) => {
                if (!this.payids.isFinished(paydata)) {
                    this.showInTerminal('apidata', paydata.name + ': ' + paydata.telnum + ' (' + paydata.card.CreditCard + ' ' + paydata.nominal + 'Eur)');
                }
            })
            .on('expired', (paydata: PayData) => {
                let msg = `Request expired (Operator: ${paydata.name}, Tel.number: ${paydata.telnum}, Value: ${paydata.nominal}Eur, created: ${new Date(paydata.crtime)})`;
                this.showInTerminal('expired', msg);
                this.sendMail("Charger data expired", msg);
            })
            .on('api error', (msg: string) => {
                this.showInTerminal('api', msg);
            })
            .on('problem', (msg: string) => {
                this.showInTerminal('', msg);
            })
            .on('message', (paydata: PayData, msg: string) => {
                if (!paydata.finish && !this.payids.isFinished(paydata)) {
                    this.showInTerminal('', msg);
                }
            })
            .on('error', (paydata: PayData, msg: string) => {
                if (!paydata.finish && !this.payids.isFinished(paydata)) {
                    paydata.finish = true;
                    this.showInTerminal('', msg);
                }
            })
            .on('fatal error', (paydata: PayData, msg: string) => {
                if (!paydata.finish && !this.payids.isFinished(paydata)) {
                    this.payids.finish(paydata);
                    paydata.finish = true;
                    this.showInTerminal('', msg);
                    this.sendMail("Charger Error", `${msg} (Operator: ${paydata.name}, Tel.number: ${paydata.telnum}, Value: ${paydata.nominal}Eur)`);
                }
            })
            .on('finish', (paydata: PayData) => {
                if (!paydata.finish && !this.payids.isFinished(paydata)) {
                    this.payids.finish(paydata);
                    this.showInTerminal('', 'o.k.');
                    this.sendMail("Credit was renewed", `Operator: ${paydata.name}, Tel.number: ${paydata.telnum}, Value: ${paydata.nominal}Eur`);
                }
            })
            ;
    }

    protected initOperators() {
        let self = this;
        self.operators = [];
        self.confdata.operators.forEach((oper: any) => {
            self.operators.push(this.createOperator(oper.type, self, self._gui, oper.oid));
        });
    }

    public start() {
        let self = this;
        self.confdata = self.config.load();
        self.initOperators();
        self._transporter = nodemailer.createTransport({
            host: this.confdata.email.host,
            port: this.confdata.email.port,
            secure: this.confdata.email.ssl,
            auth: {
                user: this.confdata.email.user,
                pass: this.confdata.email.password
            }
        });


        self.cards = self.loadCards(self.confdata.cardfile);
        self.showInTerminal('start', '*** The timer started ***');

        setTimeout(() => {
            self.readData(self, () => {
                self.loadApiData();
            });
        }, 1500);

        self.idtimer = setInterval(function () {
            self.eraseWnds(() => {
                self.readData(self, () => {
                    self.loadApiData();
                });
            });
        }, self.confdata.timeinterval * 1000);

    }

    protected loadApiData(callback?: CallbackFunction) {
        let self = this;
        self.operators.forEach((oper: any) => {
            oper.downloadData(self);
        });
        if (callback) callback();
    }

    public addWnd(wnd: NwJs.Window) {
        this._wnds.push(wnd);
    }

    public eraseWnds(next?: CallbackFunction) {
        let wnd: NwJs.Window;
        for (wnd of this._wnds) {
            if (wnd) {
                wnd.hide();
                wnd.close(true);
            }
        }
        this._wnds = [];
        if (next) next();
    }

    public readData(self: any, next?: CallbackFunction) {    
        let payment: any = null;
        let pid: string;
        let bfound = false;
        let nCountFin = 0;

        for (pid in self.payids.ids) {
            if (!self.payids.ids[pid].finished) nCountFin++;
        }

        for (pid in self.payids.ids) {
            if (!self.payids.ids[pid].finished && (pid !== self._lastPid || nCountFin===1 && !bfound)) {
                bfound = true;
                self._lastPid = pid;
                payment = self.payids.ids[pid];
                let paydata: PayData = {
                    id: Number(pid),
                    name: payment.operator,
                    coupon: payment.coupon,
                    telnum: payment.telnum,
                    nominal: payment.nominal,
                    confdata: self.confdata,
                    finish: false,
                    crtime: payment.crtime
                };
                let bfoundoper = false;
                self.payids.check(paydata, (expired: boolean) => {
                    //if (expired) self.emit('expired', paydata);
                    self.operators.forEach(function (op: any) {
                        if (op.getName() === payment.operator) {
                            bfoundoper = true;
                            return op.payment(self, paydata, next);
                        }
                    });
                    if (!bfoundoper && next) return next();
                });
                break;
            }
        }
        if (!bfound && next) return next();

    }

    public stop() {
        if (this.idtimer) {
            clearInterval(this.idtimer);
            this.payids.serialize();
            this.showInTerminal('stop', '*** The timer stoped ***');
            this.idtimer = null;
        }
    }

    protected loadCards(filename: string) {
        const DELIMITER = ';';
        let cards: ICard[] = [];
        try {
            let lines = fs.readFileSync(filename, 'utf8').split('\r\n');
            lines.map(function (line) {
                let fields = line.split(DELIMITER);
                let card: ICard = {
                    CreditCard: fields[0],
                    Owner: fields[1],
                    Expiration: fields[2].split('-'),
                    ValidationCode: fields[3]
                };
                cards.push(card);
            });
        } catch (e) {
        }
        return cards;
    }

    public getCardIndex(callback: CallbackFunction) {
        let self = this;
        self._micard
            .acquire()
            .then(release => {
                if (++self._icard >= self.cards.length) self._icard = 0;
                let index = self._icard;
                release();
                callback(index);
            });
    }

    protected sendMail(subject: string, message: string) {
        let self = this;
        self._transporter.sendMail({
            from: self.confdata.email.sendfrom,
            to: self.confdata.email.sendto,
            subject: subject,
            text: message,
            html: message
        }, function (err: any, data: string) {
            if (err) {
                self.showInTerminal('apidata', 'sendEmail:' + err);
            }
        });
    }

}

export class Config {
    constructor(
        protected gui: NwJs.NW
    ) { }

    public getFilename(): string {
        return path.join(this.gui.App.dataPath, 'charger.cfg')
    }

    public load() {
        let settingsFilename = this.getFilename();
        let contents: string;
        let cfg: any;

        try {
            contents = fs.readFileSync(settingsFilename, 'utf8');
        } catch (e) {
            contents = JSON.stringify({});
        }
        cfg = JSON.parse(contents);
        return cfg;
    }

    public save(contents?: string) {
        let settingsFilename = this.getFilename();
        try {
            if (!contents || contents == undefined || contents == '') {
                fs.unlinkSync(settingsFilename);
            } else {
                fs.writeFileSync(settingsFilename, contents);
            }
            alert('Content was stored.');

        } catch (e) { };
    }
}

export class PayIds {
    protected mutex: Mutex = new Mutex();
    protected ids: any;
    constructor(
        protected gui: NwJs.NW
    ) {
        this.deserialize();
    }

    public getFilename(): string {
        return path.join(this.gui.App.dataPath, 'chargerids.json')
    }

    public deserialize() {
        let contents: string;
        try {
            contents = fs.readFileSync(this.getFilename(), 'utf8') || "{}";
        } catch (e) {
            contents = "{}";
        }
        this.ids = JSON.parse(contents);
/*
        let self = this;
        self.ids = self.ids||{};

        this.mutex
            .acquire()
            .then(release => {
                let contents: string;
                try {
                    contents = fs.readFileSync(this.getFilename(), 'utf8') || "{}";
                    self.ids = JSON.parse(contents);
                } catch (e) { }
                release();
            });
            */
    }

    public sortProperties(obj: any, sortedBy: any, isNumericSort?: boolean, reverse?: boolean) {
        sortedBy = sortedBy || 1; // by default first key
        isNumericSort = isNumericSort || false; // by default text sort
        reverse = reverse || false; // by default no reverse

        let reversed = (reverse) ? -1 : 1;
        let sortable: any = [];
        for (var key in obj) {
            if ((new Date().getTime() - obj[key].crtime) / (1000 * 3600 * 24 * 30) <= 1) {
                if (obj.hasOwnProperty(key)) {
                    sortable.push([key, obj[key]]);
                }
            }
        }
        if (isNumericSort)
            sortable.sort(function (a: any, b: any) {
                return reversed * (a[1][sortedBy] - b[1][sortedBy]);
            });
        else
            sortable.sort(function (a: any, b: any) {
                var x = a[1][sortedBy].toLowerCase(),
                    y = b[1][sortedBy].toLowerCase();
                return x < y ? reversed * -1 : x > y ? reversed : 0;
            });

        let newobj:any = {};
        sortable.forEach(function (data:any) {
            newobj[data[0]] = data[1]
        });
        return newobj; // array in format [ [ key1, val1 ], [ key2, val2 ], ... ]
    }

    public serialize() {
        let self = this;
        let sortIds = this.sortProperties(self.ids, 'crtime', true);
        this.mutex
            .acquire()
            .then(release => {
                try {
                    fs.writeFileSync(this.getFilename(), JSON.stringify(sortIds));
                } catch (e) { };
                release();

                //fs.writeFile(self.getFilename(), JSON.stringify(sortIds), (err) => {
                //    //console.dir((sortIds));
                //    release();
                //});
            });

        //try {
        //    fs.writeFileSync(this.getFilename(), JSON.stringify(sortIds));
        //} catch (e) { };
    }

    public exists(paydata: PayData): boolean {
        return this.existId(paydata.id.toString());
    }

    public existId(id: string): boolean {
        try{
          return (this.ids[id] ? true : false);
        } catch(e){
            return false;
        }
    }

    protected newitem(paydata: PayData, fin: boolean) {
        return {
            operator: paydata.name,
            crtime: paydata.crtime,
            coupon: paydata.coupon,
            telnum: paydata.telnum,
            nominal: paydata.nominal,
            finished: fin
        }
    }

    public check(paydata: PayData, callback?: CallbackFunction): void {
        let id = paydata.id.toString();
        let expired: boolean = false;
        if (!this.isFinished(paydata)) {
            if (this.exists(paydata)) {
                if (this.isExpired(paydata)) {
                    delete this.ids[id];
                    expired = true;
                    this.serialize();
                } else
                    this.serialize();
            } else {
                if (this.isExpired(paydata)) {
                    expired = true;
                    this.serialize();
                } else {
                    this.ids= this.ids||{};
                    this.ids[id] = this.newitem(paydata, false);
                    this.serialize();
                }
            }
        } else {
            expired = true; 
            if (this.exists(paydata)) {
                if (this.isExpired(paydata)) {
                    delete this.ids[id];
                    this.serialize();
                    this.serialize();
                } else
                    this.serialize();
            }
        }
        this.ids= this.ids||{};
        if (callback) callback(expired);
    }

    public finish(paydata: PayData): void {
        let id = paydata.id.toString();
        if (this.exists(paydata)) {
            if (this.isExpired(paydata)) {
                delete this.ids[id];
            } else {
                this.ids[id].finished = true;
            }
        } else {
            this.ids[id] = this.newitem(paydata, true);
            this.ids[id].finished = true;
        }
        this.serialize();
    }

    public isExpired(paydata: PayData): boolean {
        let id = paydata.id.toString();
        if (this.exists(paydata)) {
            if ((new Date().getTime() - this.ids[id].crtime) / (1000 * 3600 * 24 * 30) > 1) {
                return true;
            } else {
                return false;
            }
        } else {
            if ((new Date().getTime() - paydata.crtime) / (1000 * 3600 * 24 * 30) > 1) {
                return true;
            } else {
                return false;
            }
        }
    }

    public isFinished(paydata: PayData): boolean {
        let id = paydata.id.toString();
        if (this.exists(paydata)) {
            return this.ids[id].finished;
        } else {
            return false;
        }
    }

    public load() {
        this.deserialize();
        return this.ids;
    }

    public save(contents?: string) {
        let filename = this.getFilename();
        //this.mutex
        //    .acquire()
        //    .then(release => {
        //        try {
        //            if (!contents || contents == undefined || contents == '') {
        //                fs.unlinkSync(filename);
        //            } else {
        //                fs.writeFileSync(filename, contents);
        //            }
        //            //alert('Content was stored.');

        //        } catch (e) { };
        //        release();
        //    });

        try {
            if (!contents || contents == undefined || contents == '') {
                fs.unlinkSync(filename);
            } else {
                fs.writeFileSync(filename, contents);
            }
            //alert('Content was stored.');

        } catch (e) {
            alert('Write error.');
        };


    }

}

export class Datalog {
    protected mutex: Mutex = new Mutex();
    protected logrows: number = 100;

    constructor(
        protected gui: NwJs.NW,
    ) { }

    public getFilename(): string {
        return path.join(this.gui.App.dataPath, 'charger.log')
    }

    public readLog(): string {
        try {
            return fs.readFileSync(this.getFilename(), 'utf8');
        } catch (e) {
            return "";
        }
    }

    public write(txt: string) {
        let filename = this.getFilename();
        let content: string;
        let lines: string[];
        let self = this;

        this.mutex
            .acquire()
            .then(release => {
                fs.readFile(filename, (err, data) => {
                    if (err) content = "";
                    if (txt && txt !== undefined) {
                        content = (data ? data : "") + txt;
                    }

                    lines = content.split(/\r?\n/g);
                    let count = lines.length;

                    for (let n = count; n > 0; n--) {
                        if (n > self.logrows) lines.shift();
                    }
                    fs.writeFile(filename, (lines.length ? lines.join('\n') : ""), (err) => {
                        release();
                    });
                });
            });

    }
}



