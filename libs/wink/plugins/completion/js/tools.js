/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Set of general function that is used by the completion component
 * 
 * @methods:
 *  --> clone:                  Clone a simple object
 *  --> ucFirst:                Capitalize the first letter of a string
 *  --> lcFirst:                Minimize the fisrt letter of a string
 *  --> cleanQuery:             Clean a query string by removing left spaces and replacing multiple space
 *  --> removeDuplicate:        Remove the duplicate element of the first array
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
	/**
	 * Completion Toolbox 
	 *
	 * This javascript contain a set of general function
	 * that is used by the completion component and can 
	 * be used by other code
	 *
	 */
	wink.plugins.completion.tools = 
	{	    
        /**
         * Clone a simple object
         * 
         * @param object obj
         */
        clone: function(obj)
        {
    	    var newObj = (obj instanceof Array) ? [] : {};
    	    
    	    for (var i in obj)
    	    {
    	        if (obj[i] && typeof obj[i] == "object")
    	            newObj[i] = wink.plugins.completion.tools.clone(obj[i]);
    	        else
    	            newObj[i] = obj[i];
    	    }
    	    
    	    return newObj;
	    },
	        
	    /**
	     * Capitalize the first letter of the string
	     * 
	     * @param string str
	     * 
	     * @return string
	     */
	    ucFirst: function(str)
	    {
	        if (str.length > 0)
	            return str.charAt(0).toUpperCase() + str.substring(1);
	        else 
	            return str;    
	    },
	    
	    /**
	     * Minimize the fisrt letter of the string
	     * 
	     * @param string str
	     * 
	     * @return string
	     */
	    lcFirst: function(str)
	    {
	        if (str.length > 0)
	            return str.charAt(0).toLowerCase() + str.substring(1);
	        else 
	            return str;    
	    },
	    
	    /**
	     * Clean a query string by removing
	     * left spaces and replacing multiple space
	     * 
	     * @param string query the query to clean
	     */
	    cleanQuery: function(query)
	    {
	        return query.toLowerCase().replace(/[ ]+/g,' ').replace(/^ /,'');
	    },
	    
	    /**
	     * Remove the element of the first array
	     * when it appears in the second array
	     * using the comparison key
	     * 
	     * @param array sourceArray The array to clean
	     * @param array excludeArray The array to compare
	     * @param string sourceKey The comparison source key
	     * @param string excludeKey The comparison exclude key
	     * 
	     * @return array The source array without exclude array entries
	     */
	    removeDuplicate: function(sourceArray, excludeArray, sourceKey, excludeKey)
	    {
	        var finalArray = [];
	        
	        for(var i = 0 ; i < sourceArray.length ; i++)
	        {
	            var currentSourceEntry = sourceArray[i];
	            var found = false;
	            
	            for(var j = 0 ; j < excludeArray.length ; j++)
	            {
	                if (excludeArray[j][excludeKey] == currentSourceEntry[sourceKey])
	                {
	                    found = true;
	                    break;
	                }
	            }
	            
	            if (!found)
	                finalArray.push(currentSourceEntry);
	        }
	        
	        return finalArray;
	    }
	};
});