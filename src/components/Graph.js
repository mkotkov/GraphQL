import React, { useEffect, useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
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
  }, []).sort((a, b) => b.value - a.value).slice(0, 5);

  const doneAuditsTotal = auditData
    .filter((audit) => audit.type === 'up')
    .reduce((sum, audit) => sum + audit.amount, 0);
  const receivedAuditsTotal = auditData
    .filter((audit) => audit.type === 'down')
    .reduce((sum, audit) => sum + audit.amount, 0);
  const doneAuditsMB = (doneAuditsTotal / (1000 * 1000)).toFixed(2);
  const receivedAuditsMB = (receivedAuditsTotal / (1000 * 1000)).toFixed(2);
  const donePercentage = (doneAuditsTotal / (doneAuditsTotal + receivedAuditsTotal) * 100).toFixed(2);
  const receivedPercentage = (receivedAuditsTotal / (doneAuditsTotal + receivedAuditsTotal) * 100).toFixed(2);
  const ratio = (doneAuditsTotal / receivedAuditsTotal).toFixed(1);

  if (loadingUserData || loadingProjectXP || loadingAudits) return <p>Loading...</p>;
  if (errorUserData || errorProjectXP || errorAudits) return <p>Error: {errorUserData?.message || errorProjectXP?.message || errorAudits?.message}</p>;

  return (
    <div className="graphs-container">
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
        <ResponsiveContainer width="100%" height={300}>
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
            <Line type="monotone" dataKey="amount" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="graph">
        <h3>Top 5 Projects by XP</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={processedProjectXPData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="name" />
            <PolarRadiusAxis />
            <Radar name="XP" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
            <Tooltip />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="graph">
        <h3>Audits Ratio</h3>
        <div className="audit-ratio">
          <div className="audit-ratio__bars">
            <div className="audit-ratio__bar audit-ratio__bar--done" style={{ width: `${donePercentage}%` }} />
            <div className="audit-ratio__bar audit-ratio__bar--received" style={{ width: `${receivedPercentage}%` }} />
          </div>
          <div className="audit-ratio__info">
            <div className="audit-ratio__info-item">
              <span>Done</span>
              <span>{doneAuditsMB} MB</span>
            </div>
            <div className="audit-ratio__info-item">
              <span>Received</span>
              <span>{receivedAuditsMB} MB</span>
            </div>
          </div>
          <div className="audit-ratio__result">
            <div className="audit-ratio__result-number">{ratio}</div>
            <div className="audit-ratio__result-label">Ratio</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Graph;
