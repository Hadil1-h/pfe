import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Button,
  useTheme
} from '@mui/material';
import {
  Search,
  Download,
  RefreshCw,
  AlertTriangle,
  Info,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const mockLogs = [
  {
    id: 1,
    timestamp: '2024-03-10 15:30:45',
    level: 'ERROR',
    message: 'Failed to connect to database',
    source: 'Database',
    user: 'system'
  },
  {
    id: 2,
    timestamp: '2024-03-10 15:29:30',
    level: 'INFO',
    message: 'User login successful',
    source: 'Auth',
    user: 'john.doe'
  },
  {
    id: 3,
    timestamp: '2024-03-10 15:28:15',
    level: 'WARNING',
    message: 'High CPU usage detected',
    source: 'System',
    user: 'system'
  },
  {
    id: 4,
    timestamp: '2024-03-10 15:27:00',
    level: 'SUCCESS',
    message: 'Backup completed successfully',
    source: 'Backup',
    user: 'system'
  }
];

const SystemLogs = () => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');

  const getLevelIcon = (level) => {
    switch (level.toLowerCase()) {
      case 'error':
        return <AlertCircle size={16} />;
      case 'warning':
        return <AlertTriangle size={16} />;
      case 'info':
        return <Info size={16} />;
      case 'success':
        return <CheckCircle size={16} />;
      default:
        return <Info size={16} />;
    }
  };

  const getLevelColor = (level) => {
    switch (level.toLowerCase()) {
      case 'error':
        return theme.palette.error;
      case 'warning':
        return theme.palette.warning;
      case 'info':
        return theme.palette.info;
      case 'success':
        return theme.palette.success;
      default:
        return theme.palette.info;
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          placeholder="Rechercher dans les logs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={20} />
              </InputAdornment>
            )
          }}
        />
        
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Niveau</InputLabel>
          <Select
            value={levelFilter}
            label="Niveau"
            onChange={(e) => setLevelFilter(e.target.value)}
            size="small"
          >
            <MenuItem value="all">Tous</MenuItem>
            <MenuItem value="error">Erreur</MenuItem>
            <MenuItem value="warning">Avertissement</MenuItem>
            <MenuItem value="info">Info</MenuItem>
            <MenuItem value="success">Succès</MenuItem>
          </Select>
        </FormControl>

        <IconButton>
          <RefreshCw size={20} />
        </IconButton>

        <Button
          variant="outlined"
          startIcon={<Download size={20} />}
          sx={{ whiteSpace: 'nowrap' }}
        >
          Exporter
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Horodatage</TableCell>
              <TableCell>Niveau</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Utilisateur</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockLogs.map((log) => (
              <TableRow key={log.id} hover>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {log.timestamp}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getLevelIcon(log.level)}
                    label={log.level}
                    size="small"
                    sx={{
                      bgcolor: `${getLevelColor(log.level).main}15`,
                      color: getLevelColor(log.level).main,
                      '& .MuiChip-icon': {
                        color: 'inherit'
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {log.message}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={log.source}
                    size="small"
                    sx={{
                      bgcolor: theme.palette.action.hover
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {log.user}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default SystemLogs;