/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * JSON stringification - a wink.json extension.
 * 
 * @methods:
 * 	--> stringify: Return the JSON representation of a given object
 * 
 * @compatibility
 *  --> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.1, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Mathieu HELIOT
 */
define(['../../../_base/_base/js/base', './json'], function(wink)
{
	var winkjson = wink.json,
		_stack = new Array();
	
	/**
	 * Return the JSON representation of a given value
	 * Value can be an JS object or an array
	 * Values as "undefined" and functions hasn't string representation :
	 *	- in arrays these values are represented as the String null,
	 *	- in objects these values causes the property to be excluded from stringification.
	 * Named properties are excluded from the stringification.
	 * See also ECMAScript 5 specifications
	 * for more informations about the JSON structure. 
	 * 
	 * @parameters
	 *	--> value: the object or array to transform
	 */
	winkjson.stringify = function(value)
	{
		var str;
		
		/**
		 * verify if value exists
		 */
		if ( value )
		{				
			if ( wink.isSet(window.JSON) && wink.isSet(window.JSON.stringify) )
			{
				str = window.JSON.stringify(value);
			} else
			{
				str = _str(value);
			}
		}
		
		return str;
	};	
	
	/**
	 * Transform an object to a validate JSON structure
	 * according to ECMAScript 5 specifications.
	 * ReturnS 'undefined' for 'undefined' and function values
	 * 
	 * @parameters
	 * 	--> value: the value to transform
	 */
	var _str = function(value)
	{
		var str;
		var indent = '';
		var wrapper = new Object();
		
		/**
		 * if exists a native toJSON() method for this object,
		 * let priority to this one
		 */
		if ( value && wink.isSet(value.toJSON) )
		{
			str = value.toJSON();
			
			if ( wink.isString(str) )
				str = _quote(str);
		}
		
		/**
		 * else do manually the transformation
		 */
		else
		{			
			/**
			 * if value is of type String 
			 * safety stringification of this one.
			 */
			if ( wink.isString(value) )
				str = _quote(value);
			
			/**
			 * if value is a numeric value,
			 * serializes it
			 */
			else if ( wink.isNumber(value) )
				str = ( isFinite(value) ) ? value : 'null'; 
			
			/**
			 * if value is null
			 */
			else if ( wink.isNull(value) )
				str = 'null';
			
			/**
			 * if value is of type Boolean
			 */
			else if ( wink.isBoolean(value) )
				str = ( value ) ? 'true' : 'false';
							
			/**
			 * if value is an array,
			 * serializes it by calling _JA() private method ;
			 * else is an JavaScript Object,
			 * tipicaly those which are delimited by '{' and '}',
			 * and serializes it by calling _JO() private method
			 */
			else if ( !wink.isUndefined(value) && typeof(value) != 'function' )
				str = ( wink.isArray(value) ) ? _JA(value) : _JO(value);
		}
		
		return str;
	};
	
	/**
	 * Wraps a String value in double quotes and escapes characters within it.
	 * 
	 * @parameters
	 * 	--> str: string to process
	 */
	var _quote = function(str)
	{		
		/**
		 * Character substitution function for common escapes and special characters
		 */
		function _char(c)
		{
			var chars = {
		        '\b': '\\b',
		        '\t': '\\t',
		        '\n': '\\n',
		        '\f': '\\f',
		        '\r': '\\r',
		        '"' : '\\"',
		        '\\': '\\\\'
		    };
			
		    if ( !chars[c] )
		    	chars[c] =  '\\u'+('0000'+(+(c.charCodeAt(0))).toString(16)).slice(-4);
		    
		    return chars[c];
		}
		
		var product = '"',
			txt = str,			
			specialChars = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
		
		str = txt.replace(specialChars, _char);
		
		/**
		 * add double quotes
		 */
		str = product + str + product;
		
		return str;
	};
	
	/**
	 * Serializes an object.
	 * 
	 * @parameters:
	 * 	--> object: object to serialize
	 */	
	var _JO = function(object)
	{
		var propertyList = new Array(),
			partial = new Array();
		
		/**
		 * Ensure that the structure isn't cyclical
		 */
		for ( var i=0 ; i<_stack.length ; i++ )	
	    {
			if ( _stack[i] == object )
			{
				wink.log('[JSON] The passed value is a cyclical structure.');
				return undefined;
			}
	    }
		
		_stack.push(object);
		
		/**
		 * fill properties list
		 */
		for ( var attr in object )
			propertyList.push(attr);
		
		/**
		 * fill partial array
		 */
		var strP,
			member,
			separator = ',',
			colon = ':';
		
		for ( var i=0 ; i<propertyList.length ; i++ )	
		{
			strP = _str(object[propertyList[i]]);

			/**
			 * 'undefined' and functions values
			 * causes the property to be excluded from stringification.
			 */
			if ( !wink.isUndefined(strP) )
			{
				member = _quote(propertyList[i]) + colon + strP;
				partial.push(member);
			}
		}
		
		/**
		 * make string according to partial array
		 */
		if ( partial.length == 0 )
			str = '{}';
		
		else
		{
			var properties = '';
			
			for ( var i=0 ; i<partial.length ; i++ )
				properties += partial[i] + separator;
			
			properties = properties.slice(0,-1);
			str = '{' + properties + '}'; 
		}
		
		_stack.pop();
		
		return str;
	};
	
	/**
	 * Serializes an array.
	 * 
	 * @parameters:
	 * 	--> array: array to serialize
	 */
	var _JA = function(array)
	{
		var partial = new Array(),
			separator = ',',
			str;
		
		/**
		 * Ensure that the structure isn't cyclical
		 */
		for ( var i=0 ; i<_stack.length ; i++ )	
	    {
			if ( _stack[i] == array )
			{
				wink.log('[JSON] The passed value is a cyclical structure.');
				return undefined;
			}
	    }
		
		_stack.push(array);
		
		/**
		 * According to ECMAScript 5 spec, the representation of arrays
		 * includes only the elements between zero and array.length – 1 inclusive.
		 * Named properties are excluded from the stringification.
		 */		
		var strP;
		
		for ( var i=0 ; i<array.length ; i++ )	
		{
			strP = _str(array[i]);
			
			/**
			 * 'undefined' and functions values 
			 * are represented as the String null
			 */
			partial.push( ( wink.isUndefined(strP) ) ? 'null' : strP );
		}
		
		/**
		 * make string according to partial array
		 */
		if ( partial.length == 0 )
			str = '[]';
		
		else
		{
			var properties = '';
			
			for ( var i=0 ; i<partial.length ; i++ )
				properties += partial[i] + separator;
			
			properties = properties.slice(0,-1);
			str = '[' + properties + ']'; 
		}
		
		_stack.pop();
		
		return str;
	};
	
	return winkjson;
});