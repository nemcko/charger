import { Operator, PayData, LoadPageFunction, ICard, CallbackFunction, watch } from './base';
import { Charger } from '../main';
import { KbEvents } from '../keyboard';

declare var async: any;

export class OperFunfon extends Operator {
    constructor(charger: Charger, gui: NwJs.NW, oid: string) {
        super(charger, gui, oid);
        this.name = 'FunFon';
        this.url = 'https://www.funfon.sk/mam-kartu/dobit-kredit/';
        this.prefix = ['0919'];
    }

    public loadPage = (paydata: PayData, callback: CallbackFunction) => {
        let self = this;
        let nominals = ['3', '5', '7', '10', '13', '15', '20', '30', '40', '50', '55', '60'];

        if (!self.running) {
            self.running = true;

            if (nominals.indexOf(paydata.nominal) == -1) return self.emit('fatal error', paydata, '***bad credit value ');

            async.series([
                (next: CallbackFunction) => {
                    self.waitForText('#msisdnForm > div', (val) => {
                        if (val)
                            next();
                        else
                        {
                            let msg = '***Timeout';
                            self.emit('problem', msg);
                            next(msg);
                        }                        
                    });
                },

                (next: CallbackFunction) => {
                    self.keyboard.startBatch()
                        .batchTypeKey('tab', 100)
                        .batchTypeKey('tab', 100)
                        .batchTypeKey('tab', 100)
                        .batchTypeKey('tab', 100)
                        .batchTypeKey('tab', 100)
                        .batchTypeKey('tab', 100)
                        .batchTypeKey('tab', 100)
                        .batchTypeKey('tab', 100)
                        .batchTypeKey('tab', 100)
                        .sendBatch()
                        .then(() => {
                            next()
                        });
                },
                (next: CallbackFunction) => {
                    self.keyboard.wvExec(
                        `wv.id('MSISDN').focus();`,
                    ).then(s => next())
                },

                (next: CallbackFunction) => {
                    self.keyboard.startBatch()
                        //.batchTypeKey('tab', 100)
                        //.batchTypeKey('tab', 100)
                        //.batchTypeKey('tab', 100)
                        //.batchTypeKey('tab', 100)
                        //.batchTypeKey('tab', 100)
                        //.batchTypeKey('tab', 100)
                        //.batchTypeKey('tab', 100)
                        //.batchTypeKey('tab', 100)
                        //.batchTypeKey('tab', 100)
                        .batchTypeText(paydata.telnum, 1500)
                        .sendBatch()
                        .then(() => {
                            self.keyboard.wvVal(
                                `document.querySelector('#msisdnForm > div > div.col-sm-7.has-error > p').innerHTML`,
                            ).then((ret) => {
                                if (ret[0]) {
                                    let msg = '***Bad tel.number';
                                    self.emit('fatal error', paydata, msg);
                                    self.close();
                                    return next(msg);
                                } 
                                next()
                            })
                        });
                },         
                (next: CallbackFunction) => {
                    self.keyboard.sendKey('tab');
                    self.keyboard.sleep(650).then(() => {

                        let count = 0
                          , num = nominals.indexOf(paydata.nominal) + 1
                          ;
                        async.during(
                            function (cb: CallbackFunction) {
                                return cb(null, count < num);
                            },
                            function (cb: CallbackFunction) {
                                count++;
                                self.keyboard.sendKey('right');
                                setTimeout(cb, 250);
                            },
                            function (err: any) {
                                next();
                            }
                        );
                    });
                },
                (next: CallbackFunction) => {
                    self.keyboard.sleep(1000).then(next);
                },
                (next: CallbackFunction) => {
                    self.keyboard.startBatch()
                        .batchTypeKey('tab', 250)
                        .batchTypeKey('space',750)
                        .batchTypeText('p')
                        .batchTypeKey('enter', 1000)
                        .sendBatch()
                        .then(() => {
                            next()
                        });
                },
                (next: CallbackFunction) => {
                    self.keyboard.wvExec(
                        `wv.id('submit').focus();`,
                    ).then(s => next())
                },
                (next: CallbackFunction) => {
                    self.keyboard.sendKey('enter').then(() => {
                        next()
                    });
                },
                (next: CallbackFunction) => {
                    self.payCard(paydata, (err) => {
                        next();
                    });
                },
            ], (err: string, results: any) => {
                self.nextPage = null;
                if (callback) callback();
            });
        }







/*
        //setTimeout(function () {
            if (self.wnd && self.wnd.window.document.getElementById('MSISDN')) {
                self.wnd.window.document.getElementById('MSISDN').focus();
                self.charger.keySender.sendText(paydata.telnum).then(() => {
                    let inom = nominals.indexOf(paydata.nominal);
                    if (inom >= 0) {
                        if (self.wnd.window.document) {
                            self.wnd.window.document.getElementById('x_id_credit').focus();
                            self.charger.keySender.startBatch()
                                .batchTypeKey('space')
                                .batchTypeText(paydata.nominal)
                                .batchTypeKey('enter')
                                .sendBatch()
                                .then(() => {
                                    self.wnd.window.document.getElementById('BANK').focus();
                                    self.charger.keySender.sendKey('right').then(() => {
                                        self.wnd.window.document.getElementById('submit').focus();
                                        self.charger.keySender.sendKey('enter').then(() => {
                                            return self.payCard(paydata, next);
                                        });
                                    });
                                });
                        } else {
                            if (next) next();
                        }
                    } else {
                        self.close();
                        self.emit('fatal error', paydata, '***bad credit value ');
                        next();
                    }
                });
            } else {
                //self.close();
                //return self.emit('error', paydata, 'bad page input');
                next();
            };
        //}, 2000);
*/
    }
}