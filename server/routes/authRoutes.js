const express = require('express');
const router = express.Router();
const User = require('../models/userModel');  // Modelo de usuario
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Verifica si el usuario existe
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Verifica la contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Genera y envía el token JWT
        const token = jwt.sign({ email: user.email, id: user._id }, 'your_jwt_secret', { expiresIn: '1h' });

        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
    }
});


// Ruta de registro
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Encriptar la contraseña
        const hashedPassword = await bcrypt.hash(password, 12);

        // Crear nuevo usuario
        const newUser = new User({
            email,
            password: hashedPassword,
        });

        await newUser.save();

        // Crear y enviar token JWT
        const token = jwt.sign({ email: newUser.email, id: newUser._id }, 'your_jwt_secret', { expiresIn: '1h' });

        res.status(201).json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
    }
});

module.exports = router;
