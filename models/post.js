var mongodb = require('./db'),
    markdown = require('markdown').markdown;

function Post (name, head, title, tags, post) {
	this.name = name;
  this.head = head;
  this.title = title;
  this.tags = tags;
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
      head: this.head,
  		time: time,
  		title: this.title,
      tags: this.tags,
  		post: this.post,
      comments:[],
      p: 0
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
  			});
  		});
  	});
}

//一次获取十篇文章
Post.getTen = function(name, page, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      var query = {};
      if (name) {
        query.name = name;
      }
      //使用 count 返回特定查询的文档数 total
      collection.count(query, function (err, total) {
        //根据 query 对象查询，并跳过前 (page-1)*3 个结果，返回之后的 3 个结果
        collection.find(query, {
          skip: (page - 1)*3,
          limit: 3
        }).sort({
          time: -1
        }).toArray(function (err, docs) {
          mongodb.close();
          if (err) {
            return callback(err);
          }
          //解析 markdown 为 html
          docs.forEach(function (doc) {
            doc.post = markdown.toHTML(doc.post);
          });  
          callback(null, docs, total);
        });
      });
    });
  });
};

//获取一篇文章
Post.getOne = function(name, day, title, callback) {
  //打开数据库
  mongodb.open(function(err, db) {

    if (err) {
      return callback(err);
    }
    //读取posts集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      collection.findOne({
        "name": name,
        "time.day": day,
        "title": title
      }, function (err, doc) {
        
        if (err) {
          mongodb.close();
          return callback(err);
        }
        //解析markdown为html
        if (doc) {
          //每访问 1 次，pv 值增加 1
          collection.update({
            "name": name,
            "time.day": day,
            "title": title
          }, {
            $inc: {"pv": 1}
          }, function (err) {
            mongodb.close();
            if (err) {
              return callback(err);
            }
          });
          doc.post = markdown.toHTML(doc.post);
          doc.comments.forEach(function (comment) {
            comment.content = markdown.toHTML(comment.content);
          });
        }
        
        callback(null, doc); //返回查询到的文章
      });
    });
  });
};

Post.edit = function (name, day, title, callback) {
  //open database
  mongodb.open(function(err, db) {

    if (err) {
      return callback(err);
    }
    //读取post集合
    db.collection('posts', function(err, collection){
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //根据条件进行查询
      collection.findOne({
        name:name,
        "time.day": day,
        title:title
      }, function(err, doc) {
        mongodb.close();

        if (err) {
          return callback(err);
        }

        callback(null,doc); //返回查询的一篇文章（markdown 格式）
      });
    });
  });
};

//更新文章
Post.update = function (name, day, title, post, callback) {
  mongodb.open(function (err, db) {

    if (err) {
      return callback(err);
    }

    db.collection('posts', function(err, collection){
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //更新文章内容
      collection.update({
        name: name,
        "time.day":day,
        title: title
      },{
        $set: {post: post}
      },function (err){
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null);
      })
    })
  });
}

//删除文章
Post.remove = function (name, day, title, callback) {
  mongodb.open(function(err, db){
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection){
      if (err) {
        mongodb.close();
        return callback(err);
      }
      collection.remove({
        name: name,
        "time.day":day,
        title: title
      },{w: 1},function(err){
        mongodb.close();
        if(err) {return callback(err)}
          callback(null);
      });
    });
  });
};

//增加存档功能
Post.getArchive = function (callback) {
  //open db
  mongodb.open(function(err, db){
    if(err) return callback(err);
    db.collection('posts', function(err, collection){
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //返回只包含nam、time、title属性的文档组成的存档数组
      collection.find({},{
        name: 1,
        time: 1,
        title: 1
      }).sort({
        time: -1
      }).toArray(function(err, docs){
        mongodb.close();
        if(err) return callback(err);
        callback(null, docs);
      })
    })
  })
}

//返回所有标签
Post.getTags = function(callback) {
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //distinct 用来找出给定键的所有不同值
      collection.distinct("tags", function (err, docs) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null, docs);
      });
    });
  });
};

//返回含有特定标签的所有文章
Post.getTag = function(tag, callback) {
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //查询所有 tags 数组内包含 tag 的文档
      //并返回只含有 name、time、title 组成的数组
      collection.find({
        "tags": tag
      }, {
        "name": 1,
        "time": 1,
        "title": 1
      }).sort({
        time: -1
      }).toArray(function (err, docs) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null, docs);
      });
    });
  });
};

//返回通过标题关键字查询的所有文章信息
Post.search = function(keyword, callback) {
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      var pattern = new RegExp("^.*" + keyword + ".*$", "i");
      collection.find({
        "title": pattern
      }, {
        "name": 1,
        "time": 1,
        "title": 1
      }).sort({
        time: -1
      }).toArray(function (err, docs) {
        mongodb.close();
        if (err) {
         return callback(err);
        }
        callback(null, docs);
      });
    });
  });
};