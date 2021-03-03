# syslog-appender-pro
[ESM] The syslog protocol (rfc5424) client. Works with Node.js over udp (rfc5426), tcp (rfc6587) and tls (rfc5425)

## Example

```
const { Appender } = require('syslog-appender-pro');

const main = async () => {
  {
    const logger = Appender({
      defaultAppName: 'syslog-appender-pro',
      caPath: '/etc/ssl/CA.crt',
      certificatePath: '/etc/ssl/client.crt',
      keyPath: '/etc/ssl/client.key',
      defaultStructuredData: {
        '8bf8cc10-4140-4c3e-a2b4-e6f5324f1aea@41058': {
          tag: 'tcp',
        },
      },
      host: 'logs-01.loggly.com',
      port: 514,
      protocol: 'tcp'
    })

    logger.debug({message: 'Message from syslog-appender-pro!'})
      .then((result) => {
        console.log('Sent message on tcp');
      })
      .catch(err => {
        console.log(err.message);
      });
  }
  {
    const log = Appender({
      defaultAppName: 'syslog-appender-pro',
      caPath: '/etc/ssl/CA.crt',
      certificatePath: '/etc/ssl/client.crt',
      keyPath: '/etc/ssl/client.key',
      defaultStructuredData: {
        '8bf8cc10-4140-4c3e-a2b4-e6f5324f1aea@41058': {
          tag: 'tls',
        },
      },
      host: 'logs-01.loggly.com',
      port: 6514,
      protocol: 'tls'
    })

    logger.debug({message: 'Message from syslog-appender-pro!'})
      .then((result) => {
        console.log('Sent message on tls');
      })
      .catch(err => {
        console.log(err.message);
      });
  }
}

main()
```