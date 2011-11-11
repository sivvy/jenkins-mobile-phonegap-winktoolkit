/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Wink AMD loader
 * For more information: http://www.commonjs.org/
 * 
 * @methods:
 * 	--> define: AMD modules definition
 * 
 * @compatibility:
 * 	--> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.1, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Jerome GIRAUD
 */

/**
 * AMD modules definition
 * 
 * @parameters:
 *	--> mid: the unique id of the module
 *	--> dependencies: the list of dependencies of the module
 *	--> factory: the module constructor
 */
define = function(mid, dependencies, factory)
{
	//--> DUMB AMD define IMPLEMENTATION
	if (typeof wink == 'undefined')
	{
		wink = {};
	}

	var args = arguments, 
		arity = args.length, 
		f, 
		d = null;
	
	if ( arity == 1 )
	{
		f = args[0];
	}
	else if (  arity == 2 )
	{
		f = args[1];
		if (typeof args[0] == "array" || args[0] instanceof Array)
		{
			d = args[0];
		}
	}
	else
	{
		f = args[2];
		d = args[1];
	}
	
	return f(wink);
	//<-- DUMB AMD define IMPLEMENTATION
};

define.amd =
{
	vendor: 'winktoolkit.org'
};