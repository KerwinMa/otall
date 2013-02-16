
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Home' });
};

exports.project = function(req, res){
  res.render('project', { title:'项目' });
};

exports.newPrj = function(req, res){
  res.render('newPrj', { title:'新项目' });
};

exports.doNewPrj = function(req, res){

};

exports.upload = function(req, res){
  res.render('upload', { title:'上传' });
};