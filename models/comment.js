var mogongdb = require('./db');

function Comment(name, day, title, comment) {
	this.name = name;
	this.day = day;
	this.title = title;
	this.comment = comment;
}

module.exports = Comment;

//存储一条留言信息
Comment.prototype.save = function(callback) {
	var name = this.name,day = this.day,title = this.title,comment = this.comment;

	//open db
	mogongdb.open(function(err, db){
		if (err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection){
			if (err) {
				mogongdb.close();
				return callback(err);
			};
			//通过用户名时间标题等查找文档并把留言对象添加到文档的comments数组里
			collection.update({
				"name": name,
				"time.day": day,
				title: title
			},{
				$push: {"comments":comment}
				
			},function (err){
					mogongdb.close();
					if (err) {return callback(err)};
					callback(null);
				})
		});
	});
};