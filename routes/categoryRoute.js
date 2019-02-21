'use strict'

const express = require('express');

let route = express.Router();

const cateCtrl = require('../controllers/categoryController.js');

// 1.0 获取频道下的分类数据
route.get('/category/getlist/:tablename', cateCtrl.getlist);

// 2.0 新增分类
route.post('/category/add/:tablename', cateCtrl.add);

// 3.0 获取分类对象
route.get('/category/getcategorymodel/:cateid',cateCtrl.getCategoryModel);
// 3.0.1 修改数据
route.post('/category/edit/:cateid',cateCtrl.edit);

module.exports = route;
