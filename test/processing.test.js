const Processing = require('../lib/processing');
let processing;

describe('Processing', () => {
  it('constructs', (done) => {
    processing = new Processing({
      data: 'hi',
      bot: {},
      handler: {},
      apiUrl: 'https://google.com/',
      route: '/'
    });
    console.log(processing);
    done();
  });
});
