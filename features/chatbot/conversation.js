const Promise = require('bluebird');
const request = Promise.promisify(require('request'));
const _ = require('lodash');
const danielJson = require('./daniel.json');
console.log(danielJson);
let conversationsData = {};

const ACCESS_TOKEN = 'EAADZAm3wsdkUBAM1jy5EOT5VZACZCymaFJJoxXAKe8D1WtWZCHVWlzRoF9ZBvnavOriztoYZBKljDaMSmWgfbQZBx64gFvNdKFXydBW5XtaZBC2sHKsEaQa9ZBjvaOKNM0nnpZA0gLonXrm7oW2tXJZB5SOxt7Ya6jzvVvrJWI8rs5bRQZDZD';

function sendTextMessage(id) {
  const idx = conversationsData[id].idx;
  const message = danielJson[idx];
  console.log(id, messsage);
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

function updateConversationData(id) {
  if(conversationsData[id]) {
    conversationsData[id] = {
      idx: 1
    };
  } else {
    conversationsData[id].idx = conversationsData[id].idx++;
  }
}

module.exports = {
  chat(entries) {
    const messagingEvents = _.head(entries).messaging;
    _.each(messagingEvents, event => {
      const message = event.message;
      if (message) {
        updateConversationData(event.sender.id);
        sendTextMessage(event.sender);
      }
    });
  }
}