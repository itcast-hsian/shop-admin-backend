'use strict'

const kits = require('../kits/kits.js');
const multiparty = require('multiparty');
const path = require('path');
const urlobj = require('url');

const SUCCESSCODE = 0;
const ERRORCODE = 1;
let resobj = {};

/* goods/list.vue组件中顶部需要的数据:
1、轮播图数据5条,is_sild = 1
2、置顶数据4条， is_top=4
3、商品分类数据,来源于表：dt_article_category
*/
let gCateDatas = [];
// let levelCateList=[];
exports.gettopdata = (req,res)=>{
	resobj = {};
	let type = req.params.tablename;//获取频道参数
	let channelID = getChannelID(type);//得到频道id
	let tbname = kits.tableNameLeft+req.params.tablename; //得到表名称	
	// 1.0 当前频道所有分类数据
	let categorySql = `select * from dt_article_category where channel_id=${channelID} ORDER BY parent_id`;
	execSqlCallBack(req,res,categorySql,(cateErr,cateDatas)=>{
		if(cateErr){
				resobj.status = ERRORCODE;
				resobj.message = cateErr.message; 
				res.end(JSON.stringify(resobj));
				return;
			}
			
			gCateDatas = cateDatas;
			// 递归获取分类数据
			let parentid = 0;
			let subcatelist = [];
			let classlayer=1;
			getcategory(parentid,classlayer,subcatelist);
			

			let warpobj = {};
			// 商品列表页面顶部左边的商品菜单数据
			warpobj.catelist = subcatelist;
			// warpobj.catelist = warpobj.catelist.concat(subcatelist);
			// warpobj.catelist = warpobj.catelist.concat(subcatelist);
			// warpobj.catelist = warpobj.catelist.concat(subcatelist);

			let sql = ` 
			(SELECT id,category_id,title,add_time,CONCAT('${kits.nodeServerDomain}',img_url) as img_url,is_slide,is_top,is_hot FROM ${tbname}  WHERE is_slide=1 ORDER BY id DESC LIMIT 0,5)
			UNION 
			(SELECT  id,category_id,title,add_time,CONCAT('${kits.nodeServerDomain}',img_url) as img_url,is_slide,is_top,is_hot FROM ${tbname}  WHERE is_top=1 ORDER BY id DESC LIMIT 0,4)
			`;

			execSqlCallBack(req,res,sql,(err,datas)=>{

				// 获取轮播数据
				warpobj.sliderlist = datas.filter(where=>where.is_slide == 1);
				warpobj.toplist = datas.filter(where=>where.is_top == 1);


				// 赋值和返回
			resobj.status = SUCCESSCODE;
			resobj.message = warpobj;
			res.end(JSON.stringify(resobj));
			});
		});
}

// 递归获取分类数据
function getcategory(parentid,classlayer,subcatelist){
	let levelList = gCateDatas.filter(item=>item.parent_id == parentid);
	if(!levelList ||levelList.length<=0){
		return;
	}

	if(parentid == 0){		
		levelList.forEach((lv1item)=>{
			let itemobj = {id:lv1item.id,pid:lv1item.parent_id,class_layer:lv1item.class_layer,title:lv1item.title,subcates:[]};
			getcategory(lv1item.id,++lv1item.class_layer,itemobj.subcates);
			subcatelist.push(itemobj);
		});			
	}else if(parentid >0 && classlayer <3 ){
		levelList.forEach((subitem)=>{
			let subobj = {id:subitem.id,pid:subitem.parent_id,class_layer:subitem.class_layer,title:subitem.title,subcates:[]};
			getcategory(subitem.id,++subitem.class_layer,subobj.subcates);
			subcatelist.push(subobj);
		});
	}else if(parentid >0 && classlayer >=3 ){
		levelList.forEach((subitem)=>{
			let subobj = {id:subitem.id,pid:subitem.parent_id,class_layer:subitem.class_layer,title:subitem.title};
			getcategory(subitem.id,++subitem.class_layer,subcatelist);
			subcatelist.push(subobj);
		});
	}
}


