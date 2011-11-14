/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Implement a semitransparent layer 
 * 
 * @methods:
 *	--> show: display the layer
 *	--> hide: hide the layer
 *	--> refresh: update the display (in case of a change of height in the page for instance)
 *	--> update: update the color, opacity and zIndex of the layer. Use this method if you want to change the opacity or color or zIndex after you called the 'show' method.
 *
 * @attributes:
 * 	--> visible: true if the Layer is displayed, false otherwise
 * 	--> color: the hexa code of the layer color (default value: #000)
 * 	--> opacity: opacity level of the layer (default value: 0.3)
 * 	--> zIndex: the hierarchical level of the layer (default value: 998)
 *
 * @compatibility:
 * 	--> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.1, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Jerome GIRAUD
 */

define(['../../../../_base/_base/js/base', '../../../../fx/_xy/js/2dfx'], function(wink) 
{
	var applyStyle = wink.fx.apply;
	var _container = null;
	var _sublayer = null;
	var _added = false;
		
	wink.ui.xy.layer =
	{
		visible: false,
		color: '#000',
		opacity: 0.3,
		zIndex: 998,
		
		/**
		 * Display the layer
		 */
		show: function()
		{
			if (!_added) 
			{
				this._initDom();
			}
			
			_container.onclick = function()
			{
				var onclick = wink.ui.xy.layer.onclick;
				if ( wink.isSet(onclick) )
				{
					onclick();
				}
			};
			
			if (!this.visible)
			{
				applyStyle(_sublayer, {
					height: document.body.scrollHeight + 'px'
				});
				applyStyle(_container, {
					display: 'block'
				});
				this.visible = true;
			}
		},
		
		/**
		 * Hide the layer
		 */
		hide: function()
		{
			if (_added && this.visible) 
			{
				applyStyle(_container, {
					display: 'none'
				});
				this.visible = false;
			}
		},
		
		/**
		 * Update the display
		 */
		refresh: function()
		{
			if (_added && this.visible) {
				applyStyle(_sublayer, {
					height: document.body.scrollHeight + 'px'
				});
			}
		},
		
		/**
		 * Update the color and opacity of the layer
		 */
		update: function()
		{
			if (!_added) 
			{
				this._initDom();
			}
	
			applyStyle(_container, {
				"z-index": this.zIndex
			});
			applyStyle(_sublayer, {
				backgroundColor: this.color,
				opacity: this.opacity
			});
		},
		
		/**
		 * Create the layer
		 */
		_initDom: function()
		{
			var doc = document;
			_container = doc.createElement('div');
			applyStyle(_container, {
				position: 'absolute',
				display: 'none',
				top: 0,
				width: '100%',
				"z-index": this.zIndex,
				"tap-highlight-color": 'rgba(0, 0, 0, 0)'
			});
	
			_sublayer = doc.createElement('div');
			applyStyle(_sublayer, {
				width: '100%',
				backgroundColor: this.color,
				opacity: this.opacity
			});
	
			_container.appendChild(_sublayer);
			doc.body.appendChild(_container);
			
			_added = true;
		}
	};
	
	//Bindings
	wink.layer = wink.ui.xy.layer;

	return wink.layer;
});