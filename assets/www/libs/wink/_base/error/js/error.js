/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Implements an error managemennt system
 * 
 * @methods:
 *	--> log: display a log message if the log level has been set to 1
 *
 * @attributes:
 * 	--> logLevel: If set to 0, no message will be displayed. If set to 1, the log messages will be displayed. The default value is 0.
 *
 * @compatibility:
 * 	--> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.1, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Jerome GIRAUD		
 */
define(['../../../_base/_base/js/base'], function(wink)
{
	wink.error =
	{
		logLevel: 0,
		
		/**
		 * Display a log message if the log level has been set to 1
		 * if the console is defined, use the console, otherwise, alert the user
		 * 
		 * @parameters:
		 *	--> value: content of the log
		 */
		log: function(value)
		{
			if ( this.logLevel == 1)
			{
				if ( typeof console != 'undefined' )
				{
					console.log(value);
				} else
				{
					alert(value);
				}
			}
		}
	
	};
	
	//Bindings
	wink.log = wink.bind(wink.error.log, wink.error);
	
	return wink.error;
});