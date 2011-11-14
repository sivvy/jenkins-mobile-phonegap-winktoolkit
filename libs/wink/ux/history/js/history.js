/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Implement a browser history management 
 * 
 * @methods:
 *	--> start: start listening to history changes
 *	--> stop: stop listening to history changes
 *	--> push: add a new history
 *	--> pop: forces the history object to go back
 *	--> updateCheckInterval: Change the history check interval (the default check interval is 100ms)
 *
 * @events:
 * 	--> /history/events/back: the event is fired when the user clicks on the 'back' button
 * 	--> /history/events/forward: the event is fired when the user clicks on the 'forward' button
 * 
 * @compatibility:
 * 	--> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.1, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Jerome GIRAUD
 */

define(['../../../_amd/core'], function(wink)
{
	wink.ux.history =
	{
		_historyTimer: null,
		_historyQueue: [],
		_historyIndex: 0,
		_historyCheckInterval: 100,
		
		/**
		 * Start listening to the hash changes
		 */
		start: function()
		{
			window.location.hash = '';
			
			this._historyQueue.push({'hash': '', 'id': 'main', 'params': ''});
			
			if ('onhashchange' in window)
			{  
				window.addEventListener('hashchange', wink.bind(function(){this._check();}, this), true);
			} else
			{	
				this._historyTimer = wink.setInterval(this, '_check', this._historyCheckInterval);
			}
		},
		
		/**
		 * Stop listening to history changes
		 */
		stop: function()
		{
			if ('onhashchange' in window)
			{
				window.removeEventListener('hashchange', wink.bind(function(){this._check();}, this), true);
			} else
			{
				clearInterval(this._historyTimer);
			}
		},
		
		/**
		 * add a new history
		 * 
		 * @parameters:
		 * 	--> id: the identifier of the object pushing a new history element
		 * 	--> params: optional, a parameter that will be given back to the parent object
		 * 	--> hash: optional, forces the component to use the specified hash
		 */
		push: function(id, params, hash)
		{
			if ( !wink.isSet(hash))
			{
				var hash = wink.getUId();
			}
			
			window.location.hash = hash;
			
			this._historyQueue.splice(this._historyIndex+1, this._historyQueue.length-this._historyIndex-1);
			this._historyQueue.push({'hash': hash, 'id': id, 'params': params});
			this._historyIndex = this._historyQueue.length-1;
		},
		
		/**
		 * Forces the history object to go back
		 * 
		 * @parameters:
		 * 	--> id: the identifier of the object wanting to force the back
		 */
		pop: function(id)
		{
			for ( var i=this._historyIndex-1; i >=0; i-- )
			{
				if( this._historyQueue[i] && (this._historyQueue[i].id == id) )
				{
					window.history.back(i-this._historyIndex);
					this._historyIndex = i;
					return;
				}
			}
			window.history.back(-this._historyIndex);
			this._historyIndex = 0;
		},
		
		/**
		 * Change the history check interval
		 * 
		 * @parameters:
		 * 	--> interval: the interval in milliseconds
		 */
		updateCheckInterval: function(interval)
		{
			if ('onhashchange' in window)
			{
				return
			}
			
			this.stop();
			this._historyCheckInterval = interval;
			this._historyTimer = wink.setInterval(this, '_check', this._historyCheckInterval);
		},
		
		/**
		 * Check if the hash changed
		 */
		_check: function()
		{
			if ( this._historyQueue.length > 0 )
			{
				var hash = window.location.hash.substring(1, window.location.hash.length);
				var l = this._historyQueue.length;
	
				for ( var i=0; i<l ; i++)
				{
					if ( hash == this._historyQueue[i].hash && i != this._historyIndex )
					{
						if ( i < this._historyIndex )
						{
							for ( var j=this._historyIndex; j>i; j--)
							{
								wink.publish('/history/events/back',{'id': this._historyQueue[j-1].id, 'params': this._historyQueue[j-1].params});
							}
						} else if ( i > this._historyIndex )
						{
							for ( var j=this._historyIndex; j<i; j++)
							{
								wink.publish('/history/events/forward',{'id': this._historyQueue[j+1].id, 'params': this._historyQueue[j+1].params});
							}
						}
						
						this._historyIndex = i;
						break;
					}
				}
			}
		}
	};
	
	wink.ux.history.start();
	
	return wink.ux.history;
});