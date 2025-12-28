import React, { useState, useEffect, useRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useToast } from '../components/Toast';
import CustomFieldsSettings from '../components/CustomFieldsSettings';
import DealPipelineSettings from '../components/DealPipelineSettings';
import AuditLogsTable from '../components/AuditLogsTable';
import { 
    GanttChart, 
    Loader2, 
    Upload, 
    Trash2, 
    Key, 
    Globe, 
    Zap, 
    CheckCircle, 
    AlertCircle, 
    LayoutDashboard, 
    Lock, 
    Users, 
    Shield, 
    Building, 
    Eye, 
    EyeOff, 
    Save, 
    ArrowLeft, 
    Server,
    X,
    Info 
} from 'lucide-react';
import { getSettings, updateSettings } from '../services/api';



const Settings = () => {
    const toast = useToast();
    
    // --- STATE MANAGEMENT ---
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        pageId: '',
        whatsappPhoneId: '',
        metaAccessToken: '',
        sendgridApiKey: '',
        fromEmail: '',
        // AI Keys
        vapiPrivateKey: '',
        vapiPublicKey: '',
        vapiAssistantId: '',
        vapiPhoneNumber: '',
        openaiApiKey: '',
        // Enterprise
        customDomain: '',
        customRoles: [],
        ssoSettings: { provider: 'none', enabled: false },
        integrations: { salesforce: { connected: false }, hubspot: { connected: false } },
        features: { email: false, whatsapp: false, aiStats: false, voiceAgent: false }
    });
    const [initialData, setInitialData] = useState({});
    const [validationErrors, setValidationErrors] = useState({});
    const [isDirty, setIsDirty] = useState(false);
    const [logo, setLogo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [activeTab, setActiveTab] = useState('general');

    // Visibility Toggles
    const [showVapiKeys, setShowVapiKeys] = useState(false);
    const [showOpenAIKey, setShowOpenAIKey] = useState(false);

    // Integration Modals
    const [integrationModal, setIntegrationModal] = useState(null); // 'salesforce' | 'hubspot' | null
    const [integrationCreds, setIntegrationCreds] = useState({});
    const [showDNSInstructions, setShowDNSInstructions] = useState(false);
    const [verifying, setVerifying] = useState(false);

    // --- VALIDATION LOGIC ---
    const validateField = (name, value) => {
        const errors = {};
        
        if (name === 'fromEmail' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) errors.fromEmail = 'Invalid email format';
        }
        
        if (name === 'whatsappPhoneId' && value) {
            const phoneRegex = /^\d{10,15}$/;
            if (!phoneRegex.test(value)) errors.whatsappPhoneId = 'Phone must be 10-15 digits';
        }
        
        if (name === 'customDomain' && value) {
            const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
            if (!domainRegex.test(value)) errors.customDomain = 'Invalid domain format';
        }
        
        return errors;
    };

    const validateForm = () => {
        const errors = {};
        Object.keys(formData).forEach(key => {
            const fieldErrors = validateField(key, formData[key]);
            Object.assign(errors, fieldErrors);
        });
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Check if form has unsaved changes
    useEffect(() => {
        const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);
        setIsDirty(hasChanges);
    }, [formData, initialData]);

    // --- EFFECTS ---
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await getSettings();
                // Ensure all fields have default values (prevent undefined -> controlled input warning)
                setFormData({
                    name: data.name || '',
                    pageId: data.pageId || '',
                    whatsappPhoneId: data.whatsappPhoneId || '',
                    metaAccessToken: data.metaAccessToken ? '****' : '',
                    sendgridApiKey: data.sendgridApiKey ? '****' : '',
                    fromEmail: data.fromEmail || '',
                    vapiPrivateKey: data.vapiPrivateKey ? '****' : '',
                    vapiPublicKey: data.vapiPublicKey ? '****' : '',
                    vapiAssistantId: data.vapiAssistantId || '',
                    vapiPhoneNumber: data.vapiPhoneNumber || '',
                    openaiApiKey: data.openaiApiKey ? '****' : '',
                    customDomain: data.customDomain || '',
                    customRoles: data.customRoles || [],
                    features: data.features || { email: false, whatsapp: false, aiStats: false, voiceAgent: false },
                    ssoSettings: data.ssoSettings || {
                        provider: 'none',
                        enabled: false,
                        googleClientId: '',
                        googleClientSecret: '',
                        googleCallbackUrl: 'http://localhost:4000/auth/google/callback',
                        googleEnabled: false,
                        microsoftClientId: '',
                        microsoftClientSecret: '',
                        microsoftCallbackUrl: 'http://localhost:4000/auth/microsoft/callback',
                        microsoftEnabled: false
                    },
                    integrations: data.integrations || { salesforce: { connected: false }, hubspot: { connected: false } }
                });
                setInitialData(data); // Save for dirty state tracking
                if (data.logo) {
                    const logoUrl = data.logo.startsWith('http') ? data.logo : `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${data.logo}`;
                    setPreviewUrl(logoUrl);
                }
            } catch (err) {
                console.error('Failed to fetch settings:', err);
                toast.error('Failed to load settings. Please refresh the page.');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    // --- HANDLERS ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        // Real-time validation
        const errors = validateField(name, value);
        setValidationErrors(prev => ({ ...prev, ...errors, [name]: errors[name] ? errors[name] : undefined }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleRemoveLogo = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setLogo(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate before submit
        if (!validateForm()) {
            toast.error('Please fix validation errors before saving.');
            return;
        }
        
        setSaving(true);
        try {
            const data = new FormData();
            // Basic Fields
            ['name', 'pageId', 'whatsappPhoneId', 'fromEmail'].forEach(key => data.append(key, formData[key]));

            // Conditional Fields (Secrets)
            if (formData.metaAccessToken !== undefined && !formData.metaAccessToken.includes('****')) data.append('metaAccessToken', formData.metaAccessToken);
            if (formData.sendgridApiKey !== undefined && !formData.sendgridApiKey.includes('****')) data.append('sendgridApiKey', formData.sendgridApiKey);

            // AI Keys
            if (formData.vapiPrivateKey !== undefined && !formData.vapiPrivateKey.includes('****')) data.append('vapiPrivateKey', formData.vapiPrivateKey);
            if (formData.vapiPublicKey !== undefined && !formData.vapiPublicKey.includes('****')) data.append('vapiPublicKey', formData.vapiPublicKey);
            if (formData.vapiAssistantId !== undefined && !formData.vapiAssistantId.includes('****')) data.append('vapiAssistantId', formData.vapiAssistantId);
            if (formData.vapiPhoneNumber !== undefined) data.append('vapiPhoneNumber', formData.vapiPhoneNumber);
            if (formData.openaiApiKey !== undefined && !formData.openaiApiKey.includes('****')) data.append('openaiApiKey', formData.openaiApiKey);

            // Features
            data.append('features', JSON.stringify(formData.features));

            // File Handling
            if (selectedFile) {
                data.append('logo', selectedFile);
            } else if (!logo && !previewUrl) {
                data.append('deleteLogo', 'true');
            }

            const response = await updateSettings(data);
            toast.success('Settings updated successfully!');
            setInitialData(formData); // Update to reflect saved state

            if (response.org && response.org.logo) {
                setLogo(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${response.org.logo}`);
                setPreviewUrl(null);
                setSelectedFile(null);
            } else if (!logo) {
                setLogo(null);
            }
        } catch (err) {
            console.error('Error updating settings', err);
            toast.error(err.response?.data?.message || 'Failed to update settings. Please try again.');
        }
    };

    const handleVerifyDomain = async (e) => {
        e.preventDefault();
        
        if (!formData.customDomain) {
            toast.error("Please enter a domain first");
            return;
        }
        
        // Validate domain format
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
        if (!domainRegex.test(formData.customDomain)) {
            toast.error('Invalid domain format. Example: portal.yourcompany.com');
            return;
        }
        
        setVerifying(true);
        try {
            // Call actual verification endpoint
            const data = new FormData();
            data.append('customDomain', formData.customDomain);
            await updateSettings(data);
            
            toast.success(`✅ Domain ${formData.customDomain} verified! SSL provisioning started.`);
            setInitialData({...initialData, customDomain: formData.customDomain});
        } catch (err) {
            toast.error(err.response?.data?.message || 'Domain verification failed. Please check DNS records.');
        } finally {
            setVerifying(false);
        }
    };

    const handleConnectSSO = async (provider) => {
        // 0. Validation: Ensure keys are present before redirecting
        const sso = formData.ssoSettings || {};
        if (provider === 'google' && (!sso.googleClientId || !sso.googleClientSecret)) {
            toast.error('Please enter and save your Google Client ID and Secret first.');
            return;
        }
        if (provider === 'microsoft' && (!sso.microsoftClientId || !sso.microsoftClientSecret)) {
            toast.error('Please enter and save your Microsoft Client ID and Secret first.');
            return;
        }

        // 1. Save the provider selection state first
        setLoading(true);
        const newSettings = { ...formData.ssoSettings, provider: provider, enabled: true };
        const data = new FormData();
        data.append('ssoSettings', JSON.stringify(newSettings));
        
        try {
            await updateSettings(data);
            
            // 2. REAL Redirect to Backend OAuth Route
            toast.info(`Redirecting to ${provider} for authentication...`);
            
            // Use window.location to trigger the full page redirect to the server auth route
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            window.location.href = `${apiUrl}/auth/${provider}`; 
            
        } catch (e) {
            console.error(e);
            toast.error('Failed to initiate SSO connection');
        } finally {
            setLoading(false);
        } 
    };

    const handleConnectCRM = async (crm) => {
        const currentStatus = formData.integrations?.[crm]?.connected || false;
        
        // If already connected, simpler toggle to disconnect (maybe add confirm dialog later)
        if (currentStatus) {
             if(!window.confirm(`Are you sure you want to disconnect ${crm}?`)) return;
             
             setLoading(true);
             const newIntegrations = {
                ...formData.integrations,
                [crm]: { ...formData.integrations?.[crm], connected: false }
             };
             await submitIntegrations(newIntegrations, crm, false);
             return;
        }

        // If connecting, Open Modal
        setIntegrationCreds({}); // Reset creds
        setIntegrationModal(crm);
    };

    const submitIntegrations = async (newIntegrations, crm, isConnecting) => {
         const data = new FormData();
         data.append('integrations', JSON.stringify(newIntegrations));
         try {
             await updateSettings(data);
             setFormData(prev => ({ ...prev, integrations: newIntegrations }));
             if (isConnecting) setMessage(`Connected to ${crm} successfully. Syncing leads...`);
             else setMessage(`Disconnected ${crm}.`);
         } catch (e) {
             console.error('Integration Error', e);
             setError(`Error: ${e.response?.data?.message || 'Integration failed'} `);
         } finally {
             setLoading(false);
             setIntegrationModal(null);
         }
    };

    const handleSaveIntegration = async (e) => {
        e.preventDefault();
        setLoading(true);
        const crm = integrationModal;
        
        const newIntegrations = {
            ...formData.integrations,
            [crm]: { 
                ...formData.integrations?.[crm], 
                connected: true,
                ...integrationCreds // Merge entered credentials (accessToken, instanceUrl etc)
            }
        };

        await submitIntegrations(newIntegrations, crm, true);
    };

    // --- UI COMPONENTS ---

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`
                group flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 whitespace-nowrap
                ${activeTab === id
                    ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }
            `}
        >
            <Icon className={`w-4 h-4 flex-shrink-0 ${activeTab === id ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
            <span className="hidden sm:inline">{label}</span>
        </button>
    );

    const SectionHeader = ({ title, description, icon: Icon }) => (
        <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <Icon className="w-5 h-5" />
                </div>
                {title}
            </h3>
            {description && <p className="mt-1 text-sm text-gray-500 ml-11">{description}</p>}
        </div>
    );

    const InputField = ({ label, name, type = "text", placeholder, value, onChange, disabled, icon: Icon }) => {
        const error = validationErrors[name];
        return (
            <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">{label}</label>
                <div className="relative">
                    {Icon && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Icon className="h-4 w-4 text-gray-400" />
                        </div>
                    )}
                    <input
                        type={type}
                        name={name}
                        value={value || ''}
                        onChange={onChange}
                        disabled={disabled}
                        className={`
                            block w-full text-sm rounded-lg transition-all duration-200
                            ${error 
                                ? 'border-2 border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50' 
                                : 'border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                            }
                            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
                            ${Icon ? 'pl-10 pr-4' : 'px-4'} py-2.5
                        `}
                        placeholder={placeholder}
                    />
                    {error && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                        </div>
                    )}
                </div>
                {error && (
                    <p className="mt-1.5 text-xs text-red-600 font-medium animate-fade-in">{error}</p>
                )}
            </div>
        );
    };

    if (loading && !formData.name) return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Loading Organization Settings...</p>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-50/50 overflow-hidden font-sans">
            <div className="flex-1 flex flex-col overflow-hidden max-w-7xl mx-auto w-full">

                {/* Header */}
                <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 z-10 sticky top-0">
                    <div className="py-3 px-4 sm:py-4 sm:px-6 md:px-8 flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-4">
                            <RouterLink to="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900">
                                <ArrowLeft className="w-5 h-5" />
                            </RouterLink>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Organization Settings</h1>
                                <p className="text-xs sm:text-sm text-gray-500">Manage your workspace, integrations, and billing</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-8 px-3 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1.5 border border-green-200">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                Enterprise Plan Active
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="px-4 sm:px-6 md:px-8 flex overflow-x-auto hide-scrollbar border-b border-gray-200 bg-gray-50/50">
                        <TabButton id="general" label="General" icon={LayoutDashboard} />
                        <TabButton id="enteprise" label="Enterprise Features" icon={Globe} />
                        <TabButton id="sso" label="SSO Configuration" icon={Lock} />
                        <TabButton id="team" label="Team & Roles" icon={Users} />
                        <TabButton id="audit" label="Audit Logs" icon={Shield} />
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8 relative">
                    {/* Background decoration */}
                    <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">
                        <div className="absolute top-20 right-20 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                        <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-30"></div>
                    </div>

                    <div className="max-w-4xl mx-auto space-y-6 pb-20">

                        {/* Unsaved Changes Indicator */}
                        {isDirty && (
                            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-3 shadow-sm animate-fade-in">
                                <AlertCircle className="w-5 h-5 text-amber-600" />
                                <span className="font-medium">You have unsaved changes</span>
                            </div>
                        )}

                        {/* --- TAB CONTENT --- */}

                        {activeTab === 'general' && (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Branding Card */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 md:p-8 transition-all hover:shadow-md">
                                    <SectionHeader title="Company Branding" description="Customize how your organization appears in emails and invoices." icon={Building} />

                                    <div className="flex flex-col md:flex-row gap-8 items-start">
                                        {/* Logo Uploader */}
                                        <div className="flex-shrink-0 text-center">
                                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                                <div className="w-32 h-32 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-400 group-hover:bg-indigo-50">
                                                    {(previewUrl || logo) ? (
                                                        <img src={previewUrl || logo} alt="Logo" className="w-full h-full object-contain p-2" />
                                                    ) : (
                                                        <div className="text-gray-400 group-hover:text-indigo-500 transition-colors">
                                                            <Upload className="w-8 h-8 mx-auto mb-1" />
                                                            <span className="text-xs font-semibold">Upload Logo</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {(previewUrl || logo) && (
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveLogo(); }} className="absolute -top-2 -right-2 p-1.5 bg-white text-red-500 rounded-full shadow border border-gray-200 hover:bg-red-50">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                <input ref={fileInputRef} type="file" onChange={handleFileChange} accept="image/*" className="hidden" />
                                            </div>
                                            <p className="mt-2 text-xs text-gray-400">Max 2MB. PNG/JPG</p>
                                        </div>

                                        {/* Basic Info Fields */}
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                            <InputField label="Company Name" name="name" value={formData.name} onChange={handleChange} placeholder="Acme Corp" />
                                            <InputField label="Contact Email" name="email" value={formData.email} disabled={true} icon={Key} />
                                            <div className="md:col-span-2">
                                                <div className="border-t border-gray-100 my-2"></div>
                                            </div>
                                            <InputField label="Facebook Page ID" name="pageId" value={formData.pageId} onChange={handleChange} placeholder="1234567890" icon={Globe} />
                                            <InputField label="WhatsApp Phone ID" name="whatsappPhoneId" value={formData.whatsappPhoneId} onChange={handleChange} placeholder="Enter Phone ID" icon={Zap} />
                                        </div>
                                    </div>
                                </div>

                                {/* AI Configuration Card (Premium Look) */}
                                <div className="bg-slate-900 rounded-xl shadow-xl overflow-hidden border border-slate-800 text-white relative">
                                    <div className="absolute top-0 right-0 p-32 bg-indigo-600 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>

                                    <div className="p-4 sm:p-6 md:p-8 relative z-10">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
                                            <div>
                                                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                                                    <span className="text-2xl">🤖</span> Neural AI Configuration
                                                </h3>
                                                <p className="text-slate-400 text-xs sm:text-sm mt-1">Configure the autonomous agents that power your sales operations.</p>
                                            </div>
                                            <div className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-bold border border-indigo-500/30 whitespace-nowrap">
                                                POWERED BY OPENAI & VAPI
                                            </div>
                                        </div>

                                        {/* Vapi Section */}
                                        <div className="bg-slate-800/50 rounded-lg p-4 sm:p-6 border border-slate-700/50 mb-4 sm:mb-6">
                                            <h4 className="text-md font-bold text-indigo-400 mb-4 flex items-center gap-2">
                                                <Users className="w-4 h-4" /> Voice Agent (Vapi.ai)
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div>
                                                    <label className="text-xs text-slate-500 uppercase font-semibold">Private Key</label>
                                                    <div className="relative">
                                                        <input
                                                            type={showVapiKeys ? "text" : "password"}
                                                            name="vapiPrivateKey"
                                                            value={formData.vapiPrivateKey}
                                                            onChange={handleChange}
                                                            className="w-full bg-slate-900 border-slate-700 rounded-md text-sm text-white mt-1 p-2.5 focus:ring-indigo-500 focus:border-indigo-500 pr-10"
                                                            placeholder="Add Key"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowVapiKeys(!showVapiKeys)}
                                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                                                        >
                                                            {showVapiKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-500 uppercase font-semibold">Assistant ID</label>
                                                    <input type="text" name="vapiAssistantId" value={formData.vapiAssistantId} onChange={handleChange} className="w-full bg-slate-900 border-slate-700 rounded-md text-sm text-white mt-1 p-2.5 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Add ID" />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="text-xs text-slate-500 uppercase font-semibold">Twilio Phone Number (Caller ID)</label>
                                                    <input type="text" name="vapiPhoneNumber" value={formData.vapiPhoneNumber} onChange={handleChange} className="w-full bg-slate-900 border-slate-700 rounded-md text-sm text-white mt-1 p-2.5 focus:ring-indigo-500 focus:border-indigo-500" placeholder="+1..." />
                                                </div>
                                            </div>
                                        </div>

                                        {/* OpenAI Section */}
                                        <div className="bg-slate-800/50 rounded-lg p-4 sm:p-6 border border-slate-700/50">
                                            <h4 className="text-md font-bold text-emerald-400 mb-4 flex items-center gap-2">
                                                <Zap className="w-4 h-4" /> Intelligence Core (OpenAI)
                                            </h4>
                                            <div>
                                                <label className="text-xs text-slate-500 uppercase font-semibold">OpenAI API Key</label>
                                                <div className="relative">
                                                    <input
                                                        type={showOpenAIKey ? "text" : "password"}
                                                        name="openaiApiKey"
                                                        value={formData.openaiApiKey}
                                                        onChange={handleChange}
                                                        className="w-full bg-slate-900 border-slate-700 rounded-md text-sm text-white mt-1 p-2.5 focus:ring-emerald-500 focus:border-emerald-500 pr-10"
                                                        placeholder="sk-..."
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                                                    >
                                                        {showOpenAIKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-2">Required for 'SpyBot' competitor analysis and 'DISC' profiling.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Action Bar for General Tab */}
                                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20 bg-white/90 backdrop-blur border border-gray-200 shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 animate-fade-in-up">
                                    <span className="text-xs text-gray-500 font-medium hidden sm:block">Unsaved changes?</span>
                                    <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2">
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Save All Changes
                                    </button>
                                </div>
                            </form>
                        )}

                        {activeTab === 'custom_fields' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 animate-fade-in-up">
                                <CustomFieldsSettings />
                            </div>
                        )}

                        {activeTab === 'pipeline' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 animate-fade-in-up">
                                <DealPipelineSettings />
                            </div>
                        )}

                        {activeTab === 'enteprise' && (
                            <div className="space-y-6 animate-fade-in-up">
                                {/* Branding Section */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                                <SectionHeader title="White-Label Branding" description="Remove MetaLead branding and host on your own domain." icon={Globe} />

                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-100 p-6 rounded-xl">
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="flex-1">
                                            <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                                                <Globe className="w-4 h-4 text-indigo-600" />
                                                Custom Domain (CNAME)
                                            </label>
                                            <div className="flex rounded-lg shadow-sm">
                                                <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-gray-300 bg-gray-100 text-gray-600 text-sm font-mono font-medium">
                                                    https://
                                                </span>
                                                <input 
                                                    type="text" 
                                                    name="customDomain" 
                                                    value={formData.customDomain} 
                                                    onChange={handleChange}
                                                    className={`flex-1 block w-full rounded-none rounded-r-lg text-sm transition-all
                                                        ${validationErrors.customDomain
                                                            ? 'border-2 border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50'
                                                            : 'border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                                                        } py-2.5 px-4`}
                                                    placeholder="portal.yourcompany.com" 
                                                />
                                            </div>
                                            {validationErrors.customDomain && (
                                                <p className="mt-2 text-xs text-red-600 font-medium flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    {validationErrors.customDomain}
                                                </p>
                                            )}
                                            <div className="mt-3 flex items-start gap-2">
                                                <Info className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                                                <div className="text-xs text-gray-600">
                                                    <p>Add a CNAME record pointing to <code className="px-1.5 py-0.5 bg-white rounded border border-gray-300 font-mono text-indigo-600 font-semibold">app.metalead.com</code></p>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setShowDNSInstructions(!showDNSInstructions)}
                                                        className="text-indigo-600 hover:text-indigo-700 font-medium mt-1 underline"
                                                    >
                                                        {showDNSInstructions ? 'Hide' : 'View'} DNS Setup Instructions
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                type="button"
                                                onClick={handleVerifyDomain} 
                                                disabled={verifying || !formData.customDomain}
                                                className="bg-indigo-600 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center whitespace-nowrap"
                                            >
                                                {verifying ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Verifying...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-4 h-4" />
                                                        Verify Domain
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* DNS Instructions Expandable */}
                                    {showDNSInstructions && (
                                        <div className="mt-4 p-4 bg-white rounded-lg border-2 border-indigo-200 animate-fade-in">
                                            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                <Server className="w-4 h-4 text-indigo-600" />
                                                DNS Configuration Steps
                                            </h4>
                                            <ol className="space-y-2 text-sm text-gray-700">
                                                <li className="flex gap-2">
                                                    <span className="font-bold text-indigo-600 flex-shrink-0">1.</span>
                                                    <span>Log in to your domain registrar (GoDaddy, Namecheap, etc.)</span>
                                                </li>
                                                <li className="flex gap-2">
                                                    <span className="font-bold text-indigo-600 flex-shrink-0">2.</span>
                                                    <span>Navigate to DNS Management / DNS Records</span>
                                                </li>
                                                <li className="flex gap-2">
                                                    <span className="font-bold text-indigo-600 flex-shrink-0">3.</span>
                                                    <div className="flex-1">
                                                        <p>Add a new <strong>CNAME</strong> record:</p>
                                                        <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200 font-mono text-xs">
                                                            <div><strong>Type:</strong> CNAME</div>
                                                            <div><strong>Host:</strong> {formData.customDomain ? formData.customDomain.split('.')[0] : 'portal'}</div>
                                                            <div><strong>Points to:</strong> app.metalead.com</div>
                                                            <div><strong>TTL:</strong> 3600 (or default)</div>
                                                        </div>
                                                    </div>
                                                </li>
                                                <li className="flex gap-2">
                                                    <span className="font-bold text-indigo-600 flex-shrink-0">4.</span>
                                                    <span>Save the record and wait 5-30 minutes for propagation</span>
                                                </li>
                                                <li className="flex gap-2">
                                                    <span className="font-bold text-indigo-600 flex-shrink-0">5.</span>
                                                    <span>Click "Verify Domain" button above to complete setup</span>
                                                </li>
                                            </ol>
                                        </div>
                                    )}
                                </div>
                            </div>

                                {/* SSO Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
                                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <Lock className="w-4 h-4 text-gray-400" /> Single Sign-On (SSO)
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-3 border rounded-lg hover:border-indigo-300 cursor-pointer transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-xl">G</div>
                                                    <div>
                                                        <div className="font-bold text-sm text-gray-900 group-hover:text-indigo-600">Google Workspace</div>
                                                        <div className="text-xs text-gray-500">OIDC / SAML</div>
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => handleConnectSSO('google')} className={`text-xs font-bold px-3 py-1.5 rounded-full ${formData.ssoSettings?.provider === 'google' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {formData.ssoSettings?.provider === 'google' ? 'Connected' : 'Connect'}
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between p-3 border rounded-lg hover:border-indigo-300 cursor-pointer transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-xl">M</div>
                                                    <div>
                                                        <div className="font-bold text-sm text-gray-900 group-hover:text-indigo-600">Microsoft Azure AD</div>
                                                        <div className="text-xs text-gray-500">Entra ID</div>
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => handleConnectSSO('microsoft')} className={`text-xs font-bold px-3 py-1.5 rounded-full ${formData.ssoSettings?.provider === 'microsoft' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {formData.ssoSettings?.provider === 'microsoft' ? 'Connected' : 'Connect'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CRM Integrations */}
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all">
                                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <Server className="w-4 h-4 text-gray-400" /> CRM Sync
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="p-4 border border-blue-100 bg-blue-50/30 rounded-lg">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="font-bold text-sm text-blue-900">Salesforce</div>
                                                    <div className={`w-2 h-2 rounded-full ${formData.integrations?.salesforce?.connected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                                </div>
                                                <p className="text-xs text-blue-700/70 mb-3">Bidirectional sync for Leads, Contacts, and Opportunities.</p>
                                                <button type="button" onClick={() => handleConnectCRM('salesforce')} className="w-full py-1.5 bg-white border border-blue-200 text-blue-700 text-xs font-bold rounded shadow-sm hover:bg-blue-50">
                                                    {formData.integrations?.salesforce?.connected ? 'Disconnect Salesforce' : 'Connect Salesforce'}
                                                </button>
                                            </div>
                                            <div className="p-4 border border-orange-100 bg-orange-50/30 rounded-lg">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="font-bold text-sm text-orange-900">HubSpot</div>
                                                    <div className={`w-2 h-2 rounded-full ${formData.integrations?.hubspot?.connected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                                </div>
                                                <p className="text-xs text-orange-700/70 mb-3">Sync contacts and track email engagement events.</p>
                                                <button type="button" onClick={() => handleConnectCRM('hubspot')} className="w-full py-1.5 bg-white border border-orange-200 text-orange-700 text-xs font-bold rounded shadow-sm hover:bg-orange-50">
                                                    {formData.integrations?.hubspot?.connected ? 'Disconnect HubSpot' : 'Connect HubSpot'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'custom_fields' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 animate-fade-in-up">
                                <CustomFieldsSettings />
                            </div>
                        )}

                        {activeTab === 'team' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                                <SectionHeader title="Team Management" description="Manage roles and permissions for your team members." icon={Users} />
                                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                    <div className="mx-auto h-12 w-12 text-gray-400 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                        <Users className="h-6 w-6" />
                                    </div>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No team members</h3>
                                    <p className="mt-1 text-sm text-gray-500">Get started by inviting a new team member.</p>
                                    <div className="mt-6">
                                        <button type="button" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                            <Users className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                                            Invite Member
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'sso' && (
                            <div className="space-y-4 sm:space-y-6">
                                {/* Google OAuth Configuration */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 md:p-8 transition-all hover:shadow-md">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                                        <SectionHeader
                                            title="Google OAuth Configuration"
                                            description="Enable Google Sign-In for your users. Get credentials from Google Cloud Console."
                                            icon={Globe}
                                        />
                                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={formData.ssoSettings?.googleEnabled || false}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    ssoSettings: {
                                                        ...formData.ssoSettings,
                                                        googleEnabled: e.target.checked
                                                    }
                                                })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            <span className="ml-3 text-sm font-medium text-gray-700">
                                                {formData.ssoSettings?.googleEnabled ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                                Google Client ID
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.ssoSettings?.googleClientId || ''}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    ssoSettings: {
                                                        ...formData.ssoSettings,
                                                        googleClientId: e.target.value
                                                    }
                                                })}
                                                placeholder="123456789-abcdefg.apps.googleusercontent.com"
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                                Google Client Secret
                                            </label>
                                            <input
                                                type="password"
                                                value={formData.ssoSettings?.googleClientSecret || ''}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    ssoSettings: {
                                                        ...formData.ssoSettings,
                                                        googleClientSecret: e.target.value
                                                    }
                                                })}
                                                placeholder="GOCSPX-xxxxxxxxxxxxxxxxxxxxx"
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                                Callback URL
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.ssoSettings?.googleCallbackUrl || 'http://localhost:4000/auth/google/callback'}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    ssoSettings: {
                                                        ...formData.ssoSettings,
                                                        googleCallbackUrl: e.target.value
                                                    }
                                                })}
                                                placeholder="http://localhost:4000/auth/google/callback"
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">Add this URL to your Google OAuth app's authorized redirect URIs</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Microsoft OAuth Configuration */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 md:p-8 transition-all hover:shadow-md">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                                        <SectionHeader
                                            title="Microsoft OAuth Configuration"
                                            description="Enable Microsoft Sign-In for your users. Get credentials from Azure Portal."
                                            icon={Globe}
                                        />
                                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={formData.ssoSettings?.microsoftEnabled || false}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    ssoSettings: {
                                                        ...formData.ssoSettings,
                                                        microsoftEnabled: e.target.checked
                                                    }
                                                })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            <span className="ml-3 text-sm font-medium text-gray-700">
                                                {formData.ssoSettings?.microsoftEnabled ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                                Microsoft Client ID
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.ssoSettings?.microsoftClientId || ''}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    ssoSettings: {
                                                        ...formData.ssoSettings,
                                                        microsoftClientId: e.target.value
                                                    }
                                                })}
                                                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                                Microsoft Client Secret
                                            </label>
                                            <input
                                                type="password"
                                                value={formData.ssoSettings?.microsoftClientSecret || ''}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    ssoSettings: {
                                                        ...formData.ssoSettings,
                                                        microsoftClientSecret: e.target.value
                                                    }
                                                })}
                                                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                                Callback URL
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.ssoSettings?.microsoftCallbackUrl || 'http://localhost:4000/auth/microsoft/callback'}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    ssoSettings: {
                                                        ...formData.ssoSettings,
                                                        microsoftCallbackUrl: e.target.value
                                                    }
                                                })}
                                                placeholder="http://localhost:4000/auth/microsoft/callback"
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">Add this URL to your Microsoft app's redirect URIs</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Info Box */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex">
                                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-blue-800">How to get OAuth credentials</h3>
                                            <div className="mt-2 text-sm text-blue-700">
                                                <p className="mb-2"><strong>Google:</strong> Visit <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a> → Create OAuth 2.0 Client ID</p>
                                                <p><strong>Microsoft:</strong> Visit <a href="https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps" target="_blank" rel="noopener noreferrer" className="underline">Azure Portal</a> → App Registrations → New Registration</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Save Button */}
                                <div className="flex flex-col sm:flex-row justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => window.location.reload()}
                                        className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span className="hidden sm:inline">Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-5 h-5" />
                                                Save OAuth Configuration
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'audit' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-100">
                                    <SectionHeader title="Security Audit Logs" description="Immutable record of all system activities." icon={Shield} />
                                </div>
                                <AuditLogsTable />
                            </div>
                        )}

                    </div>
                </main>
                {/* Integration Credentials Modal - Premium Enterprise UI */}
                {integrationModal && (
                    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                        {/* Backdrop with Blur */}
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div 
                                className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity" 
                                aria-hidden="true"
                                onClick={() => setIntegrationModal(null)}
                            ></div>

                            {/* Centering trick */}
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                            {/* Modal Panel */}
                            <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full animate-in fade-in zoom-in duration-300">
                                
                                {/* Header */}
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-100">
                                    <div className="sm:flex sm:items-start">
                                        <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${integrationModal === 'salesforce' ? 'bg-blue-100' : 'bg-orange-100'} sm:mx-0 sm:h-10 sm:w-10`}>
                                            <Server className={`h-6 w-6 ${integrationModal === 'salesforce' ? 'text-blue-600' : 'text-orange-600'}`} aria-hidden="true" />
                                        </div>
                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                                            <h3 className="text-xl leading-6 font-semibold text-gray-900 capitalize" id="modal-title">
                                                Connect {integrationModal === 'salesforce' ? 'Salesforce CRM' : 'HubSpot CRM'}
                                            </h3>
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-500">
                                                    Enter your API credentials to enable secure, bidirectional synchronization for your leads and contacts.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="absolute top-0 right-0 pt-4 pr-4">
                                            <button
                                                type="button"
                                                className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                onClick={() => setIntegrationModal(null)}
                                            >
                                                <span className="sr-only">Close</span>
                                                <X className="h-6 w-6" aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Body */}
                                <form onSubmit={handleSaveIntegration}>
                                    <div className="px-4 py-5 sm:p-6 space-y-5">
                                        
                                        {/* API Key Input */}
                                        <div>
                                            <label htmlFor="accessToken" className="block text-sm font-medium text-gray-700">
                                                Access Token / API Key <span className="text-red-500">*</span>
                                            </label>
                                            <div className="mt-2 relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Key className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                </div>
                                                <input
                                                    type="password"
                                                    name="accessToken"
                                                    id="accessToken"
                                                    required
                                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 h-10 sm:text-sm border-gray-300 rounded-lg placeholder-gray-300"
                                                    placeholder={integrationModal === 'salesforce' ? "Paste Consumer Key / Token" : "Paste HubSpot Access Token"}
                                                    value={integrationCreds.accessToken || ''}
                                                    onChange={e => setIntegrationCreds({...integrationCreds, accessToken: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        {/* Instance URL Input (Conditional) */}
                                        {integrationModal === 'salesforce' && (
                                            <div>
                                                <label htmlFor="instanceUrl" className="block text-sm font-medium text-gray-700">
                                                    Instance URL <span className="text-red-500">*</span>
                                                </label>
                                                <div className="mt-2 relative rounded-md shadow-sm">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <Globe className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                    </div>
                                                    <input
                                                        type="url"
                                                        name="instanceUrl"
                                                        id="instanceUrl"
                                                        required
                                                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 h-10 sm:text-sm border-gray-300 rounded-lg placeholder-gray-300"
                                                        placeholder="https://your-domain.my.salesforce.com"
                                                        value={integrationCreds.instanceUrl || ''}
                                                        onChange={e => setIntegrationCreds({...integrationCreds, instanceUrl: e.target.value})}
                                                    />
                                                </div>
                                                <p className="mt-2 text-xs text-gray-500">
                                                    Found in Salesforce Setup &gt; Company Settings &gt; My Domain.
                                                </p>
                                            </div>
                                        )}
                                        
                                        <div className="rounded-md bg-blue-50 p-4 mt-2">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <Lock className="h-5 w-5 text-blue-400" aria-hidden="true" />
                                                </div>
                                                <div className="ml-3 flex-1 md:flex md:justify-between">
                                                    <p className="text-sm text-blue-700">
                                                        Credentials are encrypted at rest using AES-256.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                    </div>

                                    {/* Footer */}
                                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-100">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-5 py-2.5 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                                    Verifying...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="-ml-1 mr-2 h-4 w-4" />
                                                    Connect & Sync
                                                </>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-5 py-2.5 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                                            onClick={() => setIntegrationModal(null)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Settings;
