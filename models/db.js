var settings = require('../settings');
var Db = require('mongodb').Db;
var Connection =  require('mongodb').Connection;
var Server = require('mongodb').Server;

var mydb = new Db(settings.db, new Server(settings.host, settings.dbport, {
	auto_reconnect : true,
	journal: true,
	fsync: true
}));

function DbWrapper()
{
};

DbWrapper.refCount = 0;

DbWrapper.open = function open(callback){
	if(DbWrapper.refCount==0){
		mydb.open(function(){
			callback(null, mydb);
			//console.log('open db: ref='+DbWrapper.refCount);
		});
	}
	else{
		callback(null, mydb);
	}
	
	DbWrapper.refCount++;
};

DbWrapper.close = function close(){
	DbWrapper.refCount--;
	if(DbWrapper.refCount==0){
		mydb.close();	
		//console.log('close db');
	}
};

module.exports = DbWrapper;