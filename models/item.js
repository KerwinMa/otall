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
		var now = new Date();
		var timestr = now.getFullYear()+'-'+(now.getMonth()+1)+'-'+now.getDate()+' '+now.getHours()+':';
		var minu = now.getMinutes();
		if(minu<10)
			timestr += '0';
		timestr += minu;
			
		this.time = timestr;
	}
	this.url = this.makeURL();
};

module.exports = Item;

Item.prototype.makeURL = function makeURL(){
	var url = this.filePath;
	
	if(this.group=='iOS')
	{
		url = this.plistPath;
	}
	
	url =  url.replace('public/','');
	url = '../'+url;
	
	return url;
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

Item.get = function get(prjname, group, callback){
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
			if(group){
				query.group = group;
			}
			
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