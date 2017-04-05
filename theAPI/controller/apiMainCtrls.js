
var User = require('../model/userSchema.js');
var Comment = require('../model/commentsSchema');
var paginate = require('mongoose-range-paginate');
var pugCompiler = require('../../shared/pugCompiler');
var nodemailer = require('nodemailer');
var passport = require('passport');
var mongoose    = require('mongoose');
var serverSideValidation = require('../../shared/serverSideValidation.js');
var evaluateUserEmail = require('../../shared/evaluateUserEmail.js');

var sortKey = 'time'
var sort = '-' + sortKey
var sortDocsFrom = 0;

var sendJSONresponse = function(res, status, content) {
  res.status(status);
  res.json(content);
};

module.exports.getIndexResponse = function(req, res) {
  sendJSONresponse(res, 200), { "response": "getIndexResponse Response!!!" };
};

module.exports.getUserHomeResponse = function(req, res) {
  sendJSONresponse(res, 200), { "response": "getUserHomeResponse Response!!!" };
};

var buildGetCommentsResponse = function(req, res, results) {
  var responseBody = [];
  results.forEach(function(doc) {
    responseBody.push({
      id: doc._id,
      displayname: doc.displayname,
      commenterId: doc.commenterId,
      city: doc.city,
      state: doc.state,
      datecreated: doc.datecreated,
      candidate: doc.candidate,
      comment: doc.comment,
      recommended: doc.recommended,
      subComments: doc.subComments
    });
  });
  return responseBody;
};


function getQuery() {
  return Comment.find()
    .where({})
}

module.exports.getCommentsResponse = function(req, res) {
  paginate(getQuery(), { sort: sort, limit: 5 }).exec(function (err, results) {
    var responseBody;
    if (err) {
      sendJSONresponse(res, 404, err);
    } else {
      sortDocsFrom = 4;
      responseBody = buildGetCommentsResponse(req, res, results);
      sendJSONresponse(res, 200, responseBody);
    }
  })
};


module.exports.getUserProfileResponse = function(req, res) {
  if (req.params && req.params.userid) {
    User.findById(req.params.userid).exec(function(err, user) {
        if (!user) {
          sendJSONresponse(res, 404, { "response": "userid not found" });
          return;
        } else if (err) {
          sendJSONresponse(res, 404, err);
          return;
        }
        sendJSONresponse(res, 200, user);
      });
  } else {
    sendJSONresponse(res, 404, { "response": "No userid in request" });
  }
};


var doAddComment = function(req, res, location, author) {
  if (!location) {
    sendJSONresponse(res, 404, "locationid not found");
  } else {
    location.reviews.push({
      author: author,
      rating: req.body.rating,
      reviewText: req.body.reviewText
    });
    location.save(function(err, location) {
      var thisReview;
      if (err) {
        sendJSONresponse(res, 400, err);
      } else {
        updateAverageRating(location._id);
        thisReview = location.reviews[location.reviews.length - 1];
        sendJSONresponse(res, 201, thisReview);
      }
    });
  }
};


module.exports.postMainCommentResponse = function(req, res) {
  Comment.create({
    displayname: req.body.displayname,
    commenterId: req.body.commenterId,
    city: req.body.city,
    state: req.body.state,
    candidate: req.body.candidate,
    comment: req.body.comment
  }, function(err, electioncomment) {
    if (err) {
      sendJSONresponse(res, 400, err);
    } else {
      sendJSONresponse(res, 201, electioncomment);
    }
  });
};


module.exports.postSubCommentResponse = function(req, res) {
  if (!req.params.subcommentid) {
    sendJSONresponse(res, 404, { 'response': "subcommentid not found" });
    return; 
  }
  Comment.findById(req.params.subcommentid).select('subComments').exec(function(err, comment) {
    if (err) {
      sendJSONresponse(res, 400, err);
    }else{
      comment.subComments.push({
        displayname: req.body.displayname,
        commenterId: req.body.commenterId,
        city: req.body.city,
        state: req.body.state,
        comment: req.body.comment
      });
      comment.save(function(err, comment) {
        var newComment;
        if (err) {
          sendJSONresponse(res, 400, err);
        } else {
          newComment = comment.subComments[comment.subComments.length - 1];
          sendJSONresponse(res, 201, newComment);
        }
      });
    }
  });
};

