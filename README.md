# 商城后台资源


## 说明

route和controller文件夹中的所有文件负责处理后台管理系统业务，路径以/admin开头、

siteroute和sitecontrollers中的所有文件负责处理前台展示系统业务，路径以/site开头

> 接口文档：
>
> https://itcast-hsian.github.io/shop-admin-docs/adminapi.html



## 部署

### 环境

- mysql 5.6 +  `mysql使用集成环境phpstudy`
- nodejs 8 +



### 克隆代码

```
cd E:

git clone https://github.com/itcast-hsian/shop-admin-backend.git
```



### 导入数据

使用`navicat`，把项目根目录中的`newshop.sql`文件导入到数据库



### 安装依赖

```
cd shop-admin-backend

npm installl
```



### 启动

```
npm start
```

测试接口，使用浏览器访问 http://127.0.0.1:8899/admin/account/getlist?pageIndex=1&pageSize=5，



如果页面由数据返回代表后台安装成功。



#### 数据库账号密码

默认链接数据库的账号密码是`phpstudy`的初始账户密码 `root/root`，如果是其他账号密码需要在`app.js`第`11`行中修改



