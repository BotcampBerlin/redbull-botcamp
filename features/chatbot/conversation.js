const Promise = require('bluebird');
const request = Promise.promisify(require('request'));
const _ = require('lodash');
const danielJson = require('./daniel.json');
console.log(_.size(danielJson));
let conversationsData = {};

const ACCESS_TOKEN = 'EAADZAuYIxHWYBAPErhOLZALYFaZAdgQbFZCWKBkeZBpCHhrluewZCZChFpy1TyahjdX0lVvTESkdsG6Vjs4vZCVVywPg7LpmPSBxmiTix2dZCwvNtf2RzItkZAhJZAEUVycb5nTtT3LL7tJotVq6mLWjpDblHDwCZAEqph8AvQrVPKbOegZDZD';

function sendTextMessage(sender) {
  console.log('send message', sender)
  const idx = conversationsData[sender.id].idx;
  const message = danielJson[idx];
  console.log(message);
  return sendMessage(sender, message);
}


function sendMessage(sender, message) {
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
    console.log('conversationsData[sender.id].idx', conversationsData[sender.id].idx)
    console.log('_.size(danielJson)', _.size(danielJson))
    if(conversationsData[sender.id].idx >= _.size(danielJson)) {
      console.log('bigger')
      conversationsData[sender.id].idx = 0;
    } else {
      console.log('increment');
      conversationsData[sender.id].idx = conversationsData[sender.id].idx++;
    }
  }
}

module.exports = {
  chat(entries) {
    console.log('foo', entries);
    const messagingEvents = _.head(entries).messaging;
    _.each(messagingEvents, event => {
      console.log('bar', event);
      const message = event.message;
      if (message) {
        console.log('message fine', event.sender)
        updateConversationData(event.sender);
        sendTextMessage(event.sender);
      }
    });
  }
}
