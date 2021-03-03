const tls = require('tls');
const fs = require('fs');
const net = require('net');
const dgram = require('dgram');
const { hostname } = require('os');
const debug = require('debug')('syslog')

const PROTOCOLS = {
    TLS: 'tls',
    TLS4: 'tls4',
    TLS6: 'tls6',
    TCP: 'tcp',
    TCP4: 'tcp4',
    TCP6: 'tcp6',
    UDP: 'udp',
    UDP4: 'udp4',
    UDP6: 'udp6'
}

const FACILITIES = {
    LOCAL0: 16,
    LOCAL1: 17,
    LOCAL2: 18,
    LOCAL3: 19,
    LOCAL4: 20,
    LOCAL5: 21,
    LOCAL6: 22,
    LOCAL7: 23,
}

const SEVERITIES = {
    ALERT: 1,
    CRITICAL: 2,
    DEBUG: 7,
    EMERGENCY: 0,
    ERROR: 3,
    INFORMATIONAL: 6,
    NOTICE: 5,
    WARNING: 4,
}

const isObject = (value) => {
    return typeof value === 'object' && Array.isArray(value) === false
}

const parseStructuredData = (structuredData) => {
    let result = ''
    for (const id in structuredData) {
        if (isObject(structuredData[id]) === true) {
            result += `[${id}`
            for (const param in structuredData[id]) {
                result += ` ${param}="${structuredData[id][param]}"`
            }
            result += ']'
        }
    }
    return result.length === 0 ? '-' : result
}

class Appender {
    constructor(options) {
        // Certificates
        this.caPath = options.caPath ? options.caPath : '';
        this.certificatePath = options.certificatePath ? options.certificatePath : '';
        this.keyPath = options.keyPath ? options.keyPath : '';
        this.ca = this.caPath != '' ? fs.readFileSync(this.caPath) : false;
        this.cert = this.certificatePath ? fs.readFileSync(this.certificatePath) : false;
        this.key = this.keyPath != '' ? fs.readFileSync(this.keyPath) : false;

        // Host Details
        this.host = options.host ? options.host : "localhost";
        this.port = options.port ? options.port : 514;
        this.hostname = options.hostname ? options.hostname : hostname();
        this.rejectUnauthorized = options.rejectUnauthorized ? options.rejectUnauthorized : false;
        this.protocol = options.protocol ? options.protocol : '';

        // Appender Options
        this.defaultAppName = options.defaultAppName ? options.defaultAppName : 'syslog-tls-appender';
        this.defaultEol = options.defaultEol ? options.defaultEol : '\n';
        this.defaultFacility = options.defaultFacility ? options.defaultFacility : 'LOCAL0';
        this.defaultSeverity = options.defaultSeverity ? options.defaultSeverity : 'DEBUG';
        this.defaultStructuredData = options.defaultStructuredData ? options.defaultStructuredData : '-';
        this.defaultMsgId = options.defaultMsgId ? options.defaultMsgId : '-';
        this.bufferFile = options.bufferFile ? options.bufferFile : './buffer';

        this.client = false;
        this.buffer = [];
        this.serverConnected = false;
    }

