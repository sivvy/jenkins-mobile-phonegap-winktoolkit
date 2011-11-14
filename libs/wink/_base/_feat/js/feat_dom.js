/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * dom features detection.
 * 
 * @features:
 * 	--> TODO dom-addeventlistener
 * 	--> TODO dom-dataset
 * 	--> TODO dom-html5-elements
 * 	--> TODO dom-dynamic-base
 * 
 * @compatibility:
 * 	--> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.1, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Sylvain LALANDE
 */

define(['../../../_base/_base/js/base', './feat'], function(wink)
{
	return wink.has;
});