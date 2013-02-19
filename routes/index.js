/*
 * GET home page.
 */
 
var Project = require('../models/project.js');

exports.index = function(req, res){
	Project.getAll(function(err,prjs){
		if(err){
			prjs = [];
		}
		
		res.render('index',{
			title: '首页',
			prjs: prjs
		});
	});
};

exports.project = function(req, res){
  res.render('project', { title:'项目' });
};

exports.newPrj = function(req, res){
  res.render('newPrj', { title:'新项目' });
};

exports.doNewPrj = function(req, res){
  var prjname = req.body.prjname;
  
  //检查项目是否已经存在
  Project.get(prjname, function(err, prj){
  	if(prj)
  		err = '项目已存在';
  	if(err){
  		req.flash('error',err);
  		return res.redirect('/newPrj');
  	}
  	//如果不存在则新增项目
  	var newPrj = new Project({
  		name: req.body.prjname,
  		appleAppIDs: req.body.appleAppIDs
  	});
  	newPrj.save(function(err){
  		if(err){
  			req.flash('error',err);
  			return res.redirect('/newPrj');
  		}
  		req.session.prj = newPrj;
  		req.flash('success','项目创建成功');
  		res.redirect('/');
  	});
  });
};

exports.upload = function(req, res){
  res.render('upload', { title:'上传' });
};