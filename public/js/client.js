var connection = new WebSocket('ws://localhost:9090'); //192.168.86.49
var name = "";

var otherUsernameInput = document.querySelector('#otherUsernameInput'); 

var connectionDictionary = [];

var myConnection, connectedUser;

var hangUpBtnAudio = document.querySelector('#hangUpBtnAudio');
var hangUpBtnVideo = document.querySelector('#hangUpBtnVideo');
var localAudio = document.querySelector('#localAudio'); 
var remoteAudio = document.querySelector('#remoteAudio'); 
var localVideo = document.querySelector('#localVideo'); 
var remoteVideo = document.querySelector('#remoteVideo'); 
var callPageAudio = document.querySelector('#callPageAudio');
var callPageVideo = document.querySelector('#callPageVideo'); 
callPageAudio.style.display = "none";
callPageVideo.style.display = "none";
var audioStream; 
var videoStream;

sessionStorage.user = JSON.stringify({name: "John"});

// sometime later
let user = JSON.parse( sessionStorage.user );
console.log(user);

//on load of website
function loginFunction(username) {
   console.log("Logging in as " + username);
   name=username;
   if(username.length > 0) { 
      send({ 
         type: "login", 
         name: username 
      }); 
   };
}
//handle messages from the server 
connection.onmessage = function (message) { 
   //console.log("Got message", message.data); 
   var data = JSON.parse(message.data); 
	
   switch(data.type) { 
      case "login": 
         onLogin(data.success); 
         break; 
      case "offer": 
         onOffer(data.offer, data.name); 
         break; 
      case "offerVideo": 
         onOfferVideo(data.offer, data.name); 
         break; 
      case "offerAudio": 
         onOfferAudio(data.offer, data.name); 
         break; 
      case "answer":
         onAnswer(data.answer); 
         break;
      case "candidate": 
         onCandidate(data.candidate); 
         break;
      case "leaveAudio":
         handleLeaveAudio();
      case "leaveVideo":
         handleLeaveVideo();
      default: 
         break; 
   } 
}; 

//when a user logs in 
function onLogin(success) { 

   if (success === false) { 
      alert("oops...try a different username"); 
      //send the user back with an error message
   } else { 
      //createRTCPeerConnectionObject(name);
   } 
};

