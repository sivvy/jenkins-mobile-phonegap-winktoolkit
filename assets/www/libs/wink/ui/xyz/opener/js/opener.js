/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Implements an image opener
 * 
 * @methods:
 * 	--> getDomNode: return the dom node containing the Opener
 * 	--> open: Opens the image
 * 	--> close: Closes the image
 * 	--> toggle: Toggles the image display
 * 
 * @attributes:
 * 	--> uId: unique identifier of the component
 * 	--> opened: true if the image is "opened", false otherwise
 * 	--> image: the URL of the opener image
 * 	--> height: the height of the opener
 * 	--> width: the width of the opener
 * 	--> panelHeight: the height of each panel
 * 	--> panelsAngle: the winding angle of the opener
 * 	--> openerXAngle: the angle between the opener and the page on the X-axis
 * 	--> openerYAngle: the angle between the opener and the page on the Y-axis
 * 	--> duration: the opening duration in milliseconds
 * 
 * @events:
 * 	--> /opener/events/click: the event is fired when someone clicks on the image
 * 
 * @properties:
 * 	data =
 * 	{
 * 		image = the URL of the image to display
 * 		height = the height of the opener (should be the same as the image height)
 * 		width = the width of the opener (should be the same as the image width)
 * 		panelHeight = the height of each panel. The image is divided into X panels (DEFAULT: 20)
 * 		panelsAngle = the winding angle of the opener (DEFAULT: 140)
 * 		openerXAngle = the angle between the opener and the page on the X-axis (DEFAULT: 10)
 * 		openerYAngle = the angle between the opener and the page on the Y-axis (DEFAULT: 15)
 * 		duration = the opening duration in milliseconds (DEFAULT: 500)
 * 	}
 * 
 * @dependencies:
 * 	--> wink.math._geometric
 * 	--> wink.math._matrix
 *  --> wink.fx._xyz
 * 
 * @compatibility:
 * 	--> Iphone OS2, Iphone OS3, Iphone OS4
 * 
 * @author:
 * 	--> Jerome GIRAUD
 * 
 */

