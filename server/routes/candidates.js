import React, { useEffect, useState } from "react";
import axios from "axios";

function Candidates() {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";
  const [candidates, setCandidates] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", position: "" });
  const [editingId, setEditingId] = useState(null);

  const token = localStorage.getItem("token");

  const fetchCandidates = async () => {
    const res = await axios.get(`${API_BASE_URL}/candidates`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setCandidates(res.data);
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingId) {
      await axios.put(`${API_BASE_URL}/candidates/${editingId}`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingId(null);
    } else {
      await axios.post(`${API_BASE_URL}/candidates`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }

    setForm({ name: "", email: "", phone: "", position: "" });
    fetchCandidates();
  };

  const handleEdit = (candidate) => {
    setForm(candidate);
    setEditingId(candidate._id);
  };

  const handleDelete = async (id) => {
    await axios.delete(`${API_BASE_URL}/candidates/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchCandidates();
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ color: "skyblue" }}>Candidatos</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <input name="name" placeholder="Nombre" value={form.name} onChange={handleChange} required />
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input name="phone" placeholder="Teléfono" value={form.phone} onChange={handleChange} />
        <input name="position" placeholder="Posición" value={form.position} onChange={handleChange} />
        <button type="submit">{editingId ? "Actualizar" : "Agregar"}</button>
      </form>

      <ul>
        {candidates.map((c) => (
          <li key={c._id}>
            {c.name} - {c.email} - {c.position}
            <button onClick={() => handleEdit(c)}>Editar</button>
            <button onClick={() => handleDelete(c._id)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Candidates;
