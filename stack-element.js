//Stack Element

//Make customElements API available (Chrome54+ ok): 
if(!window.customElements) {
  require('webcomponentsjs-custom-element-v1')  
}

var async = require('async'), 
    _ = require('underscore')

var stackElement = function(stack) {

  //Setup the models: 
  let elementProto = {
    template : ''
  }

  stack.on(['/element/init/:prefix', 'element/init/:prefix'], (state, next) => {
    //For each custom element, initialize them...
    //first, scoop all elements...
    var allElems = document.querySelectorAll('html /deep/ *')
    var targetElems = _.chain(allElems)
      //filter out only the elements which contain the prefix...
      .filter((elem) => elem.localName.indexOf(state._command.prefix + '-') !== -1)
      //convert to just an array of the names: 
      .map((elem) => elem.localName)
      .value()

    //now loop over the names and intit them via stack.fire: 

    var stackElemCount = 0
    var elementsFired = []
    async.eachSeries(targetElems, (elem, callback) => {
      //Skip any elements that do not have an instance in the DOM: 
      if(!document.querySelectorAll(elem).length) return callback(null)
      if(elem == 'stack-element') {
        //if the name of the element is 'stack-element' here we adjust the name to 'stack-element-x' where x is simply a count ie- 1, 2, 3
        //Find the element and change it's outerHTML: 
        document.querySelector('stack-element').outerHTML = '<stack-element-' + stackElemCount + '>' + document.querySelector('stack-element').innerHTML + '</stack-element-' + stackElemCount + '>'
        //TODO: don't ignore attributes
        elem = 'stack-element-' + stackElemCount
        stackElemCount++
      }
      //Avoid firing a duplicate by pushing it to an array and then checking for matches.... 
      elementsFired.push(elem)
      //(could have removed duplicates earlier in one line, but this technique let's us
      //accommodate for stack-elements which need to be 'de-duplicated' and renamed in place as above)
      if(_.filter(elementsFired, (firedElem) => firedElem == elem).length == 1) {
        stack.fire('/element/' + elem,  callback)
      } else {
        callback()
      }
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
}


module.exports = stackElement
