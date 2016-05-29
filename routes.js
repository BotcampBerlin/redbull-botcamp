const request = require('request');
const VERIFY_TOKEN = 'fb_messenger_is_awesome_said_the_bull';

module.exports = (initRouter) => {
  const router = initRouter();
  router.get('/', (req, res) => {
    res.send('Hello world, I am a chat bot')
  });

  router.get('/webhook/', (req, res) => {
    if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token');
  });

  router.post('/webhook/', (req, res) => {
    req.chatbot.chat(req.body.entry);
    res.sendStatus(200);
  });

  router.post('/reset', (req, res) => {
    req.chatbot.reset()
    res.sendStatus(200);
  })

  return router;
};
