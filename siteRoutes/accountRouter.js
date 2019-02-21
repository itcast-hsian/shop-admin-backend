'use strict'

const express = require('express');
const route = express.Router();

const accountCtrl = require('../siteControllers/accountControllers.js');



// 1 登录
route.post('/account/login',accountCtrl.login);

// 2 注册
route.post('/account/register',accountCtrl.register);

// 3 检查用户名是否存在
route.get('/account/checkuser/:username',accountCtrl.checkuser);

//  注销
route.get('/account/logout',accountCtrl.logout);



// 4检查是否有登录 
route.get('/account/islogin',(req,res)=>{
	if(req.session && req.session.site_user){
		res.end(JSON.stringify({code:'logined'}));
	}
	else{
		res.end(JSON.stringify({code:'nologin'}));
	}
});

module.exports = route;