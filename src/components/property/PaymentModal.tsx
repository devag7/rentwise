'use client'

import { useState } from 'react';
import toast from 'react-hot-toast';

interface Props {
    amount: number;
    address: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function PaymentModal({ amount, address, onClose, onSuccess }: Props) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();

        if (!cardNumber || !expiry || !cvc) {
            toast.error("Complete all secure fields.");
            return;
        }

        setIsProcessing(true);
        const processingToast = toast.loading('Initializing Stripe Secure Link...');

        setTimeout(() => {
            toast.success('Transaction Verified and Vaulted.', { id: processingToast });
            setIsProcessing(false);
            onSuccess();
            onClose();
        }, 2500);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-fade-in">
            <div className="w-full max-w-md bg-[#0A0A0A] border border-white/20 p-8 shadow-2xl relative">

                <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-widest uppercase mb-1">RentWise Escrow</h2>
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Test. Env: Supported by Stripe™️</p>
                </div>

                <div className="p-4 bg-[#111] border border-white/10 mb-8 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Target Asset</p>
                        <p className="text-sm font-bold text-white truncate max-w-[200px]">{address}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-[#00A699] uppercase tracking-widest mb-1">Deposit Amt</p>
                        <p className="text-xl font-black text-[#00A699]">₹{amount.toLocaleString('en-IN')}</p>
                    </div>
                </div>

                <form onSubmit={handlePayment} className="space-y-6">
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Neural Card Number</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="4242 4242 4242 4242"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value)}
                                className="w-full px-4 py-3 bg-[#111] border border-white/20 text-white focus:outline-none focus:border-[#FF385C] font-mono text-sm tracking-widest placeholder-gray-700"
                                maxLength={19}
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute right-3 top-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Expiry</label>
                            <input
                                type="text"
                                placeholder="MM/YY"
                                value={expiry}
                                onChange={(e) => setExpiry(e.target.value)}
                                className="w-full px-4 py-3 bg-[#111] border border-white/20 text-white focus:outline-none focus:border-[#FF385C] font-mono text-sm tracking-widest placeholder-gray-700 text-center"
                                maxLength={5}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">CVC Security</label>
                            <input
                                type="text"
                                placeholder="123"
                                value={cvc}
                                onChange={(e) => setCvc(e.target.value)}
                                className="w-full px-4 py-3 bg-[#111] border border-white/20 text-white focus:outline-none focus:border-[#FF385C] font-mono text-sm tracking-widest placeholder-gray-700 text-center"
                                maxLength={3}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full py-4 mt-6 bg-white text-black font-bold uppercase tracking-widest transition-all duration-300 hover:bg-[#FF385C] hover:text-white flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isProcessing ? (
                            <>
                                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                                Processing...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                Authorize ₹{amount.toLocaleString('en-IN')}
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
