const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const Review = require("../models/review.js");
const Listing = require("../models/listing.js");

const reviewController = require("../controllers/review.js");
const {
  isOwner,
  validateListing,
  isAuthor,
  isLoggedIn,
  validateReview,
} = require("../middleware.js");

//Review Schema Validation

//Reviews
//Post
router.post(
  "/",
  isLoggedIn,
  validateReview,
  wrapAsync(reviewController.createReview)
);

router.delete(
  "/:reviewId",
  isLoggedIn,
  isAuthor,
  wrapAsync(reviewController.destroyReview)
);

module.exports = router;
