const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const app = express();
const expressEjsLayout = require('express-ejs-layouts')
const flash = require('connect-flash');
const session = require('express-session');
//const server = require("server");
const passport = require("passport");
const Chat = require("./models/Chat");
const allChatStorage = [];

//passport config:
require('./config/passport')(passport)
//mongoose
mongoose.connect('mongodb://localhost/test',{useNewUrlParser: true, useUnifiedTopology : true})
.then(() => console.log('Connected. Please visit http://localhost:3000'))
.catch((err)=> console.log(err));

//EJS
app.set('view engine','ejs');
app.use(expressEjsLayout);
//BodyParser
app.use(express.urlencoded({extended : false}));
//express session
app.use(session({
    secret : 'secret',
    resave : true,
    saveUninitialized : true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req,res,next)=> {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error  = req.flash('error');
    next();
    })
    
//Routes
app.use('/',require('./routes/index'));
app.use('/users',require('./routes/users'));
app.use(express.static(__dirname + '/public'));

//require our websocket library 
var WebSocketServer = require('ws').Server;
 
//creating a websocket server at port 9090 
var wss = new WebSocketServer({port: 9090}); 

//all connected to the server users 
var users = {};

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
            console.log("User logged", data.name); 
        
            //if anyone is logged in with this username then refuse 
            if(users[data.name]) { 
               sendTo(connection, { 
                  type: "login", 
                  success: false 
               }); 
            } else { 
               //save user connection on the server 
               users[data.name] = connection; 
               connection.name = data.name; 
          
               sendTo(connection, { 
                  type: "login", 
                  success: true 
               }); 
            } 
        
            break; 
        
         case "offer": 
            //for ex. UserA wants to call UserB 
            console.log("Sending an offer to: ", data.name); 
        
            //if UserB exists then send him offer details 
            var conn = users[data.name];
        
            if(conn != null) { 
               //setting that UserA connected with UserB 
               connection.otherName = data.name; 
          
               sendTo(conn, { 
                  type: "offer", 
                  offer: data.offer, 
                  name: connection.name 
               }); 
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
                  answer: data.answer 
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
                     //console.log("Successfully updated. check the db");
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
   connection.send("Hello world"); 
});  

function sendTo(connection, message) { 
   connection.send(JSON.stringify(message)); 
}

app.listen(3000); 
