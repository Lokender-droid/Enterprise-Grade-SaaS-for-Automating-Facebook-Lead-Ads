import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Loader2, Upload, Trash2, Building, Save, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSettings, updateSettings, verifyConnection, autoConfigureWebhooks } from '../services/api';
import AuditLogsTable from '../components/AuditLogsTable';

const Settings = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        pageId: '',
        whatsappPhoneId: '',
        metaAccessToken: '',
        sendgridApiKey: '',
        fromEmail: ''
    });
    const [logo, setLogo] = useState(null); // URL string for display
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // File upload state
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [activeTab, setActiveTab] = useState('general'); // 'general' | 'audit'

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await getSettings();
                setFormData(data);
                // If logo exists (from DB), set it
                if (data.logo) {
                    // Assuming server serves uploads at /uploads
                    const logoUrl = data.logo.startsWith('http') ? data.logo : `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${data.logo}`;
                    setLogo(logoUrl);
                }
            } catch (err) {
                console.error('Error fetching settings', err);
                setError('Failed to load settings. Please refresh the page.');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            // Create local preview
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    const handleRemoveLogo = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setLogo(null);
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            // Use FormData to send file + fields
            const data = new FormData();
            data.append('name', formData.name);
            data.append('pageId', formData.pageId);
            data.append('whatsappPhoneId', formData.whatsappPhoneId);
            data.append('fromEmail', formData.fromEmail);

            // Access Token & API Key (send only if changed/present)
            if (formData.metaAccessToken && !formData.metaAccessToken.includes('****')) {
                data.append('metaAccessToken', formData.metaAccessToken);
            }
            if (formData.sendgridApiKey && !formData.sendgridApiKey.includes('****')) {
                data.append('sendgridApiKey', formData.sendgridApiKey);
            }

            // File Handling
            if (selectedFile) {
                data.append('logo', selectedFile);
            } else if (!logo && !previewUrl) {
                // If no logo displayed, user must have deleted it
                data.append('deleteLogo', 'true');
            }

            const response = await updateSettings(data);

            setMessage('Settings updated successfully!');
            // Update local state with new logo if returned
            if (response.org && response.org.logo) {
                const logoUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${response.org.logo}`;
                setLogo(logoUrl);
                setPreviewUrl(null);
                setSelectedFile(null);
            } else if (!logo) {
                // Confirmed deleted
                setLogo(null);
            }

        } catch (err) {
            console.error('Error updating settings', err);
            setError('Failed to update settings');
        }
    };

    const handleTestConnection = async () => {
        setLoading(true);
        setMessage('');
        setError('');
        try {
            const data = await verifyConnection();
            setMessage(`Success: Connected to Facebook as ${data.data.name} (ID: ${data.data.id})`);
        } catch (err) {
            console.error('Test Connection Error', err);
            setError(err.response?.data?.message || 'Connection Verification Failed');
        } finally {
            setLoading(false);
        }
    };

    const handleAutoConfigure = async () => {
        setLoading(true);
        setMessage('');
        setError('');
        try {
            const data = await autoConfigureWebhooks();
            setMessage(`Success: ${data.message}`);
        } catch (err) {
            console.error('Auto Configure Error', err);
            setError(err.response?.data?.message || 'Auto Configuration Failed');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow">
                    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex items-center gap-4">
                        <Link to="/" className="text-gray-500 hover:text-gray-700 transition">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">Organization Settings</h1>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-8">
                    <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
                        {message && <div className="p-4 mb-6 rounded bg-green-100 text-green-700">{message}</div>}
                        {error && <div className="p-4 mb-6 rounded bg-red-100 text-red-700">{error}</div>}

                        {/* Tabs Navigation */}
                        <div className="flex border-b border-gray-200 mb-6">
                            <button
                                onClick={() => setActiveTab('general')}
                                className={`pb-4 px-4 text-sm font-medium transition ${activeTab === 'general' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                General Settings
                            </button>
                            <button
                                onClick={() => setActiveTab('audit')}
                                className={`pb-4 px-4 text-sm font-medium transition flex items-center gap-2 ${activeTab === 'audit' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Shield className="w-4 h-4" />
                                Audit Logs
                            </button>
                        </div>

                        {activeTab === 'general' ? (
                            <form onSubmit={handleSubmit} className="space-y-8">

                                {/* Company Branding Section */}
                                <div>
                                    <h3 className="text-lg font-medium leading-6 text-gray-900 border-b pb-2 mb-4 flex items-center gap-2">
                                        <Building className="w-5 h-5 text-gray-500" />
                                        Company Branding
                                    </h3>
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

                                        {/* Logo Upload */}
                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700">Company Logo</label>
                                            <div className="mt-2 flex items-center space-x-6">
                                                <div className="shrink-0">
                                                    {(previewUrl || logo) ? (
                                                        <img
                                                            className="h-24 w-24 object-contain rounded-full border border-gray-200 bg-gray-50 p-1"
                                                            src={previewUrl || logo}
                                                            alt="Company Logo"
                                                        />
                                                    ) : (
                                                        <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                                                            <Building className="h-10 w-10 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => fileInputRef.current?.click()}
                                                            className="bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 inline-flex items-center gap-2"
                                                        >
                                                            <Upload className="w-4 h-4" />
                                                            Change
                                                        </button>
                                                        {(logo || previewUrl) && (
                                                            <button
                                                                type="button"
                                                                onClick={handleRemoveLogo}
                                                                className="bg-white py-2 px-3 border border-red-200 rounded-md shadow-sm text-sm leading-4 font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 inline-flex items-center gap-2"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Remove
                                                            </button>
                                                        )}
                                                    </div>
                                                    <input
                                                        type="file"
                                                        ref={fileInputRef}
                                                        onChange={handleFileChange}
                                                        accept="image/*" // Only images
                                                        className="hidden"
                                                    />
                                                    <p className="text-xs text-gray-500">JPG, PNG or GIF. Max 2MB.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Company Name</label>
                                            <div className="mt-1 flex rounded-md shadow-sm">
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={formData.name || ''}
                                                    onChange={handleChange}
                                                    className="flex-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 rounded-md sm:text-sm border-gray-300 py-2 px-3 border"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email || ''}
                                                disabled
                                                className="mt-1 block w-full bg-gray-50 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-500 sm:text-sm cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Meta Integration */}
                                <div>
                                    <h3 className="text-lg font-medium leading-6 text-gray-900 border-b pb-2 mb-4 mt-8">Meta Integration (Facebook & WhatsApp)</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Facebook Page ID <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                name="pageId"
                                                value={formData.pageId || ''}
                                                onChange={handleChange}
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Meta Access Token</label>
                                            <input
                                                type="password"
                                                name="metaAccessToken"
                                                value={formData.metaAccessToken || ''}
                                                onChange={handleChange}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                placeholder={formData.metaAccessToken ? '****************' : 'Paste Token Here'}
                                            />
                                            <div className="flex gap-4 mt-2">
                                                <button
                                                    type="button"
                                                    onClick={handleTestConnection}
                                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                                >
                                                    Test Connection
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleAutoConfigure}
                                                    className="text-sm text-green-600 hover:text-green-800 font-medium inline-flex items-center gap-1"
                                                >
                                                    Auto-Configure Webhooks
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">WhatsApp Phone ID</label>
                                            <input
                                                type="text"
                                                name="whatsappPhoneId"
                                                value={formData.whatsappPhoneId || ''}
                                                onChange={handleChange}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Email Integration */}
                                <div>
                                    <h3 className="text-lg font-medium leading-6 text-gray-900 border-b pb-2 mb-4 mt-8">Email Integration (SendGrid)</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">SendGrid API Key</label>
                                            <input
                                                type="password"
                                                name="sendgridApiKey"
                                                value={formData.sendgridApiKey || ''}
                                                onChange={handleChange}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                placeholder={formData.sendgridApiKey ? '****************' : 'SG.xxxxxxxx'}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">From Email Address</label>
                                            <input
                                                type="email"
                                                name="fromEmail"
                                                value={formData.fromEmail || ''}
                                                onChange={handleChange}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                placeholder="info@yourcompany.com"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="pt-5 border-t border-gray-200 flex justify-end">
                                    <button
                                        type="submit"
                                        className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 items-center gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        Save Configuration
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-indigo-600" />
                                    Security & Audit Trail
                                </h3>
                                <p className="text-sm text-gray-500 mb-6">
                                    View a history of all sensitive actions performed in your organization. This log is immutable.
                                </p>
                                <AuditLogsTable />
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Settings;
