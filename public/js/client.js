var connection = new WebSocket('ws://localhost:3000'); 
//var connection = new WebSocket('ws://192.168.0.244:3000'); 
//var connection = new WebSocket('ws://35.169.240.181'); 
//var connection = new WebSocket('wss://patelraj.ca'); 

var name = "";

var otherUsernameInput = document.querySelector('#otherUsernameInput'); 

var connectionDictionary = [];

var myConnection, connectedUser;
var myRTCPeerConnection, myRTCPeerConnectionAudio, myRTCPeerConnectionVideo;

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


//on load of website, this will be called from dashboard.ejs
function loginFunction(username, personName, uId) {
   console.log("Logging in as " + username);
   name=username;
   
   if(username.length > 0) { 
      send({ 
         type: "login", 
         name: username,
         personName: personName,
         uId: uId
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
         onOffer(data.offer, data.name, data.personName, data.uId); 
         break; 
      case "offerVideo": 
         onOfferVideo(data.offer, data.name); 
         break; 
      case "offerAudio": 
         onOfferAudio(data.offer, data.name); 
         break; 
      case "answer":
         onAnswer(data.answer, data.personName, data.uId); 
         break;
      case "answerVideo":
         onAnswerVideo(data.answer, data.personName, data.uId); 
         break;
      case "answerAudio":
         onAnswerAudio(data.answer, data.personName, data.uId); 
         break;
      case "candidate": 
         onCandidate(data.candidate); 
         break;
      case "candidateVideo": 
         onCandidateVideo(data.candidate); 
         break;
      case "candidateAudio": 
         onCandidateAudio(data.candidate); 
         break;
      case "leaveAudio":
         handleLeaveAudio();
         break;
      case "leaveVideo":
         handleLeaveVideo();
         break;
      case "savedUser":
         createWindowsForSavedUsers(message);
         break;
      case "userDetails":
         userDetailsToMakeWindow(message, data.friends);
         break;
      case "error":
         handelError(message);
         break;
      default: 
         break; 
   } 
}; 
function handelError(message)
{   
   let errorMessage = JSON.parse( message.data );
   document.getElementById('addFriendErrorMessage').innerHTML = errorMessage.message;
   //console.log(errorMessage.message); // add it as a red alert on connect to form window rather than alert
   //closeForm();
}
//when a user logs in 
function onLogin(success) { 
   if (success === false) { 
      alert("oops...try a different username"); 
      //send the user back with an error message
   } else { 
      createRTCPeerConnectionObject(name);
   } 
};
function ValidateEmail(inputText)
{
   var mailformat = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
   if(inputText.match(mailformat))
   {
      //alert("Valid email address!");
      //document.form1.text1.focus();
      return true;
   }
   else
   {
      document.getElementById('addFriendErrorMessage').innerHTML = "Invalid email address!";
      return false;
   }
}
/*
   Messaging RTCPeerConnection
*/
function createRTCPeerConnectionObject (myName) {  
   //creating our RTCPeerConnection object 
   var configuration = { 
      "iceServers": [{ "url": "stun:stun.1.google.com:19302" }] 
   }; 
   
   myRTCPeerConnection = new webkitRTCPeerConnection(configuration, { 
      //optional: [{RtpDataChannels: true}] 
   }); 
  
   connectedUser = myName;

   connectionDictionary.push({
      loginName: myName,
      personName: "",
      uId: "",
      friend: "",
      RTCDataChannel: "",
      RTCPeerConnectionAudio: "",
      RTCPeerConnectionVideo: ""
   });
   
   //setup ice handling 
   //when the browser finds an ice candidate we send it to another peer 
   myRTCPeerConnection.onicecandidate = function (event) {
      //console.log("waiting for iceCandidate");
      if (event.candidate) { 
         send({ 
            type: "candidate", 
            candidate: event.candidate 
         });
      } 
   };
}

/* 
   Audio call RTCPeerConnection object
*/
function createRTCPeerConnectionObjectForAudio(otherUsername, callback)
{
   callPageAudio.style.display = "block";
   var temp = connectionDictionary.find( ({ loginName }) => loginName === otherUsername);
   document.getElementById('changeNameAudio').innerHTML = temp.personName;
   //getting local audio stream 
   navigator.webkitGetUserMedia({ video: false, audio: true }, function (myStream) { 
      //using Google public stun server 
      var configuration = { 
         "iceServers": [{ "url": "stun:stun2.1.google.com:19302" }] 
      }; 
      myRTCPeerConnectionAudio = new webkitRTCPeerConnection(configuration);

      audioStream = myStream; 
      //displaying local audio stream on the page
      localAudio.srcObject = audioStream;
      // setup stream listening 
      myRTCPeerConnectionAudio.addStream(audioStream); 
      //when a remote user adds stream to the peer connection, we display it 
      myRTCPeerConnectionAudio.onaddstream = function (e) { 
         //remoteAudio.src = window.URL.createObjectURL(e.stream); 
         remoteAudio.srcObject = e.stream;
      };  
      // Setup ice handling 
      myRTCPeerConnectionAudio.onicecandidate = function (event) { 
         if (event.candidate) { 
            send({ 
               type: "candidateAudio", 
            }); 
         }
      };
      connectedUser = otherUsername;
      var temp = connectionDictionary.find( ({ loginName }) => loginName === otherUsername);
      temp.RTCPeerConnectionAudio = myRTCPeerConnectionAudio;
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
      //using Google public stun server 
      var configuration = { 
         "iceServers": [{ "url": "stun:stun2.1.google.com:19302" }]
      }; 
      
      myRTCPeerConnectionVideo = new webkitRTCPeerConnection(configuration); 

      videoStream = myStream; 

      localVideo.srcObject = videoStream;
      
      // setup stream listening 
      myRTCPeerConnectionVideo.addStream(videoStream); 

      //when a remote user adds stream to the peer connection, we display it 
      myRTCPeerConnectionVideo.onaddstream = function (e) { 
         //remoteVideo.src = window.URL.createObjectURL(e.stream); 
         remoteVideo.srcObject = e.stream;
      };
      
      // Setup ice handling 
      myRTCPeerConnectionVideo.onicecandidate = function (event) { 
         if (event.candidate) { 
            send({ 
               type: "candidateVideo", 
               candidate: event.candidate 
            }); 
         } 
      };
      connectedUser = otherUsername;
      var temp = connectionDictionary.find( ({ loginName }) => loginName === otherUsername);
      temp.RTCPeerConnectionVideo = myRTCPeerConnectionVideo;
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
function send(message) {
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
function pendingRequestsWindowInit()
{
   var pendingRequestWin = document.getElementById('pendingRequests');
   $('#pendingRequests').empty();
   var counter = 0;
   console.log(connectionDictionary);
   connectionDictionary.forEach(element => {
      if(element.loginName != name){ 
         if(!element.friend)
         {
            counter++;
            var div1 = document.createElement("div");
            div1.className = "row m-3";
            var div2 = document.createElement("div");
            div2.className = "col-6";
            div2.style="align-self: center;"
            var friendName = document.createElement("p");
            friendName.className = "";
            friendName.innerHTML = element.personName;
            var div3 = document.createElement("div");
            div3.className = "col-6";
            var acceptButton = document.createElement("button");
            acceptButton.className = "btn";
            acceptButton.style = "background: #7F7FD5;";
            acceptButton.innerHTML = "Accept";
            acceptButton.onclick = function(event) {
               console.log("make accept window");
               element.friend = true;

               //Saving this in db
               otherUsername = element.loginName;
               console.log(otherUsername);
               if(otherUsername){
                  send({ 
                     type: "saveFriend", 
                     personUserName: otherUsername 
                  });
               }
               addMessagingWindowForParticularUser(element.loginName);
               decrementNotificationCounter();
               pendingRequestWin.removeChild(div1);
               closeFriendRequestsPopup();
             }
             
            //add accept button event listener, or just an onclick event
            div3.appendChild(acceptButton);
            div2.appendChild(friendName);
            div1.appendChild(div2);
            div1.appendChild(div3);
            pendingRequestWin.appendChild(div1);
         }
      }
   });

   document.getElementById('pendingRequestNumber').innerHTML = counter;
   if(counter == 0)
   {
      var div1 = document.createElement("p");
      div1.className = "";
      div1.innerHTML = "No Pending requests";
      pendingRequestWin.appendChild(div1);
   }
}
function incrementNotificationCounter()
{
    var value = parseInt(document.getElementById('pendingRequestNumber').innerHTML, 10);
    value = isNaN(value) ? 0 : value;
    value++;
    document.getElementById('pendingRequestNumber').innerHTML = value;
}
function decrementNotificationCounter()
{
    var value = parseInt(document.getElementById('pendingRequestNumber').innerHTML, 10);
    value = isNaN(value) ? 0 : value;
    value--;
    document.getElementById('pendingRequestNumber').innerHTML = value;
}
function userDetailsToMakeWindow(userInfo, friends)
{
   //this will have the friend list concept
   console.log("coming here in userDetailsToMakeWindow");
   var userInfo = JSON.parse(userInfo.data).message;
   console.log(userInfo);
   if(userInfo != null){
      if(userInfo[0].friendsUserName != undefined){
         var temp = connectionDictionary.find( ({ loginName }) => loginName === userInfo[0].friendsUserName);
         console.log(temp);
         if(!temp)
         {
            console.log("Adding to dictionary for " + userInfo[0].friendsUserName);
            console.log(friends);
            connectionDictionary.push({
               loginName: userInfo[0].friendsUserName,
               personName: userInfo[0].friendsName,
               uId: userInfo[0].friendsUid,
               friend: friends, //friends flag
               RTCDataChannel: "",
               RTCPeerConnectionAudio: "",
               RTCPeerConnectionVideo: ""
            });
         }
         else
         {
            console.log("exists in dictionary");
         }
         if(friends)
            addMessagingWindowForParticularUser(userInfo[0].friendsUserName);
         else{
            incrementNotificationCounter();
            pendingRequestsWindowInit();
         }
         closeForm();
      }
   }
   else
      console.log("No friends");
}
//setup a peer connection with another user 
function establishConnection(otherUsername) {
   if(ValidateEmail(otherUsername)){
      if(name==otherUsername){
         alert("Cannot establish connection to yourself");
         closeForm();
         return;
      }
      else if(connectionDictionary.find(({ loginName }) => loginName === otherUsername))
      {
         otherUser = connectionDictionary.find(({ loginName }) => loginName === otherUsername)
         myChatId = "chatOutput_" + otherUser.uId;
         myNameChatId = "myLi_" + otherUser.uId;
         element = document.getElementById(myChatId);
         if (typeof(element) != 'undefined' && element != null) //the window already exists, so don't make new window
         {
            // Exists.
            alert("Connection already exists");
            closeForm();
            document.getElementById(myNameChatId).click();
            return;
         }
      }
      else{
         connectedUser = otherUsername;
         //need to get required data from server and then add it in the dictionary
         console.log(connectedUser);
         if(connectedUser){
            send({ 
               type: "getUserDetails", 
               personUserName: connectedUser 
            });
         }
         //below function will be called from userDetailsToMakeWindow
         //addMessagingWindowForParticularUser(connectedUser);
      }
   }
}
function createOfferToPeer(otherUsername)
{
   connectedUser = otherUsername;
   openDataChannel(otherUsername, function(){
      myRTCPeerConnection.createOffer(function (offer) { 
         myRTCPeerConnection.setLocalDescription(offer);
         send({ 
            type: "offer", 
            offer: offer 
         });
         closeForm();    
      }, function (error) { 
         alert("An error has occurred."); 
      });
   });
}
function openForm() {
   document.getElementById('addFriendErrorMessage').innerHTML = "";
  document.getElementById("loginPopup").style.display="block";
  document.getElementById("otherUsernameInput").focus();
}
   
function closeForm() {
   document.getElementById("otherUsernameInput").value="";
  document.getElementById("loginPopup").style.display= "none";
}
function openFriendRequestsPopup()
{
   document.getElementById('friendRequestPopup').style.display = "block";
}
function closeFriendRequestsPopup()
{
   document.getElementById('friendRequestPopup').style.display = "none";
}
// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  var modal = document.getElementById('loginPopup');
  var modal1 = document.getElementById('friendRequestPopup');
  if (event.target == modal || event.target == modal1 ){
    closeForm();
    closeFriendRequestsPopup();
  }
}

//when somebody wants to message us 
function onOffer(offer, name, personName1, uId1) {
   //console.log("coming to on offer");
   connectedUser = name; 
   myRTCPeerConnection.setRemoteDescription(new RTCSessionDescription(offer));
   openDataChannel(connectedUser, function(){
      myRTCPeerConnection.createAnswer(function (answer) { 
         myRTCPeerConnection.setLocalDescription(answer); 
         send({ 
            type: "answer", 
            answer: answer 
         });
      }, function (error) { 
         alert("oops...error"); 
      });
   });
}
//when somebody wants to video call us 
function onOfferVideo(offer, otherusername) {
   var otherPersonName = connectionDictionary.find( ({ loginName }) => loginName === otherusername).personName;

   if(!confirm(otherPersonName+" is calling you ...")) {
      // Send a command to the other party (i.e. a response to the invitation) rejecting the offer.
      //console.log("rejected");
  } else {
      console.log("accepted");
      createRTCPeerConnectionObjectForVideo(otherusername, function(){
         myRTCPeerConnectionVideo.setRemoteDescription(new RTCSessionDescription(offer));         
         myRTCPeerConnectionVideo.createAnswer(function (answer) { 
            myRTCPeerConnectionVideo.setLocalDescription(answer);
            send({ 
               type: "answerVideo", 
               answer: answer 
            }); 
         }, function (error) { 
            alert("Error in offerVideo"); 
      }); 
   });
   }
}

//when somebody wants to audio call us 
function onOfferAudio(offer, otherusername) {
   var otherPersonName = connectionDictionary.find( ({ loginName }) => loginName === otherusername).personName;
   if(!confirm(otherPersonName+" is calling you ...")) {
      // Send a command to the other party (i.e. a response to the invitation) rejecting the offer.
      //console.log("rejected");
  } else {
      //console.log("accepted");
      createRTCPeerConnectionObjectForAudio(otherusername, function(){         
         myRTCPeerConnectionAudio.setRemoteDescription(new RTCSessionDescription(offer));
         myRTCPeerConnectionAudio.createAnswer(function (answer) { 
            myRTCPeerConnectionAudio.setLocalDescription(answer);
            send({ 
               type: "answerAudio", 
               answer: answer 
            });
         }, function (error) { 
            alert("Error in offerAudio"); 
         });
      });
   }
}

//when another user answers to our offer 
function onAnswer(answer, personName1, uId1) {
   myRTCPeerConnection.setRemoteDescription(new RTCSessionDescription(answer));
   closeForm();
}
//when another user answers to our offer 
function onAnswerVideo(answer, personName1, uId1) {
   myRTCPeerConnectionVideo.setRemoteDescription(new RTCSessionDescription(answer));
}
//when another user answers to our offer 
function onAnswerAudio(answer, personName1, uId1) {
   myRTCPeerConnectionAudio.setRemoteDescription(new RTCSessionDescription(answer));
}
//when we got ice candidate from another user 
function onCandidate(candidate) {
   myRTCPeerConnection.addIceCandidate(new RTCIceCandidate(candidate)); 
}

//when we got ice candidate from another user 
function onCandidateVideo(candidate) {
    // Wait until the state of the socket is not ready and send the message when it is...
    waitForCandidateVideo(myRTCPeerConnectionVideo, function(){
      myRTCPeerConnectionVideo.addIceCandidate(new RTCIceCandidate(candidate)); 
  });
}
// Make the function wait until the myRTCPeerConnectionVideo is created...
function waitForCandidateVideo(myRTCPeerConnectionVideo, callback){
   setTimeout(
      function () {
         if (myRTCPeerConnectionVideo != undefined) {
            if (callback != null){
                  callback();
            }
         } else {
            waitForCandidateVideo(myRTCPeerConnectionVideo, callback);
         }

      }, 5); // wait 5 milisecond for the connection...
}

//when we got ice candidate from another user 
function onCandidateAudio(candidate) {
   // Wait until the state of the socket is not ready and send the message when it is...
   waitForCandidateAudio(myRTCPeerConnectionAudio, function(){
      myRTCPeerConnectionAudio.addIceCandidate(new RTCIceCandidate(candidate)); 
  });
}
// Make the function wait until the myRTCPeerConnectionAudio is created...
function waitForCandidateAudio(myRTCPeerConnectionAudio, callback){
   setTimeout(
      function () {
         if (myRTCPeerConnectionAudio != undefined) {
            if (callback != null){
                  callback();
            }
         } else {
            waitForCandidateAudio(myRTCPeerConnectionAudio, callback);
         }

      }, 5); // wait 5 milisecond for the connection...
}

//creating data channel 
function openDataChannel(otherUserName, callBackFunction) { 
   var dataChannelOptions = {
      reliable:true
   }; 
   var temp = connectionDictionary.find( ({ loginName }) => loginName === otherUserName);
   if(temp == null)
   {      
      console.log("Adding to dictionary for " + otherUserName + " from openDataChannel function");
      connectionDictionary.push({
         loginName: otherUserName,
         personName: "",
         uId: "",
         friend: "",
         RTCDataChannel: "",
         RTCPeerConnectionAudio: "",
         RTCPeerConnectionVideo: ""
      });
   }

   try
   {   
      dataChannel = myRTCPeerConnection.createDataChannel("myDataChannel", {negotiated: true, id: 1}, dataChannelOptions);
      dataChannel.binarytype = 'arraybuffer';
      temp.RTCDataChannel = dataChannel;
      //console.log("created data channel for " + otherUserName);
      dataChannel.onerror = function (error) { 
         console.log("Error in the dataChannel"); 
         connectionDictionary.find(({ loginName }) => loginName === otherUserName).RTCDataChannel="";
      };
      dataChannel.onclose = function (event)
      {
         console.log("data channel closed");
         connectionDictionary.find(({ loginName }) => loginName === otherUserName).RTCDataChannel="";
      }
      dataChannel.onmessage = function (event) {
         addMessageToTextArea(event.data, "left", otherUserName);
      };
      temp.RTCDataChannel = dataChannel;
   }
   catch
   {
      console.log("error while creating datachannel");
      temp.RTCDataChannel = "";
   }
   callBackFunction();
}

function addMessageToTextArea(msgInput, alignValue1, otherUsername){
   var otherUser = connectionDictionary.find( ({ loginName }) => loginName === otherUsername);
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

   var tempId = "chatOutput_" + otherUser.uId;
   var finalDiv = document.getElementById(tempId);
   finalDiv.appendChild(div1);
   //myDiv.focus(); //will add it if needed
   finalDiv.scrollTop=finalDiv.scrollHeight; //updating the scroll
   finalDiv.focus();
   
   storeMessageOnServer(msgInput, alignValue1, otherUsername);
}

function createDetailsOfUser(otherUsername)
{
   var otherUser = connectionDictionary.find( ({ loginName }) => loginName === otherUsername);

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
   div11111.src = "/img/profilePics/m_" + otherUser.uId + ".png"; 
   div11111.className = "rounded-circle user_img";

   var div11112 = document.createElement('span');
   div11112.className = "online_icon"; //need to make this dynamic

   div1111.appendChild(div11111); //div1111 ready
   div1111.appendChild(div11112);

   var div11121 = document.createElement('span');
   div11121.innerHTML = otherUser.personName;

   div1112.appendChild(div11121); //div1112 ready

   var div11131 = document.createElement('span');
   var div111311 = document.createElement('i');
   div111311.className="fas fa-video";

   div111311.addEventListener("click", function () { // video call functionality
         //create and find RTCPeerConnection to create an offer
         createRTCPeerConnectionObjectForVideo(otherUsername, function(){
            // create an offer
            myRTCPeerConnectionVideo.createOffer(function (offer) { 
               myRTCPeerConnectionVideo.setLocalDescription(offer); 
               send({ 
                  type: "offerVideo", 
                  offer: offer 
               }); 
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
            // create an offer 
            myRTCPeerConnectionAudio.createOffer(function (offer) { 
               myRTCPeerConnectionAudio.setLocalDescription(offer); 
               send({ 
                  type: "offerAudio", 
                  offer: offer 
               }); 
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
   div1114.addEventListener('click', function(event){ //action_menu btn cllick functionality
      event.stopPropagation();
      $('.action_menu').toggle();
   });

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
   var tempClassName12 = "chatOutput_" + otherUser.uId;
   div12.className="card-body msg_card_body"; 
   div12.id = tempClassName12;//added chatOutput_userName as id

   var div13 = document.createElement('div');
   div13.className="card-footer";

   var div131 = document.createElement('div');
   div131.className="input-group emoji-picker-container";

   var div1311 = document.createElement('div');
   div1311.className="input-group-append";
   div1311.addEventListener("click", function(event)
   {
      event.stopPropagation();
      // sending files and attachments
      $('.action_uploadFiles').toggle();
   },false);

   var div13111 = document.createElement('span');
   div13111.className="input-group-text attach_btn";

   var div131111 = document.createElement('i');
   div131111.className = "fas fa-paperclip";

      var uploadfiles = document.createElement('div');
      uploadfiles.className="action_uploadFiles";
      var uploadfiles_1 = document.createElement('ul');

      var uploadfiles_11 = document.createElement('li');
      var uploadfiles_111 = document.createElement('i');
      uploadfiles_111.className="fas fa-image float-left action_menu_icons";
      uploadfiles_1111 = document.createElement('input');
      uploadfiles_1111.setAttribute("type", "file");
      uploadfiles_1111.setAttribute("accept", "image/png, image/jpeg");
      uploadfiles_1111.setAttribute("style", "display:none");
      uploadfiles_1111.id = "imageToSend";
      uploadfiles_11.addEventListener("click", function(){
         uploadfiles_1111.click();
      });
      
      var uploadfiles_12 = document.createElement('li');
      var uploadfiles_121 = document.createElement('i');
      uploadfiles_121.className="fas fa-file-alt float-left action_menu_icons";
      uploadfiles_1211 = document.createElement('input');
      uploadfiles_1211.setAttribute("type", "file");
      uploadfiles_1211.setAttribute("accept", "");
      uploadfiles_1211.setAttribute("style", "display:none");
      uploadfiles_1211.id = "fileToSend";
      uploadfiles_12.addEventListener("click", function(){
         uploadfiles_1211.click();
      });
     
      uploadfiles_12.appendChild(uploadfiles_1211);
      uploadfiles_12.appendChild(uploadfiles_121);
      uploadfiles_11.appendChild(uploadfiles_1111);
      uploadfiles_11.appendChild(uploadfiles_111);
      uploadfiles_1.appendChild(uploadfiles_11); //image
      uploadfiles_1.appendChild(uploadfiles_12); //all type of files
      uploadfiles.appendChild(uploadfiles_1);
   
   var div1312 = document.createElement('textarea');
   div1312.id = otherUser.uId;
   div1312.className = "form-control type_msg emoji-picker-container";
   div1312.placeholder="Type your message ...";
   div1312.setAttribute("data-emojiable", "true");
   
   var div1313 = document.createElement('div');
   div1313.className="input-group-append";
   div1313.id="sendMsg_"+ otherUser.uId;

   var div13131 = document.createElement('span');
   div13131.className="input-group-text send_btn";

   var div131311 = document.createElement('i');
   div131311.className = "fas fa-location-arrow";

   div1313.addEventListener("click", function() //send message functionality
   {
      // var messageToSend = div1312.value; //before
      var messageToSend = div1312.nextSibling.innerHTML; //had to do next sibling because emoji changes this div
      var refinedMessageToSend = messageToSend.split("<div><br></div>");
      sendMessageToPeer(otherUsername, refinedMessageToSend[0]);
      div1312.nextSibling.innerHTML = null;
   }, false);

   div13111.appendChild(div131111); //div 1311 ready
   div1311.appendChild(div13111);

   div13131.appendChild(div131311); //div1313 ready
   div1313.appendChild(div13131); 

   div131.appendChild(div1311); //div 131 ready
   div131.appendChild(div1312); 
   div131.appendChild(div1313); 

   div13.appendChild(uploadfiles);
   div13.appendChild(div131); //div 13 ready


   div1.appendChild(div11); //div 1 ready 
   div1.appendChild(div12);
   div1.appendChild(div13);
   div1.id = "myDetailedLi_" + otherUser.uId;

   var addDiv = document.getElementById('uniqueId');
   addDiv.appendChild(div1);

   initialiseEmojis();
   showDetailsOfUser(otherUsername);
}
/*
function imageUploadOnChange(otherUsername)
{
   console.log(otherUsername);
   var otherUser = connectionDictionary.find( ({ loginName }) => loginName === otherUsername);
   var inputMessage = document.getElementById(otherUser.uId);
   
   if (document.getElementById('fileToSend') !=null) 
     {
        console.log('it exists!');
        var file = document.getElementById("fileToSend").files[0];
        inputMessage.value += file.name;
      }
   else
      console.log("it doesn't exist");
}
*/
function sendMessageToPeer(otherUsername, messageToSend)
{
   dataChannel = connectionDictionary.find(({ loginName }) => loginName === otherUsername).RTCDataChannel;
   if(!dataChannel)
   {
      console.log("Creating offer to peer");
      createOfferToPeer(otherUsername);
      dataChannel = connectionDictionary.find(({ loginName }) => loginName === otherUsername).RTCDataChannel;
      waitForDataChannelToOpen(dataChannel, function(){
         dataChannel.send(messageToSend);
         addMessageToTextArea(messageToSend, "right", otherUsername);
      });
   }
   else{
      try{
         dataChannel.send(messageToSend);
      }
      catch{
         connectionDictionary.find(({ loginName }) => loginName === otherUsername).RTCDataChannel="";
         sendMessageToPeer(otherUsername, messageToSend);
      }
      addMessageToTextArea(messageToSend, "right", otherUsername);
   }
}
/*
function sendFileToPeer(otherUsername)
{
   dataChannel = connectionDictionary.find(({ loginName }) => loginName === otherUsername).RTCDataChannel;
   var file = document.getElementById("fileToSend").files[0];
   //var image = document.getElementById("imageToSend").files[0];
   
   var reader = new FileReader();
 
   reader.onload = (function(file) {
     if(reader.readyState == FileReader.DONE){
       //sendChannel.send(file.target.result);
         if(!dataChannel)
         {
            console.log("one");
            console.log("Creating offer to peer");
            createOfferToPeer(otherUsername);
            dataChannel = connectionDictionary.find(({ loginName }) => loginName === otherUsername).RTCDataChannel;
            waitForDataChannelToOpen(dataChannel, function(){
               dataChannel.send(file.target.result);
               addMessageToTextArea(file.name, "right", otherUsername);
            });
         }
         else{
            console.log("two");
            try{
               console.log("three");
               dataChannel.send(file.target.result);
            }
            catch{
               console.log("four");
               connectionDictionary.find(({ loginName }) => loginName === otherUsername).RTCDataChannel="";
               sendMessageToPeer(otherUsername, file.target.result);
            }
            addMessageToTextArea(file.name, "right", otherUsername);
         }
      }
   });
   reader.readAsArrayBuffer(file);
}
*/
// Make the function wait until the dataChannel is opened...
function waitForDataChannelToOpen(dataChannel, callback){
   setTimeout(
       function () {
           if (dataChannel.readyState == "open") {
               if (callback != null){
                   callback();
               }
           } else {
               waitForDataChannelToOpen(dataChannel, callback);
           }

       }, 5); // wait 5 milisecond for the dataChannel...
}

function storeMessageOnServer(msgInput, alignValue1, otherUsername)
{
   //console.log(otherUsername);
   var tempUsername;
   if(alignValue1 == "left")
   {
      tempUsername = otherUsername;
   }
   else
   {
      tempUsername = name;
   }
   myRTCPeerConnection.createOffer(function (offer) { 
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
   var otherUser = connectionDictionary.find( ({ loginName }) => loginName === otherUsername);
   var c = document.getElementById("uniqueId");
   var tempId = "myDetailedLi_" + otherUser.uId;

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

   var myLi = document.getElementById("myLi_" + otherUser.uId);
   myLi.className+=" active"; //make it active
}

function addMessagingWindowForParticularUser(otherUsername){
   var otherUser = connectionDictionary.find( ({ loginName }) => loginName === otherUsername);
   if(otherUser == null)
      console.log("first save the data");
   var element = document.getElementById("myLi_" + otherUser.uId);
   //console.log("otherUser.uId: " + otherUser.uId);
    //If it isn't "undefined" and it isn't "null", then it exists.
    if(typeof(element) != 'undefined' && element != null){
       console.log("Window already exists");
        return;
    } else{
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


      p12.innerHTML=otherUser.personName + " is online";
      span12.innerHTML=otherUser.personName;

      span11.className = "online_icon";
      img11.src="/img/profilePics/m_" + otherUser.uId + ".png";
      img11.className = "rounded-circle user_img";

      div11.className = "img_cont";
      div12.className = "user_info";

      div1.className = "d-flex bd-highlight";

      var tempIdName = "myLi_" + otherUser.uId;
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
}

//hang up Audio
hangUpBtnAudio.addEventListener("click", function () { 
   send({ 
      type: "leaveAudio" 
   }); 
   handleLeaveAudio();
});
function handleLeaveAudio() { 
   remoteAudio.srcObject = null;
   localAudio.srcObject = null;
   if (audioStream && audioStream.stop) {
      console.log("stop audio");
      audioStream.stop();
    }
   audioStream = null;
   myRTCPeerConnectionAudio.close();
   myRTCPeerConnectionAudio.onicecandidate = null; 
   myRTCPeerConnectionAudio.onaddstream = null;
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
   remoteVideo.srcObject = null; 
   localVideo.srcObject = null;
   if (videoStream && videoStream.stop) {
      console.log("stop video");
      videoStream.stop();
    }
   videoStream = null;
   myRTCPeerConnectionVideo.close();
   myRTCPeerConnectionVideo.onicecandidate = null; 
   myRTCPeerConnectionVideo.onaddstream = null; 
   callPageVideo.style.display = "none";
};
function initialiseEmojis() {
   // Initializes and creates emoji set from sprite sheet
   window.emojiPicker = new EmojiPicker({
      emojiable_selector: '[data-emojiable=true]',
      assetsPath: '/img/',
      popupButtonClasses: 'fa fa-smile-o'
     });
     // Finds all elements with `emojiable_selector` and converts them to rich emoji input fields
     // You may want to delay this step if you have dynamically created input fields that appear later in the loading process
     // It can be called as many times as necessary; previously converted input fields will not be converted again
     window.emojiPicker.discover();
}
function createWindowsForSavedUsers(friendList)
{
   var myFriendList = JSON.parse(friendList.data).message;

   if(myFriendList != null){
      for(var i = 0; i < myFriendList.length; i++) {
         if(myFriendList[i].friendsUserName != undefined){
            var temp = connectionDictionary.find( ({ loginName }) => loginName === myFriendList[i].friendsUserName);
            if(!temp)
            {
               console.log("Adding to dictionary for " + myFriendList[i].friendsUserName);
               connectionDictionary.push({
                  loginName: myFriendList[i].friendsUserName,
                  personName: myFriendList[i].friendsName,
                  uId: myFriendList[i].friendsUid,
                  friend: myFriendList[i].friendsFlag,
                  RTCDataChannel: "",
                  RTCPeerConnectionAudio: "",
                  RTCPeerConnectionVideo: ""
               });
            }
            if(myFriendList[i].friendsFlag)
               addMessagingWindowForParticularUser(myFriendList[i].friendsUserName);
         }
      }
   }
   else
      console.log("No friends");
   
   //initialising pending request window
   pendingRequestsWindowInit();
}