import React, { useState } from "react";
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

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Demande de réinitialisation envoyée à :", email);
    alert("Un email de réinitialisation a été envoyé !");
    navigate("/login");
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
        Mot de passe oublié
      </Typography>
      <Typography variant="body2" textAlign="center" mb={3}>
        Saisissez votre adresse e-mail et nous vous enverrons les instructions
        de réinitialisation du mot de passe par e-mail.
      </Typography>

      <Box component="form" onSubmit={handleSubmit} width="350px">
        <TextField
          label="Votre adresse e-mail"
          type="email"
          fullWidth
          margin="normal"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Box display="flex" justifyContent="space-between" mt={2}>
          <Button type="submit" variant="contained" sx={{ mt: 2, p: 1.5, backgroundColor: "#1E3A5F", color: "#fff" }}
          >
            Réinitialiser mon mot de passe
          </Button>
          <Button   sx={{ mt: 2, p: 1.5,}} variant="outlined" onClick={() => navigate("/login")}>
            Annuler
          </Button>
        </Box>

       
      </Box>
    </Box>
  );
};

export default ForgotPassword;
