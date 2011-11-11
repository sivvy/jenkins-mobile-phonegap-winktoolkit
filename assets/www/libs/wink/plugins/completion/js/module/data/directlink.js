/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * The direct link data module that handle all suggestion with "link" type
 * 
 * @methods:
 *  --> start:                  Start the module
 *  --> processSuggestion:      Process the current suggestion using data
 *  
 * @attributes:
 *  --> mapping:                The mapping array between data key name and internal suggestion key name
 * 
 * @properties:
 *  data =
 *  {
 *      mapping:                [Optional] The mapping array between data key name and internal suggestion key name.
 *                              Default mapping is : 
 *                              {
 *                                  "clickUrl": "clickUrl"
 *                              }
 *  }
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
	 * Define the direct link completion data module     
	 *
	 * @class DirectLinkDataModule class
	 * 
	 * @param properties an array containing direct link module properties
	 * 
	 * @returns DirectLinkDataModule the completion direct link data module
	 */
	wink.plugins.completion.module.data.DirectLinkDataModule = function(properties)
	{    
	    /**
	     * The ready state of the module
	     * @type boolean
	     */
	    this._ready = false;
	    
	    /**
	     * The mapping of the direct link module
	     * @type object
	     */
	    this.mapping = {
	        "clickUrl": "clickUrl"
	    };
	    
	    // Save properties
	    wink.mixin(this, properties);
	    
	    this._ready = true;
	};
	
	wink.plugins.completion.module.data.DirectLinkDataModule.prototype = 
	{   
	    /**
	     * Start the module by returning
	     * the state value
	     * 
	     * @return boolean
	     */
	    start: function()
	    {
	        if (!this._ready)
	        {
	        	//wink.log("[DirectLinkDataModule] Could not be started, configuration failed");
	        }
	            
	        return this._ready;
	    },
	    
	    /**
	     * Process the current suggestion using data
	     *  
	     * @param object suggestion The new suggestion
	     * @param array data The parsed data
	     */
	    processSuggestion: function(suggestion, data)
	    {
	        // Check the direct link type
	        if (!this._helper.isModuleType(this, suggestion))
	            return;
	        
	        // Loop on direct link special keys
	        for (var suggestionKey in this.mapping)
	        {
	            var sourceKey = this.mapping[suggestionKey];
	            
	            if (data[sourceKey])
	                suggestion[suggestionKey] = data[sourceKey];
	        }
	    }
	
	};
});