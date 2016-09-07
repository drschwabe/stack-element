var _ = require('underscore'), 
    async = require('async')

//Make available custom elements v1 API: 
require('webcomponentsjs-custom-element-v1')

//Store all elements here: 
var cse = {  
  entries : [], 
  commandstack : require('command-stack') //< Store it's own commandstack too. 
}

//Base model for the element: 
cse.element = {
  template : '', //< set on connectedCallback to whatever is the innerHTML.
}
//(plugins should extend this object)

//### Plugins ###: 
//EJS Templates: 
var ejs = require('ejs')
ejs.delimiter = '?' //< ex: <p><?= myVariable ?></p>
//Main render function: 
cse.element.render = function(state) {
  return ejs.render(this.template, { state: state })
}
//jQuery/cheerio: 

//Browserify CSS: 
cse.element.addStyle = function(css) {
  require('browserify-css').createStyle(`${this.name} ${css}`)  
}
//###

//### Listener (blueprint for how to build the element;
//or one page of a set of blueprints as other listeners may
//be defined)
cse.listen = function(elementName, callback) {

  //Determine if the element already entered into the stack: 
  var existingElement = _.find(this.entries, function(entry) { return entry.element.name == elementName })

  if(!existingElement) {

    var element = _.clone(cse.element)
    element.name = elementName

    //Establish the base element: HTMLAnchorElement
    class newElement extends HTMLElement  {
      constructor() {
        super()
        this.addEventListener('click', e => {
          //console.log(e)
          console.log('clicked on ' + elementName)
          //fire the 'element-name/click' command...
          cse.fire(elementName + '/click')
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
    if(!element.render) element.render = (state)=> { element.DOM.innerHTML = element.template }

    //middleware : [callback]
    //load any additional plugins here

    //Make an entry for it; add to known elements and define middleware array/stack:
    this.entries.push({ middleware : [callback], element : element })
  } else {
    //If the element already exists, just push the new middleware into the 
    //existing stack: 
    existingElement.middleware.push(callback)
  }
}



//Fire (build the element)
cse.fire = function(elementName, callback) {
  var that = this
  // this.commandstack.fire(path, this.commandstack.latestState, function(err, newState) {
  //   //After firing the standard commandstack, run the middleware for just this element.
  //   var targetEntry = _.findWhere(that.entries, { name: elementName })
  //   cse.fireEnties([targetEntry], callback)    
  // })
}

//Fire all elements in parallel: 
cse.fireAll = function(state, callback) {
  var that = this
  this.entries.forEach(function(entry, index, arr) {

    //Seed the element's middleware with the state and element: 
    var middlewareToRun = entry.middleware.slice(0)

    //Pad each middleware function with a jquery: 
    //i did some padding in the original command-stack i believe; can reference the technique there
    //then can load jquery cheerio on each call, pre-bake the $this object

    middlewareToRun.unshift(function(next) { next(null, state, entry.element) })

    //Run the middleware stack: 
    async.waterfall(middlewareToRun, function(err, state, resultingElement ) {
      if(err) return console.log(err)

      //Put back the resulting element so it's changes are retained for the next loop:  
      that.entries[index].element = resultingElement

      //Find existing instances of the element in the document
      //so they can update based on the latest spec (resultingElement): 
      var existingDOMelements = document.querySelectorAll(entry.element.name)
      existingDOMelements.forEach(function(element){
        //debugger
        //Render by updating innerHTML with EJS output: 
        //element.render(state)
        //If element has pass attribute, we skip the rendering: 
        if(element.hasAttribute('pass')) return
        element.outerHTML = resultingElement.render(state)
      })
      console.log('rendered ' + entry.element.name)
      callback(null)
    })
  })
}


module.exports = cse
