'use strict'

const kits = require('../kits/kits.js');
const multiparty = require('multiparty');
const path = require('path');
const urlobj = require('url');

const SUCCESSCODE = 0;
const ERRORCODE = 1;
let resobj = {};
let tbname = 'dt_channel_article_goods';

//1 获取文章列表
exports.getlist = (req,res)=>{
	resobj = {}; //重置对象
	let searchValue = req.query.searchvalue;
	let sqlCount = `select count(1) as count from ${tbname}`;

	if(searchValue){
		sqlCount += ` where title like '%${searchValue}%' `;
	}

	
	//执行分页数据处理
	execQueryCount(req,res,sqlCount,(pageobj)=>{
		let sql =`select a.*,CONCAT('${kits.nodeServerDomain}',a.img_url) as imgurl,
		c.title as categoryname from ${tbname} as a
		inner join dt_article_category c on (a.category_id = c.id)`;
		if(searchValue){
			sql += ` where a.title like '%${searchValue}%' `;
		}
		sql+= `order by id desc limit ${pageobj.skipCount},${pageobj.pageSize} `;

		
		execQuery(req,res,sql);
	});
}


// 5 新增 商品
exports.add = (req,res)=>{
	resobj = {}; //重置对象
	let channelID = getChannelID('goods');	
	let shorturl='';
	// 封面图片
	if(req.body.imgList && req.body.imgList.length>0){
		shorturl = req.body.imgList[0].shorturl;
	}

	//相册列表
	let fileList = [];
	if(req.body.fileList && req.body.fileList.length>0){
		fileList = req.body.fileList;
	}

	let sql = `
				INSERT INTO ${tbname}
				(				 
				 channel_id
				 ,category_id
				 ,title
				 ,link_url
				 ,img_url
				 ,zhaiyao
				 ,content
				 ,sort_id
				 ,click
				 ,status
				 ,is_msg
				 ,is_top
				 ,is_red
				 ,is_hot
				 ,is_slide
				 ,is_sys
				 ,user_name
				 ,add_time
				 ,update_time
				 ,sub_title
				 ,goods_no
				 ,stock_quantity
				 ,market_price
				 ,sell_price
				 ,point
				)
				VALUES
				(
				 ${channelID} /* channel_id - INT(10)*/
				 ,${req.body.category_id} /* category_id - INT(10)*/				 
				 ,'${req.body.title}' /* title - VARCHAR(100)*/
				 ,'' /* link_url - VARCHAR(255)*/
				 ,'/${shorturl}' /* img_url - VARCHAR(255)*/				
				 ,'${req.body.zhaiyao}' /* zhaiyao - VARCHAR(255)*/
				 ,'${req.body.content}' /* content - TEXT*/
				 ,99 /* sort_id - INT(10)*/
				 ,0 /* click - INT(10)*/
				 ,${req.body.status} /* status - INT(10)*/
				 ,1 /* is_msg - INT(10)*/
				 ,${req.body.is_top} /* is_top - INT(10)*/
				 ,1 /* is_red - INT(10)*/
				 ,${req.body.is_hot} /* is_hot - INT(10)*/
				 ,${req.body.is_slide} /* is_slide - INT(10)*/
				 ,1 /* is_sys - INT(10)*/
				 ,'${req.session.admin_user.uname}' /* user_name - VARCHAR(100)*/			
				 ,NOW() /* add_time - DATETIME*/
				 ,NOW() /* update_time - DATETIME*/
				 ,'${req.body.sub_title}' /* sub_title - VARCHAR(255)*/
				 ,'${req.body.goods_no}' /* goods_no - VARCHAR(100)*/
				 ,${req.body.stock_quantity} /* stock_quantity - INT(10)*/
				 ,${req.body.market_price} /* market_price - DECIMAL(9, 2)*/
				 ,${req.body.sell_price} /* sell_price - DECIMAL(9, 2)*/
				 ,0 /* point - INT(10)*/
				);`;
console.log(sql);
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
		
		 if(fileList.length <=0){	
			resobj.status = SUCCESSCODE;
			resobj.message = '数据插入成功';
			res.end(JSON.stringify(resobj));	 	
		 	return;
		 }

		  // 实现附件的插入
		 let splitChar = ',';  //values(),()多条数据之间的分隔符
		 let sqlValues = ''; 
		 let flng = fileList.length;
		 for (var i = 0; i < flng; i++) {
		 	let item = fileList[i];
		 	if(i >= flng-1){
		 		splitChar = ';';  //最后一条数据结束插入sql语句语法
		 	}
		 	sqlValues += `
		 					(
							 ${channelID} /* channel_id - INT(10)*/
							 ,${data.insertId} /* article_id - INT(10)*/
							 ,'/${item.shorturl}' /* thumb_path - VARCHAR(255)*/
							 ,'/${item.shorturl}' /* original_path - VARCHAR(255)*/
							 ,'' /* remark - TEXT*/
							 ,NOW() /* add_time - DATETIME*/
							)${splitChar}
		 					`;
		 };

		 let albumSql = `INSERT INTO dt_article_albums
							(
							 channel_id
							 ,article_id
							 ,thumb_path
							 ,original_path
							 ,remark
							 ,add_time
							)
							VALUES
							${sqlValues}`;

		console.log(albumSql);		
		execSqlCallBack(req,res,albumSql,(err,data)=>{
			if(err){
						resobj.status = ERRORCODE;
						resobj.message = err.message;
						res.end(JSON.stringify(resobj));
						return;
					}
					
				resobj.status = SUCCESSCODE;
				resobj.message = '数据插入成功';
				res.end(JSON.stringify(resobj));
			});
		// resobj.status = SUCCESSCODE;
		// resobj.message = data;
		// res.end(JSON.stringify(resobj));
	});
}



