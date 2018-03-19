import { Operator, PayData, LoadPageFunction, ICard, CallbackFunction, watch } from './base';
import { Charger } from '../main';
import { KbEvents } from '../keyboard';

declare var async: any;

export class Oper4ka extends Operator {
    constructor(charger: Charger, gui: NwJs.NW, oid: string) {
        super(charger, gui, oid);
        this.name = '4ka';
        this.url = 'https://epay.orange.sk/pir/pir';
        this.prefix = ['0950'];
    }

    public loadPage = (paydata: PayData, callback: CallbackFunction) => {
        let self = this;
        let nominals = ['3', '4', '5', '6', '7', '8', '9', '10'];

        if (!self.running) {
            self.running = true;

            if (nominals.indexOf(paydata.nominal) == -1) return self.emit('fatal error', paydata, '***bad credit value ');

            async.series([
                //(next: CallbackFunction) => {
                //    self.openPageWindow(self.newurl, paydata, next);
                //},
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
    }

}