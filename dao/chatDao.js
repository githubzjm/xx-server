// 对数据库进行操作
const { send } = require('process');
const ChatModel = require('../models/Chat');
const UserModel = require('../models/User');

module.exports = {
    // 判断聊天双方的聊天框数据是否已存在
    isChatExist(owner0, owner1, callback){
        ChatModel.exists({$or: [{owners: [owner0, owner1]}, {owners: [owner1, owner0]}]}, function(err, res){
            callback(err, res);
        })
    },
    // 创建一条聊天框数据，并更新聊天双方的chaters字段
    initChat(owner0, owner1, callback){
        ChatModel.create({
            owners: [owner0, owner1],
          }, function(err, res){
            callback(err, res);
            // 添加聊天对象ID到User的chaters中
            UserModel.updateOne({_id: owner0}, {$addToSet: {chaters: owner1}}, function(err, res){});
            UserModel.updateOne({_id: owner1}, {$addToSet: {chaters: owner0}}, function(err, res){});
        });
    },
    // 添加信息到聊天框内，并将相应的newMsgCount字段增1
    addMsg(sender_id, receiver_id, msg, callback){
        ChatModel.findOneAndUpdate(
            {$or: [{owners: [sender_id, receiver_id]}, {owners: [receiver_id, sender_id]}]}, 
            {$push: {msgs: {owner: sender_id, msg: msg}}}, 
            {new: true, useFindAndModify: false}, // 返回更新后的文档
            function(err, res){ 
                // updateOne(): res返回的是更新情况，不是更新的文档; findOneAndUpdate: res返回的是文档
                callback(err);
                // 对应的新消息数量字段加一
                var key = "newMsgCount"+res.owners.indexOf(receiver_id);
                ChatModel.updateOne({_id: res._id}, {$inc: {[key]: 1}}, function(err){});
            }
        )
    },
    // 获取聊天框，并归零相应的newMsgCount字段 
    getChat(sender_id, receiver_id, callback){
        ChatModel.findOne({$or: [{owners: [sender_id, receiver_id]}, {owners: [receiver_id, sender_id]}]}, null, 
            function(err, res){
                callback(err, res);
                // 获取聊天后归零新消息数目
                var key = "newMsgCount"+res.owners.indexOf(sender_id);
                ChatModel.updateOne({_id: res._id}, {$set: {[key]: 0}}, function(err){});
            }
        )
    },
    // 获取某个用户的所有聊天记录，并只返回每项聊天记录的最后一条消息 
    getChats(_id, callback){
        UserModel.findOne({_id: _id}, "chaters", function(err, res){
            var possible_owners = [];
            res.chaters.forEach(function(value, index){
                possible_owners.push([_id, value]);
                possible_owners.push([value, _id]);                
            });
            ChatModel.find({owners: {$in: possible_owners}}, null, function(err, res){
                var res_min = [];
                res.forEach(function(value, index){
                    value.msgs = value.msgs.slice(-1);
                    res_min.push(value);
                })
                callback(err, res_min);
            })
        })
    }

}