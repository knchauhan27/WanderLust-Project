const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isOwner, validateListing, isLoggedIn } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

router
  .route("/")
  .get(wrapAsync(listingController.index)) //Index Route
  .post(
    isLoggedIn,
    upload.single("image"), //this should be before the validateListing
    validateListing,
    wrapAsync(listingController.createNewListing) //Create Route
  );

//New Route
router.get("/new", isLoggedIn, wrapAsync(listingController.renderNewForm));

router
  .route("/:id")
  .get(isLoggedIn, wrapAsync(listingController.show)) //Show Route
  .put(
    //Update Route
    isLoggedIn,
    isOwner,

    upload.single("image"),
    validateListing,

    wrapAsync(listingController.updateForm)
  )
  .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing)); //Update Route

//Edit Route
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.editForm)
);

// Download PDF Route
router.get("/:id/export/pdf", wrapAsync(listingController.generatePdf));

module.exports = router;
