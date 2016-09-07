# Commando Components

## Usage
`npm install commando-component`
```javascript
var commando.plugin(require('commando-component'))

commando.component('my-thingy', function(state, component, next) {
  next(null, state, component)
})
commando.component('my-thingy', '/some-route', function(state, component, next) {
  //Do something on a specific route. 
  next(null, state, component)
})
```

#### shorthand
If you want a more compact solution than you can leverage the existing commando object and state by doing. 
```
require('commando-component')(commando)

commando('component:my-thingy', function(state, next) {
  //state.component is now available
  next(null, state)
})
commando('component:my-thingy', '/some-route', function(state, next) {
  //state.req is the second paramater
  next(null, state)
})
```


### listen(name, callback)

Accepts a name and a callback function that are used to define the order of the stack.


### fireAll(state, callback) 

Runs each of the callbacks in order, saving the resulting element as a property so that on the next fire said element is used.  





## Plugins

### EJS
(hard coded; included as part of Commando as the default templating language)

#### Browserify CSS
Extends the commado component with `.addClass()` function for adding CSS definitions. 
```
npm install commando-component-css
```
```javascript
require(commando-component-css)(commando)
commando.component('my-thingy', function(state, component, next) {
  component.addClass(`
    a { 
      color: green, 
      text-decoration: none
    }`)
})
```