/*
   Messaging RTCPeerConnection
*/
function createRTCPeerConnectionObject (otherUsername) {  
   //creating our RTCPeerConnection object 
   var configuration = { 
      "iceServers": [{ "url": "stun:stun.1.google.com:19302" }] 
   }; 
   
   myConnection = new webkitRTCPeerConnection(configuration, { 
      optional: [{RtpDataChannels: true}] 
   }); 
   
   //setup ice handling 
   //when the browser finds an ice candidate we send it to another peer 
   myConnection.onicecandidate = function (event) { 
      if (event.candidate) { 
         send({ 
            type: "candidate", 
            candidate: event.candidate 
         });
      } 
   }; 
   connectedUser = otherUsername;

   connectionDictionary.push({
      loginName: otherUsername,
      RTCPeerConnection: myConnection,
      RTCDataChannel: "",
      RTCPeerConnectionAudio: "",
      RTCPeerConnectionVideo: ""
   });
   openDataChannel(otherUsername);
}
/* 
   Audio call RTCPeerConnection object
*/
function createRTCPeerConnectionObjectForAudio(otherUsername, callback)
{
   callPageAudio.style.display = "block";
   //getting local audio stream 
   navigator.webkitGetUserMedia({ video: false, audio: true }, function (myStream) { 
      audioStream = myStream; 
      
      //displaying local audio stream on the page
      localAudio.srcObject = audioStream;
      
      //using Google public stun server 
      var configuration = { 
         "iceServers": [{ "url": "stun:stun2.1.google.com:19302" }] 
      }; 

      myConnection = new webkitRTCPeerConnection(configuration); 
      
      // setup stream listening 
      myConnection.addStream(audioStream); 
      
      //when a remote user adds stream to the peer connection, we display it 
      myConnection.onaddstream = function (e) { 
         //remoteAudio.src = window.URL.createObjectURL(e.stream); 
         remoteAudio.srcObject = e.stream;
      }; 
      
      // Setup ice handling 
      myConnection.onicecandidate = function (event) { 
         if (event.candidate) { 
            send({ 
               type: "candidate", 
            }); 
         } 
      };
      connectedUser = otherUsername;
      var temp = connectionDictionary.find( ({ loginName }) => loginName === otherUsername);
      temp.RTCPeerConnectionAudio = myConnection;
      callback();
   }, function (error) { 
      console.log(error); 
      callback();
   }); 
}
/* 
   Video call RTCPeerConnection object
*/
function createRTCPeerConnectionObjectForVideo(otherUsername, callback)
{
   callPageVideo.style.display = "block";
   //getting local video stream 
   navigator.webkitGetUserMedia({ video: true, audio: true }, function (myStream) {
      videoStream = myStream; 
      
      //displaying local video stream on the page 
      //localVideo.src = window.URL.createObjectURL(videoStream);
      //const mediaStream = new MediaStream();
      localVideo.srcObject = videoStream;
      
      //using Google public stun server 
      var configuration = { 
         "iceServers": [{ "url": "stun:stun2.1.google.com:19302" }]
      }; 
      
      var myConnection = new webkitRTCPeerConnection(configuration); 

      // setup stream listening 
      myConnection.addStream(videoStream); 
      //when a remote user adds stream to the peer connection, we display it 
      myConnection.onaddstream = function (e) { 
         //remoteVideo.src = window.URL.createObjectURL(e.stream); 
         remoteVideo.srcObject = e.stream;
      };
      
      // Setup ice handling 
      myConnection.onicecandidate = function (event) { 
         if (event.candidate) { 
            send({ 
               type: "candidate", 
               candidate: event.candidate 
            }); 
         } 
      };  
      connectedUser = otherUsername;
      var temp = connectionDictionary.find( ({ loginName }) => loginName === otherUsername);
      temp.RTCPeerConnectionVideo = myConnection;
      callback();
   }, function (error) { 
      console.log(error); 
      callback();
   }); 
}
//connection.onopen = () => connection.send(JSON.stringify('Connected'));

connection.onopen = function () { 
   console.log("Connected to the signaling server"); 
}; 

connection.onerror = function (err) { 
   console.log("Got error. Maybe server isn't running.", err); 
};
 
// Alias for sending messages in JSON format 
function send( message) {
   if (connectedUser) { 
      message.name = connectedUser; 
   }
   // Wait until the state of the socket is not ready and send the message when it is...
   waitForSocketConnection(connection, function(){
      connection.send(JSON.stringify(message));
  });
};
// Make the function wait until the connection is opened...
function waitForSocketConnection(connection, callback){
   setTimeout(
       function () {
           if (connection.readyState === 1) {
               //console.log("Connection is made")
               if (callback != null){
                   callback();
               }
           } else {
               //console.log("wait for connection...")
               waitForSocketConnection(connection, callback);
           }

       }, 5); // wait 5 milisecond for the connection...
}

//setup a peer connection with another user 
function establishConnection() {
   var otherUsernameInput = document.getElementById('otherUsernameInput');
   var otherUsername = otherUsernameInput.value;
   if(name==otherUsername){
      alert("Cannot establish connection to yourself");
      return;
   }
   else if(connectionDictionary.find(({ loginName }) => loginName === otherUsername))
   {
      myConnection = connectionDictionary.find(({ loginName }) => loginName === otherUsername).RTCPeerConnection;
   }
   else{
      createRTCPeerConnectionObject(otherUsername);
      myConnection = connectionDictionary.find(({ loginName }) => loginName === otherUsername).RTCPeerConnection;
   }
   connectedUser = otherUsername;
   if (otherUsername.length > 0) { 
      //make an offer 
      myConnection.createOffer(function (offer) { 
         send({ 
            type: "offer", 
            offer: offer 
         }); 
			
         myConnection.setLocalDescription(offer);
         addMessagingWindowForParticularUser(otherUsername);
      }, function (error) { 
         alert("An error has occurred."); 
      }); 
   }
   closeForm(); 
}

function openForm() {
  document.getElementById("loginPopup").style.display="block";
  document.getElementById("otherUsernameInput").focus();
}
   
