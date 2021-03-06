var mongodb = require('./db');
var path = require('path');

function Item(prjname, filePath, plistPath, group, comment, time, url)
{
	this.project = prjname;//所属项目名称
	this.filePath = filePath;
	this.plistPath = plistPath;//for iOS
	
	if(group){
		this.group = group;//所属分组
	}
	else{
		this.group='';
	}
	
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
	this.url = url;
	if(this.url==''){
		this.url = this.makeURL(null);
	}
};

module.exports = Item;

Item.prototype.makeURL = function makeURL(filePath){
	var temp = this.filePath;
	
	if(filePath!=null && filePath!='')
	{
		temp = filePath;
	}

	var dirs = temp.split(path.sep);
	var url = '';
	for (idx in dirs)
	{
		if(idx>0)
		{
			url += '/';
			url += dirs[idx];
		}
	}
	
	console.log('url='+url);
	return url;
};

Item.prototype.getFilename = function(){
	var fname = this.filePath.split(path.sep).reverse()[0];
	return fname;
};

//itms-services://?action=download-manifest&url=http://192.168.0.190:2000/uploads/test/test.plist
Item.prototype.makePlistURL = function makePlistURL(host){
	if(Item.isIOS(this.group))
	{
		var url = this.makeURL(this.plistPath);
		this.url = 'itms-services://?action=download-manifest&url=http://' + host  + url;
		console.log('plist_url='+this.url);
	}
};

Item.prototype.makeIPAURL = function makeIPAURL(host){
	if(Item.isIOS(this.group))
	{
		var url = this.makeURL();
		var ipa_url = 'http://' + host + url;
		console.log('ipa_url='+ipa_url);
		return ipa_url;
	}
};


Item.prototype.save = function save(callback){
	var item = {
		project : this.project,
		filePath : this.filePath,
		plistPath : this.plistPath,
		group : this.group,
		comment : this.comment,
		time : this.time,
		url : this.url
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

Item.prototype.update = function update(prjname, filepath, newGroup, newComment, callback) {	
	mongodb.open(function(err, db) {
		if (err) {
		  return callback(err);
		}
		
		db.collection('items', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}

			//update
			collection.update({project:prjname, filePath:filepath},
				 {$set:{"group":newGroup, "comment":newComment}}, function(err) {
				mongodb.close();
				callback(err);
			});
		});
	});
};

Item.remove = function remove(prjname, filepath, callback){
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		
		db.collection('items', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			
			collection.remove({project:prjname, filePath:filepath});
			callback(null);
		});
	});
};

Item.getOne = function getOne(prjname, filepath, callback) {
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}

		db.collection('items', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			
			//find
			collection.findOne({project: prjname, filePath: filepath}, function(err, doc) {
				mongodb.close();
				if (doc) {
					var item = new Item(
						doc.project, 
						doc.filePath, 
						doc.plistPath, 
						doc.group, 
						doc.comment,
						doc.time,
						doc.url);
					callback(err, item);
				} else {
					callback(err, null);
				}
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
						doc.time,
						doc.url);
					items.push(item);
				});
				
				callback(null, items);
			});
		});
	});
};

Item.prototype.makePlist = function makePlist(host, appid, callback){	
	if(!Item.isIOS(this.group)){
		callback(null);
		return;
	}
	
	var fs = require('fs');
	
	if(path.extname(this.filePath).toLowerCase()!='.ipa'){
		callback('上传错误：iOS必须上传ipa文件');
		return;
	}
	
	
	this.plistPath = this.filePath.replace('ipa','plist');
	//console.log('file='+this.filePath);
	//console.log('plist='+this.plistPath);
	
	
	var title = path.basename(this.filePath, '.ipa');
	var tpath = path.join(__dirname, 'ios_template.plist');
	var plist_path = this.plistPath;
	
	this.makePlistURL(host);
	var iap_url = this.makeIPAURL(host);
	
	fs.readFile(tpath, 'utf8', function(err,data){
		if(err){
			callback('读取plist模版错误 '+err);
			return;
		}
		
		var template = data;
		template = template.replace('${IPA_URL}',iap_url);
		template = template.replace('${APP_ID}',appid);
		template = template.replace('${VERSION}','1.0');
		template = template.replace('${TITLE}',title);
		
		//console.log(template);
		
		console.log('save plist:'+plist_path);
		fs.writeFile(plist_path, template, 'utf8', function(err){
			if(err){
				console.log("plist save error! "+err);
				callback('保存plist文件错误 '+err);
				return;
			}
			callback(null);
		});
	});
};

Item.isIOS = function isIOS(group){
	return group.toLowerCase().match('ios')!=null;
};