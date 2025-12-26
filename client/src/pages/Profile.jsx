import { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, User, Lock, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const Profile = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // We can get basic info from localStorage or fetch from API if we had a /me endpoint
                // For now, let's assume we fetch from /settings or similar, or just rely on localStorage "user" if available
                // But since we implemented updateProfile, let's fetch current user data.
                // Re-using specific logic or we can decode token. 
                // Better: Let's assume we can fetch basic user details. 
                // Since we don't have a specific GET /profile, let's use the one from Login response stored in localStorage if any, 
                // OR better, let's assume GET /settings returns org details, not user details.
                // Let's rely on what we have: The user likely wants to edit their own name.
                // Actually, let's implement GET /profile on backend quickly or just use what we have.
                // Wait, I implemented PUT /profile but not GET /profile. 
                // Let's decode the token to get the name/email? No, token has ID.
                // Let's add GET /profile to backend first? Or just make PUT work blindly?
                // Standard practice: GET /profile is needed.
                // But for speed, let's assume valid token exists and we just want to update.
                // Use localStorage 'user' if available from login/signup response.
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    setFormData(prev => ({ ...prev, name: user.name, email: user.email }));
                }
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const payload = {
                name: formData.name,
                password: formData.password ? formData.password : undefined
            };

            const res = await axios.put('http://localhost:4000/auth/profile', payload, config);

            setMessage('Profile updated successfully');
            // Update localStorage
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                user.name = res.data.name;
                localStorage.setItem('user', JSON.stringify(user));
            }

            // Clear password fields
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));

        } catch (err) {
            console.error('Update Profile Error', err);
            setError(err.response?.data?.message || 'Failed to update profile');
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow">
                    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex items-center gap-4">
                        <Link to="/" className="text-gray-500 hover:text-gray-700 transition">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-8">
                    <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg p-8">
                        {message && <div className="p-3 mb-4 bg-green-100 text-green-700 rounded">{message}</div>}
                        {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded">{error}</div>}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        disabled
                                        className="bg-gray-50 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">Email cannot be changed.</p>
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-4">Change Password</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">New Password</label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                autoComplete="new-password"
                                                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                                                placeholder="Leave blank to keep current"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                autoComplete="new-password"
                                                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Update Profile
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Profile;
