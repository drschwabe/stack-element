var _ = require('underscore'), 
    async = require('async')


//Make available custom elements v1 API: 
require('webcomponentsjs-custom-element-v1')

var cse = {  entries : [] }

//### Listener (blueprint for how to build the element;
//or one page of a set of blueprints as other listeners may
//be defined)
cse.listen = function(elementName, callback) {
  //Determine if the element already entered into the stack:   
  var existingElement = _.find(this.entries, function(entry) { entry.element.name == elementName })

  if(!existingElement) {
    //Establish the base element: 
    window.customElements.define(elementName, class extends HTMLElement {
      constructor() {
        super()
        this.name = elementName        
        this.addEventListener('click', e => {
          console.log(e)
          //fire the 'element-name/click' command. 
        })
      }
    })
    baseElement = document.createElement(elementName)

    //Make an entry for it; add to known elements and define middleware array/stack:
    this.entries.push({ middleware : [callback], element : baseElement })
  } else {
    //If the element already exists, just push the new middleware into the 
    //existing stack: 
    existingElement.middleware.push(callback)
  }
}

//Fire (build the element)
cse.fire = function(elementName, state, callback) {
}

//Fire all elements in parallel: 
cse.fireAll = function(state, callback) {
  var that = this
  this.entries.forEach(function(entry, index, arr) {

    //Seed the element's middleware with the state and element: 
    var middlewareToRun = entry.middleware.slice(0)
    middlewareToRun.unshift(function(next) { next(null, state, entry.element) })

    //Run the middleware stack: 
    async.waterfall(middlewareToRun, function(err, state, resultingElement ) {
      if(err) return console.log(err)
      //Put back the resulting element so it's changes are retained for the next loop:  
      that.entries[index].element = resultingElement
      callback(null)
    })
  })
}

module.exports = cse
