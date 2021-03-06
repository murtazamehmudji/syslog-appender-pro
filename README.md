<p align="center">
  <h3 align="center">Syslog Appender Pro</h3>

  <p align="center">
    The best syslog appender over TCP/TLS/UDP protocol.
    <br>
    <a href="https://www.npmjs.com/package/syslog-appender-pro"><img src="https://img.shields.io/npm/v/syslog-appender-pro.svg" /></a>
    <a href="https://www.npmjs.com/package/syslog-appender-pro"><img src="https://img.shields.io/npm/dt/syslog-appender-pro.svg" /></a>
    <a href="https://www.npmjs.com/package/syslog-appender-pro"><img src="https://img.shields.io/npm/l/syslog-appender-pro.svg" /></a>
    <a href="https://www.jsdelivr.com/package/npm/syslog-appender-pro"><img src="https://data.jsdelivr.com/v1/package/npm/syslog-appender-pro/badge?style=rounded" /></a>
    <br>
    <a href="https://www.npmjs.com/package/syslog-appender-pro"><strong>View on NPM »</strong></a>
  </p>
</p>


# About
The syslog protocol (rfc5424) client. Works with Node.js over udp (rfc5426), tcp (rfc6587) and tls (rfc5425)

# Documentation
1. [Installation](#installation)
2. [Usage](#usage)
3. [Options](#options)
4. [Severity](#severity)
5. [Facility](#facility)
6. [Protocols](#protocols)

# Installation
**npm**
```
npm install syslog-appender-pro --save
```

# Usage
1. TCP
```javascript
const { Appender, FACILITIES, SEVERITIES, PROTOCOLS } = require('syslog-appender-pro');
const logger = new Appender({
    defaultAppName: 'syslog-appender-pro',
    defaultStructuredData: {
        '8bf8cc10-4140-4c3e-a2b4-e6f5324f1aea@41058': {
            tag: PROTOCOLS.TCP,
        },
    },
    host: 'logs-01.loggly.com',
    port: 514,
    protocol: PROTOCOLS.TCP,
    facility: FACILITIES.LOCAL0,
    severity: SEVERITIES.DEBUG
})

logger.debug({ message: 'Message from syslog-appender-pro!' })
    .then((result) => {
        console.log('Sent message on tcp');
    })
    .catch(console.error);
```
2. TLS
```javascript
const { Appender, FACILITIES, SEVERITIES, PROTOCOLS } = require('syslog-appender-pro');
const logger = new Appender({
    defaultAppName: 'syslog-appender-pro',
    caPath: '/etc/ssl/CA.crt',
    certificatePath: '/etc/ssl/client.crt',
    keyPath: '/etc/ssl/client.key',
    defaultStructuredData: {
        '8bf8cc10-4140-4c3e-a2b4-e6f5324f1aea@41058': {
            tag: PROTOCOLS.TLS,
        },
    },
    host: 'logs-01.loggly.com',
    port: 514,
    protocol: PROTOCOLS.TLS,
    facility: FACILITIES.LOCAL0,
    severity: SEVERITIES.DEBUG
})

logger.debug({ message: 'Message from syslog-appender-pro!' })
    .then((result) => {
        console.log('Sent message on tcp');
    })
    .catch(console.error);
```
3. UDP
```javascript
const { Appender, FACILITIES, SEVERITIES, PROTOCOLS } = require('syslog-appender-pro');
const logger = new Appender({
    defaultAppName: 'syslog-appender-pro',
    defaultStructuredData: {
        '8bf8cc10-4140-4c3e-a2b4-e6f5324f1aea@41058': {
            tag: POTOCOLS.UDP,
        },
    },
    host: 'logs-01.loggly.com',
    port: 514,
    protocol: PROTOCOLS.UDP,
    facility: FACILITIES.LOCAL0,
    severity: SEVERITIES.DEBUG
})

logger.debug({ message: 'Message from syslog-appender-pro!' })
    .then((result) => {
        console.log('Sent message on udp');
    })
    .catch(console.error);
```



# Options
### Server Options
| Name              | Type              | Default           | Description       |
| ----------------- | ----------------- | ----------------- | ----------------- |
| caPath            | string            | ""                | Exact path to ca certificate.
| certificatePath   | string            | ""                | Exact path to client certificate.
| keyPath           | string            | ""                | Exact path to key file.
| host              | string            | "localhost"       | Domain name or IP of host server.
| port              | number            | 514               | Port of host server.
| hostname          | string            | os.hostname()     | System hostname.
| rejectUnauthorized| boolean           | false             | If true, the server certificate is verified against the list of supplied CAs. An error event is emitted if verification fails.
| protocol          | string            | "tcp"             | Protocol over which syslog is accepted by host server.

### Appender Options
| Name                  | Type              | Default               | Description       |
| --------------------- | ----------------- | --------------------- | ----------------- |
| defaultAppName        | string            | "syslog-appender-pro" | Name of your application.
| defaultEol            | string            | "\n"                  | Default end of line for syslogs.
| defaultFacility       | string            | "LOCAL0"              | Default Facility to be used for syslogs.
| defaultSeverity       | string            | "DEBUG"               | Default severity to be used for syslogs.
| defaultStructuredData | string            | "-"                   | Default structured data if required for syslogs. Can be json format for logs, etc.
| defaultMsgId          | string            | "-"                   | Default msgId for the syslogs.

# Severity
1. ALERT
2. CRITICAL
3. DEBUG
4. EMERGENCY
5. ERROR
6. INFORMATIONAL
7. NOTICE
8. WARNING

# Facility
1. LOCAL0
2. LOCAL1
3. LOCAL2
4. LOCAL3
5. LOCAL4
6. LOCAL5
7. LOCAL6
8. LOCAL7

# Protocols
1. tcp
2. tcp4
3. tcp6
4. tls
5. tls4
6. tls6
7. udp
8. udp4
9. udp6
