import React, { useEffect, useState } from 'react';
import { PowerBIEmbed } from 'powerbi-client-react';
import { models } from 'powerbi-client';

function PowerBIReport() {
    const [embedToken, setEmbedToken] = useState(null);
    const [error, setError] = useState(null);
    const reportId = '6ef93fcf-527c-4c7a-b1c5-a4a62e2de389';
    const embedUrl = 'https://app.powerbi.com/reportEmbed?reportId=6ef93fcf-527c-4c7a-b1c5-a4a62e2de389&autoAuth=true&ctid=dbd6664d-4eb9-46eb-99d8-5c43ba153c61';

    useEffect(() => {
        fetch('http://localhost:8080/api/powerbi/embed-token', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.error) {
                    setError(data.error);
                } else {
                    setEmbedToken(data.token);
                }
            })
            .catch(error => {
                setError(error.message);
                console.error('Erreur:', error);
            });
    }, []);

    return (
        <div>
            <h1>Statistiques</h1>
            {error ? (
                <p style={{ color: 'red' }}>Erreur: {error}</p>
            ) : embedToken ? (
                <PowerBIEmbed
                    embedConfig={{
                        type: 'report',
                        id: reportId,
                        embedUrl: embedUrl,
                        accessToken: embedToken,
                        tokenType: models.TokenType.Embed,
                        settings: {
                            panes: { filters: { expanded: false, visible: false } },
                            background: models.BackgroundType.Transparent,
                        },
                    }}
                    cssClassName="report-container"
                />
            ) : (
                <p>Chargement...</p>
            )}
        </div>
    );
}

export default PowerBIReport;