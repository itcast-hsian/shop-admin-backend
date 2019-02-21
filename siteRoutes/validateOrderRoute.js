'use strict'

const express = require('express');
const route = express.Router();

const orderCtrl = require('../siteControllers/validateOrderControllers.js');

// 1 获取支付方式  /validate 开头的表示要登录验证
route.get('/validate/order/getpayments',orderCtrl.getpayments);


// 2 获取快递方式  /validate 开头的表示要登录验证
route.get('/validate/order/getexpresslist',orderCtrl.getexpresslist);

// 3 根据勾选的商品id字符串，获取商品数据  /validate 开头的表示要登录验证
route.get('/validate/order/getgoodslist/:goodsids',orderCtrl.getgoodslist);

// 4 下单
route.post('/validate/order/setorder',orderCtrl.setorder);


// 5 根据id获取订单信息
route.get('/validate/order/getorder/:orderid',orderCtrl.getorder);


// 6 支付
route.get('/validate/order/pay/:orderid',orderCtrl.pay);

// 7 获取我的交易订单
route.get('/validate/order/userorderlist',orderCtrl.userorderlist);

// 8 取消订单
route.get('/validate/order/cancelorder/:orderid',orderCtrl.cancelorder);

// 9 获取订单明细
route.get('/validate/order/getorderdetial/:orderid',orderCtrl.getorderdetial);

// 10 签收
route.get('/validate/order/complate/:orderid',orderCtrl.complate);


module.exports = route;