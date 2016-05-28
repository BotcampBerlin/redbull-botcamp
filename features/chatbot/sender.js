const Promise = require('bluebird');
const request = Promise.promisify(require('request'));

const BASE_URL = 'https://graph.facebook.com/v2.6/'
const ACCESS_TOKEN = 'EAADZAm3wsdkUBAM1jy5EOT5VZACZCymaFJJoxXAKe8D1WtWZCHVWlzRoF9ZBvnavOriztoYZBKljDaMSmWgfbQZBx64gFvNdKFXydBW5XtaZBC2sHKsEaQa9ZBjvaOKNM0nnpZA0gLonXrm7oW2tXJZB5SOxt7Ya6jzvVvrJWI8rs5bRQZDZD';

function sendMessage(sender, message, api_endpoint) {
  if (typeof api_endpoint === 'undefined') {
    api_endpoint = 'me/messages';
  }
  var payload;
  if (sender === null) {
    payload = message
  } else {
    payload = {
        recipient: sender,
        message
    }
  }
  return request({
      url: BASE_URL + api_endpoint,
      qs: {access_token: ACCESS_TOKEN},
      method: 'POST',
      json: payload
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
  sendMessage
}
