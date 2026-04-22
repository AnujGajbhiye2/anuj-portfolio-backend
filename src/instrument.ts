import Sentry from '@sentry/node';


Sentry.init({
  dsn: "https://65c97889331ac4b260fffbf721d343cf@o4511259794997248.ingest.de.sentry.io/4511259801354320",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
});