const Promise = require('bluebird');
const request = Promise.promisify(require('request'));

const BASE_URL = 'https://graph.facebook.com/v2.6/'
const ACCESS_TOKEN = 'EAADZAm3wsdkUBAM1jy5EOT5VZACZCymaFJJoxXAKe8D1WtWZCHVWlzRoF9ZBvnavOriztoYZBKljDaMSmWgfbQZBx64gFvNdKFXydBW5XtaZBC2sHKsEaQa9ZBjvaOKNM0nnpZA0gLonXrm7oW2tXJZB5SOxt7Ya6jzvVvrJWI8rs5bRQZDZD';
const PAGE_ID = 'redbullwingbot';

function sendMessage(sender, message, api_endpoint) {
  var api_endpoint = 'me/messages';
  var payload = {
    recipient: sender,
    message
  }
  return sendRequest(api_endpoint, payload, {});
}

function sendRequest(api_endpoint, payload, qs) {
  if (!qs.hasOwnProperty('access_token')) {
    qs['access_token'] = ACCESS_TOKEN;
  }
  return request({
    url: BASE_URL + api_endpoint,
    qs: qs,
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

function sendSettingsMessage(message) {
  return sendRequest(PAGE_ID + '/thread_settings', message, {});
}

function getUserData(user) {
  var api_endpoint = user
  var qs = {
    fields: "first_name"
  }
  return sendRequest(api_endpoint, {}, qs);
}

module.exports = {
  sendMessage,
  sendSettingsMessage,
  getUserData
}
