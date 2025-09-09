const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  location: { type: String, required: true },
  comments: { type: String },
  employeeCode: { type: String },
  cv: { type: String } // puedes guardar la ruta del archivo si manejas uploads
});

module.exports = mongoose.models.Candidate || mongoose.model("candidate", candidateSchema);