function closeForm() {
  document.getElementById("loginPopup").style.display= "none";
}
// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  var modal = document.getElementById('loginPopup');
  if (event.target == modal) {
    closeForm();
  }
}

//when somebody wants to message us 
function onOffer(offer, name) {
   //ask if u want to connect to other user who just requested ?
   if(!connectionDictionary.find( ({ loginName }) => loginName === name))
      createRTCPeerConnectionObject(name);
   connectedUser = name; 
   //console.log(connectionDictionary);
   //console.log("name is: " + name);
   var myConnection = connectionDictionary.find( ({ loginName }) => loginName === name).RTCPeerConnection;

   myConnection.setRemoteDescription(new RTCSessionDescription(offer));
	
   myConnection.createAnswer(function (answer) { 
      myConnection.setLocalDescription(answer); 
		
      send({ 
         type: "answer", 
         answer: answer 
      }); 
		
   }, function (error) { 
      alert("oops...error"); 
   }); 
}
//when somebody wants to video call us 
function onOfferVideo(offer, otherusername) {
   if(!confirm(otherusername+" is calling you ...")) {
      // Send a command to the other party (i.e. a response to the invitation) rejecting the offer.
      //console.log("rejected");
  } else {
     //console.log("accepted");
      createRTCPeerConnectionObjectForVideo(otherusername, function(){
      var myConnection = connectionDictionary.find( ({ loginName }) => loginName === otherusername).RTCPeerConnectionVideo;

      myConnection.setRemoteDescription(new RTCSessionDescription(offer));
      
      myConnection.createAnswer(function (answer) { 
         myConnection.setLocalDescription(answer); 
         
         send({ 
            type: "answer", 
            answer: answer 
         }); 
         
      }, function (error) { 
         alert("oops...error"); 
      }); 
   });
   }
}

//when somebody wants to audio call us 
function onOfferAudio(offer, otherusername) {
   if(!confirm(otherusername+" is calling you ...")) {
      // Send a command to the other party (i.e. a response to the invitation) rejecting the offer.
      //console.log("rejected");
  } else {
      //console.log("accepted");
      createRTCPeerConnectionObjectForAudio(otherusername, function(){
         
         var myConnection = connectionDictionary.find( ({ loginName }) => loginName === otherusername).RTCPeerConnectionAudio;

         myConnection.setRemoteDescription(new RTCSessionDescription(offer));
         
         myConnection.createAnswer(function (answer) { 
            myConnection.setLocalDescription(answer); 
            
            send({ 
               type: "answer", 
               answer: answer 
            }); 
            
         }, function (error) { 
            alert("oops...error"); 
         });
      });
   }
}

//when another user answers to our offer 
function onAnswer(answer) { 
   myConnection.setRemoteDescription(new RTCSessionDescription(answer)); 
}

//when we got ice candidate from another user 
function onCandidate(candidate) {
   myConnection.addIceCandidate(new RTCIceCandidate(candidate)); 
}

//creating data channel 
function openDataChannel(loginName1) { 
   var dataChannelOptions = {
      reliable:true 
   }; 
   var temp = connectionDictionary.find( ({ loginName }) => loginName === loginName1);
   dataChannel = temp.RTCPeerConnection.createDataChannel("myDataChannel", dataChannelOptions);
   dataChannel.onerror = function (error) { 
      console.log("Error:", error); 
   };

   dataChannel.onmessage = function (event) {
      addMessageToTextArea(event.data, "left", loginName1);
   };

   temp.RTCDataChannel = dataChannel;
   //console.log(connectionDictionary);
}

