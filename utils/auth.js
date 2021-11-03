const { admin, db, firebase } = require('../utils/admin');
const { validateSignUPData, validateLoginData } = require('../utils/helper')
//
exports.signUp = (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
    };
    const { valid, errors } = validateSignUPData(newUser);
    if (!valid)//checking validation
        return res.status(400).json(errors);
    let token, userId;
    db.collection('users').where('email', '==', newUser.email).get()
        .then(doc => {
            if (doc.exists) {
                return res.status(400).json({ handle: 'The user id already taken' });
            } else {
                return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
            }
        }).then(data => {
            userId = data.user.uid
            return data.user.getIdToken();
        }).then(idToken => {
            token = idToken
            const userCredentials = {
                userId,
                email: newUser.email,
                createdAt: new Date().toISOString(),
            }
            db.doc(`/users/${userId}`).set(userCredentials);
        }).then(() => {
            return res.status(201).json({ token })
        })
        .catch(err => {
            if (err.code == 'auth / email - already -in -use') {
                return res.status(400).json({ email: 'Email already exist!' })
            }
            return res.status(500).json({ error: err.message })
        });
}
exports.signIn = (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    }
    const { valid, errors } = validateLoginData(user);
    if (!valid) return res.status(400).json(errors)
    firebase.auth().signInWithEmailAndPassword(user.email, user.password)//firebase signin method
        .then(data => {
            console.log(JSON.stringify(data))
            return data.user.getIdToken();
        }).then(token => {
            return res.json({ token })
        }).catch(err => {
            if (err.code == 'auth / wrong - password' || err.code == 'auth / user - not - found') {
                return res.status(403).json({ message: 'Wrong credentials, Please try again' });
            }
            return res.status(500).json({ error: err.code })
        })
}