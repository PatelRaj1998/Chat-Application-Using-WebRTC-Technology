const mongoose = require('mongoose');
const ChatSchema  = new mongoose.Schema({
uniqueId :{
    type  : String,
    required : true
} ,
chat :{
    type  : JSON,
    required : true
}
});
const Chat= mongoose.model('Chat',ChatSchema);

module.exports = Chat;