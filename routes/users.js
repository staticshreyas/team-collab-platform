var express = require('express');
var router = express.Router();
var mongoose = require('mongoose')

const multer = require('multer')
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __dirname + '../../public/profilepics')
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  }
});
var upload = multer({ storage: storage })

var api = require('../api/api')

var fs = require('fs');
var path = require('path');

const admin = require("firebase-admin");
var firebase = require('firebase')
const firebaseConfig = require('../fireBaseConfig.json')

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var auth = firebase.auth();
auth.setPersistence(firebase.auth.Auth.Persistence.NONE);
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.BUCKET_URL
});

const db = admin.firestore()
var bucket = admin.storage().bucket();

var projectModel = require('../models/Project');
var taskModel = require('../models/Task')

/* GET users listing. */
router.get('/login', function (req, res, next) {
  const sessionCookie = req.cookies.session || "";
  if (sessionCookie) {
    admin
      .auth()
      .verifySessionCookie(sessionCookie, true /** checkRevoked */)
      .then((user) => {
        res.redirect('/users/profile');
      });
  } else {
    res.render('user/signin')
  }
});

router.post("/login", (req, res) => {
  var email = req.body.login
  var password = req.body.password
  auth
    .signInWithEmailAndPassword(email, password)
    .then(({ user }) => {
      user.getIdToken().then((idToken) => {
        const expiresIn = 60 * 60 * 24 * 5 * 1000;
        admin
          .auth()
          .createSessionCookie(idToken, { expiresIn })
          .then(
            (sessionCookie) => {
              const options = { maxAge: expiresIn, httpOnly: true };
              res.cookie("session", sessionCookie, options);
              //res.cookie('loggedIn','success')
              //res.end(JSON.stringify({ status: "success" }));
              req.session.user = sessionCookie
              res.redirect('/users/profile')
            },
            (error) => {
              res.render('user/signup', { Error: error })
              //res.status(401).send("UNAUTHORIZED REQUEST!");
            }
          );

      })
    }).catch((error) => {
      console.log(error.message)
      res.render('user/signin', { Error: error.message })
    })
});

router.get('/signup', function (req, res, next) {
  const sessionCookie = req.cookies.session || "";
  if (sessionCookie) {
    admin
      .auth()
      .verifySessionCookie(sessionCookie, true /** checkRevoked */)
      .then((user) => {
        res.redirect('/users/profile');
      });
  } else {
    res.render('user/signup')
  }
});


router.post("/signup", (req, res) => {
  var email = req.body.email
  var password = req.body.password
  auth
    .createUserWithEmailAndPassword(email, password)
    .then(({ user }) => {
      //console.log(req.body.pic)
      //firebase.storage.ref('users/' + user.uid + '/profile.jpg').put(req.body.pic);
      db.collection('users').doc(user.uid).set({
        name: req.body.name,
        email: req.body.email,
        bio: req.body.bio,
        phone: req.body.phone,
        location: req.body.location,
        designation: req.body.designation,
        uid: user.uid
      });
      user.getIdToken().then((idToken) => {

        const expiresIn = 60 * 60 * 24 * 5 * 1000;
        admin
          .auth()
          .createSessionCookie(idToken, { expiresIn })
          .then(
            (sessionCookie) => {
              const options = { maxAge: expiresIn, httpOnly: true };
              res.cookie("session", sessionCookie, options);
              //res.cookie('loggedIn','success')
              //res.end(JSON.stringify({ status: "success" }));
              req.session.user = sessionCookie
              res.redirect('/users/profilePicUpload')
            },
            (error) => {
              res.render('user/signup', { Error: error })
              //res.status(401).send("UNAUTHORIZED REQUEST!");
            }
          );

      })
    }).catch((error) => {
      console.log(error.message)
      res.render('user/signup', { Error: error.message })
    })
});

