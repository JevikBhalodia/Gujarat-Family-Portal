import React from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export function ChecklistResult({ checks = [] }) {
  const checkLabels = {
    permission: 'Applicant Permission & Authority',
    identity: 'Identity Verification (Aadhaar / UIDAI)',
    scheme_open: 'Scheme Active & Valid Deadline',
    eligibility: 'Live Fact Eligibility Rules',
    documents: 'Mandatory Verified Documents',
    duplicate: 'Duplicate Active Enrollment Check',
    create: 'Government Application Registration'
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
        7-Step Verification Checklist
      </h4>
      <div className="space-y-2">
        {checks.map((item, idx) => {
          const isPassed = item.passed;
          const title = checkLabels[item.name] || item.name;

          return (
            <div
              key={idx}
              className={`p-2.5 rounded-lg border text-sm flex items-start space-x-3 transition-colors ${
                isPassed ? 'bg-white border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {isPassed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-semibold flex items-center justify-between">
                  <span>{title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-200 text-rose-800'}`}>
                    {isPassed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
                {!isPassed && item.reason && (
                  <p className="text-xs text-rose-700 mt-1 flex items-start space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 mr-1" />
                    <span>{item.reason}</span>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ChecklistResult;
