import axios from 'axios';

// Create Axios Instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000', // Or use proxy /api
});

// Request Interceptor to add Token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Auth Services
export const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));
    return data;
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
};

// Lead Services
export const getLeads = async (filters = {}) => {
    // Convert basic filters to query string
    const params = new URLSearchParams(filters).toString();
    const { data } = await api.get(`/api/leads?${params}`);
    return data;
};

export const getLeadById = async (id) => {
    const { data } = await api.get(`/api/leads/${id}`);
    return data;
};

export const getLeadLogs = async (id) => {
    const { data } = await api.get(`/api/leads/${id}/logs`);
    return data;
}

export const retryEmail = async (id) => {
    const { data } = await api.post(`/api/leads/${id}/retry-email`);
    return data;
};

export const retryWhatsapp = async (id) => {
    const { data } = await api.post(`/api/leads/${id}/retry-whatsapp`);
    return data;
};

export const updateLeadStatus = async (id, status) => {
    const { data } = await api.put(`/api/leads/${id}/status`, { status });
    return data;
};

export const assignLead = async (id, assignedTo) => {
    const { data } = await api.put(`/api/leads/${id}/assign`, { assignedTo });
    return data;
};

export const deleteLead = async (id) => {
    const { data } = await api.delete(`/api/leads/${id}`);
    return data;
};

export const deleteLeads = async (ids) => {
    const { data } = await api.post('/api/leads/delete-batch', { ids });
    return data;
};
// Team
export const getTeam = async () => {
    // We can fetch actual users + pending invitations
    const response = await api.get('/users/team');
    return response.data;
};

export const getInvitations = async () => {
    const response = await api.get('/api/team/invitations');
    return response.data;
};

export const getTeamPerformance = async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await api.get(`/api/team/performance?${query}`);
    return response.data;
};

export const inviteMember = async (data) => {
    const response = await api.post('/api/team/invite', data);
    return response.data;
};

export const revokeInvitation = async (id) => {
    const response = await api.delete(`/api/team/invitation/${id}`);
    return response.data;
};

export const checkInvitationToken = async (token) => {
    const response = await api.get(`/api/team/join/${token}`);
    return response.data;
};

export const registerFromInvite = async (data) => {
    const response = await api.post('/auth/register-invite', data);
    if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
};

export const createUser = async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
};

export const deleteUser = async (id) => {
    const { data } = await api.delete(`/users/${id}`);
    return data;
};

// Task Management
export const getTasks = async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    // Support either general tasks query or specific lead tasks if structured that way
    const { data } = await api.get(`/api/tasks?${params}`);
    return data;
};

export const getTasksByLead = async (leadId) => {
    const { data } = await api.get(`/api/leads/${leadId}/tasks`);
    return data;
};

export const createTask = async (taskData) => {
    const { data } = await api.post('/api/tasks', taskData);
    return data;
};

export const updateTask = async (id, taskData) => {
    const { data } = await api.put(`/api/tasks/${id}`, taskData);
    return data;
};

export const completeTask = async (id) => {
    const { data } = await api.put(`/api/tasks/${id}/complete`);
    return data;
};

export const deleteTask = async (id) => {
    const { data } = await api.delete(`/api/tasks/${id}`);
    return data;
};

export const getTaskStats = async () => {
    const { data } = await api.get('/api/tasks/stats/all');
    return data;
};

// Notes
export const getNotesByLead = async (leadId) => {
    const { data } = await api.get(`/api/leads/${leadId}/notes`);
    return data;
};

export const createNote = async (noteData) => {
    const { data } = await api.post('/api/notes', noteData);
    return data;
};

export const updateNote = async (id, noteData) => {
    const { data } = await api.put(`/api/notes/${id}`, noteData);
    return data;
};

export const deleteNote = async (id) => {
    const { data } = await api.delete(`/api/notes/${id}`);
    return data;
};

// Analytics
export const getAnalytics = async () => {
    const response = await api.get('/api/analytics/dashboard');
    return response.data;
};

// Subscription
export const createCheckoutSession = async () => {
    const { data } = await api.post('/api/subscription/create-checkout-session');
    return data;
};

