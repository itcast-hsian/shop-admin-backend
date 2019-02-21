'use strict'

const kits = require('../kits/kits.js');
const multiparty = require('multiparty');
const path = require('path');
const urlobj = require('url');

const SUCCESSCODE = 0;
const ERRORCODE = 1;
let resobj = {};

/* 获取contentsildtophot.vue组件需要的数据:
1、轮播图数据5条,is_sild = 1
2、置顶数据10条， is_top=10
3、热门数据4条，is_hot=4
4、当前频道第一级分类数据,来源于表：dt_article_category
*/
exports.getsildtophot = (req,res)=>{
	resobj = {};
	let type = req.params.tablename;//获取频道参数
	let channelID = getChannelID(type);//得到频道id
	let tbname = kits.tableNameLeft+req.params.tablename; //得到表名称

	// 1.0 当前频道第一级分类数据
	let categorySql = `select * from dt_article_category where channel_id=${channelID} and parent_id=0`;
	execSqlCallBack(req,res,categorySql,(cateErr,cateDatas)=>{
		if(cateErr){
				resobj.status = ERRORCODE;
				resobj.message = cateErr.message;
				res.end(JSON.stringify(resobj));
				return;
			}

		// 2.0 轮播图数据5条,is_slide = 1
		// 置顶数据10条,热门数据4条
		let sql = ` 
		(SELECT id,category_id,title,add_time,CONCAT('${kits.nodeServerDomain}',img_url) as img_url,is_slide,is_top,is_hot FROM ${tbname}  WHERE is_slide=1 ORDER BY id DESC LIMIT 0,5)
		UNION ALL 
		(SELECT  id,category_id,title,add_time,CONCAT('${kits.nodeServerDomain}',img_url) as img_url,is_slide,is_top,is_hot FROM ${tbname}  WHERE is_top=1 ORDER BY id DESC LIMIT 0,10)
		UNION ALL 
		(SELECT  id,category_id,title,add_time,CONCAT('${kits.nodeServerDomain}',img_url) as img_url,is_slide,is_top,is_hot FROM ${tbname}  WHERE is_hot=1 ORDER BY id DESC LIMIT 0,4)
					`;
				
		execSqlCallBack(req,res,sql,(err,datas)=>{
			if(err){
				resobj.status = ERRORCODE;
				resobj.message = err.message;
				res.end(JSON.stringify(resobj));
				return;
			}

			let warpobj={};
			//分类数据
			warpobj.catelist = cateDatas;

			warpobj.slidelist = datas.filter(item=>item.is_slide == 1);
			if(warpobj.slidelist.length>10){
				warpobj.slidelist.length = 10;
			}
			warpobj.toplist = datas.filter(item=>item.is_top == 1);
			if(warpobj.toplist.length>10){
				warpobj.toplist.length = 10;
			}
			warpobj.hotlist = datas.filter(item=>item.is_hot == 1);
			if(warpobj.hotlist.length>4){
				warpobj.hotlist.length = 4;
			}

			// 赋值和返回
			resobj.status = SUCCESSCODE;
			resobj.message = warpobj;
			res.end(JSON.stringify(resobj));
		});

	});
}

// 2.0 获取分类数据
exports.getarticles =(req,res)=>{
	resobj = {};
	let type = req.params.tablename;//获取频道参数
	let channelID = getChannelID(type);//得到频道id
	let tbname = kits.tableNameLeft+req.params.tablename; //得到表名称

	let sql = `SELECT * FROM (
			SELECT cate.title AS parentTitle,tmp.* FROM (
			SELECT c.id as artID,c.title AS artTitle ,a.class_layer,c.add_time,
			  CASE a.parent_id
			  WHEN 0 THEN c.category_id
			  ELSE a.parent_id END AS parent_id
			  ,c.category_id as cateID,a.title as cateTitle
			  ,CONCAT('${kits.nodeServerDomain}',c.img_url) AS img_url,c.zhaiyao
			  FROM ${tbname}  as c 
			  LEFT JOIN dt_article_category as a ON (c.category_id = a.id)
			  WHERE c.channel_id = ${channelID}
			) AS tmp
			LEFT JOIN dt_article_category cate ON(tmp.parent_id = cate.id)
			  ) AS t ORDER BY t.parent_id`;
// console.log(sql);
execSqlCallBack(req,res,sql,(err,datas)=>{
	if(err){
				resobj.status = ERRORCODE;
				resobj.message = err.message;
				res.end(JSON.stringify(resobj));
				return;
			}

			let level1CateIDList = [];
			let level2CateIDList=[];
			let currentCateid=-1;
			// 得到一个parent_id的数组
			datas.forEach(item=>{
				if(currentCateid != item.parent_id){
					let tempobj = {parent_id:item.parent_id,ptitle:item.parentTitle,subarr:[]};
					if(item.class_layer>1){
						// level2CateIDList.push({cate_id:item.cateID,cate_title:item.cateTitle});
						tempobj.subarr = getsubCateList(datas,item.parent_id);
					}

					// 一级菜单去重
					level1CateIDList.push(tempobj);									
			
					currentCateid =  item.parent_id;			
				}
			});

			// 遍历level1CateIDList数组筛选出分类数据
			let catedatas = [];
			level1CateIDList.forEach(item1=>{
				let curlist = datas.filter(val=>val.parent_id == item1.parent_id);
				// console.log(item1.parent_id);
				if(curlist.length>6){
					curlist.length = 6;
				}
				catedatas.push({
					level1cateid:item1.parent_id, //一级菜单id 
					catetitle:item1.ptitle,  //一级菜单名称
					level2catelist:item1.subarr,  // 一级菜单下子菜单数组
					datas:curlist  //一级菜单下文章数据
				});
			});



			// 响应回去
			resobj.status = SUCCESSCODE;
			resobj.message =catedatas;
			res.end(JSON.stringify(resobj));

});
}