function addMessageToTextArea(msgInput, alignValue1, otherUsername){
   
   //Dynamic messages adding with correct styling
   var div1 = document.createElement('div');
   var div2 = document.createElement('div');
   var span = document.createElement('span');

   if(alignValue1 == "left"){ //styling left and right 
      div1.className="d-flex justify-content-start mb-4";
      div2.className="msg_cotainer";
      span.className="msg_time";
   }
   else{
      div1.className="d-flex justify-content-end mb-4";
      div2.className="msg_cotainer_send";
      span.className="msg_time_send";
   }
   div2.innerHTML=msgInput; //actual message
   span.innerHTML = ""; // need to change this to more dynamic....like today and tomorrow 
   
   div2.appendChild(span);
   div1.appendChild(div2);

   var tempId = "chatOutput_" + otherUsername;
   var finalDiv = document.getElementById(tempId);
   finalDiv.appendChild(div1);
   //myDiv.focus(); //will add it if needed
   finalDiv.scrollTop=finalDiv.scrollHeight; //updating the scroll
   finalDiv.focus();
   
   storeMessageOnServer(msgInput, alignValue1, otherUsername);
   /* //Inspired from below
      <div class="d-flex justify-content-end mb-4">
         <div class="msg_cotainer_send">
            Ok, thank you have a good day
            <span class="msg_time_send">9:10 AM, Today</span>
         </div>
      </div>
      <div class="d-flex justify-content-start mb-4">
         <div class="msg_cotainer">
            Bye, see you
            <span class="msg_time">9:12 AM, Today</span>
         </div>
      </div>
   */
}

