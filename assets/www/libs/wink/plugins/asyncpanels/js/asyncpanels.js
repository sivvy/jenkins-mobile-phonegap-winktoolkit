/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * A plugin to asynchroneously load contents with the sliding panels
 * 
 * @methods:
 *	--> slideTo: move to the selected page
 *	--> slideBack: come back to the previous page
 *	--> getDomNode: returns the DOM node containing the slidingpanels
 *
 * @attributes:
 * 	--> uId: unique identifier of the component
 * 	--> duration: the slide duration 	
 *	--> transitionType: the type of the transition between pages
 * 	--> pages: the list of pages ids of the slidingpanels
 * 
 * @properties:
 * 	data = 
 * 	{
 * 		duration = the transition duration in ms or s	
 * 		transitionType = the type of the transition between pages ('default', 'cover' or 'reveal')
 * 		pages = the list of pages to add to the slidingpanels (must be an array of either strings representing actual dom nodes ids or objects containing an id, an url and optionally a method and parameters)
 *	}
 * 
 * @dependencies:
 * 	--> wink.ui.layout.SlidingPanels
 *  --> wink.ui.xy.Spinner
 *  
 * @winkVersion:
 * 	--> 1.4.0
 *  
 * @compatibility:
 * 	--> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Jerome GIRAUD
 */

define(['../../../_amd/core', '../../../ui/layout/slidingpanels/js/slidingpanels', '../../../ui/xy/spinner/js/spinner'], function(wink)
{
	wink.plugins.AsyncPanels = function(properties)
	{
		this.uId            = wink.getUId();
		this.pages          = null;
		
		this.transitionType = 'default';
		this.duration       = 800;
		
		this.i18n =
		{
			en_EN:
			{
				loading: 'loading...'	
			},
			fr_FR:
			{
				loading: 'chargement...'	
			}
		};
		
		this._sp            = null;
		this._spPages       = [];
		
		this._loaderNode    = null;
		this._spinnerNode   = null;
		this._textNode      = null;
		
		this._xhr           = null;
		
		wink.mixin(this, properties);
		
		if (this._validateProperties() === false) return;
		
		this._initProperties();
		this._initDom();
	};
	
	wink.plugins.AsyncPanels.prototype =
	{	
		/**
		 * move to the selected page
		 * 
		 * @parameters:
		 * 	--> id: the id of the page to display
		 */
		slideTo: function(id)
		{
			var l = this.pages.length;

			for ( var i=0; i<l; i++ )
			{
				if ( (wink.isString(this.pages[i]) &&  this.pages[i] == id) || (!wink.isString(this.pages[i]) && this.pages[i].id == id && this.pages[i].loaded == true) )
				{
					this._sp.slideTo(id);
				} else if ( !wink.isString(this.pages[i]) && this.pages[i].id == id && !wink.isSet(this.pages[i].loaded) )
				{
					this._xhr = new wink.Xhr({'id': id, index: i});
					
					wink.layer.show();
					
					var _h = window.getComputedStyle(this._loaderNode)['height'];
					var _w = window.getComputedStyle(this._loaderNode)['width'];

					this._loaderNode.style.top = ((window.innerHeight - _h.substring(0, _h.length-2)) / 2) + window.pageYOffset + 'px';
					this._loaderNode.style.left = (window.innerWidth - _w.substring(0, _w.length-2))/2 + 'px';
					
					this._loaderNode.style.visibility = "visible";
					this._xhr.sendData(this.pages[i].url, wink.isSet(this.pages[i].parameters)?this.pages[i].parameters:null, wink.isSet(this.pages[i].method)?this.pages[i].method:'GET', {method: '_onSuccess', context: this}, {method: '_onFailure', context: this}, null);
				}
			}
		},
		
		/**
		 * come back to the previous page
		 */
		slideBack: function()
		{
			this._sp.slideBack();
		},
		
		/**
		 * Returns the DOM node containing the slidingpanels
		 */
		getDomNode: function()
		{
			return this._sp.getDomNode();
		},
		
		/**
		 * XHR success callback
		 * 
		 * @parameters:
		 * 	--> result: the result of the XHR request
		 */
		_onSuccess: function(result)
		{
			$(result.params.id).innerHTML = result.xhrObject.responseText;
			
			this._loaderNode.style.visibility = "hidden";
			wink.layer.hide();
			
			this.pages[result.params.index].loaded = true;
			
			this._sp.slideTo(result.params.id);
		},
		
		/**
		 * XHR failure callback
		 * 
		 * @parameters:
		 * 	--> result: the result of the XHR request
		 */
		_onFailure: function(result)
		{
			wink.log("[WARNING]: content cannot be loaded");
			
			this._loaderNode.style.visibility = "hidden";
			wink.layer.hide();
			
			this._sp.slideTo(result.params.id);
		},
		
		/**
		 * Initialize the slidingpanels node
		 */
		_initDom: function()
		{
			this._sp = new wink.ui.layout.SlidingPanels(
			{
				'duration': this.duration,
				'transitionType': this.transitionType,
				'pages': this._spPages
			});
			
			this._loaderNode = document.createElement('div');
			this._textNode = document.createElement('div');

			this._loaderNode.className = "w_window w_border w_radius w_bg_dark asp_loader";
			this._textNode.className = "asp_text";
			
			this._textNode.innerHTML = _("loading", this);
			
			this._spinnerNode = new wink.ui.xy.Spinner({background: "dark", size: 20}).getDomNode();
			
			this._loaderNode.appendChild(this._spinnerNode);
			this._loaderNode.appendChild(this._textNode);
			
			document.body.appendChild(this._loaderNode);
		},
		
		/**
		 * Initialize the properties
		 */
		_initProperties: function()
		{
			
			var l = this.pages.length;
			
			for ( var i=0; i<l; i++ )
			{
				if ( !wink.isString(this.pages[i]) )
				{
					this._spPages[i] = this.pages[i].id;
				} else
				{
					this._spPages[i] = this.pages[i];
				}
			}
		},
		
		/**
		 * Check if the properties are correct
		 */
		_validateProperties: function()
		{
			if ( !wink.isArray(this.pages) )
			{
				wink.log('[AsyncPanels] pages parameters must be an array');
				return false;
			}
				
			var l = this.pages.length;
			
			for ( var i=0; i<l; i++)
			{
				if ( !wink.isString(this.pages[i]) )
				{
					if ( !wink.isSet(this.pages[i].id) )
					{
						wink.log('[AsyncPanels] the object must contain a valid id');
						return false;
					}
					
					if ( !wink.isSet(this.pages[i].url) )
					{
						wink.log('[AsyncPanels] the object must contain a valid url');
						return false;
					}
				}
			}
		}
	};
	
	return wink.plugins.AsyncPanels;
});