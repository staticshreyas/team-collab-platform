var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var mongoose = require('mongoose');
const compression = require('compression')
require('dotenv').config()

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var expressHbs = require('express-handlebars');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const Handlebars = require('handlebars');

var app = express();

//mongoose.connect('mongodb://localhost:27017/tcp', { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.connect(process.env.MONGO_URL,{useNewUrlParser: true, useUnifiedTopology: true})


const hbs = expressHbs.create({
  defaultLayout: 'layout',
  extname: '.hbs',
  handlebars: allowInsecurePrototypeAccess(Handlebars),
  //create custom helpers
  helpers: {
    ifEquals: function (arg1, arg2, options) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    },
    ifCond: function (v1, operator, v2, options) {
      switch (operator) {
        case '==':
          return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '===':
          return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
          return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '!==':
          return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
          return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
          return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
          return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
          return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
          return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
          return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
          return options.inverse(this);
      }
    },
    section: function (name, options) {
      if (!this._sections) this._sections = {};
      this._sections[name] = options.fn(this);
      return null;
    },
    lazyEach: function (context, options) {
      var fn = options.fn;
      var i = 0, ret = "", data;

      if (Handlebars.Utils.isFunction(context)) { context = context.call(this); }

      if (options.data) {
        data = Handlebars.createFrame(options.data);
        //console.log(data)
      }

      if (context && typeof context === 'object') {
        if (Handlebars.Utils.isArray(context)) {
          console.log(context.length)

          var loop = function () {

            for (var j = context.length; i < j; i++) {
              if (data) {
                data.index = i;
                data.first = (i === 0);
                data.last = (i === (context.length - 1));
              }
              ret = ret + fn(context[i], { data: data });
              //console.log(ret)

              if (i % 5 == 0) {
                i++;
                setTimeout(loop, 1);
                break;
              }
            }
          }
          loop();
        }
      }
      return ret;
    }
  }
})

// view engine setup
app.engine('.hbs', hbs.engine);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'mysupersecret',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({ mongooseConnection: mongoose.connection }),
  cookie: { maxAge: 60 * 60 * 24 * 5 * 1000 }
}));

app.use(function (req, res, next) {
  res.locals.session = req.session;
  next();
});

app.use(compression())

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

port = 5000
app.listen(port, function (err) {
  if (err) {
    console.log(err)
  }
  else {
    console.log("Listening to port:", port)
  }
})

module.exports = app;
