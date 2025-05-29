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
  InputLabel,
  Chip
} from '@mui/material';
import { Save, Workflow } from 'lucide-react';

const WorkflowSettings = () => {
  const [settings, setSettings] = useState({
    autoAssignment: true,
    escalationEnabled: true,
    slaTracking: true,
    defaultPriority: 'medium',
    escalationThreshold: '4',
    autoCloseAfterDays: '7',
    requiredFields: ['subject', 'description', 'priority'],
    availableFields: ['subject', 'description', 'priority', 'category', 'attachments', 'due_date']
  });

  const handleChange = (event) => {
    const { name, value, checked } = event.target;
    setSettings(prev => ({
      ...prev,
      [name]: event.target.type === 'checkbox' ? checked : value
    }));
  };

  const handleFieldToggle = (field) => {
    setSettings(prev => ({
      ...prev,
      requiredFields: prev.requiredFields.includes(field)
        ? prev.requiredFields.filter(f => f !== field)
        : [...prev.requiredFields, field]
    }));
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Workflow size={24} />
            <Typography variant="h6">
              Automatisation
            </Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoAssignment}
                    onChange={handleChange}
                    name="autoAssignment"
                  />
                }
                label="Attribution automatique des tickets"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.escalationEnabled}
                    onChange={handleChange}
                    name="escalationEnabled"
                  />
                }
                label="Escalade automatique"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.slaTracking}
                    onChange={handleChange}
                    name="slaTracking"
                  />
                }
                label="Suivi des SLA"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Priorité par défaut</InputLabel>
                <Select
                  value={settings.defaultPriority}
                  label="Priorité par défaut"
                  name="defaultPriority"
                  onChange={handleChange}
                >
                  <MenuItem value="low">Basse</MenuItem>
                  <MenuItem value="medium">Moyenne</MenuItem>
                  <MenuItem value="high">Haute</MenuItem>
                  <MenuItem value="urgent">Urgente</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Règles de workflow
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Seuil d'escalade (heures)"
                name="escalationThreshold"
                type="number"
                value={settings.escalationThreshold}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Fermeture automatique après (jours)"
                name="autoCloseAfterDays"
                type="number"
                value={settings.autoCloseAfterDays}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Champs obligatoires
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {settings.availableFields.map((field) => (
              <Chip
                key={field}
                label={field}
                onClick={() => handleFieldToggle(field)}
                color={settings.requiredFields.includes(field) ? 'primary' : 'default'}
                variant={settings.requiredFields.includes(field) ? 'filled' : 'outlined'}
                sx={{ textTransform: 'capitalize' }}
              />
            ))}
          </Box>
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

export default WorkflowSettings;