var mongodb = require('./db');

function Project(prj) {
	this.name = prj.name;
	this.appleAppIDs = prj.appleAppIDs;
};

module.exports = Project;

Project.prototype.save = function save(callback) {
	var prj = {
		name: this.name,
		appleAppIDs: this.appleAppIDs,
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