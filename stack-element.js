//Stack Element

//Make available custom elements v1 API: 
require('webcomponentsjs-custom-element-v1')

var stackElement = function(stack) {
  console.log('init stackElement...')

  //Setup the models: 
  let elementProto = {
    template : ''
  }

//  stack.on('/element/m-button', (state, next) => {
  stack.on('/element/:elementName', (state, next) => {  
    console.log('we have an element: ' + state.req.elementName)

    let elementName = state.req.elementName

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
      if(!element.render) element.render = (state)=> { element.DOM.innerHTML = element.template }

      //Make an entry for it; add to known elements and define middleware array/stack:
      //this.entries.push({ middleware : [callback], element : element })      
      state.element = element 
    } else {
      state.element = existingElement
    }
    next(null, state)    
  })
}


module.exports = stackElement
