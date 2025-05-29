export const users = [
  { id: 1, email: "contact@example.com", password: "123456", role: "contact" },
  { id: 2, email: "agent@example.com", password: "admin123", role: "agent" },
  { id: 3, email: "contact2@example.com", password: "contact2", role: "contact" },
  { id: 4, email: "contact3@example.com", password: "contact3", role: "contact" },
  { id: 5, email: "admin@example.com", password: "admin456", role: "admin" }, // Nouvel utilisateur admin
];

export const mockDataContacts = [
  {
    id: 1,
    name: "Jon Snow",
    adresse: "Lafran",
    age: 35,
    telephoneProfessionnelle: "(665)121-5454",
    telephonePortable: "(665)121-5754",
    photo: "",
    role: "contact",
    idEntreprise: 1,
    agentsFavoris: [{ id: 2 }],
  },
  {
    id: 3,
    name: "Jaime Lannister",
    adresse: "Lafran",
    age: 45,
    telephoneProfessionnelle: "(422)982-6739",
    telephonePortable: "256569874",
    photo: "",
    role: "contact",
    idEntreprise: 1,
    agentsFavoris: [{ id: 2 }],
  },
  {
    id: 4,
    name: "Anya Stark",
    adresse: "Lafran",
    age: 16,
    telephoneProfessionnelle: "(921)425-6742",
    telephonePortable: "44786952",
    photo: "",
    role: "contact",
    idEntreprise: 2,
    agentsFavoris: [{ id: 2 }],
  },
];

export const mockDataAgents = [
  {
    id: 2,
    email: "agent@example.com",
    name: "Cersei Lannister",
    age: 42,
    phone: "(421)314-2288",
    address: "1234 Main Street, New York, NY 10001",
    city: "New York",
    zipCode: "13151",
    registrarId: 123512,
    role: "agent",
    contacts: [{ id: 1 }, { id: 3 }],
  },
  {
    id: 5,
    email: "admin@example.com",
    name: "Admin User",
    age: 50,
    phone: "(555)123-4567",
    address: "456 Admin Road, New York, NY 10002",
    city: "New York",
    zipCode: "10002",
    registrarId: 123513,
    role: "admin",
    contacts: [], // Pas de contacts assignés pour l'admin
  },
];

export const mockDataEntreprise = [
  {
    id: 1,
    name: "Entreprise1",
    secteur: "Secteur1",
    address: "Address1",
    codePostal: "CodePostal1",
    ville: "Ville1",
    listContacts: [{ id: 1 }, { id: 3 }],
  },
  {
    id: 2,
    name: "Entreprise2",
    secteur: "Secteur2",
    address: "Address2",
    codePostal: "CodePostal2",
    ville: "Ville2",
    listContacts: [{ id: 4 }],
  },
];

export const mockDataAccesADistance = [
  {
    id: 1,
    adressIp: "127.0.0.1",
    dateConnexion: "2023-07-20",
    idEntreprise: 1,
    ListOutilAcces: [{ id: 1 }],
    statutConnexion: "connecte",
  },
];

export const mockDataOutilAcces = [
  {
    id: 1,
    nomOutil: "Outil1",
  },
];

export const mockDataTypePanne = [
  {
    id: 1,
    descriptionTypePanne: "Problème Windows",
  },
];

export const mockDataTypeTicket = [
  {
    id: 1,
    descriptionTypeTicket: "Demande",
  },
  {
    id: 2,
    descriptionTypeTicket: "Bug",
  },
];

export const mockDataPrioriteTicket = [
  {
    id: 1,
    descriptionPriorite: "Faible",
  },
  {
    id: 2,
    descriptionPriorite: "Normale",
  },
  {
    id: 3,
    descriptionPriorite: "Urgente",
  },
];