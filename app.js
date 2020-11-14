const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const app = express();
const expressEjsLayout = require('express-ejs-layouts')
const flash = require('connect-flash');
const session = require('express-session');
const passport = require("passport");
const ws = require('ws');

const DB_USER="";
const DB_PASS="";
const DB_URL="localhost";
const PORT = 3000;

//passport config:
require('./config/passport')(passport)
//mongoose
//mongoose.connect('mongodb://localhost/test',{useNewUrlParser: true, useUnifiedTopology : true})
//mongoose.connect(`mongodb://${DB_USER}:${DB_PASS}@${DB_URL}/test`,{useNewUrlParser: true, useUnifiedTopology : true})

mongoose.connect(`mongodb://${DB_URL}/test`,{useNewUrlParser: true, useUnifiedTopology : true})
.then(() => console.log('Connected.'))
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


//creating a headless websocket server 
var wss = new ws.Server({noServer: true}); 

const appServer = app.listen(PORT,()=>{
    console.log(`Server Running on port ${PORT}`);
});
appServer.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, socket => {
        wss.emit('connection', socket, request);
    });
});

var mainServer = require('./config/server');
mainServer(wss);