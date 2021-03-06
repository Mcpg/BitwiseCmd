import is from './is';
    
    var handlers = [];

var config = {
    errorHandler: (input, err) => logError(err)
}

var cmd = {
        debugMode: false,
        execute: function(rawInput) {
            var input = rawInput.trim().toLowerCase();
            var handler = findHandler(input);

            if(handler != null) {
                if(this.debugMode) {
                    invokeHandler(input, handler);
                } else {
                    try {
                        invokeHandler(input, handler);
                    } catch (e) {
                         config.errorHandler(input, e);
                    }
                }
            }
            else {
                logError(input, new Error("Unsupported expression: " + input.trim()));
            }
        },
        commands: function(catalog) {
            for(var key in catalog) {
                if(catalog.hasOwnProperty(key)) {
                    this.command(key, catalog[key]);
                }
            }
        },
        command: function(cmd, handler) {
            var h = createHandler(cmd, handler);
            if(h == null){
                console.warn('unexpected set of arguments: ', Array.prototype.splice.call(arguments));
                return;
            }

            if(!is.aFunction(h.canHandle)) {
                console.warn('handler is missing "canHandle" function. registration denied.');
                return;
            }

            if(!is.aFunction(h.handle)) {
                console.warn('handler is missing "handle" function. registration denied.');
                return;
            }

            handlers.push(h);
        },
        clear: function() {
            console.log('clear');
        },
        onError: function(handler) {
            config.errorHandler = handler;
        }
    };

    function logError(err) {
        console.error(err)
    }

    function invokeHandler (input, handler) {

        var cmdResult = handler.handle({ input: input});
        if(cmdResult != null) {
            console.log(cmdResult);
        }
    }

    function createHandler (cmd, handler) {
        if(is.plainObject(cmd)) {
            return cmd;
        }

        if(is.string(cmd)) {
            return { canHandle: function (input) { return input === cmd; }, handle: handler };
        }

        return null;
    }

    function findHandler (input) {
        var i= 0;
        for(i;i<handlers.length; i++) {
            if(handlers[i].canHandle(input)) {
                return handlers[i];
            }
        }
    };

export default cmd;