    emptyBuffer() {
        return new Promise((resolve, reject) => {
            if (fs.existsSync(this.bufferFile) && this.serverConnected) {
                const fileBuffer = fs.readFileSync(this.bufferFile);
                if (fileBuffer.length) {
                    var options = {
                        ca: this.ca,
                        cert: this.cert,
                        family: 0,
                        host: this.host,
                        key: this.key,
                        port: this.port
                    }
                    // Switch to create socket
                    switch (this.protocol) {
                        case PROTOCOLS.TLS:
                            if (typeof checkServerIdentity === 'function') {
                                options.checkServerIdentity = checkServerIdentity
                            }
                            var socket = (0, tls.connect)(options);
                            break;
                        case PROTOCOLS.TLS4:
                            options.family = 4;
                            if (typeof checkServerIdentity === 'function') {
                                options.checkServerIdentity = checkServerIdentity
                            }
                            var socket = (0, tls.connect)(options);
                            break;
                        case PROTOCOLS.TLS6:
                            options.family = 6;
                            if (typeof checkServerIdentity === 'function') {
                                options.checkServerIdentity = checkServerIdentity
                            }
                            var socket = (0, tls.connect)(options);
                            break;
                        case PROTOCOLS.TCP:
                            var socket = (0, net.createConnection)(options);
                            break;
                        case PROTOCOLS.TCP4:
                            options.family = 4;
                            var socket = (0, net.createConnection)(options);
                            break;
                        case PROTOCOLS.TCP4:
                            options.family = 6;
                            var socket = (0, net.createConnection)(options);
                            break;
                        case PROTOCOLS.UDP:
                            var socket = dgram.createSocket({ type: 'udp6' });
                            break;
                        case PROTOCOLS.UDP4:
                            var socket = dgram.createSocket({ type: 'udp4' });
                            break;
                        case PROTOCOLS.UDP6:
                            var socket = dgram.createSocket({ ipv6Only: true, type: 'udp6' });
                            break;
                        default:
                            break;
                    }
                    // Switch to add listeners to socket
                    switch (this.protocol) {
                        case PROTOCOLS.TCP:
                        case PROTOCOLS.TCP4:
                        case PROTOCOLS.TCP6:
                        case PROTOCOLS.TLS:
                        case PROTOCOLS.TLS4:
                        case PROTOCOLS.TLS6:
                            socket.once('error', (err) => {
                                this.serverConnected = false;
                                debug('Unable to send buffer');
                                debug(err.message);
                                resolve(true);
                            })
                            socket.once('end', () => {
                                fs.truncate(this.bufferFile, 0, function (err) {
                                    if (err) debug(err.message);
                                    debug('Buffer file truncated.');
                                    resolve(true);
                                })
                            })
                            socket.once('connect', () => {
                                this.serverConnected = true;
                                socket.end(fileBuffer);
                            })
                            break;
                        case PROTOCOLS.UDP:
                        case PROTOCOLS.UDP4:
                        case PROTOCOLS.UDP6:
                            socket.send(fileBuffer, this.port, this.host, (err) => {
                                if (err) {
                                    this.serverConnected = false;
                                    debug(err.message);
                                    socket.close(resolve);
                                } else {
                                    this.serverConnected = true;
                                    fs.truncate(this.bufferFile, 0, function (err) {
                                        if (err) debug(err.message);
                                        debug('Buffer file truncated.');
                                        resolve(true);
                                        socket.close(resolve);
                                    })
                                }
                            });
                            break;
                        default:
                            resolve(true);
                            break;
                    }
                } else {
                    resolve(true);
                }
            } else {
                resolve(true);
            }
        })
    }

    writeToFile(msgParams) {
        if (msgParams.eol == this.defaultEol)
            msgParams.eol = '\n'

        let msgBuffer = this.rfc5424(msgParams);

        fs.appendFile(this.bufferFile, msgBuffer, function (err) {
            if (err) throw err;
            // debug(msgBuffer, 'Saved to file!');
        });
    }

    debug(params) {
        params.defaultSeverity = 'DEBUG';
        return this.sendMessage(params);
    }

    error(params) {
        params.defaultSeverity = 'ERROR';
        return this.sendMessage(params)
    }

    info(params) {
        params.defaultSeverity = 'INFORMATIONAL';
        return this.sendMessage(params)
    }

    alert(params) {
        params.defaultSeverity = 'ALERT';
        return this.sendMessage(params)
    }

    warn(params) {
        params.defaultSeverity = 'WARNING';
        return this.sendMessage(params)
    }

    rfc5424({ appName, eol, facility, hostname, message, msgId, procId, severity, structuredData, timestamp }) {
        var facility = FACILITIES[facility.toUpperCase()] ? FACILITIES[facility.toUpperCase()] : FACILITIES.LOCAL0;
        var severity = SEVERITIES[severity.toUpperCase()] ? SEVERITIES[severity.toUpperCase()] : SEVERITIES.DEBUG;
        if (isObject(structuredData) === true) {
            structuredData = parseStructuredData(structuredData);
        }
        const priority = Math.imul(facility, 8) + severity;
        return Buffer.from(`<${priority}>1 ${timestamp} ${hostname} ${appName} ${procId} ${msgId} ${structuredData} ${message}${eol}`)
    }

