'use strict'

const express = require('express');

let route = express.Router();

const siteArtCtrl = require('../siteControllers/articleController.js');

// 1.0 获取contentsildtophot.vue组件需要的数据
route.get('/article/getsildtophot/:tablename', siteArtCtrl.getsildtophot);
 

// 2.0 获取相应频道中的每个一级分类下的文章
route.get('/article/getarticles/:tablename',siteArtCtrl.getarticles);

// 3.0 获取某个分类下的所有文章列表
route.get('/article/getartlist/:tablename/:cateid',siteArtCtrl.getartlist);


// 4.0 根据文章ID获取文章详情
route.get('/article/getartdetial/:tablename/:artid',siteArtCtrl.getartdetial);

module.exports = route;
