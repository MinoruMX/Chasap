import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";

import { AuthContext } from "../../context/Auth/AuthContext";

const VersionLog = () => {
  const [versionLog, setVersionLog] = useState([]);
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const [error, setError] = useState(null);

  // trava para nao acessar pagina que não pode  
  useEffect(() => {
    async function fetchData() {
      if (!user.super) {
        toast.error("¡Esta empresa no tiene permiso para acceder a esta página! Estamos redirigiéndolo.");
        setTimeout(() => {
          history.push(`/`)
        }, 1000);
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchReadme = async () => {
      try {
        const response = await axios.get(
          'https://api.github.com/repos/MinoruMX/chasap-readme/contents/README.md'
        );
        const decodedContent = decodeBase64(response.data.content);
        const parsedLog = parseVersionLog(decodedContent);
        setVersionLog(parsedLog);
        setLoading(false);
      } catch (error) {
        setError('Error al cargar el registro de versiones.');
        setLoading(false);
      }
    };

    fetchReadme();
  }, []);

  // Função para decodificar Base64 com suporte UTF-8
  const decodeBase64 = (str) => {
    return decodeURIComponent(
      Array.prototype.map
        .call(atob(str), (c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );
  };

  const parseVersionLog = (content) => {
    const versions = content.split('## ').slice(1);
    return versions.map(versionText => {
      const [title, ...changes] = versionText.split('\n').filter(line => line.trim() !== '');
      return {
        version: title.trim(),
        changes: changes.map(change => change.trim().replace('-', '').trim()) // Remover o traço
      };
    }).map(log => ({
      ...log,
      changes: log.changes.map(change => formatMarkdown(change)) // Aplica a formatação do Markdown
    }));
  };

  const formatMarkdown = (text) => {
    // Remover o símbolo "•" da mudança
    const cleanText = text.replace(/•/g, '').trim(); // Remove o "•" se ele existir

    // Aqui você pode adicionar mais formatação para o Markdown
    return cleanText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Para negrito
      .replace(/\*([^\*]+)\*/g, '<em>$1</em>'); // Para itálico
  };

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', fontSize: '14px', maxWidth: '600px', margin: 'auto' }}>
      <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '20px', fontSize: '18px' }}>Log de Versiones</h2>
      {versionLog.map(({ version, changes }) => (
        <div key={version} style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '15px',
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
        }}>
          <h3 style={{
            color: '#0056b3',
            borderBottom: '2px solid #ddd',
            paddingBottom: '8px',
            marginBottom: '10px',
            fontSize: '16px',
          }}>{version}</h3>
          <ul style={{
            paddingLeft: '0',
            listStyleType: 'none', // Remove o ponto antes dos ícones
            color: '#555',
          }}>
            {changes.map((change, index) => (
              <li key={index} style={{ marginBottom: '5px' }} dangerouslySetInnerHTML={{ __html: change }} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default VersionLog;
