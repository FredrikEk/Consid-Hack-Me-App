
var express = require('express')
  , routes  = require('./routes')
  , user    = require('./routes/user')
  , http    = require('http')
  , fs      = require('fs')
  , path    = require('path');

var app = express();
var port = 3000;


// all environments
app.set('port', process.env.PORT || port);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

/*
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
*/

var highscore = [{'name' : 'Fredrik' , 'points' : 9999},
				 {'name' : 'Robert' , 'points' : -5},
				 {'name' : 'Philip' , 'points' : -9999}
				];
var CHAR_BLACKLIST = ['<', '>', '/', '\\', 'script', '-', '%', '(', ')', '}', '{', ':'];
var NAME_MAX_LENGTH = 25;

var io = require('socket.io').listen(app.listen(port));

io.sockets.on('connection', function(socket){

	console.log('New connection attempt');
	io.sockets.emit('initHighscore', { highscoreList : highscore });

	socket.on('initQuiz', function(){
		fs.readFile(__dirname + "/lib/questions.json", "Utf-8", function(err, data){
			socket.emit('quizQuestions', JSON.parse(data));
		});
	});
	socket.on('addUserToHighscore', function(args){
		//socket.username = name;
		try{			
			var invalidCharInName = checkForMischief(args.name);
			var invalidNameLength = checkIfNameTooLong(args.name);
			var invalidNumberOfPoints = checkIfNumberOfPointsValid(args.points)
			if(invalidCharInName){
				var errorMessage = "Don't be a bad hen. You know that strings like '" + invalidCharInName + 
        						   "' isn't allowed. Your script-kiddie attempt has been logged.";
				console.log('User tried to use character: ' + invalidCharInName + ' in name input');
				socket.emit('errorMessage', errorMessage);
			} else if(invalidNameLength){
				var errorMessage = "Name is too long, max 25 characters allowed."
				socket.emit('errorMessage', errorMessage);
			} else if(invalidNumberOfPoints){
				var errorMessage = "Don't be a bad hen. There arent enough questions to get more than a hundred points." +
								   "You tried tried to get '" + args.points + "'. Your script-kiddie attempt has been logged."
				console.log('User tried to cheat with: ' + args.points + ' number of points');
				socket.emit('errorMessage', errorMessage);
			} else{
				highscore.push({'name' : args.name , 'points' : args.points});
				highscore.sort(comparePoints);
				console.log(args.name + " added to highscore with points: " + args.points);
				io.sockets.emit('updateHighscore', { highscoreList : highscore, updateType: 'add' });
			}
		} catch (e){
			console.log('Error in addUserToHighscore: ', e);
		}	
	});

	/*socket.on('disconnect', function(){
		console.log(socket.username + " has disconnected");
		var index = users.indexOf(socket.username);
		users.splice(index, 1);
		io.sockets.emit('updateUserList', {user:socket.username, connectionType:'delete'});
	});*/
});

function comparePoints(a, b){
	return b.points - a.points;
}

function checkForMischief(str){
	for (var i = 0; i < CHAR_BLACKLIST.length; i++) {
		var badChar = CHAR_BLACKLIST[i];
		if (str.includes(badChar)){
			return badChar;
		} 
	};
	return ''; 	
}

function checkIfNameTooLong(str){
	return str.length > NAME_MAX_LENGTH;
}


function checkIfNumberOfPointsValid(points){
	console.log(points);
	return points > 100; //Supposed to be points > questions.length when there is enough questions
}

