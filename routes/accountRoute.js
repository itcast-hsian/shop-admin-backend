'use strict'

const express = require('express');

let route = express.Router();

const accountCtrl = require('../controllers/accountController.js');

// 1.0 验证登录
route.post('/account/login', accountCtrl.login);
route.get('/account/vcode', accountCtrl.vcode);

route.get('/account/logout', accountCtrl.logout);

// 用户列表
route.get('/account/getlist', accountCtrl.getList);
 
// 检查是否有登录  
route.get('/account/islogin',(req,res)=>{
	if(req.session && req.session.admin_user){ 
		res.end(JSON.stringify({code:'logined'}));
	}
	else{
		res.end(JSON.stringify({code:'nologin'}));
	}
})

module.exports = route;
