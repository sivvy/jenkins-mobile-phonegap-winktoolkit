/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * The default dom module that handle all suggestions DOM node with default type
 * 
 * @methods:
 *  --> start:                  Start the module
 *  --> processSuggestion:      Display the current suggestion DOM node
 *  
 * @attributes:
 *  --> boldSuggestion:         Indicate if we have to bold the suggestion value 
 *  --> clearAccents:           Indicate if we have to remove accents before comparison
 *  --> clearSeparatorChars:    Indicate if we have to remove special chars before comparison
 *  --> callbacks:              [Optional] The array containing all processable callbacks
 * 
 * @properties:
 *  data =
 *  {
 *      boldSuggestion:         [Optional] Indicate if we have to bold the suggestion value. Default is true
 *      clearAccents:           [Optional] Indicate if we have to remove accents before comparison. Default is false
 *      clearSeparatorChars     [Optional] Indicate if we have to remove special chars before comparison. Default is false
 *      callbacks               [Optional] The array containing all processable callbacks
 *                                  Available callbacks are :
 *                                      - "customDisplay" : Create a custom suggestion DOM node content
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
	 * Define the default completion DOM module
	 *
	 * @class DefaultDomModule class
	 * 
	 * @param properties an array containing default module properties
	 * 
	 * @returns DefaultDomModule the completion default DOM module
	 */
	wink.plugins.completion.module.dom.DefaultDomModule = function(properties)
	{
	    /**
	     * Indicate if we have to bold suggestion
	     * @type boolean
	     */
	    this.boldSuggestion = true;
	    
	    /**
	     * Indicate if we have to clear accents
	     * @type boolean
	     */
	    this.clearAccents = false;
	    
	    /**
	     * Indicate if we have to clear separator chars
	     * @type boolean
	     */
	    this.clearSeparatorChars = false;
	    
	    /**
	     * The ready state of the module
	     * @type boolean
	     */
	    this._ready = false;
	    
	    /**
	     * Callbacks of the module
	     * @type object
	     */
	    this.callbacks = {};
	    
	    // Save properties
	    wink.mixin(this, properties);
	    
	    this._ready = true;
	};
	
	wink.plugins.completion.module.dom.DefaultDomModule.prototype = 
	{    
	    /**
	     * Return the ready status
	     * 
	     * @return boolean
	     */
	    start: function()
	    {
	        return this._ready;
	    },
	    
	    /**
	     * Display the current suggestion DOM node
	     * 
	     * @param object suggestion The current suggestion 
	     * @param HTMLElement domNode The suggestion DOM node
	     */
	    processSuggestion: function(suggestion, domNode)
	    {
	    	var callback = null;
	    	var args = [suggestion, domNode];
	    	if(this.callbacks["customDisplay"])
	    	{
	    		callback = this.callbacks["customDisplay"];
	    	}
	    	else
	    	{
	    		callback = { context: this, method: "_defaultDisplay"};
	    		args.push(this.boldSuggestion);
	    	}
	        wink.call(wink.json.concat(callback, {arguments: args}));
	    },
	    
	    /**
	     * Default display callback
	     * 
	     * @param object suggestion The current suggestion 
	     * @param HTMLElement domNode The suggestion DOM node
	     */
	    _defaultDisplay: function(suggestion, domNode, boldSuggestion)
	    {
	        var node = document.createElement("span");
	        
	        var textValue = suggestion.value;
	        if (boldSuggestion)
	            textValue = wink.plugins.completion.searchTools.getBoldInv(textValue, this._component._currentValue, this.clearAccents, this.clearSeparatorChars);
	        
	        node.innerHTML = textValue;
	        
	        if (suggestion.css && wink.isString(suggestion.css))
	            wink.addClass(domNode, suggestion.css);
	        
	        domNode.appendChild(node);
	    }
	};
});