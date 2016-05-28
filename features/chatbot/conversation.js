const _ = require('lodash');
const danielJson = require('./daniel.json');
const answers = require('./answers.json');
let conversationsData = {};
const Sender = require('./sender');

function sendTextMessage(sender, givenMessage) {
  console.log('send message', sender);
  let message;
  if(!givenMessage) {
    message = danielJson[conversationsData[sender.id].idx];
  } else {
    message = givenMessage;
  }
  console.log('message');
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

function setUserFirstName(sender) {
  if(!conversationsData[sender.id]) {
    conversationsData[sender.id] = {};
  }
  if(!conversationsData[sender.id]['first_name']) {
    Sender.getUserData(sender.id).then(data => {
      console.log("User data: ", data);
      conversationsData[sender.id]['first_name'] = data.first_name;
    });
  }
}

setGreetingMessage();

module.exports = {
  chat(entries) {
    console.log('foo', entries);
    const messagingEvents = _.head(entries).messaging;
    _.each(messagingEvents, event => {
      console.log('bar', event);
      const message = event.message;
      const postback = event.postback;
      setUserFirstName(event.sender);
      if(postback) {
        const answer = determinePayloadAnswer(postback.payload);
        return sendTextMessage(event.sender, answer);
      }
      if(message) {
        updateConversationData(event.sender);
        return sendTextMessage(event.sender);
      }
    });
  }
}
