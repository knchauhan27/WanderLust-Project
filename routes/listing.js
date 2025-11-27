const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isOwner, validateListing, isLoggedIn } = require("../middleware.js");
const listingController = require("../controllers/listings.js");

//Index Route
router.get("/", wrapAsync(listingController.index));

//New Route
router.get("/new", isLoggedIn, wrapAsync(listingController.renderNewForm));

//Show Route
router.get("/:id", isLoggedIn, wrapAsync(listingController.show));

//Create Route
router.post(
  "/",
  validateListing,
  isLoggedIn,
  wrapAsync(listingController.createNewListing)
);

//Edit Route
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync());

//Update Route
router.put(
  "/:id",
  validateListing,
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.updateForm)
);

//Delete Route
router.delete(
  "/:id",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.destroyListing)
);

// Download PDF Route
router.get("/:id/export/pdf", wrapAsync(listingController.generatePdf));

module.exports = router;
