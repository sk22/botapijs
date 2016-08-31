const assert = require('chai').assert;
const Callable = require('../lib/callable');
const Requirement = require('../lib/requirement');
let callable;

describe('Callable', () => {
  it('constructs', (done) => {
    callable = new Callable('test', (d) => d());
    assert.isOk(callable);
    done();
  });

  it('can have a tree of requirements', (done) => {
    callable.requires = [
      new Requirement('outer', (d) => d(), [
        new Requirement('nested', (d) => d(), [
          new Requirement('inner', (d) => d())
        ])
      ]),
      new Requirement('last', (d) => d())
    ];
    done();
  });

  it('properly flattens the nested requirements to an array', (done) => {
    callable.prepareRequirements();
    ['inner', 'nested', 'outer', 'last'].forEach((name, i) => {
      assert.equal(callable.requirements[i].name, name,
        'requirements are in the right order');
    });
    done();
  });
});
