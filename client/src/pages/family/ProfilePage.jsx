import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { apiRequest } from '../../api/client.js';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Modal from '../../components/common/Modal.jsx';
import { CheckCircle2, Shield, Building2 } from 'lucide-react';

export function ProfilePage() {
  const { t } = useTranslation();
  const { user, member, family, department, isAdmin, isHead, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [targetCode, setTargetCode] = useState('');
  const [moving, setMoving] = useState(false);
  const [moveError, setMoveError] = useState('');

  const handleVerifyAadhaar = async (e) => {
    e.preventDefault();
    if (!aadhaarInput || aadhaarInput.length !== 12) {
      setVerifyError('Please enter a valid 12-digit Aadhaar number.');
      return;
    }
    setVerifying(true);
    setVerifyError('');
    try {
      await apiRequest('/me/verify-id', {
        method: 'POST',
        body: { aadhaar_number: aadhaarInput }
      });
      showToast(t('toast.profileUpdated'));
      setVerifyModalOpen(false);
      setAadhaarInput('');
      await refreshProfile();
    } catch (err) {
      setVerifyError(err.message || 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  const handleRequestMove = async (e) => {
    e.preventDefault();
    if (!targetCode.trim()) return;
    setMoving(true);
    setMoveError('');
    try {
      await apiRequest('/family/request-move', {
        method: 'POST',
        body: { target_family_code: targetCode.trim() }
      });
      showToast('Join request sent to family head');
      setMoveModalOpen(false);
      setTargetCode('');
    } catch (err) {
      setMoveError(err.message || 'Failed to request transfer.');
    } finally {
      setMoving(false);
    }
  };

  // Admin Profile View
  if (isAdmin) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 text-left">
        <h1 className="text-2xl font-bold text-ink">{t('profile.title')}</h1>
        <Card className="space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-line">
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">{t('profile.officerDetails')}</h2>
              <p className="text-xs text-muted">{user?.mobile}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-muted block">{t('profile.department')}</span>
              <span className="font-semibold text-ink">{department?.name || 'Department of Health & Family Welfare'}</span>
            </div>
            <div>
              <span className="text-xs text-muted block">{t('profile.role')}</span>
              <span className="font-semibold text-ink capitalize">{user?.role}</span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const roleLabel = isHead
    ? t('roles.head')
    : member?.access === 'apply'
    ? t('roles.memberApply')
    : t('roles.memberView');

  const accessLabel = isHead ? 'Full' : member?.access === 'apply' ? 'Apply & View' : 'View only';

  return (
    <div className="space-y-6 text-left">
      <h1 className="text-2xl font-bold text-ink">{t('profile.title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Card: name, mobile, role chip, access level */}
        <Card className="space-y-4">
          <h2 className="text-base font-bold text-ink pb-2 border-b border-line">
            {t('profile.personalDetails')}
          </h2>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs text-muted block">{t('profile.name')}</span>
              <span className="font-semibold text-ink">{member?.name || '—'}</span>
            </div>

            <div>
              <span className="text-xs text-muted block">{t('profile.mobile')}</span>
              <span className="font-mono text-ink">{user?.mobile || '—'}</span>
            </div>

            <div>
              <span className="text-xs text-muted block mb-1">{t('profile.role')}</span>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo border border-indigo/20">
                {roleLabel}
              </span>
            </div>

            <div>
              <span className="text-xs text-muted block">{t('profile.accessLevel')}</span>
              <span className="font-medium text-ink">{accessLabel}</span>
            </div>
          </div>
        </Card>

        {/* Right Card: ID verification, family summary, member-only move request */}
        <Card className="space-y-5">
          {/* ID Verification */}
          <div className="space-y-2 pb-4 border-b border-line">
            <span className="text-xs text-muted block font-medium">
              {t('profile.idVerification')}
            </span>

            {member?.id_verified ? (
              <div className="flex items-center space-x-2 text-sm text-green font-medium">
                <CheckCircle2 className="w-4 h-4 text-green" />
                <span>{t('profile.aadhaarVerified', { last4: member.id_last4 })}</span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs text-marigold font-medium">Not verified</span>
                <Button size="sm" variant="secondary" onClick={() => setVerifyModalOpen(true)}>
                  {t('profile.verifyNow')}
                </Button>
              </div>
            )}
          </div>

          {/* Family Summary */}
          <div className="space-y-3">
            <span className="text-xs text-muted block font-medium">
              {t('profile.familySummary')}
            </span>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-muted block">{t('profile.familyCode')}</span>
                <span className="font-mono font-bold text-ink">{family?.family_code || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-muted block">{t('profile.district')}</span>
                <span className="font-medium text-ink">{family?.district || '—'}</span>
              </div>
            </div>

            {/* Member-only button "Request to move to another family" */}
            {!isHead && (
              <div className="pt-3">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => setMoveModalOpen(true)}
                >
                  {t('profile.requestMove')}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Aadhaar Verification Modal */}
      <Modal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        title={t('profile.idVerification')}
      >
        <form onSubmit={handleVerifyAadhaar} className="space-y-4 text-left">
          {verifyError && <p className="text-xs text-madder">{verifyError}</p>}
          <Input
            label={t('profile.enterAadhaar')}
            type="text"
            maxLength={12}
            required
            value={aadhaarInput}
            onChange={(e) => setAadhaarInput(e.target.value.replace(/\D/g, ''))}
            placeholder="12-digit number"
          />
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="secondary" onClick={() => setVerifyModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={verifying}>
              {t('profile.verify')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Request Move Modal */}
      <Modal
        isOpen={moveModalOpen}
        onClose={() => setMoveModalOpen(false)}
        title={t('profile.moveModalTitle')}
      >
        <form onSubmit={handleRequestMove} className="space-y-4 text-left">
          {moveError && <p className="text-xs text-madder">{moveError}</p>}
          <p className="text-xs text-muted">
            Enter the Family Code of the family you wish to transfer to. The target family head will review and approve your request.
          </p>
          <Input
            label={t('profile.targetFamilyCode')}
            type="text"
            required
            value={targetCode}
            onChange={(e) => setTargetCode(e.target.value.toUpperCase())}
            placeholder="e.g. GJ-SUR-00210"
          />
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="secondary" onClick={() => setMoveModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={moving}>
              {t('profile.requestMoveSubmit')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ProfilePage;