    /**
     * rfc5425 is used over TLS Protocol
     * @param {Object} { defaultAppName, defaultEol, defaultFacility, defaultHostname, defaultMsgId, defaultProcId, defaultSeverity, defaultStructuredData, ca, cert, message, checkServerIdentity, family, host, key, port }
     * @returns {Promise} Promise
     */
    rfc5425({
        defaultAppName,
        defaultEol,
        defaultFacility,
        defaultHostname,
        defaultMsgId,
        defaultProcId,
        defaultSeverity,
        defaultStructuredData,
        ca,
        cert,
        message,
        checkServerIdentity,
        family,
        host,
        key,
        port,
    }) {
        var appName = defaultAppName,
            eol = defaultEol,
            facility = defaultFacility,
            hostname = defaultHostname,
            msgId = defaultMsgId,
            procId = defaultProcId,
            severity = defaultSeverity,
            structuredData = defaultStructuredData,
            timestamp = new Date().toISOString();

        return new Promise((resolve, reject) => {
            const msgParams = { appName, eol, facility, hostname, message, msgId, procId, severity, structuredData, timestamp };
            const options = { ca, cert, family, host, key, port }
            if (typeof checkServerIdentity === 'function') {
                options.checkServerIdentity = checkServerIdentity
            }
            const socket = (0, tls.connect)(options);
            socket.once('error', (err) => {
                this.serverConnected = false;
                debug(err.message);
                this.writeToFile(msgParams);
                reject(err);
            })
            socket.once('end', resolve)
            socket.once('connect', () => {
                this.serverConnected = true;
                this.emptyBuffer()
                    .then(() => {
                        socket.end(this.rfc5424(msgParams));
                    })
                    .catch(err => {
                        debug(err.message);
                        reject(err);
                    });
            })
        })
    }

    /**
     * rfc6587 is used over TCP Protocol
     * @param {Object} { ca, cert, checkServerIdentity, defaultAppName, defaultEol, defaultFacility, defaultHostname, defaultMsgId, defaultProcId, defaultSeverity, defaultStructuredData, message, host, port, key, protocol }
     * @returns {Promise} Promise
     */
    rfc6587({
        defaultAppName,
        defaultEol,
        defaultFacility,
        defaultHostname,
        defaultMsgId,
        defaultProcId,
        defaultSeverity,
        defaultStructuredData,
        family,
        message,
        host,
        port,
    }) {
        var appName = defaultAppName,
            eol = defaultEol,
            facility = defaultFacility,
            hostname = defaultHostname,
            msgId = defaultMsgId,
            procId = defaultProcId,
            severity = defaultSeverity,
            structuredData = defaultStructuredData,
            timestamp = new Date().toISOString();

        return new Promise((resolve, reject) => {
            var msgParams = { appName, eol, facility, hostname, message, msgId, procId, severity, structuredData, timestamp };
            var options = { family, host, port };
            var socket = (0, net.createConnection)(options);
            socket.once('error', (err) => {
                this.serverConnected = false;
                debug(err.message);
                this.writeToFile(msgParams);
                reject(err);
            })
            socket.once('end', resolve)
            socket.once('connect', () => {
                this.serverConnected = true;
                this.emptyBuffer()
                    .then(() => {
                        socket.end(this.rfc5424(msgParams));
                    })
                    .catch(err => {
                        debug(err.message);
                        reject(err);
                    });
            })
        })
    }

    /**
     * rfc5426 is used over UDP Protocol
     * @param {Object} { ca, cert, checkServerIdentity, defaultAppName, defaultEol, defaultFacility, defaultHostname, defaultMsgId, defaultProcId, defaultSeverity, defaultStructuredData, message, host, port, key, protocol }
     * @returns {Promise} Promise
     */
    rfc5426({
        defaultAppName,
        defaultEol,
        defaultFacility,
        defaultHostname,
        defaultMsgId,
        defaultProcId,
        defaultSeverity,
        defaultStructuredData,
        family,
        host,
        port,
        message
    }) {
        return new Promise((resolve, reject) => {
            var appName = defaultAppName,
                eol = defaultEol,
                facility = defaultFacility,
                hostname = defaultHostname,
                msgId = defaultMsgId,
                procId = defaultProcId,
                severity = defaultSeverity,
                structuredData = defaultStructuredData,
                timestamp = new Date().toISOString();

            this.emptyBuffer().then(() => {}).catch(err => {
                debug(err.message);
                reject(err);
            }).then(()=>{
                var msgParams = { appName, eol, facility, hostname, message, msgId, procId, severity, structuredData, timestamp };
                var options = {
                    0: { type: 'udp6' },
                    4: { type: 'udp4' },
                    6: { ipv6Only: true, type: 'udp6' }
                }
                var socket = dgram.createSocket(options[family]);
                socket.send(this.rfc5424(msgParams), port, host, (err) => {
                    if (err) {
                        this.serverConnected = false;
                        debug(err.message);
                        this.writeToFile(msgParams);
                        reject(err);
                    } else {
                        this.serverConnected = true;
                        resolve(true);
                    }
                    socket.close();
                });
            })
        });
    };

