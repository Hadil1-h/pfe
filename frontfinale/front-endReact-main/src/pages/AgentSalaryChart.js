import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import axios from 'axios';

const AgentSalaryChart = () => {
  const [agentData, setAgentData] = useState([]);

  useEffect(() => {
    // Récupérer les agents depuis l'API
    axios.get('http://localhost:8080/api/equipes')
      .then(({ data }) => {
        // Supposons que data est un tableau d'équipes, chaque équipe ayant des agents
        const allAgents = data.flatMap(equipe => equipe.agents || []);
        // Formater pour Recharts : [{ name: "Ahmed Ben Ali", salary: 1800.00 }, ...]
        const formattedData = allAgents.map(agent => ({
          name: `${agent.prenom} ${agent.nom}`,
          salary: parseFloat(agent.salaire) || 0,
        }));
        setAgentData(formattedData);
      })
      .catch(error => console.error('Erreur lors de la récupération des agents:', error));
  }, []);

  return (
    <div>
      <h2>Salaires des agents</h2>
      <BarChart width={600} height={300} data={agentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis label={{ value: 'Salaire (TND)', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Bar dataKey="salary" fill="#8884d8" />
      </BarChart>
    </div>
  );
};

export default AgentSalaryChart;