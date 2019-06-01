'use strict'

const express = require('express');

let app = express();
let phyPath = __dirname + '/upload/';
app.use(express.static(phyPath));

//1.0 初始化orm
const orm = require('orm');
app.use(orm.express('mysql://root:root@127.0.0.1:3306/newshop',{
	define:function(db,models,next){
  
		next();
	}
}));
  /*
  devadmin2:"http://localhost:5008",
 		devsite2:"http://localhost:5009",
	    devadmin3:"http://localhost:7070",
	    devsite3:"http://localhost:7071",
 		devadmin1:"http://127.0.0.1:5008",
 		devsite1:"http://127.0.0.1:5009",
	    devadmin:"http://127.0.0.1:7070",
	    devsite:"http://127.0.0.1:7071",
   */ 

 var domains={
 		local:'http://localhost',
 		loc127:'http://127.0.0.1',
	    dist:"http://157.122.54.189:9092",
	    dist1:"http://192.168.50.2:9092",
	    dist2:"http://172.16.2.23:9092"
	};
	

  app.all('*',(req,res,next)=>{
	//设置允许跨域响应报文头
	//设置跨域
	// console.log('host=',req.headers.origin ); //req.headers.origin获取请求源域名
	var currentdomain="http://localhost";
	for(let key in domains){
		if(!req.headers.origin){
			break;
		}
		if(req.headers.origin.indexOf(domains[key])>-1){
			currentdomain = req.headers.origin;
			console.log(currentdomain); 
			break;
		}
	}

	res.header("Access-Control-Allow-Origin", currentdomain);//设置管理后台服务器路径http://127.0.0.1:5008
	res.header("Access-Control-Allow-Headers", "X-Requested-With, accept,OPTIONS, content-type");
	// res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header("Access-Control-Allow-Methods","*");
	// 需要让ajax请求携带cookie ,此处设置为true，那么Access-Control-Allow-Origin 
	// 不能设置为*，所以设置为请求者所在的域名
	res.header("Access-Control-Allow-Credentials", "true");

	//  如果当前请求时OPTIONS 则不进去真正的业务逻辑方法，防止执行多次而产生 
	if(req.method!="OPTIONS"){
		res.setHeader('Content-Type','application/json;charset=utf-8');
		   next();
	   }else{
		  res.end('');
	   }
});
  /*
//2.0 将所有api的请求响应content-type设置为application/json
app.all('/admin/*',(req,res,next)=>{
	//设置允许跨域响应报文头
	//设置跨域
	
	res.header("Access-Control-Allow-Origin", "http://127.0.0.1:5008");//设置管理后台服务器路径http://127.0.0.1:5008
	res.header("Access-Control-Allow-Headers", "X-Requested-With, accept,OPTIONS, content-type");
	// res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header("Access-Control-Allow-Methods","*");
	// 需要让ajax请求携带cookie ,此处设置为true，那么Access-Control-Allow-Origin 
	// 不能设置为*，所以设置为请求者所在的域名
	res.header("Access-Control-Allow-Credentials", "true");

	res.setHeader('Content-Type','application/json;charset=utf-8');
	next();
});

// 负责处理前台页面数据
app.all('/site/*',(req,res,next)=>{
	//设置允许跨域响应报文头
	//设置跨域
	console.log('host=',req.host);
	res.header("Access-Control-Allow-Origin", "http://127.0.0.1:5009");//设置前台系统服务器路径http://127.0.0.1:5009
	res.header("Access-Control-Allow-Headers", "X-Requested-With, accept,OPTIONS, content-type");
	// res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header("Access-Control-Allow-Methods","*");
	// 需要让ajax请求携带cookie ,此处设置为true，那么Access-Control-Allow-Origin 
	// 不能设置为*，所以设置为请求者所在的域名
	res.header("Access-Control-Allow-Credentials", "true");

	res.setHeader('Content-Type','application/json;charset=utf-8');
	next();
});
*/
// 自动解析请求报文
var bodyParser = require('body-parser');
// parse application/x-www-form-urlencoded 
// app.use(bodyParser.urlencoded({ extended: false })); 
app.use(bodyParser());

// 设置session (后台管理页面专用)
const  session = require('express-session');
app.use(session({
  secret: 'vuermsadmin',  //加密的秘钥，可以随便写
  resave: false,
  saveUninitialized: true,
  cookie:{ path: '/admin/'} //ajax请求/admin/下面的路径才带cookie到服务器
  //cookie: { secure: true } // 表示当浏览器第一次请求这个网站的时候，就会向浏览器写一个身份标识到它的cookie中
}));

// 设置session（前台用户登录管理专用）
const  session1 = require('express-session');
app.use(session({
  secret: 'vuermssite',  //加密的秘钥，可以随便写
  resave: false,
  saveUninitialized: true,
  cookie:{ path: '/site/'} //ajax请求/site/下面的路径才带cookie到服务器
  //cookie: { secure: true } // 表示当浏览器第一次请求这个网站的时候，就会向浏览器写一个身份标识到它的cookie中
}));

//在admin这个区域下的所有路由规则中加入一个是否登录了的判断
//统一的登录判断
let NOLOGIN = 2;
let resobj={};
// app.all('/admin/*',(req,res,next)=>{
// 	// 包含有/admin/account/的请求跳过登录检查
// 	if(req.url.indexOf('/admin/account/')>-1){
// 		next();
// 		return;
// 	}
// 	if(req.session.admin_user == null)
// 	{
// 		resobj.status = NOLOGIN;
// 		resobj.message = '请先登录';
// 		res.end(JSON.stringify(resobj));
// 		return;
// 	}
// 	next();
// });

//2.0 设置管理后台路由规则
const accountRoute = require('./routes/accountRoute.js');
const artRoute = require('./routes/articleRoute.js');
const categoryRoute = require('./routes/categoryRoute.js');
const goodsRoute = require('./routes/goodsRoute.js');
const orderRoute = require('./routes/orderRoute.js');
// const apiRoute = require('./routes/apiRoute.js');
app.use('/admin',accountRoute);
app.use('/admin',artRoute);
app.use('/admin',categoryRoute);
app.use('/admin',goodsRoute);
app.use('/admin',orderRoute);

// app.use('/',apiRoute);

//3.0 设置系统前台路由规则
const siteArticleRoute = require('./siteRoutes/articleRouter.js');
const sitegoodsRoute = require('./siteRoutes/goodsRouter.js');
app.use('/site',siteArticleRoute);
app.use('/site',sitegoodsRoute);

// validate开头的请求均需要登录
const validatecommentroute = require('./siteRoutes/validateCommentRoute.js');
const validateorderrouter = require('./siteRoutes/validateOrderRoute.js');
const accountRouter = require('./siteRoutes/accountRouter.js');
app.use('/site',validatecommentroute);
app.use('/site',validateorderrouter);
app.use('/site',accountRouter);


// app路由
const appartroute = require('./appRoutes/appArtRoute.js');
app.use('/site',appartroute);

app.listen(8899,()=>{

	console.log('api服务已启动, :8899');
});