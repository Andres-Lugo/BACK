// models/Candidate.js
const mongoose = require("mongoose");

const CandidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  position: String,
  cvUrl: String, // opcional: link a CV subido
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("candidate", CandidateSchema);
