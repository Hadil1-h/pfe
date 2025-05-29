import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  useTheme,
  Divider
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Settings,
  Users,
  Shield,
  Database,
  Bell,
  Mail,
  Server,
  Workflow,
  List // Added List icon to replace TaskIcon
} from 'lucide-react';

import Header from '../components/Header';
import GeneralSettings from './settings/GeneralSettings';
import UserManagement from './settings/UserManagement';
import SecuritySettings from './settings/SecuritySettings';
import DatabaseSettings from './settings/DatabaseSettings';
import NotificationSettings from './settings/NotificationSettings';
import EmailSettings from './settings/EmailSettings';
import SystemLogs from './settings/SystemLogs';
import WorkflowSettings from './settings/WorkflowSettings';
import AddTypeAndStatusPage from '../pages/AddTypeAndStatusPage';

const DashboardAdmin = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const tabs = [
    { icon: <Settings size={20} />, label: 'Général', component: <GeneralSettings /> },
    { icon: <Users size={20} />, label: 'Utilisateurs', component: <UserManagement /> },
    { icon: <Shield size={20} />, label: 'Sécurité', component: <SecuritySettings /> },
    { icon: <Database size={20} />, label: 'Base de données', component: <DatabaseSettings /> },
    { icon: <Bell size={20} />, label: 'Notifications', component: <NotificationSettings /> },
    { icon: <Mail size={20} />, label: 'Email', component: <EmailSettings /> },
    { icon: <Server size={20} />, label: 'Logs Système', component: <SystemLogs /> },
    { icon: <Workflow size={20} />, label: 'Workflow', component: <WorkflowSettings /> },
    { icon: <List size={20} />, label: 'Type et Statut', component: <AddTypeAndStatusPage /> } // Ensured AddTypeAndStatusPage is in the menu with List icon
  ];

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      sx={{
        bgcolor: theme.palette.background.default,
        minHeight: '100vh',
        py: 4
      }}
    >
      <Container maxWidth="xl">
        <Header
          title="Configuration du Système"
          subtitle="Gérez tous les paramètres de l'application"
        />

        <Paper 
          sx={{ 
            mt: 3,
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)'
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: 2,
              pt: 1,
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: theme.palette.background.paper,
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500
              }
            }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                icon={tab.icon}
                label={tab.label}
                iconPosition="start"
                sx={{
                  gap: 1,
                  minHeight: 48,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    bgcolor: `${theme.palette.primary.main}10`
                  }
                }}
              />
            ))}
          </Tabs>

          <Divider />

          <Box sx={{ p: 3 }}>
            {tabs[activeTab].component}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default DashboardAdmin;