var getCommentUser = function(req, res, cb) {
  if (req.payload.email) {
    User.findOne({ email : req.payload.email }).exec(function(err, user) {
        if (!user) {
          sendJSONresponse(res, 404, { "response": "User not found" });
          return;
        } else if (err) {
          console.log(err);
          sendJSONresponse(res, 404, err);
          return;
        }
        console.log(user);
        cb(req, res, user.name);
      });
  } else {
    sendJSONresponse(res, 404, { "response": "User not found" });
    return;
  }
};


module.exports.getOneCommentResponse = function(req, res) {
  if (req.params && req.params.commentid) {
    User.findById(req.params.commentid).exec(function(err, results) {
        if (!results) {
          sendJSONresponse(res, 404, {"response": "commentid not found"});
        } else if (err) {
          sendJSONresponse(res, 404, err);
        }
        sendJSONresponse(res, 200, results);
      });
  } else {
    sendJSONresponse(res, 404, {
      "response": "No commentid in request"
    });
  }
};


module.exports.editOneComment = function(req, res) {
  //
};

module.exports.deleteOneComment = function(req, res) {
  var commentsid = req.params.commentsid;
  if (!commentsid) {
    sendJsonResponse(res, 404, {
    "response": "Not found, locationid and reviewid are both required"
  });
    return; 
  }
  
  if (commentsid) {
    User.findByIdAndRemove(commentsid).exec(function(err, comment) {
          if (err) {
            sendJSONresponse(res, 404, err);
          }
          sendJSONresponse(res, 204, null);
        }
    );
  } else {
    sendJSONresponse(res, 404, { "response": "No commentid in request" });
  }
};


module.exports.getResetPasswordResponse = function(req, res) {
  sendJSONresponse(res, 200), { "response": "getResetPasswordResponse Response!!!" };
};

module.exports.postValidateLogin = function(req, res, next) {
  console.log('#### postValidateLogin');

  if(!req.body.email || !req.body.password) {
    console.log('#### postValidateLogin > error');
    sendJSONresponse(res, 400, { 'response': 'All fields required' });

  }else{

    passport.authenticate('local', function(err, user, info){
      if (err) {
        console.log('#### postValidateLogin > error');
        sendJSONresponse(res, 404, err);
        return;
      }
      if (info) {
        console.log('#### postValidateLogin > error');
        sendJSONresponse(res, 401, info);
        return;
      }
      if(user){
        console.log('#### postValidateLogin > USER: ', user.id);
        req.logIn(user, function(err) {
          if (err) { 
            console.log('#### postValidateLogin > error');
            sendJSONresponse(res, 404, err);
            return;
          }
          User.findById(user.id).exec(function(err, user) {
            if (err) {
              console.log('#### postValidateLogin > error');
              sendJSONresponse(res, 404, err);
              return;
            }
            if(user){
              user.previouslogin = user.lastlogin;
              user.lastlogin = new Date();
              user.save(function(err, success) {
                if (err) {
                  console.log('#### postValidateLogin > error');
                  sendJSONresponse(res, 404, err);
                } else { 
                  var htitle = 'Election App 2016!';
                  var stitle = 'Log In or Sign Up to join the discussion';
                  var data = {
                    title: 'ThisGreatApp!',
                    pageHeader: {
                      title: htitle
                    },
                    subtitle: stitle,
                    prevLogin: req.user.previouslogin
                  };
                  sendJSONresponse(res, 201, { 'response': 'success' });
                }
              });
            }else{
              sendJSONresponse(res, 404, { 'response': 'userid not found' });
            }
          });
        });
      } else {
        sendJSONresponse(res, 401, { 'response': 'error' });
      }
    })(req, res, next);
  }
};

module.exports.postLoginResponse = function(req, res, next) {
  if(!req.body.email || !req.body.password) {
    sendJSONresponse(res, 400, { "response": "All fields required" });
  }else{

    passport.authenticate('local', function(err, user, info){
      if (err) {
        console.log('#### apiMainCtrls > postLoginResponse > error');
        sendJSONresponse(res, 404, err);
        return;
      }
      if (info) {
        console.log('#### apiMainCtrls > postLoginResponse > error');
        sendJSONresponse(res, 401, info);
        return;
      }

      if(user){
        console.log('#### apiMainCtrls > postLoginResponse > passport.authenticate > req.user: : ', req.user);

        req.logIn(user, function(err) {
          console.log('#### apiMainCtrlsX > postLoginResponse > req.logIn');
          if (err) { 
            console.log('#### apiMainCtrls > postLoginResponse > req.logIn > error');
            sendJSONresponse(res, 404, err);
            return;
          }
          console.log('#### apiMainCtrls > postLoginResponse > req.logIn > req.user: : ', req.user);
          user.previouslogin = user.lastlogin;
          user.lastlogin = new Date();
          user.save(function(err, success) {
            if (err) {
              console.log('#### apiMainCtrls > postLoginResponse > error');
              sendJSONresponse(res, 404, err);
            } else { 
              console.log('#### apiMainCtrls > postLoginResponse > req.logIn');
              sendJSONresponse(res, 201, { 'response': 'success' });
            }
          });
        });
      }
    })(req, res, next);
  }
};

