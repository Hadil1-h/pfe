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
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { Save, Bell } from 'lucide-react';

const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    smsNotifications: false,
    notifyOnNewTicket: true,
    notifyOnTicketUpdate: true,
    notifyOnTicketClose: true,
    notifyOnMention: true,
    digestFrequency: 'daily',
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00'
  });

  const handleChange = (event) => {
    const { name, value, checked } = event.target;
    setSettings(prev => ({
      ...prev,
      [name]: event.target.type === 'checkbox' ? checked : value
    }));
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Bell size={24} />
            <Typography variant="h6">
              Canaux de Notification
            </Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailNotifications}
                    onChange={handleChange}
                    name="emailNotifications"
                  />
                }
                label="Notifications par email"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.pushNotifications}
                    onChange={handleChange}
                    name="pushNotifications"
                  />
                }
                label="Notifications push"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.smsNotifications}
                    onChange={handleChange}
                    name="smsNotifications"
                  />
                }
                label="Notifications SMS"
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Événements
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifyOnNewTicket}
                    onChange={handleChange}
                    name="notifyOnNewTicket"
                  />
                }
                label="Nouveau ticket"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifyOnTicketUpdate}
                    onChange={handleChange}
                    name="notifyOnTicketUpdate"
                  />
                }
                label="Mise à jour de ticket"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifyOnTicketClose}
                    onChange={handleChange}
                    name="notifyOnTicketClose"
                  />
                }
                label="Fermeture de ticket"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifyOnMention}
                    onChange={handleChange}
                    name="notifyOnMention"
                  />
                }
                label="Mention (@utilisateur)"
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ p:  3 }}>
          <Typography variant="h6" gutterBottom>
            Paramètres avancés
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Fréquence du résumé</InputLabel>
                <Select
                  value={settings.digestFrequency}
                  label="Fréquence du résumé"
                  onChange={handleChange}
                  name="digestFrequency"
                >
                  <MenuItem value="never">Jamais</MenuItem>
                  <MenuItem value="daily">Quotidien</MenuItem>
                  <MenuItem value="weekly">Hebdomadaire</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Début heures calmes"
                type="time"
                value={settings.quietHoursStart}
                onChange={handleChange}
                name="quietHoursStart"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Fin heures calmes"
                type="time"
                value={settings.quietHoursEnd}
                onChange={handleChange}
                name="quietHoursEnd"
                InputLabelProps={{ shrink: true }}
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

export default NotificationSettings;