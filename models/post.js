var mongodb = require('./db');

function Post (name, title, post) {
	this.name = name;
	this.title = title;
	this.post = post;
}

module.exports = Post;

Post.prototype.save = function (callback) {
	var date = new Date();

	//存储各种时间格式，后用
	var time = {
  		date: date,
      	year : date.getFullYear(),
      	month : date.getFullYear() + "-" + (date.getMonth() + 1),
      	day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
      	minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + 
      		date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) 
  	}

  	//要存入的文档数据
  	var post = {
  		name: this.name,
  		time: time,
  		title: this.title,
  		post: this.post
  	}

  	//打开数据库
  	mongodb.open( function (err, db) {
  		if (err) {
  			return callback(err);
  		}

  		db.collection('posts', function (err, collection) {
  			if (err) {
  				mongodb.close();
  				return callback(err);
  			}

  			collection.insert(post, {safe:true}, function (err){
				mongodb.close();
				if (err) {
					return callback(err); //失败
				}
				callback(null); //成功的话返回err为null
  			})
  		})
  	})
}
