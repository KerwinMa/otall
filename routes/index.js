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
	else if(prjname.length==0)
	    err = '项目名称不能为空';
		
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
  		name: prjname,
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
	var fs = require('fs');
	var path = require('path');
	
	var prjname = req.params.project;
	var prjpath = path.join("./public/uploads/",prjname);
	fs.exists(prjpath, function (exists) {
		if(!exists){
			fs.mkdir(prjpath);
		}
	});
	
	var file_new_name = req.body.fileNewName.replace(/(^\s*)|(\s*$)/g, "");
	var file_comment = req.body.comment.replace(/(^\s*)|(\s*$)/g, "");
	
	var file_path = req.files.selfile.path;
	var file_name = req.files.selfile.name;
	var file_new_path;
	if(file_new_name.length>0)
		file_new_path = path.join(prjpath, file_new_name);
	else
		file_new_path = path.join(prjpath, file_name);
		
	fs.rename(file_path, file_new_path,  function(err) {
       if(err){
         fs.unlink(file_new_path);
         fs.rename(file_path, file_new_path);
       }
	   console.log("save file to "+file_new_path);
     });
	 
	res.redirect('/');
};