const _ = require('lodash');
const danielJson = require('./daniel.json');
const answers = require('./answers.json');
const Sender = require('./sender');
let answerDelayActive = false;
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
  var answer_buttons = [];
  _.forEach(answers, answer_object => {
    answer_buttons.push({
        "type":"postback",
        "title": answers_object.title,
        "payload": answers_object.payload
    })
  });
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

  Sender.sendSettingsMessage(message);
}

function determinePayloadAnswer(payload){
  return answers[payload];
}

function sendMessage(sender, message) {
  answerDelayActive = false;
  return Sender.sendMessage(sender, message.data)
    .then(() => {
      if(!message.waitForAnswer) {
        answerDelayActive = true;
        setTimeout(() => {
          updateConversationData(sender);
          const newMessage = danielJson[conversationsData[sender.id].idx];
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
    if(postback) {
      const message = determinePayloadAnswer(postback.payload);
      return sendMessage(sender, message);
    }
    if(message && !answerDelayActive) {
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
    console.log('foo', entries);
    const messagingEvents = _.head(entries).messaging;
    return loopThruMessaging(messagingEvents);
  }
}
