'use strict'

const express = require('express');
const route = express.Router();

const goodsCtrl = require('../siteControllers/goodsControllers.js');



// 1 获取商品首页顶部的 轮播图，置顶，分类导航数据
route.get('/goods/gettopdata/:tablename',goodsCtrl.gettopdata);

// 2 商品首页按照分组展示
route.get('/goods/getgoodsgroup/',goodsCtrl.getgoodsgroup);


// 3 根据分类获取商品数据
// 传入 cateid：商品分类id
route.get('/goods/getgoodsbycateid/:cateid',goodsCtrl.getgoodsbycateid);

// 4 根据商品id获取商品详情数据
route.get('/goods/getgoodsinfo/:goodsid',goodsCtrl.getgoodsinfo);

module.exports = route;