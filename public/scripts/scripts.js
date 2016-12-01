var socket = io.connect(window.location.href);
var connected = false;
var questions = [];
var answers = [];

$(document).ready(function(){
  $('#btnJoin').on('click', function(){
      socket.emit('initQuiz');
      connected = true;
  });    
});

socket.on('initHighscore', function(data) {
  init_highscore(data.highscoreList);
});

socket.on('quizQuestions', function(data){
  $(".show_index").fadeOut('slow', function(){
    location.replace("#1");
    question = get_question(1);          
    set_click_event();          
    $(".show_questions").fadeIn('slow');
  });

  questions = data.questions;
  $.each(questions, function(n, item){
    i = n + 1;
    $(".questions_pagination").append("<li><a href='javascript:;' class='new_question' data-id='" + i + "' id='question_" + i + "'>" + i + "</a></li>");
  });
  $(".new_question").on('click', function(){
    var id = $(this).data('id');
    show_next_question(id - 1);
  });
});

socket.on('updateHighscore', function(data){
  if(data.updateType ==  'add'){
    init_highscore(data.highscoreList);
  } else {
    $("#" + data.user).remove();
  }
});  

socket.on('errorMessage', function(errorMessage){
  alert(errorMessage)
}); 

function get_question(number){
  var index = number - 1;
  var question = questions[index];
  $("#question_title").text("").text(question.question);
  $("#question_options").html("");
  $.each(question.choices, function(i, choice){
    $("#question_options").append("<div><input id='option" + i + "' class='answer' data-questionnr='" + number + "' data-option='" + i + "' type='radio' name='questionoption'/> " + choice + "</div>");
  });
  if(answers[index] > -1){
    $('#option' + answers[index]).prop('checked', true);
  }
}

function init_highscore(highscoreList){
  $(".connectedUsers").html('');
  $.each(highscoreList, function(i, highscoreElement){
    var positionOnHighscore = i + 1;
    $(".connectedUsers").append("<div id='" + highscoreElement.name + "'>" + 
      positionOnHighscore + ". " + highscoreElement.name + ": " + highscoreElement.points + "</div>");
  });
}

function set_click_event(){
  $(".answer").on('click', function(e){
    var target = $(e.currentTarget)
    var questionNr = target.data('questionnr');
    var answer = target.data('option');
    answers[questionNr - 1] = answer;
    setTimeout(function() {
      show_next_question(questionNr);
    }, 200);
  });        
}

function next_question(){
  show_next_question(parseInt(window.location.hash.substring(1)));
}

function show_next_question(questionNr){
  var nextQuestionNr = questionNr + 1;
  if(nextQuestionNr >= questions.length){
    $('#btnSubmit').fadeIn('slow');
    $('#btnNext').hide(); 
  } else{
    $('#btnNext').show();
  }
  if(nextQuestionNr <= questions.length){
    location.replace("#" + nextQuestionNr);
    get_question(nextQuestionNr);
    set_click_event();
  }
}

function check_correct_answers(){
  var username = prompt("State your name please")
  var points = 0;
  if(username === null) return;
  $.each(questions, function(i, question){
    if(answers[i] !== null && question.correctAnswer === answers[i]){
      points++;
    }
  });
  socket.emit('addUserToHighscore', {'name' : username, 'points' : points, 'authHash' : createAuthHash(points)});
}