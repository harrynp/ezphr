const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const favicon = require('serve-favicon');
const path = require('path');
const jwt = require('jsonwebtoken');
const home = require('./routes/home');
const users = require('./routes/users');
const mongoose = require('./config/database'); //database configeration
const port = process.env.PORT || 8080;

const app = express();
app.set('secretKey', process.env.SECRET_KEY);
app.use(favicon(path.join(__dirname, 'client/public', '/favicon.ico')))

//Connect to mongodb
mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));
app.use(logger('dev'));
app.use(bodyParser.urlencoded({extended: false}));

//Static files
app.use(express.static('client/public'))


//Public route
app.use('/', home);

//Api private route
app.use('/user', validateUser, users);

//handle 404 error
app.use((req, res, next) => {
    let err = new Error('Not found');
    err.status = 404;
    next(err);
});

function validateUser(req, res, next){
    jwt.verify(req.headers['x-access-token'], req.app.get('secretKey'), (err, decoded) => {
        if (err){
            res.json({
                status: "error",
                message: err.message,
                data: null,
            });
        } else {
            //add user id to request
            req.body.userId = decoded.id;
            next();
        }
    });
}

//handle errors
app.use((err, req, res, next) => {
    console.log(err);

    if(err.status === 404){
        res.status(404).json({message: "Not found"});
    } else if (err.name === "MongoError" && err.code === 11000){
        //pass
    } else {
        res.status(500).json({message: "Something broke!"});
    }
});

app.listen(port, () => {
    console.log('Node server listening on port ' + port);
});