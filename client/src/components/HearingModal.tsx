import React from "react";

interface HearingModalProps {
  onClose: () => void;
  onSave: () => void;
  date: string;
  setDate: (val: string) => void;
}

export const HearingModal: React.FC<HearingModalProps> = ({
  onClose,
  onSave,
  date,
  setDate,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded w-80">
        <h2 className="text-lg font-semibold mb-4">Add Hearing</h2>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border p-2 w-full mb-4"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onSave}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="bg-gray-400 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
