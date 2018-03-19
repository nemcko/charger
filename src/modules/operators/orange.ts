import { Operator, PayData, LoadPageFunction, ICard, CallbackFunction, watch } from './base';
import { Charger } from '../main';
import { KbEvents } from '../keyboard';

declare var async: any;

export class OperOrange extends Operator {
    constructor(charger: Charger, gui: NwJs.NW, oid: string) {
        super(charger, gui, oid);
        this.name = 'Orange';
        this.url = 'https://epay.orange.sk/pir/pir';
        this.prefix = ['0905', '0906', '0907', '0908', '0915', '0916', '0917', '0918', '0919'];
    }

    public loadPage = (paydata: PayData, callback: CallbackFunction) => {
        let self = this;
        let nominals = ['7', '10', '13', '15', '20', '30', '40', '50', '55', '60'];

        if (!self.running) {
            self.running = true;

            if (nominals.indexOf(paydata.nominal) == -1) return self.emit('fatal error', paydata, '***bad credit value ');

            async.series([
                //(next: CallbackFunction) => {
                //    self.keyboard.sleep(3000).then(next);
                //},
                //(next: CallbackFunction) => {
                //    self.keyboard.startBatch()
                //        .batchTypeKey('tab')
                //        .batchTypeText(paydata.telnum)
                //        .batchTypeKey('tab')
                //        .batchTypeKey('enter', 6000)
                //        .sendBatch()
                //        .then(() => {
                //            next()
                //        });
                //},
                //(next: CallbackFunction) => {
                //    self.keyboard.wvVal(
                //        `document.querySelector('#MSISDN').innerHTML`,
                //    ).then((ret) => {
                //        if (ret[0] !== null) {
                //            let msg = '***Bad tel.number';
                //            self.emit('fatal error', paydata, msg);
                //            self.close();
                //            return next(msg);
                //        }
                //        next()
                //    })
                //},



                (next: CallbackFunction) => {
                    self.waitForText('#form > div.ons_form_left_right > div.ons_form_right', (val) => {
                        if (val)
                            next();
                        else
                        {
                            let msg = '***Timeout';
                            self.emit('problem', msg);
                            self.close();
                            next(msg);
                        }                        
                    });
                },
                (next: CallbackFunction) => {
                    self.keyboard.startBatch()
                        .batchTypeKey('tab')
                        .batchTypeText(paydata.telnum)
                        .batchTypeKey('tab')
                        .batchTypeKey('enter')
                        .sendBatch()
                        .then(() => {
                            self.waitForText('#x_id_credit', (val) => {
                                if (val)
                                    next();
                                else
                                {
                                    let msg = '***Bad tel.number';
                                    self.emit('fatal error', paydata, msg);
                                    self.close();
                                    return next(msg);
                                }                        
                            });
                        });
                },





                (next: CallbackFunction) => {
                    self.keyboard.startBatch()
                        .batchTypeKey('tab')       
                        .batchTypeText(paydata.nominal)
                        .batchTypeKey('tab')
                        .batchTypeKey('enter')
                        .sendBatch()
                        .then(() => {
                            next()
                        });
                },
                (next: CallbackFunction) => {
                    self.keyboard.startBatch()
                        .batchTypeKey('tab')       
                        .batchTypeKey('down')
                        .batchTypeKey('down')
                        .batchTypeKey('down')
                        .batchTypeKey('down')
                        .batchTypeKey('tab')
                        .batchTypeKey('enter',500)
                        .sendBatch()
                        .then(() => {
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
        setTimeout(function () {
            let current: any;
            self.charger.keyboard.text(self.wnd, 'MSISDN', paydata.telnum, (err) => {
                if (err) return callback(err);
                self.charger.keyboard.getNext(self.wnd, 'MSISDN', (err, elem) => {
                    if (err) return callback(err);
                    elem.click();
                    setTimeout(() => {
                        self.charger.keyboard.getElement(self.wnd, 'x_id_credit', (err, elem) => {
                            if (err) return callback(err);
                            current = elem;
                            elem.selectedIndex = nominals.indexOf(paydata.nominal) + 1;
                            self.charger.keyboard.getNext(self.wnd, current, (err, elem) => {
                                if (err) return callback(err);
                                elem.click();
                                setTimeout(() => {
                                    self.charger.keyboard.getElement(self.wnd, 'form', (err, elem) => {
                                        if (err) return callback(err);
                                        elem.elements[0].checked = true;
                                        current = elem.elements[elem.elements.length - 1];
                                        self.charger.keyboard.getNext(self.wnd, current, (err, elem) => {
                                            if (err) return callback(err);
                                            elem.click();
                                            self.payCard(paydata, (err) => {
                                                callback(err);
                                            });
                                        });
                                    });
                                }, 1000);
                            });
                        });
                    }, 3000);
                });
            });
        });
*/



        //let current: any;
        //async.series([
        //    (next: CallbackFunction) => {
        //        self.charger.keyboard.text(self.wnd, 'MSISDN', paydata.telnum, next);
        //    },
        //    (next: CallbackFunction) => {
        //        self.charger.keyboard.getNext(self.wnd, 'MSISDN', (err, elem) => {
        //            if (err) return next(err);
        //            elem.click();
        //            next();
        //        });
        //    },
        //    (next: CallbackFunction) => {
        //        setTimeout(next, 3000);
        //    },
        //    ///////////////////////////////////////////////
        //    (next: CallbackFunction) => {
        //        self.charger.keyboard.getElement(self.wnd, 'x_id_credit', (err, elem) => {
        //            if (err) return next(err);
        //            current = elem;
        //            elem.selectedIndex = nominals.indexOf(paydata.nominal) + 1;
        //            next();
        //        });
        //    },
        //    (next: CallbackFunction) => {
        //        self.charger.keyboard.getNext(self.wnd, current, (err, elem) => {
        //            if (err) return next(err);
        //            elem.click();
        //            next();
        //        });
        //    },
        //    (next: CallbackFunction) => {
        //        setTimeout(next, 1000);
        //    },
        //    ///////////////////////////////////////////////
        //    (next: CallbackFunction) => {
        //        self.charger.keyboard.getElement(self.wnd, 'form', (err, elem) => {
        //            if (err) return next(err);
        //            elem.elements[0].checked = true;
        //            current = elem.elements[elem.elements.length - 1];
        //            next();
        //        });
        //    },
        //    (next: CallbackFunction) => {
        //        self.charger.keyboard.getNext(self.wnd, current, (err, elem) => {
        //            if (err) return next(err);
        //            elem.click();
        //            next();
        //        });
        //    },
        //    ///////////////////////////////////////////////

        //    (next: CallbackFunction) => {
        //        self.payCard(paydata, () => {
        //            next();
        //        });
        //    }
        //], (err: string, results: any) => {
        //    if (callback) callback();
        //});



/*
                self.charger.keySender.startBatch()
                    .batchTypeText(paydata.telnum)
                    .batchTypeKey('tab')
                    .batchTypeKey('enter', 3000)
                    .batchTypeKey('escape')
                    .sendBatch()
                    .then(() => {
                        let inom = nominals.indexOf(paydata.nominal);
                        if (self.wnd.window.document.getElementById('x_id_credit')) {
                            self.wnd.window.document.getElementById('x_id_credit').focus();
                            if (inom >= 0) {
                                self.charger.keySender.startBatch()
                                    .batchTypeText(paydata.nominal)
                                    .batchTypeKey('tab')
                                    .batchTypeKey('enter')
                                    .sendBatch()
                                    .then(() => {
                                        self.charger.keySender.startBatch()
                                            .batchTypeKey('tab')
                                            .batchTypeKey('space')
                                            .batchTypeKey('tab')
                                            .batchTypeKey('enter')
                                            .sendBatch()
                                            .then(() => {
                                                self.payCard(paydata,next);
                                            });
                                    });
                            } else {
                                self.close();
                                self.emit('fatal error', paydata, '***bad credit value ');
                                next();
                            }
                        } else {
                            //if (first) {
                            //    let oper = self.assignOperator('OperFunfon', paydata);
                            //    if (oper) {
                            //        oper.payment(paydata, false);
                            //    }
                            //} else {
                            //    self.close();
                            //    self.emit('fatal error', paydata, '***bad tel.number');
                            //};

                            //self.close();
                            //self.emit('fatal error', paydata, '***bad tel.number');
                            if (next) next();
                        };
                    });
            } else {
                //self.close();
                //self.emit('error', paydata, 'bad page input');
                if (next) next();
            }
        }, 200);
*/
        //setTimeout(function () {
        //    if (self.wnd
        //        && self.wnd.window
        //        && self.wnd.window.document
        //        && self.wnd.window.document.getElementById('MSISDN')
        //    ) {
        //        self.wnd.window.document.getElementById('MSISDN').focus();
        //        self.charger.keySender.startBatch()
        //            .batchTypeText(paydata.telnum)
        //            .batchTypeKey('tab')
        //            .batchTypeKey('enter', 3000)
        //            .batchTypeKey('escape')
        //            .sendBatch()
        //            .then(() => {
        //                let inom = nominals.indexOf(paydata.nominal);
        //                if (self.wnd.window.document.getElementById('x_id_credit')) {
        //                    self.wnd.window.document.getElementById('x_id_credit').focus();
        //                    if (inom >= 0) {
        //                        self.charger.keySender.startBatch()
        //                            .batchTypeText(paydata.nominal)
        //                            .batchTypeKey('tab')
        //                            .batchTypeKey('enter')
        //                            .sendBatch()
        //                            .then(() => {
        //                                self.charger.keySender.startBatch()
        //                                    .batchTypeKey('tab')
        //                                    .batchTypeKey('space')
        //                                    .batchTypeKey('tab')
        //                                    .batchTypeKey('enter')
        //                                    .sendBatch()
        //                                    .then(() => {
        //                                        self.payCard(paydata,next);
        //                                    });
        //                            });
        //                    } else {
        //                        self.close();
        //                        self.emit('fatal error', paydata, '***bad credit value ');
        //                        next();
        //                    }
        //                } else {
        //                    //if (first) {
        //                    //    let oper = self.assignOperator('OperFunfon', paydata);
        //                    //    if (oper) {
        //                    //        oper.payment(paydata, false);
        //                    //    }
        //                    //} else {
        //                    //    self.close();
        //                    //    self.emit('fatal error', paydata, '***bad tel.number');
        //                    //};

        //                    //self.close();
        //                    //self.emit('fatal error', paydata, '***bad tel.number');
        //                    if (next) next();
        //                };
        //            });
        //    } else {
        //        //self.close();
        //        //self.emit('error', paydata, 'bad page input');
        //        if (next) next();
        //    }



        //}, 200);

    }

}