import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Divider
} from '@mui/material';
import { Save } from 'lucide-react';

const GeneralSettings = () => {
  const [settings, setSettings] = useState({
    siteName: 'Help Desk Pro',
    siteDescription: 'Système de gestion des tickets',
    maintenanceMode: false,
    debugMode: false,
    defaultLanguage: 'fr',
    timezone: 'Europe/Paris'
  });

  const handleChange = (event) => {
    const { name, value, checked } = event.target;
    setSettings(prev => ({
      ...prev,
      [name]: event.target.type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // TODO: Implement settings update
    console.log('Settings updated:', settings);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Paramètres du Site
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nom du Site"
                  name="siteName"
                  value={settings.siteName}
                  onChange={handleChange}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="siteDescription"
                  value={settings.siteDescription}
                  onChange={handleChange}
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Langue par Défaut"
                  name="defaultLanguage"
                  value={settings.defaultLanguage}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Fuseau Horaire"
                  name="timezone"
                  value={settings.timezone}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Configuration Système
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.maintenanceMode}
                      onChange={handleChange}
                      name="maintenanceMode"
                    />
                  }
                  label="Mode Maintenance"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.debugMode}
                      onChange={handleChange}
                      name="debugMode"
                    />
                  }
                  label="Mode Debug"
                />
              </Grid>

              {settings.maintenanceMode && (
                <Grid item xs={12}>
                  <Alert severity="warning">
                    Le mode maintenance rendra le site inaccessible aux utilisateurs non-administrateurs.
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
              type="submit"
            >
              Enregistrer les modifications
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GeneralSettings;