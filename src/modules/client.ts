/// <reference path='../../typings/node/node.d.ts' />
import * as net from "net";
import events = require('events');

const DEVICE_TIMEOUT: number = 3000;
const STX: number   = 0x01;
const ETX: number   = 0x02;
const ACK: number   = 0x06;
const NAK: number   = 0x15;
const FS: number    = 0x16;
const CMD1: number  = 0x31;
const CMD2: number  = 0x32;

export type CallbackFunction = (...args: any[]) => void;

export interface IAxaDevice {
    port: number,
    ip?: string,
    sesid?: number,
    idTran?: number,
    idEFT: string,
    idTIL: string
}

export interface IAxaPack {
    cmd: string,
    srcid?: string,
    dstid?: string,
    sesid?: number,
    idTran?: number,
    data?: string | [string]
}

/*
process.on('unhandledRejection', function (err:Error) {
    throw err;
});

process.on('uncaughtException', function (err:Error) {
    //console.log(err);
});
*/

export class AxaPack implements IAxaPack {
    public cmd: string;
    public srcid?: string;
    public dstid?: string;
    public sesid?: number;
    public idTran?: number;
    public data?: string | [string];


    constructor(pack?: IAxaPack) {
        if (pack) {
            this.cmd = pack.cmd;
            this.srcid = pack.srcid;
            this.dstid = pack.dstid;
            this.sesid = pack.sesid;
            this.idTran = pack.idTran;
            this.data = pack.data;
            //console.log('pack.data: ',pack.data)
        }
    }

    public createBuffer(): Buffer {
        let databuf: Buffer = Buffer.alloc(46, ' ')
        let datapack: Buffer = new Buffer(0);

        if (this.data) {
            //console.log('data: ', this.data);
            if (this.data instanceof Array) {
                let bfrst: boolean = true;
                for (let item of this.data) {
                    if (bfrst) {
                        datapack = Buffer.from(item);
                    } else {
                        let buf = Buffer.alloc(item.length + 1);
                        buf[0] = 28;
                        buf.write(item, 1);
                        datapack = Buffer.concat([datapack, buf]);
                    }
                    bfrst = false;
                    //console.log('datapack: ', datapack.toString());
                }
            } else {
                datapack = Buffer.from(this.data);
                //console.log('datapack: ', datapack.toString());
            }
        }

        databuf[0] = 2;
        databuf.write(this.cmd, 1);
        databuf.write(this.srcid || '', 2);
        databuf.write(this.dstid || '', 18);
        databuf.write(this.sesid.toString(), 34 + 8 - this.sesid.toString().length);
        databuf.fill('0000', 42);


        if (datapack.length) {
            let len = datapack.length.toString();
            databuf.write(len, 42 + 4 - len.length);
            databuf = Buffer.concat([databuf, datapack]);
        }
        databuf = Buffer.concat([databuf, new Buffer(2)]);
        databuf[46 + datapack.length] = 3;
        let lrc: number = 0;
        let i: number;
        for (i = 0; i < 46 + datapack.length + 1; i++) {
            lrc = lrc ^ databuf[i];
        }
        databuf[46 + datapack.length + 1] = lrc;
        return databuf;
    }

    public bufferInfo(buf: Buffer) {
        let stx = buf[0]
            , cmd = String.fromCharCode(buf[1])
            , srcid = buf.toString('utf8', 2, 18).trim()
            , dstid = buf.toString('utf8', 18, 34).trim()
            , sesid = Number(buf.toString('utf8', 34, 42))
            , datalen = Number(buf.toString('ascii', 42, 46))
            , data:string = null
            , etx = buf[46 + datalen]
            , lrc = buf[46 + datalen + 1]
            ;
        if (datalen) {
            data = buf.toString('utf8', 46, 46 + datalen);
        }

        return {
            'stx': Number(stx),
            'cmd': cmd,
            'srcid': srcid,
            'dstid': dstid,
            'sesid': sesid,
            'datalen': datalen,
            'lrc': lrc,
            'data': data
        };
    }

}

export class AxaDevice extends events.EventEmitter implements IAxaDevice {
    private _socket: net.Socket;
    private _connected: boolean = false;
    private _retryCount = 0;
    private _callback: CallbackFunction = null;
    private _callData: CallbackFunction = null;

    public product: string;
    public appcode: string;
    public telnum: string;
    public operator: string;
    public nominal: string;

    public port: number;
    public ip: string;
    public sesid: number;
    public idTran: number;
    public idEFT: string;
    public idTIL: string;

    public debug: boolean = false;

    constructor(device: IAxaDevice) {
        super();

        this.port = device.port;
        this.ip = device.ip;
        this.sesid = device.sesid;
        this.idTran = device.idTran;
        this.idEFT = device.idEFT;
        this.idTIL = device.idTIL;

        if (!device.ip) this.ip = '127.0.0.1';
    };

    protected close() {
        this._callData = null;

        if (this._connected) {
            this._connected = false;
            this._socket.end();
        }
    }

