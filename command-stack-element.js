var _ = require('underscore'), 
    async = require('async')

//Templating language: 
var ejs = require('ejs')
ejs.delimiter = '?' //< ex: <p><?= myVariable ?></p>

//Make available custom elements v1 API: 
require('webcomponentsjs-custom-element-v1')

//Store all elements here: 
var cse = {  entries : [] }

//### Listener (blueprint for how to build the element;
//or one page of a set of blueprints as other listeners may
//be defined)
cse.listen = function(elementName, callback) {

  //Determine if the element already entered into the stack: 
  var existingElement = _.find(this.entries, function(entry) { return entry.element.name == elementName })

  if(!existingElement) {

    //Establish the base element:    HTMLAnchorElement
    class newElement extends HTMLElement  {
      constructor() {
        super()
        this.addEventListener('click', e => {
          console.log(e)
          //fire the 'element-name/click' command...
          cse.fire('m-button/click')
        })
        this.name = elementName       
        this._template = null
        //this.template = 'replaceme'
        //this.template = this.innerHTML
        //console.log(this.innerHTML)
      }
      // static get observedAttributes() { return ["data"] }
      static get observedAttributes() { return ['template'] }

      attributeChangedCallback(name, oldValue, newValue) {
        // name will always be "template" due to observedAttributes
        this._template = newValue
        //this.render()
      }

      get template() {
        return this._template;
      }
      set template(v) {
        this.setAttribute('template', v);
      } 

      render() {
        //Render the element if it has a template: 
        // if(resultingElement.template) {
        //   resultingElement.innerHTML = ejs.render(resultingElement.template, resultingElement.data)        
        // }
        //console.log(this)
        console.log('render is called')
        //console.log(html)
        //this.innerHTML = this.innerHTML
        //console.log(this.innerHTML)
        this.innerHTML = this._template
        console.log(this.template2)
        debugger
      }

      connectedCallback() {
        //console.log('connected')
        //This is how we can confirm when a given element is added to the DOM.
        //At this point perhaps is when we populate the customEleemnt
      }
    }

    window.customElements.define(elementName, newElement)
    // var element = {
    //   name: elementName, 
    //   DOM: document.createElement(elementName)
    // }

    var element = document.createElement(elementName)

    //Make an entry for it; add to known elements and define middleware array/stack:
    this.entries.push({ middleware : [callback], element : element })
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

      //Find existing instances of the element in the document
      //and then call render on those
      //so they can update based on the latest spec (resultingElement): 
      var existingElements = document.querySelectorAll(entry.element.name)
      existingElements.forEach(function(element){
        element.render()
      })
      callback(null)
    })
  })
}

module.exports = cse