// 编辑文章，获取老数据
exports.getgoodsmodel = (req,res)=>{
	resobj ={};
	// 获取参数	
	let id = req.params.id;
	let channelID = getChannelID('goods');
	
	// 查询商品sql语句
	let articleSql = `select * from ${tbname} where id=${id}`;
	 execSqlCallBack(req,res,articleSql,(artErr,artDatas)=>{
	 	if(artErr){
					resobj.status = ERRORCODE;
					resobj.message = artErr.message;
					res.end(JSON.stringify(resobj));
					return;
				}

		// 判断是否有数据
		if(artDatas.length ==0){
			resobj.status = ERRORCODE;
			resobj.message ='参数异常，请检查传入参数的正确性'
			res.end(JSON.stringify(resobj));
			return;
		}

		// 查询附件sql语句
		let attacheSql = `select * from dt_article_albums where article_id=${id} and channel_id=${channelID}`;
		execSqlCallBack(req,res,attacheSql,(attErr,attDatas)=>{
			if(attErr){
					resobj.status = ERRORCODE;
					resobj.message = attErr.message;
					res.end(JSON.stringify(resobj));
					return;
				}

				let model = {};

				let artmodel = artDatas[0];
				let fileList = [];
				for (var i = 0; i < attDatas.length; i++) {
					let attache = attDatas[i];
					fileList.push({
						uid:attache.id,
						name:path.basename(attache.thumb_path),
						url:urlobj.resolve(kits.nodeServerDomain,attache.thumb_path),
						shorturl:attache.thumb_path
					});
				};

				//组合返回对象
				model.title = artmodel.title;
				model.sub_title = artmodel.sub_title;
				model.goods_no=artmodel.goods_no;
				model.category_id = artmodel.category_id.toString();
				model.stock_quantity=artmodel.stock_quantity;
				model.market_price=artmodel.market_price;
				model.sell_price=artmodel.sell_price;
				model.status = artmodel.status == 1;
				model.is_slide = artmodel.is_slide == 1;
				model.is_top = artmodel.is_top == 1;
				model.is_hot = artmodel.is_hot == 1;
				model.zhaiyao = artmodel.zhaiyao;
				model.content = artmodel.content;
				model.imgList = [{name:path.basename(artmodel.img_url)
					,url:urlobj.resolve(kits.nodeServerDomain,artmodel.img_url)
					,shorturl:artmodel.img_url}];
				model.fileList = fileList;

				resobj.status = SUCCESSCODE;
				resobj.message = model;
				res.end(JSON.stringify(resobj));				

		});//attache查询回调结束

	 });//article查询回调结束
}

