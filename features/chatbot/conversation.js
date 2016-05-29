const _ = require('lodash');

const answers = require('./answers.json');
const Sender = require('./sender');
const greeting = require("./greeting.json");
let conversationsData = {};
const people = {
  daniel: require('./daniel.json'),
  max: require('./max.json')
}

function updateConversationData(sender) {
  let senderData = conversationsData[sender.id];
  console.log('update!', sender, senderData.answerDelayActive, senderData)

  if(_.isUndefined(senderData.idx) || senderData.idx === -1) {
    senderData.idx = 0;
  } else {
    if(senderData.idx >= _.size(people[senderData.person]) - 1) {
      console.log('bigger')
      senderData.idx = -1;
    } else {
      console.log('increment', senderData.idx, senderData.answerDelayActive);
      senderData.idx = senderData.idx + 1;
      console.log(senderData.idx)
    }
  }
}

function askQuestion(sender, question_text, answers) {

  let answer_buttons = createButtons(answers);
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

function determinePayloadAnswer(sender, payload){
  switch (payload) {
    case "max_verstappen":
    conversationsData[sender.id].person = "max";
    break;
    case "daniel_riccardio":
    conversationsData[sender.id].person = "daniel";
    break;
  }
  return answers[payload];
}

function interpolateString(text, data) {
  return text.replace("{{first_name}}", data);
}

function shouldWaitForAnswer(message) {
  console.log('Should wait?', message.waitForAnswer, message.data.attachment, _.isUndefined(message.data.attachment), (!_.isUndefined(message.data.attachment) && message.data.attachment.type === 'template'));
  return message.waitForAnswer;// && (_.isUndefined(message.data.attachment) || message.data.attachment.type === 'template');
}

function sendMessage(sender, message) {
  console.trace("Sending", message);
  let senderData = conversationsData[sender.id];
  if (message.data.text) {
    message.data.text = interpolateString(message.data.text, senderData.first_name);
  }
  return Sender.sendMessage(sender, message.data)
  .then(() => {
    senderData.answerDelayActive = false;
    // if (!shouldWaitForAnswer(message)) {
    //   senderData.answerDelayActive = true;
    //   setTimeout(() => {
    //     updateConversationData(sender);
    //     const newMessage = people[senderData.person][senderData.idx];
    //     console.log('idx, message, delay active', senderData.idx, newMessage, senderData.answerDelayActive)
    //     if(!newMessage) {
    //       return;
    //     }
    //     sendMessage(sender, newMessage);
    //   }, 8000)
    // }
  });
}

function loopThruMessaging(events) {
  _.each(events, event => {
    console.log('event', Object.keys(event), event.sender);
    const message = event.message;
    const postback = event.postback;
    const sender = event.sender;
    setUserFirstName(sender);
    let senderData = conversationsData[sender.id];
    if (!senderData) {
      senderData = {
        answerDelayActive: false
      }
    }
    if (event.delivery) {
      return;
    }

    if(senderData.idx === -1 && postback) {
      senderData.idx = 0;
    }
    if(senderData.idx === -1) {
      return askQuestion(sender, greeting.data.subtitle, greeting.data.buttons);
    }

    if(postback && !senderData.answerDelayActive) {
      const message = determinePayloadAnswer(sender, postback.payload);
      return sendMessage(sender, message);
    }
    if(message && !senderData.answerDelayActive) {
      updateConversationData(sender);
      const message = people[senderData.person][senderData.idx];
      console.log('message!', message);
      return sendMessage(sender, message);
    }
  });
}

function setUserFirstName(sender) {
  if(!conversationsData[sender.id]) {
    conversationsData[sender.id] = {};
  }
  if(!conversationsData[sender.id].first_name) {
    Sender.getUserData(sender.id).then(data => {
      console.log("User data: ", data);
      conversationsData[sender.id].first_name = data.first_name;
    });
  }
}

setGreetingMessage();

module.exports = {
  chat(entries) {
    const messagingEvents = _.head(entries).messaging;
    return loopThruMessaging(messagingEvents);
  },
  reset() {
    conversationsData = {};
  }
}
