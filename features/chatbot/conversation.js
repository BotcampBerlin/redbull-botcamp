const Promise = require('bluebird');
const request = Promise.promisify(require('request'));
const _ = require('lodash');

const ACCESS_TOKEN = 'EAADZAm3wsdkUBAM1jy5EOT5VZACZCymaFJJoxXAKe8D1WtWZCHVWlzRoF9ZBvnavOriztoYZBKljDaMSmWgfbQZBx64gFvNdKFXydBW5XtaZBC2sHKsEaQa9ZBjvaOKNM0nnpZA0gLonXrm7oW2tXJZB5SOxt7Ya6jzvVvrJWI8rs5bRQZDZD';

function sendTextMessage(id, text) {
  const message = {
    text: text
  };
  console.log(id, text)
  return request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {access_token: ACCESS_TOKEN},
      method: 'POST',
      json: {
          recipient: id,
          message
      }
  })
    .then(response => {
      if (response.body.error) {
        console.log('Error: ', response.body.error)
      }
    })
    .catch(e => {
      console.log('Error sending messages: ', e)
    })
}


module.exports = {
  chat(entries) {
    const messagingEvents = _.head(entries).messaging;
    _.each(messagingEvents, event => {
      if (event.message && event.message.text) {
          const text = event.message.text;
          sendTextMessage(event.sender, "Text received, echo: " + text.substring(0, 200));
      }
    });
  }
}