// 7 编辑文章
exports.edit = (req,res)=>{
	resobj = {}; //重置对象

	let artid = req.params.id;
	let channelID = getChannelID('goods');	
	let shorturl='';
	// 封面图片
	if(req.body.imgList && req.body.imgList.length>0){
		shorturl = req.body.imgList[0].shorturl;
	}

	//附件列表
	let fileList = [];
	if(req.body.fileList && req.body.fileList.length>0){
		fileList = req.body.fileList;
	}

	let sql = `UPDATE ${tbname} 
				SET				  
				  category_id = ${req.body.category_id}
				 ,title = '${req.body.title}'	
				 ,sub_title='${req.body.sub_title}'
				 ,goods_no='${req.body.goods_no}'
				 ,stock_quantity=${req.body.stock_quantity}
				 ,market_price=${req.body.market_price}
				 ,sell_price=${req.body.sell_price}
				 ,goods_no='${req.body.goods_no}'
				 ,img_url = '${shorturl}' 
				 ,zhaiyao = '${req.body.zhaiyao}' 
				 ,content = '${req.body.content}' 
				 ,status = ${req.body.status}
				 ,is_top = ${req.body.is_top}				 
				 ,is_hot = ${req.body.is_hot} 
				 ,is_slide = ${req.body.is_slide}	
				 ,update_time = NOW() 				 		
				WHERE
				  id = ${artid};`;
				  // console.log(sql);
	execSqlCallBack(req,res,sql,(err,data)=>{	
		if(err){
			resobj.status = ERRORCODE;
			resobj.message = err.message;
			res.end(JSON.stringify(resobj));
			return;
		}
		
		 if(fileList.length <=0){	
			resobj.status = SUCCESSCODE;
			resobj.message = '数据更新成功';
			res.end(JSON.stringify(resobj));	 	
		 	return;
		 }

		 let delsql =`delete from dt_article_albums 
		 					where channel_id = ${channelID} and article_id =${artid};`; 
		 execSqlCallBack(req,res,delsql,(err,data)=>{
		 	if(err){
				resobj.status = ERRORCODE;
				resobj.message = err.message;
				res.end(JSON.stringify(resobj));
				return;
			}
		

		  // 实现相册的更新
		 let splitChar = ',';  //values(),()多条数据之间的分隔符
		 let sqlValues = ''; 
		 let flng = fileList.length;
		 for (var i = 0; i < flng; i++) {
		 	let item = fileList[i];
		 	if(i >= flng-1){
		 		splitChar = ';';  //最后一天数据结束插入sql语句语法
		 	}
		 	sqlValues += `(
							 ${channelID} /* channel_id - INT(10)*/
							 ,${artid} /* article_id - INT(10)*/
							 ,'/${item.shorturl}' /* thumb_path - VARCHAR(255)*/
							 ,'/${item.shorturl}' /* original_path - VARCHAR(255)*/
							 ,'' /* remark - TEXT*/
							 ,NOW() /* add_time - DATETIME*/
							)${splitChar}`;
		 };

		 let attacheSql = `
		 					INSERT INTO dt_article_albums
							(
							 channel_id
							 ,article_id
							 ,thumb_path
							 ,original_path
							 ,remark
							 ,add_time
							)
							VALUES
							${sqlValues}`;		
							console.log(attacheSql);	
		execSqlCallBack(req,res,attacheSql,(err,data)=>{
			if(err){
						resobj.status = ERRORCODE;
						resobj.message = err.message;
						res.end(JSON.stringify(resobj));
						return;
					}
					
				resobj.status = SUCCESSCODE;
				resobj.message = '数据更新成功';
				res.end(JSON.stringify(resobj));
			});
		// resobj.status = SUCCESSCODE;
		// resobj.message = data;
		// res.end(JSON.stringify(resobj));
	
		});
	});
}

// 5 删除数据
exports.del =(req,res)=>{
	resobj = {}; //重置对象	
	let artids = req.params.ids;
	let channelID = getChannelID('goods');	

	let attacheSql = `delete from dt_article_attach
				 where channel_id = ${channelID} and article_id in(${artids}) `;

	execSqlCallBack(req,res,attacheSql,(err,data)=>{
		if(err){
					resobj.status = ERRORCODE;
					resobj.message = err.message;
					res.end(JSON.stringify(resobj));
					return;
				}

		let sql =`delete from ${tbname} where id in(${artids})`;
	execSqlCallBack(req,res,sql,(artErr,artData)=>{
			if(artErr){
						resobj.status = ERRORCODE;
						resobj.message = artErr.message;
						res.end(JSON.stringify(resobj));
						return;
					}
					
				resobj.status = SUCCESSCODE;
				resobj.message = '数据删除成功';
				res.end(JSON.stringify(resobj));
			});
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