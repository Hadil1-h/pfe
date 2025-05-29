import { useState, useEffect } from "react";
import { Box, Button, TextField, Typography, useTheme, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { tokens } from "../theme";
import Header from "../components/Header";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Select from "react-select";

const AddTypeAndStatusPage = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();

  const [typeProjet, setTypeProjet] = useState({ nom: "" });
  const [statutProjet, setStatutProjet] = useState({ nom: "" });
  const [statutTache, setStatutTache] = useState({ nomStatut: "" });
  const [typeError, setTypeError] = useState("");
  const [statutError, setStatutError] = useState("");
  const [tacheError, setTacheError] = useState("");
  const [typeProjets, setTypeProjets] = useState([]);
  const [statutProjets, setStatutProjets] = useState([]);
  const [statutTaches, setStatutTaches] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedStatut, setSelectedStatut] = useState(null);
  const [selectedTache, setSelectedTache] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogTitle, setDialogTitle] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async (url, setter) => {
      try {
        const { data } = await axios.get(url);
        setter(data);
      } catch (error) {
        console.error(`Erreur récupération données: ${url}`, error);
        showDialog("Erreur", `Erreur lors de la récupération des données: ${error.message}`);
      }
    };
    fetchData("http://localhost:8080/api/type-projets", setTypeProjets);
    fetchData("http://localhost:8080/api/statut-projets", setStatutProjets);
    fetchData("http://localhost:8080/api/statuts", setStatutTaches);
  }, []);

  const showDialog = (title, message) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setIsDeleting(false);
  };

  const handleSelectChange = (selectedOption, setSelected, setData, dataStructure) => {
    setSelected(selectedOption);
    if (selectedOption) {
      setData({ ...dataStructure, [Object.keys(dataStructure)[0]]: selectedOption.label });
    } else {
      setData(dataStructure);
    }
  };

  const handleSubmit = async (e, url, data, setData, setError, setSelected, refreshSetter, successMsg, fieldName) => {
    e.preventDefault();
    const name = Object.values(data)[0].trim();
    if (!name) {
      setError("Le nom est requis");
      showDialog("Erreur", "Le nom est requis");
      return;
    }

    try {
      const existingItems = await axios.get(url);
      const exists = existingItems.data.some(item => 
        item[fieldName].toLowerCase() === name.toLowerCase()
      );

      if (exists) {
        setError("Ce nom existe déjà");
        showDialog("Erreur", "Ce nom existe déjà dans la base de données");
        return;
      }

      await axios.post(url, data);
      setData({ [Object.keys(data)[0]]: "" });
      setError("");
      setSelected(null);
      showDialog("Succès", successMsg);
      const { data: refreshed } = await axios.get(url);
      refreshSetter(refreshed);
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Erreur lors de l'opération";
      setError(errorMsg);
      showDialog("Erreur", errorMsg);
    }
  };

  const handleModify = async (url, id, data, setData, setError, setSelected, refreshSetter, successMsg, isDelete) => {
    if (!id) {
      setError("Veuillez sélectionner un élément");
      showDialog("Erreur", "Veuillez sélectionner un élément");
      return;
    }

    if (isDelete) {
      setIsDeleting(true);
    } else if (!Object.values(data)[0].trim()) {
      setError("Le nom est requis");
      showDialog("Erreur", "Le nom est requis");
      return;
    }

    try {
      if (isDelete) {
        await axios.delete(`${url}/${id}`);
      } else {
        const existingItems = await axios.get(url);
        const exists = existingItems.data.some(item => 
          item.id !== id && 
          item[Object.keys(data)[0]].toLowerCase() === Object.values(data)[0].trim().toLowerCase()
        );

        if (exists) {
          setError("Ce nom existe déjà");
          showDialog("Erreur", "Ce nom existe déjà dans la base de données");
          return;
        }

        await axios.put(`${url}/${id}`, data);
      }

      setData({ [Object.keys(data)[0]]: "" });
      setError("");
      setSelected(null);
      showDialog("Succès", successMsg);
      const { data: refreshed } = await axios.get(url);
      refreshSetter(refreshed);
    } catch (error) {
      let errorMsg = "Erreur lors de l'opération";
      
      if (error.response) {
        if (error.response.status === 409) {
          errorMsg = "Ce nom existe déjà";
        } else if (error.response.status === 400) {
          errorMsg = "Données invalides";
        } else if (isDelete && error.response.data.message.includes("REFERENCE constraint")) {
          errorMsg = "Impossible de supprimer : ce type est utilisé par un ou plusieurs projets";
        }
      }

      setError(errorMsg);
      showDialog("Erreur", errorMsg);
    } finally {
      if (isDelete) {
        setIsDeleting(false);
      }
    }
  };

  const section = (title, data, setData, error, setError, selected, setSelected, options, url, field, refreshSetter, label, fieldName) => (
    <Box mb="24px" p="12px" borderRadius="8px" bgcolor="#FFFFFF" boxShadow="0 2px 4px rgba(0, 0, 0, 0.08)">
      <Typography variant="h6" color={colors.grey[100]} fontWeight="600" mb="12px">
        {title}
      </Typography>
      <form onSubmit={(e) => handleSubmit(e, url, data, setData, setError, setSelected, refreshSetter, `${title} ajouté avec succès`, fieldName)}>
        <Box display="flex" alignItems="flex-start" gap="8px">
          <TextField
            fullWidth
            variant="filled"
            label={label}
            value={Object.values(data)[0]}
            onChange={(e) => setData({ [field]: e.target.value })}
            error={!!error}
            helperText={error}
            sx={{
              mb: "12px",
              bgcolor: "#FFFFFF",
              "& .MuiInputBase-input": { color: "#000000", fontSize: "13px", padding: "8px" },
              "& .MuiFormLabel-root": { color: colors.grey[500], fontSize: "13px" },
              "& .MuiFilledInput-root": {
                bgcolor: "#FFFFFF",
                "&:hover": { bgcolor: "#F5F5F5" },
                "&.Mui-focused": { bgcolor: "#FFFFFF" },
              },
            }}
          />
          <Select
            options={options}
            value={selected}
            onChange={(selectedOption) => handleSelectChange(selectedOption, setSelected, setData, { [field]: "" })}
            placeholder={`Sélectionner ${title.split(" ")[1]}`}
            isClearable
            styles={{
              control: (base) => ({
                ...base,
                fontSize: "13px",
                height: "40px",
                minWidth: "120px",
                maxWidth: "200px",
                bgcolor: "#FFFFFF",
                borderColor: colors.grey[500],
                color: "#000000",
              }),
              menu: (base) => ({ ...base, fontSize: "13px", bgcolor: "#FFFFFF" }),
              option: (base, state) => ({
                ...base,
                bgcolor: state.isSelected ? "#0A2540" : "#FFFFFF",
                color: "#000000",
                "&:hover": { bgcolor: "#F5F5F5" },
              }),
              singleValue: (base) => ({ ...base, color: "#000000" }),
              placeholder: (base) => ({ ...base, color: colors.grey[500] }),
            }}
          />
        </Box>
        <Box display="flex" gap="8px">
          <Button
            type="submit"
            variant="contained"
            sx={{ bgcolor: "#0A2540", "&:hover": { bgcolor: "#1A3550" }, "&.Mui-disabled": { bgcolor: colors.grey[700], color: colors.grey[400] }, minWidth: "40px", p: "6px" }}
            disabled={!!selected}
          >
            <AddIcon fontSize="small" />
          </Button>
          <Button
            variant="contained"
            onClick={() => handleModify(url, selected?.value, data, setData, setError, setSelected, refreshSetter, `${title} modifié avec succès`, false)}
            disabled={!selected}
            sx={{ bgcolor: "#0A2540", "&:hover": { bgcolor: "#1A3550" }, minWidth: "40px", p: "6px" }}
          >
            <EditIcon fontSize="small" />
          </Button>
          <Button
            variant="contained"
            onClick={() => handleModify(url, selected?.value, data, setData, setError, setSelected, refreshSetter, `${title} supprimé avec succès`, true)}
            disabled={!selected || isDeleting}
            sx={{ bgcolor: "#0A2540", "&:hover": { bgcolor: "#1A3550" }, minWidth: "40px", p: "6px" }}
          >
            <DeleteIcon fontSize="small" />
          </Button>
        </Box>
      </form>
    </Box>
  );

  return (
    <Box m="12px">
      <Header title="Gestion des types et statuts" subtitle="" />
      
      {section(
        "Type Projet",
        typeProjet,
        setTypeProjet,
        typeError,
        setTypeError,
        selectedType,
        setSelectedType,
        typeProjets.map((t) => ({ value: t.id, label: t.nom })),
        "http://localhost:8080/api/type-projets",
        "nom",
        setTypeProjets,
        "Nom du Type Projet",
        "nom"
      )}
      
      {section(
        "Statut Projet",
        statutProjet,
        setStatutProjet,
        statutError,
        setStatutError,
        selectedStatut,
        setSelectedStatut,
        statutProjets.map((s) => ({ value: s.id, label: s.nom })),
        "http://localhost:8080/api/statut-projets",
        "nom",
        setStatutProjets,
        "Nom du Statut Projet",
        "nom"
      )}
      
      {section(
        "Statut Tâche",
        statutTache,
        setStatutTache,
        tacheError,
        setTacheError,
        selectedTache,
        setSelectedTache,
        statutTaches.map((t) => ({ value: t.id, label: t.nomStatut })),
        "http://localhost:8080/api/statuts",
        "nomStatut",
        setStatutTaches,
        "Nom du Statut Tâche",
        "nomStatut"
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          <Typography>{dialogMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary" autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AddTypeAndStatusPage;