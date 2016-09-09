//Stack Element

//Make available custom elements v1 API: 
require('webcomponentsjs-custom-element-v1')

var async = require('async')

var stackElement = function(stack) {
  console.log('init stackElement...')

  //Setup the models: 
  let elementProto = {
    template : ''
  }

  //Expose a special route for defining elements: 
  //Ex: '/element/my-button'
  stack.on('/element/:elementName', (state, next) => {  
    console.log('we have an element: ' + state.req.elementName)

    let elementName = state.req.elementName

    //Create a property to store the elements: 
    if(!state.elements) state.elements = []

    //Determine if the element already entered into the stack: 
    var existingElement = _.find(state.elements, function(entry) { return entry.element.name == elementName })

    if(!existingElement) {

      var element = _.clone(elementProto)
      element.name = elementName

      //Establish the base element: HTMLAnchorElement
      class newElement extends HTMLElement  {
        constructor() {
          super()
          this.addEventListener('click', e => {
            //console.log(e)
            console.log('clicked on ' + elementName)
            //fire the 'element-name/click' command...
            //cse.fire(elementName + '/click')
          })
          this.name = elementName 
        }
        connectedCallback() {
          //console.log('connected')
          //This is how we can confirm when a given element is added to the DOM.
          //To parse the element we need to undescape HTML entities...
          let template = _.unescape(this.outerHTML)
          //and then repair the EJS delimiters: 
          while(template.indexOf("<!--?") >= 0) { template = template.replace("<!--?", "<?")}
          while(template.indexOf("?-->") >= 0) { template = template.replace("?-->", "?>")}     
          element.template = template
        }
      }

      window.customElements.define(elementName, newElement)

      element.DOM = document.createElement(elementName)

      //Default renderer: 
      if(!element.render) element.render = (state)=> { return element.template }

      //Make an entry for it; add to known elements and define middleware array/stack:
      //this.entries.push({ middleware : [callback], element : element })      
      state.elements.push(element)
      state.element = element       
    } else {
      state.element = existingElement
    }
    next(null, state)    
  })

  //Expose another special route for elements to react 
  //to a root level command: 
  stack.on('/element/:elementName/on/:command', (state, next) => {
    next(null, state)
  })

  // stack.on('/element/:elementName/fire', (state, next) => {

  // })

  stack.last((state, next) => {
    console.log('stack.last()')    
    //For each element, fire the command...
    stack.lastOff() //< Disable last off to prevent infinite loop. 
    async.eachSeries(state.elements, function(element, callback) {
      var command = '/element/' + element.name + '/on' + state.req.path
      stack.fire(command, state, callback)
    }, function(err) { //Defer and then turn back on the stack.last feature: 
      _.defer(() => { stack.lastOn() })
      next(null, state)    
    })
  })

  stack.last((state, next) => {
    console.log('render state')
    //For each element on the stack...
    async.eachSeries(state.elements, function(element, callback) {
      //Find any instances of the element in the current DOM: 
      var existingDOMelements = document.querySelectorAll(element.name)
      existingDOMelements.forEach(function(domElem){
        //Render by replacing outerHTML with updated template. 
        if(domElem.hasAttribute('pass')) return
        //^ If element has pass attribute, we skip the rendering.      
        domElem.outerHTML = element.render(state)
      })            
      callback(null)
    }, function(err) {
      next(null, state)      
    })
  })

}


module.exports = stackElement
