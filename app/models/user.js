var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');




var User = db.Model.extend({
  tableName: 'users',
  initialize: function() {
      //this.on('creating', this.hashPassword, this);
  },
  hashPassword: function(password) {
    return new Promise(function(resolve, reject) {
      bcrypt.hash(password, null, null, function(err, hash) {
        if (err) reject(err);
        resolve(hash);
      });
    });
  },
  checkPassword: function(password, comparator){
    return new Promise(function(resolve, reject){
      bcrypt.compare(password, comparator, function(err, res) {
        if(err) reject(err);
        resolve(res);
      });
    });
  }
});

module.exports = User;