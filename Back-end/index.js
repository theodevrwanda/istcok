require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: "*", // Adjust in production to frontend url
  credentials: true
}));
app.use(express.json());
// Routes
app.use("/api/auth", require("./Routes/auth"));
app.use("/api/stock", require("./Routes/stock"));

// Root Route
app.get("/", (req, res) => {
  res.json({ message: "SMS (Stock Management System) API is running." });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "An unexpected server error occurred." });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
