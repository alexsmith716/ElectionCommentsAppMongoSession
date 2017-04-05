
var cookieParser      = require('cookie-parser');
var csrf              = require('csurf');
var bodyParser        = require('body-parser');
var express 			    = require('express');
var router 				    = express.Router();
var serverControllers = require('../controller/serverMainCtrls');
var auth              = require('../../shared/auth');
var csrfProtection 		= csrf({ cookie: true });


router.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  //res.locals.currentURL = req.url;
  if(res.locals.currentUser){
    //.session.paginateFrom = res.locals.sortDocsFrom;
    //req.session.lastPageVisited = '/indexView';
  }
  next();
});


router.get('/', serverControllers.getIndex);

router.get('/resetpassword', csrfProtection, serverControllers.getResetPassword);
router.get('/loginorsignup', serverControllers.getLoginOrSignup);
router.get('/notifyError', serverControllers.getNotifyError);

router.get('/userhome', auth.ensureAuthenticated, serverControllers.getUserHome);
router.get('/membersonly', auth.ensureAuthenticated, serverControllers.getMembersOnly);

router.get('/comments', auth.ensureAuthenticated, csrfProtection, serverControllers.getComments);
router.post('/comments/maincomment', auth.ensureAuthenticated, csrfProtection, serverControllers.postMainComment);
router.post('/comments/subcomment/:subcommentid', auth.ensureAuthenticated, csrfProtection, serverControllers.postSubComment);


router.get('/signup', csrfProtection, serverControllers.getSignup);
router.get('/login', csrfProtection, serverControllers.getLogin);
router.get('/userprofile', auth.ensureAuthenticated, csrfProtection, serverControllers.getUserProfile);

router.get('/logout', auth.ensureAuthenticated, serverControllers.getLogout);

router.get('/dummypage', serverControllers.getDummyPage);
router.get('/resources', serverControllers.getResouces);
router.get('/about', serverControllers.getAbout);
router.get('/contact', serverControllers.getContact);
router.get('/team', serverControllers.getTeam);

module.exports = router;

