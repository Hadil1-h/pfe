import React, { useState, useMemo, useCallback } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Collapse,
} from "@mui/material";
import {
  HomeOutlined as HomeOutlinedIcon,
  ContactsOutlined as ContactsOutlinedIcon,
  ReceiptOutlined as ReceiptOutlinedIcon,
  BusinessOutlined as BusinessOutlinedIcon,
  AssignmentOutlined as AssignmentOutlinedIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
  ArrowBackIos as ArrowBackIosIcon,
  DashboardOutlined as DashboardOutlinedIcon,
  Task as TaskIcon,
  Timeline as TimelineIcon,
  People as PeopleIcon,
  ImportExport as ImportExportIcon,
  Note as NoteIcon,
  ChatOutlined as ChatOutlinedIcon,
  Assessment as AssessmentIcon,
  SettingsOutlined as SettingsOutlinedIcon,
  ExpandLess,
  ExpandMore,
  AdminPanelSettingsOutlined as AdminPanelSettingsOutlinedIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Storage as StorageIcon,
  DeveloperBoard as DeveloperBoardIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const Sidebar = ({ isSidebar }) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(!isSidebar);
  const [openSubMenus, setOpenSubMenus] = useState({ project: false, admin: false });

  const styles = {
    sidebar: {
      width: collapsed ? "60px" : "240px",
      height: "100vh",
      backgroundColor: "#0A2540",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      paddingTop: "20px",
      transition: "width 0.3s",
      position: "fixed",
      top: 0,
      left: 0,
      zIndex: 1200,
    },
    toggleButton: {
      position: "absolute",
      top: "10px",
      right: "10px",
      color: "#fff",
    },
    list: {
      width: "100%",
      marginTop: "20px",
      overflowY: "auto",
      maxHeight: "calc(100vh - 80px)",
      "&::-webkit-scrollbar": {
        width: "6px",
      },
      "&::-webkit-scrollbar-thumb": {
        backgroundColor: "#1E3A5F",
        borderRadius: "3px",
      },
      "&::-webkit-scrollbar-track": {
        backgroundColor: "#0A2540",
      },
    },
    listItem: {
      display: "flex",
      justifyContent: collapsed ? "center" : "flex-start",
      padding: "12px 16px",
      minHeight: "48px",
      "&:hover": { backgroundColor: "#1E3A5F" },
    },
    subListItem: {
      pl: collapsed ? 2 : 4,
      padding: "10px 16px",
      minHeight: "48px",
      "&:hover": { backgroundColor: "#1E3A5F" },
    },
    icon: {
      color: "#fff",
      minWidth: collapsed ? 0 : 40,
    },
  };

  const mainMenuItems = useMemo(
    () => [
      { icon: <HomeOutlinedIcon />, title: "Dashboard", to: "/dashboardAgent" },
      { icon: <BusinessOutlinedIcon />, title: "Entreprises", to: "/entreprisePage" },
      { icon: <ContactsOutlinedIcon />, title: "Contacts", to: "/contactPage" },
      { icon: <ReceiptOutlinedIcon />, title: "Tickets", to: "/ticket-form" },
      {
        icon: <AssignmentOutlinedIcon />,
        title: "Gestion de Projet",
        subMenuKey: "project",
        hasSubMenu: true,
      },
      {
        icon: <AdminPanelSettingsOutlinedIcon />,
        title: "Administration",
        subMenuKey: "admin",
        hasSubMenu: true,
      },
    ],
    []
  );

  const projectSubMenuItems = useMemo(
    () => [
      { icon: <DashboardOutlinedIcon />, title: "Dashboard", to: "/DashboardProject" },
      { icon: <ImportExportIcon />, title: "Projets", to: "/TableProject" },
      { icon: <TaskIcon />, title: "Tâches", to: "/KanbanBoard" },
      { icon: <TimelineIcon />, title: "Timeline", to: "/Timeline" },
      { icon: <PeopleIcon />, title: "Équipe", to: "/ProjectTeam" },
      { icon: <NoteIcon />, title: "Statistiques", to: "/StatistiquesInterface" },
      { icon: <ChatOutlinedIcon />, title: "Messagerie", to: "/MessagingInterface" },
      { icon: <AssessmentIcon />, title: "Rapport", to: "/AIProjectReport" },
      { icon: <SettingsOutlinedIcon />, title: "Paramètres", to: "/AddTypeAndStatusPage" },
      { icon: <TaskIcon />, title: "Tâches par statut", to: "/TasksByStatus" },
      
   
      
  
      
          
          
    ],
    []
  );

  const adminSubMenuItems = useMemo(
    () => [
      { icon: <DashboardOutlinedIcon />, title: "Tableau de bord Admin", to: "/admin/dashboard" },
      { icon: <SettingsOutlinedIcon />, title: "Général", to: "/admin/general" },
      { icon: <PeopleIcon />, title: "Utilisateurs", to: "/admin/users" },
      { icon: <SecurityIcon />, title: "Sécurité", to: "/admin/security" },
      { icon: <StorageIcon />, title: "Base de données", to: "/admin/database" },
      { icon: <NotificationsIcon />, title: "Notifications", to: "/admin/notifications" },
      { icon: <EmailIcon />, title: "Email", to: "/admin/email" },
      { icon: <DeveloperBoardIcon />, title: "Logs Système", to: "/admin/logs" },
      { icon: <SettingsOutlinedIcon />, title: "Workflow", to: "/admin/workflow" },
    ],
    []
  );

  const handleItemClick = useCallback(
    (item) => {
      if (item.hasSubMenu) {
        setOpenSubMenus((prev) => ({
          ...prev,
          [item.subMenuKey]: !prev[item.subMenuKey],
        }));
      } else {
        navigate(item.to);
      }
    },
    [navigate]
  );

  return (
    <Box sx={styles.sidebar}>
      <IconButton
        sx={styles.toggleButton}
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ArrowForwardIosIcon /> : <ArrowBackIosIcon />}
      </IconButton>

      <List sx={styles.list}>
        {mainMenuItems.map((item, index) => (
          <React.Fragment key={index}>
            <Tooltip title={collapsed ? item.title : ""} placement="right" arrow>
              <ListItem
                button
                onClick={() => handleItemClick(item)}
                sx={styles.listItem}
                aria-label={item.title}
              >
                <ListItemIcon sx={styles.icon}>{item.icon}</ListItemIcon>
                {!collapsed && <ListItemText primary={item.title} />}
                {item.hasSubMenu && !collapsed && (
                  <>{openSubMenus[item.subMenuKey] ? <ExpandLess /> : <ExpandMore />}</>
                )}
              </ListItem>
            </Tooltip>

            {item.hasSubMenu && item.subMenuKey === "project" && (
              <Collapse in={openSubMenus[item.subMenuKey]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {projectSubMenuItems.map((subItem, subIndex) => (
                    <Tooltip
                      key={subIndex}
                      title={collapsed ? subItem.title : ""}
                      placement="right"
                      arrow
                    >
                      <ListItem
                        button
                        onClick={() => navigate(subItem.to)}
                        sx={styles.subListItem}
                        aria-label={subItem.title}
                      >
                        <ListItemIcon sx={styles.icon}>{subItem.icon}</ListItemIcon>
                        {!collapsed && <ListItemText primary={subItem.title} />}
                      </ListItem>
                    </Tooltip>
                  ))}
                </List>
              </Collapse>
            )}

            {item.hasSubMenu && item.subMenuKey === "admin" && (
              <Collapse in={openSubMenus[item.subMenuKey]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {adminSubMenuItems.map((subItem, subIndex) => (
                    <Tooltip
                      key={subIndex}
                      title={collapsed ? subItem.title : ""}
                      placement="right"
                      arrow
                    >
                      <ListItem
                        button
                        onClick={() => navigate(subItem.to)}
                        sx={styles.subListItem}
                        aria-label={subItem.title}
                      >
                        <ListItemIcon sx={styles.icon}>{subItem.icon}</ListItemIcon>
                        {!collapsed && <ListItemText primary={subItem.title} />}
                      </ListItem>
                    </Tooltip>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default Sidebar;
