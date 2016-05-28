const _ = require('lodash');
const conversation = require('./conversation');

module.exports = {
  init(req, res, next) {
    req.chatbot = _.assign({}, req.chatbot, {
      chat: conversation.chat
    });
    next();
  }
};