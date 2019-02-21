'use strict'

const kits = require('../kits/kits.js');
const multiparty = require('multiparty');
const syspath = require('path');
const urlobj = require('url');

const SUCCESSCODE = 0;
const ERRORCODE = 1;
let resobj = {};

// 获取轮播图
exports.getlunbo= (req, res) => {
	let resObj = {status: SUCCESSCODE, message: [{
			   url: 'http://www.itcast.cn/subject/phoneweb/index.html',
			   img: kits.nodeServerDomain+'/vuelogobanner1.jpg'
			 }, {
			   url: 'http://www.itcast.cn/subject/phoneweb/index.html',
			   img: kits.nodeServerDomain+'/vuelogobanner2-1.jpg'
			 }]}
   
		res.end(JSON.stringify(resObj))
   }


// 1.0 分页获取文章列表
//1 获取文章列表
exports.getartlist = (req,res)=>{
	resobj = {}; //重置对象

	let tbname = kits.tableNameLeft+req.params.tablename;	

	let sqlCount = `select count(1) as count from ${tbname}`;

	//执行分页数据处理
	execQueryCount(req,res,sqlCount,(pageobj)=>{
		let sql =`select a.id,a.title,a.add_time,left(a.zhaiyao,25) as zhaiyao,a.click,concat('${kits.nodeServerDomain}',a.img_url) as img_url
		 from ${tbname} as a	
		limit ${pageobj.skipCount},${pageobj.pageSize} `;
		execQuery(req,res,sql);
	});
}


// 1.0 根据id获取详情
exports.getdetial = (req,res)=>{
	resobj = {}; //重置对象
	let id = req.params.id;
	let tbname = kits.tableNameLeft+req.params.tablename;	
	let channelID = getChannelID(req.params.tablename);//得到频道id

	let sql = `select id,title,click,add_time,content from ${tbname}`;

	let tempobj = {artInfo:{}};
	execSqlCallBack(req,res,sql,(err,datas)=>{
		if(err){
			resobj.status = ERRORCODE;
			resobj.message = err.message;
			res.end(JSON.stringify(resobj));
			return;
		}

		if(datas && datas.length >0){
			tempobj.artInfo = datas[0];
		}

		let albumSql = `select id,channel_id,article_id,
		CONCAT('${kits.nodeServerDomain}',thumb_path) AS src,
		CONCAT('${kits.nodeServerDomain}',original_path) AS original_path
		,400 as h,600 as w 
		 from dt_article_albums where channel_id = ${channelID} and article_id=${id}`; 
		 console.log(albumSql);
		 execSqlCallBack(req,res,albumSql,(aerr,adatas)=>{
			if(aerr){
				resobj.status = ERRORCODE;
				resobj.message = aerr.message;
				res.end(JSON.stringify(resobj));
				return;
			}

			tempobj.imglist = adatas;
			resobj.status = SUCCESSCODE;
			resobj.message = tempobj;
			res.end(JSON.stringify(resobj));
			
		 });
	})
	
}

// 获取商品列表数据
exports.getgoodslist = (req,res)=>{
	resobj = {}; //重置对象
	let id = req.params.id;
	let tbname = 'dt_channel_article_goods'	
	let channelID = getChannelID('goods');//得到频道id

	let sqlCount = `select count(1) as count from ${tbname}`;
	
		//执行分页数据处理
		execQueryCount(req,res,sqlCount,(pageobj)=>{
			let sql =`select a.id,a.title,a.add_time,left(a.zhaiyao,25) as zhaiyao,a.click,
			concat('${kits.nodeServerDomain}',a.img_url) as img_url,a.sell_price,a.market_price,a.stock_quantity
			 from ${tbname} as a	
			limit ${pageobj.skipCount},${pageobj.pageSize} `;
			execQuery(req,res,sql);
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