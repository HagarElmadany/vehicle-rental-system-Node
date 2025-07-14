require("dotenv").config();
require("./jobs/bookingCleanup");
const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const carRoutes = require("./routes/carRoutes");
const agentCarsRoutes = require("./routes/agentCarsRoutes");
const adminCarsRoutes = require("./routes/adminCarsRoutes");
const path = require("path");
const cors = require("cors");
const adminRoutes = require("./routes/adminRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const searchCarsRoutes = require("./routes/searchCarsRoutes");
const clientRelatedCarsRoutes = require("./routes/clientRelatedCarsRoutes");
const agreementRoutes = require("./routes/agreementRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

const session = require("express-session");
const passport = require("passport");

require("./config/passport");
app.use(
  session({
    secret: "any-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

const { swaggerUi, swaggerSpec } = require("./swagger");

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Initialize Passport and session
app.use(passport.initialize());
app.use(passport.session());

// Middleware
app.use(cors());
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));

app.use(
  "/uploads/driver_licenses",
  express.static(path.join(__dirname, "uploads/driver_licenses"))
);
app.use(
  "/uploads/id_documents",
  express.static(path.join(__dirname, "uploads/id_documents"))
);
app.use(
  "/uploads/others",
  express.static(path.join(__dirname, "uploads/others"))
);
app.use("/uploads/cars", express.static(path.join(__dirname, "uploads/cars")));
app.use(
  "/uploads/documents",
  express.static(path.join(__dirname, "uploads/documents"))
);
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // fallback for others

// Connect to MongoDB (only once!)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// Routes
app.get("/", (req, res) => {
  res.send("✅ Server is working");
});
app.use(express.static(path.join(__dirname, "public")));
app.use("/api/auth", authRoutes);
app.use("/api/cars", carRoutes);
app.use("/api/agent/cars", agentCarsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/cars", adminCarsRoutes);

app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/search", searchCarsRoutes);
app.use("/api/client/cars", clientRelatedCarsRoutes);
app.use("/api/agreements", agreementRoutes);

const driverLicenseVerification = require("./routes/driverLicenseVerification");
app.use("/api", driverLicenseVerification);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    statusCode: err.statusCode || 500,
    message: err.message || "Something went wrong!",
    errors: [],
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
