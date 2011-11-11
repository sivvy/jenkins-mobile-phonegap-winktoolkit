/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Implements the database management methods for the Iphone
 * 
 * @methods:
 * 	--> connect: connection/creation to/of the specified database 
 * 	--> insert: insert a new entry into a database table
 * 	--> update: update a particular entry
 * 	--> remove: remove a particular entry
 * 	--> getList: get all the entries of a table
 * 	--> getListByField: get all the entries with the specified value in the specified field
 * 	--> getById: get the entry with the specified id
 * 	--> getTableList: get the list of all the tables in the database
 * 	--> createTables: create the tables described in the descriptor (erase all the previously stored datas)
 * 	--> emptyDatabase: remove all the datas and the tables from the database
 * 
 * @attributes:
 * 	--> uId: unique identifier of the component
 * 	--> database: the local storage component
 * 
 * @author:
 * 	--> Jerome GIRAUD
 * 
 */
define(['../../../_amd/core', './storage'], function(wink)
{
	wink.api.storage.GearsDb = function()
	{
		this.uId = wink.getUId();
		
		this.database = null;
		
		this._descriptor = null;
	};
	
	wink.api.storage.GearsDb.prototype = 
	{
		/**
		 * connection/creation to/of the specified database
		 * 
		 * @parameters:
		 * 	--> descriptor: the database descriptor
		 */
		connect: function(descriptor)
		{
			this._descriptor = descriptor;
		
			try
			{
				this.database = google.gears.factory.create('beta.database');
				this.database.open(this._descriptor.name);
			} catch (error)
			{
				wink.log("[GearsDb] Unknown error " + error + ".");
				return false;
			}
			return true;
		},
		
		/**
		 * insert a new entry into a database table
		 * 
		 * @parameters:
		 * 	--> tableName: the name of the table
		 *	--> entry: an object representing an element of the table
		 * 	--> callback =
		 * 		{
		 * 			method = the callback method to invoke after the result
		 * 			context = the context in which to invoke the callback method
		 * 		}
		 */
		insert: function(tableName, entry, callback)
		{
			var request = wink.api.storage.sqlite.getInsertRequest(this._descriptor, tableName, entry);
			
			if(!request)
			{
				return;
			}
			
			this.database.execute(request.request, request.params);
			
			var method = callback.method;
			
			if ( method )
			{
				if(this.database.rowsAffected)
				{
					entry.id = this.database.lastInsertRowId;
					wink.call(callback, entry);
				} else
				{
					wink.call(callback);
				}
			}
		},
		
		/**
		 * update a particular entry
		 * 
		 * @parameters:
		 * 	--> tableName: the name of the table
		 *	--> entry: an object representing an element of the table and containing the id of the element to update
		 * 	--> callback =
		 * 		{
		 * 			method = the callback method to invoke after the result
		 * 			context = the context in which to invoke the callback method
		 * 		}
		 */
		update: function(tableName, entry, callback)
		{
			var request = wink.api.storage.sqlite.getUpdateRequest(this._descriptor, tableName, entry);
			
			if(!request)
			{
				return;
			}
			
			this.database.execute(request.request, request.params);
			
			var method = callback.method;
			
			if ( method )
			{
				if(this.database.rowsAffected)
				{
					wink.call(callback, entry);
				} else
				{
					wink.call(callback);
				}
			}
		},
		
		/**
		 * remove a particular entry
		 * 
		 * @parameters:
		 * 	--> tableName: the name of the table
		 *	--> entryId: athe id of the element to remove
		 * 	--> callback =
		 * 		{
		 * 			method = the callback method to invoke after the result
		 * 			context = the context in which to invoke the callback method
		 * 		}
		 */
		remove: function(tableName, entryId, callback)
		{
			var request = wink.api.storage.sqlite.getRemoveRequest(this._descriptor, tableName, entryId);
			
			if(!request)
			{
				return;
			}
			
			this.database.execute(request.request, request.params);
	
			var method = callback.method;
			
			if ( method )
			{
				if(this.database.rowsAffected)
				{
					wink.call(callback, entryId);
				} else
				{
					wink.call(callback);
				}
			}
		},
		
		/**
		 * get all the entries of a table
		 * 
		 * @parameters:
		 * 	--> tableName: the name of the table
		 * 	--> callback =
		 * 		{
		 * 			method = the callback method to invoke after the result
		 * 			context = the context in which to invoke the callback method
		 * 		}
		 */
		getList: function(tableName, callback)
		{
			var request = wink.api.storage.sqlite.getSelectRequest(this._descriptor, tableName);
			
			if(!request)
			{
				return;
			}
			
			var result = this.database.execute(request.request, request.params);
			
			var method = callback.method;
			
			if ( method )
			{
				var callbackResult = [];
				while (result.isValidRow())
				{
					var row = {};
					for(var i=0; i<result.fieldCount(); i++)
					{
						if(this._descriptor.tables[tableName][result.fieldName(i)] == wink.api.storage.fieldtypes.BLOB_B64)
						{
							row[result.fieldName(i)] = wink.api.storage.utils.decode(result.field(i));
						} else
						{
							row[result.fieldName(i)] = result.field(i);
						}					
					}
					callbackResult.push(row);
					result.next();
				}
				result.close();
				
				wink.call(callback, callbackResult);
			}
		},
		
		/**
		 * get all the entries with the specified value in the specified field
		 * 
		 * @parameters:
		 * 	--> tableName: the name of the table
		 * 	--> fieldName: search field criteria
		 * 	--> fieldValue: search field value
		 * 	--> callback =
		 * 		{
		 * 			method = the callback method to invoke after the result
		 * 			context = the context in which to invoke the callback method
		 * 		}
		 */
		getListByField: function(tableName, fieldName, fieldValue, callback)
		{
			var request = wink.api.storage.sqlite.getSelectRequest(this._descriptor, tableName, fieldName, fieldValue);
			
			if(!request)
			{
				return;
			}
			
			var result = this.database.execute(request.request, request.params);
			
			var method = callback.method;
			
			if ( method )
			{
				var callbackResult = [];
				while (result.isValidRow())
				{
					var row = {};
					for(var i=0; i<result.fieldCount(); i++)
					{
						if(this._descriptor.tables[tableName][result.fieldName(i)] == wink.api.storage.fieldtypes.BLOB_B64)
						{
							row[result.fieldName(i)] = wink.api.storage.utils.decode(result.field(i));
						} else
						{
							row[result.fieldName(i)] = result.field(i);
						}
					}
					callbackResult.push(row);
					result.next();
				}
				result.close();
		
				wink.call(callback, callbackResult);
			}
		},
		
		/**
		 * get the entry with the specified id
		 * 
		 * @parameters:
		 * 	--> tableName: the name of the table
		 * 	--> entryId: athe id of the element to get
		 * 	--> callback =
		 * 		{
		 * 			method = the callback method to invoke after the result
		 * 			context = the context in which to invoke the callback method
		 * 		}
		 */
		getById: function(tableName, entryId, callback)
		{
			var request = wink.api.storage.sqlite.getSelectRequest(this._descriptor, tableName, 'id', entryId);
			
			if(!request)
			{
				return;
			}
			
			var result = this.database.execute(request.request, request.params);
			
			var method = callback.method;
			
			if ( method )
			{
				var callbackResultRow = {};
				if (result.isValidRow())
				{
					for(var i=0; i<result.fieldCount(); i++)
					{
						if(this._descriptor.tables[tableName][result.fieldName(i)] == wink.api.storage.fieldtypes.BLOB_B64)
						{
							callbackResultRow[result.fieldName(i)] = wink.api.storage.utils.decode(result.field(i));
						} else
						{
							callbackResultRow[result.fieldName(i)] = result.field(i);
						}
					}
					result.next();
				} else
				{
					callbackResultRow = null;
				}
				result.close();
				
				wink.call(callback, callbackResultRow);
			}
		},
		
		/**
		 * get the list of all the tables in the database
		 * 
		 * @parameters:
		 * 	--> callback =
		 * 		{
		 * 			method = the callback method to invoke after the result
		 * 			context = the context in which to invoke the callback method
		 * 		}
		 */
		getTableList: function(callback)
		{
			var request = wink.api.storage.sqlite.getTableListRequest();
			
			if(!request)
			{
				return;
			}
			
			var result = this.database.execute(request.request, request.params);
			
			var method = callback.method;
			
			if ( method )
			{
				var callbackResult = [];
				while (result.isValidRow())
				{
					callbackResult.push(result.fieldByName('name'));
					result.next();
				}
				result.close();
				
				wink.call(callback, callbackResult);
			}
		},
		
		/**
		 * create the tables described in the descriptor (erase all the previously stored datas)
		 */
		createTables: function()
		{
			var requests = wink.api.storage.sqlite.getCreateTablesRequests(this._descriptor);
			
			for(var i=0; i<requests.length; i++)
			{
				this.database.execute(requests[i]);
			}
		},
		
		/**
		 * remove all the datas and the tables from the database
		 */
		emptyDatabase: function()
		{
			this.getTableList({context:this, method:'_dropTables'});
		},
		
		/**
		 * drop tables
		 * 
		 * @parameters:
		 * 	--> tableList: the list of tables to delete
		 */
		_dropTables: function(tableList)
		{
			var requests = [];
			for(var i=0; i<tableList.length; i++)
			{
				var request = wink.api.storage.sqlite.getDropTableRequest(this._descriptor, tableList[i]);
				
				if(!request)
				{
					return;
				}
				
				this.database.execute(request.request);
			}
		}
	};
	
	return wink.api.storage.GearsDb;
});

