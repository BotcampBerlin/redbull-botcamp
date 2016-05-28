const _ = require('lodash');
const danielJson = require('./daniel.json');
console.log(_.size(danielJson));
let conversationsData = {};
const Sender = require('./sender');

function sendTextMessage(sender) {
  console.log('send message', sender)
  const idx = conversationsData[sender.id].idx;
  const message = danielJson[idx];
  console.log(message);
  return Sender.sendMessage(sender, message);
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

function setGreetingMessage() {
  const message = {
      "setting_type":"call_to_actions",
      "thread_state":"new_thread",
      "call_to_actions": [
        {
          "message":{
            "attachment":{
              "type":"template",
              "payload":{
                "template_type":"generic",
                "elements":[
                  {
                    "title":"Hello, I'm the Red Bull Wingbot!",
                    "subtitle":"Chat with our Red Bull Racing drivers through me.",
                    "buttons":[
                      {
                        "type":"postback",
                        "title":"Daniel Riccardio",
                        "payload": "daniel_riccardio"
                      },
                      {
                        "type":"postback",
                        "title":"Max Verstappen",
                        "payload": "max_verstappen"
                      }
                    ]
                  }
                ]
              }
            }
          }
        }
    ]
  }

  Sender.sendMessage(null, message, 'redbullwingbot/thread_settings')
}

setGreetingMessage();

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
        Sender.sendTextMessage(event.sender);
      }
    });
  }
}
