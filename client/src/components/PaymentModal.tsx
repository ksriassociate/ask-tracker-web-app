import React, { useState } from 'react';
import { Modal, FormInput } from '../App';

interface PaymentModalProps {
  taskId: number;
  onClose: () => void;
  onSave: (taskId: number, amount: number) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ taskId, onClose, onSave }) => {
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  const handleSave = () => {
    if (paymentAmount > 0) {
      onSave(taskId, paymentAmount);
    }
    onClose();
  };

  return (
    <Modal title="Record Partial Payment" onClose={onClose}>
      <FormInput
        label="Payment Amount"
        id="payment-amount"
        name="payment-amount"
        type="number"
        value={paymentAmount}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPaymentAmount(parseFloat(e.target.value) || 0)}
        required
      />
      <div className="flex justify-end mt-4">
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded-full font-medium"
        >
          Save Payment
        </button>
      </div>
    </Modal>
  );
};

export default PaymentModal;