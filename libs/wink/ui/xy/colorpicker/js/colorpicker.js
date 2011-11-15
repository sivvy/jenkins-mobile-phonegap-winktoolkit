/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Implement a colorpicker.
 * 
 * @events
 * 	--> /colorpicker/events/pickcolor: the user clicked on a color (returns an object containing the hexa code of the selected color)
 * 
 * @methods:
 *	--> show: display the ColorPicker
 *	--> hide: hide the ColorPicker
 *	--> updatePosition: update the position of the ColorPicker in the page
 *
 * @attributes:
 * 	--> uId: unique identifier of the component
 * 
 * @compatibility:
 * 	--> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.1, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Jerome GIRAUD
 */

define(['../../../../_amd/core'], function(wink)
{
	wink.ui.xy.ColorPicker = function()
	{
		if (wink.isUndefined(wink.ui.xy.ColorPicker.singleton)) 
		{
			this.uId              = 1;
			
			this._HEIGHT          = 276;
			this._WIDTH           = 230;
			
			this._template        = '';
			this._domNode         = null;
			
			this._colors = 
			[
				'#000', 
				'#9F3F0F', 
				'#0F3F0F',
				'#0F3F6F',
				'#0E0E85',
				'#3F4F3F',
				'#870F0F',
				'#87870F',
				'#0F870F',
				'#0F8787',
				'#0F0FFF',
				'#6F6F9F',
				'#FF0000',
				'#FF9F0F',
				'#9FC000',
				'#3FCFCF',
				'#3F6FFF',
				'#9F9F9F',
				'#FF0FFF',
				'#FFCF0F',
				'#FFFF00',
				'#0FFF0F',
				'#0FFFFF',
				'#0FCFFF',
				'#9F3F6F',
				'#FF9FCF',
				'#FFCF9F',
				'#FFFF9F',
				'#CF9FFF',
				'#FFF'
			];
			
			this._createTemplate();
			this._initDom();
			
			wink.ui.xy.ColorPicker.singleton = this;
		} else 
		{
			return wink.ui.xy.ColorPicker.singleton;
		}
	};
	
	wink.ui.xy.ColorPicker.prototype =
	{
		/**
		 * display the ColorPicker
		 */
		show: function()
		{
			wink.layer.show();
			
			wink.fx.apply(this._domNode, {
				display: 'block'
			});
			this.updatePosition();
		},
		
		/**
		 * hide the ColorPicker
		 */
		hide: function()
		{
			wink.layer.hide();
			this._domNode.style.display = 'none';
		},
		
		/**
		 * update the position of the ColorPicker
		 */
		updatePosition: function()
		{
			wink.fx.apply(this._domNode, {
				top: (window.innerHeight > this._HEIGHT)?(((window.innerHeight-this._HEIGHT)/2)+window.scrollY)+'px':window.scrollY+'px',
				left: (document.documentElement.offsetWidth > this._WIDTH)?(((document.documentElement.offsetWidth-this._WIDTH)/2)+window.scrollX)+'px':window.scrollX+'px'
			});
		},
		
		/**
		 * create the color picker template
		 */
		_createTemplate: function()
		{
			var j = 0;
			var l = this._colors.length;
			
			this._template += '<div><div class="w_icon w_float w_button_close" onClick="(new wink.ui.xy.ColorPicker()).hide()"></div>';
			
			for ( var i=0; i<l; i++)
			{
				if ( j==0 )
				{
					this._template += '<div class="cp_separator">';
				}
				
				this._template += '<div class="cp_color" style="background-color: ' + this._colors[i] + '" onClick="(new wink.ui.xy.ColorPicker())._selectColor(\'' + this._colors[i] + '\')"></div>';
				
				if ( j==4 )
				{
					this._template += '</div>';
					j = 0;
				}else
				{
					j++;
				}
			}
			
			this._template += '</div>';
		},
		
		/**
		 * Fires a 'pickcolor' event
		 * 
		 * @parameters:
		 * 	--> color: the selected color
		 */
		_selectColor: function(color)
		{
			wink.publish('/colorpicker/events/pickcolor',
			{
				'color': color
			});
			
			this.hide();
		},
		
		/**
		 * Initialize the DOM Node of the ColorPicker
		 */
		_initDom: function()
		{
			this._domNode = document.createElement('div');
		
			this._domNode.className = 'w_bloc w_window cp_colorpicker w_border w_radius w_bg_dark';
			this._domNode.style.display = 'none';
		
			this._domNode.innerHTML = this._template;
		
			document.body.appendChild(this._domNode);
		}
	};
	
	return wink.ui.xy.ColorPicker;
});