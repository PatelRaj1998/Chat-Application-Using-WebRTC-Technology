const { update } = require("../models/chat");

module.exports = function initiateServer(wss){

//all connected to the server users 
var users = {};
var personNames = {};
var uIds = {};

const Chat = require("../models/chat");
const FriendsList = require("../models/friendsList");
const Users = require("../models/user");

//when a user connects to our sever 
wss.on('connection', function(connection) {
  
   console.log("User connected");
  
   //when server gets a message from a connected user
   connection.on('message', function(message) { 
  
      var data; 
      //accepting only JSON messages 
      try {
         data = JSON.parse(message); 
      } catch (e) { 
         console.log("Invalid JSON"); 
         data = {}; 
      } 
      
      //switching type of the user message 
      switch (data.type) { 
         //when a user tries to login 
      
         case "login": 
            console.log("User logged", data.personName + " - " + data.name); 

            //if anyone is logged in with this username then refuse 
            if(users[data.name]) { 
               sendTo(connection, { 
                  type: "login", 
                  success: false 
               }); 
            } else { 
               //save user connection on the server 
               users[data.name] = connection;
               personNames[data.name] = data.personName;
               uIds[data.name] = data.uId;

               connection.name = data.name; 
          
               sendTo(connection, { 
                  type: "login", 
                  success: true 
               });
               sendUserInfo(connection);
               sendUserFriendList(connection);
            } 
        
            break; 
        
         case "offer": 
            //for ex. UserA wants to call UserB
            if(!users[data.name]) {    //if no such user exists
               //console.log("no such user exists");
               sendTo(connection, { 
                  type: "error",
                  message: "User "+ data.name +" doesn't exist!",
               });
            } else {
               console.log("Sending an offer to: ", data.name);
               //if UserB exists then send him offer details 
               var conn = users[data.name];
               if(conn != null) { 
                  //setting that UserA connected with UserB 
                  connection.otherName = data.name; 
                  sendTo(conn, { 
                     type: "offer", 
                     offer: data.offer, 
                     name: connection.name,
                     personName: personNames[connection.name],
                     uId: uIds[connection.name]
                  }); 
               }
            }
            break;  
         
         case "offerVideo": 
            //for ex. UserA wants to call UserB 
            console.log("Sending offerVideo to: ", data.name); 
        
            //if UserB exists then send him offer details 
            var conn = users[data.name];
        
            if(conn != null) { 
               //setting that UserA connected with UserB 
               connection.otherName = data.name; 
          
               sendTo(conn, { 
                  type: "offerVideo", 
                  offer: data.offer, 
                  name: connection.name 
               }); 
            } 
        
            break; 
            
         case "offerAudio": 
            //for ex. UserA wants to call UserB 
            console.log("Sending offerAudio to: ", data.name); 
        
            //if UserB exists then send him offer details 
            var conn = users[data.name];
        
            if(conn != null) { 
               //setting that UserA connected with UserB 
               connection.otherName = data.name; 
          
               sendTo(conn, { 
                  type: "offerAudio", 
                  offer: data.offer, 
                  name: connection.name 
               }); 
            } 
        
            break;  

         case "answer":
            console.log("Sending answer to: ", data.name); 
            //for ex. UserB answers UserA 
            var conn = users[data.name]; 
        
            if(conn != null) { 
               connection.otherName = data.name; 
               sendTo(conn, { 
                  type: "answer", 
                  answer: data.answer,
                  personName: personNames[connection.name], /* Sending other persons name and uId to the client */ 
                  uId: uIds[connection.name]
               }); 
            }            
            break;  
         
         case "answerAudio":
            console.log("Sending answerAudio to: ", data.name); 
            //for ex. UserB answers UserA 
            var conn = users[data.name]; 
         
            if(conn != null) { 
               connection.otherName = data.name; 
               sendTo(conn, { 
                  type: "answerAudio", 
                  answer: data.answer,
                  personName: personNames[connection.name], /* Sending other persons name and uId to the client */ 
                  uId: uIds[connection.name]
               }); 
            }            
            break;  
            
         case "answerVideo":
            console.log("Sending answerVideo to: ", data.name); 
            //for ex. UserB answers UserA 
            var conn = users[data.name]; 
         
            if(conn != null) { 
               connection.otherName = data.name; 
               sendTo(conn, { 
                  type: "answerVideo", 
                  answer: data.answer,
                  personName: personNames[connection.name], /* Sending other persons name and uId to the client */ 
                  uId: uIds[connection.name]
               }); 
            }            
            break;  
            
         case "candidate": 
            console.log("Sending candidate to:",data.name); 
            var conn = users[data.name];  
        
            if(conn != null) { 
               sendTo(conn, { 
                  type: "candidate", 
                  candidate: data.candidate 
               });
            } 
        
            break; 
         case "candidateAudio": 
            console.log("Sending candidateAudio to:",data.name); 
            var conn = users[data.name];  
        
            if(conn != null) { 
               sendTo(conn, { 
                  type: "candidateAudio", 
                  candidate: data.candidate 
               });
            } 
        
            break; 
         
         case "candidateVideo": 
            console.log("Sending candidateVideo to:",data.name); 
            var conn = users[data.name];  
        
            if(conn != null) { 
               sendTo(conn, { 
                  type: "candidateVideo", 
                  candidate: data.candidate 
               });
            } 
        
            break; 
        
         case "leave": 
            console.log("Disconnecting from", data.name); 
            var conn = users[data.name]; 
            conn.otherName = null; 
        
            //notify the other user so he can disconnect his peer connection 
            if(conn != null) { 
               sendTo(conn, { 
                  type: "leave" 
               }); 
            }  
        
            break;  
        
         case "leaveAudio": 
            console.log("Disconnecting audio from", data.name); 
            var conn = users[data.name]; 
            conn.otherName = null; 
        
            //notify the other user so he can disconnect his peer connection 
            if(conn != null) { 
               sendTo(conn, { 
                  type: "leaveAudio" 
               }); 
            }  
        
            break; 

         case "leaveVideo": 
            console.log("Disconnecting video from", data.name); 
            var conn = users[data.name]; 
            conn.otherName = null; 
        
            //notify the other user so he can disconnect his peer connection 
            if(conn != null) { 
               sendTo(conn, { 
                  type: "leaveVideo" 
               }); 
            }  
        
            break; 
         
         case "getUserDetails": 
            //var conn = users[data.name]; 
            sendUserDetials(connection, data.personUserName);

            break;

         case "saveFriend": 
            //var conn = users[data.name];
            console.log(connection.name); 
            console.log(data.personUserName); 
            saveFriendIfNew(connection.name, data.personUserName, true);

            break; 

         case "storeMessage": 
            //console.log(data.myUserName, " talking to ", data.name); 
            Chat.findOne({uniqueId : data.myUserName}).exec((err,chatExists)=>{
               if(chatExists) //if the chat exists, then just add into that chat
               {
                  //save in db
                  Chat.update(
                     {uniqueId: data.myUserName},
                     {$push: {chat : {id:data.msgName, message:data.msg}}}
                  )
                  .then((value)=>{
                     //console.log("Successfully updated. check the messages in db");
                  })
                  .catch(value=> console.log("Error while adding message to db"));
               }
               else //for new user
               {
                  //save in db
                  var chatMessage = {id:data.msgName, message:data.msg};
                  const newChat = new Chat({
                     uniqueId: data.myUserName,
                     chat : [chatMessage]
                  });
                  newChat.save()
                  .then((value)=>{
                     //console.log("Successfully saved. check the db");
                  })
                  .catch(value=> console.log("error while first time adding message to db"));
               }
            })
            break; 

         default: 
            sendTo(connection, { 
               type: "error", 
               message: "Command not found: " + data.type 
            }); 
        
            break; 
      }  
   });
  
   //when user exits, for example closes a browser window 
   //this may help if we are still in "offer","answer" or "candidate" state 
   connection.on("close", function() { 
      
      if(connection.name) { 
      delete users[connection.name]; 
    
         if(connection.otherName) { 
            console.log("Disconnecting from ", connection.otherName);
            var conn = users[connection.otherName]; 
            conn.otherName = null;  
            //conn.name = null;

            if(conn != null) { 
               sendTo(conn, { 
                  type: "leave" 
               });
            }  
         } 
      }
   });  
   connection.send(JSON.stringify("Hello world")); 
});  
function saveFriendIfNew(connectionName, otherUserName, friendFlag)
{
   FriendsList.findOne({userName : connectionName}).exec((err,friendListExists)=>{
      //console.log("friendListExists: " + friendListExists);
      if(friendListExists) //if the FriendsList exists, then just add into that FriendsList
      {
         //checking if that friend exist in the database, if it exists then just need to change the flag
         FriendsList.findOne({ "userName": connectionName, "friends.friendsUserName": otherUserName },{ "friends.$": 1, _id : 0 }).exec((err, updateThis)=>{
            if(updateThis)
            {
               FriendsList.updateOne(
                  { "userName": connectionName, "friends.friendsUserName": otherUserName },
                  {$set: { "friends.$.friend" : friendFlag }} //saving if unique by addToSet
               )
               .then((value)=>{
                  //console.log("Successfully updated. check the friendList in db");
               })
               .catch(value=> console.log("Error while changing a flag from db"));
               
               /*
               //removing
               FriendsList.deleteOne(
                  { "userName": connectionName, "friends.friendsUserName": otherUserName }
               )
               .then((value)=>{
                  console.log("Successfully updated the flag. check the friendList in db");
               })
               .catch(value=> console.log("Error while changing a flag of a friend in db"));
               */
               //adding
               /*
               FriendsList.update(
                  {userName: connectionName},
                  {$addToSet: {friends : {friendsUserName:otherUserName, friend: friendFlag}}} //saving if unique by addToSet
               )
               .then((value)=>{
                  //console.log("Successfully updated. check the friendList in db");
               })
               .catch(value=> console.log("Error while adding a friend to db"));
               */
            }
            else{
               //add it
               FriendsList.update(
                  {userName: connectionName},
                  {$addToSet: {friends : {friendsUserName:otherUserName, friend: friendFlag}}} //saving if unique by addToSet
               )
               .then((value)=>{
                  //console.log("Successfully updated. check the friendList in db");
               })
               .catch(value=> console.log("Error while adding a friend to db"));
            }
         })
         
      }
      else //for new user
      {
         //check if that friend exists. if it does then don't add 
         //save in db
         console.log("new user");
         var friendsUserName = {friendsUserName:otherUserName, friend:friendFlag};
         const newFriend = new FriendsList({
            userName: connectionName,
            friends : [friendsUserName]
         });
         newFriend.save()
         .then((value)=>{
            //console.log("Friend successfully saved. check the db");
         })
         .catch(value=> console.log("error while first time adding message to db"));
      }
   })
}
function sendUserInfo(connection)
{
   console.log("sending details for " + connection.name);
   var finalResult = [];
   Users.find({email: connection.name})
   .then((result) =>{
      //save the result into finalResult
      //console.log(result[0].email);
      var myObj = {
         "myUserName": connection.name, 
         "myName": result[0].name, 
         "myUid": result[0].uniqueId
      };
      finalResult.push(myObj);
      if(connection != null) { 

         sendTo(connection, { 
            type: "myDetails",
            message: finalResult,
         });
      }
   })
   .catch(value=> {
      console.log("error while fetching the data for single person from db users");
      sendTo(connection, { 
         type: "error",
         message: "User "+ connection.name +" doesn't exist!",
      });
   });
}
function sendUserFriendList(connection)
{
   console.log("Sending friendList for " + connection.name);
   //FriendsList.findOne({userName : connection.name}).exec((err,friendListExists)=>{
      //if(friendListExists)
      //{
         FriendsList.find({userName: connection.name})
         .then((result) =>{
            if(result[0].friends.length > 0)
               sendUsersDetials(connection, result[0].friends);
            else
            {
               sendTo(connection, { 
                  type: "savedUser",
                  message: []
               });
            }
         })
         .catch(value=> console.log("error while fetching the data from db friendList"));
      //}
      //else{
         //console.log("No friends yet");
      //}
   //});
}
//multi user
function sendUsersDetials(connection, result)
{
   var finalResult = [];   
   var resultLength = result.length;

   var loop = function(result, i){
      if(i < resultLength){
         item = result[i];
         var otherUsername = item.friendsUserName;
         var friendsFlag = item.friend;
         Users.find({email: otherUsername})
         .then((res) =>{
            //save the result into finalResult
            var myObj = {
               "friendsUserName": res[0].email, 
               "friendsName": res[0].name, 
               "friendsUid": res[0].uniqueId,
               "friendsFlag": friendsFlag
            };
            finalResult.push(myObj);
            loop(result, i+1);
         })
         .catch(value=> console.log("error while fetching the data for multiple people from db users"));
      }
      else
      {
         if(connection != null) { 
            sendTo(connection, { 
               type: "savedUser",
               message: finalResult
            });
         }
      }
   }
   loop(result, 0);
}
//single user
function sendUserDetials(connection, personUserName)
{
   console.log("sending details for " + personUserName);
   var finalResult = [];
   Users.find({email: personUserName})
   .then((result) =>{
      //save the result into finalResult
      //console.log(result[0].email);
      var myObj = {
         "friendsUserName": personUserName, 
         "friendsName": result[0].name, 
         "friendsUid": result[0].uniqueId
      };
      finalResult.push(myObj);
      if(connection != null) { 
         console.log("sending user details to " + connection.name);
         saveFriendIfNew(connection.name, personUserName, true);
         saveFriendIfNew(personUserName, connection.name, false);

         sendTo(connection, { 
            type: "userDetails",
            message: finalResult,
            friends: true
         });
      }
   })
   .catch(value=> {
      console.log("error while fetching the data for single person from db users");
      sendTo(connection, { 
         type: "error",
         message: "User "+ personUserName +" doesn't exist!",
      });
   });

   console.log("sending details for " + connection.name);
   var finalResult1 = [];
   Users.find({email: connection.name})
   .then((result) =>{
      //save the result into finalResult1
      //console.log(result[0].email);
      var myObj1 = {"friendsUserName": connection.name, 
         "friendsName": result[0].name, 
         "friendsUid": result[0].uniqueId};
      finalResult1.push(myObj1);
      var peerConnection = users[personUserName];
      if(peerConnection != null) {
         console.log("sending user details to " + personUserName);
         //send it to other peer as well, so it would be as a friend request
         sendTo(peerConnection, { 
            type: "userDetails",
            message: finalResult1,
            friends: false
         });
      }
   })
   .catch(value=> 
      {
         //this catch should nevver execute
         console.log("error while fetching the data for single person from db users");
         sendTo(connection, { 
            type: "error",
            message: "User "+ personUserName +" doesn't exist!",
         });
      });
}
function sendTo(connection, message) { 
   connection.send(JSON.stringify(message)); 
}
};