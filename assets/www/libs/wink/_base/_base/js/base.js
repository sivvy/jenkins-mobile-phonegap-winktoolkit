/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * The wink namespace and main object
 * 
 * @methods:
 * 	--> byId: returns a DOM element
 *  --> query: Returns an array of DOM elements
 * 	--> translate: returns the translated value of a key
 *  --> setLocale: Set wink locale used for translation
 * 	--> isUndefined: returns true if the given parameter is undefined, false otherwise
 * 	--> isNull: returns true if the given parameter is null, false otherwise.
 * 	--> isSet: returns true if the given parameter is set, false otherwise.
 * 	--> isCallback: return true if the given callback object is valid (contains at least a method)
 * 	--> isString: returns true if the given parameter is a string, false otherwise.
 * 	--> isInteger: returns true if the given parameter is an integer
 *	--> isNumber: returns true if the given parameter is a number
 * 	--> isArray: returns true if the given parameter is an array
 * 	--> isBoolean: returns true if the given parameter is a boolean
 * 	--> trim: returns the given string parameter trimed
 * 	--> bind: binds a method to a given context
 * 	--> call: invokes the given callback
 * 	--> connect: connect a method to another method
 *	--> disconnect: disconnect two methods
 * 	--> setTimeout: calls a deferred method
 * 	--> setInterval: calls a deferred method
 * 	--> getUId: generates a unique identifier
 * 
 * @compatibility:
 * 	--> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.1, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Jerome GIRAUD
 */

