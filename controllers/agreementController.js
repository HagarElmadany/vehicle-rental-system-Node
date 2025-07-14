const Booking = require("../models/Booking");
const Agreement = require("../models/Agreement");
const { generateRentalAgreementPDF } = require("../utils/pdfGenerator");
const path = require("path");
const fs = require("fs");

// POST /api/agreements/generate/:bookingId
// Response: { message, agreement: { id, documentUrl, status } }
exports.generateAgreement = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { signature, language = "en" } = req.body; // Default to English if not specified

    console.log("🔄 Generating agreement for booking:", bookingId);
    console.log("🌐 Language:", language);

    const booking = await Booking.findById(bookingId)
      .populate("carId")
      .populate("agent");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Generate PDF with language support
    const pdfResult = await generateRentalAgreementPDF(
      booking,
      signature,
      language
    );

    // Save agreement record
    const agreement = new Agreement({
      bookingId: booking._id,
      clientId: booking.clientId._id,
      agentId: booking.carId.agent,
      documentUrl: pdfResult.url,
      signatureData: signature,
      status: signature ? "signed" : "pending",
      generatedAt: new Date(),
      language: language, // Store the language used
    });

    await agreement.save();

    res.status(201).json({
      message: "Agreement generated successfully",
      agreement: {
        id: agreement._id,
        documentUrl: pdfResult.url,
        status: agreement.status,
        language: language,
      },
    });
  } catch (error) {
    console.error("Agreement generation error:", error);
    res
      .status(500)
      .json({ message: "Error generating agreement", error: error.message });
  }
};

// PUT /api/agreements/sign/:agreementId
// Response: { message, agreement: { id, documentUrl, status, signedAt } }
exports.signAgreement = async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { signature, language = "en" } = req.body;

    if (!signature) {
      return res.status(400).json({ message: "Signature is required" });
    }

    const agreement = await Agreement.findById(agreementId).populate({
      path: "bookingId",
      populate: { path: "carId agent clientId" },
    });

    if (!agreement) {
      return res.status(404).json({ message: "Agreement not found" });
    }

    // Use existing language or new language if provided
    const agreementLanguage = language || agreement.language || "en";

    // Regenerate PDF with signature and language
    const pdfResult = await generateRentalAgreementPDF(
      agreement.bookingId,
      signature,
      agreementLanguage
    );

    // Update agreement
    agreement.signatureData = signature;
    agreement.status = "signed";
    agreement.signedAt = new Date();
    agreement.documentUrl = pdfResult.url;
    agreement.language = agreementLanguage;

    await agreement.save();

    res.status(200).json({
      message: "Agreement signed successfully",
      agreement: {
        id: agreement._id,
        documentUrl: pdfResult.url,
        status: agreement.status,
        signedAt: agreement.signedAt,
        language: agreementLanguage,
      },
    });
  } catch (error) {
    console.error("Agreement signing error:", error);
    res
      .status(500)
      .json({ message: "Error signing agreement", error: error.message });
  }
};

// GET /api/agreements/:agreementId
// Response: Agreement object (all fields, populated bookingId, clientId, agentId)
exports.getAgreement = async (req, res) => {
  try {
    const { agreementId } = req.params;

    const agreement = await Agreement.findById(agreementId)
      .populate("bookingId")
      .populate("clientId")
      .populate("agentId");

    if (!agreement) {
      return res.status(404).json({ message: "Agreement not found" });
    }

    res.status(200).json(agreement);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching agreement", error: error.message });
  }
};

// GET /api/agreements/download/:agreementId
// Response: PDF file download (Content-Type: application/pdf)
exports.downloadAgreement = async (req, res) => {
  try {
    const { agreementId } = req.params;

    const agreement = await Agreement.findById(agreementId);

    if (!agreement) {
      return res.status(404).json({ message: "Agreement not found" });
    }

    const filename = `rental-agreement-${agreement.bookingId}.pdf`;
    const filepath = path.join(
      __dirname,
      "..",
      "uploads",
      "agreements",
      filename
    );

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ message: "Agreement file not found" });
    }

    res.download(filepath, filename);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error downloading agreement", error: error.message });
  }
};