function createDetailsOfUser(otherUsername)
{
   var div1 = document.createElement('div');
   div1.className="card";

   var div11 = document.createElement('div');
   div11.className="card-header msg_head";

   var div111 = document.createElement('div');
   div111.className="d-flex bd-highlight";

   var div1111 = document.createElement('div');
   div1111.className = "img_cont";
   var div1112 = document.createElement('div');
   div1112.className = "user_info";
   var div1113 = document.createElement('div');
   div1113.className = "video_cam";

   var div11111 = document.createElement('img');
   div11111.src = ""; //need to fill with user profile pic
   div11111.className = "rounded-circle user_img";

   var div11112 = document.createElement('span');
   div11112.className = "online_icon"; //need to make this dynamic

   div1111.appendChild(div11111); //div1111 ready
   div1111.appendChild(div11112);


   var div11121 = document.createElement('span');
   div11121.innerHTML = otherUsername;

   div1112.appendChild(div11121); //div1112 ready

   var div11131 = document.createElement('span');
   var div111311 = document.createElement('i');
   div111311.className="fas fa-video";

   div111311.addEventListener("click", function () { // video call functionality
         //create and find RTCPeerConnection to create an offer
         createRTCPeerConnectionObjectForVideo(otherUsername, function(){
            myConnection = connectionDictionary.find( ({ loginName }) => loginName === otherUsername).RTCPeerConnectionVideo;
            // create an offer
            myConnection.createOffer(function (offer) { 
               send({ 
                  type: "offerVideo", 
                  offer: offer 
               }); 
               myConnection.setLocalDescription(offer); 
            }, function (error) { 
               alert("Error when creating an offer"); 
            });  
         });
   });

   var div11132 = document.createElement('span');
   var div111321 = document.createElement('i');
   div111321.className="fas fa-phone";

   div111321.addEventListener("click", function () {  //audio call functionality      
         //create and find RTCPeerConnection to create an offer
         createRTCPeerConnectionObjectForAudio(otherUsername, function(){
            myConnection = connectionDictionary.find(({ loginName }) => loginName === otherUsername).RTCPeerConnectionAudio;
            // create an offer 
            myConnection.createOffer(function (offer) { 
               send({ 
                  type: "offerAudio", 
                  offer: offer 
               });
               myConnection.setLocalDescription(offer);  
            }, function (error) { 
               alert("Error when creating an offer"); 
            });
         });        
   });

   div11131.appendChild(div111311); //div1113 ready
   div11132.appendChild(div111321);
   div1113.appendChild(div11131);
   div1113.appendChild(div11132);

   var div1114 = document.createElement('span');
   div1114.className="action_menu_btn";
   div1114.addEventListener('click', function(){ //action_menu btn cllick functionality
      $('.action_menu').toggle();
   });
   /*
   <a class="nav-link dropdown-toggle" href="#" id="navbarDropdownMenuLink" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <img src="https://s3.eu-central-1.amazonaws.com/bootstrapbaymisc/blog/24_days_bootstrap/fox.jpg" width="40" height="40" class="rounded-circle">
                </a>
                <div class="dropdown-menu text-right" style="left: auto !important; right: 0 !important;" aria-labelledby="navbarDropdownMenuLink">
                <a class="dropdown-item" href="#">Edit Profile</a>
                <a class="dropdown-item" href="/users/logout">Log Out</a>
                </div>
   */
   var div11141 = document.createElement('i');
   div11141.className = "fas fa-ellipsis-v";
   div1114.appendChild(div11141); 

   div111.appendChild(div1111); //div 111 ready
   div111.appendChild(div1112);
   div111.appendChild(div1113);
   div111.appendChild(div1114);

   var div113 = document.createElement('div');
   div113.className="action_menu";
   var div1131 = document.createElement('ul');

   var div11311 = document.createElement('li');
   var div113111 = document.createElement('i');
   div113111.className="fas fa-user-circle float-left action_menu_icons";
   var div113112 = document.createElement('p');
   div113112.className="mb-0";
   div113112.innerHTML="View Profile";

   var div11312 = document.createElement('li');
   var div113121 = document.createElement('i');
   div113121.className="fas fa-ban float-left action_menu_icons";
   var div113122 = document.createElement('p');
   div113122.className="mb-0";
   div113122.innerHTML="Block";

   div11312.appendChild(div113121); //div 113 ready
   div11312.appendChild(div113122); 
   div11311.appendChild(div113111);
   div11311.appendChild(div113112);
   div1131.appendChild(div11311);
   div1131.appendChild(div11312);
   div113.appendChild(div1131);


   div11.appendChild(div111); //div11 ready
   div11.appendChild(div113);
   //div11.appendChild(div112);


   var div12 = document.createElement('div');
   var tempClassName12 = "chatOutput_" + otherUsername;
   div12.className="card-body msg_card_body"; 
   div12.id = tempClassName12;//added chatOutput_userName as id

   var div13 = document.createElement('div');
   div13.className="card-footer";

   var div131 = document.createElement('div');
   div131.className="input-group";

   var div1311 = document.createElement('div');
   div1311.className="input-group-append";

   var div13111 = document.createElement('span');
   div13111.className="input-group-text attach_btn";

   var div131111 = document.createElement('i');
   div131111.className = "fas fa-paperclip";

   var div1312 = document.createElement('textarea');
   div1312.className = "form-control type_msg";
   div1312.placeholder="Type your message...";
   div1312.addEventListener("keyup", function(event) {
      if (event.keyCode === 13) {
       event.preventDefault();
       div1313.click();
      }});

   var div1313 = document.createElement('div');
   div1313.className="input-group-append";

   var div13131 = document.createElement('span');
   div13131.className="input-group-text send_btn";

   var div131311 = document.createElement('i');
   div131311.className = "fas fa-location-arrow";
   
   div1313.addEventListener("click", function() //send message functionality
   {
      if(div1312 != null && div1312 != "")
      {
         var messageToSend = div1312.value;
         dataChannel = connectionDictionary.find(({ loginName }) => loginName === otherUsername).RTCDataChannel;
         dataChannel.send(messageToSend);
         addMessageToTextArea(messageToSend, "right", otherUsername);
         div1312.value="";
      }
   }, false);


   div13111.appendChild(div131111); //div 1311 ready
   div1311.appendChild(div13111);

   div13131.appendChild(div131311); //div1313 ready
   div1313.appendChild(div13131); 

   div131.appendChild(div1311); //div 131 ready
   div131.appendChild(div1312); 
   div131.appendChild(div1313); 

   div13.appendChild(div131); //div 13 ready


   div1.appendChild(div11); //div 1 ready 
   div1.appendChild(div12);
   div1.appendChild(div13);
   div1.id = "myDetailedLi_" + otherUsername;

   var addDiv = document.getElementById('uniqueId');
   addDiv.appendChild(div1);

   showDetailsOfUser(otherUsername);
}
function storeMessageOnServer(msgInput, alignValue1, otherUsername)
{
   //console.log(otherUsername);
   var myRtcPeerConnection = connectionDictionary.find(({ loginName }) => loginName === otherUsername).RTCPeerConnection;
   var tempUsername;
   if(alignValue1 == "left")
   {
      tempUsername = otherUsername;
   }
   else
   {
      tempUsername = name;
   }
   myRtcPeerConnection.createOffer(function (offer) { 
      send({ 
         type: "storeMessage",
         myUserName: name,
         msg: msgInput,
         msgName: tempUsername
      }); 
   }, function (error) { 
      alert("An error occurred while saving the message"); 
   });
}
function showDetailsOfUser(otherUsername)
{
   var c = document.getElementById("uniqueId");
   var tempId = "myDetailedLi_" + otherUsername;

   NodeList.prototype.forEach = Array.prototype.forEach
   var children = c.childNodes;

   children.forEach(function(item){
      if(typeof item.id !== 'undefined')
      {
         if(item.id == tempId){
            //item.className = item.className.replace(/\bhide\b/g, ""); //remove the active 
            item.className = "card show";
            item.style.display="block";
         }
         else
         {
            //item.className = item.className.replace(/\bshow\b/g, ""); //remove the active 
            item.className = "hide card";
            item.style.display="none";
         }
      }
   });


   var activeClass = document.getElementsByClassName('active')[0];
   if(activeClass == null)
      c.className = "col-md-8 col-xl-6 chat"; //for first time
   else
      activeClass.className = activeClass.className.replace(/\bactive\b/g, ""); //remove the active 

   var myLi = document.getElementById("myLi_" + otherUsername);
   myLi.className+=" active"; //make it active
}

