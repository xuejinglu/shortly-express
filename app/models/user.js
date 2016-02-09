var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');




var User = db.Model.extend({
  tableName: 'users',
  initialize: function() {
      this.on('creating', this.hashPassword, this);
  },
  hashPassword: function(model, password) {
      bcrypt.hash(password, null, null, function(err, hash) {
        console.log(hash);
        model.set('password', hash);
      });
    }
});

module.exports = User;