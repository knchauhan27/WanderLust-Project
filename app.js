const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path"); //requiring EJS
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const Review = require("./models/review.js");
const { listingSchema, reviewSchema } = require("./schema");
// const session = require("express-session");
// const flash = require("connect-flash");
//---------------------------------------------------------------------------------------
//DataBase Connections
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}
//---------------------------------------------------------------------------------------
//MiddleWares
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); //setting index.ejs
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

//---------------------------------------------------------------------------------------

app.get("/", (req, res) => {
  res.send("Hi, I am root");
});

//---------------------------------------------------------------------------------------
//Sever Side Validation
//validate Schema
const validateListing = (req, res, next) => {
  let { error } = listingSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    return next(new ExpressError(400, errMsg)); //  throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};

//Review Schema Validation
const validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);

  if (error) {
    const errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next(); // not null()
  }
};
//---------------------------------------------------------------------------------------

//Index Route
app.get(
  "/listings",
  wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
  })
);

//New Route
app.get(
  "/listings/new",
  wrapAsync((req, res) => {
    res.render("listings/new.ejs");
  })
);

//Show Route
app.get(
  "/listings/:id",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews");

    if (!listing) {
      // req.flash("error", "Listing does not exist! It may have been deleted.");
      return res.redirect("/listings");
    }

    res.render("listings/show.ejs", { listing });
  })
);

//Create Route
app.post(
  "/listings",
  validateListing,
  wrapAsync(async (req, res, next) => {
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listings");
  })
);

//Edit Route
app.get(
  "/listings/:id/edit",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", { listing });
  })
);

//Update Route
app.put(
  "/listings/:id",
  validateListing,
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    res.redirect(`/listings/${id}`);
  })
);

//Delete Route
app.delete(
  "/listings/:id",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);

    // req.flash("success", "Listing deleted successfully!");
    console.log(deletedListing);
    res.redirect("/listings");
  })
);
//---------------------------------------------------------------------------------------
//Reviews
//Post
app.post(
  "/listings/:id/reviews",
  validateReview,
  wrapAsync(async (req, res) => {
    let listing = await Listing.findById(req.params.id);

    let newReview = new Review(req.body.review);
    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();

    console.log("New Review Saved");

    res.redirect(`/listings/${listing._id}`);
  })
);

app.delete("/listings/:id/reviews/:reviewId", async (req, res, next) => {
  let { id, reviewId } = req.params;
  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);

  res.redirect(`/listings/${id}`);
});

// app.get("/testListing", async (req, res) => {
//   let sampleListing = new Listing({
//     title: "My New Villa",
//     description: "By the beach",
//     price: 1200,
//     location: "Calangute, Goa",
//     country: "India",
//   });

//   await sampleListing.save();
//   console.log("sample was saved");
//   res.send("successful testing");
// });

//---------------------------------------------------------------------------------------
//Error Handling
app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found Bhaila"));
});

// app.use((err, req, res, next) => {
//   console.error(err);
//   res.status(500).send("Something Went Wrong!");
//   let { statusCode, message } = err;
//   res.status(statusCode).send(message);
// });

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Something went wrong";

  res.status(statusCode).render("error.ejs", { err });
});

//---------------------------------------------------------------------------------------
app.listen(8080, () => {
  console.log("server is listening to port 8080");
});
