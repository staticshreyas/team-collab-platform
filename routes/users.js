var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/login', function(req, res, next) {
  res.render('user/signin');
});

router.get('/signup', function(req, res, next) {
  res.render('user/signup');
});

router.get('/dashboard', function(req, res, next) {
  res.render('user/dashboard');
});

router.get('/projects', function(req, res, next) {
  res.render('user/projects');
});

router.get('/projectDetails', function(req, res, next) {
  res.render('user/projectDetails');
});
module.exports = router;
