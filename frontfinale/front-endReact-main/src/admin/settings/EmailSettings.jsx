import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import { Save, Send, Mail } from 'lucide-react';

const EmailSettings = () => {
  const [settings, setSettings] = useState({
    smtpHost: 'smtp.example.com',
    smtpPort: '587',
    smtpUsername: '',
    smtpPassword: '',
    fromEmail: 'noreply@example.com',
    fromName: 'Help Desk',
    encryption: 'tls',
    testEmail: ''
  });

  const [testStatus, setTestStatus] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTestEmail = () => {
    setTestStatus('sending');
    // Simulate sending test email
    setTimeout(() => {
      setTestStatus('success');
    }, 2000);
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Mail size={24} />
            <Typography variant="h6">
              Configuration SMTP
            </Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Serveur SMTP"
                name="smtpHost"
                value={settings.smtpHost}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Port SMTP"
                name="smtpPort"
                value={settings.smtpPort}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Chiffrement</InputLabel>
                <Select
                  value={settings.encryption}
                  label="Chiffrement"
                  name="encryption"
                  onChange={handleChange}
                >
                  <MenuItem value="none">Aucun</MenuItem>
                  <MenuItem value="ssl">SSL</MenuItem>
                  <MenuItem value="tls">TLS</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom d'utilisateur SMTP"
                name="smtpUsername"
                value={settings.smtpUsername}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mot de passe SMTP"
                name="smtpPassword"
                type="password"
                value={settings.smtpPassword}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Paramètres d'envoi
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email expéditeur"
                name="fromEmail"
                value={settings.fromEmail}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom expéditeur"
                name="fromName"
                value={settings.fromName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Test de configuration
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Email de test"
                  name="testEmail"
                  value={settings.testEmail}
                  onChange={handleChange}
                  size="small"
                />
                <Button
                  variant="contained"
                  startIcon={<Send size={20} />}
                  onClick={handleTestEmail}
                >
                  Tester
                </Button>
              </Box>
            </Grid>
            {testStatus === 'sending' && (
              <Grid item xs={12}>
                <Alert severity="info">
                  Envoi de l'email de test en cours...
                </Alert>
              </Grid>
            )}
            {testStatus === 'success' && (
              <Grid item xs={12}>
                <Alert severity="success">
                  Email de test envoyé avec succès !
                </Alert>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<Save size={20} />}
            color="primary"
          >
            Enregistrer les paramètres
          </Button>
        </Box>
      </Grid>
    </Grid>
  );
};

export default EmailSettings;