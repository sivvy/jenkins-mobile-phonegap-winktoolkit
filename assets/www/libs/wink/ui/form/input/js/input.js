/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Implements a customizable input field
 * 
 * @methods:
 * 	--> getDomNode: return the dom node containing the input
 * 
 * @attributes:
 * 	--> uId: unique identifier of the component
 * 	--> inputNode: the input field node
 * 	--> type: the type of the field ("text", "password", "number", "tel", "email", "url")
 * 	--> width: the width in pixels of the input field
 *	--> eraseButton: display an erase button if set to 1
 *	--> autoCorrect: enables the auto correction feature if set to 1
 *	--> autoCapitalize: enables the auto capitalization feature if set to 1
 *	--> defaultValue: the default value of the input field
 *	--> placeholder: the value of the placeholder
 *	--> pattern: an input value pattern
 * 
 * @properties:
 * 	data =
 * 	{
 * 		type: the type of the field : "text", "password", "number", "tel", "email", "url" (DEFAULT: "text")
 *		width: the width in pixels of the input field (DEFAULT: 250)
 *		eraseButton: display an erase button if set to 1 (DEFAULT: 1)
 *		autoCorrect: enables the auto correction feature if set to 1 (DEFAULT: 1)
 *		autoCapitalize: enables the auto capitalization feature if set to 1 (DEFAULT: 1)
 *		defaultValue: the value of the input field
 *		placeholder: the value of the placeholder	
 * 	}
 * 
 * @compatibility:
 * 	--> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Jerome GIRAUD
 * 
 */
define(['../../../../_amd/core'], function(wink)
{
	wink.ui.form.Input = function(properties)
	{
		this.uId            = wink.getUId();
		
		this.inputNode      = null;
		
		this.type           = this._TEXT;
		this.width          = 250;
		this.eraseButton    = 1;
		this.autoCorrect    = 1;
		this.autoCapitalize = 1;
		this.defaultValue   = '';
		this.placeholder    = '';
		this.pattern        = '';
		
		this._domNode       = null;
		this._eraseNode     = null;
		
		this._focusHandler  = wink.bind(this._handleFocus, this);
		this._blurHandler   = wink.bind(this._handleBlur, this);
		this._keyHandler    = wink.bind(this._handleKey, this);
		
		wink.mixin(this, properties);
		
		if  ( this._validateProperties() ===  false )return;
		
		this._initDom();
		this._initListeners();
	};
	
	wink.ui.form.Input.prototype =
	{
		_TEXT: 'text',
		_PASSWORD: 'password',
		_NUMBER: 'number',
		_TEL: 'tel',
		_EMAIL: 'email',
		_URL: 'url',
		
		/**
		 * return the dom node containing the input
		 */
		getDomNode: function()
		{
			return this._domNode;
		},
		
		/**
		 * Display the erase button
		 */
		_handleFocus: function()
		{
			if ( this.inputNode.value != '' )
			{
				this._eraseNode.style.display = 'block';
			}
		},
		
		/**
		 * Hide the erase button
		 */
		_handleBlur: function()
		{
			this._eraseNode.style.display = 'none';
		},
		
		/**
		 * Display the erase button
		 */
		_handleKey: function()
		{
			if ( this.inputNode.value != '' )
			{
				this._eraseNode.style.display = 'block';
			} else
			{
				this._eraseNode.style.display = 'none';
			}
		},
		
		/**
		 * Empty the input field
		 */
		_handleTouchStart: function()
		{
			this.inputNode.value = '';
			this.inputNode.focus();
			
			this._eraseNode.style.display = 'none';
		},
		
		/**
		 * Validate the input properties
		 */
		_validateProperties: function()
		{
			// Check the type
			if ( this.type != this._TEXT && this.type != this._PASSWORD && this.type != this._NUMBER && this.type != this._TEL && this.type != this._EMAIL && this.type != this._URL )
			{
				wink.log('[Input] The type property can be "text", "password", "number", "tel", "email" or "url"');
				return false;
			}
			
			// Check width
			if ( !wink.isInteger(this.width) || this.width < 0 )
			{
				wink.log('[Input] The width property must be a positive integer');
				return false;
			}
			
			// Check the defaultValue
			if ( this.defaultValue != '' )
			{
				if ( !wink.isNumber(this.defaultValue) && !wink.isString(this.defaultValue) )
				{
					wink.log('[Input] The property defaultValue must be a string or a number');
					return false;
				}
			}
			
			// Check the eraseButton parameter
			if ( !wink.isInteger(this.eraseButton) || (this.eraseButton != 0 && this.eraseButton != 1) )
			{
				wink.log('[Input] The property eraseButton must be either 0 or 1');
				return false;
			}
			
			// Check the autoCorrect parameter
			if ( !wink.isInteger(this.autoCorrect) || (this.autoCorrect != 0 && this.autoCorrect != 1) )
			{
				wink.log('[Input] The property autoCorrect must be either 0 or 1');
				return false;
			}
			
			// Check the autoCapitalize parameter
			if ( !wink.isInteger(this.autoCapitalize) || (this.autoCapitalize != 0 && this.autoCapitalize != 1) )
			{
				wink.log('[Input] The property autoCapitalize must be either 0 or 1');
				return false;
			}
	
			// Check the placeholder
			if ( this.placeholder != '' )
			{
				if ( !wink.isNumber(this.placeholder) && !wink.isString(this.placeholder) )
				{
					wink.log('[Input] The property placeholder must be a string or a number');
					return false;
				}
			}
		},
		
		/**
		 * Initialize the 'touch' listeners
		 */
		_initListeners: function()
		{
			wink.ux.touch.addListener(this._eraseNode, 'start',  { context: this, method: "_handleTouchStart", arguments: null }, { preventDefault: true });
		},
		
		/**
		 * Initialize the input DOM nodes
		 */
		_initDom: function()
		{
			this._domNode = document.createElement('div');
			this._eraseNode = document.createElement('div');
			
			this._domNode.className = 'w_search w_border w_radius';
			this._eraseNode.className = 'in_erase';
			
			this._domNode.style.width = this.width + 'px';
			
			this.inputNode = document.createElement('input');
			this.inputNode.className = 'w_input';
			this.inputNode.type = this.type;
			this.inputNode.autocorrect = this.autoCorrect;
			this.inputNode.autocapitalize = this.autoCapitalize;
			this.inputNode.placeholder = this.placeholder;
			this.inputNode.value = this.defaultValue;
			
			
			this.inputNode.addEventListener('focus', this._focusHandler, false);
			this.inputNode.addEventListener('blur', this._blurHandler, false);
			this.inputNode.addEventListener('keyup', this._keyHandler, false);
			
			this.inputNode.style.width = (this.width - 30) + 'px';
			
			this._domNode.appendChild(this.inputNode);
			this._domNode.appendChild(this._eraseNode);
		}
	};
	
	return wink.ui.form.Input;
});