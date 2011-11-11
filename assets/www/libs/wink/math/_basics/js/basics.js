/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * math basics library.
 * 
 * @methods:
 * 	--> round: Returns the rounded value to a given number of decimal places.
 * 
 * @compatibility
 *  --> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.1, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Sylvain LALANDE
 */
define(['../../../_base/_base/js/base'], function(wink)
{
	wink.math = 
	{
		/**
		 * Returns the rounded value to a given number of decimal places.
		 * 
		 * @parameters:
		 *  --> n: the value to round
		 *  --> d: number of decimal places
		 */
		round: function(n, d)
		{
			if (!wink.isSet(d))
			{
				d = 0;
			}
			var nd = Math.pow(10, d);
			return Math.round(n * nd) / nd;
		}
	};
	
	return wink.math;
});