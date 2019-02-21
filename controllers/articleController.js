'use strict'

const kits = require('../kits/kits.js');
const multiparty = require('multiparty');
const syspath = require('path');
const urlobj = require('url');

const SUCCESSCODE = 0;
const ERRORCODE = 1;
let resobj = {};

//1 获取文章列表
exports.getlist = (req,res)=>{
	resobj = {}; //重置对象

	let tbname = kits.tableNameLeft+req.params.tablename;	

	let sqlCount = `select count(1) as count from ${tbname}`;

	//执行分页数据处理
	execQueryCount(req,res,sqlCount,(pageobj)=>{
		let sql =`select a.*,c.title as categoryname from ${tbname} as a 
		inner join dt_article_category c on (a.category_id = c.id) order by id desc 
		limit ${pageobj.skipCount},${pageobj.pageSize} `;
		execQuery(req,res,sql);
	});
}

// 2 上传文章封面图片
exports.uploadimg = (req,res)=>{
	// 初始化文件解析对象
	let form = new multiparty.Form();
	form.uploadDir  = './upload/imgs'; //设置文件保存的相对路径
	// form.maxFilesSize = 1024 * 500; //最大只能上传500K

	form.parse(req,(err, fields, files)=>{		
		/*
		{ file:
		   [ { fieldName: 'file',
		       originalFilename: 'Web.png',
		       path: 'upload\\imgs\\-_zChYuXflE6tCfrx9T-ea7C.png',
		       headers: [Object],
		       size: 45108 } 
		    ] 
		}
		 */
		
		let resObj={};		
		for (let i = 0; i < files.file.length; i++) {
			let item = files.file[i];
			let path = item.path.replace(/upload\\/g,'').replace(/\\/,'/');
			resObj={name:item.originalFilename,url:urlobj.resolve(kits.nodeServerDomain,path),shorturl:path};
			break;
		};
		res.end(JSON.stringify(resObj));
	}); 
}



// 3 上传附件
exports.uploadfile = (req,res)=>{
	// 初始化文件解析对象
	let form = new multiparty.Form();
	form.uploadDir  = './upload/attaches'; //设置文件保存的相对路径
	// form.maxFilesSize = 1024 * 500; //最大只能上传500K

	form.parse(req,(err, fields, files)=>{		
		/*
		{ file:
		   [ { fieldName: 'file',
		       originalFilename: 'Web.zip',
		       path: 'upload\\attaches\\-_zChYuXflE6tCfrx9T-ea7C.zip',
		       headers: [Object],
		       size: 45108 } 
		    ] 
		}
		 */
		
		let resObj={};		
		for (let i = 0; i < files.file.length; i++) {
			let item = files.file[i];
			let path = item.path.replace(/upload\\/g,'').replace(/\\/,'/');
			resObj={name:item.originalFilename,url:urlobj.resolve(kits.nodeServerDomain,path),shorturl:path,size:item.size};
			break;
		};
		res.end(JSON.stringify(resObj));
	}); 
}

// 4 获取文章类别数据
exports.getcategorylist =(req,res)=>{
	resobj = {}; //重置对象
	let type = req.params.tablename;
	let channelID = getChannelID(type);

	let sql = ` SELECT CAST(id as CHAR) as id,title,parent_id,class_layer,sort_id FROM dt_article_category
	 where channel_id =${channelID} ORDER BY sort_id  `;

	 execQuery(req,res,sql);
}

