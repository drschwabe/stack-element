# Stack Element

(WIP / ALPHA)

## Usage
`npm install stack-element`

(requires browser supporting new custom elements spec, ie: Chrome 54+)

```javascript
var stack = require('stack-core')
require('stack-element')(stack) 
//^ Extends your existing stack with these new commands.

//Define your own custom elements: 
stack.on('element/my-thingy', (state, next) => {
  //state.element is now a special object containing the custom
  //DOM element 'my-thingy', a base template (plus rendering feature), a set
  //of it's own commands, and a basic API. 
  state.element.html('<p>Test</p>')
  state.element.addStyle(`color { blue; }`)
  next(null, state)
})

stack.on('element/my-thingy', (state, next) => {
  state.element.append('<p>A-OK</p>')
  state.element.addStyle(`background-color { red; }`)
  next(null, state)
})

//Fire the listeners defined above: 
stack.fire('element/my-thingy')
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

Your stack element listner has access to the entire state object of the application so it can use that data. Stack elements can modify state, but isn't encouraged; the idea is that your stack-element listeners should modify the supplied element (state.element). Treating the parent state object as 'read only' and simply tapping into it for the purpose of rendering stuff to the DOM. 


You can also take advantage of the set of built-in commands the element has: 
```javascript
stack.on('/element/my-thingy/click', (state, next) => {
  console.log(state.element.event)
  //Do something here in response to the click. 
  next(null, state)
})
```

You can also define your own commands. 

```javascript
stack.on('/element/my-thingy/magic-animation', (state, next) => {
  //Make the element dance. 
  next(null, state)
})

stack.fire('/element/my-thingy/magic-animation')
```

The API is the same as stack, just that we prepend the word '/element/' on each command.

#### on(string, callback)

Prepend the string with 'element:' and then the name of your element.  The element name must have a dash. Callback will run, in the order that it is definied, when fired. 
In your callback function, call next(null, state) to pass the state to the next object, if you don't do this the stack will finish. 


#### fire(string, callback) 

Runs each of the element's listeners (ie- stack.on's) in order. 

There is also a special command to initialize all of your stack elements. 

stack.fire('/element/init/yourprefix') //ie: any elements with the name my-thingy can be initialized with ```/element/init/my```


#### Supplying a default template

You can supply a default template by including it within your element. 

<my-thingy>
</my-thingy>


#### Testing
Run `npm test` to run the integration test. 
It will spawn a server on port 8080.  
If the server doesn't exit cleanly (common when tests fail), use the following (Linux) command to kill it / test again: 
```
kill `lsof -t -i:8080`; npm test
```
