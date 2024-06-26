import React from 'react';
import Modal from 'components/Modal';

const UpdaterModal = ({ onClose, updateNow }) => {
  return (
    <Modal
      title="Update Available"
      size="sm"
      handleCancel={onClose}
      handleConfirm={updateNow}
      confirmText="Restart"
      cancelText="Later"
    >
      <div className="text-center">
        <p className="text-2xl mt-4">v1.0.1</p>
        <p className="text-lg">A new version has been downloaded. Restart the application to apply the updates.</p>
      </div>
    </Modal>
  );
};

export default UpdaterModal;
