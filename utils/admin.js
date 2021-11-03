const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();
const firebase = require('firebase');

module.exports = { admin, db,firebase};