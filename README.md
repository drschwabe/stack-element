# Command Stack Elements

### listen(name, callback)

Accepts a name and a callback function that are used to define the order of the stack.


### fireAll(state, callback) 

Runs each of the callbacks in order, saving the resulting element as a property so that on the next fire said element is used.  
