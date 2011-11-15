/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Implement a windows container
 * 
 * @methods:
 *	--> slideTo: move to the selected page
 *	--> getDomNode: returns the DOM node containing the Slider
 *
 * @attributes:
 * 	--> uId: unique identifier of the component
 * 	--> duration: the slide duration
 * 	--> pages: the list of pages ids of the windows
 *
 * @events:
 * 	--> /windows/events/slidestart: return the current front page (slide just started)
 * 	--> /windows/events/slideend: return the current front page (slide just ended)
 *
 * @properties:
 * 	data = 
 * 	{
 * 		duration = the transition duration in ms or s	
 * 		pages = the list of pages to add to the windows (must be an array of strings representing actual dom nodes ids)
 *	}
 *
 *	@dependencies:
 * 	--> wink.math._geometric
 * 	--> wink.math._matrix
 *  --> wink.fx._xyz
 *  --> wink.fx.animation
 *
 * @compatibility:
 * 	--> Iphone OS3, Iphone OS4
 * 
 * @author:
 * 	--> Jerome GIRAUD
 */
define(['../../../../_amd/core', '../../../../math/_geometric/js/geometric', '../../../../fx/_xyz/js/3dfx', '../../../../fx/_animation/js/animation'], function(wink)
{
	wink.ui.layout.Windows = function(properties)
	{
		this.uId                    = wink.getUId();
		this.pages					= null;
		
		this.duration	            = 800;
		
		this._domNode				= null;
		
		this._pagesList				= [];
		this._firstPage				= null;
		
		wink.mixin(this, properties);
		
		if (this._validateProperties() === false) return;
			
		this._initDom();
		this._initProperties();
	};
	
	wink.ui.layout.Windows.prototype =
	{
		/**
		 * Returns the DOM node containing the window container
		 */
		getDomNode: function()
		{
			return this._domNode;
		},
		
		/**
		 * move to the selected page
		 * 
		 * @parameters:
		 * 	--> id: the id of the page to display
		 */
		slideTo: function(id)
		{	
			var fp = this._firstPage,
				cp = this._getPageById(id);
	
			if (cp == null || cp == fp )
			{
				return;
			}
			
			var animGroup = new wink.fx.animation.AnimationGroup();
			
			var anim1 = new wink.fx.animation.Animation();
			var anim2 = new wink.fx.animation.Animation();
			
			var transformations11 = 
			[
				{ type: "translate", x: document.documentElement.offsetWidth+100, y: 0, z: -50+fp.position },
				{ type: "rotate", x: 0, y: 1, z: 0, angle: -20 }
			];
			
			var transformations12 = 
			[
				{ type: "translate", x: -40*fp.position, y: 40*fp.position, z: -50+fp.position },
				{ type: "rotate", x: 0, y: 1, z: 0, angle: -20 }
			];
			
			var transformations21 = 
			[
				{ type: "translate", x: -document.documentElement.offsetWidth-100, y: 40*cp.position, z: -50+cp.position },
				{ type: "rotate", x: 0, y: 1, z: 0, angle: -20 }
			];
			
			var transformations22 = 
			[
				{ type: "translate", x: 0, y: 0, z: 0 },
				{ type: "rotate", x: 0, y: 1, z: 0, angle: 0 }
			];
			
			anim1.addStep({
				property: 'transform',
				value: { context: this, method: '_transform', arguments: [ transformations11 ] },
				duration: this.duration,
				delay: 0,
				func: 'default'
			});
			
			anim1.addStep({
				property: 'transform',
				value: { context: this, method: '_transform', arguments: [ transformations12 ] },
				duration: this.duration,
				delay: 0,
				func: 'default'
			});
			
			anim2.addStep({
				property: 'transform',
				value: { context: this, method: '_transform', arguments: [ transformations21 ] },
				duration: this.duration,
				delay: 0,
				func: 'default'
			});
			
			anim2.addStep({
				property: 'transform',
				value: { context: this, method: '_transform', arguments: [ transformations22 ] },
				duration: this.duration,
				delay: 0,
				func: 'default'
			});
			
			animGroup.addAnimation(fp.getDomNode(), anim1);
			animGroup.addAnimation(cp.getDomNode(), anim2);
			
			animGroup.start(
			{
				onEnd:
				{ 
					context: this, 
					method: '_slideEnd'
				} 
			});
			
			this._firstPage = cp;
			
			wink.publish('/windows/events/slidestart', { 'id': cp.id });
		},
		
		/**
		 * Apply transforms to a node
		 * 
		 * @parameters:
		 * 	--> params: the node to transform
		 *  --> transformations: the details of the transformations
		 */
		_transform: function(params, transformations) 
		{
			var node = params.node;
			
			wink.fx.initComposedTransform(node);
			
			for (var i = 0; i < transformations.length; i++) 
			{
				wink.fx.setTransformPart(node, (i + 1), transformations[i]);
			}
			
			wink.fx.applyComposedTransform(node);
		},
		
		/**
		 * Publish the slide end event
		 */
		_slideEnd: function()
		{
			wink.publish('/windows/events/slideend', { 'id': this._firstPage.id });
		},
		
		/**
		 * Get a page
		 * 
		 * @parameters:
		 *	--> id: the id of the page to return
		 */
		_getPageById: function(id)
		{
			var i, pl = this._pagesList, l = pl.length;
			for (i = 0; i < l; i++)
			{
				var page = pl[i];
				
				if (page.id == id)
				{
					return page;
				}
			}
			return null;
		},
		
		/**
		 * Check if the properties are correct
		 */
		_validateProperties: function()
		{
			if ( !wink.isArray(this.pages) )
			{
				wink.log('[Windows] pages parameters must be an array');
				return false;
			}
			
			if ( !wink.isInteger(this.duration) )
			{
				wink.log('[Windows] duration parameter must be an integer');
				return false;
			}
				
			var l = this.pages.length;
			
			for ( var i=0; i<l; i++)
			{
				if ( $(this.pages[i]) == this.pages[i])
				{
					wink.log('[Windows] all the parameters should be dom nodes ids');
					return false;
				}
			}
		},
		
		/**
		 * Initialize the properties
		 */
		_initProperties: function()
		{
			var i, pgs = this.pages, l = pgs.length;
			
			for (i = 0; i < l; i++)
			{
				if (i == 0)
				{
					var page = new wink.ui.layout.Windows.Page({ 'node': $(pgs[i]), 'position': l-1-i, 'front': true });
					this._firstPage = page;
				} else
				{
					var page = new wink.ui.layout.Windows.Page({ 'node': $(pgs[i]), 'position': l-1-i});
				}
				
				var pn = page.getDomNode();
				
				pn.parentNode.removeChild(pn);
				
				this._domNode.appendChild(pn);
				this._pagesList.push(page);
			}
		},
		
		/**
		 * Initialize the windows container node
		 */
		_initDom: function()
		{
			this._domNode = document.createElement('div');
			
			wink.addClass(this._domNode, 'wi_container');
			
			wink.fx.apply(this._domNode, {'perspective': '1000', 'transform-style': 'preserve-3d'});
		}
	};
	
	
	/**
	 * Implement a page to be added to the windows
	 * 
	 * @methods:
	 *	--> getDomNode: returns the DOM node containing the Page
	 *	
	 * @attributes:
	 * 	--> uId: unique identifier of the component
	 * 	--> id: the dom node id of the page
	 * 	--> node: the dom node
	 * 	--> position: the position of the page in the list of pages
	 * 
	 * @properties:
	 * 	data =
	 *  {
	 *  	node = the DOM node corresponding to the page
	 *  	position = the position of the page in the list of pages
	 *  }
	 * 
	 * @author:
	 * 	--> Jerome GIRAUD
	 */
	wink.ui.layout.Windows.Page = function(properties)
	{
		this.uId			= wink.getUId();
		this.id				= null;
		
		this.node           = null;
		this.position		= 0;
		
		wink.mixin(this, properties);
		
		this._initProperties();
		this._initDom();
	};
	
	wink.ui.layout.Windows.Page.prototype =
	{	
		/**
		 * returns the DOM node containing the Page
		 */
		getDomNode: function()
		{
			return this.node;
		},
		
		/**
		 * Initialize the Page node
		 */
		_initDom: function()
		{
			wink.addClass(this.node, 'wi_page');
			
			wink.fx.apply(this.node, {'transform-origin': '300% 100%'});
			
			if ( !this.front )
			{
				wink.fx.initComposedTransform(this.node);
				wink.fx.setTransformPart(this.node, 1, { type: "translate", x: -40*this.position, y: 40*this.position, z: -50+this.position });
				wink.fx.setTransformPart(this.node, 2, { type: "rotate", x: 0, y: 1, z: 0, angle: -20 });
				wink.fx.applyComposedTransform(this.node);
			}
		},
		
		/**
		 * Initialize the properties
		 */
		_initProperties: function()
		{
			this.id = this.node.id;
		}
	};
	
	return wink.ui.layout.Windows;
});