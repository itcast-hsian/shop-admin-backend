'use strict'

const kits = require('../kits/kits.js');
const syspath = require('path');
const sysurl = require('url');

const SUCCESSCODE = 0;
const ERRORCODE = 1;
let resobj = {};


// 1 获取订单
exports.getorderlist = (req,res)=>{
	resobj = {};

	let sqlCount = `select count(1) as count from dt_orders where 1=1 `;
	let sqlQuery = `select od.*,case od.status when 1 then '待付款' when 2 then '已付款待发货'
	 when 3 then '已发货待签收' when 4 then '已签收' when 5 then '已取消' end as statusName
	,p.title as paymentTitle,e.title as expressTitle from dt_orders as od 
	left join dt_payment p on (od.payment_id = p.id)
	left join dt_express e on (od.express_id = e.id)
	where 1=1 `;

	/*
		orderstatus:
		1:订单已经生成（待付款）
		2:已付款等待发货
		3:已发货，待完成
		4:已签收，已完成
		5:已取消
	 */
	let orderstatus = (req.query.orderstatus - 0);
	if(orderstatus>0){
		sqlCount += ` and status=${orderstatus}`;
		sqlQuery += ` and od.status=${orderstatus}`;
	}

	let vipname = req.query.vipname;
	if(vipname){
		sqlCount += ` and user_name like '%${vipname}%'`;
		sqlQuery += ` and od.user_name like '%${vipname}%'`;
	}

	//执行分页数据处理
	execQueryCount(req,res,sqlCount,(pageobj)=>{
		sqlQuery += ` order by id desc 
		limit ${pageobj.skipCount},${pageobj.pageSize} `;
		execQuery(req,res,sqlQuery);
	});
}


// 2 获取订单明细
exports.getorderdetial = (req,res)=>{
	resobj = {};
	let orderid = req.params.orderid;
	let warpObj = {};

	let orderSql = `select od.*,Cast(od.status as Char) as orderstatus,p.title as paymentTitle,e.title as expressTitle from dt_orders  od
	left join dt_payment p on (od.payment_id = p.id)
	left join dt_express e on (od.express_id = e.id)
	 where od.id=${orderid}`;

	execSqlCallBack(req,res,orderSql,(oerr,odatas)=>{
		if(oerr){
				resobj.status = ERRORCODE;
				resobj.message = oerr.message;
				res.end(JSON.stringify(resobj));
				return;
			}
			// 订单信息
		warpObj.orderinfo = odatas[0];

		let goodslistSql = `select *,CONCAT('${kits.nodeServerDomain}',img_url) as imgurl from dt_order_goods where order_id=${orderid}`;
		execSqlCallBack(req,res,goodslistSql,(gerr,gdatas)=>{
			if(gerr){
				resobj.status = ERRORCODE;
				resobj.message = gerr.message;
				res.end(JSON.stringify(resobj));
				return;
			}

			// 订单商品信息
			warpObj.goodslist=  gdatas;

			resobj.status = SUCCESSCODE;
			resobj.message = warpObj;
			res.end(JSON.stringify(resobj));
		});
	})

}


// 更新订单
exports.updateorder = (req,res)=>{
	resobj = {};
	let orderinfo = req.body.orderinfo;

	let sql = `
				UPDATE dt_orders 
				SET				 
				 express_no = '${orderinfo.express_no}' 
				 ,express_fee = ${orderinfo.express_fee}
				 ,accept_name = '${orderinfo.accept_name}' 
				 ,telphone = '${orderinfo.telphone}' 
				 ,mobile = '${orderinfo.mobile}' 
				 ,email = '${orderinfo.email}' 
				 ,area = '${orderinfo.area}' 
				 ,address = '${orderinfo.address}' 
				 ,message = '${orderinfo.message}' 
				 ,order_amount = ${orderinfo.order_amount}			
				 ,status = ${orderinfo.orderstatus}
				 
				`
			if((orderinfo.orderstatus-0)==3){
				//2:已发货
				sql+=`,express_status = 2  
					  ,express_time = NOW()`;
			}

			if((orderinfo.orderstatus-0)==2){
				sql+=`,confirm_time =NOW()`;
			}

			if((orderinfo.orderstatus-0)==4){
				sql+=`,complete_time =NOW()`;
			}

			sql+=` WHERE
				  id = ${orderinfo.id}`;

			execQuery(req,res,sql);
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