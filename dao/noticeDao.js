// 对数据库进行操作
const NoticeModel = require('../models/Notice');
const userDao = require('./userDao');
module.exports = {
    // 创建一条提醒并将用户的hasNewNotice值置为true 
    addNotice(doc, callback){
        NoticeModel.create(doc, function(err){
            callback(err);
            // 添加新提醒时将用户的hasNewNotice字段置为true
            userDao.updateUser({_id: doc.ownerID}, {hasNewNotice: true}, function(err, isSuccess){})
        });
    },
    // 输出时间最近的20条提醒，并将用户的hasNewNotice值置为false 
    getNotices(filter, callback){
        // 按时间最近顺序排序，最大输出20条
        NoticeModel.find(filter, null, {sort: {_id:-1}, limit: 20}, function(err ,res){
            callback(err, res);
            // 获取提醒时将用户的hasNewNotice字段置为false
            userDao.updateUser({_id: filter.ownerID}, {hasNewNotice: false}, function(err, isSuccess){})
        })
    }
}