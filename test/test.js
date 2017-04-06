var test = require('tape'), 
    Nightmare = require('nightmare')
    nightmare = new Nightmare({
      show : true, 
      always_on_top: false
    })
    stack = require('stack'), 
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
  .end()
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
    console.log('here are the elements: ')
    console.log(state.elements)
    t.equals(_.isObject(state), true, 'Stack state is initialized')
    t.equals(state.elements[0].connected, true, 'Stack element connected.')
    t.equals(state.elements[0].name, 'my-element', "Element's name is correct.")
    t.equals(state.elements[0].template, '<my-element>This is a stack element</my-element>', "Template is good.")
    t.equals(state.ranMyElementConnectedCommand, true, "/element/my-element/connected listener invoked" )
    t.equals(state.firedElementInitPrefix, true, "successful fire of element/init/(prefix) and it reaches bottom of stack" )

  })
  .catch((err) => console.log(err))
})


test.onFinish(() => server.close())
