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
               saveFriendIfNew(connection, data.name);
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
            saveFriendIfNew(connection, data.name);
            
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
            saveFriendIfNew(connection, data.name);
            
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
            saveFriendIfNew(connection, data.name);
            
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
function saveFriendIfNew(connection, otherUserName)
{
   //console.log("connection: " + connection.name + " otherUserName: " + otherUserName);
   FriendsList.findOne({userName : connection.name}).exec((err,friendListExists)=>{
      //console.log("friendListExists: " + friendListExists);
      if(friendListExists) //if the FriendsList exists, then just add into that FriendsList
      {
         //save in db
         FriendsList.update(
            {userName: connection.name},
            {$addToSet: {friends : {friendsUserName:otherUserName}}} //saving if unique by addToSet
         )
         .then((value)=>{
            //console.log("Successfully updated. check the friendList in db");
         })
         .catch(value=> console.log("Error while adding a friend to db"));
      }
      else //for new user
      {
         //check if that friend exists. if it does then don't add 
         //save in db
         var friendsUserName = {friendsUserName:otherUserName};
         const newFriend = new FriendsList({
            userName: connection.name,
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
function sendUserFriendList(connection)
{
   console.log("Sending friendList for " + connection.name);
   FriendsList.findOne({userName : connection.name}).exec((err,friendListExists)=>{
      if(friendListExists)
      {
         var finalResult = [];
         FriendsList.find({userName: connection.name})
         .then((result) =>{
            sendUsersDetials(connection, result[0].friends);
         })
         .catch(value=> console.log("error while fetching the data from db friendList"));
      }
      else{
         //console.log("No friends yet");
      }
   });
}
//multi user
function sendUsersDetials(connection, result)
{
   var finalResult = [];
   result.forEach(function(item, i) {
      var otherUsername = item.friendsUserName;
      Users.find({email: otherUsername})
      .then((result) =>{
         //save the result into finalResult
         //console.log(result[0].email);
         var myObj = {"friendsUserName": result[0].email, 
            "friendsName": result[0].name, 
            "friendsUid": result[0].uniqueId};
         finalResult.push(myObj);
         if(i == result.length - 1)
         {
            if(connection != null) { 
               sendTo(connection, { 
                  type: "savedUser",
                  message: finalResult
               });
            }
         }
      })
      .catch(value=> console.log("error while fetching the data for multiple people from db users"));
  });
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
      var myObj = {"friendsUserName": personUserName, 
         "friendsName": result[0].name, 
         "friendsUid": result[0].uniqueId};
      finalResult.push(myObj);
      if(connection != null) { 
         console.log("sending user details to " + connection.name);
         sendTo(connection, { 
            type: "userDetails",
            message: finalResult,
            friends: true
         });
      }
   })
   .catch(value=> console.log("error while fetching the data for single person from db users"));

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
   .catch(value=> console.log("error while fetching the data for single person from db users"));
   
}
function sendTo(connection, message) { 
   connection.send(JSON.stringify(message)); 
}
};