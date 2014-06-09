var mongodb = require('./db'),
	crypto = require('crypto');

function User (user) {
	this.name = user.name;
	this.password = user.password;
	this.email = user.email;
}

module.exports = User;

User.prototype.save = function (callback) {
	var md5 = crypto.createHash('md5'),
    email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
    head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";
	//要存入数据库的用户信息文档
	var user = {
	    name: this.name,
	    password: this.password,
	    email: this.email,
	    head: head
	};

	//打开数据库
	mongodb.open( function (err, db) {
		if (err) {
			return callback(err);
		}
		//读取users集合
		db.collection('users', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}

			//将用户数据插入users集合
			collection.insert(user, {
				safe:true
			},function (err,user) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null, user[0]); //成功，err为空，并返回存储后的用户文档
			});
		})
	});
}

//读取用户信息
User.get = function (name, callback) {
	//open db
	mongodb.open( function (err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('users', function (err, collection) {

			if (err) { 
				mongodb.close();
				return callback(err);
			}

			//查找用户文档信息
			collection.findOne({
				name:name
			},function (err,user) {
				console.log(name);
				console.log(user);
				mongodb.close();

				if (err) {
					return callback(err);
				}

				callback(null, user); //成功的话返回查找到的用户信息
			})
		})
	}) 
}