define(['../../../../_amd/core', '../../../../math/_geometric/js/geometric', '../../../../fx/_xyz/js/3dfx'], function(wink)
{
	wink.ui.xyz.Opener = function(properties) 
	{
		this.uId           = wink.getUId();
		
		this.opened        = false;
		
		this.image         = null;
		
		this.height        = 0;
		this.width         = 0;
		
		this.panelHeight   = 20;
		this.panelsAngle   = 140;
		this.openerXAngle  = 10;
		this.openerYAngle  = 15;
		
		this.duration      = 500;
		
		this._nbPanels     = 0;
		this._panelAngle   = 0;
		
		this._panelsList   = [];
		
		this._domNode      = null;
		this._panelsNode   = null;
		this._contentNode  = null;
		
		wink.mixin(this, properties);
		
		if  ( this._validateProperties() ===  false )return;
		
		this._initProperties();
		this._initDom();
		this._initListeners();
	};
	
	wink.ui.xyz.Opener.prototype =
	{
		/**
		 * return the dom node containing the Opener
		 */
		getDomNode: function()
		{
			return this._domNode;
		},
		
		/**
		 * Opens the image
		 */
		open: function()
		{
			wink.fx.initComposedTransform(this._panelsNode, false);
			wink.fx.setTransformPart(this._panelsNode, 1, { type: 'rotate', x: 0, y: 1, z: 0, angle: this.openerYAngle });
			wink.fx.setTransformPart(this._panelsNode, 2, { type: 'rotate', x: 1, y: 0, z: 0, angle: this.openerXAngle });
			wink.fx.applyComposedTransform(this._panelsNode); 
			
			this._domNode.style['height'] = '0px';
			
			var l = this._panelsList.length;
			
			for ( var i = l-1; i > 0; i-- )
			{
				this._panelsList[i].open();
			}
			
			this.opened = true;
		},
		
		/**
		 * Closes the image
		 */
		close: function()
		{
			wink.fx.setTransformPart(this._panelsNode, 1, { type: 'rotate', x: 0, y: 1, z: 0, angle: 0 });
			wink.fx.setTransformPart(this._panelsNode, 2, { type: 'rotate', x: 1, y: 0, z: 0, angle: 0 });
			wink.fx.applyComposedTransform(this._panelsNode);
			
			this._domNode.style['height'] = 'auto';
			
			var l = this._panelsList.length;
			
			for ( var i = l-1; i > 0; i-- )
			{
				this._panelsList[i].close();
			}
			
			this.opened = false;
		},
		
		/**
		 * Toggles the image display
		 */
		toggle: function()
		{
			if ( this.opened )
			{
				this.close();
			} else
			{
				this.open();
			}
		},
		
		/**
		 * Handles the click events
		 */
		_handleClick: function()
		{
			this.toggle();
			wink.publish('/opener/events/click', {'openerId': this.uId});	
		},
		
		/**
		 * Validate the Opener properties
		 */
		_validateProperties: function()
		{
			// Check duration
			if ( !wink.isInteger(this.duration) )
			{
				wink.log('[Opener] The property duration must be an integer');
				return false;
			}
			
			// Check opener X angle
			if ( !wink.isInteger(this.openerXAngle) )
			{
				wink.log('[Opener] The property openerXAngle must be an integer');
				return false;
			}
			
			// Check opener Y angle
			if ( !wink.isInteger(this.openerYAngle) )
			{
				wink.log('[Opener] The property openerYAngle must be an integer');
				return false;
			}
			
			// Check panel angle
			if ( !wink.isInteger(this.panelsAngle) )
			{
				wink.log('[Opener] The property panelsAngle must be an integer');
				return false;
			}
			
			// Check panelHeight
			if ( !wink.isInteger(this.panelHeight) )
			{
				wink.log('[Opener] The property panelHeight must be an integer');
				return false;
			}
			
			// Check height
			if ( !wink.isInteger(this.height) )
			{
				wink.log('[Opener] The property height must be an integer');
				return false;
			}
			
			// Check width
			if ( !wink.isInteger(this.width) )
			{
				wink.log('[Opener] The property width must be an integer');
				return false;
			}
			
			// Check image
			if ( !wink.isSet(this.image) )
			{
				wink.log('[Opener] The property image must be set');
				return false;
			}
			
			return true;
		},
		
		/**
		 * Initialize the 'click' listener
		 */
		_initListeners: function()
		{
			wink.subscribe('/opener.panel/events/click', {context: this, method: '_handleClick'});			
		},
		
		/**
		 * Initialize the Opener properties
		 */
		_initProperties: function()
		{
			this._nbPanels = Math.ceil(this.height / this.panelHeight);
			this._panelAngle = this.panelsAngle / this._nbPanels;
		},
		
		/**
		 * Initialize the Opener DOM nodes
		 */
		_initDom: function()
		{
			this._domNode = document.createElement('div');
			this._domNode.className = 'op_container';
					
			wink.fx.apply(this._domNode, {
				height: this.height + 'px',
				width: this.width + 'px'
			});
			
			this._panelsNode = document.createElement('div');
			this._panelsNode.className = 'op_panels';
			
			wink.fx.apply(this._panelsNode, {'transform-origin': '100% 0', 'transform-style': 'preserve-3d'});
			
			for ( var i=0; i<this._nbPanels; i++ )
			{
				var panel = new wink.ui.xyz.Opener.Panel({index: i, image: this.image, height: this.panelHeight, angle: this._panelAngle});
				
				this._panelsList.push(panel);
				this._panelsNode.appendChild(panel.getDomNode());
				
				wink.fx.applyTransformTransition(panel.getDomNode(), this.duration + 'ms', '0ms', 'linear');
			}
			
			this._domNode.appendChild(this._panelsNode);
			
			wink.fx.applyTransformTransition(this._panelsNode, this.duration + 'ms', '0ms', 'linear');
		}
	};
	
	/**
	 * Implements an image opener panel
	 * 
	 * @methods:
	 * 	--> getDomNode: return the dom node containing the panel
	 * 	--> open: Opens a panel
	 * 	--> close: Closes a panel
	 * 
	 * @attributes:
	 * 	--> uId: unique identifier of the component
	 * 	--> index: the position of the panel
	 * 	--> image: the URL of the image to display
	 * 	--> height: the height of the panel
	 * 	--> angle: the opening angle of the panel
	 * 
	 * @events:
	 * 	--> /opener.panel/events/click: the event is fired when someone clicks on the panel
	 * 
	 * @properties:
	 * 	data =
	 * 	{
	 * 		index = the position of the panel in the panels list
	 * 		image = the URL of the image to display
	 * 		height = the height of the panel
	 * 		angle = the opening angle of the panel
	 * 	}
	 * 
	 * @compatibility:
	 * 	--> Iphone OS2, Iphone OS3, Iphone OS4
	 * 
	 * @author:
	 * 	--> Jerome GIRAUD
	 * 
	 */
	wink.ui.xyz.Opener.Panel = function(properties) 
	{
		this.uId         = wink.getUId();
		
		this.index       = null;
		
		this.image       = null;
		
		this.height      = 0;
		this.angle       = 0;
		
		this._y          = 0;
		this._z          = 0;
		
		this._domNode    = null;
		
		wink.mixin(this, properties);
		
		this._initProperties();
		this._initDom();
	};
	
	wink.ui.xyz.Opener.Panel.prototype =
	{
		/**
		 * return the dom node containing the panel
		 */
		getDomNode: function()
		{
			return this._domNode;
		},
		
		/**
		 * Opens a panel
		 */
		open: function()
		{
			wink.fx.initComposedTransform(this._domNode, false);
			
			wink.fx.setTransformPart(this._domNode, 1, { type: 'rotate', x: 1, y: 0, z: 0, angle: (this.angle*(this.index)) });
			wink.fx.setTransformPart(this._domNode, 2, { type: 'translate', x: 0, y: this._y, z: this._z });
			
			wink.fx.applyComposedTransform(this._domNode);
		},
		
		/**
		 * Closes a panel
		 */
		close: function()
		{
			wink.fx.setTransformPart(this._domNode, 1, { type: 'rotate', x: 1, y: 0, z: 0, angle: 0 });
			wink.fx.setTransformPart(this._domNode, 2, { type: 'translate', x: 0, y: (this.index * this.height), z: 0 });
			
			wink.fx.applyComposedTransform(this._domNode); 
		},
		
		/**
		 * Initialize the Panel properties
		 */
		_initProperties: function()
		{
			for ( var i=0; i<this.index; i++ )
			{
				this._y += Math.cos(wink.math.degToRad(this.angle*i))*this.height;
				this._z += Math.sin(wink.math.degToRad(this.angle*i))*this.height;
			}
		},
		
		/**
		 * Initialize the Panel DOM node
		 */
		_initDom: function()
		{
			this._domNode = document.createElement('div');
			
			this._domNode.className = 'op_panel';
			
			wink.fx.apply(this._domNode, {
				height: (this.height + 2) + 'px',
				'transform-origin': '0 0',
				backgroundImage: 'url(' + this.image + ')',
				backgroundRepeat: 'no-repeat',
				backgroundPositionX: '0',
				backgroundPositionY: -this.index*this.height + 'px'
			});
			
			this._domNode.onclick = function()
			{
				wink.publish('/opener.panel/events/click', {'panelId': this.uId});
			};
			
			this._domNode.winkTranslate(0, this.index*this.height);
		}
	};
	
	return wink.ui.xyz.Opener;
});