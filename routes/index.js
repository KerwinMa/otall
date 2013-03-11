/*
 * GET home page.
 */
 
var Project = require('../models/project.js');
var Item = require('../models/item.js');
var settings = require('../settings');
var crypto = require('crypto');
var User = require('../models/user.js');
var path = require('path');

exports.index = function(req, res){
	Project.getAll(function(err,prjs){
		if(err){
			prjs = [];
		}
		
		if(req.session.user==null){
			res.redirect('/login');
			return;
		}
		
		res.render('index',{
			title: '首页',
			user: req.session.user,
			prjs: prjs,
			version: settings.version,
			success : req.flash('success').toString(),
			error : req.flash('error').toString()
		});
	});
};

exports.project = function(req, res){
	if(req.session.user==null){
		res.redirect('/login');
		return;
	}
	
	Project.get(req.params.project, function(err, prj){
		if(!prj){
			req.flash('error', '项目不存在');
			return res.redirect('/');
		}
		
		var groupName = req.body.group;
		var group = null;
		if(groupName!=""){
			group = groupName;
		}

		var	opmode = req.query.opmode;
		if(opmode==null)
			opmode = 'download';
		
		
		
		Item.get(prj.name, group, function(err,items){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('project', { 
				title:prj.name, 
				prj:prj,
				items:items,
				activeGroup: groupName,
				opmode: opmode,
				success : req.flash('success').toString(),
				error : req.flash('error').toString()
			});
		});
	});
};

