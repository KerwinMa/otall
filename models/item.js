var mongodb = require('./db');

function Item(prjname, filePath, plistPath, group, comment, time)
{
	this.project = prjname;//所属项目名称
	this.filePath = filePath;
	this.plistPath = plistPath;//for iOS
	this.group = group;//所属分组
	this.comment = comment;
	if(time){
		this.time = time;
	}
	else{
		this.time = new Date();
	}
	this.url = "";
};

module.exports = Item;

Item.prototype.makeURL = function makeURL(){
	if(this.group=='iOS')
	{
		
	}
	
	this.url = this.filePath;
};

Item.prototype.save = function save(callback){
	var item = {
		project : this.project,
		filePath : this.filePath,
		plistPath : this.plistPath,
		group : this.group,
		comment : this.comment,
		time : this.time
	};
	
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}
		
		db.collection('items', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			collection.ensureIndex('project');
			collection.insert(item, {safe:true}, function(err,item){
				mongodb.close();
				callback(err, item);
			});
		});
	});
};

Item.get = function get(prjname, callback){
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		
		db.collection('items', function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			
			var query = {};
			query.project = prjname;
			
			collection.find(query).sort({time:-1}).toArray(function(err,docs){
				mongodb.close();
				if(err){
					callback(err,null);
				}
				
				var items = [];
				docs.forEach(function(doc,index){
					var item = new Item(
						doc.project, 
						doc.filePath, 
						doc.plistPath, 
						doc.group, 
						doc.comment,
						doc.time);
					items.push(item);
				});
				
				callback(null, items);
			});
		});
	});
};