import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Database,
  Save,
  RefreshCw,
  Download,
  Upload,
  HelpCircle
} from 'lucide-react';

const DatabaseSettings = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    host: 'localhost',
    port: '5432',
    database: 'helpdesk_db',
    username: 'admin',
    maxConnections: '100',
    backupSchedule: '0 0 * * *',
    retentionDays: '30'
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBackup = () => {
    setLoading(true);
    // Simulate backup process
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Database size={24} />
            <Typography variant="h6">
              Configuration de la Base de Données
            </Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />

          <Alert severity="warning" sx={{ mb: 3 }}>
            La modification de ces paramètres nécessite un redémarrage du serveur.
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hôte"
                name="host"
                value={settings.host}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Port"
                name="port"
                value={settings.port}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nom de la base"
                name="database"
                value={settings.database}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Utilisateur"
                name="username"
                value={settings.username}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Connexions max."
                name="maxConnections"
                value={settings.maxConnections}
                onChange={handleChange}
                type="number"
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <RefreshCw size={24} />
            <Typography variant="h6">
              Sauvegarde et Restauration
            </Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  fullWidth
                  label="Planning de sauvegarde (Cron)"
                  name="backupSchedule"
                  value={settings.backupSchedule}
                  onChange={handleChange}
                />
                <Tooltip title="Format: minute heure jour mois jour_semaine">
                  <IconButton>
                    <HelpCircle size={20} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Rétention des sauvegardes (jours)"
                name="retentionDays"
                value={settings.retentionDays}
                onChange={handleChange}
                type="number"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Download size={20} />}
                  onClick={handleBackup}
                  fullWidth
                >
                  Sauvegarder maintenant
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Upload size={20} />}
                  fullWidth
                >
                  Restaurer
                </Button>
              </Box>
            </Grid>
          </Grid>

          {loading && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Sauvegarde en cours...
              </Typography>
              <LinearProgress />
            </Box>
          )}
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

export default DatabaseSettings;