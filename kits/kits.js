'use strict'

 function getClientIp(req) {
        return req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
    };

module.exports = {	
	tableNameLeft:'dt_channel_article_', //文章相关表的前缀
	nodeServerDomain:'http://127.0.0.1:8899',
    getClientIP:getClientIp   
}