function addMessagingWindowForParticularUser(otherUsername){
   //one time creation of all the elements
   //creating the preview in preview window
   var chatPreviewWindow = document.getElementById('chatPreviewWindow');
   var myLi = document.createElement('li');
   var div1 = document.createElement('div');
   var div11 = document.createElement('div');
   var div12 = document.createElement('div');
   var span11 = document.createElement('span');
   var span12 = document.createElement('span');
   var img11 = document.createElement('img');
   var p12 = document.createElement('p');

   p12.innerHTML=otherUsername + " is online";
   span12.innerHTML=otherUsername;

   span11.className = "online_icon";
   img11.src='';
   img11.className = "rounded-circle user_img";

   div11.className = "img_cont";
   div12.className = "user_info";

   div1.className = "d-flex bd-highlight";

   var tempIdName = "myLi_" + otherUsername;
   myLi.id = tempIdName;

   div12.appendChild(span12);
   div12.appendChild(p12);
   div11.appendChild(span11);
   div11.appendChild(img11);
   div1.appendChild(div11);
   div1.appendChild(div12);
   myLi.appendChild(div1);
   chatPreviewWindow.insertBefore(myLi, chatPreviewWindow.firstChild);

   createDetailsOfUser(otherUsername); // add onclick to the div and show details

   myLi.addEventListener("click", function()
   {
      showDetailsOfUser(otherUsername);
   }, false);
}

//hang up Audio
hangUpBtnAudio.addEventListener("click", function () { 
   send({ 
      type: "leaveAudio" 
   }); 
   handleLeaveAudio();
});
function handleLeaveAudio() { 
   myConnection = connectionDictionary.find(({ loginName }) => loginName === connectedUser).RTCPeerConnectionAudio;
   remoteAudio.srcObject = null;
   localAudio.srcObject = null;
   if (audioStream && audioStream.stop) {
      onsole.log("stop audio");
      audioStream.stop();
    }
   audioStream = null;
   myConnection.close(); //change this
   myConnection.onicecandidate = null; 
   myConnection.onaddstream = null;
   callPageAudio.style.display = "none";
};

//hang up Video
hangUpBtnVideo.addEventListener("click", function () { 
   send({ 
      type: "leaveVideo" 
   });  
   handleLeaveVideo();  
});
function handleLeaveVideo() { 
   myConnection = connectionDictionary.find(({ loginName }) => loginName === connectedUser).RTCPeerConnectionVideo;
   remoteVideo.srcObject = null; 
   localVideo.srcObject = null;
   if (videoStream && videoStream.stop) {
      console.log("stop video");
      videoStream.stop();
    }
   videoStream = null;
   myConnection.close(); //change this
   myConnection.onicecandidate = null; 
   myConnection.onaddstream = null; 
   callPageVideo.style.display = "none";
};