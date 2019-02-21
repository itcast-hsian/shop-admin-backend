'use strict'

const express = require('express');

let route = express.Router();

const orderCtrl = require('../controllers/orderController.js');

// 1 获取订单
route.get('/order/getorderlist',orderCtrl.getorderlist);

// 2 获取订单明细
route.get('/order/getorderdetial/:orderid',orderCtrl.getorderdetial);

// 3 更新订单
route.post('/order/updateorder',orderCtrl.updateorder);


module.exports = route;
