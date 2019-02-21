'use strict'

const kits = require('../kits/kits.js');
const multiparty = require('multiparty');
const path = require('path');
const urlobj = require('url');

const SUCCESSCODE = 0;
const ERRORCODE = 1;
let resobj = {};

// 1 获取支付方式
exports.getpayments = (req,res)=>{

	resobj = {};
	let sql =`select id,title from  dt_payment where is_lock =0 `;
	execQuery(req,res,sql);
}


// 2 获取快递方式
exports.getexpresslist = (req,res)=>{

	resobj = {};

	let sql =`select id,title,express_fee from  dt_express where is_lock =0 `;
	execQuery(req,res,sql);
}

// 3 根据勾选的商品id字符串，获取商品数据 
exports.getgoodslist = (req,res) => {

	resobj = {};
	let goodsids = req.params.goodsids; //格式为 1,2,3

	let sql =`select id,title,
	CONCAT('${kits.nodeServerDomain}',img_url) as img_url
	,sell_price,1 as buycount, sell_price as totalamount  from  dt_channel_article_goods where id in(${goodsids})`;
	execQuery(req,res,sql);
}

function fmtdate(){
	var now = new Date();
	var y = now.getFullYear();
	var m =now.getMonth()+1;
	m=m<10?'0'+m:m;
	var d = now.getDate();
	d=d<10?'0'+d:d;
	var h = now.getHours();
	var mm = now.getMinutes();
	var sec = now.getSeconds();
	var mis = now.getMilliseconds();

	return 'BD'+y+m+d+h+mm+sec+mis;
}

// 4、下单
exports.setorder = (req,res)=>{

	resobj = {};
	// 1 插入dt_order表数据获取自增主键值
	// 1.0  获取收获省市区
	let province = req.body.area.province.value;
	let city = req.body.area.city.value;
	let area = req.body.area.area.value;
	let realamount = req.body.expressMoment+req.body.goodsAmount-0;
	// 获取商品购买的数量
	let cargoodsobj = req.body.cargoodsobj;
	let orderSql = `
				INSERT INTO dt_orders
				(				 
				 order_no
				 ,trade_no
				 ,user_id
				 ,user_name
				 ,payment_id
				 ,payment_fee
				 ,payment_status
				 ,payment_time
				 ,express_id
				 ,express_no
				 ,express_fee
				 ,express_status
				 ,express_time
				 ,accept_name
				 ,post_code
				 ,telphone
				 ,mobile
				 ,email
				 ,area
				 ,address
				 ,message
				 ,remark
				 ,is_invoice
				 ,invoice_title
				 ,invoice_taxes
				 ,payable_amount
				 ,real_amount
				 ,order_amount
				 ,point
				 ,status
				 ,add_time
				 ,confirm_time
				 ,complete_time
				)
				VALUES
				(				 
				 '${fmtdate()}' /* order_no - VARCHAR(100)*/
				 ,'' /* trade_no - VARCHAR(100)*/
				 ,12 /*,req.session.site_user.uid*/ /* user_id - INT(10)*/
				 ,'ivanyb4'/*,'req.session.site_user.uname'*/ /* user_name - VARCHAR(100)*/
				 ,${req.body.payment_id} /* payment_id - INT(10)*/
				 ,0 /* payment_fee - DECIMAL(9, 2)*/
				 ,0 /* payment_status - TINYINT(3)*/
				 ,NOW() /* payment_time - DATETIME*/
				 ,${req.body.express_id} /* express_id - INT(10)*/
				 ,'' /* express_no - VARCHAR(100)*/
				 ,${req.body.expressMoment} /* express_fee - DECIMAL(9, 2)*/
				 ,1 /* express_status - TINYINT(3) 运送状态*/
				 ,NOW() /* express_time - DATETIME*/
				 ,'${req.body.accept_name}' /* accept_name - VARCHAR(50)*/
				 ,'${req.body.post_code}' /* post_code - VARCHAR(20)*/
				 ,'' /* telphone - VARCHAR(30)*/
				 ,'${req.body.mobile}' /* mobile - VARCHAR(20)*/
				 ,'${req.body.email}' /* email - VARCHAR(30)*/
				 ,'${province},${city},${area}' /* area - VARCHAR(100)*/
				 ,'${req.body.address}' /* address - TEXT*/
				 ,'${req.body.message}' /* message - TEXT*/
				 ,'' /* remark - TEXT*/
				 ,0 /* is_invoice - TINYINT(3)*/
				 ,'' /* invoice_title - VARCHAR(100)*/
				 ,0 /* invoice_taxes - DECIMAL(9, 2)*/
				 ,${req.body.goodsAmount} /* payable_amount - DECIMAL(9, 2)*/
				 ,${req.body.goodsAmount} /* real_amount - DECIMAL(9, 2)*/
				 ,${realamount} /* order_amount - DECIMAL(9, 2)*/
				 ,0 /* point - INT(10)*/
				 ,1 /* status - TINYINT(3) 订单状态 1:待付款  2:已付款  3:已发货 4：已完成*/
				 ,NOW() /* add_time - DATETIME*/
				 ,NOW() /* confirm_time - DATETIME*/
				 ,NOW() /* complete_time - DATETIME*/
				);`;	


	execSqlCallBack(req,res,orderSql,(err,datas)=>{
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
		
		// 2 插入dt_order_goods表
		let goodsSql = `select * from dt_channel_article_goods where id in (${req.body.goodsids})`;
		
		execSqlCallBack(req,res,goodsSql,(gerr,gdatas)=>{
			if(gerr){

					resobj.status = ERRORCODE;
					resobj.message = gerr.message;
					res.end(JSON.stringify(resobj));
					return;
				}

			let splitcar =',';
			let lng = gdatas.length;

			let insertValues =``; 

			for (let i = 0; i < lng; i++) {
				if(i>=lng-1){
					splitcar=';';
				}
				insertValues+=`(
							 ${datas.insertId} /* order_id - INT(10)*/
							 ,${gdatas[i].id} /* goods_id - INT(10)*/
							 ,'${gdatas[i].goods_no}' /* goods_no - VARCHAR(50)*/
							 ,'${gdatas[i].title}' /* goods_title - VARCHAR(100)*/
							 ,'${gdatas[i].img_url}' /* img_url - VARCHAR(255)*/
							 ,${gdatas[i].sell_price} /* goods_price - DECIMAL(9, 2)*/
							 ,${gdatas[i].sell_price} /* real_price - DECIMAL(9, 2)*/
							 ,1
							)${splitcar}`;
			};
			

			let ordergoodsSql = `INSERT INTO dt_order_goods
							(							 
							 order_id
							 ,goods_id
							 ,goods_no
							 ,goods_title
							 ,img_url
							 ,goods_price
							 ,real_price
							 ,quantity
							)
							VALUES
							${insertValues}`;
		// console.log(ordergoodsSql);
		execSqlCallBack(req,res,ordergoodsSql,(ierr,idata)=>{
			if(ierr){
					resobj.status = ERRORCODE;
					resobj.message = ierr.message;
					res.end(JSON.stringify(resobj));
					return;
				}

				resobj.status = SUCCESSCODE;
				resobj.message ={orderid:datas.insertId};
				res.end(JSON.stringify(resobj));

		});

		});
	});
}

