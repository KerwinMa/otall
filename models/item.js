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
		this.url = this.makeURL();
	}
};

module.exports = Item;

Item.prototype.makeURL = function makeURL(){
	var url = this.filePath;
	
	if(Item.isIOS(this.group))
	{
		url = this.plistPath;
	}
	
	url =  url.replace('public/','');
	url = '../'+url;
	
	return url;
};

//itms-services://?action=download-manifest&url=http://192.168.0.190:2000/uploads/test/test.plist
Item.prototype.makePlistURL = function makePlistURL(host, plist_path){
	if(Item.isIOS(this.group))
	{
		var plist = plist_path.replace('public','');
		this.url = 'itms-services://?action=download-manifest&url=http://' + path.join(host, plist);
		console.log('plist_url='+this.url);
	}
};

Item.prototype.makeIPAURL = function makeIPAURL(host, ipa_path){
	if(Item.isIOS(this.group))
	{
		var ipa = ipa_path.replace('public','');
		var ipa_url = 'http://' + path.join(host, ipa);
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
	
	this.makePlistURL(host,plist_path);
	var iap_url = this.makeIPAURL(host, this.filePath);
	
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