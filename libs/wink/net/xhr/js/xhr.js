/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * XHR utility
 * 
 * @methods:
 * 	--> sendData: make an XHR call to the given URL
 * 
 * @attributes:
 * 	--> uId: unique identifier of the component
 * 	--> request: an object containing the actual XMLHttpRequest and optionally parameters
 * 
 * @properties:
 * 	--> properties: parameters that will be stored within the request object and can be used in the callbacks methods
 * 
 * @compatibility:
 * 	--> Iphone OS2, Iphone OS3, Iphone OS4, Android 1.1, Android 1.5, Android 2.1, Android 2.2, Android 2.3, BlackBerry 6, Bada 1.0
 * 
 * @author:
 * 	--> Jerome GIRAUD
 */
define(['../../../_base/_base/js/base', '../../../_base/error/js/error'], function(wink) 
{
	var isSet = wink.isSet;
	var isArray = wink.isArray;
	
	wink.net.Xhr = function(properties)
	{
		this.uId = wink.getUId();
		
		this.request =
		{
		    xhrObject: null,
		    params: properties
		};
	
		/**
		 * Initiate the component
		 */
		this._create();
	};
	
	wink.net.Xhr.prototype =
	{
		/**
		 * Send the datas
		 * 
		 * @parameters:
		 * 	--> url: the URL to call
		 * 	--> parameters: the parameters to add to the request URL
		 * 	--> method: either GET or POST
		 * 	--> successCallback: the method to call in case of success. The 'callback' is an object that must contain a 'method' and a 'scope'
		 * 	--> failureCallback: the method to call in case of success. The 'callback' is an object that must contain a 'method' and a 'scope'
		 * 	--> headers: the HTTP headers to add to the request
		 */
		sendData: function(url, parameters, method, successCallback, failureCallback, headers)
		{
			var r = this.request, xo = r.xhrObject, enc = encodeURIComponent;
		
			method = method.toUpperCase();
			
			if ( isSet(parameters) && !isArray(parameters) )
			{
				wink.log('[Xhr] parameters must be in an array of objects containing the parameter name and value');
				return;
			}
		
			if (xo)
			{
				var p = null;
				
				if ( isSet(parameters) )
				{	
					var i, l = parameters.length;
					
					for (i=0; i<l; i++)
					{
						var parami = parameters[i];
						var name = parami.name;
						var value = parami.value;
						
						if ( method == 'GET' )
						{
							if ( i==0 && url.indexOf('?')==-1)	
							{
								url += '?' + enc(name) + '=' + enc(value);
							} else
							{
								url += '&' + enc(name) + '=' + enc(value);
							}
						} else
						{
							if ( i==0 )
							{
								p = enc(name) + '=' + enc(value);
							} else
							{
								p += '&' + enc(name) + '=' + enc(value);
							}
						}
					}
				}
				
				try
				{
					xo.open(method, url, true);
					xo.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=utf-8');
					
					if ( isSet(headers) )
	  				{
	  					if ( !isArray(headers) )
	  					{
	  						wink.log('[Xhr] headers must be in an array of objects containing the header name and value');
	  					} else
	  					{
	  						var i, l = headers.length;
	  						for (i=0; i<l; i++)
	  						{
	  							var hi = headers[i];
	  							xo.setRequestHeader(hi.name, hi.value);
	  						}
	  					}
	  				}
					
					xo.send(p);
					
				} catch (e)
				{
					return false;
				}
					
				xo.onreadystatechange = function()
				{
					var readyState = xo.readyState;
					
					if (readyState != 4)
					{
						return
					}
					
					var status = xo.status;
					
					if (!((status >= 200 && status < 400) || status == 0))
					{
						if ( isSet(failureCallback) )
						{
							wink.call(failureCallback, r);
						}
					} else
					{
						if ( isSet(successCallback) )
						{
							wink.call(successCallback, r);
						}
					}
				};
			} else
			{
				return false;
			}
		
			return true;
		},
	
		/**
		 * Instantiate a new XMLHttpRequest
		 */
		_create: function()
		{
			var xhrInterface = window.XMLHttpRequest;
			if (xhrInterface)
			{
				var xo;
				try
				{
					xo = new xhrInterface();
				} catch (e)
				{
					xo = false;
				}
				this.request.xhrObject = xo;
			} else
			{
				wink.log('[Xhr] XHR not supported');
			}
		}
	};
	
	//Bindings
	wink.Xhr = wink.net.Xhr;
	
	return wink.Xhr;
});