///////////////////////////////////////////////////////////////
//GOOGLE GEARS INIT PART
///////////////////////////////////////////////////////////////

//Copyright 2007, Google Inc.
//
//Redistribution and use in source and binary forms, with or without
//modification, are permitted provided that the following conditions are met:
//
//1. Redistributions of source code must retain the above copyright notice,
//  this list of conditions and the following disclaimer.
//2. Redistributions in binary form must reproduce the above copyright notice,
//  this list of conditions and the following disclaimer in the documentation
//  and/or other materials provided with the distribution.
//3. Neither the name of Google Inc. nor the names of its contributors may be
//  used to endorse or promote products derived from this software without
//  specific prior written permission.
//
//THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR IMPLIED
//WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
//MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO
//EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
//SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
//PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
//OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
//WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
//OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
//ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//Sets up google.gears.*, which is *the only* supported way to access Gears.
//
//Circumvent this file at your own risk!
//
//In the future, Gears may automatically define google.gears.* without this
//file. Gears may use these objects to transparently fix bugs and compatibility
//issues. Applications that use the code below will continue to work seamlessly
//when that happens.

(function()
{
	// We are already defined. Hooray!
	if (window.google && google.gears)
	{
		return;
	}

	var factory = null;

	// Firefox
	if (typeof GearsFactory != 'undefined')
	{
		factory = new GearsFactory();
	} else
	{
		// IE
		try
		{
			factory = new ActiveXObject('Gears.Factory');
			// privateSetGlobalObject is only required and supported on IE Mobile on
			// WinCE.
			if (factory.getBuildInfo().indexOf('ie_mobile') != -1)
			{
				factory.privateSetGlobalObject(this);
			}
		} catch (e)
		{
			// Safari
			if ((typeof navigator.mimeTypes != 'undefined') && navigator.mimeTypes["application/x-googlegears"])
			{
				factory = document.createElement("object");
				factory.style.display = "none";
				factory.width = 0;
				factory.height = 0;
				factory.type = "application/x-googlegears";
				document.documentElement.appendChild(factory);
			}
		}
	}

	// *Do not* define any objects if Gears is not installed. This mimics the
	// behavior of Gears defining the objects in the future.
	if (!factory)
	{
		return;
	}

	// Now set up the objects, being careful not to overwrite anything.
	//
	// Note: In Internet Explorer for Windows Mobile, you can't add properties to
	// the window object. However, global objects are automatically added as
	// properties of the window object in all browsers.
	if (!window.google)
	{
		google = {};
	}

	if (!google.gears)
	{
		google.gears =
		{
			factory: factory
		};
	}
})();