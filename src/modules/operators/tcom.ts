import { Operator, PayData, LoadPageFunction, ICard, CallbackFunction, watch } from './base';
import { Charger } from '../main';
import { KbEvents } from '../keyboard';

declare var async: any;


export class OperTcom extends Operator {
    constructor(charger: Charger, gui: NwJs.NW, oid: string) {
        super(charger, gui, oid);
        this.name = 'T-Com';
        this.url = 'https://www.telekom.sk/internetove-dobijanie-karta';
        this.prefix = ['0901', '0902', '0903', '0904', '0910', '0911', '0912', '0914'];
    }

    public loadPage = (paydata: PayData, callback: CallbackFunction) => {
        let self = this;
        let nominals = ['7', '10', '12', '16', '25', '50'];

        if (!self.running) {
            self.running = true;

            if (nominals.indexOf(paydata.nominal) == -1) return self.emit('fatal error', paydata, '***bad credit value ');


            async.series([
                //(next: CallbackFunction) => {
                //    self.keyboard.sleep(2500).then(next);
                //},
                (next: CallbackFunction) => {
                    self.waitForText('#portlet_56_INSTANCE_TEAfGy6X2oec > div > div > div > div.journal-content-article.waterbear-theme > div > h1', (val) => {
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
                        .batchTypeKey('tab')
                        .batchTypeKey('tab')
                        .batchTypeKey('tab')
                        .batchTypeKey('tab')
                        .batchTypeKey('tab')
                        .batchTypeKey('tab')
                        .batchTypeKey('tab')
                        .batchTypeKey('tab')
                        .batchTypeText(paydata.telnum)
                        .batchTypeKey('tab')
                        .batchTypeText(paydata.nominal)
                        .batchTypeKey('enter')
                        .batchTypeKey('tab', 500)
                        .batchTypeKey('space')
                        .sendBatch()
                        .then(() => {
                            next()
                        });
                },
                (next: CallbackFunction) => {
                    async.race([
                        (cb: CallbackFunction) => {
                            async.until(
                                () => { return self.newurl; },
                                (cb2: CallbackFunction) => {
                                    setTimeout(cb2, 4000);
                                },
                                cb
                            )
                        },
                        (cb: CallbackFunction) => {
                            setTimeout(function () {
                                cb(null, 'two');
                            }, 6000);
                        }
                    ], (err: string, result: any) => {
                        next();
                    });
                },

            ], (err: string, results: any) => {
                if (err) {
                    self.nextPage = null;
                } else {
                    if (self.newurl) {
                        self.url = self.newurl;
                        self.nextPage = self.loadPage2;
                    } else {
                        let msg = '***Bad tel.number';
                        self.nextPage = null;
                        self.emit('fatal error', paydata, msg);
                        self.close();
                    }
                }
                if (callback) callback();
            });
        }
    }

    public loadPage2 = (paydata: PayData, callback: CallbackFunction) => {
        let self = this;

        if (!self.running) {
            self.running = true;
            //console.log('loadPage2');

            async.series([
                (next: CallbackFunction) => {
                    self.keyboard.startBatch()
                        .batchTypeKey('tab')
                        .batchTypeKey('tab')
                        .sendBatch()
                        .then(() => {
                            next()
                        });
                },
                (next: CallbackFunction) => {
                    self.payCard(paydata, (err) => {
                        next();
                    });
                    next();
                },
            ], (err: string, results: any) => {
                self.nextPage = null;
                this.url = 'https://www.telekom.sk/internetove-dobijanie-karta';
                if (callback) callback();
            });
        }
    }
}







/*
        if (self.wnd.window
            && self.wnd.window.document.getElementsByTagName('iframe')
            && self.wnd.window.document.getElementsByTagName('iframe').length
            && self.wnd.window.document.getElementsByTagName('iframe')[0]
            && self.wnd.window.document.getElementsByTagName('iframe')[0].contentWindow
            && self.wnd.window.document.getElementsByTagName('iframe')[0].contentWindow.angular.element
            && self.wnd.window.document.getElementsByTagName('iframe')[0].contentWindow.angular.element('#iReloadApp form input')) {
            let inputs = self.wnd.window.document.getElementsByTagName('iframe')[0].contentWindow.angular.element('#iReloadApp form input');
            let inom = nominals.indexOf(paydata.nominal);
            if (inom >= 0) {

                if (inputs && inputs[0] && self.wnd.window.document.getElementsByTagName('iframe')[0].contentWindow.angular.element) {
                    inputs[0].focus();
                    self.charger.keySender.startBatch()
                        .batchTypeText(paydata.telnum)
                        .batchTypeKey('tab')
                        .batchTypeText(paydata.nominal)
                        .batchTypeKey('tab')
                        .batchTypeKey('enter')
                        .batchTypeKey('tab')
                        .sendBatch()
                        .then(() => {
                            if (self.wnd.window
                                && self.wnd.window.document.getElementsByTagName('iframe').length
                                && self.wnd.window.document.getElementsByTagName('iframe')[0].contentWindow.angular.element
                                && self.wnd.window.document.getElementsByTagName('iframe')[0].contentWindow.angular.element('#iReloadApp form a')) {
                                let href = self.wnd.window.document.getElementsByTagName('iframe')[0].contentWindow.angular.element('#iReloadApp form a')[0].href;
                                self.close();
                                if (href) {
                                    self.gui.Window.open(href, {
                                        new_instance: false,
                                        width: paydata.confdata.window_width,
                                        height: paydata.confdata.window_height,
                                        focus: true
                                    }, function (win: NwJs.Window) {
                                        //self.close();
                                        if (win) {
                                            self.charger.addWnd(win);
                                            self.wnd = win;
                                            self.wnd.on('loaded', function () {
                                                self.payCard(paydata,next);
                                            });
                                        } else {
                                            self.close();
                                            self.emit('error', paydata, 'win error');
                                            next();
                                        }
                                    });
                                } else {
                                    self.close();
                                    self.emit('error', paydata, 'address error');
                                    next();
                                }
                            } else {
                                self.close();
                                self.emit('error', paydata, 'win error');
                                next();
                            }
                        });
                } else {
                    self.close();
                    self.emit('error', paydata, 'bad input ');
                    next();
                }
            } else {
                self.close();
                self.emit('fatal error', paydata, '***bad credit value ');
                next();
            }
        } else {
            self.close();
            self.emit('error', paydata, 'bad page input');
            next();
        };
*/
