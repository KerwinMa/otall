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
			prjs: prjs,
			success : req.flash('success').toString(),
			error : req.flash('error').toString()
		});
	});
};

exports.project = function(req, res){
	Project.get(req.params.project, function(err, prj){
		if(!prj){
			req.flash('error', '项目不存在');
			return res.redirect('/');
		}
		res.render('project', { 
			title:prj.name, 
			prj:prj,
			success : req.flash('success').toString(),
			error : req.flash('error').toString()
		});
	});
};

exports.newPrj = function(req, res){
	res.render('newPrj', { 
		title:'新项目',
		success : req.flash('success').toString(),
		error : req.flash('error').toString()
	});
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
	//解析appid
	var appids = req.body.appleAppIDs.split(',')
	appids = appids.map(function(x) { return x.replace(/(^\s*)|(\s*$)/g, "");});
	appids = appids.filter(function(x) {return x.length>0;});
	
  	var newPrj = new Project({
  		name: req.body.prjname,
  		appleAppIDs: appids
  	});
  	newPrj.save(function(err){
  		if(err){
  			req.flash('error',err);
  			return res.redirect('/newPrj');
  		}
  		req.flash('success','项目创建成功');
  		res.redirect('/');
  	});
  });
};

exports.upload = function(req, res){
	res.render('upload', {
		title:'上传',
		success : req.flash('success').toString(),
		error : req.flash('error').toString()
	});
};