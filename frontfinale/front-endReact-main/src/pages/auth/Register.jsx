import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
    navigate("/login"); // Redirection après inscription
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
        S'inscrire au portail de support
      </Typography>
      <Typography variant="body2" mb={2}>
        Déjà un utilisateur ?{" "}
        <Typography
          component="span"
          color="primary"
          fontWeight="bold"
          sx={{ cursor: "pointer" }}
          onClick={() => navigate("/login")}
        >
          Connexion
        </Typography>
      </Typography>

      <Box component="form" onSubmit={handleSubmit} width="350px">
        <TextField
          label="Nom complet"
          name="name"
          fullWidth
          margin="normal"
          required
          onChange={handleChange}
        />
        <TextField
          label="E-mail"
          name="email"
          type="email"
          fullWidth
          margin="normal"
          required
          onChange={handleChange}
        />

        <FormControlLabel
          control={<Checkbox required />}
          label="Je ne suis pas un robot"
        />

        <Button
          type="submit"
          variant="contained"
          sx={{ mt: 2, p: 1.5, backgroundColor: "#1E3A5F", color: "#fff" }}
          fullWidth
        >
          S'inscrire
        </Button>

        <Typography
          variant="body2"
          textAlign="center"
          mt={3}
          color="primary"
          sx={{ cursor: "pointer" }}
          onClick={() => navigate("/login")}
        >
          Êtes-vous un agent ? Connectez-vous ici
        </Typography>
      </Box>
    </Box>
  );
};

export default Register;
