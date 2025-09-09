const express = require("express");
const router = express.Router();
const Candidate = require("../models/candidate");

// Obtener todos los candidatos
router.get("/", async (req, res) => {
  try {
    const candidates = await Candidate.find();
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//  Crear candidato
router.post("/", async (req, res) => {
  try {
    const newCandidate = new Candidate(req.body);
    await newCandidate.save();
    res.json(newCandidate);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Actualizar candidato
router.put("/:id", async (req, res) => {
  try {
    const updatedCandidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedCandidate) return res.status(404).json({ error: "Candidate not found" });
    res.json(updatedCandidate);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Eliminar candidato
router.delete("/:id", async (req, res) => {
  try {
    const deletedCandidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!deletedCandidate) return res.status(404).json({ error: "Candidate not found" });
    res.json({ message: "Candidate deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