export const createPortalSession = async () => {
    const { data } = await api.post('/api/subscription/create-portal-session');
    return data;
};

export const getInvoices = async () => {
    const { data } = await api.get('/api/subscription/invoices');
    return data;
};

export const changePlan = async (newPlan) => {
    const { data } = await api.post('/api/subscription/change-plan', { newPlan });
    return data;
};

// Organization Settings
export const getSettings = async () => {
    const { data } = await api.get('/api/organization/settings');
    return data;
};

export const updateSettings = async (data) => {
    // Check if data is FormData (has file) or regular JSON
    const isFormData = data instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};

    const { data: response } = await api.put('/api/organization/settings', data, config);
    return response;
};

export const verifyConnection = async () => {
    const { data } = await api.post('/api/organization/verify-connection');
    return data;
};

export const autoConfigureWebhooks = async () => {
    const { data } = await api.post('/api/organization/auto-configure');
    return data;
};

export const sendAIChat = async (message) => {
    const { data } = await api.post('/api/ai/chat', { message });
    return data;
};

// Enterprise
export const getAuditLogs = async () => {
    const { data } = await api.get('/api/enterprise/audit-logs');
    return data;
};

export const getNotifications = async () => {
    const { data } = await api.get('/api/enterprise/notifications');
    return data;
};

// Automation / Workflows
export const getWorkflows = async () => {
    const { data } = await api.get('/api/workflows');
    return data;
};

export const createWorkflow = async (data) => {
    const response = await api.post('/api/workflows', data);
    return response.data;
};

export const getWorkflowById = async (id) => {
    const { data } = await api.get(`/api/workflows/${id}`);
    return data;
};

export const saveWorkflowDraft = async (id, draftData) => {
    const { data } = await api.put(`/api/workflows/${id}/draft`, draftData);
    return data;
};

export const publishWorkflow = async (id, message) => {
    const { data } = await api.post(`/api/workflows/${id}/publish`, { message });
    return data;
};

export const rollbackWorkflow = async (id, versionId) => {
    const { data } = await api.post(`/api/workflows/${id}/rollback`, { versionId });
    return data;
};

export const deleteWorkflow = async (id) => {
    const { data } = await api.delete(`/api/workflows/${id}`);
    return data;
};

// Custom Fields
export const getCustomFields = async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const { data } = await api.get(`/api/custom-fields?${params}`);
    return data;
};

export const createCustomField = async (fieldData) => {
    const { data } = await api.post('/api/custom-fields', fieldData);
    return data;
};

export const updateCustomField = async (id, fieldData) => {
    const { data } = await api.put(`/api/custom-fields/${id}`, fieldData);
    return data;
};

export const deleteCustomField = async (id) => {
    const { data } = await api.delete(`/api/custom-fields/${id}`);
    return data;
};

export const reorderCustomFields = async (orders) => {
<<<<<<< HEAD
    const { data } = await api.put('/api/custom-fields/reorder/all', { orders });
=======
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
    return data;
};

export const updateLeadCustomFieldValue = async (leadId, key, value) => {
    // Correct endpoint based on customFieldsRoutes.js
    const { data } = await api.put(`/api/custom-fields/leads/${leadId}/value`, { key, value });
    return data;
};

// Pipeline
export const getStages = async () => {
    const { data } = await api.get('/api/pipeline/stages');
    return data;
};

export const createStage = async (stageData) => {
    const { data } = await api.post('/api/pipeline/stages', stageData);
    return data;
};

export const updateStage = async (id, stageData) => {
    const { data } = await api.put(`/api/pipeline/stages/${id}`, stageData);
    return data;
};

export const deleteStage = async (id) => {
    const { data } = await api.delete(`/api/pipeline/stages/${id}`);
    return data;
};

export const reorderStages = async (orders) => {
    const { data } = await api.put('/api/pipeline/stages/reorder/all', { orders });
    return data;
};

export const updateLeadStage = async (leadId, stageId) => {
    const { data } = await api.put(`/api/leads/${leadId}/stage`, { stageId });
    return data;
};

export default api;
