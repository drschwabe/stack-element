//Stack Element

//Make customElements API available (Chrome54+ ok): 
if(!window.customElements) {
  require('webcomponentsjs-custom-element-v1')  
}

var async = require('async') 

var stackElement = function(stack) {
  console.log('init stackElement...')

  //Setup the models: 
  let elementProto = {
    template : ''
  }

  stack.on('/element/init/:prefix', (state, next) => {
    //For each custom element, initialize them...
    //first, scoop all elements...
    var allElems = document.querySelectorAll('html /deep/ *')
    var targetElems = _.chain(allElems)
      //filter out only the elements which contain the prefix...
      .filter((elem) => elem.localName.indexOf(state._command.prefix + '-') !== -1)
      //convert to just an array of the names: 
      .map((elem) => elem.localName)
      //remove duplicates: 
      .uniq()
      .value()

    //now loop over the names and intit them via stack.fire: 
    async.eachSeries(targetElems, (elem, callback) => {
      //Skip any elements that do not have an instance in the DOM: 
      if(!document.querySelectorAll(elem).length) return callback(null)
      stack.fire('/element/' + elem,  callback)
    }, (err) => {
      if(err) return console.log(err) 
      next(null, state)
    })
  })


  //Expose a special route for defining elements: 
  //Ex: '/element/my-button'
  stack.on('/element/:elementName', (state, next) => {  

    let elementName = state._command.elementName

    //Create a property to store the elements: 
    if(!state.elements) state.elements = []

    //Determine if the element already entered into the stack: 
    var existingElement = _.find(state.elements, function(elem) { return elem.name == elementName })

    if(!existingElement) {

      var element = _.clone(elementProto)
      element.name = elementName

      //Default renderer: 
      if(!element.render) element.render = (state) => element.template

      //Make a render route available for elements that aren't being auto-rendered: 
      stack.on('/element/' + elementName + '/render', (state, next) => {
        //Find the elem in the dom, find the corresponding elem in the state, and render/update: 
        state.element = _.findWhere(stack.state.elements, { name : elementName })
        document.querySelector(elementName).outerHTML = state.element.render(stack.state)
        next(null, state)
      })

      //Make an entry for it; add to known elements: 
      state.elements.push(element)
      state.element = element

      //Establish the DOM aspect of the element: 
      class newElement extends HTMLElement  {
        constructor() {
          super()
          this.addEventListener('click', e => {
            stack.state.element = element //Set the element. 
            stack.state.e = e
            stack.fire('/element/' + elementName + '/clicked')
          }, {
            capture: false
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
    //Skip if the current command has /element/ in it: 
    if(state._command.path.search('/element/') != -1) return next(null, state)
    var originalPath = state._command.path
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
    if(!state.element) return next(null, state) //< Skip if no element established.    
    //Find any instances of the current element in the DOM: 
    var existingDOMelements = document.querySelectorAll(state.element.name)
    existingDOMelements.forEach(function(domElem){
      //Render by replacing outerHTML with updated template. 
      if(domElem.hasAttribute('pass')) return
      //^ If element has pass attribute, we skip the rendering
      //(useful if another element is rendering it's content).
      domElem.outerHTML = state.element.render(state)
    })
    stack.state.e = null //< Reset any event. 
    next(null, state)      
  })

}


module.exports = stackElement
