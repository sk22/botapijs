const camelCase = require('camelcase');


 /**
  * Since {@link Callable} is extended by two classes, and a Callable itself
  * cannot be used, these classes have their own documentation of the callable
  * in which you might be interested:
  * - {@link Handler}'s callable: {@link Handler~callable}
  * - {@link Requirement}'s callable: {@link Requirement~callable}
  *
  * A callable itself looks like this:
  * ```
  * (done, processor) => {
  *   done();
  * }
  * ```
  * You can also overload parameters to the `done` callback. See
  * {@link Handler~done} and {@link Requirement~done} for further information
  *
  * You can also filter specific properties from the {@link Processor} object
  * using the ES6 destruction syntax:
  * ```
  * (done, { data, send }) => {
  *   // send() can not be used as is!
  * }
  * ```
  * Regarding the `send` method, please read {@link Processor#send}!
  *
  * **Binding the Processor to the function**
  *
  * Using a function, the Processor is bound to the callable. That means,
  * all properties of Processor can also be accessed through `this` inside
  * of the callable function, so the processor parameter is optional.
  *
  * By adding a name to the function, you can leave out the parameter for the
  * Callable name.
  * ```
  * // (namedFunction, requires)
  * new Callable(function testCallable(done, processor) {
  *   this.data === processor.data;
  * });
  * ```
  *
  * @callback Callable~callable
  *
  * @param {Function}  done      Should be called from the callable when done
  * @param {Processor} processor Processor object containing all relevant
  *                              data
  * @see Processor
  * @see Handler~callable
  * @see Requirement~callable
  */
class Callable {

  /**
   * #### Alternative constructors
   *
   * When registering ({@link Bot#register}) a {@link Handler} or
   * {@link Requirement}, you can also make use of alternative constructor
   * signatures:
   * ```
   * // (object)
   * new Callable({
   *   name: 'testCallable',
   *   callable: (done, processor) => {},
   *   options: { verbose: true }
   * });
   * ```
   * ```
   * // (name, callable, requires)
   * new Callable('testCallable', (done, processor) => {}, []);
   * ```
   * ```
   * // (namedFunction, requires)
   * new Callable(function testCallable(done, processor) {});
   * ```
   *
   * #### **1**. `(object)` - Object constructor
   * #### **2**. `(callable, [requires])` - Named function constructor
   * #### **3**. `(name, callable, [requires])` - Function constructor
   *
   * @param {object|Function|string} object            Object, Callable
   *                                                   function with name, or
   *                                                   Callable's name
   * @param {string}                 object.name       Callable's name
   * @param {Callable~callable}      object.callable   Callable function
   * @param {Requirement[]}          [object.requires] Requirements
   * @param {Requirement[]|Function} callable          Array of Requirements
   *                                                   or Callable
   * @param {Requirement[]}          [requires]        Array of Requirements
   *
   */
  constructor(object = {}, callable, requires) {
    if (typeof object === 'string' && callable instanceof Function) {
      // new Callable('testCallable', (data) => {})
      object = { name: object, callable, requires };
    } else if (object instanceof Function && object.name) {
      // new Callable(function testCallable, (data) => {})
      object = { name: object.name, callable: object, requires: callable };
    }

    // Check if essential parameters are unusable and throw Error
    this.setName(object.name);
    if (!object.callable || !(object.callable instanceof Function)) {
      throw new Error(this.constructor.name +
        'needs to have a valid callable!');
    }

    // Use all passed properties, no matter if valid or not
    Object.assign(this, object);

    // Correct wrong values
    this.name = camelCase(object.name);
    this.setCallable(object.callable);

    if (!this.requires) this.requires = [];
    else if (!(this.requires instanceof Array)) this.requires = [this.requires];

    // flattens the requires tree to this.requirements
    this.prepareRequirements();
  }

  /**
   * Flattens the Callback's requires tree to this.requirements
   *
   * @param {Callable} [object] Object that might have `requires` node
   */
  prepareRequirements(object) {
    if (!object) this.requirements = [];
    const requires = object ? object.requires : this.requires;
    if (requires) {
      for (let i = 0; i < requires.length; i++) {
        const requirement = requires[i];
        // if may be required multiple times or
        // has not been added to the requirements until then
        if ((requirement.options && requirement.options.multiple)
          || !this.requirements.includes(requirement)) {
          // recursively get requirements of requirements
          this.prepareRequirements(requirement);
          this.requirements.push(requirement);
        }
      }
    }
  }

  /** @private */
  setCallable(callable) {
    if (callable instanceof Function) {
      this.callable = callable;
    } else {
      throw new TypeError('Callable must be a function!');
    }
  }

  setName(name) {
    if (!name) {
      throw new Error(`${this.constructor.name} needs to have a name!`);
    } else if (typeof name !== 'string') {
      throw new Error(`${this.constructor.name}'s name needs to be a string!`);
    }
    this.name = name;
  }
}

module.exports = Callable;
