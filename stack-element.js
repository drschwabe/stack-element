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

  // stack.on('/element/init', (state, next) => {
  //   console.log('init all elements...')
  //   //next(null, state)
  //   //find all of the listeners...
  //   debugger
  //   async.eachSeries(state.elements, function(element, callback) {
  //     stack.fire('/element/' + element.name, state, callback)
  //   }, (err) => {
  //     console.log('initialized all elements.')
  //     next(null, state)
  //   })
  // })  


  //Expose a special route for defining elements: 
  //Ex: '/element/my-button'
  stack.on('/element/:elementName', (state, next) => {  
    //console.log('we have an element: ' + state.req.elementName)

    let elementName = state.req.elementName

    //Create a property to store the elements: 
    if(!state.elements) state.elements = []

    //Determine if the element already entered into the stack: 
    var existingElement = _.find(state.elements, function(elem) { return elem.name == elementName })

    if(!existingElement) {

      var element = _.clone(elementProto)
      element.name = elementName

      //Default renderer: 
      if(!element.render) element.render = (state) => element.template

      //Make an entry for it; add to known elements: 
      state.elements.push(element)
      state.element = element

      //Establish the DOM aspect of the element: 
      class newElement extends HTMLElement  {
        constructor() {
          super()
          this.addEventListener('click', e => {
            console.log('clicked on ' + elementName)
            //fire the 'element-name/click' command...
          })
          this.name = elementName 
        }
        connectedCallback() {
          //The given element has been added to the DOM...          
          if(element.connected) return
          //get the raw innerHTML of the element: 
          element.template = this.outerHTML
          element.connected = true //< flag so this doesn't run again.
          stack.fire('/element/' + elementName + '/connected', state, function(err, newState) {
            next(null, newState)
          })
          //^ so consumers can do stuff to the element after it connects.
        }
      }

      //This effectively fires the 'connected' event above...
      window.customElements.define(elementName, newElement)
      element.DOM = document.createElement(elementName) 

    } else {
      state.element = existingElement
      next(null, state)          
    }
  })

  //Run an extra command based on the current command, 
  //specifically for a given element: 
  stack.last((state, next) => {
    //console.log('stack.last() ... attempting to run root command for each element')
    console.log('stack.last() run root command: ' + state.req.path)   
    //Skip if the current command has /element/ in it: 
    if(state.req.path.search('/element/') != -1) return next(null, state)
    var originalPath = state.req.path
    //For each element, fire the command...
    async.eachSeries(state.elements, function(element, callback) {
      var command = '/element/' + element.name + '/on' + originalPath
      state.element = element
      stack.fire(command, state, callback)
    }, function(err) { //Defer and then turn back on the stack.last feature: 
      next(null, state)    
    })
  })

  stack.last((state, next) => {
    //Find any instances of the current element in the DOM: 
    var existingDOMelements = document.querySelectorAll(state.element.name)
    existingDOMelements.forEach(function(domElem){
      //Render by replacing outerHTML with updated template. 
      if(domElem.hasAttribute('pass')) return
      //^ If element has pass attribute, we skip the rendering
      //(useful if another element is rendering it's content).
      domElem.outerHTML = state.element.render(state)
    })            
    next(null, state)      
  })

}


module.exports = stackElement
