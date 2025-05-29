import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Divider,
  Alert,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { Save, Shield, Key, Lock } from 'lucide-react';

const SecuritySettings = () => {
  const [settings, setSettings] = useState({
    twoFactorAuth: false,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      expiryDays: 90
    },
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    ipWhitelist: '',
    authMethod: 'local'
  });

  const handleChange = (event) => {
    const { name, value, checked } = event.target;
    setSettings(prev => ({
      ...prev,
      [name]: event.target.type === 'checkbox' ? checked : value
    }));
  };

  const handlePasswordPolicyChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      passwordPolicy: {
        ...prev.passwordPolicy,
        [key]: value
      }
    }));
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Shield size={24} />
            <Typography variant="h6">
              Authentification
            </Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Méthode d'authentification</InputLabel>
            <Select
              value={settings.authMethod}
              label="Méthode d'authentification"
              onChange={(e) => handleChange({ target: { name: 'authMethod', value: e.target.value } })}
            >
              <MenuItem value="local">Local</MenuItem>
              <MenuItem value="ldap">LDAP</MenuItem>
              <MenuItem value="oauth">OAuth 2.0</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={settings.twoFactorAuth}
                onChange={handleChange}
                name="twoFactorAuth"
              />
            }
            label="Authentification à deux facteurs (2FA)"
          />

          {settings.twoFactorAuth && (
            <Alert severity="info" sx={{ mt: 2 }}>
              La 2FA sera requise pour tous les utilisateurs lors de leur prochaine connexion.
            </Alert>
          )}
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Key size={24} />
            <Typography variant="h6">
              Politique de Mot de Passe
            </Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom>
              Longueur minimale: {settings.passwordPolicy.minLength} caractères
            </Typography>
            <Slider
              value={settings.passwordPolicy.minLength}
              onChange={(e, value) => handlePasswordPolicyChange('minLength', value)}
              min={6}
              max={16}
              marks
              valueLabelDisplay="auto"
            />
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.passwordPolicy.requireUppercase}
                    onChange={(e) => handlePasswordPolicyChange('requireUppercase', e.target.checked)}
                  />
                }
                label="Exiger des majuscules"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.passwordPolicy.requireNumbers}
                    onChange={(e) => handlePasswordPolicyChange('requireNumbers', e.target.checked)}
                  />
                }
                label="Exiger des chiffres"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.passwordPolicy.requireSpecialChars}
                    onChange={(e) => handlePasswordPolicyChange('requireSpecialChars', e.target.checked)}
                  />
                }
                label="Exiger des caractères spéciaux"
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Lock size={24} />
            <Typography variant="h6">
              Sécurité des Sessions
            </Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Délai d'expiration de session (minutes)"
                value={settings.sessionTimeout}
                onChange={(e) => handleChange({ target: { name: 'sessionTimeout', value: e.target.value } })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Tentatives de connexion max."
                value={settings.maxLoginAttempts}
                onChange={(e) => handleChange({ target: { name: 'maxLoginAttempts', value: e.target.value } })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Liste blanche IP (séparées par des virgules)"
                value={settings.ipWhitelist}
                onChange={(e) => handleChange({ target: { name: 'ipWhitelist', value: e.target.value } })}
                placeholder="ex: 192.168.1.1, 10.0.0.0/24"
              />
            </Grid>
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

export default SecuritySettings;