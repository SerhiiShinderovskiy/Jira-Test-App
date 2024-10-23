import React, { useState, useEffect } from 'react';
import Card from './Card';

const TaskTable = () => {
  const [filters, setFilters] = useState([]); 
  const [data, setData] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('');
  const [processedData, setProcessedData] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/filters')
      .then(response => response.json())
      .then(data => {
        console.log('Filters data:', data.values);
        setFilters(data.values);
      })
      .catch(error => console.error('Error fetching filters:', error));
  }, []);

  useEffect(() => {
    if (selectedFilter) {
      fetch(`http://localhost:3001/issues/${selectedFilter}`)
        .then(response => response.json())
        .then(data => {
          console.log('Issues data:', data);
          setData(data);
          processIssuesData(data);
        })
        .catch(error => console.error('Error fetching issues:', error));
    }
  }, [selectedFilter]);

  const getStatusCategory = (status) => {
    const upperStatus = status.toUpperCase();
    
    if (upperStatus.includes('TO DO') || upperStatus === 'OPEN' || upperStatus === 'BACKLOG') {
      return 'TO DO';
    }
    if (upperStatus.includes('PROGRESS') || upperStatus.includes('IN PROGRESS') || upperStatus === 'IN REVIEW') {
      return 'PROGRESS';
    }
    if (upperStatus.includes('DONE') || upperStatus.includes('CLOSED') || upperStatus.includes('COMPLETED')) {
      return 'DONE';
    }
    return 'TO DO';
  };

  const processIssuesData = (rawData) => {
    if (!rawData || !Array.isArray(rawData)) {
      setProcessedData([]);
      return;
    }

    console.log('Processing raw data:', rawData);

    const userStats = {};

    rawData.forEach(issue => {
      const assignee = issue.fields?.assignee?.displayName || 'Unassigned';
      const status = issue.fields?.status?.name;
      
      console.log(`Processing issue for ${assignee} with status: ${status}`);

      if (!userStats[assignee]) {
        userStats[assignee] = {
          'TO DO': { count: 0, issues: [] },
          'PROGRESS': { count: 0, issues: [] },
          'DONE': { count: 0, issues: [] }
        };
      }

      const normalizedStatus = getStatusCategory(status);
      
      console.log(`Normalized status: ${normalizedStatus}`);

      userStats[assignee][normalizedStatus].count++;
      userStats[assignee][normalizedStatus].issues.push(issue.key);
    });

    console.log('Processed user stats:', userStats);

    const processedData = Object.entries(userStats).map(([assignee, stats]) => ({
      assignee,
      stats
    }));

    setProcessedData(processedData);
  };

  const handleFilterChange = (event) => {
    setSelectedFilter(event.target.value);
  };

  const generateJiraUrl = (issues, filter) => {
    const baseUrl = 'https://testforexample1.atlassian.net/issues/?';
    const jql = encodeURIComponent(`filter=${filter} AND key in (${issues.join(',')})`);
    return `${baseUrl}jql=${jql}`;
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <select 
          onChange={handleFilterChange} 
          value={selectedFilter}
          className="w-full p-2 border rounded-md shadow-sm"
        >
          <option value="">Choose a filter</option>
          {filters.map(filter => (
            <option key={filter.id} value={filter.id}>
              {filter.name}
            </option>
          ))}
        </select>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border text-left">Assignee</th>
                <th className="p-2 border text-center">TO DO</th>
                <th className="p-2 border text-center">PROGRESS</th>
                <th className="p-2 border text-center">DONE</th>
              </tr>
            </thead>
            <tbody>
              {processedData.length > 0 ? (
                processedData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="p-2 border">{row.assignee}</td>
                    {['TO DO', 'PROGRESS', 'DONE'].map(status => (
                      <td key={status} className="p-2 border text-center">
                        {row.stats[status].count > 0 ? (
                          <a 
                            href={generateJiraUrl(row.stats[status].issues, selectedFilter)}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`px-2 py-1 rounded inline-block
                              ${status === 'TO DO' ? 'bg-red-100 hover:bg-red-200' : ''}
                              ${status === 'PROGRESS' ? 'bg-yellow-100 hover:bg-yellow-200' : ''}
                              ${status === 'DONE' ? 'bg-green-100 hover:bg-green-200' : ''}
                            `}
                          >
                            {row.stats[status].count}
                          </a>
                        ) : (
                          <span className="px-2 py-1 bg-gray-50 rounded">
                            0
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-gray-500">
                    Select a filter to display data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
};

export default TaskTable;