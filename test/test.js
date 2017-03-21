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

// test('Stack is loaded', (t) => {
//   t.plan(1)
//   nightmare
//   .on('console', function(type, msg, errorStack) {
//     console.log(msg)
//     if(errorStack) console.log(errorStack) 
//   })  
//   .goto('http://localhost:8080/test')
//   .evaluate(() => window.stack)
//   .then((stack) => t.ok(_.isObject(stack)))
//   .catch((error) => console.error(error))
// })

test('A custom element existing in the DOM is recognized on page load', (t) => {
  t.plan(1)
  nightmare
  .on('console', function(type, msg, errorStack) {
    console.log(msg)
    if(errorStack) console.log(errorStack) 
  })    
  .goto('http://localhost:8080/test')
  .end()
  .evaluate(function() {

    //window.stack.fire('hello')
    return window.stack
  })
  .then((stack) => {
    console.log(stack)
  })
})



test.onFinish(() => server.close())