    public request(fn:any) {
        let self = this;
        return function (...args: any[]) {
            let retryCount: number = 3;
            let failureReason: Error;
            let wait = function (duration: number) {
                return new Promise<void>((resolve) => {
                    setTimeout(resolve, duration)
                })
            }
            let functionToIterate = function (...args:any[]) {
                if (retryCount < 1) {
                    self.emit('error', 'Timeout!');
                    self.emit('finish', false);
                    return Promise.reject(new Error('Timeout!'));
                } else {
                    retryCount--;
                    return fn(...args)
                        .catch((err:Error) => {
                            self.emit('error', err.message);
                            failureReason = err;
                            return wait(DEVICE_TIMEOUT)
                                .then(() => {
                                    return functionToIterate(...args)
                                });
                        })
                }
            }
            return functionToIterate(...args);
        }
    };

    protected send(pack: AxaPack) {
        if (this.debug) {
            console.log('>>>');
            process.stdout.write(this.toHex(pack.createBuffer()));
        }

        if (!this._socket.write(pack.createBuffer())) {
            this.emit('error', 'No data send.');
        }
    }

    protected sendSTX() {
        let buf: Buffer = new Buffer(1);
        buf[0] = STX;
        this.rawSend(buf);
    }

    protected sendACK() {
        let buf: Buffer = new Buffer(1);
        buf[0] = ACK;
        this.rawSend(buf);
    }

    protected rawSend(buf: Buffer) {
        if (this.debug) {
            console.log('>>>');
            process.stdout.write(buf);
        }

        if (!this._socket.write(buf)) {
            this.emit('error', 'No data send.');
        }
    }

    protected createSocket(callback: CallbackFunction) {
        let self = this;
        return this.request(function () {
            return new Promise<void>(function (resolve, reject) {
                let newSocket = function (callback: CallbackFunction) {
                    self._socket = net.connect({
                        host: self.ip,
                        port: self.port
                    }, () => {
                        self._connected = true;
                        self.emit('connect', 'Connected.');
                        callback();
                    }).on('data', function (data: Buffer) {
                        if (self._callData) {
                            if (self.debug) {
                                console.log('<<<');
                                process.stdout.write(self.toHex(data));
                            }
                            self._callData(data);
                        }
                    }).on('error', function (err) {
                        let msg: string = err.message;
                        self._socket.destroy();
                        self._connected = false;
                        self.emit('error', msg);
                        if (msg.indexOf('ECONNREFUSED') !== -1) {
                            self._socket.destroy();
                            if (self._retryCount++ < 3) {
                                return setTimeout(() => {
                                    newSocket(callback);
                                }, DEVICE_TIMEOUT);
                            } else {
                                self.emit('finish', false);
                            }
                            return resolve();
                        } else return reject();
                    }).on('disconnect', function () {
                        self._connected = false;
                        self.emit('error', "[CONNECTION] disconnected!");
                        return reject();
                    });
                }
                try {
                    newSocket(callback);
                } catch (err) {
                    self.emit('error', err.message);
                    return reject();
                }
            });

        })();
    };

    protected sessionStart(callback: CallbackFunction) {
        this._callback = callback;
        this._callData = this._sessionStart;
        if (this.debug) console.log('sessionStart');
        this.send(new AxaPack({
            cmd: 'O',
            srcid: this.idTIL,
            dstid: this.idEFT,
            sesid: this.sesid,
            idTran: this.idTran,
        }));
    }

    private _sessionStart(data: Buffer) {
        if (this.debug) console.log('_sessionStart', data.toString());
        if (this._callback) {
            if (data[0] === ACK) {
                this._callback(true);
            } else {
                this.emit('error', 'Bad ACK.');
                this._callback(false);
            }
        }
    }

    protected badACK() {
        this.sendACK();
        this.emit('error', 'Bad ACK.');
        this.emit('finish', false);
        this._callback(false);
    }

    protected avas(callback: CallbackFunction) {
        this._callback = callback;
        this._callData = function (data: Buffer) {
            if (this._callback) {
                if (data[0] === ACK) {
                    this._callData = function (data: Buffer) {
                        if (this._callback) {
                            if (data[0] === ETX && data[1] === CMD2) {
                                this.sendACK();
                                this._callData = function (data: Buffer) {
                                    if (data[0] === ETX && data[57] == 0x0042) {
                                        this.sendACK();
                                        this._callback(true);
                                    } else {
                                        this.badACK();
                                    }
                                }
                            } else {
                                this.badACK();
                            }
                        }
                    };
                } else {
                    this.badACK();
                }
            }

        };
        if (this.debug) console.log('avas');
        this.send(new AxaPack({
            cmd: '0',
            srcid: this.idTIL,
            dstid: this.idEFT,
            sesid: this.sesid,
            idTran: this.idTran,
            data: [
                'V0' + ('00000' + this.idTran).slice(-5),
                ('E' + this.product).replace('\u001c', ''),
            ]

        }));
    }

