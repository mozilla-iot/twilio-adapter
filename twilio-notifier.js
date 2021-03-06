const manifest = require('./manifest.json');
const twilio = require('twilio');

const {
  Constants,
  Database,
  Notifier,
  Outlet,
} = require('gateway-addon');

const config = {
  accountSid: null,
  authToken: null,
  fromPhoneNumber: null,
  toPhoneNumber: null,
};

function getOptions() {
  return {
    from: config.fromPhoneNumber,
    to: '',
    body: '',
  };
}

function sendText(to, body) {
  const api = twilio(config.accountSid, config.authToken);
  return api.messages.create(Object.assign(getOptions(), {
    to: to,
    body: body,
  })).catch((err) => {
    console.warn(err);
  });
}

/**
 * A text sending outlet
 */
class TwilioOutlet extends Outlet {
  /**
   * @param {TwilioNotifier} notifier
   * @param {String} id - A globally unique identifier
   */
  constructor(notifier, id) {
    super(notifier, id);
    this.name = 'Twilio';
  }

  async notify(title, message, level) {
    console.log(`Sending text with message "${message}" and level "${level}"`);

    switch (level) {
      case Constants.NotificationLevel.LOW:
      case Constants.NotificationLevel.NORMAL:
        message = `(NOTICE) ${message}`;
        break;
      case Constants.NotificationLevel.HIGH:
        message = `(ALERT) ${message}`;
        break;
    }

    await sendText(config.toPhoneNumber, message);
  }
}

/**
 * Twilio Notifier
 * Instantiates one Twilio outlet
 */
class TwilioNotifier extends Notifier {
  constructor(addonManager) {
    super(addonManager, manifest.id, manifest.id);

    addonManager.addNotifier(this);

    const db = new Database(manifest.id);
    db.open().then(() => {
      return db.loadConfig();
    }).then((cfg) => {
      Object.assign(config, cfg);

      if (!this.outlets['twilio-0']) {
        this.handleOutletAdded(new TwilioOutlet(this, 'twilio-0'));
      }
    }).catch(console.error);
  }
}

module.exports = TwilioNotifier;