// 5 新增文章
exports.add = (req,res)=>{
	resobj = {}; //重置对象

	let type = req.params.tablename;
	let channelID = getChannelID(type);	
	let shorturl='/logo.png';
	// 封面图片
	if(req.body.imgList && req.body.imgList.length>0){
		shorturl = req.body.imgList[0].shorturl;
	}

	//附件列表
	let fileList = [];
	if(req.body.fileList && req.body.fileList.length>0){
		fileList = req.body.fileList;
	}

	let tbname = kits.tableNameLeft+type;

	let sql = `INSERT INTO ${tbname}
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
				,is_top
				,is_red
				,is_hot
				,is_slide
				,user_name
				,add_time
				,update_time
				,author
				,video_src
				)
				VALUES
				(
				 ${channelID}         
				,${req.body.category_id} /* category_id - INT(10)*/
				,'${req.body.title}' /* title - VARCHAR(100)*/
				,'' /* link_url - VARCHAR(255)*/
				,'/${shorturl}' /* img_url - VARCHAR(255)*/
				,'${req.body.zhaiyao}' /* zhaiyao - VARCHAR(255)*/
				,'${req.body.content}' /* content - TEXT*/
				,99 /* sort_id - INT(10)*/
				,0 /* click - INT(10)*/
				,${req.body.status} /* status - INT(10)*/
				,${req.body.is_top} /* is_top - INT(10)*/
				,0 /* is_red - INT(10)*/
				,${req.body.is_hot} /* is_hot - INT(10)*/
				,${req.body.is_slide} /* is_slide - INT(10)*/
				,'admin' /* user_name - VARCHAR(100)*/
				,NOW() /* add_time - DATETIME*/
				,NOW() /* update_time - DATETIME*/
				,'admin' /* author - VARCHAR(50)*/
				,'' /* video_src - VARCHAR(255)*/
				);`;

	execSqlCallBack(req,res,sql,(err,data)=>{
		console.log(err);
		console.log(data);
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
		 		splitChar = ';';  //最后一天数据结束插入sql语句语法
		 	}
		 	sqlValues += `( 
							  ${channelID} /* channel_id - INT(10)*/
							 ,${data.insertId} /* article_id - INT(10)*/
							 ,'${item.name}' /* file_name - VARCHAR(255)*/
							 ,'/${item.shorturl}' /* file_path - VARCHAR(255)*/
							 ,${item.size} /* file_size - INT(10)*/
							 ,'${syspath.extname(item.name)}' /* file_ext - VARCHAR(20)*/
							 ,0 /* down_num - INT(10)*/
							 ,1 /* point - INT(10)*/
							 ,NOW() /* add_time - DATETIME*/
							)${splitChar}`;
		 };

		 let attacheSql = `INSERT INTO dt_article_attach
							(
							 channel_id
							 ,article_id
							 ,file_name
							 ,file_path
							 ,file_size
							 ,file_ext
							 ,down_num
							 ,point
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
				resobj.message = '数据插入成功';
				res.end(JSON.stringify(resobj));
			});
		// resobj.status = SUCCESSCODE;
		// resobj.message = data;
		// res.end(JSON.stringify(resobj));
	});
}


// 编辑文章，获取老数据
exports.getarticle = (req,res)=>{
	resobj ={};
	// 获取参数
	let tablename = req.params.tablename;	
	let id = req.params.id;
	let channelID = getChannelID(tablename);
	let fullTableName = kits.tableNameLeft+tablename;

	// 查询文章sql语句
	let articleSql = `select * from ${fullTableName} where id=${id}`;
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
		let attacheSql = `select * from dt_article_attach where article_id=${id} and channel_id=${channelID}`;
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
						name:attache.file_name,
						url:attache.file_path,
						shorturl:attache.file_path,
						size:attache.file_size
					});
				};

				//组合返回对象
				model.title = artmodel.title;
				model.category_id = artmodel.category_id.toString();
				model.status = artmodel.status == 1;
				model.is_slide = artmodel.is_slide == 1;
				model.is_top = artmodel.is_top == 1;
				model.is_hot = artmodel.is_hot == 1;
				model.zhaiyao = artmodel.zhaiyao;
				model.content = artmodel.content;
				model.imgList = [{name:syspath.basename(artmodel.img_url)
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

	let type = req.params.tablename;
	let artid = req.params.artid;
	let channelID = getChannelID(type);	
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

	let tbname = kits.tableNameLeft+type;

	let sql = `UPDATE ${tbname} 
				SET				  
				  category_id = ${req.body.category_id}
				 ,title = '${req.body.title}'			
				 ,img_url = '/${shorturl}' 
				 ,zhaiyao = '${req.body.zhaiyao}' 
				 ,content = '${req.body.content}' 
				 ,status = ${req.body.status}
				 ,is_top = ${req.body.is_top}				 
				 ,is_hot = ${req.body.is_hot} 
				 ,is_slide = ${req.body.is_slide}						
				 ,update_time = NOW() 				 		
				WHERE
				  id = ${artid};`;

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

		 let delsql =`delete from dt_article_attach 
		 					where channel_id = ${channelID} and article_id =${artid};`; 
		 execSqlCallBack(req,res,delsql,(err,data)=>{
		 	if(err){
				resobj.status = ERRORCODE;
				resobj.message = err.message;
				res.end(JSON.stringify(resobj));
				return;
			}
		

		  // 实现附件的更新
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
							 ,'${item.name}' /* file_name - VARCHAR(255)*/
							 ,'/${item.shorturl}' /* file_path - VARCHAR(255)*/
							 ,${item.size} /* file_size - INT(10)*/
							 ,'${syspath.extname(item.name)}' /* file_ext - VARCHAR(20)*/
							 ,0 /* down_num - INT(10)*/
							 ,1 /* point - INT(10)*/
							 ,NOW() /* add_time - DATETIME*/
							)${splitChar}`;
		 };

		 let attacheSql = `
		 					INSERT INTO dt_article_attach
							(
							 channel_id
							 ,article_id
							 ,file_name
							 ,file_path
							 ,file_size
							 ,file_ext
							 ,down_num
							 ,point
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

// 8 删除数据
exports.del =(req,res)=>{
	resobj = {}; //重置对象
	let type = req.params.tablename;
	let artids = req.params.ids;
	let channelID = getChannelID(type);	
	let tbname = kits.tableNameLeft+type;

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