import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight, Building, User, Eye, EyeOff } from 'lucide-react';
import { checkInvitationToken, registerFromInvite } from '../services/api';

export default function Signup() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [formData, setFormData] = useState({
        companyName: '',
        name: '',
        email: '',
        password: ''
    });
    const [inviteInfo, setInviteInfo] = useState(null);
    const [isInviteFlow, setIsInviteFlow] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            verifyToken();
        }
    }, [token]);

    const verifyToken = async () => {
        try {
            setLoading(true);
            const data = await checkInvitationToken(token);
            setInviteInfo(data);
            setFormData(prev => ({ ...prev, email: data.email }));
            setIsInviteFlow(true);
        } catch (err) {
            setError('Invalid or expired invitation link');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let res;
            if (isInviteFlow) {
                res = await registerFromInvite({
                    token,
                    name: formData.name,
                    password: formData.password
                });
            } else {
                res = await axios.post('http://localhost:4000/auth/register', formData);
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data));
            }

            navigate('/'); // Redirect to Dashboard
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-blue-800 to-blue-900 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md z-10 mx-4"
            >
                <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg transform rotate-3 hover:rotate-6 transition-all">
                        <User className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                        {isInviteFlow ? 'Join Team' : 'Create Account'}
                    </h2>
                    <p className="text-blue-200 text-sm">
                        {isInviteFlow ? `You've been invited to join ${inviteInfo?.organizationName}` : 'Join the automation revolution'}
                    </p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-red-500/20 border border-red-500/50 text-red-100 p-3 rounded-lg mb-6 text-sm flex items-center gap-2"
                    >
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isInviteFlow && (
                        <div className="relative group">
                            <Building className="absolute left-3 top-3.5 h-5 w-5 text-blue-300 group-focus-within:text-white transition-colors" />
                            <input
                                type="text"
                                name="companyName"
                                placeholder="Company Name"
                                value={formData.companyName}
                                onChange={handleChange}
                                className="w-full bg-slate-900/50 border border-slate-700 text-white placeholder-slate-400 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                required={!isInviteFlow}
                            />
                        </div>
                    )}

                    <div className="relative group">
                        <User className="absolute left-3 top-3.5 h-5 w-5 text-blue-300 group-focus-within:text-white transition-colors" />
                        <input
                            type="text"
                            name="name"
                            placeholder="Your Full Name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full bg-slate-900/50 border border-slate-700 text-white placeholder-slate-400 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            required
                        />
                    </div>

                    <div className="relative group">
                        <Mail className="absolute left-3 top-3.5 h-5 w-5 text-blue-300 group-focus-within:text-white transition-colors" />
                        <input
                            type="email"
                            name="email"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={handleChange}
                            className={`w-full bg-slate-900/50 border border-slate-700 text-white placeholder-slate-400 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${isInviteFlow ? 'opacity-50 cursor-not-allowed' : ''}`}
                            required
                            disabled={isInviteFlow}
                        />
                    </div>

                    <div className="relative group">
                        <Lock className="absolute left-3 top-3.5 h-5 w-5 text-blue-300 group-focus-within:text-white transition-colors" />
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full bg-slate-900/50 border border-slate-700 text-white placeholder-slate-400 pl-10 pr-12 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3.5 text-slate-400 hover:text-white transition-colors"
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>

                    <div className="pt-2">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (isInviteFlow ? 'Joining...' : 'Creating Account...') : (isInviteFlow ? 'Join Team' : 'Get Started')}
                            {!loading && <ArrowRight className="w-5 h-5" />}
                        </motion.button>
                    </div>
                </form>

                <div className="mt-8 text-center text-sm">
                    <p className="text-slate-400">
                        {isInviteFlow ? 'Already have an account? ' : 'Already have an account? '}
                        <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                            Sign In
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