// 获取订单
exports.getorder =(req,res)=>{

	resobj = {};
	let orderid = req.params.orderid;

	let sql = `select id,order_no,accept_name,area,address
				mobile,order_amount,message,status from dt_orders where id=${orderid}`;

	execQuery(req,res,sql);
}

// 支付
exports.pay= (req,res)=>{
	resobj = {};
	let payed = 2; //支付完成
	let orderid = req.params.orderid;
	let sql = `update dt_orders set status = ${payed},payment_time = NOW() where id=${orderid}`;

	execQuery(req,res,sql);
}

// 7 获取我的交易订单
exports.userorderlist = (req,res)=>{
	resobj = {};
	let uid =0;
	if(req.session && req.session.site_user){
		uid = req.session.site_user.uid;
	}

	let sqlCount = `select count(1) as count from dt_orders where user_id=${uid} `;
	let sqlQuery = `select od.*,case od.status when 1 then '待付款' when 2 then '已付款待发货'
	 when 3 then '已发货待签收' when 4 then '已签收' when 5 then '已取消' end as statusName
	,p.title as paymentTitle,e.title as expressTitle from dt_orders as od 
	left join dt_payment p on (od.payment_id = p.id)
	left join dt_express e on (od.express_id = e.id)
	where od.user_id=${uid} `;

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

	//执行分页数据处理
	execQueryCount(req,res,sqlCount,(pageobj)=>{
		sqlQuery += ` order by id desc 
		limit ${pageobj.skipCount},${pageobj.pageSize} `;
		execQuery(req,res,sqlQuery);
	});
}


// 8 取消订单
exports.cancelorder = (req,res)=>{
	resobj = {};
	let orderid = req.params.orderid;
	let cancelstatus = 5;
	let sql = `update dt_orders set status = ${cancelstatus},complete_time=NOW() where id=${orderid}`;

	execSqlCallBack(req,res,sql,(err,datas)=>{
		if(err){
			resobj.status = ERRORCODE;
			resobj.message = err.message;
			res.end(JSON.stringify(resobj));
			return;
		}

		resobj.status = SUCCESSCODE;
		resobj.message = '订单已取消';
		res.end(JSON.stringify(resobj));
	});
}

// 9 获取订单明细
exports.getorderdetial = (req,res)=>{
	resobj = {};
	let orderid = req.params.orderid;
	let warpObj = {};

	let orderSql = `select od.*,Cast(od.status as Char) as orderstatus,p.title as paymentTitle,
	e.title as expressTitle,
	case od.status when 1 then '待付款' when 2 then '已付款待发货'
	 when 3 then '已发货待签收' when 4 then '已签收' when 5 then '已取消' end as statusName 
	 from dt_orders  od
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

// 10 签收
exports.complate = (req,res)=>{
	resobj = {};
	let orderid = req.params.orderid;
	let complateStatus = 4;
	let sql = `update dt_orders set status = ${complateStatus},complete_time=NOW() where id=${orderid}`;

	execSqlCallBack(req,res,sql,(err,datas)=>{
		if(err){
			resobj.status = ERRORCODE;
			resobj.message = err.message;
			res.end(JSON.stringify(resobj));
			return;
		}

		resobj.status = SUCCESSCODE;
		resobj.message = '签收成功';
		res.end(JSON.stringify(resobj));
	});
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