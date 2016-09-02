# Framework for Bot APIs
built for the Telegram Bot API (see [22sk/botapijs-telegram][botapijs-telegram])

[![npm](https://img.shields.io/npm/v/bot22api.svg?style=flat-square)](https://www.npmjs.com/package/bot22api)
[![npm](https://img.shields.io/npm/l/bot22api.svg?style=flat-square)](https://www.npmjs.com/package/bot22api)
[![npm](https://img.shields.io/npm/dt/bot22api.svg?style=flat-square)](https://www.npmjs.com/package/bot22api)
[![GitHub stars](https://img.shields.io/github/stars/22sk/botapijs.svg?style=social&label=Star)](https://github.com/22sk/botapijs)

Documentation: https://22sk.github.io/botapijs

```javascript
const bot22api = require('bot22api');
const { Bot, Handler, Requirement } = bot22api;
const { parsers, requires } = bot22api;

const bot = new Bot({
  apiUrl: 'https://somebotapi.io/?token=t84lGDUhW0SZq5cj/',
  parser: parsers.json
});

bot.register(new Handler('dbHandler', (done, { data }) => {
  console.log(data);
  done();
}));

bot.register(new Handler({
  name: 'textHandler',
  callable: function textHandler(done) {
    this.send('message', {
      user: this.data.user,
      text: `Hello ${this.data.user}!`
    });
    done();
  },
  requires: [
    requires.has('text'),
    new Requirement('helloChecker', (done, processor) => {
      if (processor.data.text === 'hello') done(); // no error
      else done(true); // error
    })
  ]
}));

bot.listen(3000, 'localhost');
```

## installation
```
npm install bot22api
```


## getting started

First of all require all needed dependencies.
```javascript
const bot22api = require('bot22api');
const { Bot, Handler } = bot22api;
```

### Bot <sub>**[/docs/][Bot]**</sub>

To create a new bot, call its constructor.
```javascript
const bot = new Bot({
  apiUrl: 'https://somebotapi.io/?token=t84lGDUhW0SZq5cj/',
  route: /.*/,
  parser: bot22api.parsers.json,
  server: undefined, // will be created automatically
  log: null // will send no logs if null. npmlog by default
});
```

Now that you have a Bot object, you need to register so-called Handlers using
the Bot's register method. Each Callable (Handler or Requirement) must have a
unique name.

#### Bot#register <sub>[/docs/][Bot#register]</sub>

```javascript
bot.register(handler);
```

### Handler <sub>[/docs/][Handler]</sub>

Each time the bot receives a HTTP request, it'll try to execute all handlers
that is has. A Handler can also have Requirements, that do almost the same as
Handlers, but they check if the data can be used by the Handler. If one
Requirement fails, the Handler won't execute.

```javascript
bot.register(new Handler({
  name: 'loggerHandler',
  callable: (done, { data }) => {
    console.log(data);
    done();
  }
}));
```
### Callable <sub>[/docs/][Callable]</sub>

All Callable-extending classes (Handler and Requirement) can also be constructed
by passing the Callable name, the Callable function and optional Requirements.

This is what all Callables have in common. Mind that requires is optional!
```javascript
Callable {
  name: string,
  callable: function,
  [requires]: Requirement[]
}
```
Callables themselves can not be used in any way. Do always construct either
Handlers or Requirements.

By using a named function, you do not need to pass the name as a string, as the
name is already given. See the documentation for further information about the
construction of Callables.

#### Danger!

You can't simply filter out the `send` method from the processor and call it!
Since `send` accesses the bot through the processor, it needs to get properties
of `this`, which does not exist after you extracted it from the processor.

For workarounds, take a look at the documentation: [Processor#send]

### Requirement <sub>[/docs/][Requirement]</sub>

A Requirement constructs like any other Callable: Like a Handler.
The only big difference to a Handler is when they are used.

Requirements perform checks or modifications on the data that the handler relies
on. Requirements can also depend on other Requirements.

In any Callable, the requirements are represented in an Array named `requires`.
For example, here's a Handler with some Requirements.

```javascript
const { Requirement, requires } = bot22api;
```
```javascript
new Handler({
  name: 'requirementShowcaseHandler',
  callable: (done) => {
    console.log('All Requirements have passed.'); done();
  },
  requires: [
    // checks if user.type === 'admin'
    requires.is('admin', 'user', 'type'),
    // using the (functionName, requires) constructor, see Callable doc
    new Requirement(function textNotEmpty(done, { data }) {
      if (typeof data.text === 'string' && data.text.length === 0) done();
      else done(true); // error -> done(err)
    }, [ requires.has('text') ])
  ]
});
```

This results in a Requirements tree like:
- requirementShowcaseHandler
  - isUserTypeAdmin
    - hasUserType
  - textNotEmpty
   - hasText


### Processor <sub>[/doc/][Processor]</sub>

When a HTTP request invokes a bot, the bot creates a Processor for all Handlers.
As the Handlers and Requirement so get embedded into an environment that
contains all current states, properties like the passed API URL and route can
be retrieved from that object.

You can use the processor while inside a Callable function
(Handler or Requirement)

```javascript
new Handler({
  callable: (done, processor) => {
    console.log('Cool?', processor.handler.options.beCool);
    processor.send('message', `I received ${processor.data} ` +
      `on route ${processor.route}`);
  },
  options: { beCool: true }
});
```

### Finalization

Once everything is set up, you need to tell the bot's server to start listening.
To do that, simply call the Bot's `listen` method. If your server runs more
than one Bot, call the Server's `listen` method instead.

```javascript
bot.listen(3000, 'localhost');
```

Now to make HTTP requests, call your URL, which consists of your hostname,
port, an optional route followed by `?url=` and the set API URL. The data is
submit in the POST request's body.

So just give the full URL to your bot API.

```
https://yourbot.rhcloud.com/yourRoute?url=https://somebotapi.io/?token=t84lGDUhW0SZq5cj/
```

## license
[MIT](LICENSE)


[botapijs-telegram]: https://github.com/22sk/botapijs-telegram
[Bot]: https://22sk.github.io/botapijs/Bot.html
[Bot#register]: https://22sk.github.io/botapijs/Bot.html#register
[Server]: https://22sk.github.io/botapijs/Server.html
[Handler]: https://22sk.github.io/botapijs/Handler.html
[Callable]: https://22sk.github.io/botapijs/Callable.html
[Requirement]: https://22sk.github.io/botapijs/Requirement.html
[Processor#send]: https://22sk.github.io/botapijs/Processor.html#send
[Processor]: https://22sk.github.io/botapijs/Processor.html
