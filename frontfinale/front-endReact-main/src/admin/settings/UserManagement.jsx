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
  IconButton,
  Button,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  useTheme
} from '@mui/material';
import {
  Edit2,
  Trash2,
  Search,
  UserPlus,
  Shield,
  User
} from 'lucide-react';

const mockUsers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    status: 'Actif',
    lastLogin: '2024-03-10 14:30'
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Agent',
    status: 'Actif',
    lastLogin: '2024-03-10 12:15'
  },
  {
    id: 3,
    name: 'Bob Wilson',
    email: 'bob@example.com',
    role: 'Contact',
    status: 'Inactif',
    lastLogin: '2024-03-09 16:45'
  }
];

const UserManagement = () => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');

  const getRoleIcon = (role) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return <Shield size={16} />;
      default:
        return <User size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'actif':
        return theme.palette.success;
      case 'inactif':
        return theme.palette.error;
      default:
        return theme.palette.warning;
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextField
          placeholder="Rechercher un utilisateur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={20} />
              </InputAdornment>
            )
          }}
        />
        
        <Button
          variant="contained"
          startIcon={<UserPlus size={20} />}
          sx={{ textTransform: 'none' }}
        >
          Nouvel Utilisateur
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Utilisateur</TableCell>
              <TableCell>Rôle</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Dernière Connexion</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockUsers.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.primary.main,
                        width: 40,
                        height: 40
                      }}
                    >
                      {user.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">
                        {user.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Chip
                    icon={getRoleIcon(user.role)}
                    label={user.role}
                    size="small"
                    sx={{
                      bgcolor: `${theme.palette.primary.main}15`,
                      color: theme.palette.primary.main,
                      '& .MuiChip-icon': {
                        color: 'inherit'
                      }
                    }}
                  />
                </TableCell>
                
                <TableCell>
                  <Chip
                    label={user.status}
                    size="small"
                    sx={{
                      bgcolor: `${getStatusColor(user.status).main}15`,
                      color: getStatusColor(user.status).main
                    }}
                  />
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {user.lastLogin}
                  </Typography>
                </TableCell>
                
                <TableCell align="right">
                  <IconButton size="small" sx={{ mr: 1 }}>
                    <Edit2 size={16} />
                  </IconButton>
                  <IconButton size="small" color="error">
                    <Trash2 size={16} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default UserManagement;