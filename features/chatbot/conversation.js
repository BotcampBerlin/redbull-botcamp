const _ = require('lodash');
const Promise = require('bluebird');
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
    senderData.idx = -1;
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
  conversationsData[sender.id] = senderData;
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
    "call_to_actions": []
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

function sendDelayedMessageIfNeeded(sender, message, senderData) {
  senderData.answerDelayActive = false;
  if (!shouldWaitForAnswer(message)) {
    senderData.answerDelayActive = true;
    setTimeout(() => {
      updateConversationData(sender);
      senderData = conversationsData[sender.id]
      const newMessage = people[senderData.person][senderData.idx];
      console.log('idx, message, delay active', senderData.idx, newMessage, senderData.answerDelayActive)
      if(!newMessage) {
        return;
      }
      sendMessage(sender, newMessage);
    }, 4000)
  }
}

function sendMessage(sender, message) {
  console.trace("Sending", message);
  let senderData = conversationsData[sender.id];
  if (message.data.text) {
    message.data.text = interpolateString(message.data.text, senderData.first_name);
  }
  return Sender.sendMessage(sender, message.data)
    .then(sendDelayedMessageIfNeeded.bind(null, sender, message, senderData));
}

function setDefaultValues(sender) {
  conversationsData[sender.id] = {
    answerDelayActive: false,
    idx: -1,
    person: ""
  }
}

function setConversationToFirstItem(sender) {
  conversationsData[sender.id].idx = 0;
}

function handleMessageRouting(first_name, event) {
    const message = event.message;
    const postback = event.postback;
    const sender = event.sender;

    console.log("Senders data", conversationsData[sender.id]);
    if (message && message.text === "reset") {
      console.log("Resetting sender data");
      conversationsData[sender.id] = {
        first_name: conversationsData[sender.id].first_name
      };
    }
    if (_.isEmpty(conversationsData[sender.id])) {
      setDefaultValues(sender);
    }
    conversationsData[sender.id].first_name = first_name;
    if (event.delivery) {
      return;
    }

    let startOfConversation = conversationsData[sender.id].idx === -1;

    if(startOfConversation && postback) {
      setConversationToFirstItem(sender);
    }

    if(startOfConversation && message) {
      return askQuestion(sender, greeting.data.subtitle, greeting.data.buttons);
    }

    console.log(conversationsData[sender.id]);

    if(postback && !conversationsData[sender.id].answerDelayActive) {
      const message = determinePayloadAnswer(sender, postback.payload);
      console.log("postback!", postback, message);
      return sendMessage(sender, message);
    }
    if(message && !conversationsData[sender.id].answerDelayActive) {
      updateConversationData(sender);
      const msg = people[conversationsData[sender.id].person][conversationsData[sender.id].idx];
      console.log('message!', message, msg);
      return sendMessage(sender, msg);
    }
}

function loopThruMessaging(events) {
  return Promise.each(events, event => {
    console.log('event', Object.keys(event), event.sender);
    return setUserFirstName(event.sender)
      .then(first_name => {
        return handleMessageRouting(first_name, event)
      });
  })
    .then(d => {
      console.log('loopThruMessaging done');
      console.log(d)
    });
}

function setUserFirstName(sender) {
  if(!conversationsData[sender.id]) {
    conversationsData[sender.id] = {};
  }
  if(!conversationsData[sender.id].first_name) {
    return Sender.getUserData(sender.id).then(data => {
      console.log('setUserFirstName', data);
      return data.first_name;
    });
  } else {
    return Promise.resolve(conversationsData[sender.id].first_name);
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