router.get('/profilePicUpload', function (req, res, next) {
  const sessionCookie = req.cookies.session || "";
  if (sessionCookie) {
    admin
      .auth()
      .verifySessionCookie(sessionCookie, true /** checkRevoked */)
      .then((user) => {
        res.render('user/profilePicUpload');
      });
  } else {
    res.redirect('/users/login')
  }
});

router.post('/profilePicUpload', upload.single('photo'), async (req, res) => {
  let data = await fs.readFileSync(path.join(__dirname + '../../public/profilepics/' + req.file.filename))
  let base64 = data.toString('base64');
  let image = new Buffer(base64, 'base64');

  const sessionCookie = req.cookies.session || "";
  if (sessionCookie) {
    admin
      .auth()
      .verifySessionCookie(sessionCookie, true /** checkRevoked */)
      .then(async (user) => {

        //console.log(user)
        if (user) {
          const fileName = 'profile.jpg'
          await bucket.file('users/' + user.uid + '/' + fileName).createWriteStream().end(image)
          res.redirect('/users/projects')
        } else {
          res.redirect('/users/login')
        }
      })
  }
})

router.get('/profile', function (req, res, next) {
  const sessionCookie = req.cookies.session || "";
  admin
    .auth()
    .verifySessionCookie(sessionCookie, true /** checkRevoked */)
    .then((user) => {
      //console.log(user)
      db.collection('users').doc(user.uid).get().then((dataRef) => {
        //console.log(dataRef.data())
        var data = dataRef.data();
        var location = data.location;
        var phone = data.phone;
        var email = data.email;
        var name = data.name;
        var bio = data.bio;
        var designation = data.designation;
        bucket.file('users/' + user.uid + '/profile.jpg').getSignedUrl({
          action: 'read',
          expires: Date.now() + 1000 * 60 * 2
        }).then((url) => {
          //console.log(url);
          var src = url[0];
          var obj = api.userProjects(user.uid);
          obj.then(projects => {
            //console.log(projects)
            res.render('user/profile', { name: name, location: location, phone: phone, email: email, bio: bio, designation: designation, src: src, projects: projects });
          })
        })
      }).catch(error => {
        console.log(error);
      })

    })
    .catch((error) => {
      console.log(error)
      res.redirect("/users/login");
    });

});

router.get('/logout', function (req, res, next) {
  res.clearCookie("session");
  req.session.user = null
  auth.signOut();
  res.redirect('/users/login');
})

router.get('/dashboard', function (req, res, next) {
  res.render('user/dashboard');
});

router.get('/projects', function (req, res, next) {

  const sessionCookie = req.cookies.session || "";
  admin
    .auth()
    .verifySessionCookie(sessionCookie, true /** checkRevoked */)
    .then((user) => {
      //console.log(user)
      var obj = api.userProjects(user.uid);
      obj.then(projects => {
        //console.log(projects)
        res.render('user/projects', { projects: projects });
      })

    })
    .catch((error) => {
      console.log(error)
      res.redirect("/users/login");
    });

});

router.post('/createProject', function (req, res, next) {
  const sessionCookie = req.cookies.session || "";
  if (sessionCookie) {
    admin
      .auth()
      .verifySessionCookie(sessionCookie, true /** checkRevoked */)
      .then((user) => {
        console.log(user)

        bucket.file('users/' + user.uid + '/profile.jpg').getSignedUrl({
          action: 'read',
          expires: req.body.dueDate
        }).then(async (url) => {
          //console.log(url);
          var src = url[0];
          db.collection('users').doc(user.uid).get().then(async (dataRef) => {
            //console.log(dataRef.data())
            var data = dataRef.data();
            var teamMembers = []
            var obj = { email: data.email, name: data.name, uid: data.uid, src: src, role: "Owner" }
            teamMembers.push(obj)
            var newProject = {
              projectName: req.body.projectName,
              overview: req.body.overview,
              owner: user.uid,
              budget: req.body.budget,
              dueDate: req.body.dueDate,
              ownerName: data.name,
              teamMembers: teamMembers
            }
            await projectModel.create(newProject, (err, item) => {
              if (err) {
                console.log(err)
              } else {
                item.save();
                res.redirect('/users/projects')
              }
            })

          })

        })

      })
  }
})

