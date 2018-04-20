"use strict";
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { List } = require("../lists/list.model");

const UserSchema = mongoose.Schema({
  username: {
    type: String,
    requried: true,
    unique: true //ask emanuel about updating user with unique field.
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    requried: true,
    unique: true
    // default: ""
  },
  _lists: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lists"
    }
  ],
  resetPasswordToken: String,
  resetPasswordExpires: Date
});

UserSchema.pre("remove", function(next) {
  List.find({
    _id: { $in: this._list }
  }).then(lists => {
    lists.forEach(ele => {
      ele.remove();
    });
  });
});

UserSchema.pre("save", function(next) {
  var user = this;
  var SALT_FACTOR = 5;

  if (!user.isModified("password")) return next();

  bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
    if (err) return next(err);

    bcrypt.hash(user.password, salt, null, function(err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

UserSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

UserSchema.methods.serialize = function() {
  return {
    id: this._id,
    username: this.username || "",
    email: this.email || "",
    _lists: this._lists
  };
};

UserSchema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

UserSchema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 10);
};

const User = mongoose.model("User", UserSchema);

module.exports = { User };
