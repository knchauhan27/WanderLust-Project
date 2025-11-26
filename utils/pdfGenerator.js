const PDFDocument = require("pdfkit");
const axios = require("axios");
const QRCode = require("qrcode");

// ===============================
// Download image as buffer
// ===============================
async function fetchImageBuffer(url) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(res.data, "binary");
  } catch (err) {
    console.log("IMAGE DOWNLOAD FAILED:", err.message);
    return null;
  }
}

// ===============================
// Watermark
// ===============================
function drawWatermark(doc) {
  doc.save();
  doc
    .fontSize(100)
    .fillColor("lightgray")
    .opacity(0.2)
    // .rotate(30, { origin: [150, 250] })
    .text("Brainspire", 150, 250);
  doc.restore();
}

// ===============================
// Footer
// ===============================
function drawFooter(doc) {
  const y = doc.page.height - 50;

  const dateTime = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Line
  doc
    .strokeColor("#cccccc")
    .moveTo(50, y - 10)
    .lineTo(doc.page.width - 50, y - 10)
    .stroke();

  // Date-time
  doc
    .fontSize(10)
    .fillColor("#555")
    .text(`${dateTime}`, 50, y, { align: "left" });

  // Page number
  doc.text(`Page ${doc.page.number}`, 50, y, { align: "right" });
}

// ===============================
// Header Bar (Branding)
// ===============================
function drawHeaderBar(doc) {
  doc.rect(0, 0, doc.page.width, 60).fill("#222");

  doc
    .fillColor("#fff")
    .fontSize(20)
    .text("Brainspire | GMERS Medical College ", 50, 20);

  doc.fillColor("#000"); // reset
}

// ===============================
// New Page Helper
// ===============================
function newPage(doc) {
  doc.addPage();
  drawHeaderBar(doc);
  drawWatermark(doc);
  drawFooter(doc);
}

// ===============================
// MAIN PDF GENERATOR
// ===============================
async function generateListingPDF(listing, reviews, res) {
  const doc = new PDFDocument({
    margin: 50,
    autoFirstPage: true,
  });

  // HEADERS
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${listing.title.replace(/ /g, "_")}.pdf"`
  );

  doc.pipe(res);

  // FIRST PAGE HEADER
  drawHeaderBar(doc);
  drawWatermark(doc);
  drawFooter(doc);

  // ----------------------------------------------------
  // COVER PAGE
  // ----------------------------------------------------
  doc.moveDown(3);

  // Title
  doc.fontSize(40).fillColor("#333").text(listing.title, {
    align: "center",
    underline: true,
  });

  doc.moveDown(2);

  // Download listing image
  if (listing.image?.url) {
    const img = await fetchImageBuffer(listing.image.url);
    if (img) {
      doc.image(img, {
        fit: [450, 320],
        align: "center",
        valign: "center",
      });
    }
  }

  doc.moveDown(2);

  // QR Code for online link
  const qrBuffer = await QRCode.toBuffer(
    `https://brainspirebaroda.com/listings/${listing._id}`
  );
  doc.image(qrBuffer, 250, doc.y, { fit: [100, 100] });

  doc.moveDown(5);

  doc
    .fontSize(16)
    .fillColor("#666")
    .text("Scan the QR code to view this listing online.", { align: "center" });

  // ----------------------------------------------------
  // PAGE 2 - LISTING DETAILS
  // ----------------------------------------------------
  // newPage(doc);

  doc
    .fontSize(28)
    .fillColor("#333")
    .text("Listing Details", { underline: true });

  doc.moveDown(2);

  const details = [
    { label: "Location", value: listing.location },
    { label: "Country", value: listing.country },
    { label: "Price", value: `$${listing.price}` },
  ];

  // Table-style listing info
  details.forEach((item) => {
    doc.font("Helvetica-Bold").fontSize(16).text(`${item.label}: `, {
      continued: true,
    });
    doc.font("Helvetica").text(item.value);
    doc.moveDown(1);
  });

  doc.moveDown(2);

  doc.font("Helvetica-Bold").fontSize(18).text("Description");
  doc.moveDown(0.5);

  doc
    .font("Helvetica")
    .fontSize(14)
    .text(listing.description || "No description.", {
      align: "justify",
    });

  // ----------------------------------------------------
  // PAGE 3+ - REVIEWS
  // ----------------------------------------------------
  // newPage(doc);

  doc.fontSize(28).fillColor("#333").text("User Reviews", { underline: true });

  doc.moveDown(2);

  if (!reviews || reviews.length === 0) {
    doc.fontSize(16).text("No reviews yet.");
  } else {
    reviews.forEach((review, idx) => {
      // Review card
      doc.rect(40, doc.y, 520, 100).strokeColor("#ddd").stroke();

      doc.moveDown(0.5);

      doc
        .font("Helvetica-Bold")
        .fontSize(16)
        .text(`Review #${idx + 1}`, 55, doc.y + 10);

      doc.moveDown(1);
      doc.font("Helvetica").fontSize(14).text(`Rating: ${review.rating}/5`, 55);

      doc.moveDown(0.5);
      doc
        .font("Helvetica")
        .fontSize(12)
        .text(review.comment, 55, undefined, { width: 480 });

      doc.moveDown(3);

      if (doc.y > 650) newPage(doc);
    });
  }

  doc.end();
}

module.exports = generateListingPDF;