router.get('/projectDetails/:id/:error', function (req, res, next) {
  const sessionCookie = req.cookies.session || "";
  var projectId = req.params.id;
  var error = req.params.error
  admin
    .auth()
    .verifySessionCookie(sessionCookie, true /** checkRevoked */)
    .then((user) => {
      //console.log(user)
      var obj = api.projectDetails(projectId)
      obj.then(project => {
        //console.log(project)
        var proOb = api.projectTasks(projectId)
        proOb.then(tasks => {
          var pOId=user.uid
          //console.log(tasks[0].taskOwner == pOId)
          res.render('user/projectDetails', { project: project.project, error: error, tasks:tasks, pOId:pOId });
        })
      })

    })
    .catch((error) => {
      console.log(error)
      res.redirect("/users/login");
    });

});

router.post('/addTeamMember', async function (req, res, next) {
  var email = req.body.memberEmail;
  var projectId = req.body.hiddenpId;

  const userRef = db.collection('users')

  var snap = await userRef.where('email', '==', email).get()

  if (snap.empty) {
    res.redirect('/users/projectDetails/' + projectId + '/' + 1)
  } else {
    snap.forEach(async user => {
      var user = user.data()
      var project = await projectModel.findOne({ _id: mongoose.Types.ObjectId(projectId) })
      bucket.file('users/' + user.uid + '/profile.jpg').getSignedUrl({
        action: 'read',
        expires: project.dueDate
      }).then(async (url) => {
        //console.log(url);
        var src = url[0];
        var obj = { email: user.email, name: user.name, uid: user.uid, src: src, role: "Member" }
        await projectModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(projectId) }, { $push: { teamMembers: obj } }, { new: true })
        res.redirect('/users/projectDetails/' + projectId + '/' + 2)
      })
    })
  }

})

router.post('/addProjectTask', async function (req, res, next) {
  var taskName = req.body.taskName;
  var taskOwner=req.body.taskOwner;
  var projectId = req.body.hiddenpId;
  var dateDue = req.body.taskDue;
  var Assignee = req.body.assignee;
  var assignee = []
  if (!Array.isArray(Assignee)) {
    assignee.push(Assignee)
  } else {
    assignee = Assignee
  }
  var taskStatus = req.body.taskStatus;

  var newTask = {
    project: projectId,
    taskName: taskName,
    dateDue: dateDue,
    taskStatus: taskStatus,
    taskOwner: taskOwner
  }
  await taskModel.create(newTask, (err, item) => {
    if (err) {
      console.log(err)
    } else {
      item.save(function (err, newObj) {
        const userRef = db.collection('users')

        assignee.forEach(userId => {
          userRef.where('uid', '==', userId).get().then(async snap => {
            snap.forEach(async user => {
              var user = user.data()
              var project = await projectModel.findOne({ _id: mongoose.Types.ObjectId(projectId) })
              var url = await bucket.file('users/' + user.uid + '/profile.jpg').getSignedUrl({
                action: 'read',
                expires: project.dueDate
              })
              var src = url[0];
              var obj = {}
              obj.name = user.name
              obj.uid = user.uid
              obj.src = src
              await taskModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(newObj._id) }, { $push: { assignee: obj } }, { new: true })
            })
          })
        })

      });
    }
  })
  res.redirect('/users/projectDetails/' + projectId + '/' + 0)
})

router.post('/changeTaskStatus', async function(req,res,next){
  var taskStatus=req.body.taskStatus
  var projectId=req.body.hiddenpId
  projectId=projectId.toString()
  var taskId=mongoose.Types.ObjectId(req.body.taskId)
    console.log(taskId)
  await taskModel.findOneAndUpdate({_id:taskId}, {taskStatus:taskStatus}, {new:true})
  res.redirect('/users/projectDetails/' + projectId + '/' + 0)
})
module.exports = router;
