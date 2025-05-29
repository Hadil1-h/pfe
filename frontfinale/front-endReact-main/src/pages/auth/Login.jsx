import React, { useState, useContext } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Divider,
  IconButton,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // Réinitialiser l'erreur lorsqu'on modifie un champ
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError("Veuillez remplir tous les champs !");
      return;
    }

    const isAuthenticated = login(formData.email, formData.password);
    if (!isAuthenticated) {
      setError("Email ou mot de passe incorrect !");
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      p={3}
    >
      <Typography variant="h4" fontWeight="bold" mb={2}>
        Login
      </Typography>
      <Box component="form" onSubmit={handleSubmit} width="350px">
        <TextField
          label="Votre adresse e-mail"
          name="email"
          type="email"
          fullWidth
          margin="normal"
          required
          onChange={handleChange}
          value={formData.email}
        />
        <TextField
          label="Mot de passe"
          name="password"
          type="password"
          fullWidth
          margin="normal"
          required
          onChange={handleChange}
          value={formData.password}
        />

        {error && (
          <Typography color="error" textAlign="center" mt={1}>
            {error}
          </Typography>
        )}

        <Button
          type="submit"
          variant="contained"
          fullWidth
          sx={{ mt: 2, p: 1.5, backgroundColor: "#1E3A5F", color: "#fff" }}
        >
          Connexion
        </Button>

        <Typography
          variant="body2"
          textAlign="center"
          mt={2}
          color="primary"
          sx={{ cursor: "pointer" }}
          onClick={() => navigate("/forgot-password")}
        >
          Mot de passe oublié ?
        </Typography>
      </Box>
    </Box>
  );
};

export default Login;