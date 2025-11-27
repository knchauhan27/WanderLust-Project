const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const Review = require("../models/review.js");
const { reviewSchema } = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");

//Review Schema Validation
const validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);

  if (error) {
    const errMsg = error.details.map((el) => el.message).join(",");
    // throw new ExpressError(400, errMsg);
    return next(new ExpressError(errMsg, 400));
  } else {
    next(); // not null()
  }
};

//Reviews
//Post
router.post(
  "/",
  validateReview,
  wrapAsync(async (req, res) => {
    let listing = await Listing.findById(req.params.id);

    let newReview = new Review(req.body.review);
    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();

    req.flash("success", "Review Submitted!");

    console.log("New Review Saved");

    res.redirect(`/listings/${listing._id}`);
  })
);

router.delete(
  "/:reviewId",
  wrapAsync(async (req, res, next) => {
    let { id, reviewId } = req.params;
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Review Deleted!");
    return res.redirect(`/listings/${id}`);
  })
);

module.exports = router;
