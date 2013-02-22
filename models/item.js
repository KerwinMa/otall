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
};

module.exports = Item;

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
}

Item.get = function get(prjname, callback){
	
}