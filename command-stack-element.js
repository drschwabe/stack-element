var _ = require('underscore'), 
    async = require('async')

var cse = {}

//Listener (blueprint for how to build the element;
//or one page of a set of blueprints as other listeners may
//be defined)

cse.elements = []

cse.listen = function(elementName, callback) {
  var existingElement = _.findWhere(this.elements, { name: elementName })

  //Determine if the route already exists:
  if(!existingElement) {
    //Make an entry for it; add to known elements and define middleware array/stack:
    this.elements.push({ middleware : [callback], name: elementName })
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
  this.elements.forEach(function(entry, index, arr) {

    //Seed the element's middleware with the state and skeletonElement: 
    var middlewareToRun = entry.middleware.slice(0)
    middlewareToRun.unshift(function(next) { next(null, state, entry.element) })

    //Run the middleware stack: 
    async.waterfall(middlewareToRun, function(err, state, resultingElement ) {
      if(err) return console.log(err)
      //Put back the resulting element so it's changes are retained for the next loop:  
      that.elements[index].element = resultingElement
      callback(null)
    })
  })
}

module.exports = cse
