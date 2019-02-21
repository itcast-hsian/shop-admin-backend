'use strict'

const express = require('express');

const router = express.Router();

const artctrl = require('../controllers/articleController.js');

//根据不同的tablename 获取相应的文章列表
router.get('/article/getlist/:tablename',artctrl.getlist);

// 上传封面图片
router.post('/article/uploadimg',artctrl.uploadimg);

// 上传附件
router.post('/article/uploadfile',artctrl.uploadfile);

// 获取类别数据
router.get('/article/getcategorylist/:tablename',artctrl.getcategorylist);

// 新增文章
router.post('/article/add/:tablename',artctrl.add);

// 编辑文章
router.post('/article/edit/:tablename/:artid',artctrl.edit);

// 根据id获取文章数据
router.get('/article/getarticle/:tablename/:id',artctrl.getarticle);

// 删除数据
router.get('/article/del/:tablename/:ids',artctrl.del);



module.exports = router;