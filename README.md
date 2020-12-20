# Chat Applicaiton using WebRTC Technology

WebRTC (Web Real-Time Communication) by Google is a collection of standards, protocols, and JavaScript APIs, the combination of which enables bidirectional and secure real time peer-to- peer audio, video, and data sharing between browsers (peers). WebRTC API: (https://www.w3.org/TR/webrtc/).

Most of the apps you ever heard of are based on WebRTC Technology. To name a few, Google Hangouts, Google Duo, Facebook Messenger, Microsoft Teams, Discord, Zoom, WhatsApp, Houseparty, Amazon Chime, Snapchat, Netflix and many more. 

<br/>

## Following are the key services I used:
• WebRTC API: For Real time communications <br/>
• WebSockets: For initial handshake with peers as WebRTC doesn’t provide any initial
handshake functionalities <br/>
• NodeJS: As all the API calls were in JavaScript, so NodeJS seemed to be the best option <br/>
• Express: Makes easier for routing and setting middlewares <br/>
• MongoDB: To store users’ data in a non-sequential format <br/>

<br/>

## Setup and Deployment Instructions
### Project setup
      1. Install NodeJS and npm:
            Go to below link, and click “Download Node.js and npm” and install
                https://www.npmjs.com/get-npm
          Verify that you have node and npm(node package manager):
            node -v
            v8.11.l
            npm -v
            5.6.0
            
      2. Install MongoDB:
            Follow below link, download according to OS and install.
                https://docs.mongodb.com/manual/installation/
          To check whether mongodb is installed:
            which mongo
          Test your connection to mongodb.
            mongo
            
      3. Clone Project:
            git clone https://github.com/PatelRaj1998/Chat-Application-Using-WebRTC-Technology.git 
            
      4. Install dependencies:
          Change directory to Chat-Application-Using-WebRTC-Technology folder and run the below command:
            npm install

      5. Start development server:
            node app
              * Use ctrl-c to stop.
      
      6. Change configurations:
            Go to app.js file for any database configurations change and/or public/js/client.js file (first line) to change the port.
      
      7. Live application:
            Go to localhost:3000 on chrome (for best result), as it might not work in other browsers.

<br/>

## Sample Images of the application
![1](https://user-images.githubusercontent.com/36802968/102715654-f5275f00-42a4-11eb-8132-6a951f90b777.png)
![2](https://user-images.githubusercontent.com/36802968/102715660-fb1d4000-42a4-11eb-9ce0-3aae958ea750.png)
![3](https://user-images.githubusercontent.com/36802968/102715662-fce70380-42a4-11eb-970b-cf07fab4d39b.png)

<br/>

## Connect
Should you have any question, don't hesitate to contact me at patel1gv@uwindsor.ca