module.exports.updateUserResponse = function(req, res) {
  if (!req.params.userid) {
    sendJSONresponse(res, 404, { "response": "All fields required" });
    return;
  }
  User.findById(req.params.userid).exec(function(err, user) {
    if (err) {
      sendJSONresponse(res, 400, err);
      return;
    } 
    if (!user || user === null) {
      sendJSONresponse(res, 404, user);
      return;
    }
    user.previouslogin = user.lastlogin;
    user.lastlogin = new Date();
    user.save(function(err, success) {
      if (err) {
        sendJSONresponse(res, 404, err);
      } else {
        sendJSONresponse(res, 200, success);
      }
    });
  });
};

var testValidatedUserInput = function (v) {
  for (var key in v){
    console.log('####### > testValidatedUserInput: ', key, ' : ', v[key]);
    if(v[key].hasOwnProperty('error')){
      console.log('####### > testValidatedUserInput > error: ', key, ' : ', v[key]);
      return true;
    }
  }
};

module.exports.ajaxEvaluateUserProfile = function(req, res) {

  var idDataValid = serverSideValidation(req.body.pathName, req.body.pathNameData);

  if(!idDataValid){

    sendJSONresponse(res, 400, { 'response': 'error' });

  }else{

    if(req.body.pathName === 'email'){

      evaluateUserEmail(req.body.email, req.body.expectedResponse, function(response) {

        User.findById(res.locals.currentUser.id).exec(function(err, user) {
          if (user){
            user.email = req.body.pathNameData;
            user.save(function(err) {
              if (err) {
                sendJSONresponse(res, 404, { 'response': 'error' });
              } else {
                sendJSONresponse(res, 200, { 'response': 'success' });
              }
            });
          }else{
            sendJSONresponse(res, 400, { 'response': 'error' });
          }
        });
      });

    }else if(req.body.pathName === 'password'){

    }else{


    }
  }
};


module.exports.ajaxEvaluateRegisteredUser = function(req, res, next) {

  if(!req.body.email || !req.body.password) {
    sendJSONresponse(res, 400, { 'message': 'error' });
  }else{

    passport.authenticate('local', function(err, user, info){
      if (err) {
        sendJSONresponse(res, 404, { 'message': 'error' });
        return;
      }
      if (info) {

        // returns message either incorrect username or password
        sendJSONresponse(res, 401, { 'message': 'error' });
        return;

      }
      if(user){

        sendJSONresponse(res, 201, { 'message': 'success' });

      }
    })(req, res, next);
  }
};


module.exports.ajaxEvaluateUserEmail = function(req, res) {

  evaluateUserEmail(req.body.email, req.body.expectedResponse, function(response) {
    sendJSONresponse(res, response.status, { 'response': response.response });
  });
  
};



// will include nodemailer for ForgotPassword later/last
// for client, only testing if email is invalid, otherwise indicating instructions sent to reset password
// but instructions only really sent if email is a registered email

module.exports.ajaxForgotPassword = function(req, res) {

  var template = {email: 'required',
                  expectedResponse: 'false'};

  var testerJOB = {email: '   aaa  1@aaa.com     '};

  //req.body = testerJOB;

  serverSideValidation(req, res, template, function(validatedResponse) {

    var validationErrors = false;

    for(var prop in validatedResponse) {

      if(validatedResponse[prop].error === 'empty' || validatedResponse[prop].error === 'invalid'){

        validationErrors = true;
        break;

      }
    }

    if(!validationErrors){

      if(validatedResponse['email'].error === 'registered'){

        // Nodemailer will be initiated here +++++++
        sendJSONresponse(res, 201, { 'response': 'success' });

      }else{

        sendJSONresponse(res, 201, { 'response': 'success' });

      }
      
    }else{
      
      sendJSONresponse(res, 201, { 'response': 'error' });

    }
  });
};



