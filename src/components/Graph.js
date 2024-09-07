import React, { useEffect, useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import '../css/graph.css'; // Убедитесь, что путь к CSS корректен

const GET_USER_DATA_AND_XP = gql`
  query GetUserDataAndXP($userId: Int!) {
    transaction(where: { userId: { _eq: $userId }, type: { _eq: "xp" } }) {
      amount
      createdAt
    }
  }
`;

const GET_PROJECT_XP_DATA = gql`
  query GetProjectXPData($userId: Int!) {
    transaction(where: { userId: { _eq: $userId }, type: { _eq: "xp" } }) {
      amount
      object {
        name
      }
    }
  }
`;

const GET_AUDITS_DATA = gql`
  query GetAuditsData($userId: Int!) {
    transaction(where: { userId: { _eq: $userId }, type: { _in: ["up", "down"] } }) {
      type
      amount
    }
  }
`;

const COLORS = ['#00b894', '#8A2BE2', '#9370DB', '#00b894', '#BA55D3', '#8884d8'];



const Graph = ({ userId }) => {
  const { loading: loadingUserData, error: errorUserData, data: dataUserData } = useQuery(GET_USER_DATA_AND_XP, {
    variables: { userId },
  });
  const { loading: loadingProjectXP, error: errorProjectXP, data: dataProjectXP } =
    useQuery(GET_PROJECT_XP_DATA, { variables: { userId } });
  const { loading: loadingAudits, error: errorAudits, data: dataAudits } = useQuery(GET_AUDITS_DATA, {
    variables: { userId },
  });

  const [projectXPData, setProjectXPData] = useState([]);
  const [auditData, setAuditData] = useState([]);
  const [filteredXPData, setFilteredXPData] = useState([]);
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    if (dataUserData) {
      const processedData = dataUserData.transaction.map((d) => ({
        ...d,
        amount: d.amount / 1000,
      }));
      setFilteredXPData(processDataByPeriod(processedData, period));
    }
  }, [dataUserData, period]);

  useEffect(() => {
    if (dataProjectXP) {
      setProjectXPData(dataProjectXP.transaction.map((d) => ({ ...d, amount: d.amount / 1000 })));
    }
  }, [dataProjectXP]);

  useEffect(() => {
    if (dataAudits) {
      setAuditData(dataAudits.transaction);
    }
  }, [dataAudits]);

  const processDataByPeriod = (data, period) => {
    let filteredData = data;
    if (period !== 'all') {
      const periodMonths = parseInt(period, 10);
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - periodMonths);
      filteredData = data.filter((d) => new Date(d.createdAt) >= startDate);
    }
    filteredData.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return filteredData;
  };

  const processedProjectXPData = projectXPData.reduce((acc, curr) => {
    const existingProject = acc.find((proj) => proj.name === curr.object.name);
    if (existingProject) {
      existingProject.value += curr.amount;
    } else {
      acc.push({ name: curr.object.name, value: curr.amount });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value).slice(0, 6);

  const doneAuditsTotal = auditData
    .filter((audit) => audit.type === 'up')
    .reduce((sum, audit) => sum + audit.amount, 0);
  const receivedAuditsTotal = auditData
    .filter((audit) => audit.type === 'down')
    .reduce((sum, audit) => sum + audit.amount, 0);

  if (loadingUserData || loadingProjectXP || loadingAudits) return <p>Loading...</p>;
  if (errorUserData || errorProjectXP || errorAudits) return <p>Error: {errorUserData?.message || errorProjectXP?.message || errorAudits?.message}</p>;

  return (
    <div className="graphs-container">
      <div className="graph">
        <div className='total'>
        <h3>Total XP:</h3>
        <h1>{projectXPData.reduce((sum, project) => sum + project.amount, 0).toFixed(2)} XP</h1>
        </div>
        <div>
        <h3>Top 6 Projects by XP</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={processedProjectXPData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              label = "name"
            >
              {processedProjectXPData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

        <div className="ratio">
          <h3>Audits Ratio</h3>
          <div className="audit-ratio-container">
            <div className="bars-container">
              <div className="bar done-bar">
                <div
                  className="bar-fill"
                  style={{
                    width: `${(doneAuditsTotal / (doneAuditsTotal + receivedAuditsTotal)) * 100}%`,
                  }}
                ></div>
              </div>
              <div className="bar received-bar">
                <div
                  className="bar-fill"
                  style={{
                    width: `${(receivedAuditsTotal / (doneAuditsTotal + receivedAuditsTotal)) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
            <div className="audit-info">
              <span>{(doneAuditsTotal / (1000 * 1000)).toFixed(2)} MB</span>
              <span>Done ↑</span>
              <span>{(receivedAuditsTotal / (1000 * 1000)).toFixed(2)} MB</span>
              <span>Received ↓</span>
            </div>
            <div className="ratio-result">
              <h1>{(doneAuditsTotal / receivedAuditsTotal).toFixed(1)}</h1>
              <p>
                {(doneAuditsTotal / receivedAuditsTotal).toFixed(1) >= 1.5
                  ? 'Almost perfect!'
                  : 'Keep pushing!'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="graph">
        <h3>XP Progression Over Time</h3>
        <div className="period-selector">
          <label htmlFor="period">Period:</label>
          <select id="period" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="3">Last 3 months</option>
            <option value="6">Last 6 months</option>
            <option value="12">Last 12 months</option>
            <option value="all">All time</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart
            data={filteredXPData.map((d) => ({
              ...d,
              date: new Date(d.createdAt).toLocaleDateString(),
            }))}
          >
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="amount" stroke="#8884d8"/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Graph;
