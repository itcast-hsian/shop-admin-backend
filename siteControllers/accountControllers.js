'use strict'

const md5 = require('md5');
const kits = require('../kits/kits.js');
const multiparty = require('multiparty');
const path = require('path');
const urlobj = require('url');

const SUCCESSCODE = 0;
const ERRORCODE = 1;
let resobj = {};

//1.0 用户登录验证
exports.login = (req,res)=>{
	 resobj = {};
	let uname = req.body.user_name;
	let upwd = md5(req.body.password);
	let sql = `select * from dt_users where user_name='${uname}' and password='${upwd}'`;
	execSqlCallBack(req,res,sql,(err,datas)=>{
		if(err){
			resobj.status = ERRORCODE;
			resobj.message = err.message;
			res.end(JSON.stringify(resobj));
			return;
		}
		if(datas.length==0){
			resobj.status = ERRORCODE;
			resobj.message = '用户名或密码错误';
			res.end(JSON.stringify(resobj));
			return;
		}

		var data = datas[0]; 
		var user = {uid:data.id,uname:data.user_name}
		req.session.site_user = user;
		resobj.status = SUCCESSCODE;
		resobj.message = '登录成功';
		res.end(JSON.stringify(resobj));
	});	
}

// 注册
exports.register = (req,res)=>{
	 resobj = {};
	 let insertSql = `INSERT INTO dt_users
					(					
					 group_id
					 ,user_name
					 ,password
					 ,mobile
					 ,email
					 ,avatar
					 ,nick_name
					 ,sex
					 ,birthday
					 ,telphone
					 ,area
					 ,address
					 ,qq
					 ,amount
					 ,point
					 ,exp
					 ,status
					 ,reg_time
					 ,reg_ip
					)
					VALUES
					(
					  1 -- group_id - INT(10)
					 ,'${req.body.user_name}' -- user_name - VARCHAR(100)
					 ,'${md5(req.body.password)}' -- password - VARCHAR(100)
					 ,'${req.body.mobile}' -- mobile - VARCHAR(20)
					 ,'${req.body.email}' -- email - VARCHAR(50)
					 ,'' -- avatar - VARCHAR(255)
					 ,'' -- nick_name - VARCHAR(100)
					 ,'' -- sex - VARCHAR(20)
					 ,NOW() -- birthday - DATETIME
					 ,'' -- telphone - VARCHAR(50)
					 ,'' -- area - VARCHAR(255)
					 ,'' -- address - VARCHAR(255)
					 ,'' -- qq - VARCHAR(20)
					 ,0 -- amount - DECIMAL(9, 2)
					 ,0 -- point - INT(10)
					 ,0 -- exp - INT(10)
					 ,0 -- status - TINYINT(3)
					 ,NOW() -- reg_time - DATETIME
					 ,'${kits.getClientIP(req)}' -- reg_ip - VARCHAR(20)
					);`;

				execSqlCallBack(req,res,insertSql,(err,data)=>{
					if(err){
							resobj.status = ERRORCODE;
							resobj.message = err.message;
							res.end(JSON.stringify(resobj));
							return;
						}

						resobj.status = SUCCESSCODE;
						resobj.message = '用户注册成功';
						res.end(JSON.stringify(resobj));
				});
}

// 注销
exports.logout = (req,res)=>{
	resobj = {};
	
	if(req.session && req.session.site_user){
		req.session.site_user = null;
	}

	resobj.status = SUCCESSCODE;
	resobj.message = '用户已注销';
	res.end(JSON.stringify(resobj));
}

// 检查用户名是否存在
exports.checkuser = (req,res)=>{
	resobj = {};
	let username = req.params.username;
	let sql =`select user_name from dt_users where user_name='${username}'`;

	execSqlCallBack(req,res,sql,(err,datas)=>{
		if(err){
			resobj.status = ERRORCODE;
			resobj.message = err.message;
			res.end(JSON.stringify(resobj));
			return;
		}

		resobj.status = SUCCESSCODE;
		resobj.message = !(datas.length>0);
		res.end(JSON.stringify(resobj));
	});
}

// 统一执行sql语句
function execSqlCallBack(req,res,sql,callback){
		req.db.driver.execQuery(sql,(err,datas)=>{				
					if(err){
						callback(err);
						return;
					}
					try{
						callback(null,datas);
					}
					catch(e){
								resobj.status = ERRORCODE;
								resobj.message = e.message;
								res.end(JSON.stringify(resobj));
							}
		});
	
};