const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const generateListingPDF = require("../utils/pdfGenerator");
const { isOwner, validateListing, isLoggedIn } = require("../middleware.js");

//Index Route
router.get(
  "/",
  wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
  })
);

//New Route
router.get(
  "/new",
  isLoggedIn,
  wrapAsync((req, res) => {
    console.log(req.user);

    res.render("listings/new.ejs");
  })
);

//Show Route
router.get(
  "/:id",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
      .populate({
        path: "reviews",
        populate: {
          path: "author",
        },
      })
      .populate("owner");

    console.log(listing);

    if (!listing) {
      req.flash("error", "Listing does not exist! It may have been deleted.");
      return res.redirect("/listings");
    }

    res.render("listings/show.ejs", { listing });
  })
);

//Create Route
router.post(
  "/",
  validateListing,
  isLoggedIn,
  wrapAsync(async (req, res, next) => {
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
  })
);

//Edit Route
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
      req.flash("error", "Listing does not exist! It may have been deleted.");
      return res.redirect("/listings");
    }

    res.render("listings/edit.ejs", { listing });
  })
);

//Update Route
router.put(
  "/:id",
  validateListing,
  isLoggedIn,
  isOwner,
  wrapAsync(async (req, res) => {
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    req.flash("success", "Listing has been Updated!");

    res.redirect(`/listings/${id}`);
  })
);

//Delete Route
router.delete(
  "/:id",
  isLoggedIn,
  isOwner,
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing has been Deleted!");

    // req.flash("success", "Listing deleted successfully!");
    console.log(deletedListing);
    res.redirect("/listings");
  })
);

// Download PDF Route
router.get(
  "/:id/export/pdf",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    if (!listing) return res.redirect("/listings");

    generateListingPDF(listing, listing.reviews, res);
  })
);

module.exports = router;
