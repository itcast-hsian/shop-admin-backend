'use strict'

const kits = require('../kits/kits.js');
const multiparty = require('multiparty');
const path = require('path');
const urlobj = require('url');

const SUCCESSCODE = 0;
const ERRORCODE = 1;
let resobj = {};

//1 获取文章列表
exports.getlist = (req,res)=>{
	resobj = {}; //重置对象
	let type = req.params.tablename;
	let channelID = getChannelID(type);	
	let sql =`select id as category_id,title,sort_id,class_layer,parent_id
				 from dt_article_category where channel_id = ${channelID} order by sort_id `;
		execQuery(req,res,sql);
}

// 2 新增类型
exports.add = (req,res)=>{
	resobj = {}; //重置对象

	let type = req.params.tablename;
	let channelID = getChannelID(type);		
	let categoryid = 0;
	if(req.body.category_id && parseInt(req.body.category_id)>0){
		categoryid = req.body.category_id;
	}

	let sql = `INSERT INTO dt_article_category
				(				 
				 site_id
				 ,channel_id
				 ,title
				 ,call_index
				 ,parent_id
				 ,class_list
				 ,class_layer
				 ,sort_id
				 ,link_url
				 ,img_url
				 ,content
				 ,seo_title
				 ,seo_keywords
				 ,seo_description
				 ,is_lock
				)
				VALUES
				(
				 1
				 ,${channelID}
				 ,'${req.body.title}'
				 ,'' 
				 ,${categoryid}
				 ,'' 
				 ,${req.body.class_layer} 
				 ,${req.body.sort_id}
				 ,'' 
				 ,'' 
				 ,'' 
				 ,'' 
				 ,'' 
				 ,'' 
				 ,0 
				);`;
				// console.log(sql);
	execSqlCallBack(req,res,sql,(err,data)=>{		
		if(err){
			resobj.status = ERRORCODE;
			resobj.message = err.message;
			res.end(JSON.stringify(resobj));
			return;
		}
		/*
		 插入数据后data的格式为：OkPacket {
			  fieldCount: 0,
			  affectedRows: 1,
			  insertId: 5,  //自增id最新值
			  serverStatus: 2,
			  warningCount: 0,
			  message: '',
			  protocol41: true,
			  changedRows: 0 }
		 */		
		resobj.status = SUCCESSCODE;
		resobj.message = '数据新增成功';
		res.end(JSON.stringify(resobj));
	});
}

// 3、根据id获取分类数据
exports.getCategoryModel = (req,res)=>{
	resobj = {}; //重置对象
	let cateid = req.params.cateid;	

	let sql = `select id,title,channel_id,cast(parent_id as char) as parent_id,class_layer,sort_id 
				from dt_article_category where id=${cateid}`;
				// console.log(sql);
	execQuery(req,res,sql);	
		
}

// 3.0.1 编辑数据
exports.edit = (req,res)=>{
	resobj = {}; //重置对象	
	let cateid = req.params.cateid;

	let parentid = 0;
	if(req.body.parent_id){
		parentid = req.body.parent_id; 
	}

	let sql = `update dt_article_category set 
				title = '${req.body.title}',
				parent_id = ${parentid},
				class_layer = ${req.body.class_layer},
				sort_id = ${req.body.sort_id}
				where id=${cateid} `;
		console.log(sql);		
	execSqlCallBack(req,res,sql,(err,data)=>{		
		if(err){
			resobj.status = ERRORCODE;
			resobj.message = err.message;
			res.end(JSON.stringify(resobj));
			return;
		}
		
		resobj.status = SUCCESSCODE;
		resobj.message = '数据编辑成功';
		res.end(JSON.stringify(resobj));
	});
		
}

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