// 按照分类分组获取商品数据
exports.getgoodsgroup = (req,res) => {

resobj = {};
	let sql = `SELECT * FROM (
			SELECT cate.title AS parentTitle,tmp.* FROM (
			SELECT c.id as artID,c.title AS artTitle ,a.class_layer,c.add_time,
			  CASE a.parent_id
			  WHEN 0 THEN c.category_id
			  ELSE a.parent_id END AS parent_id
			  ,c.category_id as cateID,c.stock_quantity,c.market_price,c.sell_price,
			  a.title as cateTitle
			  ,CONCAT('${kits.nodeServerDomain}',c.img_url) AS img_url
			  FROM dt_channel_article_goods  as c 
			  LEFT JOIN dt_article_category as a ON (c.category_id = a.id)
			  WHERE c.channel_id = 2
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
				// if(curlist.length>6){
				// 	curlist.length = 6;
				// }
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


// 3 根据分类获取商品数据
// 传入 cateid：商品分类id
exports.getgoodsbycateid = (req,res)=>{
	resobj = {};
	let cateid = req.params.cateid;

	let sqlCount = `select count(1) as count from (
	select id
	 from dt_channel_article_goods where category_id =${cateid}
	 UNION
	 select g.id
	 from dt_channel_article_goods g 
	 inner join dt_article_category c on (g.category_id = c.id and c.parent_id = ${cateid})
	 ) as tmp
	 `;

	execQueryCount(req,res,sqlCount,(pageobj)=>{
		let sql =`select tmp.* from (
				select id,title,
				CONCAT('${kits.nodeServerDomain}',img_url) AS img_url
				,stock_quantity,market_price,sell_price
				 from dt_channel_article_goods where category_id =${cateid}
				 UNION
				 select g.id,g.title,
				CONCAT('${kits.nodeServerDomain}',g.img_url) AS img_url
				 ,g.stock_quantity,g.market_price,g.sell_price
				 from dt_channel_article_goods g 
				 inner join dt_article_category c on (g.category_id = c.id and c.parent_id = ${cateid})
				 ) as tmp order by id desc
		limit ${pageobj.skipCount},${pageobj.pageSize} `;
		execQuery(req,res,sql);
	});
}

// // 4 根据商品id获取商品详情数据
exports.getgoodsinfo=(req,res)=>{
	resobj = {};
	let goodsid = req.params.goodsid;
	// let tbname = kits.tableNameLeft+req.params.tablename;	
	let channelID = getChannelID('goods');//得到频道id

	let getgoodsinfoSql = `select * from dt_channel_article_goods where id=${goodsid}`;

	// 1、商品详情信息
	execSqlCallBack(req,res,getgoodsinfoSql,(err,datas)=>{
	if(err){
				resobj.status = ERRORCODE;
				resobj.message = err.message;
				res.end(JSON.stringify(resobj));
				return;
			}

	let warpObj = {};
	// ----->商品详细信息
	warpObj.goodsinfo = datas[0];

	// 2、获取当前商品的相册
	let albumSql = `select id,channel_id,article_id,	
	CONCAT('${kits.nodeServerDomain}',thumb_path) AS thumb_path,
	CONCAT('${kits.nodeServerDomain}',original_path) AS original_path
	 from dt_article_albums where channel_id = ${channelID} and article_id=${goodsid}`; 
	execSqlCallBack(req,res,albumSql,(alberr,albdatas)=>{
		if(alberr){
				resobj.status = ERRORCODE;
				resobj.message = alberr.message;
				res.end(JSON.stringify(resobj));
				return;
			}

		// ----->商品相册图片列表
		warpObj.imglist =  albdatas;

	// 3、获取推荐商品数据
	let hotgoodsSql = `select id,CONCAT('${kits.nodeServerDomain}',img_url) AS img_url,
			title,add_time from dt_channel_article_goods where is_hot =1 LIMIT 0,10`;
	execSqlCallBack(req,res,hotgoodsSql,(hoterr,hotdatas)=>{
		if(hoterr){
				resobj.status = ERRORCODE;
				resobj.message = hoterr.message;
				res.end(JSON.stringify(resobj));
				return;
			}
			// --->推荐商品10条
			warpObj.hotgoodslist = hotdatas;

			
			resobj.status = SUCCESSCODE;
			resobj.message = warpObj;
			res.end(JSON.stringify(resobj));
			return;
		});

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