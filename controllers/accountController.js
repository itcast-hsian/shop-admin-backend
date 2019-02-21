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
	let uname = req.body.uname;
	let upwd = md5(req.body.upwd);
	
	let sql = `select * from dt_manager where user_name='${uname}' and password='${upwd}'`;
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
		var user = {uid:data.id,uname:data.user_name,realname:data.real_name}
		req.session.admin_user = user;
		console.log(req.session.admin_user);
		resobj.status = SUCCESSCODE;
		resobj.message =user;
		res.end(JSON.stringify(resobj));
	});	
}

// 注销
exports.logout = (req,res)=>{
	resobj = {};
	
	if(req.session && req.session.admin_user){
		req.session.admin_user = null;
	}

	resobj.status = SUCCESSCODE;
	resobj.message = '用户已注销';
	res.end(JSON.stringify(resobj));
}

exports.vcode = (req,res)=>{
	let resobj =req.session.admin_user;	
	console.log(resobj);
	res.end(JSON.stringify(resobj));
}

// 用户列表 
exports.getList = (req, res) => {
	resobj = {}; //重置对象
	let searchValue = req.query.searchvalue;
	let sqlCount = `select count(1) as count from dt_users`;

	//执行分页数据处理
	execQueryCount(req,res,sqlCount,(pageobj)=>{
		let sql =`select * from dt_users`;
		if(searchValue){
			sql += ` where user_name like '%${searchValue}%' `;
		}
		sql+= ` order by id desc limit ${pageobj.skipCount},${pageobj.pageSize}`;

		execQuery(req,res,sql);
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

//辅助方法获取分页总条数
function execQueryCount(req,res,sql,callback){
	let pageIndex = 1;
	let pageSize = 10;

	if(req.query.pageIndex){
		pageIndex = parseInt(req.query.pageIndex);
	}
	if(req.query.pageSize){
		pageSize = parseInt(req.query.pageSize);
	}

	if(isNaN(req.query.pageIndex) || isNaN(req.query.pageSize)){
		resobj.status = ERRORCODE;
		resobj.message = '参数错误：分页参数pageIndex和pageSize必须是数字';
		res.end(JSON.stringify(resobj));
		return;
	}

	let skipCount = (pageIndex - 1) * (pageSize - 0);
	req.db.driver.execQuery(sql,(err,datas)=>{	
			if(err){
				resobj.status = ERRORCODE;
				resobj.message = err.message;
				res.end(JSON.stringify(resobj));
				return;
			}
			try{
					//获取数据总条数
					resobj.totalcount = datas[0].count;
					resobj.pageIndex = pageIndex;
					resobj.pageSize = pageSize;
					//回调继续处理其他业务
					callback({pageIndex,pageSize,skipCount});
				}
				catch(e){
							resobj.status = ERRORCODE;
							resobj.message = e.message;
							res.end(JSON.stringify(resobj));
						}

		});
}

//执行sql语句，完成逻辑
function execQuery(req,res,sql){
	req.db.driver.execQuery(sql,(err,data)=>{				
				if(err){
					resobj.status = ERRORCODE;
					resobj.message = err.message;
					res.end(JSON.stringify(resobj));
					return;
				}
				try{
				resobj.status = SUCCESSCODE;
				resobj.message = data;
				res.end(JSON.stringify(resobj));
				}catch(e){
							resobj.status = ERRORCODE;
							resobj.message = e.message;
							res.end(JSON.stringify(resobj));
						}
	});

};