const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path"); //requiring EJS
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");

const listings = require("./routes/listing.js");
const reviews = require("./routes/review.js");

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
app.use("/listings", listings);
app.use("/listings/:id/reviews", reviews);

const sessionOptions = {
  secret: "mysecretcode",
  resave: false,
  saveUninitialized: true,
};

app.use(session(sessionOptions));

//---------------------------------------------------------------------------------------

app.get("/", (req, res) => {
  res.send("Hi, I am root");
});

//---------------------------------------------------------------------------------------
//Sever Side Validation

//---------------------------------------------------------------------------------------

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
app.use((err, req, res, next) => {
  console.error("🔥 ERROR:", err.message);
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).render("error.ejs", { err });
});

//---------------------------------------------------------------------------------------
app.listen(8080, () => {
  console.log("server is listening to port 8080");
});
