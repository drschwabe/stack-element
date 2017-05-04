//(browserify me into bundle.js)

//Require stack and make it a global: 
window.stack = require('../node_modules/stack-core') 

//then stack element: 
require('../stack-element.js')(stack)


