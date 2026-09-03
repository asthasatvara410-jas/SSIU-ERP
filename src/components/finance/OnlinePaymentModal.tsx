import React, { useState, useMemo } from 'react';
import { FeeInvoice, PaymentOrder, PaymentTransactionRecord } from '../../types';
import { db } from '../../services/db';
import {
  X, CreditCard, ShieldCheck, CheckCircle2, AlertTriangle,
  QrCode, Smartphone, Building2, Lock, ArrowRight, RotateCcw,
  DollarSign, Check, XCircle
} from 'lucide-react';
import { Badge } from '../common/Badge';

interface OnlinePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: FeeInvoice | null;
  onPaymentSuccess?: (tx: PaymentTransactionRecord) => void;
}

export const OnlinePaymentModal: React.FC<OnlinePaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onPaymentSuccess,
}) => {
  if (!isOpen || !invoice) return null;

  // Calculate live outstanding
  const existingTxs = useMemo(() => {
    return db.getPaymentTransactionsList({ invoiceId: invoice.id, status: 'SUCCESS' });
  }, [invoice.id]);

  const alreadyPaid = existingTxs.reduce((sum, t) => sum + Number(t.amount), 0);
  const outstanding = Math.max(0, Number(invoice.totalAmount) - alreadyPaid);

  // Modal Step: 'ORDER' | 'GATEWAY' | 'RESULT'
  const [step, setStep] = useState<'ORDER' | 'GATEWAY' | 'RESULT'>('ORDER');
  const [paymentType, setPaymentType] = useState<'FULL' | 'PARTIAL'>('FULL');
  const [customAmount, setCustomAmount] = useState<number>(outstanding);
  const [selectedMethod, setSelectedMethod] = useState<'UPI' | 'CARD' | 'NETBANKING' | 'QR'>('UPI');
  const [upiId, setUpiId] = useState('student@okaxis');

  // Backend state
  const [activeOrder, setActiveOrder] = useState<PaymentOrder | null>(null);
  const [activeTx, setActiveTx] = useState<PaymentTransactionRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentOutcome, setPaymentOutcome] = useState<'SUCCESS' | 'FAILED' | 'CANCELLED'>('SUCCESS');

  const payableAmount = paymentType === 'FULL' ? outstanding : Math.min(customAmount, outstanding);

  // Step 1: Create Payment Order
  const handleProceedToGateway = () => {
    setError(null);
    if (payableAmount <= 0) {
      setError('Payable amount must be greater than ₹0.');
      return;
    }
    if (payableAmount > outstanding) {
      setError(`Amount cannot exceed the current outstanding balance of ₹${outstanding.toLocaleString('en-IN')}.`);
      return;
    }

    setIsProcessing(true);
    try {
      const res = db.createPaymentOrder({
        invoiceId: invoice.id,
        amount: payableAmount,
        gateway: 'RAZORPAY',
        studentId: invoice.studentId,
      });

      if (res.success && res.order) {
        setActiveOrder(res.order);
        setStep('GATEWAY');
      } else {
        setError(res.error || 'Failed to create payment order.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2: Simulate Gateway Success & Call Backend Verification
  const handleCompleteGatewayPayment = () => {
    if (!activeOrder) return;
    setIsProcessing(true);
    setError(null);

    try {
      const gatewayPaymentId = `pay_${Math.random().toString(36).substring(2, 12)}`;
      const verificationRes = db.verifyPayment({
        paymentOrderId: activeOrder.id,
        gatewayOrderId: activeOrder.gatewayOrderId || `order_${activeOrder.orderNumber}`,
        gatewayPaymentId,
        paymentMethod: selectedMethod,
      });

      if (verificationRes.success && verificationRes.transaction) {
        setActiveTx(verificationRes.transaction);
        setPaymentOutcome('SUCCESS');
        setStep('RESULT');
        if (onPaymentSuccess) {
          onPaymentSuccess(verificationRes.transaction);
        }
      } else {
        setError(verificationRes.error || 'Payment verification failed on backend.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2b: Simulate Failure
  const handleSimulateFailure = () => {
    if (!activeOrder) return;
    setIsProcessing(true);
    try {
      const res = db.recordPaymentFailure({
        paymentOrderId: activeOrder.id,
        failureReason: 'Bank server declined transaction (Sandbox Simulation)',
      });
      if (res.success && res.transaction) {
        setActiveTx(res.transaction);
        setPaymentOutcome('FAILED');
        setStep('RESULT');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2c: Simulate Cancellation
  const handleCancelGateway = () => {
    if (!activeOrder) return;
    db.cancelPaymentOrder({
      paymentOrderId: activeOrder.id,
      reason: 'User cancelled transaction on checkout page',
    });
    setPaymentOutcome('CANCELLED');
    setStep('RESULT');
  };

  const handleResetAndClose = () => {
    setStep('ORDER');
    setActiveOrder(null);
    setActiveTx(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-blue-700 via-indigo-700 to-navy-900 text-white">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-blue-200" />
            <div>
              <h3 className="font-bold text-base leading-tight">
                Online Fee Payment Gateway
              </h3>
              <p className="text-xs text-blue-100 opacity-90">
                Swarrnim University Secure Checkout
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body based on Step */}
        <div className="p-6 overflow-y-auto flex-1 text-sm space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── STEP 1: ORDER INITIATION & AMOUNT SELECTION ── */}
          {step === 'ORDER' && (
            <div className="space-y-4">
              {/* Invoice Summary Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 font-medium">Invoice Number:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Student:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{invoice.studentName} ({invoice.enrollmentNo})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Invoiced:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">₹{Number(invoice.totalAmount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Already Settled:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">₹{alreadyPaid.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                  <span>Outstanding Balance:</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400 text-sm">₹{outstanding.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Amount Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                  Select Payment Amount Option
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentType('FULL')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      paymentType === 'FULL'
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                    }`}
                  >
                    <div className="text-xs font-bold">Pay Full Balance</div>
                    <div className="text-sm font-mono font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                      ₹{outstanding.toLocaleString('en-IN')}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setPaymentType('PARTIAL'); setCustomAmount(Math.round(outstanding / 2)); }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      paymentType === 'PARTIAL'
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                    }`}
                  >
                    <div className="text-xs font-bold">Pay Partial Amount</div>
                    <div className="text-xs text-slate-500 mt-1">Custom installment</div>
                  </button>
                </div>

                {paymentType === 'PARTIAL' && (
                  <div className="pt-2 space-y-1">
                    <label className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      Enter Custom Partial Amount (₹) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        min="1"
                        max={outstanding}
                        value={customAmount}
                        onChange={(e) => setCustomAmount(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Total Payable Summary Box */}
              <div className="p-3.5 bg-slate-900 text-white rounded-xl flex justify-between items-center">
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase font-semibold tracking-wider">
                    Total Payable Now
                  </span>
                  <span className="text-xs text-slate-300">Secured with 256-bit SSL</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold font-mono text-emerald-400">
                    ₹{payableAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Checkout Action */}
              <button
                type="button"
                onClick={handleProceedToGateway}
                disabled={isProcessing || payableAmount <= 0}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                Proceed to Secure Gateway Checkout
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── STEP 2: GATEWAY SANDBOX CHECKOUT MODAL ── */}
          {step === 'GATEWAY' && activeOrder && (
            <div className="space-y-4">
              {/* Razorpay Banner */}
              <div className="p-3 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl flex justify-between items-center text-xs">
                <div>
                  <div className="font-extrabold tracking-wide uppercase">Razorpay University Gateway</div>
                  <div className="text-[10px] text-blue-200 font-mono">{activeOrder.gatewayOrderId}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-blue-200">Amount</div>
                  <div className="text-base font-bold font-mono text-emerald-400">₹{activeOrder.amount.toLocaleString('en-IN')}</div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Select Payment Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('UPI')}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                      selectedMethod === 'UPI' ? 'border-blue-600 bg-blue-50/70 text-blue-900' : 'border-slate-200'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    UPI / Google Pay
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('CARD')}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                      selectedMethod === 'CARD' ? 'border-blue-600 bg-blue-50/70 text-blue-900' : 'border-slate-200'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    Credit / Debit Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('NETBANKING')}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                      selectedMethod === 'NETBANKING' ? 'border-blue-600 bg-blue-50/70 text-blue-900' : 'border-slate-200'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    Net Banking
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('QR')}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                      selectedMethod === 'QR' ? 'border-blue-600 bg-blue-50/70 text-blue-900' : 'border-slate-200'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-purple-600" />
                    Dynamic QR Code
                  </button>
                </div>
              </div>

              {selectedMethod === 'UPI' && (
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-600 font-medium">UPI ID / VPA</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-medium"
                    placeholder="username@okhdfcbank"
                  />
                </div>
              )}

              {/* Simulation Actions */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleCompleteGatewayPayment}
                  disabled={isProcessing}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  Simulate Payment Success (₹{activeOrder.amount.toLocaleString('en-IN')})
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleSimulateFailure}
                    disabled={isProcessing}
                    className="py-2 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors"
                  >
                    Simulate Failure
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelGateway}
                    disabled={isProcessing}
                    className="py-2 rounded-xl bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    Cancel Payment
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: BACKEND SETTLEMENT RESULT ── */}
          {step === 'RESULT' && (
            <div className="space-y-4 text-center py-2">
              {paymentOutcome === 'SUCCESS' && activeTx && (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                      Payment Successfully Verified &amp; Settled!
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Your fee transaction has been atomically confirmed by the University Accounts Engine.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-left space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Transaction ID:</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{activeTx.transactionNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Gateway Ref:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{activeTx.gatewayPaymentId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Amount Settled:</span>
                      <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">₹{activeTx.amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Invoice:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{invoice.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Settled At:</span>
                      <span className="text-slate-700 dark:text-slate-300">{new Date(activeTx.paidAt || Date.now()).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              )}

              {paymentOutcome === 'FAILED' && (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                    <XCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                      Payment Transaction Failed
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeTx?.failureReason || 'Payment was not completed by the gateway. Fee balance remained unchanged.'}
                    </p>
                  </div>
                </div>
              )}

              {paymentOutcome === 'CANCELLED' && (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                      Payment Order Cancelled
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      You cancelled the checkout session. No funds were debited and fee ledger was unaffected.
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors"
                >
                  Done &amp; Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
