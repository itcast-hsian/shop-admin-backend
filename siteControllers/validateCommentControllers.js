'use strict'

const kits = require('../kits/kits.js');
const multiparty = require('multiparty');
const path = require('path');
const urlobj = require('url');

const SUCCESSCODE = 0;
const ERRORCODE = 1;
let resobj = {};

// 提交评论
exports.postComment=(req,res)=>{
	resobj = {};
	let type = req.params.tablename;//获取频道参数
	let channelID = getChannelID(type);//得到频道id
	let artid = req.params.artid; //要评论的商品或者文章

	let commentTxt = req.body.commenttxt;

	let user={userid:0,username:'匿名用户'};

	if(req.session && req.session.site_user){
		user = req.session.site_user;
	}

	let sql = `
				INSERT INTO dt_article_comment
				(
				  channel_id
				 ,article_id
				 ,parent_id
				 ,user_id
				 ,user_name
				 ,user_ip
				 ,content
				 ,is_lock
				 ,add_time
				 ,is_reply
				 ,reply_content
				 ,reply_time
				)
				VALUES
				(
				 ${channelID} /* channel_id - INT(10)*/
				 ,${artid} /* article_id - INT(10)*/
				 ,0 /* parent_id - INT(10)*/
				 ,${user.userid} /* user_id - INT(10)*/
				 ,'${user.username}' /* user_name - VARCHAR(100)*/
				 ,'${getClientIp(req)}' /* user_ip - VARCHAR(255)*/
				 ,'${commentTxt}' /* content - TEXT*/
				 ,0 /* is_lock - TINYINT(3)*/
				 ,NOW() /* add_time - DATETIME*/
				 ,0 /* is_reply - TINYINT(3)*/
				 ,'' /* reply_content - TEXT*/
				 ,NOW() /* reply_time - DATETIME*/
				);`;
console.log(sql);
			execSqlCallBack(req,res,sql,(err,datas)=>{
				if(err){
					resobj.status = ERRORCODE;
					resobj.message = err.message; 
					res.end(JSON.stringify(resobj));
					return;
				}

				// 赋值和返回
				resobj.status = SUCCESSCODE;
				resobj.message = '评论成功';
				res.end(JSON.stringify(resobj));
			});
}


// 分页获取评论
exports.getbypage = (req,res)=>{
	resobj = {};
	let type = req.params.tablename;//获取频道参数
	let channelID = getChannelID(type);//得到频道id
	let artid = req.params.artid; //要评论的商品或者文章

	let sqlcount = `select count(1) as count from dt_article_comment 
		where channel_id=${channelID} and article_id=${artid}`;

	execQueryCount(req,res,sqlcount,(pageobj)=>{

		let commentsql = `
					select * from dt_article_comment 
					where channel_id=${channelID} and article_id=${artid} 
					order by id desc 
					limit ${pageobj.skipCount},${pageobj.pageSize}
				`;
		execQuery(req,res,commentsql);
	});
}

// 4 获取购物车商品数据
exports.getshopcargoods = (req,res)=>{
	resobj = {};
	let ids = req.params.ids;

	let sql =`
			select id,CONCAT('${kits.nodeServerDomain}',img_url) AS img_url
			,title,sell_price,0 as buycount from dt_channel_article_goods where id in(${ids}) 
			`;
			console.log(sql);
	execQuery(req,res,sql);
}

// 获取客户端ip
 function getClientIp(req) {
        return req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
    };

function getChannelID(tablename){

	let channel=1;
	switch(tablename){
		case 'question': 
		channel = 1;
		break;

		case 'goods': 
		channel = 2;
		break;

		case 'common': 
		channel = 3;
		break;

		case 'point': 
		channel = 4;
		break;

		case 'down': 
		channel = 5;
		break;

		case 'content': 
		channel = 6;
		break;
	}

	return channel;
}

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


//执行插入，更新，删除语句，完成逻辑
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