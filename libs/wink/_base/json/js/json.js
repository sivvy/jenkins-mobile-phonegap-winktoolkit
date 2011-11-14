/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * JSON utility
 * 
 * @methods:
 * 	--> parse: Test the validity of a JSON structure and evaluate it
 * 	--> concat: Concatenate the given JSON structures
 * 
 * @compatibility:
 * 	--> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.1, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Jerome GIRAUD
 */

define(['../../../_base/_base/js/base'], function(wink)
{
	var windowJson = window.JSON;
	
	wink.json = 
	{
		/**
		 * Test the validity of a JSON structure and evaluate it
		 * Follow the JSON.org implementation
		 * 
		 * @parameters
		 * 	--> str: the string to evaluate
		 */
		parse: function(str)
		{
			if (wink.isSet(windowJson) && wink.isSet(windowJson.parse))
			{
				return windowJson.parse(str);
			} else
			{
				var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
	     
				str = String(str);
				
				cx.lastIndex = 0;
			    
				if (cx.test(str))
				{
					str = str.replace(cx, function(a)
					{
			            return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
			        });
			    }
		    
			    if (/^[\],:{}\s]*$/.test(str.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, '')))
			    {
			    	var JSON = eval('(' + str + ')');
			    }
		    
			    return JSON;
			}
		},
		/**
		 * Concatenate the given JSON structures
		 * 
		 * @parameters
		 * 	--> obj1: the object that will be updated with the second
		 * 	--> obj2: the object that will be concatenated to the first
		 */
		concat: function(obj1, obj2)
		{
			for (var key in obj2)
			{
				obj1[key] = obj2[key];
			}
			
			return obj1;
		}
	};
	
	//Bindings
	wink.parseJSON = wink.bind(wink.json.parse, wink.json);
	wink.mixin = wink.bind(wink.json.concat, wink.json);
	
	return wink.json;
});