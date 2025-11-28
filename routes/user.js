const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware");
const userController = require("../controllers/user");

router
  .route("/signup")
  .get(userController.renderSignupPage) //Get a SignUp Form
  .post(wrapAsync(userController.signup)); //Signup User

router
  .route("/login")
  .get(userController.renderLoginPage) //Get a Login Form
  .post(
    //Login User
    saveRedirectUrl,
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true,
    }),
    userController.login
  );

//Logout User
router.get("/logout", userController.logout);

module.exports = router;
