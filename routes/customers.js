const express = require("express");
const router = express.Router();

// Customers route
router.get("/", (req, res) => {
  res.render("customers/index");
});

// New customers route
router.get("/new", (req, res) => {
  res.render("customers/new");
});

// Create new customer route
router.post("/", (req, res) => {
  res.send("Create");
});

module.exports = router;
