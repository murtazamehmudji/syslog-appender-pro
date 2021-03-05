const { Appender, FACILITIES, PROTOCOLS, SEVERITIES } = require('../index');

const ca = '/var/www/html/syslog-poc/certs/CA.crt';
const cert = '/var/www/html/syslog-poc/certs/client.crt';
const key = '/var/www/html/syslog-poc/certs/client.key';

const logger = new Appender({
  defaultAppName: 'ott-service',
  caPath: ca,
  certificatePath: cert,
  keyPath: key,
  host: "localhost",
  port: 514,
  protocol: PROTOCOLS.UDP
})

var i = 0;
setInterval(() => {
  if (i <= 1000) {
    logger.debug({ message: 'Message from syslog-appender-pro! ' + i++ })
      .then((result) => {
        console.log('Logged ' + (i - 1));
      })
      .catch(err => {
        console.log(err.message);
      });
  } else {
    process.exit();
  }
}, 1000);