    /**
     * sendMessage method is used to send messages over tls socket if connected
     * If the socket is not connected then it is stored in buffer.
     * @param {Object} { ca, cert, checkServerIdentity, defaultAppName, defaultEol, defaultFacility, defaultHostname, defaultMsgId, defaultProcId, defaultSeverity, defaultStructuredData, message, host, port, key, protocol }
     * @returns {Promise} Promise
     */
    sendMessage({
        ca = this.ca,
        cert = this.cert,
        checkServerIdentity,
        defaultAppName = this.defaultAppName,
        defaultEol = this.defaultEol,
        defaultFacility = this.defaultFacility,
        defaultHostname = hostname(),
        defaultMsgId = this.defaultMsgId,
        defaultProcId = process.pid,
        defaultSeverity = this.defaultSeverity,
        defaultStructuredData = this.defaultStructuredData,
        message,
        host = this.host,
        port = this.port,
        key = this.key,
        protocol = this.protocol
    }) {
        switch (protocol) {
            case PROTOCOLS.TLS: {
                return this.rfc5425({
                    ca,
                    cert,
                    checkServerIdentity,
                    defaultAppName,
                    defaultEol,
                    defaultFacility,
                    defaultHostname,
                    defaultMsgId,
                    defaultProcId,
                    defaultSeverity,
                    defaultStructuredData,
                    family: 0,
                    host,
                    hostname,
                    key,
                    port,
                    message
                })
            }
            case PROTOCOLS.TLS4: {
                return this.rfc5425({
                    ca,
                    cert,
                    checkServerIdentity,
                    defaultAppName,
                    defaultEol,
                    defaultFacility,
                    defaultHostname,
                    defaultMsgId,
                    defaultProcId,
                    defaultSeverity,
                    defaultStructuredData,
                    family: 4,
                    host,
                    hostname,
                    key,
                    port,
                    message
                })
            }
            case PROTOCOLS.TLS6: {
                return this.rfc5425({
                    ca,
                    cert,
                    checkServerIdentity,
                    defaultAppName,
                    defaultEol,
                    defaultFacility,
                    defaultHostname,
                    defaultMsgId,
                    defaultProcId,
                    defaultSeverity,
                    defaultStructuredData,
                    family: 6,
                    host,
                    hostname,
                    key,
                    port,
                    message
                })
            }
            case PROTOCOLS.TCP: {
                return this.rfc6587({
                    defaultAppName,
                    defaultEol,
                    defaultFacility,
                    defaultHostname,
                    defaultMsgId,
                    defaultProcId,
                    defaultSeverity,
                    defaultStructuredData,
                    family: 0,
                    host,
                    hostname,
                    port,
                    message
                })
            }
            case PROTOCOLS.TCP4: {
                return this.rfc6587({
                    defaultAppName,
                    defaultEol,
                    defaultFacility,
                    defaultHostname,
                    defaultMsgId,
                    defaultProcId,
                    defaultSeverity,
                    defaultStructuredData,
                    family: 4,
                    host,
                    hostname,
                    port,
                    message
                })
            }
            case PROTOCOLS.TCP6: {
                return this.rfc6587({
                    defaultAppName,
                    defaultEol,
                    defaultFacility,
                    defaultHostname,
                    defaultMsgId,
                    defaultProcId,
                    defaultSeverity,
                    defaultStructuredData,
                    family: 6,
                    host,
                    hostname,
                    port,
                    message
                })
            }
            case PROTOCOLS.UDP: {
                return this.rfc5426({
                    defaultAppName,
                    defaultEol,
                    defaultFacility,
                    defaultHostname,
                    defaultMsgId,
                    defaultProcId,
                    defaultSeverity,
                    defaultStructuredData,
                    family: 0,
                    host,
                    hostname,
                    port,
                    message
                })
            }
            case PROTOCOLS.UDP4: {
                return this.rfc5426({
                    defaultAppName,
                    defaultEol,
                    defaultFacility,
                    defaultHostname,
                    defaultMsgId,
                    defaultProcId,
                    defaultSeverity,
                    defaultStructuredData,
                    family: 4,
                    host,
                    hostname,
                    port,
                    message
                })
            }
            case PROTOCOLS.UDP6: {
                return this.rfc5426({
                    defaultAppName,
                    defaultEol,
                    defaultFacility,
                    defaultHostname,
                    defaultMsgId,
                    defaultProcId,
                    defaultSeverity,
                    defaultStructuredData,
                    family: 6,
                    host,
                    hostname,
                    port,
                    message
                })
            }
            default: {
                throw Error('Unsupported protocol')
            }
        }
    }
}

exports.Appender = Appender;