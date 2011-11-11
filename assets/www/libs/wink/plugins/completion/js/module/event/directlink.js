/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * The direct link event module that handle all suggestions DOM node with "link" type
 * 
 * @methods:
 *  --> onClick:   	Manage the onClick event on a direct link suggestion.
 *                  Try to redirect
 *  
 * @winkVersion:
 *  --> 1.4.0
 *  
 * @compatibility:
 *  --> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6
 * 
 * @author:
 *  --> Guillaume WINTZER, Mathieu FABRE
 */

define(['../../../../../_amd/core'], function(wink)
{
	/**
	 * Define the Direct Link completion Event module
	 *
	 * @class DirectLinkEventModule class
	 * 
	 * @param properties an array containing default module properties
	 * 
	 * @returns DirectLinkEventModule the completion default Event module
	 */
	wink.plugins.completion.module.event.DirectLinkEventModule = function(properties)
	{
	    return this;
	};
	
	wink.plugins.completion.module.event.DirectLinkEventModule.prototype = 
	{
			
		onClick: function(event, index)
		{
			this._helper.getDefaultModule(this._manager).onClick(event);
			
			if (wink.isSet(this._component.getSelectedSuggestion().clickUrl))
	        {
		        document.location.href = this._component.getSelectedSuggestion().clickUrl;
		        return false;
	        }
		}
	};
});