    protected payment(callback: CallbackFunction) {
        this._callback = callback;
        this._callData = function (data: Buffer) {
            if (this._callback) {
                if (data[0] === ACK) {
                    this._callData = function (data: Buffer) {
                        if (data[0] === ETX && data[1] === CMD2) {
                            this.sendACK();
                            this._callData = function (data: Buffer) {
                                if (data[0] === ETX && data[1] === CMD2) {
                                    this.sendACK();
                                    this._callData = function (data: Buffer) {
                                        if (data[0] === ETX && data[55] == 0x0053) {
                                            //if (data[0] === ETX && data[1] === CMD2) {
                                            this.sendACK();
                                            this._callData = function (data: Buffer) {
                                                if (data[0] === ETX && data[1] === CMD2) {
                                                    this.sendACK();
                                                    this._callData = function (data: Buffer) {
                                                        if (data[0] === ETX && data[1] === CMD1) {
                                                            this.sendACK();
                                                            this._callback(true);
                                                        } else {
                                                            this.badACK();
                                                        }
                                                    }
                                                } else {
                                                    this.badACK();
                                                }
                                            }
                                        } else {
                                            this.badACK();
                                        }
                                    }
                                } else {
                                    this.badACK();
                                }
                            }
                        } else {
                            this.badACK();
                        }
                    };
                } else {
                    this.badACK();
                }
            }
        };
        if (this.debug) console.log('avas');
        this.send(new AxaPack({
            cmd: '0',
            srcid: this.idTIL,
            dstid: this.idEFT,
            sesid: this.sesid,
            idTran: this.idTran,
            data: [
                'P0' + ('00000' + this.idTran).slice(-5),
                ('B' + this.nominal).replace('\u001c', ''),
            ]

        }));
    }

    protected sessionClose() {
        this._callData = this.close;
        this.send(new AxaPack({
            cmd: 'C',
            srcid: this.idTIL,
            dstid: this.idEFT,
            sesid: this.sesid,
        }));
    }

    public run(sessid: number, tranx: number) {
        this.idTran = tranx;
        this.sesid = sessid;
        //this.product = '8586011110225';
        //this.appcode = '123456';
        //this.telnum = '0907578609';
        //this.operator = 'Orange';
        //this.nominal = '1200';

        this.createSocket(() => {
            this.sessionStart((ok: boolean) => {
                if (ok) {
                    this.avas((ok: boolean) => {
                        if (ok) {
                            // credit recharged
                            this.payment((ok: boolean) => {
                                if (ok) {
                                    // paid
                                    this.sessionClose();
                                    this.emit('finish', true);
                                } else return this.sessionClose();
                            });
                        } else return this.sessionClose();
                    });
                } else return this.sessionClose();
            });
        });
    }

    protected toHex(buffer: Buffer): string {
        let zero = function (n: any, max: number) {
            n = n.toString(16).toUpperCase();
            while (n.length < max) {
                n = '0' + n;
            }
            return n;
        };
        let rows = Math.ceil(buffer.length / 16);
        let last = buffer.length % 16 || 16;
        let offsetLength = buffer.length.toString(16).length;
        if (offsetLength < 6) offsetLength = 6;

        let str = 'Offset';
        while (str.length < offsetLength) {
            str += ' ';
        }

        str = '\u001b[36m' + str + '  ';

        let i: number;
        for (i = 0; i < 16; i++) {
            str += ' ' + zero(i, 2);
        }

        str += '\u001b[0m\n';
        //if (buffer.length) str += '\n';

        let b = 0;
        let lastBytes:number;
        let lastSpaces: number;
        let v: number;

        for (i = 0; i < rows; i++) {
            str += '\u001b[36m' + zero(b, offsetLength) + '\u001b[0m  ';
            lastBytes = i === rows - 1 ? last : 16;
            lastSpaces = 16 - lastBytes;

            let j: number;
            for (j = 0; j < lastBytes; j++) {
                str += ' ' + zero(buffer[b], 2);
                b++;
            }

            for (j = 0; j < lastSpaces; j++) {
                str += '   ';
            }

            b -= lastBytes;
            str += '   ';

            for (j = 0; j < lastBytes; j++) {
                v = buffer[b];
                str += (v > 31 && v < 127) || v > 159 ? String.fromCharCode(v) : '.';
                b++;
            }

            str += '\n';
        }
        str += '\n';
        return str;
    }

}

/*
let sessid: number = 2;
let tranx: number = 17920;

let device = new AxaDevice({ port: 15000, idEFT: 'POS001', idTIL: 'TIL001' })
    .on('connect', (msg:string) => {
    })
    .on('error', (msg:string) => {
        console.log('ERROR', msg);
    })
    .on('finish', (ok: boolean) => {
        console.log('FINISH', ok);
    })
    ;
device.debug = true;
device.run(sessid, tranx);
*/