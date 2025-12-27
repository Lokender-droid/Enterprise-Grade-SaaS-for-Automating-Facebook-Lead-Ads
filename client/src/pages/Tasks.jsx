import React from 'react';
import { Link } from 'react-router-dom';
import {
    LayoutDashboard,
    Zap,
    CreditCard,
    Settings as SettingsIcon,
    UserCircle,
    LogOut,
    CheckSquare
} from 'lucide-react';
import { logout } from '../services/api';
import TaskManager from '../components/TaskManager';

export default function Tasks() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
            {/* Dynamic Background */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-indigo-200 rounded-full blur-[100px] opacity-20 animate-pulse"></div>
                <div className="absolute bottom-[-100px] left-[-100px] w-96 h-96 bg-blue-200 rounded-full blur-[100px] opacity-20"></div>
            </div>

            {/* Sticky Navbar */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="bg-indigo-600 rounded-lg p-1.5 shadow-lg shadow-indigo-500/30 group-hover:bg-indigo-700 transition-colors">
                                <LayoutDashboard className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 tracking-tight group-hover:to-slate-900 transition-colors">
                                WKPC Meta Automation
                            </h1>
                        </Link>
                    </div>

                    <div className="flex items-center gap-2 md:gap-6 bg-slate-50 md:bg-transparent p-1 md:p-0 rounded-full md:rounded-none">
                        <div className="flex items-center gap-1">
                            <Link to="/tasks" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-slate-100 rounded-lg transition-all">
                                <CheckSquare className="w-4 h-4" /> <span className="hidden sm:inline">Tasks</span>
                            </Link>
                            <Link to="/workflows" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all">
                                <Zap className="w-4 h-4" /> <span className="hidden sm:inline">Workflows</span>
                            </Link>
                            <Link to="/billing" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all">
                                <CreditCard className="w-4 h-4" /> <span className="hidden sm:inline">Billing</span>
                            </Link>
                            <Link to="/settings" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all">
                                <SettingsIcon className="w-4 h-4" /> <span className="hidden sm:inline">Settings</span>
                            </Link>
                        </div>

                        <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

                        <div className="flex items-center gap-3 pl-2">
                            <div className="flex flex-col items-end hidden sm:flex">
                                <span className="text-sm font-bold text-slate-800">{user.name || 'Admin'}</span>
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider text-right">{user.role || 'Admin'}</span>
                            </div>
                            <div className="h-9 w-9 bg-indigo-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                <UserCircle className="w-5 h-5 text-indigo-600" />
                            </div>
                            <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors ml-1" title="Logout">
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-6 md:p-8 h-[calc(100vh-100px)]">
                <TaskManager />
            </main>
        </div>
    );
}
