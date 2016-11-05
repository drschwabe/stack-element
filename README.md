# Stack Element

## Usage
`npm install stack-element`

(requires browser supporting new custom elements spec, ie: Chrome 54+)

```javascript
var stack = require('stack')
require('stack-element')(stack) 
//^ Extends your existing stack with new commands.

//Define your own custom elements: 
stack.on('element:my-thingy', (state, next) => {
  //state.element is now a special object containing the custom
  //DOM element 'my-thingy', a base template (plus rendering feature), a set
  //of it's own commands, and a basic API. 
  state.element.html('<p>Test</p>')
  state.element.addStyle(`color { blue; }`)
  next(null, state)
})

stack.on('element:my-thingy', (state, next) => {
  state.element.append('<p>A-OK</p>')
  state.element.addStyle(`background-color { red; }`)
  next(null, state)
})

//Fire the listeners defined above: 
stack.fire('element:my-thingy')
//After reaching the bottom of the stack, the element will render the changes to it's template to the DOM. 
```
The element should exist in the DOM. 
```HTML
  <my-thingy></my-thingy>
  <!-- turns into: -->
  <my-thingy>
    <p>Test</p>
    <p>A-OK</p>
  </my-thingy>
```

Your stack element listner has access to the entire state object of the application so it can use that data. Stack elements can modify state, but isn't encourated; the idea is that your stack-element listeners should modify the supplied element (state.element). Treating the parent state object as 'read only' and simply tapping into it for the purpose of rendering stuff to the DOM. 


You can also take advantage of the set of built-in commands the element has: 
```javascript
stack.on('element:my-thingy/click', (state, next) => {
  console.log(state.element.event)
  //Do something here in response to the click. 
  next(null, state)
})
stack.on('element:my-thingy/hover', (state, next) => {
  state.element.toggleClass('bold')
  next(null, state)
})
```

You can also define your own commands. 

```javascript
stack.on('element:my-thingy/magic-animation', (state, next) => {
  //Make the element dance. 
  next(null, state)
})

stack.fire('element:my-thingy/magic-animation')
```

The API is the same as stack, just that we prepend the word 'element:' on each command.

### on(string, callback)

Prepend the string with 'element:' and then the name of your element.  The element name must have a dash. Callback will run, in the order that it is definied, when fired. 
In your callback function, call next(null, state) to pass the state to the next object, if you don't do this the stack will finish. 


### fire(string, callback) 

Runs each of the element's listeners (ie- stack.on's) in order. 

There is also a special command to initialize all of your stack elements. 

stack.fire('element:*')


## Supplying a default template

You can supply a default template by including it within your element. 

<my-thingy>
</my-thingy>


## Dynamic data via EJS

EJS is the default template language for stack-elements, you can use it as follows: 

```HTML
<my-thingy>
  <p><?= state.someString ?></p>
</my-thingy>

<my-thingy>
  <ul>
    <? state.someArray.forEach(function(elem) { ?>
      <li><?= elem ?><li>
    <? }) ?>
  </ul>
</my-thingy>
```

You can also nest stack-elements within one another, just note that when performing iterations you will need to bind the iteratee in this way: 

```HTML
<my-thingy>
  <div>
    <? state.someArray.forEach(function(elem) { ?>
      <my-otherthingy bind="<?= elem ?>">
        <h1><?= elem ?></h1
        <h2>State can still be rendered too: </h2>
        <p><?= state.someThingInteresting ?></p>
      <my-otherthingy>
    <? }) ?>
  </div>
</my-thingy>
```
