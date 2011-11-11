/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * The completion component controller that will manage all completion process
 * using managers (dom, data, event).
 * 
 * @methods:
 *  --> start: start the completion
 *  --> stop: stop the completion
 *  --> restart: restart the completion with given new properties
 *  --> isStarted: check if the completion is correctly started
 *  --> showCompletion: force showing the current completion box
 *  --> hideCompletion: force hiding the current completion box
 *  --> addSuggestion: add a new item in suggestions list 
 *  --> getSuggestion: get the suggestion item at specified index
 *  --> getSuggestions: get all the suggestions list 
 *  --> resetSuggestions: reset the suggestions list
 *  --> getHighlightedSuggestion: get the current preselected suggestion item
 *  --> getSelectedSuggestion: get the current selected suggestion item
 *  --> calculateShiftHighlightedIndex: calculate index increased by shift value
 *  --> highlight: highlight the suggestion specified by given index
 *  --> unhighlight: unhighlight all suggestions
 *  --> saveSelectedSuggestionInHistory: save the current selected suggestion in history
 *  --> resetHistory: reset all history suggestions
 *
 * @attributes:
 *  --> uId: unique identifier of the component
 *  --> input: the input HTMLElement 
 * 
 * @properties:
 *  data =
 *  {
 *      input:             The input field of the auto completer
 *      uId:               [optional] The completion unique identifier
 *      managers:          The managers list of properties. It must contains the keys of mandatory managers object : "data", "event" and "dom".
 *          {
 *              data:
 *                  {
 *                      name The entire name of data manager class
 *                      ...See the associated data manager to see all properties... 
 *                  }
 *              event: 
 *                  {
 *                      name The entire name of event manager class
 *                      ...See the associated event manager to see all properties... 
 *                  }
 *              dom:
 *                  {
 *                      name The entire name of dom manager class
 *                      ...See the associated dom manager to see all properties... 
 *                  }
 *              history:    [optional] 
 *                  {
 *                      name The entire name of history manager class
 *                      ...See the associated history manager to see all properties... 
 *                  }
 *          } 
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

define(['../../../_amd/core'], function(wink)
{
	wink.plugins.completion = {
		manager: {
			data: {},
			dom: {},
			event: {},
			history: {
				handler: {}
			}
		},
		module: {
			data: {},
			dom: {},
			event: {}
		}
	};
	
	/**
	 * Define the completion component object
	 * with default values
	 *
	 * @class Component class
	 * 
	 * @param properties an array containing all completion properties
	 * 
	 * @returns Component the completion object
	 */
	wink.plugins.completion.Component = function(properties)
	{
	    /**
	     * The manager helper
	     * @type ManagerHelper
	     */
	    this._helper = wink.plugins.completion.manager.ManagerHelper;
	    
	    /**
	     * The current input field value.
	     * @type string
	     */
	    this._currentValue = '';
	    
	    /**
	     * The data manager that handle data search process
	     * @type
	     */
	    this._dataManager = null;
	    
	    /**
	     * The DOM manager that handle all DOM process
	     * @type
	     */
	    this._domManager = null;
	    
	    /**
	     * The event manager that handle user event
	     * @type
	     */
	    this._eventManager = null;
	    
	    /**
	     * The event manager that handle user event
	     * @type
	     */
	    this._historyManager = null;
	    
	    /**
	     * The index of the current highlighted suggestion
	     * @type integer
	     */
	    this._highlightedIndex = -1;
	    
	    /**
	     * The index of the current selected suggestion
	     * @type integer
	     */
	    this._selectedIndex = -1;
	    
	    /**
	     * The input field of the auto completer.
	     * @type HTMLInputElement
	     */
	    this.input = null;
	    
	    /**
	     * The ready state of the completion
	     * @type boolean
	     */
	    this._ready = false;
	    
	    /**
	     * The old input field value for internal use.
	     * @type string
	     */
	    this._oldValue = "";
	    
	    /**
	     * Indicate if the auto completer is started or not.
	     * @type boolean
	     */
	    this._started = false;
	       
	    /**
	     * List of suggestions for current response.
	     * @type SuggestionList
	     */
	    this._suggestions = [];
	    
	    /**
	     * The instance unique identifier of the autocompleter.
	     * @type integer
	     */
	    this.uId = wink.getUId();
	    
	    // Save and validate properties
	    wink.mixin(this, properties);
	    if (!this._validateProperties())
	        return;
	   
	    // Create all managers
	    if (!this._createManagers())
	        return;
	    
	    this._ready = true;
	};
	
	wink.plugins.completion.Component.prototype = 
	{
	    /**
	     * List of existing managers
	     * to process
	     */
	    mandatoryManagerTypes: ["data", "dom", "event"],
	    
	    /**
	     * Validate main properties and initialize
	     * managers. Finally return a boolean status.
	     * 
	     * We should find in properties 
	     * {
	     *    "input": HTMLElement,
	     *    "managers": {...}
	     * }
	     * 
	     * @return boolean true if validated
	     */
	    _validateProperties: function()
	    {
	        if (wink.isUndefined(this.input))
	        {
	            //wink.log("[Component] Undefined input HTML element");
	            return false;
	        }
	        
	        if (!this.managers)
	        {
	            //wink.log("[Component] Undefined 'managers' properties");
	            return false;
	        }
	        
	        // Append the history manager if found in configuration
	        if (this.managers.history)
	            this.mandatoryManagerTypes.push("history");
	        
	        return true;
	    },
	    
	    /**
	     * Create all mandatory managers
	     * and return a boolean status
	     * 
	     * @return boolean
	     */
	    _createManagers: function()
	    {
	        for (var i = 0 ; i < this.mandatoryManagerTypes.length ; i++)
	        {
	            var type = this.mandatoryManagerTypes[i];
	            if (!this._createManager(type))
	                return false;
	        }
	        
	        return true;
	    },
	
	    /**
	     * Create a manager
	     * using given type and return boolean status
	
	     * @param string type the manager's type
	     * 
	     * @return boolean true if correctly initialized
	     */
	    _createManager: function(type)
	    {
	        if (!this.managers[type])
	        {
	            //wink.log("[Component] Undefined manager " + type);
	            return false;
	        }
	        
	        if (!this.managers[type]["name"])
	        {
	            //wink.log("[Component] The manager 'name' is missing for " + type);
	            return false;
	        }
	        
	        if (!wink.plugins.completion.manager[type][this.managers[type]["name"]])
	        {
	            //wink.log('[Component] The manager ' + this.managers[type]["name"] + ' does not exists !');
	            return false;        
	        }
	        
	        var manager = new wink.plugins.completion.manager[type][this.managers[type]["name"]](this.managers[type], this);
	        if (!manager) 
	            return false;
	        
	        // Set the component and the type in the manager
	        manager.type = type;
	        
	        this["_" + type + "Manager"] = manager;
	        
	        return true;
	    },
	    
	    
	    /**
	     * Start all mandatory managers
	     * and return a boolean status
	     * 
	     * @return boolean
	     */
	    _startManagers: function()
	    {
	        for (var i = 0 ; i < this.mandatoryManagerTypes.length ; i++)
	        {
	            var type = this.mandatoryManagerTypes[i];
	            
	            if (!this["_" + type + "Manager"].start())
	                return false;
	        }
	        return true;
	    },
	    
	    /**
	     * Stop all mandatory managers
	     * and return a boolean status
	     * 
	     * @return boolean
	     */
	    _stopManagers: function(eraseManager)
	    {
	        for (var i = 0 ; i < this.mandatoryManagerTypes.length ; i++)
	        {
	            var type = this.mandatoryManagerTypes[i];
	            this["_" + type + "Manager"].stop();
	            if (wink.isSet(eraseManager) && eraseManager === true)
	                this["_" + type + "Manager"] = null;
	        }
	
	        return true;
	    },
	    
	    /**
	     * Delete all mandatory managers
	     * First stop them and remove
	     * reference
	     */
	    _deleteManagers: function()
	    {
	        this._stopManagers(true);
	    },
	    
	    /**
	     * Run the search process if the current value
	     * is different from the old value
	     * Finally update the old value
	     * 
	     * @param boolean force if we should force the search
	     */
	    _search: function(force)
	    {
	        if (wink.isUndefined(force))
	            force = false;
	        
	        var cleanedCurrentValue = wink.plugins.completion.tools.cleanQuery(this._currentValue);
	        if (this._oldValue == cleanedCurrentValue && !force)
	            return;
	        
	        // Reset the suggestion list
	        this.resetSuggestions();
	        
	        // Call the history manager
	        if (this._historyManager)
	            this._historyManager.searchHistoryData(cleanedCurrentValue);
	        
	        // Call the data manager
	        this._dataManager.searchData(cleanedCurrentValue);
	        this._oldValue = cleanedCurrentValue;
	    },
	    
	    /**
	     * The search has failed due to a
	     * bad query string or an empty result
	     * list
	     * 
	     */
	    processOnSearchFailed: function()
	    {
	        if (this._suggestions.length == 0)
	            this._domManager.hideDomNode();
	        else
	            this._domManager.buildDomNode();
	    },
	    
	    /**
	     * Run the build process
	     * First run the history manager if history is activated
	     * and finally run the build of the DOM
	     * 
	     */
	    processOnSearchSuccess: function(query)
	    {
	        if (this._suggestions.length == 0)
	            this._domManager.hideDomNode();
	        else
	            this._domManager.buildDomNode();
	    },
	    
	    /**
	     * Run the input press process
	     * Unhighlight all suggestion
	     * and check the input value
	     * 
	     */
	    processOnInputPress: function()
	    {
	        this.unhighlight();
	        if (this.input.value.length == 0)
	            this.hideCompletion();
	    },
	    
	    /**
	     * Run the input change process
	     * Update the current value with the input value
	     * and run the search process
	     * 
	     */
	    processOnInputRelease: function()
	    {
	        this._currentValue = this.input.value;
	        this._search();  
	    },
	    
	    /**
	     * Save the selected suggestion in history
	     * If no selected suggestion, create a default
	     * suggestion
	     * 
	     */
	    saveSelectedSuggestionInHistory: function()
	    {
	        if (this._historyManager)
	        {
	            var suggestion = this.getSelectedSuggestion();
	            
	            if (suggestion === false)
	                suggestion = { "value": this._currentValue };
	            
	            this._historyManager.saveHistoryData(suggestion);
	        }
	    },
	    
	    /**
	     * Run the process on input blur
	     * Hide the completion
	     */
	    processOnInputBlur: function()
	    {
	        this.hideCompletion();
	    },
	    
	    /**
	     * Run the process on suggestion selected
	     * Update the input value with
	     * 
	     */
	    processOnSuggestionClicked: function()
	    {
	        this.input.value = this.getHighlightedSuggestion().value;
	        this._currentValue = this.input.value;
	        this._selectedIndex = this._highlightedIndex;
	        var suggestion = this.getSelectedSuggestion();
	        
	        // Call the callback after selecting the completion
	        var selectionCallback = this._eventManager.getSelectionCallback();
	        if(!wink.isNull(selectionCallback)) {
	        	wink.call(selectionCallback, suggestion);
	        }
	        
	        // Add in history when a suggestion is clicked
	        if (this._historyManager)
	        {
	            this._historyManager.saveHistoryData(suggestion);
	        }
	    },
	    
	    /**
	     * Start the completion
	     * by starting each manager
	     * and setting the started state
	     * to true
	     */
	    start: function()
	    {
	        // Check the ready state
	        if (!this._ready)
	        {
	            //wink.log("[Component] Completion configuration failed");
	            return false;
	        }
	        
	        // Check if the completion is already started
	        if (this._started)
	        {
	            //wink.log("[Component] Completion already started");
	            return;
	        }
	        
	        // start all managers and change the state
	        if (!this._startManagers())
	        {
	            //wink.log("[Component] Completion managers could not be start");
	            return false;
	        }
	        
	        this._started = true;
	        return true;
	    },
	    
	    /**
	     * Stop the completion
	     * by stopping each manager
	     * and setting the started state
	     * to false
	     */
	    stop: function()
	    {
	        this._stopManagers();
	        this._started = false;        
	    },
	    
	    /**
	     * Restart the completion
	     * by updating properties and
	     * re creating managers
	     */
	    restart: function(properties)
	    { 
	        if (!properties)
	        {
	            //wink.log("[Component] Missing parameter 'properties' for restart");
	            return false;
	        }
	        
	        // Delete all managers and chage the started state
	        this._deleteManagers();
	        this._started = false;
	
	        // Update and validate new properties
	        wink.mixin(this, properties);
	        if (!this._validateProperties())
	            return false;
	        
	        // Create all manager
	        if (!this._createManagers())
	            return false;
	
	        // Restart the completer
	        this.start();
	    },
	    
	    /**
	     * Return true if the auto completer
	     * is correctly started
	     * 
	     * @return boolean
	     */
	    isStarted: function()
	    {
	        return this._started;
	    },
	
	    /**
	     * Show the completion
	     * using the DOM manager
	     * 
	     */
	    showCompletion: function()
	    {
	        this._domManager.showDomNode();
	    },
	    
	    /**
	     * Hide the completion
	     * using the DOM manager
	     * 
	     */
	    hideCompletion: function()
	    {
	        this._domManager.hideDomNode();
	    },
	    
	    /**
	     * Return the value of the new highlighted suggestion
	     * after adding the shift value to the current
	     * highlightedIndex
	     * 
	     * @param integer shiftValue the value to add (positive or negative)
	     * 
	     * @return integer
	     */
	    calculateShiftHighlightedIndex: function(shiftValue)
	    {
	        if (!wink.isInteger(shiftValue) || shiftValue == 0)
	            return this._highlightedIndex;
	        
	        var lastIndexInModulo = this._suggestions.length + 1;
	        var returnValue = this._highlightedIndex;
	        
	        returnValue += shiftValue + 1;
	        
	        returnValue = returnValue % lastIndexInModulo;
	        if (returnValue < 0)
	            returnValue += lastIndexInModulo;
	        
	        returnValue -= 1;
	             
	        return returnValue;
	    },
	    
	    /**
	     * Highlight the new suggestion
	     * using the specified index
	     * 
	     * @param integer index the new index
	     * 
	     * @return integer the new highlighted index
	     */
	    highlight: function(index)
	    {
	        // Unhighlight all suggestion
	        this._domManager.unhighlight();
	        
	        // Save the nex index
	        this._highlightedIndex = index;
	        
	        // Highlight using DOM manager
	        this._domManager.highlight(this._highlightedIndex);
	        
	        return this._highlightedIndex;
	    },
	    
	    /**
	     * Unhighlight all suggestions.
	     * 
	     */
	    unhighlight: function()
	    {
	        this._highlightedIndex = -1;
	        this._selectedIndex = -1;
	        
	        this._domManager.unhighlight();
	    },
	    
	    /**
	     * Get all suggestion params values associated to a suggestion div id
	     * 
	     * @param suggestionId
	     * 
	     * @returns array the key/value array
	     */
	    getSuggestion: function(index)
	    {
	        return this._suggestions[index];
	    },
	    
	    /**
	     * Return the selected suggestion
	     * using the internal value of selectedIndex
	     * or false if no selected index
	     * 
	     * @return object
	     */
	    getSelectedSuggestion: function()
	    {
	        if (this._selectedIndex < 0)
	            return false;
	        
	        return this._suggestions[this._selectedIndex];
	    },
	    
	    /**
	     * Return the highlighted suggestion
	     * using the internal value of highlightedIndex
	     * or false if no highlighted index
	     * 
	     * @return object
	     */
	    getHighlightedSuggestion: function()
	    {
	        if (this._highlightedIndex < 0)
	            return false;
	        
	        return this._suggestions[this._highlightedIndex];        
	    },
	    
	    /**
	     * Return the list of suggestions
	     * 
	     * @return array suggestions
	     */
	    getSuggestions: function()
	    {
	        return this._suggestions;
	    },
	    
	    /**
	     * Reset the suggestion list
	     * 
	     */
	    resetSuggestions: function()
	    {
	        this._suggestions = [];
	    },
	    
	    /**
	     * Add a new suggestion and return its index
	     * Return -1 if the suggestion could not be added
	     * 
	     * @param object suggestion The new suggestion object
	     * @index integer index The index of the added suggestion. Default index is last index
	     * 
	     * @return integer The index of the added suggestion
	     */
	    addSuggestion: function(suggestion, index)
	    {   
	        if (!this._checkSuggestion(suggestion))
	            return -1;
	        
	        if (wink.isUndefined(index))
	        {
	            this._suggestions.push(suggestion);   
	            return (this._suggestions.length - 1);
	        }
	        
	        if (index <= 0)
	            this._suggestions.unshift(suggestion);
	        else
	            this._suggestions.splice(index, 0, suggestion);
	        
	        return index;
	    },
	    
	    /**
	     * Verify the validity of the suggestion
	     * by checking the value key
	     * Remove the suggestion if the key is not found
	     * 
	     * @param object suggestion The new suggestion
	     * 
	     * @return boolean
	     */
	    _checkSuggestion: function(suggestion)
	    {
	        if (wink.isUndefined(suggestion))
	            return false;
	        
	        if (!wink.isSet(suggestion.type))
	            suggestion.type = this._helper._defaultKeyName;
	               
	        if (!wink.isSet(suggestion.value))
	        {
	            //wink.log("[Component] Invalid suggestion without value, will not be added.");
	            return false;
	        }
	        
	        return true;
	    },
	    
	    /**
	     * Reset the history using the history
	     * manager and reload the completion
	     * request in forced mode
	     */
	    resetHistory: function()
	    {
	        if (!this._historyManager)
	            return;
	        
	        if (this._historyManager.resetHistory())
	            this._search(true);
	    },
	
	    /**
	     * Get the specified manager by type
	     * 
	     * @param string type The manager type 
	     * 
	     * @return Manager
	     */
	    getManager: function(type)
	    {
	        if (!wink.isSet(this["_" + type + "Manager"]))
	        {   
	            //wink.log("[Component] No existing manager for type " + type);
	            return false;
	        }
	        
	        return this["_" + type + "Manager"];
	    },
	    
	    show: function()
	    {
	    	this.input.style.display = '';
	    }
	};
});