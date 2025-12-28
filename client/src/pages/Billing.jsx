import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, CreditCard, Loader2, Lock, Download, FileText } from 'lucide-react';
import { createCheckoutSession, createPortalSession, getSettings, getInvoices } from '../services/api';

const MockPaymentModal = ({ isOpen, onClose, onSuccess, planPrice }) => {
    const [processing, setProcessing] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        setProcessing(true);
        // Simulate payment processing delay
        setTimeout(() => {
            setProcessing(false);
            onSuccess();
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <ArrowLeft className="w-5 h-5 rotate-180" /> {/* Using generic close icon or reuse arrow */}
                </button>

                <h3 className="text-xl font-bold text-gray-900 mb-4">Secure Checkout</h3>
                <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
                    <div>
                        <p className="font-medium text-gray-900">Pro Growth Plan</p>
                        <p className="text-sm text-gray-500">Monthly subscription</p>
                    </div>
                    <span className="text-xl font-bold text-gray-900">${planPrice}</span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Card Information</label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="0000 0000 0000 0000"
                                className="pl-10 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 py-2 border"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                            <input
                                type="text"
                                placeholder="MM/YY"
                                className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 py-2 border px-3"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                            <input
                                type="text"
                                placeholder="123"
                                className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 py-2 border px-3"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
                        <input
                            type="text"
                            placeholder="Full Name"
                            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 py-2 border px-3"
                            required
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" /> Processing Payment...
                                </>
                            ) : (
                                `Pay $${planPrice}`
                            )}
                        </button>
                        <p className="text-center text-xs text-gray-500 mt-3 flex items-center justify-center gap-1">
                            <Lock className="w-3 h-3" /> Payments are secure (Demo Mode)
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default function Billing() {
    const [org, setOrg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [invoices, setInvoices] = useState([]);
    const [invoicesLoading, setInvoicesLoading] = useState(false);
    const [searchParams] = useSearchParams();

    useEffect(() => {
        fetchOrgDetails();
        fetchInvoices();
        if (searchParams.get('success')) {
            // alert('Subscription successful! Welcome to Pro.'); 
            // Better UX: Could show a toast instead of alert
        }
    }, [searchParams]);

    const fetchOrgDetails = async () => {
        try {
            const data = await getSettings();
            setOrg(data);
        } catch (error) {
            console.error('Failed to fetch org details', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInvoices = async () => {
        setInvoicesLoading(true);
        try {
            const data = await getInvoices();
            setInvoices(data.invoices || []);
        } catch (error) {
            console.error('Failed to fetch invoices', error);
        } finally {
            setInvoicesLoading(false);
        }
    };

    const handleUpgradeClick = () => {
        setShowPaymentModal(true);
    };

    const handlePaymentSuccess = async () => {
        setShowPaymentModal(false);
        // Call backend to simulate/record "success"
        // Actually, backend creates checkout session URL. 
        // In Demo mode, we can just redirect to success URL or reload.
        try {
            const { url } = await createCheckoutSession();
            if (url) window.location.href = url;
        } catch (error) {
            console.error('Upgrade failed', error);
            // Fallback for demo
            window.location.href = '/billing?success=true';
        }
    };

    const handleManageSubscription = async () => {
        setActionLoading(true);
        try {
            const { url } = await createPortalSession();
            if (url) window.location.href = url;
        } catch (error) {
            console.error('Portal failed', error);
            alert('Failed to open billing portal.');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const isPro = org?.plan === 'pro' || org?.plan === 'enterprise';

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden relative">
            <MockPaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onSuccess={handlePaymentSuccess}
                planPrice="49"
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow">
                    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex items-center gap-4">
                        <Link to="/" className="text-gray-500 hover:text-gray-700 transition">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">Billing & Plans</h1>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                                Simple, transparent pricing
                            </h2>
                            <p className="mt-4 text-xl text-gray-600">
                                Choose the plan that's right for your business.
                            </p>
                        </div>

                        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-2">
                            {/* Free Plan */}
                            <div className={`border rounded-lg shadow-sm divide-y divide-gray-200 bg-white ${!isPro ? 'ring-2 ring-blue-500' : 'border-gray-200'}`}>
                                <div className="p-6">
                                    <h2 className="text-lg leading-6 font-medium text-gray-900">Free Tier</h2>
                                    <p className="mt-4 text-sm text-gray-500">Perfect for getting started and testing the platform.</p>
                                    <p className="mt-8">
                                        <span className="text-4xl font-extrabold text-gray-900">$0</span>
                                        <span className="text-base font-medium text-gray-500">/mo</span>
                                    </p>
                                    <button
                                        disabled={true}
                                        className={`mt-8 block w-full border rounded-md py-2 text-sm font-semibold text-center ${!isPro ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                                    >
                                        {!isPro ? 'Current Plan' : 'Basic Plan'}
                                    </button>
                                </div>
                                <div className="pt-6 pb-8 px-6">
                                    <h3 className="text-xs font-medium text-gray-900 tracking-wide uppercase">What's included</h3>
                                    <ul className="mt-6 space-y-4">
                                        <li className="flex space-x-3">
                                            <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                                            <span className="text-sm text-gray-500">Up to 100 leads/month</span>
                                        </li>
                                        <li className="flex space-x-3">
                                            <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                                            <span className="text-sm text-gray-500">Basic Email Automation</span>
                                        </li>
                                        <li className="flex space-x-3">
                                            <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                                            <span className="text-sm text-gray-500">1 User Seat</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Pro Plan */}
                            <div className={`border rounded-lg shadow-sm divide-y divide-gray-200 bg-white relative ${isPro ? 'ring-2 ring-indigo-500' : 'border-gray-200'}`}>
                                {isPro && (
                                    <div className="absolute top-0 right-0 -mr-1 -mt-1 w-32 rounded-bl-lg rounded-tr-lg bg-green-500 text-center text-xs font-bold text-white py-1">ACTIVE</div>
                                )}
                                {!isPro && (
                                    <div className="absolute top-0 right-0 -mr-1 -mt-1 w-32 rounded-bl-lg rounded-tr-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-center text-xs font-bold text-white py-1">POPULAR</div>
                                )}
                                <div className="p-6">
                                    <h2 className="text-lg leading-6 font-medium text-gray-900">Pro Growth</h2>
                                    <p className="mt-4 text-sm text-gray-500">For scaling businesses needing advanced automation.</p>
                                    <p className="mt-8">
                                        <span className="text-4xl font-extrabold text-gray-900">$49</span>
                                        <span className="text-base font-medium text-gray-500">/mo</span>
                                    </p>
                                    {isPro ? (
                                        <button
                                            onClick={handleManageSubscription}
                                            disabled={actionLoading}
                                            className="mt-8 block w-full bg-indigo-600 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-indigo-700 flex items-center justify-center gap-2"
                                        >
                                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Manage Subscription'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleUpgradeClick}
                                            disabled={actionLoading}
                                            className="mt-8 block w-full bg-indigo-600 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-indigo-700 flex items-center justify-center gap-2"
                                        >
                                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upgrade to Pro'}
                                        </button>
                                    )}
                                </div>
                                <div className="pt-6 pb-8 px-6">
                                    <h3 className="text-xs font-medium text-gray-900 tracking-wide uppercase">What's included</h3>
                                    <ul className="mt-6 space-y-4">
                                        <li className="flex space-x-3">
                                            <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                                            <span className="text-sm text-gray-500">Unlimited leads</span>
                                        </li>
                                        <li className="flex space-x-3">
                                            <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                                            <span className="text-sm text-gray-500">WhatsApp Automation</span>
                                        </li>
                                        <li className="flex space-x-3">
                                            <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                                            <span className="text-sm text-gray-500">Up to 5 User Seats</span>
                                        </li>
                                        <li className="flex space-x-3">
                                            <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                                            <span className="text-sm text-gray-500">Priority Support</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Invoice History Section */}
                        {isPro && (
                            <div className="mt-16">
                                <h3 className="text-2xl font-bold text-gray-900 mb-6">Invoice History</h3>

                                {invoicesLoading ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                                    </div>
                                ) : invoices.length === 0 ? (
                                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-500">No invoices yet. Your first invoice will appear here.</p>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {invoices.map((invoice) => (
                                                    <tr key={invoice.id} className="hover:bg-gray-50 transition">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {invoice.number || invoice.id}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {new Date(invoice.created * 1000).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            ${(invoice.amount_paid / 100).toFixed(2)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                                                                    invoice.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                {invoice.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <a
                                                                href={invoice.invoice_pdf || invoice.hosted_invoice_url || '#'}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-indigo-600 hover:text-indigo-900 inline-flex items-center gap-1"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                                Download
                                                            </a>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
