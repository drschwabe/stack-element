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
  t.plan(4)
  nightmare
  .on('console', function(type, msg, errorStack) {
    console.log(msg)
    if(errorStack) console.log(errorStack) 
  })    
  .goto('http://localhost:8080/test')
  .wait(1000)
  .end()
  .evaluate((done)=> {
    stack.fire('element/init/my', (err, state) => {
      return done(null, state)
    })    
  }) 
  .then((state) => {
    console.log('here are the elements: ')
    console.log(state.elements)
    t.ok(_.isObject(state), 'Stack state is initialized')
    t.ok(state.elements[0].connected, 'Stack element connected.')
    t.equals(state.elements[0].name, 'my-element', "Element's name is correct.")
    t.equals(state.elements[0].template, '<my-element>This is a stack element</my-element>', "Template is good.")
  })
  .catch((err) => console.log(err))
})


test.onFinish(() => server.close())
