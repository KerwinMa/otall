var mongodb = require('./db');

function Project(doc) {
	this.name = doc.name;
	this.appleAppIDs = doc.appleAppIDs;
	this.groups = doc.groups;
};

module.exports = Project;

Project.prototype.save = function save(callback) {
	var prj = {
		name: this.name,
		appleAppIDs: this.appleAppIDs,
		groups: this.groups,
	};
	
	mongodb.open(function(err, db) {
		if (err) {
		  return callback(err);
		}

		//获取prjects集合
		db.collection('projects', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}

			//为name属性添加索引
			collection.ensureIndex('name', {unique: true});

			//save
			collection.insert(prj, {safe: true}, function(err, user) {
				mongodb.close();
				callback(err, prj);
			});
		});
	});
};

Project.prototype.update = function update(prj, callback) {	
	mongodb.open(function(err, db) {
		if (err) {
		  return callback(err);
		}

		//获取prjects集合
		db.collection('projects', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}

			//update
			collection.update({name:prj.name}, {$set:{"appleAppIDs":prj.appleAppIDs, "groups":prj.groups}}, function(err) {
				mongodb.close();
				callback(err);
			});
		});
	});
};

//
Project.get = function get(projectName, callback) {
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}

		db.collection('projects', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			
			//find
			collection.findOne({name: projectName}, function(err, doc) {
				mongodb.close();
				if (doc) {
					var prj = new Project(doc);
					callback(err, prj);
				} else {
					callback(err, null);
				}
			});
		});
	});
};

Project.getAll = function getAll(callback){
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
	
		db.collection('projects', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
		
			collection.find().sort({time:-1}).toArray(function(err,docs){
				mongodb.close();
				if(err){
					callback(err, null);
				}
			
				var prjs = [];
				docs.forEach(function(doc,index){
					var prj = new Project(doc);
					prjs.push(prj);
				});
			
				callback(null, prjs);
			});
		});	
	});
};
