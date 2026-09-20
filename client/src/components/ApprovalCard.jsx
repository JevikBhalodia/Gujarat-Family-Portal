import React, { useState } from 'react';
import { UserCheck, UserX, Clock } from 'lucide-react';

export function ApprovalCard({ request, onApprove, onReject }) {
  const [access, setAccess] = useState('view');

  return (
    <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-amber-600" />
          <span className="font-bold text-xs text-amber-900 uppercase tracking-wider">
            {request.type === 'join' ? 'Pending Family Join Request' : 'Pending Member Move Request'}
          </span>
        </div>
        <h4 className="font-bold text-sm text-slate-900 mt-1">
          {request.applicant_name}
        </h4>
        <p className="text-xs text-slate-500">
          DOB: {request.applicant_dob} • Submitted: {new Date(request.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <select
          value={access}
          onChange={(e) => setAccess(e.target.value)}
          className="text-xs border border-amber-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 font-medium"
        >
          <option value="view">Grant: View Only</option>
          <option value="apply">Grant: Apply Access</option>
        </select>

        <button
          onClick={() => onApprove(request.id, access)}
          className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Approve</span>
        </button>

        <button
          onClick={() => onReject(request.id)}
          className="p-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs transition"
          title="Reject Request"
        >
          <UserX className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default ApprovalCard;
