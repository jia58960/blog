var mongodb = require('./db');

function User (user) {
	this.name = user.name;
	this.password = user.password;
	this.email = user.email;
}

module.exports = User;

User.prototype.save = function (callback) {
	//要存入数据库的用户文档
	var user = {
		name:this.name,
		password:this.password,
		email:this.email
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