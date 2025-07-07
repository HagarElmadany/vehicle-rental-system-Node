const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

exports.generateRentalAgreementPDF = async (
  bookingData,
  signatureData = null
) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const filename = `rental-agreement-${bookingData._id}.pdf`;
      const filepath = path.join(
        __dirname,
        "..",
        "uploads",
        "agreements",
        filename
      );

      // Ensure directory exists
      const dir = path.dirname(filepath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Header
      doc.fontSize(20).text("CAR RENTAL AGREEMENT", { align: "center" });
      doc.moveDown();

      // Agreement Number and Date
      doc
        .fontSize(12)
        .text(`Agreement Number: ${bookingData._id}`, { align: "right" })
        .text(`Date: ${new Date().toLocaleDateString()}`, { align: "right" });
      doc.moveDown();

      // Customer Information Section
      doc.fontSize(16).text("CUSTOMER INFORMATION", { underline: true });
      doc
        .fontSize(12)
        .text(`Name: ${bookingData.billingName}`)
        .text(`Email: ${bookingData.clientEmail}`)
        .text(`Phone: ${bookingData.billingPhone}`)
        .text(`Pickup Location: ${bookingData.pickupLocation}`)
        .text(`Drop-off Location: ${bookingData.dropoffLocation}`);
      doc.moveDown();

      // Vehicle Information Section
      doc.fontSize(16).text("VEHICLE DETAILS", { underline: true });
      doc
        .fontSize(12)
        .text(`Brand: ${bookingData.carId.brand}`)
        .text(`Model: ${bookingData.carId.model}`)
        .text(`Year: ${bookingData.carId.year}`)
        .text(`License Plate: ${bookingData.carId.licensePlate}`)
        .text(`Transmission: ${bookingData.carId.transmission}`)
        .text(`Fuel Type: ${bookingData.carId.fuel_type}`)
        .text(`Seats: ${bookingData.carId.seats}`)
        .text(`Color: ${bookingData.carId.color}`);
      doc.moveDown();

      // Rental Period Section
      doc.fontSize(16).text("RENTAL PERIOD", { underline: true });
      doc
        .fontSize(12)
        .text(
          `Start Date: ${new Date(bookingData.startDate).toLocaleDateString()}`
        )
        .text(`End Date: ${new Date(bookingData.endDate).toLocaleDateString()}`)
        .text(`With Driver: ${bookingData.with_driver ? "Yes" : "No"}`);
      doc.moveDown();

      // Pricing Section
      doc.fontSize(16).text("PRICING BREAKDOWN", { underline: true });
      doc
        .fontSize(12)
        .text(`Daily Rate: ${bookingData.carId.rentalRatePerDay} EGP`)
        .text(`Hourly Rate: ${bookingData.carId.rentalRatePerHour} EGP`)
        .text(`Deposit Required: ${bookingData.carId.depositRequired} EGP`)
        .text(`Total Cost: ${bookingData.totalCost} EGP`)
        .text(`Insurance: ${bookingData.carId.insuranceStatus}`);
      doc.moveDown();

      // Terms and Conditions
      doc.fontSize(16).text("TERMS AND CONDITIONS", { underline: true });
      doc
        .fontSize(10)
        .text(
          "1. FUEL POLICY: Vehicle must be returned with the same fuel level as at pickup."
        )
        .text(
          "2. MILEAGE: Unlimited mileage included unless otherwise specified."
        )
        .text(
          "3. LATE RETURN: Additional charges apply for late returns (50 EGP per hour)."
        )
        .text(
          "4. DAMAGE: Customer is responsible for any damage to the vehicle during rental period."
        )
        .text(
          "5. INSURANCE: Customer acknowledges insurance coverage as specified above."
        )
        .text("6. CANCELLATION: Cancellation fees apply as per company policy.")
        .text(
          "7. LIABILITY: Customer assumes full responsibility for traffic violations and fines."
        )
        .text(
          "8. RETURN CONDITION: Vehicle must be returned in same condition as received."
        );
      doc.moveDown();

      // Privacy Policy Section
      doc.fontSize(14).text("PRIVACY POLICY & CONSENT", { underline: true });
      doc
        .fontSize(10)
        .text(
          "By signing this agreement, you consent to the collection and processing of your personal data for rental purposes in accordance with our privacy policy. Your data will be used solely for this rental transaction and may be shared with necessary third parties (insurance, law enforcement) as required."
        );
      doc.moveDown();

      // Liability Waiver
      doc.fontSize(14).text("LIABILITY WAIVER", { underline: true });
      doc
        .fontSize(10)
        .text(
          "Customer acknowledges that rental of this vehicle is at their own risk. Customer releases the rental company from liability for any damages, injuries, or losses that may occur during the rental period, except in cases of gross negligence by the rental company."
        );
      doc.moveDown();

      // Digital Signature Section
      doc.fontSize(14).text("DIGITAL SIGNATURE", { underline: true });

      if (signatureData) {
        doc.text("Customer Signature:", { continued: false });
        // Handle base64 data URL or plain base64
        let base64 = signatureData;
        // Remove data URL prefix if present
        if (base64.startsWith("data:image")) {
          base64 = base64.split(",")[1];
        }
        try {
          doc.image(Buffer.from(base64, "base64"), {
            fit: [200, 100],
            align: "left",
            valign: "top",
          });
        } catch (err) {
          doc.text("[Signature image could not be rendered]");
        }
        doc.text(`Signed on: ${new Date().toLocaleString()}`);
      } else {
        doc.text("Signature Required: ________________________");
        doc.text(`Date: ________________________`);
      }

      doc.moveDown();

      // Agreement Acceptance
      doc
        .fontSize(10)
        .text(
          "By signing above, I acknowledge that I have read, understood, and agree to all terms and conditions of this rental agreement. I confirm that all information provided is accurate and complete."
        );

      // Footer
      doc
        .fontSize(8)
        .text(
          "This is a legally binding agreement. Keep a copy for your records.",
          50,
          doc.page.height - 50,
          { align: "center" }
        );

      doc.end();

      stream.on("finish", () => {
        resolve({
          filename,
          filepath,
          url: `${
            process.env.BASE_URL || "http://localhost:5000"
          }/uploads/agreements/${filename}`,
        });
      });

      stream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
};
