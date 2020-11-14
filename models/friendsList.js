const mongoose = require('mongoose');
const FriendsListSchema  = new mongoose.Schema({
userName :{
    type  : String,
    required : true
} ,
friends :{
    type  : JSON,
    required : true
}
});
const FriendsList= mongoose.model('FriendsList',FriendsListSchema);

module.exports = FriendsList;