var validateMaxLengthUserInput = function (val,maxlen) {
  var newVal = (val.length) - maxlen;
  newVal = (val.length) - newVal;
  newVal = val.slice(0,newVal);
  return newVal;
};


module.exports.ajaxLoginUser = function(req, res){

  var template = {email: 'required',
                  password: 'required', 
                  expectedResponse: 'true'};

  var testerJOB = {email: 'aaa1@aa a.com',
                    password: '  pppp   '};

  // req.body = testerJOB;

  serverSideValidation(req, res, template, function(validatedResponse) {

    var validationErrors = false;

    for(var prop in validatedResponse) {

      if(validatedResponse[prop].error !== false && validatedResponse[prop].error !== 'match'){

        validationErrors = true;
        break;

      }
    }

    if(!validationErrors){

      passport.authenticate('local', function(err, user, info){

        if (err) {
          sendJSONresponse(res, 404, { 'response': 'error' });
          return;
        }
        if (info) {
          sendJSONresponse(res, 401, { 'response': 'error' });
          return;
        }

        req.logIn(user, function(err) {
          
          if (err) { 
            sendJSONresponse(res, 404, { 'response': 'error' });
            return;

          }else{

            user.previouslogin = user.lastlogin;
            user.lastlogin = new Date();

            user.save(function(err, success) {
              if (err) {
                sendJSONresponse(res, 404, { 'response': 'error' });
              } else {
                sendJSONresponse(res, 201, { 'response': 'success', 'redirect': 'https://localhost:3000/userhome' });
              }
            });
          }
        });
      })(req, res);

    }else{
      
      sendJSONresponse(res, 201, { 'response': 'error', 'validatedData': validatedResponse });

    }
  });
};

/*
{ displayname: 'cdscscd',
email: 'cdscsdcds@csccsdcd.com',
confirmEmail: 'cdscsdcds@csccsdcd.com',
password: 'qqqq',
confirmPassword: 'qqqq',
firstname: '          vvdfvdfvdfvfddfvdf     ',
lastname: 'fv   gbbbfgbgbfg     ',
city: '              nbnnhgngngnhnhgnghnh   bgbfgbfgbgfb',
state: '{"initials":"AL","full":"Alabama"}',
_csrf: 'yiafwn0A-MylfKIb_HlcPA3ZCnBeQYYFAvvY' }
*/

// AbcdefghijklmnopqrstUvwxyzabcdefghIjklmnopqrstuvwxyz
module.exports.ajaxSignUpUser = function(req, res){

  var template = {displayname: 'required', 
                        email: 'required',
                        confirmEmail: 'required', 
                        password: 'required', 
                        confirmPassword: 'required',
                        firstname: 'required', 
                        lastname: 'required', 
                        city: 'required', 
                        state: 'required',
                        expectedResponse: 'false'};

  var testerJOB = {displayname: ' displaynameABC123',
                    email: 'aaa1@aaa.com',
                    confirmEmail: '        aaa@aaa.com     ',
                    password: 'pppp',
                    confirmPassword: 'pppp ',
                    firstname: '          Abcdefghijklmnopqrst             ',
                    lastname: '   Ccccc Cityyyyyyyy     ',
                    city: '               AbcdefghijklmnopqrstUvwxyzabcdefghIjklmnopqrstuvwxyz          ',
                    state: { initials: 'NY', full: 'New York' }};

  var testerJOB2 = {displayname: ' displaynameABC123',
                    email: 'aaa1@aaa.com',
                    confirmEmail: '        aaa@aaa.com     ',
                    password: 'pppp',
                    confirmPassword: 'pppp '};

  //req.body = testerJOB2;

  serverSideValidation(req, res, template, function(validatedResponse) {

    Object.keys(validatedResponse).forEach(function(prop) {
      //console.log('Object.keys(validatedResponse): ', prop, ' || ', validatedResponse[prop]);
      //console.log('Object.keys(validatedResponse) error: ', prop, ' || ', validatedResponse[prop].error);
    });
    
    var validationErrors = false;

    for(var prop in validatedResponse) {

      if(validatedResponse[prop].error !== false && validatedResponse[prop].error !== 'match'){

        validationErrors = true;
        break;

      }
    }

    if(!validationErrors){

      sendJSONresponse(res, 201, { 'response': 'success', 'redirect': 'https://localhost:3000/userhome' });

    }else{

      sendJSONresponse(res, 201, { 'response': 'error', 'validatedData': validatedResponse });

    }
  });
};


