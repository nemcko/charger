import { Operator, PayData, LoadPageFunction, ICard, CallbackFunction, watch } from './base';
import { Charger } from '../main';
import { KbEvents } from '../keyboard';

declare var async: any;

export class OperJuro extends Operator {
    constructor(charger: Charger, gui: NwJs.NW, oid: string) {
        super(charger, gui, oid);
        this.name = 'Juro';
        this.url = 'https://www.juro.sk/dobit-kredit-karta';
        this.prefix = ['0909'];
    }

    public loadPage = (paydata: PayData, callback: CallbackFunction) => {
        let self = this;
        let nominals = ['3', '4', '5', '6', '7', '8', '9', '10'];

        if (!self.running) {
            self.running = true;

            if (nominals.indexOf(paydata.nominal) == -1) return self.emit('fatal error', paydata, '***bad credit value ');

            let cookie:string = "";
            async.series([
                (next: CallbackFunction) => {
                    self.waitForText('body > div.container-cr > div > div > div.col-md-6.col-sm-12 > div > form > h2', (val) => {
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
                    self.keyboard.wvVal(
                        `document.cookie`,
                    ).then((ret) => {
                        cookie = ret[0];
                        next();
                    })
                },
                (next: CallbackFunction) => {
                    self.keyboard.wvVal(
                        `document.querySelector("body > div.container-cr > div > div > div.col-md-6.col-sm-12 > div > form").target='_self'`,
                    ).then((ret) => {
                        next();
                    })
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
                        .batchTypeKey('tab', 100)
                        .batchTypeKey('tab', 100)
                        .batchTypeKey('tab', 100)
                        .batchTypeKey('tab', 100)
                        .batchTypeKey('tab', 100)
                        .batchTypeKey('tab', 100)
                        .batchTypeText(paydata.telnum, 100)
                        .batchTypeKey('tab', 100)
                        .batchTypeText(paydata.nominal, 100)
                        .batchTypeKey('tab', 100)
                        .batchTypeKey('enter', 1000)
                        .sendBatch()
                        .then(() => {
                            next()
                        });
                },
                //(next: CallbackFunction) => {
                //    next();
                //},
                (next: CallbackFunction) => {
                    self.keyboard.sleep(1000).then(next);
                },
                (next: CallbackFunction) => {
                    self.payCard(paydata, (err) => {
                        next();
                    });
                    next();
                },
         
            ], (err: string, results: any) => {
                self.nextPage = null;

                if (callback) callback();
            });
        }
    }

    //public loadPage2 = (paydata: PayData, callback: CallbackFunction) => {
    //    let self = this;

    //    if (!self.running) {
    //        self.running = true;
    //        console.log('loadPage2');

    //        async.series([
    //            (next: CallbackFunction) => {
    //                self.keyboard.wvVal(
    //                    `document.getElementById("box-3d-secure-logos").innerHTML`,
    //                ).then((ret) => {
    //                    next(ret[0]?null:'Bad data');
    //                })
    //            },
    //            (next: CallbackFunction) => {
    //                self.payCard(paydata, (err) => {
    //                    next();
    //                });
    //                next();
    //            },
    //        ], (err: string, results: any) => {
    //            self.nextPage = null;
    //            this.url = 'https://www.juro.sk/dobit-kredit-karta';
    //            if (callback) callback();
    //        });
    //    }
    //}

}