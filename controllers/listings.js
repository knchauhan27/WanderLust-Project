require("dotenv").config();
const { file } = require("pdfkit");
const Listing = require("../models/listing");
const generateListingPDF = require("../utils/pdfGenerator");

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;

// const mbxGeocoding = require("@mapbox/mapbox-sdk/services/tilesets");
// const mapToken = process.env.MAP_TOKEN;
// const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  console.log(req.user);
  res.render("listings/new.ejs");
};

module.exports.show = async (req, res) => {
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
};

module.exports.createNewListing = async (req, res, next) => {
  // let response = await geocodingClient
  //   .forwardGeocode({
  //     query: req.body.listing.location,
  //     limit: 1,
  //   })
  //   .send();

  // console.log(response.body.features[0].geometry);
  // res.send("done");
  console.log("Loaded token:", MAPBOX_TOKEN);
  const geoRes = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      req.body.listing.location
    )}.json?access_token=${MAPBOX_TOKEN}&limit=1`
  );

  const data = await geoRes.json();

  let url = req.file.path;
  let filename = req.file.filename;
  const newListing = new Listing(req.body.listing);

  newListing.owner = req.user._id;
  newListing.image = { url, filename };
  newListing.geometry = data.features[0].geometry; //saving the coordinates to the DB

  let savedListing = await newListing.save();
  console.log(savedListing);

  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

module.exports.editForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing does not exist! It may have been deleted.");
    return res.redirect("/listings");
  }

  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/h_300,w_250");

  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateForm = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  if (typeof req.file != "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }

  req.flash("success", "Listing has been Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing has been Deleted!");

  // req.flash("success", "Listing deleted successfully!");
  console.log(deletedListing);
  res.redirect("/listings");
};

module.exports.generatePdf = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id).populate("reviews");
  if (!listing) return res.redirect("/listings");

  generateListingPDF(listing, listing.reviews, res);
};
