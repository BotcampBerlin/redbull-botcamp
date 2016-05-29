const _ = require('lodash');
const danielJson = require('./daniel.json');
const answers = require('./answers.json');
const Sender = require('./sender');
const greeting = require("./greeting.json");
let conversationsData = {};

function updateConversationData(sender) {
  console.log('update!', sender, conversationsData[sender.id]['answerDelayActive'])

  console.log(sender.id, conversationsData[sender.id]);
  if(_.isUndefined(conversationsData[sender.id]['idx']) || conversationsData[sender.id].idx === -1) {
    conversationsData[sender.id]['idx'] = 0;
  } else {
    if(conversationsData[sender.id].idx >= _.size(danielJson) - 1) {
      console.log('bigger')
      conversationsData[sender.id].idx = -1;
    } else {
      console.log('increment', conversationsData[sender.id].idx, conversationsData[sender.id]['answerDelayActive']);
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
    if (_.isUndefined(elem.payload)) {
      elem.payload = _.snakeCase(elem.title);
    }
    return {
        "type":"postback",
        "title": elem.title,
        "payload": elem.payload
    };
  });
}

function setGreetingMessage() {
  let buttons = createButtons(greeting.data.buttons);
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
                    "title": greeting.data.title,
                    "subtitle": greeting.data.subtitle,
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
  console.log(message, conversationsData[sender.id]['answerDelayActive']);
  return Sender.sendMessage(sender, message.data)
    .then(() => {
      console.log(conversationsData[sender.id]['answerDelayActive']);
      conversationsData[sender.id]['answerDelayActive'] = false;
      if(!message.waitForAnswer || (_.isUndefined(message.attachment) || message.attachment.type !== 'attachment')) {
        conversationsData[sender.id]['answerDelayActive'] = true;
        setTimeout(() => {
          updateConversationData(sender);
          const newMessage = danielJson[conversationsData[sender.id].idx];
          console.log(conversationsData[sender.id].idx, newMessage, conversationsData[sender.id]['answerDelayActive'])
          sendMessage(sender, newMessage);
        }, 8000)
      }
    });
}

function loopThruMessaging(events) {
  _.each(events, event => {
    console.log('bar', event);
    const message = event.message;
    const postback = event.postback;
    const sender = event.sender;
    if (!conversationsData[sender.id]) {
      conversationsData[sender.id] = {
          answerDelayActive: false
      }
    }
    if (event.delivery) {
      return;
    }

    if(conversationsData[sender.id].idx === -1) {
      const message = greeting;
      return sendMessage(sender, message);
    }

    if(postback && !conversationsData[sender.id]['answerDelayActive']) {
      const message = determinePayloadAnswer(postback.payload);
      return sendMessage(sender, message);
    }
    if(message && !conversationsData[sender.id]['answerDelayActive']) {
      updateConversationData(sender);
      const message = danielJson[conversationsData[sender.id].idx];
      console.log('message!');
      console.log(message);
      return sendMessage(sender, message);
    }
  });
}

setGreetingMessage();

module.exports = {
  chat(entries) {
    const messagingEvents = _.head(entries).messaging;
    return loopThruMessaging(messagingEvents);
  }
}
