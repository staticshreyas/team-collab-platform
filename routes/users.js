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
module.exports = router;
