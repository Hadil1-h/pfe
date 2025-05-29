import React from 'react';

const StatistiquesInterface = () => {
  return (
    <div style={{
      width: '100%', 
      height: '800px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f5f5f5'
    }}>
      <iframe
        title="Rapport Power BI"
        width="90%"
        height="90%"
        src="https://app.powerbi.com/reportEmbed?reportId=6ef93fcf-527c-4c7a-b1c5-a4a62e2de389&autoAuth=true&ctid=dbd6664d-4eb9-46eb-99d8-5c43ba153c61"
        frameBorder="0"
        allowFullScreen={true}
        style={{
          border: '1px solid #ccc',
          borderRadius: '5px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}
      ></iframe>
    </div>
  );
};

export default StatistiquesInterface;
