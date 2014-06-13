
/*
 * Router page.
 */
var crypto 	= require('crypto'),
	fs = require('fs'),
	User 	= require('../models/user'),
	Post 	= require('../models/post.js'),
	Comment = require('../models/comment.js');

var passport = require('passport');

module.exports = function (app) {

	app.get('/', function(req, res) {
		//判断是否为第一页，并把请求的页数转为number类型
		var page = req.query.p ? parseInt(req.query.p) : 1;
		//查询并返回地page页的3篇文章
		Post.getTen(null, page, function (err, posts, total) {
			console.log(total);
			if(err) posts = [];

			res.render('index', {
			  	title: 		'主页',
			  	user: 		req.session.user,
			  	page: 		page,
			  	isFirstPage: (page - 1) == 0,
			  	isLastPage: ((page - 1)*3) + posts.length == total,
			  	posts: 		posts,
			  	success: 	req.flash('success').toString(),
			  	error: 		req.flash('error').toString()
		  	});
		});
	  
	});

	app.get('/reg', checkNotLogin);
	app.get('/reg', function (req, res) {
		res.render('reg', { 
			title: 		'注册',
			user: 		req.session.user,
			success: 	req.flash('success').toString(),
			error: 		req.flash('error').toString()
		});
	});

	app.post('/reg', checkNotLogin);
	app.post('/reg', function (req, res) {

		var name 		= req.body.name,
			password 	= req.body.password,
			password_re	= req.body['password-repeat'];

		//检验密码是否一致
		if (password != password_re) {
			req.flash('error','两次密码输入不一致');
			return res.redirect('/reg'); //返回注册页
		}

		//加密
		var md5 		= crypto.createHash('md5'),
			password 	= md5.update(req.body.password).digest('hex');

		var newUser = new User({
			name: name,
			password: password,
			email: req.body.email
		});
		
		//检查用户名是否存在
		User.get(newUser.name, function (err, user) {
			if (user) {
				req.flash('error','用户已存在');
				return res.redirect('/reg');
			}
			
			//不存在就新增
			newUser.save(function (err, user) {
				if (err) {
					req.flash('error',err);
					return res.redirect('/reg');
				};
				req.session.user = user; //信息存入session
				req.flash('success','注册成功！');
				res.redirect('/'); //注册成功返回首页
			})
		})


	});

	app.get('/login', function (req, res) {
		res.render('login', { 
			title: '登录',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.get("/login/github", passport.authenticate("github", {session: false}));
	app.get("/login/github/callback", passport.authenticate("github", {
	  session: false,
	  failureRedirect: '/login',
	  successFlash: '登陆成功！'
	}), function (req, res) {
	  req.session.user = {name: req.user.username, head: "https://gravatar.com/avatar/" + req.user._json.gravatar_id + "?s=48"};
	  res.redirect('/');
	});

	app.post('/login', function (req, res) {
		//生成密码的md5
		var md5 = crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');
		//检查用户是否存在
		User.get(req.body.name, function (err, user) {
			if (!user) {
				req.flash('error','用户不存在');
				return res.redirect('/login');
			}

			//检查密码是否一致
			if (user.password != password) {
				req.flash('error', '密码错误');
				return res.redirect('/login'); //密码错误
			}

			//都匹配
			req.session.user = user;
			req.flash('success','登录成功');
			res.redirect('/'); //成功后跳到首页
		})

	});

	//发表文章
	app.get('post', checkLogin);

	app.get('/post', function (req, res) {
		res.render('post', { 
			title: '发表' ,
			user: req.session.user,
  		success: req.flash('success').toString(),
  		error: req.flash('error').toString()
			
		});
	});

	app.post('post',checkLogin);
	app.post('/post', function (req, res) {

		var currentUser = req.session.user,
    tags = [req.body.tag1, req.body.tag2, req.body.tag3],
    post = new Post(currentUser.name, currentUser.head, req.body.title, tags, req.body.post);

	  	post.save(function (err) {
		    if (err) {
		      req.flash('error', err); 
		      return res.redirect('/');
		    }
		    req.flash('success', '发布成功!');
		    res.redirect('/');//发表成功跳到主页
		  });

	});

	app.get('post',checkLogin);
	app.get('/logout', function (req, res) {
		req.session.user = null;
		req.flash('success','退出成功');
		res.redirect('/');

	});

	//上传文件
	app.get('upload',checkLogin);
	app.get('/upload', function (req, res) {
		res.render('upload',{
			title:'文件上传',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
	
	app.post('/upload', checkLogin);
	app.post('/upload', function (req, res) {
		for (var i in req.files) {
			if (req.files[i].size == 0) {
				//使用同步方式删除文件
				fs.unlinkSync(req.files[i].path);
				console.log('成功删除空文件');
			} else {
				var target_path = './public/images/' + req.files[i].name;
				//使用同步方式重命名一个文件
				fs.renameSync(req.files[i].path, target_path);
				console.log('成功重命名文件！');
			}
		}
		req.flash('success', '文件上传成功！');
		res.redirect('/upload');
	});

	app.get('/archive', function (req, res) {

	  Post.getArchive(function (err, posts) {
	    if (err) {
	      req.flash('error', err); 
	      return res.redirect('/');
	    }
	    res.render('archive', {
	      title: '存档',
	      posts: posts,
	      user: req.session.user,
	      success: req.flash('success').toString(),
	      error: req.flash('error').toString()
	    });
	  });
	});

	app.get('/tags', function (req, res) {
	  Post.getTags(function (err, posts) {
	    if (err) {
	      req.flash('error', err); 
	      return res.redirect('/');
	    }
	    res.render('tags', {
	      title: '标签',
	      posts: posts,
	      user: req.session.user,
	      success: req.flash('success').toString(),
	      error: req.flash('error').toString()
	    });
	  });
	});

	app.get('/tags/:tag', function (req, res) {
	  Post.getTag(req.params.tag, function (err, posts) {
	    if (err) {
	      req.flash('error',err); 
	      return res.redirect('/');
	    }
	    res.render('tag', {
	      title: 'TAG:' + req.params.tag,
	      posts: posts,
	      user: req.session.user,
	      success: req.flash('success').toString(),
	      error: req.flash('error').toString()
	    });
	  });
	});

	app.get('/links', function (req, res) {
	  res.render('links', {
	    title: '友情链接',
	    user: req.session.user,
	    success: req.flash('success').toString(),
	    error: req.flash('error').toString()
	  });
	});
	//全文搜索
	app.get('/search', function (req, res) {
	  Post.search(req.query.keyword, function (err, posts) {
	    if (err) {
	      req.flash('error', err); 
	      return res.redirect('/');
	    }
	    res.render('search', {
	      title: "SEARCH:" + req.query.keyword,
	      posts: posts,
	      user: req.session.user,
	      success: req.flash('success').toString(),
	      error: req.flash('error').toString()
	    });
	  });
	});

	//获取用户个人信息
	app.get('/u/:name', function (req, res) {
		var page = req.query.p ? parseInt(req.query.p) : 1;
		//检查用户是否存在
		User.get(req.params.name, function (err, user) {
			if(!user) {
				req.flash('error', '用户不存在!');
				return res.redirect('/'); 
			}

			//查询并返回该用户的所有文章
			Post.getTen(user.name, page, function(err, posts, total){
				if (err) {
					req.flash('error',err);
					return res.redirect('/');
				}
				res.render('user', {
					title: user.name,
					posts: posts,
					page: page,
        	isFirstPage: (page - 1) == 0,
        	isLastPage: ((page - 1) * 3 + posts.length) == total,
					user: req.session.user,
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
			});
		});
	});

	app.get('/u/:name/:day/:title', function(req, res) {
		Post.getOne(req.params.name, req.params.day, req.params.title,function(err, post) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('article', {
				title: req.params.title,
				post: post,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});
	//添加评论
	app.post('/u/:name/:day/:title', function (req, res) {
	  var date = new Date(),
	      time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + 
	             date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
	             
	  var md5 = crypto.createHash('md5'),
    		email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
    		head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48"; 

		var comment = {
			    name: req.body.name,
			    head: head,
			    email: req.body.email,
			    website: req.body.website,
			    time: time,
			    content: req.body.content
				};
	  var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);

	  newComment.save(function (err) {

	    if (err) {
	      req.flash('error', err); 
	      return res.redirect('back');
	    }

	    req.flash('success', '留言成功!');
	    res.redirect('back');
	  });
	});

	//编辑文章
	app.get('/edit/:name/:day/:title', checkLogin);
	app.get('/edit/:name/:day/:title', function(req, res) {
		var currentUser = req.session.user;
		Post.edit(currentUser.name, req.params.day, req.params.title, function(err, post) {
			if (err) {
				req.flash('error',err);
				return res.redirect('back');
			}

			res.render('edit', {
				title: '编辑文章',
				post: post,
				user: req.session.user,
				success:req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
		
	});

	app.post('/edit/:name/:day/:title',checkLogin);
	app.post('/edit/:name/:day/:title', function(req, res){
		var currentUser = req.session.user;

		Post.update(currentUser.name,req.params.day, req.params.title, req.body['post'], function (err){

			var url = '/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title;

			if(err) {
				req.flash('error',err);
				res.redirect(url); 
			}

			req.flash('success','修改成功');
			res.redirect(url); 
		})
	})

	//删除文章
	app.get('/remove/:name/:day/:title',checkLogin);
	app.get('/remove/:name/:day/:title',function(req, res){
		var currentUser = req.session.user;
		Post.remove(currentUser.name, req.params.day, req.params.title, function(err){
			if(err){
				req.flash('error',err);
				return res.redirect('back');
			}
			req.flash('success', '删除成功!');
    	res.redirect('/');
		});
	});

	//转载文章
	app.get('/reprint/:name/:day/:title', checkLogin);
	app.get('/reprint/:name/:day/:title', function (req, res) {
	  Post.edit(req.params.name, req.params.day, req.params.title, function (err, post) {
	    if (err) {
	      req.flash('error', err); 
	      return res.redirect(back);
	    }
	    var currentUser = req.session.user,
	        reprint_from = {name: post.name, day: post.time.day, title: post.title},
	        reprint_to = {name: currentUser.name, head: currentUser.head};
	    Post.reprint(reprint_from, reprint_to, function (err, post) {
	      if (err) {
	        req.flash('error', err); 
	        return res.redirect('back');
	      }
	      req.flash('success', '转载成功!');
	      var url = '/u/' + post.name + '/' + post.time.day + '/' + post.title;
	      //跳转到转载后的文章页面
	      res.redirect(url);
	    });
	  });
	});

	app.use(function (req, res) {
  	res.render("404");
	});

	function checkLogin (req, res, next) {
		if (!req.session.user) {
			req.flash('error', '未登录');
			res.redirect('/login');
		}
		next();
	}

	function checkNotLogin (req, res, next) {
		if (req.session.user) {
			req.flash('error', '已登录');
			res.redirect('back');
		};
		next();
	}
}