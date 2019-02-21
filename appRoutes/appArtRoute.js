'use strict'

const express = require('express');

let route = express.Router();

const appCtrl = require('../appControllers/appArtController.js');

// 1.0 获取首页轮播
route.get('/app/getlunbo', appCtrl.getlunbo);

// 1.0 根据条件获取相应的数据
route.get('/app/getartlist/:tablename', appCtrl.getartlist);

// 1.0 根据id获取详情
route.get('/app/getdetial/:tablename/:id', appCtrl.getdetial);

// 4.0 获取商品列表数据
route.get('/app/getgoodslist', appCtrl.getgoodslist);

module.exports = route;
