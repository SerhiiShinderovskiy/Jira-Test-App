const axios = require('axios');
require('dotenv').config();

const jiraApi = axios.create({
    baseURL: process.env.JIRA_BASE_URL,
    headers: {
      'Authorization': `Basic ${Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64')}`,
      'Content-Type': 'application/json'
    }
});

// Get filters created by users
async function getJiraFilters() {
    try {
      const response = await jiraApi.get('/rest/api/2/filter/search');
      return response.data;
    } catch (error) {
      console.error('Error fetching filters:', error.response ? error.response.data : error.message);
      throw error;
    }
}

// Get tasks based on a filter (Filter ID)
async function getIssuesByFilter(filterId) {
    try {
      const response = await jiraApi.get(`/rest/api/3/search?jql=filter=${filterId}`);
      return response.data.issues;
    } catch (error) {
      console.error(`Error fetching issues for filter ${filterId}:`, error);
      throw error;
    }
}
  
module.exports = { getJiraFilters, getIssuesByFilter };