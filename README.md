# syslog-appender-pro
[ESM] The syslog protocol (rfc5424) client. Works with Node.js over udp (rfc5426), tcp (rfc6587) and tls (rfc5425)

## Example

```
const { syslog } = require('syslog-appender-pro');
const ca = '/etc/ssl/CA.crt';
const cert = '/etc/ssl/client.crt';
const key = '/etc/ssl/client.key';

const main = async () => {
  {
    const log = syslog({
      defaultAppName: 'syslog-appender-pro',
      caPath: ca,
      certificatePath: cert,
      keyPath: key,
      defaultStructuredData: {
        '8bf8cc10-4140-4c3e-a2b4-e6f5324f1aea@41058': {
          tag: 'tcp',
        },
      },
      host: 'logs-01.loggly.com',
      port: 514,
      protocol: 'tcp',
    })

    await log({
      message: 'Works with tcp!',
    })
  }
  {
    const log = syslog({
      defaultAppName: 'syslog-appender-pro',
      caPath: ca,
      certificatePath: cert,
      keyPath: key,
      defaultStructuredData: {
        '8bf8cc10-4140-4c3e-a2b4-e6f5324f1aea@41058': {
          tag: 'tls',
        },
      },
      host: 'logs-01.loggly.com',
      port: 6514,
      protocol: 'tls',
    })

    await log({
      message: 'Works with tls!',
    })
  }
}

main()
```