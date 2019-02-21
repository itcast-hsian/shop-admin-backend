'use strict'

const express = require('express');
let route = express.Router();

const goodsCtrl =  require('../controllers/goodsController.js');

//商品列表数据
route.get('/goods/getlist/',goodsCtrl.getlist);

route.post('/goods/setsession/',(req,res)=>{
	req.session.site_user = {name:'goods 用户'};

	res.end(JSON.stringify({name:'goods 用户'}));
});

route.get('/goods/getvcode/',(req,res)=>{
	let resobj =req.session.site_user;	
	console.log(resobj);
	res.end(JSON.stringify(resobj));
});

// 新增商品
route.post('/goods/add/:tablename',goodsCtrl.add);

// 编辑商品数据
route.post('/goods/edit/:id',goodsCtrl.edit);

// 根据id获取商品数据
route.get('/goods/getgoodsmodel/:id',goodsCtrl.getgoodsmodel);

// 删除数据
route.get('/goods/del/:ids',goodsCtrl.del);

module.exports = route;