'use strict'

const express = require('express');
const route = express.Router();

const commentCtrl = require('../siteControllers/validateCommentControllers.js');



// 1 提交评论  /validate 开头的表示要登录验证
route.post('/validate/comment/post/:tablename/:artid',commentCtrl.postComment);

// 2 分页获取评论
route.get('/comment/getbypage/:tablename/:artid',commentCtrl.getbypage);

// 4 获取购物车商品数据
route.get('/comment/getshopcargoods/:ids',commentCtrl.getshopcargoods);

module.exports = route;