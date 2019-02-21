# 商城后台资源



## 说明

route和controller文件夹中的所有文件负责处理后台管理系统业务，路径以/admin开头、

siteroute和sitecontrollers中的所有文件负责处理前台展示系统业务，路径以/site开头

> 接口文档：
>
> https://itcast-hsian.github.io/shop-admin-docs/adminapi.html



## 部署



### 环境

- mysql 5.6 +
- nodejs 8 +

> mysql可以使用集成环境phpstudy/wamp/lamp等



### 导入数据库

1.运行mysql（phpstudy / wamp / lamp）

2.在mysql中新建`newshop`数据库，以Navicat 为例：

 ![image](https://github.com/itcast-hsian/shop-admin/tree/master/screenshots/database.png)

3.使用 [dbForge Studio for MySQL](https://www.devart.com/dbforge/mysql/studio/download.html) 工具导入`dtcmsdb5 20171023 1442.sql`到`newshop`



### 运行后台

1.克隆代码到本地

```
git clone https://github.com/itcast-hsian/shop-admin.git
```

2.安装依赖

```
cd shop-admin
```

```
npm installl
```

3.测试接口

```
http://127.0.0.1:8899/admin/account/getlist?pageIndex=1&pageSize=5
```

查看是否成功返回数据



