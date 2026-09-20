import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import Drawer from '../../components/common/Drawer.jsx';
import Modal from '../../components/common/Modal.jsx';
import StatusChip from '../../components/common/StatusChip.jsx';
import { ErrorState, Skeleton } from '../../components/common/States.jsx';
import { Copy, Check, UserPlus, MoreVertical, ShieldAlert, CheckCircle2 } from 'lucide-react';

export function ManageFamilyPage() {
  const { t } = useTranslation();
  const { isHead, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [familyData, setFamilyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Add Member Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('F');
  const [relation, setRelation] = useState('Daughter');
  const [idNumber, setIdNumber] = useState('');
  const [certNumber, setCertNumber] = useState('');
  const [birthCertFile, setBirthCertFile] = useState(null);
  const [submittingMember, setSubmittingMember] = useState(false);
  const [memberFormError, setMemberFormError] = useState('');

  // Remove Member Modal State
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removeReason, setRemoveReason] = useState('Moved out');
  const [removing, setRemoving] = useState(false);

  // Make Head Modal State
  const [makeHeadTarget, setMakeHeadTarget] = useState(null);
  const [transferring, setTransferring] = useState(false);

  // Pending request access choices
  const [requestAccessMap, setRequestAccessMap] = useState({});

  const fetchFamily = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest('/families/me');
      setFamilyData(data);
    } catch (err) {
      setError(err.message || 'Failed to load family data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamily();
  }, []);

  const handleCopyCode = () => {
    if (familyData?.family?.family_code) {
      navigator.clipboard.writeText(familyData.family.family_code);
      setCopied(true);
      showToast(t('toast.copied'));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Calculate age for add member dynamic form
  let calculatedAge = null;
  if (dob) {
    const birth = new Date(dob);
    calculatedAge = Math.floor((new Date() - birth) / (365.25 * 24 * 60 * 60 * 1000));
  }
  const isChild = calculatedAge !== null && calculatedAge < 18;

  const handleAddMember = async (e) => {
    e.preventDefault();
    setSubmittingMember(true);
    setMemberFormError('');

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('dob', dob);
      formData.append('gender', gender);
      formData.append('relation_to_head', relation);

      if (isChild) {
        if (!certNumber.trim()) {
          throw new Error('Birth certificate registration number is required for children.');
        }
        formData.append('cert_number', certNumber.trim());
        if (birthCertFile) {
          formData.append('birth_cert_file', birthCertFile);
        }
      } else {
        if (!idNumber.trim()) {
          throw new Error('Aadhaar number is required for adult members.');
        }
        formData.append('id_number', idNumber.trim());
      }

      await apiRequest('/family/members', {
        method: 'POST',
        body: formData
      });

      showToast(t('toast.memberAdded'));
      setDrawerOpen(false);
      setName('');
      setDob('');
      setIdNumber('');
      setCertNumber('');
      setBirthCertFile(null);
      await fetchFamily();
      await refreshProfile();
    } catch (err) {
      setMemberFormError(err.message || 'Failed to add member.');
    } finally {
      setSubmittingMember(false);
    }
  };

  const handleAccessChange = async (memberId, newAccess) => {
    try {
      await apiRequest(`/family/members/${memberId}`, {
        method: 'PATCH',
        body: { access: newAccess }
      });
      await fetchFamily();
      showToast('Access updated');
    } catch (err) {
      alert(err.message || 'Failed to update access');
    }
  };

  const handleConfirmRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await apiRequest(`/family/members/${removeTarget.id}`, {
        method: 'DELETE',
        body: { reason: removeReason }
      });
      showToast(t('toast.memberRemoved'));
      setRemoveTarget(null);
      await fetchFamily();
      await refreshProfile();
    } catch (err) {
      alert(err.message || 'Failed to remove member');
    } finally {
      setRemoving(false);
    }
  };

  const handleConfirmMakeHead = async () => {
    if (!makeHeadTarget) return;
    setTransferring(true);
    try {
      await apiRequest('/family/change-head', {
        method: 'POST',
        body: { member_id: makeHeadTarget.id }
      });
      showToast(t('toast.headChanged'));
      setMakeHeadTarget(null);
      await fetchFamily();
      await refreshProfile();
    } catch (err) {
      alert(err.message || 'Failed to transfer head authority');
    } finally {
      setTransferring(false);
    }
  };

  const handleApproveRequest = async (reqId) => {
    const access = requestAccessMap[reqId] || 'apply';
    try {
      await apiRequest(`/family/requests/${reqId}/approve`, {
        method: 'POST',
        body: { access }
      });
      showToast('Request approved');
      await fetchFamily();
    } catch (err) {
      alert(err.message || 'Failed to approve');
    }
  };

  const handleRejectRequest = async (reqId) => {
    try {
      await apiRequest(`/family/requests/${reqId}/reject`, { method: 'POST' });
      showToast('Request rejected');
      await fetchFamily();
    } catch (err) {
      alert(err.message || 'Failed to reject');
    }
  };

  if (!isHead) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-3">
        <ShieldAlert className="w-10 h-10 text-marigold mx-auto" />
        <h2 className="text-lg font-bold text-ink">Restricted to Family Head</h2>
        <p className="text-sm text-muted">
          Only the family head has permission to add, edit, or remove members.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !familyData) {
    return <ErrorState message={error} onRetry={fetchFamily} />;
  }

  const headMember = familyData.members?.find((m) => m.family_role === 'head');
  const familySurname = headMember?.name?.split(' ').pop() || 'Family';

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner: Patel family · Family code GJ-AHM-0042 [Copy] */}
      <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink">
            {t('family.familyTitle', { name: familySurname })}
          </h1>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-sm text-muted font-mono">
              {t('family.familyCode', { code: familyData.family?.family_code })}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="p-1 text-muted hover:text-indigo rounded-[6px] transition-colors cursor-pointer"
              title="Copy code"
            >
              {copied ? <Check className="w-4 h-4 text-green" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Button variant="primary" onClick={() => setDrawerOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          <span>{t('family.addMember')}</span>
        </Button>
      </Card>

      {/* Pending Requests */}
      {familyData.pendingRequests?.length > 0 && (
        <Card className="space-y-3 border-line">
          <h2 className="text-sm font-bold text-ink">
            {t('family.pendingRequests')} ({familyData.pendingRequests.length})
          </h2>

          <div className="space-y-2">
            {familyData.pendingRequests.map((req) => (
              <div
                key={req.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-[8px] bg-salt border border-line gap-3 text-sm"
              >
                <div>
                  <span className="font-medium text-ink">
                    {req.type === 'move'
                      ? t('family.wantsToMove', { name: req.user_mobile })
                      : t('family.wantsToJoin', { name: req.user_mobile })}
                  </span>
                  <p className="text-xs text-muted">
                    Request ID #{req.id} · {req.status}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={requestAccessMap[req.id] || 'apply'}
                    onChange={(e) =>
                      setRequestAccessMap((prev) => ({ ...prev, [req.id]: e.target.value }))
                    }
                    className="h-[36px] px-2.5 py-1 rounded-[8px] bg-surface border border-line text-xs font-medium text-ink"
                  >
                    <option value="apply">Access: {t('family.accessApply')}</option>
                    <option value="view">Access: {t('family.accessView')}</option>
                  </select>

                  <Button size="sm" variant="primary" onClick={() => handleApproveRequest(req.id)}>
                    {t('family.approve')}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleRejectRequest(req.id)}>
                    {t('family.reject')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Members Section */}
      <Card className="space-y-4">
        <h2 className="text-base font-bold text-ink">
          {t('family.members')} ({familyData.members?.length || 0})
        </h2>

        {/* Responsive Table: Table ≥768px */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th className="pb-3 font-medium">{t('family.colName')}</th>
                <th className="pb-3 font-medium">{t('family.colRelation')}</th>
                <th className="pb-3 font-medium">{t('family.colAge')}</th>
                <th className="pb-3 font-medium">{t('family.colId')}</th>
                <th className="pb-3 font-medium">{t('family.colAccess')}</th>
                <th className="pb-3 font-medium text-right">{t('family.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {familyData.members?.map((m) => {
                const isHeadMember = m.family_role === 'head';
                const memberAge = m.dob
                  ? Math.floor((new Date() - new Date(m.dob)) / (365.25 * 24 * 60 * 60 * 1000))
                  : '—';
                const isChildMember = typeof memberAge === 'number' && memberAge < 18;

                return (
                  <tr key={m.id} className="py-2.5">
                    <td className="py-3 font-medium text-ink">{m.name}</td>
                    <td className="py-3 text-muted">{m.relation_to_head}</td>
                    <td className="py-3 text-muted">{memberAge}</td>
                    <td className="py-3">
                      {isChildMember ? (
                        <span className="text-xs text-green font-medium">
                          {t('family.birthCertVerified')}
                        </span>
                      ) : m.id_verified ? (
                        <span className="text-xs text-green font-medium">
                          {t('family.aadhaarVerified')}
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium text-marigold bg-[var(--marigold-fill)] border border-[#F5DCAB]">
                          {t('family.addAadhaar')}
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      {isHeadMember ? (
                        <span className="text-xs font-bold text-ink">{t('family.fullAccess')}</span>
                      ) : isChildMember ? (
                        <span className="text-xs text-muted">{t('family.noLogin')}</span>
                      ) : (
                        <select
                          value={m.access || 'apply'}
                          onChange={(e) => handleAccessChange(m.id, e.target.value)}
                          className="h-[32px] px-2 py-0.5 rounded-[6px] bg-surface border border-line text-xs font-medium text-ink"
                        >
                          <option value="apply">{t('family.accessApply')}</option>
                          <option value="view">{t('family.accessView')}</option>
                        </select>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {!isHeadMember && (
                        <div className="inline-flex items-center space-x-3 text-xs">
                          {!isChildMember && m.id_verified && (
                            <button
                              type="button"
                              onClick={() => setMakeHeadTarget(m)}
                              className="text-indigo hover:underline font-medium cursor-pointer"
                            >
                              {t('family.makeHead')}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setRemoveTarget(m)}
                            className="text-madder hover:underline font-medium cursor-pointer"
                          >
                            {t('family.remove')}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Cards (<768px) */}
        <div className="md:hidden space-y-3">
          {familyData.members?.map((m) => {
            const isHeadMember = m.family_role === 'head';
            const memberAge = m.dob
              ? Math.floor((new Date() - new Date(m.dob)) / (365.25 * 24 * 60 * 60 * 1000))
              : '—';
            const isChildMember = typeof memberAge === 'number' && memberAge < 18;

            return (
              <div key={m.id} className="p-3.5 rounded-[8px] bg-salt border border-line space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-sm text-ink block">{m.name}</span>
                    <span className="text-muted">
                      {m.relation_to_head} · {memberAge} yrs
                    </span>
                  </div>
                  {isHeadMember ? (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo font-bold text-[10px]">
                      HEAD
                    </span>
                  ) : isChildMember ? (
                    <span className="text-muted text-[10px]">{t('family.noLogin')}</span>
                  ) : (
                    <select
                      value={m.access || 'apply'}
                      onChange={(e) => handleAccessChange(m.id, e.target.value)}
                      className="px-2 py-1 rounded-[6px] bg-surface border border-line text-xs font-medium text-ink"
                    >
                      <option value="apply">{t('family.accessApply')}</option>
                      <option value="view">{t('family.accessView')}</option>
                    </select>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-line/60">
                  <div>
                    {isChildMember ? (
                      <span className="text-green font-medium">{t('family.birthCertVerified')}</span>
                    ) : m.id_verified ? (
                      <span className="text-green font-medium">{t('family.aadhaarVerified')}</span>
                    ) : (
                      <span className="text-marigold font-medium">{t('family.addAadhaar')}</span>
                    )}
                  </div>

                  {!isHeadMember && (
                    <div className="flex items-center space-x-3">
                      {!isChildMember && m.id_verified && (
                        <button
                          type="button"
                          onClick={() => setMakeHeadTarget(m)}
                          className="text-indigo font-medium hover:underline"
                        >
                          {t('family.makeHead')}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setRemoveTarget(m)}
                        className="text-madder font-medium hover:underline"
                      >
                        {t('family.remove')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Add Member Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={t('family.drawerTitle')}
      >
        <form onSubmit={handleAddMember} className="space-y-4 text-left">
          {memberFormError && (
            <p className="text-xs text-madder p-2.5 rounded-[8px] bg-[var(--madder-fill)]">
              {memberFormError}
            </p>
          )}

          <Input
            label={t('family.fullName')}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Riya Patel"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              label={t('family.dob')}
              required
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />

            <Select
              label={t('family.gender')}
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="F">Female</option>
              <option value="M">Male</option>
              <option value="Other">Other</option>
            </Select>
          </div>

          <Select
            label={t('family.relation')}
            value={relation}
            onChange={(e) => setRelation(e.target.value)}
          >
            <option value="Daughter">Daughter</option>
            <option value="Son">Son</option>
            <option value="Wife">Wife</option>
            <option value="Husband">Husband</option>
            <option value="Mother">Mother</option>
            <option value="Father">Father</option>
            <option value="Other">Other</option>
          </Select>

          {/* Child (<18) requirements vs Adult (≥18) */}
          {isChild ? (
            <div className="p-3.5 rounded-[8px] bg-salt border border-line space-y-3">
              <p className="text-xs font-medium text-ink">
                {t('family.birthCertHelp')}
              </p>

              <Input
                label={t('family.birthCertNumber')}
                required
                value={certNumber}
                onChange={(e) => setCertNumber(e.target.value)}
                placeholder="e.g. BC-AHM-2021-9921"
              />

              <div className="space-y-1">
                <label className="text-sm font-medium text-ink">
                  {t('family.uploadBirthCert')} *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setBirthCertFile(e.target.files[0])}
                  className="w-full text-xs text-muted"
                />
              </div>
            </div>
          ) : (
            <Input
              label={t('family.aadhaarField')}
              maxLength={12}
              required
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="12-digit Aadhaar number"
              helperText="Encrypted and hashed securely."
            />
          )}

          <div className="pt-4 border-t border-line flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
              {t('family.cancel')}
            </Button>
            <Button type="submit" variant="primary" loading={submittingMember}>
              {t('family.saveMember')}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Remove Member Confirmation Modal */}
      <Modal
        isOpen={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        title={t('family.removeTitle')}
      >
        <div className="space-y-4 text-left">
          <p className="text-sm text-ink">
            Are you sure you want to remove <strong>{removeTarget?.name}</strong> from your family?
          </p>

          <p className="text-xs text-muted p-3 rounded-[8px] bg-[var(--madder-fill)] border border-[#F5BDB8]">
            {t('family.removeWarning')}
          </p>

          <Select
            label={t('family.removeReasonLabel')}
            required
            value={removeReason}
            onChange={(e) => setRemoveReason(e.target.value)}
          >
            <option value="Death">{t('family.reasonDeath')}</option>
            <option value="Divorce">{t('family.reasonDivorce')}</option>
            <option value="Moved out">{t('family.reasonMoved')}</option>
            <option value="Other">{t('family.reasonOther')}</option>
          </Select>

          <div className="pt-3 border-t border-line flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setRemoveTarget(null)}>
              {t('family.cancel')}
            </Button>
            <Button variant="danger" loading={removing} onClick={handleConfirmRemove}>
              {t('family.confirmRemove')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Make Head Confirmation Modal */}
      <Modal
        isOpen={Boolean(makeHeadTarget)}
        onClose={() => setMakeHeadTarget(null)}
        title={t('family.makeHeadTitle')}
      >
        <div className="space-y-4 text-left">
          <p className="text-sm text-ink leading-relaxed">
            {t('family.makeHeadConfirm', { name: makeHeadTarget?.name })}
          </p>

          <div className="pt-3 border-t border-line flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setMakeHeadTarget(null)}>
              {t('family.cancel')}
            </Button>
            <Button variant="primary" loading={transferring} onClick={handleConfirmMakeHead}>
              {t('family.confirmMakeHead')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ManageFamilyPage;