define(['../../_kernel/js/kernel'], function(wink)
{
	wink.version = '1.4.0';
		
	wink.api = {};
	wink.fx = {};
	wink.math = {};
	wink.mm = {};
	wink.net = {};
	wink.plugins = {};
	wink.ui = 
	{
		form: {},
		layout: {},
		xy: {},
		xyz: {}
	};
	wink.ux = {};
	
	var slice = Array.prototype.slice;
	var wd = window;
	
	/**
	 * Returns a DOM element
	 * 
	 *  @parameters:
	 *	--> id: the identifier of the DOM element to return
	 */
	wink.byId = function(id)
	{
		if (wink.isString(id)) 
		{
			return document.getElementById(id);
		} else 
		{
			return id;
		}
	};
	
	/**
	 * Returns an array of DOM elements
	 * 
	 *  @parameters:
	 *	--> selector: the query selector you want to use
	 *	--> element: the element where you want to search
	 */
	wink.query = function(selector, element)
	{
		return slice.call((element||document).querySelectorAll(selector));
	};
	
	/**
	 * Set wink locale used for translation
	 * 
	 * @parameters:
	 * 	--> locale: the locale to set
	 */
	var _winklocale = "en_EN";
	wink.setLocale = function(locale)
	{
		_winklocale = locale;
	};
	
	/**
	 * Returns the translated value of a key
	 * 
	 * @parameters:
	 * 	--> key: the key identifying a ressource
	 * 	--> object: the component that holds the resource list (i18n)
	 */
	wink.translate = function(key, object)
	{
		var result = key;
		var i18n = window.i18n || {};
		if (wink.isSet(object) && wink.isSet(object.i18n))
		{
			i18n = object.i18n;
		}
		var resourceList = i18n[_winklocale];
		if (wink.isUndefined(resourceList)) {
			resourceList = i18n;
		}
		var value = resourceList[key];
		if (!wink.isUndefined(value))
		{
			result = value;
		}
		return result;
	};
	
	/**
	 * Returns true if the given parameter is undefined, false otherwise.
	 * 
	 *  @parameters:
	 *	--> object: the object to test
	 */
	wink.isUndefined = function(object) 
	{
		return (object === undefined);
	};
	
	/**
	 * Returns true if the given parameter is null, false otherwise.
	 * 
	 *  @parameters:
	 *	--> object: the object to test
	 */
	wink.isNull = function(object)
	{
		return (object === null);
	};
	
	/**
	 * Returns true if the given parameter is set, false otherwise.
	 * 
	 * @parameters:
	 *	--> object: the object to test
	 */
	wink.isSet = function(object) 
	{
		return ((!wink.isUndefined(object)) && (!wink.isNull(object)));
	};
	
	/**
	 * Returns true if the given callback object is valid (contains at least a method. It can also contain a context)
	 * 
	 * @parmameters:
	 * 	--> callback: the object to test
	 */
	wink.isCallback = function(callback) 
	{
		return !!(callback && callback.method);
	};
	
	/**
	 * Returns true if the given parameter is a string, false otherwise.
	 * 
	 *  @parameters:
	 *	--> object: the object to test
	 */
	wink.isString = function(object) 
	{
		return (typeof object == "string" || object instanceof String);
	};
	
	/**
	 * Returns true if the given parameter is an integer
	 * 
	 * @parameters:
	 * 	--> object: the object to test
	 */
	wink.isInteger = function(object)
	{
		return (parseInt(object)===object);
	};
	
	/**
	 * Returns true if the given parameter is a number
	 * 
	 * @parameters:
	 * 	--> object: the object to test
	 */
	wink.isNumber = function(object)
	{
		return (typeof object == "number" || object instanceof Number);
	};
	
	/**
	 * Returns true if the given parameter is an array
	 * 
	 * @parameters:
	 * 	--> object: the object to test
	 */
	wink.isArray = function(object)
	{
		return (typeof object == "array" || object instanceof Array);
	};
	
	/**
	 * Returns true if the given parameter is a boolean
	 * 
	 * @parameters:
	 * 	--> object: the object to test
	 */
	wink.isBoolean = function(object)
	{
		return (typeof object == "boolean" || object instanceof Boolean);
	};
	
	/**
	 * Returns true if the given parameter is a function
	 * 
	 * @parameters:
	 * 	--> object: the object to test
	 */
	wink.isFunction = function(object)
	{
		return Object.prototype.toString.call(object) === "[object Function]";
	};
	
	/**
	 * Returns the given string parameter trimed.
	 * 
	 *  @parameters:
	 *	--> str: the string to trim
	 */
	wink.trim = function(str) 
	{
		return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
	};
	
	/**
	 * Binds a method to a given context
	 * 
	 * @parameters:
	 * 	--> method: the method to bind
	 * 	--> context: the scope with which the method will be executed
	 *  --> arg1, arg2 ...: optional arguments to pass to the binded function
	 */
	wink.bind = function(method, context /*[, arg1 [, arg2 ... ] ]*/)
	{
		var args = slice.call(arguments, 2);
		return function()
		{
			var finalArgs = args.concat(slice.call(arguments, 0));
			return method.apply(context, finalArgs);
		};
	};
	
	/**
	 * Invokes the given callback
	 * 
	 * @parameters:
	 *	--> callback: the callback to invoke. The callback must be an object containing a 'method' and a 'context'.
	 *	--> parameters: parameters to pass to the callback
	 */
	wink.call = function(callback, parameters)
	{
		var context = wd;
		var method = callback.method;
		var args = [];
		
		if (wink.isSet(callback.context))
		{
			context = callback.context;
		}
	
		if (arguments.length == 2)
		{
			args = [parameters];
		}
		if (wink.isSet(callback.arguments))
		{
			var additional = callback.arguments;
			if (!wink.isArray(additional)) {
				additional = [callback.arguments];
			}
			args = args.concat(additional);
		}
		return context[method].apply(context, args);
	};
	
	/**
	 * connect a method to another method
	 * 
	 * @parameters:
	 * 	--> source: the source context
	 * 	--> method: the source method
	 * 	--> callback: a callback that will be called once the source method will be invoked
	 */
	wink.connect = function(source, method, callback)
	{
		if (!wink.isSet(callback.context)) callback.context = wd;
		
		var f = source[method];
		
		if ( wink.isNull(f) || wink.isUndefined(f.cbs) )
		{

			var _source = function()
			{
				var target = arguments.callee.target;
				var args = [];
				
				var i, l = arguments.length;
				for ( i=0; i<l; i++ )
				{
					var argi = arguments[i];
					if ( wink.isArray(argi))
					{
						args = args.concat([argi]);
					} else
					{
						args = args.concat(argi);
					}
				}
				
				target && target.apply(source, args);
				
				var cbs = source[method].cbs;
				
				for ( var cb in cbs)
				{
					if ( !wink.isArray(cbs[cb].arguments) )
					{
						wink.call({context: cbs[cb].context, method: cbs[cb].method, arguments: args.concat([cbs[cb].arguments])});
					} else
					{
						wink.call({context: cbs[cb].context, method: cbs[cb].method, arguments: args.concat(cbs[cb].arguments)});
					}
				}
			};
			
			_source.target = f;
			_source.cbs = [];
			
			f = source[method] = _source;
		}

		for ( var cb in f.cbs)
		{
			if ( (f.cbs[cb].context == callback.context) && (f.cbs[cb].method == callback.method))
			{
				return
			}
		}

		f.cbs.push(callback);
	};
	
	/**
	 * disconnect two methods
	 * 
	 * @parameters:
	 * 	--> source: the source context
	 * 	--> method: the source method
	 * 	--> callback: the callback that was previously connected
	 */
	wink.disconnect = function(source, method, callback)
	{
		if (!wink.isSet(callback.context)) callback.context = wd;
		
		var f = source[method];
		
		if ( !wink.isUndefined(f.cbs) )
		{
			for ( var cb in f.cbs)
			{
				if ( (f.cbs[cb].context == callback.context) && (f.cbs[cb].method == callback.method))
				{
					delete f.cbs[cb];
				}
			}
		}
	};
	
	/**
	 * Calls a deferred method.
	 * 
	 * @parameters:
	 *  --> context: the execution context of the method to call 
	 *  --> method: the method to call
	 *  --> delay: time to wait before calling method
	 *  --> arg1, arg2 ...: a list of caller arguments
	 */
	wink.setTimeout = function(context, method, delay /*[, arg1 [, arg2 ... ] ]*/)
	{
		var args = slice.call(arguments, 3);
		var toExecute = function()
		{
			context[method].apply(context, args);
		};
		return setTimeout(toExecute, delay);
	};
	
	/**
	 * Calls a deferred method.
	 * 
	 * @parameters:
	 *  --> context: the execution context of the method to call 
	 *  --> method: the method to call
	 *  --> delay: time to wait before calling method
	 *  --> arg1, arg2 ...: a list of caller arguments
	 */
	wink.setInterval = function(context, method, delay /*[, arg1 [, arg2 ... ] ]*/)
	{
		var args = slice.call(arguments, 3);
		var toExecute = function()
		{
			context[method].apply(context, args);
		};
		return setInterval(toExecute, delay);
	};
	
	/**
	 * Generates a unique identifier
	 */
	var _uidSequence = 100;
	wink.getUId = function()
	{
		return (_uidSequence += 1);
	};
	
	//Bindings
	if (wink.isUndefined(wd._)){_ = wink.bind(wink.translate, wink);}
	if (wink.isUndefined(wd.$$)){$$ = wink.bind(wink.query, wink);}
	if (wink.isUndefined(wd.$)){$ = wink.bind(wink.byId, wink);}
	
	return wink;
});
