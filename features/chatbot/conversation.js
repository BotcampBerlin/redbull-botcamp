const Promise = require('bluebird');
const request = Promise.promisify(require('request'));
const _ = require('lodash');
const danielJson = require('./daniel.json');
console.log(_.size(danielJson));
let conversationsData = {};

const ACCESS_TOKEN = 'EAADZAm3wsdkUBAM1jy5EOT5VZACZCymaFJJoxXAKe8D1WtWZCHVWlzRoF9ZBvnavOriztoYZBKljDaMSmWgfbQZBx64gFvNdKFXydBW5XtaZBC2sHKsEaQa9ZBjvaOKNM0nnpZA0gLonXrm7oW2tXJZB5SOxt7Ya6jzvVvrJWI8rs5bRQZDZD';

function sendTextMessage(sender) {
  console.log('send message', sender)
  const idx = conversationsData[sender.id].idx;
  const message = danielJson[idx];
  console.log(message);
  return request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {access_token: ACCESS_TOKEN},
      method: 'POST',
      json: {
          recipient: sender,
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

function updateConversationData(sender) {
  console.log('update!', sender)

  console.log(sender.id, conversationsData[sender.id]);
  if(!conversationsData[sender.id]) {
    conversationsData[sender.id] = {
      idx: 0
    };
  } else {
    if(conversationsData[sender.id].idx >= _.size(danielJson)) {
      conversationsData[sender.id].idx = 0;
    } else {
      conversationsData[sender.id].idx = conversationsData[sender.id].idx++;
    }
  }
}

module.exports = {
  chat(entries) {
    const messagingEvents = _.head(entries).messaging;
    _.each(messagingEvents, event => {
      const message = event.message;
      if (message) {
        console.log('message fine', event.sender)
        updateConversationData(event.sender);
        sendTextMessage(event.sender);
      }
    });
  }
}