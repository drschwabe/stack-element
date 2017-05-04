var test = require('tape'), 
    Nightmare = require('nightmare')
    nightmare = new Nightmare({
      show : true, 
      alwaysOnTop: false
    })
    http = require('http'), 
    ecstatic = require('ecstatic'), 
    path = require('path'), 
    _ = require('underscore')

var server = http.createServer(
  ecstatic({root: path.resolve(__dirname,  '../')})
).listen(8080)

console.log('http server for testing started on http://localhost:8080');

test("Stack element in a static .html page", (t) => {
  t.plan(6)
  nightmare
  .on('console', function(type, msg, errorStack) {
    console.log(msg)
    if(errorStack) console.log(errorStack) 
  })
  .goto('http://localhost:8080/test')
  .wait(1000)
  .evaluate((done)=> {
    stack.on('/element/my-element/connected', (state, next) => {
      state.ranMyElementConnectedCommand = true
      console.log('my element connected')
      next(null, state)
    })
    stack.fire('element/init/my', (err, state) => {
      console.log('fired element/init/my')
      state.firedElementInitPrefix = true      
      return done(null, state)      
    })
  })
  .then((state) => {
    t.equals(_.isObject(state), true, 'Stack state is initialized')
    t.equals(state.elements[0].connected, true, 'Stack element connected.')
    t.equals(state.elements[0].name, 'my-element', "Element's name is correct.")
    t.equals(state.elements[0].template, '<my-element>This is a stack element</my-element>', "Template is good.")
    t.equals(state.ranMyElementConnectedCommand, true, "/element/my-element/connected listener invoked" )
    t.equals(state.firedElementInitPrefix, true, "successful fire of element/init/(prefix) and it reaches bottom of stack" )
  })
  .catch((err) => console.log(err))  
})

test("Multiple instances stack-elements", (t) => {
  t.plan(2)
  nightmare
  .goto('http://localhost:8080/test/multiple-elements.html')
  .wait(1000)
  .inject('js', `node_modules/jquery/dist/jquery.js`)
  .evaluate((done)=> {
    var results = {}
    stack.on('/element/my-element/connected', (state, next) => {
      console.log('my element connected')
      next(null, state)
    })
    stack.fire('element/init/my', (err, state) => {
      console.log('fired element/init/my')
      results.stackState = state 
      results.myElementQuery = $('my-element')
      results.firstElementHTML = $('my-element')[0].innerHTML
      results.secondElementHTML = $('my-element')[1].innerHTML      
      return done(null, results) 
    })    
  })
  .end()  
  .then((results) => {
    t.equals(results.myElementQuery.length, 2, "There are 2 'my-elements'")
    t.equals(results.firstElementHTML, results.secondElementHTML, "Two instances of the same element have the same HTML (even though during initial state of the DOM they were different).")
  })
  .catch((err) => console.log(err))  
})


test.onFinish(() => server.close())