exports.newPrj = function(req, res){
	if(req.session.user==null){
		res.redirect('/login');
		return;
	}
	
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
	var appids = req.body.appleAppIDs.split(/\r?\n?\s/);
	appids = appids.map(function(x) { return x.replace(/(^\s*)|(\s*$)/g, "");});
	appids = appids.filter(function(x) {return x.length>0;});
	
	var groups = req.body.groups.split(/\r?\n?\s/);
	groups = groups.map(function(x) { return x.replace(/(^\s*)|(\s*$)/g, "");});
	groups = groups.filter(function(x) {return x.length>0;});
	
	if(groups.length==0){
		groups = ['Default'];
	}
	
  	var newPrj = new Project({
  		name: prjname,
  		appleAppIDs: appids,
		groups: groups
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
	if(req.session.user==null){
		res.redirect('/login');
		return;
	}
	
	Project.get(req.params.project, function(err, prj){
		if(!prj){
			req.flash('error', '项目不存在');
			return res.redirect('/');
		}
		
		res.render('upload', { 
			title:prj.name, 
			prj:prj,
			success : req.flash('success').toString(),
			error : req.flash('error').toString()
		});
	});
};

exports.doUpload = function(req, res){
	var fs = require('fs');
	
	var prjname = req.params.project;
	var prjpath = path.join("public","uploads",prjname);
	if(!fs.existsSync(prjpath)){
		fs.mkdir(prjpath);
	}
		
	var file_new_name = req.body.fileNewName.replace(/(^\s*)|(\s*$)/g, "");
	var file_comment = req.body.comment.replace(/(^\s*)|(\s*$)/g, "");
	
	var file_path = req.files.selfile.path;
	var file_name = req.files.selfile.name;
	var file_new_path;
	if(file_new_name.length>0)
		file_new_path = path.join(prjpath, file_new_name);
	else
		file_new_path = path.join(prjpath, file_name);
		
	if(fs.existsSync(file_new_path)){
		if(file_new_path!=file_path){
			fs.unlink(file_path);
			console.log('del '+file_path);
		}
		req.flash('error','错误：'+file_new_path.split(path.sep).reverse()[0]+'已存在!');
		res.redirect('/up/'+prjname);
	 	return;
	}
		
	fs.rename(file_path, file_new_path,  function(err) {
		if(err){
			fs.unlink(file_new_path);
         	fs.rename(file_path, file_new_path);
       	}
	   
	  	console.log("save file to "+file_new_path);
	   
	  	 var group = req.body.group;
	  	 if(group==null)
	  		 group = '';
	 
	  	 if(req.body.appid==null && Item.isIOS(group)){
	 		 fs.unlink(file_new_path);
	 		 console.log('del '+file_new_path);
			 
	  		 req.flash('error','错误：iOS必须选择App ID');
	  		 res.redirect('/up/'+prjname);
	  		 return;
	  	 }
	 	 
	  	 var item = new Item(prjname, file_new_path, "", req.body.group, file_comment, null, '');
	 
	  	 var host = req.host + ':' + settings.appport;
	 
	  	 item.makePlist(host, req.body.appid, function(err){
	  		 if(err){
	  			 console.log('make plist error:'+err);
	  			 req.flash('error',err);
	  			 res.redirect('/up/'+prjname);
	  		 }
	  		 else{
	  			 item.save(function(err){
	  				 if(err){
	  					 req.flash('error',err);
	  				 }
	  				 else{
	  					 req.flash('success','上传成功！');
	  				 }
	  				 res.redirect('/p/'+prjname);
	  			 });
	  		 }
	  	 });
     });//rename
};

exports.configPrj = function(req, res){
	if(req.session.user==null){
		res.redirect('/login');
		return;
	}
	
	Project.get(req.params.project, function(err, prj){
		if(!prj){
			req.flash('error', '项目不存在');
			return res.redirect('/');
		}

		res.render('configPrj', { 
			title:prj.name, 
			prj:prj,
			success : req.flash('success').toString(),
			error : req.flash('error').toString()
		});
	});
};

exports.doConfigPrj = function(req, res){
  var prjname = req.params.project;
  //检查项目是否已经存在
  Project.get(prjname, function(err, prj){
  	if(!prj)
  		err = '项目不存在';
		
  	if(err){
  		req.flash('error',err);
  		return res.redirect('/');
  	}

	var appids = req.body.appleAppIDs.split(/\r?\n?\s/);
	appids = appids.map(function(x) { return x.replace(/(^\s*)|(\s*$)/g, "");});
	appids = appids.filter(function(x) {return x.length>0;});
	
	var groups = req.body.groups.split(/\r?\n?\s/);
	groups = groups.map(function(x) { return x.replace(/(^\s*)|(\s*$)/g, "");});
	groups = groups.filter(function(x) {return x.length>0;});
	
	if(groups.length==0){
		groups = ['Default'];
	}
	
  	var newPrj = new Project({
  		name: prjname,
  		appleAppIDs: appids,
		groups: groups
  	});
	
  	prj.update(newPrj, function(err){
  		if(err){
  			req.flash('error',err);
  			return res.redirect('/p/'+prjname);
  		}
  		req.flash('success','项目更新成功');
  		res.redirect('/p/'+prjname);
  	});
  });
};

exports.deleteItem = function(req, res){
	var fs = require('fs');
	var prjname = req.params.project;
	var filepath = path.join('public','uploads',prjname,req.params.filename);
	
	console.log('try delete file: '+filepath+ ' of project '+prjname);
	
	Item.remove(prjname, filepath, function(err){
		if(err){
			req.flash('error',err);
			console.log('delete err '+err);
		}
		else{
			req.flash('success','删除成功!');
			fs.unlink(filepath);
			if(path.extname(filepath).toLowerCase()=='.ipa'){
				var plistPath = filepath.replace('.ipa','.plist');
				fs.unlink(plistPath);
			}
			console.log('delete ok!');
		}
		
		return res.redirect('/p/'+prjname+'?opmode=delete');
	});
};

exports.editItem = function(req, res){
	if(req.session.user==null){
		res.redirect('/login');
		return;
	}
	
	var prjname = req.params.project;
	var filename = req.params.filename;
	var filepath = path.join('public','uploads',prjname,req.params.filename);
	
	Project.get(prjname, function(err, prj){
		if(!prj){
			req.flash('error', '项目不存在');
			return res.redirect('/');
		}
		
		Item.getOne(prjname, filepath, function(err,item){
			if(err){
				req.flash('error: can not find item',err);
			}
			else{
				res.render('editItem', { 
					title:"编辑 - "+filename, 
					prj:prj,
					item:item,
					fname:filename,
					success : req.flash('success').toString(),
					error : req.flash('error').toString()
				});
			}
		});
	});	
};

exports.doEditItem = function(req,res){
	var prjname = req.params.project;
	var filepath = path.join('public','uploads',prjname,req.params.filename);
	var newGroup = req.body.group;
	var newComment = req.body.comment;
	
	Item.getOne(prjname, filepath, function(err,item){
		if(err){
			req.flash('error: can not find item',err);
		}
		else{
			
	    	item.update(prjname, filepath, newGroup, newComment, function(err){
	    		if(err){
	    			req.flash('error',err);
	    			return res.redirect('/p/'+prjname+'?opmode=edit');
	    		}
	    		req.flash('success','信息编辑成功');
	    		res.redirect('/p/'+prjname+'?opmode=edit');
	    	});
		}
	});
};

function do_login(req, res, username, password, bSaveCookie){
	User.get(username, function(err, user) {
		if (!user) {
			req.flash('error', '用户不存在');
			return res.redirect('/');
		}
		if (user.password != password) {
			req.flash('error', '密码错误');
			return res.redirect('/');
		}
		req.session.user = user;
		req.flash('success', '登录成功');
		if(bSaveCookie){
			res.cookie('user', req.body.username, { signed:false, maxAge : 60*60*24*7});
			res.cookie('ticket', password, { signed:false, maxAge : 60*60*24*7});
		}
		res.redirect('/');
	});
};

exports.login = function(req, res) {
	var usr = req.cookies['user'];
	var pwd = req.cookies['ticket'];
	if(usr != undefined && pwd != undefined){
		console.log('login use cookie!');
		do_login(req, res, usr, pwd, false);
	}
	else
	{
		res.render('login', {
			title: '用户登录',
			user : req.session.user,
			success : req.flash('success').toString(),
			error : req.flash('error').toString()
	    });
		
	}
};

exports.doLogin = function(req, res){
	
    var md5 = crypto.createHash('md5');
    var password = md5.update(req.body.pwd).digest('base64'); 
	
	do_login(req, res, req.body.username, password, true);
};

exports.logout = function(req, res) {
	res.clearCookie('user');
	res.clearCookie('ticket');
	req.session.user = null;
	res.redirect('/');
};

exports.reg = function(req, res) {
	res.render('reg', {
		title: '用户注册',
		success : req.flash('success').toString(),
		error : req.flash('error').toString()
    });
};

exports.doReg = function(req, res) {
	//检查用户名规则
	var user_name = req.body.username;
	if(user_name.length>10 || user_name.length<3)
	{
		req.flash('error', '用户名必须为3到11位');
		return res.redirect('/reg');
	}
	
	//检查密码
    if (req.body['pwd2'] != req.body['pwd']) {
		req.flash('error', '两次输入的密码不一致');
		return res.redirect('/reg');
    }
  
    //生成md5的密码
    var md5 = crypto.createHash('md5');
    var password = md5.update(req.body.pwd).digest('base64');
    
    var newUser = new User({
		name: req.body.username,
		password: password,
    });
    
    //检查用户名是否已经存在
	User.get(newUser.name, function(err, user) {
		if (user)
			err = '用户已存在！';
		if (err) {
			req.flash('error', err);
			return res.redirect('/reg');
		}
		//如果不存在則新增用戶
		newUser.save(function(err) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/reg');
			}
			req.session.user = newUser;
			req.flash('success', '注册成功');
			res.redirect('/');
		});
	});
};