// 获取分类下的子分类id和标题
function getsubCateList(datas,parentid){
	resobj = {};
	let qarr= datas.filter(item=>item.parent_id == parentid);
	qarr = qarr.sort(function(p,n){return p.cateID - n.cateID});//正序排列，保证一个id只有一条数据
	let resArr=[];
	let curid = -1;
	qarr.forEach(item=>{
		if(curid != item.cateID){
			resArr.push({subcateid:item.cateID,subcatetitle:item.cateTitle});
			curid = item.cateID;

		}
	});
	// console.log(resArr);
	// console.log('----------');
	return resArr;
}


// 3.0 获取某个分类下的所有文章列表
exports.getartlist =(req,res)=>{
	resobj = {};
	let type = req.params.tablename;//获取频道参数
	let channelID = getChannelID(type);//得到频道id
	let tbname = kits.tableNameLeft+req.params.tablename; //得到表名称
	let cateid = req.params.cateid;


	// 获取当前频道下的所有分类
	let sqlcate = `
			select c.id,c.title,c.parent_id,c.class_layer from dt_article_category c
			INNER JOIN (
			select channel_id from dt_article_category where id= '${cateid}'
			) as t ON (c.channel_id = t.channel_id)`;

	execSqlCallBack(req,res,sqlcate,(cerr,catelist)=>{
		if(!cerr && catelist.length >0 ){

		var tmpobj={};
		// 返回当前频道下的所有分类对象
		tmpobj.catelist = catelist;

		// 获取当前分类id下的所有子分类id
		let cateids = [cateid];
		catelist.forEach(cobj=>{
			cateids.push(cobj.id);
		});

		let allcateid = cateids.join(',');

		// 获取所有分类下面的文章数据
		let sql =`select id,title,zhaiyao,CONCAT('${kits.nodeServerDomain}',img_url) AS img_url,
		click from ${tbname} where category_id in (${allcateid})`;

		console.log(sql)
		execSqlCallBack(req,res,sql,(err,list)=>{
			if(err){
				resobj.status = ERRORCODE;
				resobj.message = err.message;
				res.end(JSON.stringify(resobj));
				return;
			}

			// 返回分类下的所有文章数据
			tmpobj.artlist = list;

			// 响应回去
			resobj.status = SUCCESSCODE;
			resobj.message =tmpobj;
			res.end(JSON.stringify(resobj));
		});

		}else{
			resobj.status = ERRORCODE;
			resobj.message = cerr.message;
			res.end(JSON.stringify(resobj));
			return;
		}
		
	});
};



// 4.0 根据文章ID获取文章详情
exports.getartdetial =(req,res)=>{
	resobj = {};
	let type = req.params.tablename;//获取频道参数
	let channelID = getChannelID(type);//得到频道id
	let tbname = kits.tableNameLeft+req.params.tablename; //得到表名称
	let artid = req.params.artid;

	let sql = `select id,channel_id,title,click,CONCAT('${kits.nodeServerDomain}',img_url) AS img_url,zhaiyao,content
	from ${tbname} where id = '${artid}'
	`;


	let tmpobj = {};
	execSqlCallBack(req,res,sql,(err,list)=>{
		if(err){
			resobj.status = ERRORCODE;
			resobj.message = err.message;
			res.end(JSON.stringify(resobj));
			return;
		}

		if(list.length <=0){
			resobj.status = ERRORCODE;
			resobj.message = '没有符合的数据';
			res.end(JSON.stringify(resobj));
			return;
		}

		// 文章明细数据
		tmpobj.artinfo = list[0];

		// 获取当前文章所在频道的分类数据
		let csql = `select id,title,parent_id,class_layer 
		from dt_article_category 
		where channel_id=${list[0].channel_id}`;
		
		execSqlCallBack(req,res,csql,(cerr,clist)=>{
			if(cerr){
				resobj.status = ERRORCODE;
				resobj.message = cerr.message;
				res.end(JSON.stringify(resobj));
				return;
			}
			// 返回当前文章所在频道的分类数据
			tmpobj.catelist = clist;

			// 响应回去
			resobj.status = SUCCESSCODE;
			resobj.message =tmpobj;
			res.end(JSON.stringify(resobj));

		});
	});

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