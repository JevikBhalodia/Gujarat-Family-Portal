import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Shield, ShieldAlert, Trash2, Key, CheckCircle, FileText } from 'lucide-react';

export function MemberRow({ member, onUpdateAccess, onRemove, onChangeHead }) {
  const { isHead } = useAuth();
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removeReason, setRemoveReason] = useState('marriage');

  const birthDate = new Date(member.dob);
  const age = Math.floor((new Date() - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
  const isChild = age < 18;
  const isMemberHead = member.family_role === 'head';

  const handleConfirmRemove = () => {
    onRemove(member.id, removeReason);
    setShowRemoveModal(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition">
      <div className="flex items-start space-x-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
          isMemberHead ? 'bg-amber-100 text-amber-800' : isChild ? 'bg-purple-100 text-purple-800' : 'bg-sky-100 text-sky-800'
        }`}>
          {member.name.charAt(0)}
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sm text-slate-900">{member.name}</span>
            {isMemberHead && (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-200">
                HEAD
              </span>
            )}
            {isChild && (
              <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200">
                CHILD (NO LOGIN)
              </span>
            )}
          </div>

          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
            <span>{member.relation_to_head}</span>
            <span>•</span>
            <span>Age {age} ({member.gender})</span>
            <span>•</span>
            <span className="flex items-center text-slate-600">
              {member.id_type === 'birth_cert' ? (
                <>
                  <FileText className="w-3 h-3 mr-1 text-purple-500" />
                  Birth Cert (...{member.id_last4})
                </>
              ) : (
                <>
                  <Shield className="w-3 h-3 mr-1 text-sky-500" />
                  Aadhaar (...{member.id_last4})
                </>
              )}
              {member.id_verified && (
                <CheckCircle className="w-3 h-3 ml-1 text-emerald-600" title="Identity Verified" />
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Head controls */}
      {isHead && (
        <div className="flex items-center space-x-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 justify-end">
          {/* Access toggle: Only for adult non-head members */}
          {!isMemberHead && !isChild && (
            <select
              value={member.access}
              onChange={(e) => onUpdateAccess(member.id, e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 font-medium text-slate-700"
            >
              <option value="view">Access: View Only</option>
              <option value="apply">Access: Apply Allowed</option>
            </select>
          )}

          {/* Transfer Head role */}
          {!isMemberHead && !isChild && member.id_verified && (
            <button
              onClick={() => onChangeHead(member.id)}
              title="Make this member the Family Head"
              className="px-2.5 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition"
            >
              Make Head
            </button>
          )}

          {/* Remove member (Blocked for head) */}
          {!isMemberHead && (
            <button
              onClick={() => setShowRemoveModal(true)}
              title="Remove member with reason"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Remove Reason Modal */}
      {showRemoveModal && (
        <div className="fixed inset-0 z-50 modal-overlay flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-rose-600">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-bold text-sm text-slate-900">Remove Family Member</h3>
            </div>
            <p className="text-xs text-slate-600">
              Please specify the official reason for removing <strong>{member.name}</strong> from family records:
            </p>
            <select
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50"
            >
              <option value="marriage">Marriage (moved to other family)</option>
              <option value="death">Death</option>
              <option value="divorce">Divorce</option>
              <option value="other">Other Administrative Reason</option>
            </select>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowRemoveModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemove}
                className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
              >
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MemberRow;
