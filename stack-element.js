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
          if(element.connected) return
          //Get the raw innerHTML of the element: 
          element.template = this.outerHTML
          //The given element has been added to the DOM.
          stack.fire('/element/' + elementName + '/connected')
          //TODO ^ update fire so that it uses latest state. 
          //this fire above is a good use case; since it is implied that
          //we don't necessarily have the current state. 
          element.connected = true
        }
      }

      //Default renderer: 
      console.log('add default render')
      if(!element.render) element.render = (state)=> { return element.template }

      //Make an entry for it; add to known elements: 
      state.elements.push(element)
      state.element = element

      //Kind of a hack: 
      stack.on('/element/' + elementName + '/connected', function(state2, next2) {
        return next(null, state2)
      })

      //This effectively fires the 'connected' event above...
      window.customElements.define(elementName, newElement)
      element.DOM = document.createElement(elementName)

    } else {
      state.element = existingElement
      next(null, state)          
    }
  })

  //Expose another special route for elements to react 
  //to a root level command: 
  // stack.on('/element/:elementName/on/:command', (state, next) => {
  //   next(null, state)
  // })

  // stack.on('/element/:elementName/fire', (state, next) => {

  // })

  stack.last((state, next) => {
    console.log('stack.last() ... attempting to run root command for each element')   
    console.log('current command path: ')
    console.log(state.req.path) 
    //Skip if the current command has /element/ in it: 
    if(state.req.path.search('/element/') != -1) return next(null, state)
    var originalPath = state.req.path
    //For each element, fire the command...
    async.eachSeries(state.elements, function(element, callback) {
      // if(state.req.path.search('/on/') != -1 || state.req.path.search('/element/') != -1
      // ) return callback(null)      
      //^ Avoids the command from being appended multiple times. 
      var command = '/element/' + element.name + '/on' + originalPath
      state.element = element
      // console.log('new command path: ')
      // console.log(command)
      // console.log('current element: ')
      // console.log(element.name)

      stack.fire(command, state, callback)
    }, function(err) { //Defer and then turn back on the stack.last feature: 
      next(null, state)    
    })
  })

  stack.last((state, next) => {
    console.log('render state... ')
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
