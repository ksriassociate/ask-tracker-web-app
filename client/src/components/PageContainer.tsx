import React, { ReactNode } from "react";

interface PageContainerProps {
  title: string;
  onAdd: () => void;
  children: ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  onAdd,
  children,
}) => {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm"
          onClick={onAdd}
        >
          Add
        </button>
      </div>
      {children}
    </div>
  );
};