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
 * 	--> MAX_SIZE: the size of the database (5Mb)
 * 	--> VERSION: the version of the database (1.0)
 * 
 * @author:
 * 	--> Jerome GIRAUD
 * 
 */
define(['../../../_amd/core', './storage'], function(wink)
{
	wink.api.storage.SafariDb = function()
	{
		this.uId = wink.getUId();
		
		this.database = null;
		
		this._descriptor = null;
	};
	
	wink.api.storage.SafariDb.prototype =
	{
		MAX_SIZE: 5*1024*1024,
		VERSION: '1.0',
		
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
				this.database = window.openDatabase(this._descriptor.name, this.VERSION, this._descriptor.name, this.MAX_SIZE);
			} catch (error)
			{
				if (error == 2)
				{
					wink.log("[SafariDb] Invalid database version. Update Not Implemented");
					return false;
				} else
				{
					wink.log("[SafariDb] Unknown error " + error + ".");
					return false;
				}
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
			
			var callback_success = this._insertSuccessHandler;
			var callback_error = this._insertErrorHandler;
			
			this.database.transaction(
				function(transaction)
				{
					transaction.callback = callback;
					transaction.entry = entry;
					transaction.executeSql(request.request, request.params, callback_success, callback_error);
				}
			);
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
			
			var callback_success = this._updateSuccessHandler;
			var callback_error = this._updateErrorHandler;
			
			this.database.transaction(
				function(transaction)
				{
					transaction.callback = callback;
					transaction.entry = entry;
					transaction.executeSql(request.request, request.params, callback_success, callback_error);
				}
			);
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
			
			var callback_success = this._removeSuccessHandler;
			var callback_error = this._removeErrorHandler;
	
			this.database.transaction(
				function(transaction)
				{
					transaction.callback = callback;
					transaction.entryId = entryId;
					transaction.executeSql(request.request, request.params, callback_success, callback_error);
				}
			);
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
			
			var callback_success = this._selectListSuccessHandler;
			var callback_error = this._selectListErrorHandler;
			
			var dbmgr = this;
			this.database.transaction(
				function(transaction)
				{
					transaction.callback = callback;
					transaction.tb_descriptor = dbmgr._descriptor.tables[tableName];
					transaction.executeSql(request.request, request.params, callback_success, callback_error);
				}
			);
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
			
			var callback_success = this._selectListSuccessHandler;
			var callback_error = this._selectListErrorHandler;
			
			var dbmgr = this;
			this.database.transaction(
				function(transaction)
				{
					transaction.callback = callback;
					transaction.tb_descriptor = dbmgr._descriptor.tables[tableName];
					transaction.executeSql(request.request, request.params, callback_success, callback_error);
				}
			);
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
			
			var callback_success = this._selectByIdSuccessHandler;
			var callback_error = this._selectByIdErrorHandler;
			
			var dbmgr = this;
			this.database.transaction(
				function(transaction)
				{
					transaction.callback = callback;
					transaction.tb_descriptor = dbmgr._descriptor.tables[tableName];
					transaction.executeSql(request.request, request.params, callback_success, callback_error);
				}
			);
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
			
			var callback_success = this._getTableListSuccessHandler;
			var callback_error = this._getTableListErrorHandler;
			
			this.database.transaction(
				function(transaction)
				{
					transaction.callback = callback;
					transaction.executeSql(request.request, request.params, callback_success, callback_error);
				}
			);
		},
		
		/**
		 * create the tables described in the descriptor (erase all the previously stored datas)
		 */
		createTables: function()
		{
			var requests = wink.api.storage.sqlite.getCreateTablesRequests(this._descriptor);
			
			var callback_success = this._nullDataHandler;
			var callback_error = this._createTablesErrorHandler;
			
			this.database.transaction(
				function(transaction)
				{
					for(var i=0; i<requests.length; i++)
					{
						transaction.executeSql(requests[i], [], callback_success, callback_error);
					}
				}
			);
		},
		
		/**
		 * remove all the datas and the tables from the database
		 */
		emptyDatabase: function()
		{
			this.getTableList({context:this, method:'_dropTables'});
		},
		
		/**
		 * insert success handler
		 * 
		 * @parameters:
		 * 	--> transaction: the current transaction
		 * 	--> result: the result of the transaction
		 */
		_insertSuccessHandler: function(transaction, result)
		{
			var method = transaction.callback.method;
			
			if ( method )
			{
				if (result.rowsAffected)
				{
					transaction.entry.id = result.insertId;
					wink.call(transaction.callback, transaction.entry);
				} else
				{
					wink.call(transaction.callback);
				}
			}
		},
		
		/**
		 * insert error handler
		 * 
		 * @parameters:
		 * 	--> transaction: the current transaction
		 * 	--> error: the result of the transaction
		 */
		_insertErrorHandler: function(transaction, error)
		{
			wink.log('[SafariDb] insertErrorHandler : "' + error.message + '" (Code ' + error.code + ')');
		},
		
		/**
		 * update success handler
		 * 
		 * @parameters:
		 * 	--> transaction: the current transaction
		 * 	--> result: the result of the transaction
		 */
		_updateSuccessHandler: function(transaction, result)
		{
			var method = transaction.callback.method;
			
			if ( method )
			{
				if (result.rowsAffected)
				{
					wink.call(transaction.callback, transaction.entry);
				} else
				{
					wink.call(transaction.callback);
				}
			}
		},
		
		/**
		 * update error handler
		 * 
		 * @parameters:
		 * 	--> transaction: the current transaction
		 * 	--> error: the result of the transaction
		 */
		_updateErrorHandler: function(transaction, error)
		{
			wink.log('[SafariDb] updateErrorHandler : "' + error.message + '" (Code ' + error.code + ')');
		},
		
		/**
		 * remove success handler
		 * 
		 * @parameters:
		 * 	--> transaction: the current transaction
		 * 	--> result: the result of the transaction
		 */
		_removeSuccessHandler: function(transaction, result)
		{
			var method = transaction.callback.method;
			
			if ( method )
			{
				if (result.rowsAffected)
				{
					wink.call(transaction.callback, transaction.entryId);
				} else
				{
					wink.call(transaction.callback);
				}
			}
		},
		
		/**
		 * remove error handler
		 * 
		 * @parameters:
		 * 	--> transaction: the current transaction
		 * 	--> error: the result of the transaction
		 */
		_removeErrorHandler: function(transaction, error)
		{
			wink.log('[SafariDb] removeErrorHandler : "' + error.message + '" (Code ' + error.code + ')');
		},
		
		/**
		 * select success handler
		 * 
		 * @parameters:
		 * 	--> transaction: the current transaction
		 * 	--> result: the result of the transaction
		 */
		_selectListSuccessHandler: function(transaction, results)
		{
			var method = transaction.callback.method;
			
			if ( method )
			{
				var callbackResult = new Array();
				
				if (results.rows.length)
				{
					for (var i = 0; i < results.rows.length; i++)
					{
						var row = results.rows.item(i);
						var rowResult = {};
						for(var field in row)
						{
							if(transaction.tb_descriptor[field] == wink.api.storage.fieldtypes.BLOB_B64)
							{
								rowResult[field] = Base64.decode(row[field]);
							} else
							{
								rowResult[field] = row[field];
							}
						}
						callbackResult.push(rowResult);
					}
				}
				
				wink.call(transaction.callback, callbackResult);
			}
		},
		
		/**
		 * select error handler
		 * 
		 * @parameters:
		 * 	--> transaction: the current transaction
		 * 	--> error: the result of the transaction
		 */
		_selectListErrorHandler: function(transaction, error)
		{
			wink.log('[SafariDb] selectListErrorHandler : "' + error.message + '" (Code ' + error.code + ')');
		},
		
		/**
		 * select by id success handler
		 * 
		 * @parameters:
		 * 	--> transaction: the current transaction
		 * 	--> result: the result of the transaction
		 */
		_selectByIdSuccessHandler: function(transaction, results)
		{
			var method = transaction.callback.method;
			
			if ( method )
			{
				if (results.rows.length)
				{
					var row = results.rows.item(0);
					var rowResult = {};
					for(var field in row)
					{
						if(transaction.tb_descriptor[field] == wink.api.storage.fieldtypes.BLOB_B64)
						{
							rowResult[field] = wink.api.storage.utils.decode(row[field]);
						} else
						{
							rowResult[field] = row[field];
						}
					}
					wink.call(transaction.callback, rowResult);
				} else
				{
					wink.call(transaction.callback);
				}
			}
		},
		
		/**
		 * select by id error handler
		 * 
		 * @parameters:
		 * 	--> transaction: the current transaction
		 * 	--> error: the result of the transaction
		 */
		_selectByIdErrorHandler: function(transaction, error)
		{
			wink.log('[SafariDb] selectErrorHandler : "' + error.message + '" (Code ' + error.code + ')');
		},
		
		/**
		 * get tables success handler
		 * 
		 * @parameters:
		 * 	--> transaction: the current transaction
		 * 	--> result: the result of the transaction
		 */
		_getTableListSuccessHandler: function(transaction, results)
		{
			var method = transaction.callback.method;
			
			if ( method )
			{
				var callbackResult = [];
				if (results.rows.length)
				{
					for (var i = 0; i < results.rows.length; i++)
					{
						var row = results.rows.item(i);
						callbackResult.push(row.name);
					}
					
					wink.call(transaction.callback, callbackResult);
				} else
				{
					wink.call(transaction.callback);
				}
			}
		},
		
		/**
		 * get tables error handler
		 * 
		 * @parameters:
		 * 	--> transaction: the current transaction
		 * 	--> result: the result of the transaction
		 */
		_getTableListErrorHandler: function(transaction, error)
		{
			wink.log('[SafariDb] getTableListErrorHandler : "' + error.message + '" (Code ' + error.code + ')');
		},
		
		/**
		 * create/drop tables handler
		 * 
		 * @parameters:
		 * 	--> transaction: the current transaction
		 * 	--> result: the result of the transaction
		 */
		_nullDataHandler: function(transaction, result)
		{
			
		},
		
		/**
		 * create tables error handler
		 * 
		 * @parameters:
		 * 	--> transaction: the current transaction
		 * 	--> error: the result of the transaction
		 */
		_createTablesErrorHandler: function(transaction, error)
		{
			wink.log('[SafariDb] Error while creating tables !');
		},
		
		/**
		 * drop tables error handler
		 * 
		 * @parameters:
		 * 	--> transaction: the current transaction
		 * 	--> result: the result of the transaction
		 */
		_dropTableErrorHandler: function(transaction, error)
		{
			wink.log('[SafariDb] dropTableErrorHandler : "' + error.message + '" (Code ' + error.code + ')');
		},
		
		/**
		 * drop tables
		 * 
		 * @parameters:
		 * 	--> tableList: the list of tables to delete
		 */
		_dropTables: function(tableList)
		{
			var callback_success = this._nullDataHandler;
			var callback_error = this._dropTableErrorHandler;
			
			var requests = [];
			for(var i=0; i<tableList.length; i++)
			{
				var request = wink.api.storage.sqlite.getDropTableRequest(this._descriptor, tableList[i]);
				
				if(!request)
				{
					return;
				}
				
				requests.push(request.request);
			}
			
			this.database.transaction(
				function(transaction)
				{
					for(var j=0; j<requests.length; j++)
					{
						transaction.executeSql(requests[j], [], callback_success, callback_error);
					}				
				}
			);
		}
	};
	
	return wink.api.storage.SafariDb;
});
