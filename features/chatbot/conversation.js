const _ = require('lodash');
const danielJson = require('./daniel.json');
const answers = require('./answers.json');
const Sender = require('./sender');
let conversationsData = {};

function updateConversationData(sender) {
  console.log('update!', sender)

  console.log(sender.id, conversationsData[sender.id]);
  if(!conversationsData[sender.id]) {
    conversationsData[sender.id] = {
      idx: 0
    };
  } else {
    if(conversationsData[sender.id].idx >= _.size(danielJson)) {
      console.log('bigger')
      conversationsData[sender.id].idx = 0;
    } else {
      console.log('increment', conversationsData[sender.id].idx);
      conversationsData[sender.id].idx = conversationsData[sender.id].idx + 1;
      console.log(conversationsData[sender.id].idx)
    }
  }
}

function askQuestion(sender, question_text, answers) {

  const message = {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"button",
        "text": question_text,
        "buttons": answer_buttons
      }
    }
  }
  return Sender.sendMessage(sender, message)
}

function createButtons(buttons) {
  return _.map(buttons, elem => {
    if (typeof elem.payload === 'undefined') {
      elem.payload = elem.title.toLowerCase().replace('/ /', '_');
    }
    return {
        "type":"postback",
        "title": elem.title,
        "payload": elem.payload
    };
  });
}

function setGreetingMessage() {
  const greeting = require("./greeting.json");
  let buttons = createButtons(greeting.buttons);
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
                    "title": greeting.title,
                    "subtitle": greeting.subtitle,
                    "buttons": buttons
                  }
                ]
              }
            }
          }
        }
    ]
  }

  Sender.sendSettingsMessage(message);
}

function determinePayloadAnswer(payload){
  return answers[payload];
}

function sendMessage(sender, message) {
  return Sender.sendMessage(sender, message.data)
    .then(() => {
      if(!message.waitForAnswer) {
        const newMessage = danielJson[conversationsData[sender.id].idx];
        updateConversationData(sender);
        sendMessage(sender, newMessage);
      }
    });
}

function loopThruMessaging(events) {
  _.each(events, event => {
    console.log('bar', event);
    const message = event.message;
    const postback = event.postback;
    const sender = event.sender;
    if(postback) {
      const message = determinePayloadAnswer(postback.payload);
    }
    if(message) {
      const message = danielJson[conversationsData[sender.id].idx];
      updateConversationData(sender);
      return sendMessage(message);
    }
  });
}

setGreetingMessage();

module.exports = {
  chat(entries) {
    console.log('foo', entries);
    const messagingEvents = _.head(entries).messaging;
    return loopThruMessaging(messagingEvents);
  }
}
