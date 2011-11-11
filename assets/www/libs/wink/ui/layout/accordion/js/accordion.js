/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Implement an accordion container
 * 
 * @methods:
 *	--> addSection: add a new section to the Accordion
 *	--> deleteSection: removes an existing section of the Accordion
 *	--> selectSection: display the selected section
 *	--> getDomNode: returns the DOM node containing the Accordion
 *  --> getSections: returns the sections
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
	wink.ui.layout.Accordion = function()
	{
		this.uId              = wink.getUId();
		
		this._sectionsList    = [];
		this._selectedSection = 0;
		
		this._height          = 0;
		
		this._domNode         = null;
		
		this._initDom();
		this._subscribeToEvents();
	};
	
	wink.ui.layout.Accordion.prototype = 
	{
		DURATION: 500,
		
		/**
		 * Add a new section to the Accordion. Returns the section that has been created
		 * 
		 * @parameters:
		 * 	--> title: the title of the new section
		 * 	--> content: the content of the section. It can be either a string or a DOM node
		 */
		addSection: function(title, content)
		{
			var section = new wink.ui.layout.Accordion.Section({'title': title, 'content': content, 'position': this._sectionsList.length, 'accordion': this});
			
			this._sectionsList.push(section);
			
			this._domNode.appendChild(section.containerNode);
			
			this._updateHeight();
			
			return section.uId;
		},
	
		/**
		 * Removes an existing section of the Accordion
		 * 
		 * @parameters:
		 * 	--> sectionId: the uId of the section object to remove
		 */
		deleteSection: function(sectionId)
		{
			var f = -1;
			var p = -1;
			var q = -1;
			var l = this._sectionsList.length;
			
			for (var i = 0; i < l; i++) 
			{
				if ( f ==1 )
				{
					this._sectionsList[i].position = i-1;
					this._sectionsList[i]._updatePosition();
				}
				
				if ( this._sectionsList[i].uId == this._selectedSection )
				{
					q = i;
				}
	
				if ( this._sectionsList[i].uId == sectionId )
				{
					f = 1;
					p = i;
	
					this._domNode.removeChild(this._sectionsList[i].containerNode);
					
					if (this._sectionsList[i].uId == this._selectedSection)
					{ 
						if (i > 0) 
						{
							this.selectSection(this._sectionsList[i - 1].uId);
						} else 
						{
							this.selectSection(this._sectionsList[0].uId);
						}
					}
				}
			}
			
			this._domNode.style.height = ((this._sectionsList[0].TITLE_HEIGHT * this._sectionsList.length-1) + this._sectionsList[q].contentNode.scrollHeight) + 'px';
			
			if ( p != -1 )
			{	
				this._sectionsList.splice(p, 1);
			}
		},
	
		/**
		 * Display the selected section
		 * 
		 * @parameters:
		 * 	--> sectionId: the id of the section to select
		 */
		selectSection: function(sectionId)
		{
			var l = this._sectionsList.length;
			var f = -1;
			
			for ( var i = 0 ; i < l ; i++)
			{
				if (this._sectionsList[i].uId == sectionId) 
				{
					
					if ( this._sectionsList[i].opened == false && ((this._sectionsList[i].TITLE_HEIGHT * this._sectionsList.length) + this._sectionsList[i].contentNode.scrollHeight > this._height) )
					{
						this._domNode.style.height = ((this._sectionsList[i].TITLE_HEIGHT * this._sectionsList.length) + this._sectionsList[i].contentNode.scrollHeight) + 'px';
					} 
					
					f = i;
					this._sectionsList[i].show();
					this._selectedSection = sectionId;
					
				} else
				{
					if ( f == -1 || (f != -1 && this._sectionsList[f].opened === false) )
					{
						this._sectionsList[i].hide(-1);
					} else
					{
						this._sectionsList[i].hide(this._sectionsList[f].contentNode.scrollHeight);
					}
				}
			}
		},
		
		/**
		 * Refreshes the section content height
		 */
		refreshContentHeight: function()
		{
			this.selectSection(this._selectedSection);
		},
	
		/**
		 * Returns the DOM node containing the accordion
		 */
		getDomNode: function()
		{
			return this._domNode;
		},
		
		/**
		 * Returns the sections
		 */
		getSections: function()
		{
			return this._sectionsList;
		},
		
		/**
		 * Update the accordion's height
		 */
		_updateHeight: function()
		{
			this._height = this._sectionsList[0].TITLE_HEIGHT * this._sectionsList.length;
			this._domNode.style.height = this._height + 'px';
		},
	
		/**
		 * Select a section after a '/section/events/selectsection' event has been fired
		 * 
		 * @parameters:
		 * 	--> params: the object returned when a '/section/events/selectsection' event is fired
		 */
		_selectSection: function(params)
		{
			this.selectSection(params.sectionId);
		},
	
		/**
		 * Initialize the Accordion node
		 */
		_initDom: function()
		{
			this._domNode = document.createElement('div');
			this._domNode.className = 'w_list w_border_top ac_accordion';
		},
		
		
		/**
		 * Listen to the '/section/events/selectsection' events
		 */
		_subscribeToEvents: function()
		{
			wink.subscribe('/section/events/selectsection', {context: this, method: '_selectSection'});
		}
	};
	
	/**
	 * Implement a section of an Accordion
	 * 
	 * @methods:
	 * 	--> show: display the section
	 * 	--> hide: hide the section
	 * 
	 * @attributes:
	 * 	--> uId: unique identifier of the component
	 * 	--> title: the title of the section
	 * 	--> content: the content of the section
	 * 	--> position: the position of the section in the list of sections
	 * 	--> opened: indicates whether the section is opened or closed
	 * 	--> titleNode: the DOM node where the title is set
	 * 	--> chevronNode: the DOM node where the chevron is set
	 * 	--> contentNode: the DOM node where the content is set
	 * 	--> containerNode: the main DOM node of the section
	 * 
	 * @events:
	 * 	--> /section/events/selectsection: the event is fired when we click on a section title node (return the section uId)
	 * 
	 * @properties:
	 * 	data = 
	 * 	{
	 * 		title = title of the section	
	 * 		content = content of the section. It can be either a string or a DOM node
	 * 		position = the position of the section
	 * 		accordion = the parent accordion
	 *	}
	 * 
	 * @author:
	 * 	--> Jerome GIRAUD
	 */
	wink.ui.layout.Accordion.Section = function(properties)
	{
		this.uId           = wink.getUId();
		
		this.title         = properties.title;
		this.content       = properties.content;
		
		this.position      = properties.position;
		
		this.opened        = false;
		
		this.DURATION      = 500;
		this.HIGHER_INDEX  = 999;
		this.TITLE_HEIGHT  = 44;
		
		this.titleNode     = null;
		this.chevronNode   = null;
		this.contentNode   = null;
		this.containerNode = null;
		
		this._accordion    = properties.accordion;
		
		
		if  ( this._validateProperties() ===  false )return;
		
		this._initDom();
	};
	
	wink.ui.layout.Accordion.Section.prototype =
	{	
		/**
		 * Display the section
		 */
		show: function()
		{
			this.containerNode.translate(0, 0);
			this.chevronNode.rotate(0);
			
			wink.fx.onTransitionEnd(this.contentNode, wink.bind(this._scroll, this));
			
			if ( this.opened === false )
			{
				this.contentNode.translate(0, this.contentNode.scrollHeight);
				this.chevronNode.rotate(90);
				this.opened = true;
			} else
			{
				this.contentNode.translate(0, 0);
				this.chevronNode.rotate(0);
				this.opened = false;
			}
		},
	
		/**
		 * Hide the section
		 */
		hide: function(position)
		{
			if ( position == -1 )
			{
				this.containerNode.translate(0, 0);
			} else 
			{
				this.containerNode.translate(0, position);
			}
			
			this.opened = false;
			this.contentNode.translate(0, 0);
			this.chevronNode.rotate(0);
		},
		
		/**
		 * Auto scroll after a section opened
		 */
		_scroll: function()
		{
			
			if ( this.opened == false )
			{
				this._accordion._height = (this.TITLE_HEIGHT * this._accordion._sectionsList.length);
			} else
			{
				this._accordion._height = (this.TITLE_HEIGHT * this._accordion._sectionsList.length) + this.contentNode.scrollHeight;
			}
			
			this._accordion._domNode.style.height = this._accordion._height + 'px';
			
			scrollTo(0, this.titleNode.getTopPosition());
		},
		
		/**
		 * Check if the properties are correct
		 */
		_validateProperties: function()
		{
			if ( this.title == '' || wink.isUndefined(this.title) || !wink.isString(this.title) )
			{
				wink.log('[Accordion] The title must be a string and must not be empty');
				return false;
			}
		},
		
		/**
		 * Update the section position
		 */
		_updatePosition: function()
		{
			this.containerNode.style.top = (this.position * this.TITLE_HEIGHT) + 'px';
		},
	
		/**
		 * Initialize the Accordion node
		 */
		_initDom: function()
		{
			this.containerNode = document.createElement('div');
			this.containerNode.className = 'ac_section';
			
			this.containerNode.style.zIndex = this.HIGHER_INDEX - this.position;
			this.containerNode.style.top = (this.position * this.TITLE_HEIGHT) + 'px';
			
			this.containerNode.translate(0, 0);
			
			wink.fx.applyTransformTransition(this.containerNode, this.DURATION + 'ms', '', 'ease-in-out');
			
			this.contentNode = document.createElement('div');
			this.contentNode.className = 'w_bloc w_box w_border ac_content';
			
			this.contentNode.translate(0, 0);
			
			wink.fx.applyTransformTransition(this.contentNode, this.DURATION + 'ms', '', 'ease-in-out');
			
			if ( wink.isString(this.content) )
			{
				this.contentNode.innerHTML = this.content;
			} else
			{
				this.contentNode.innerHTML = '';
				this.contentNode.appendChild(this.content);
			}
			
			this.titleNode = document.createElement('div');
			this.titleNode.innerHTML = this.title;
			this.titleNode.className = 'w_box w_list_item w_border_bottom w_border_left w_border_right w_bg_light ac_title';
			
			this.titleNode.onclick = wink.bind(function(e)
			{
				wink.publish('/section/events/selectsection', {'sectionId': this.uId});
			}, this);
			
			this.chevronNode = document.createElement('div');
			this.chevronNode.className = 'w_icon w_chevron';
			
			this.chevronNode.rotate(0);
			
			wink.fx.applyTransformTransition(this.chevronNode, this.DURATION + 'ms', '', 'ease-in-out');
			
			this.titleNode.appendChild(this.chevronNode);
			
			this.containerNode.appendChild(this.titleNode);
			this.containerNode.appendChild(this.contentNode);
		}
	};
	
	return wink.ui.layout.Accordion;
});