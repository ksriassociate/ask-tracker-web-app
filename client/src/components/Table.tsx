import React from "react";

interface TableProps {
  headers: string[];
  rows: (string | number | React.ReactNode)[][];
}

export const Table: React.FC<TableProps> = ({ headers, rows }) => {
  return (
    <div className="overflow-x-auto border rounded">
      <table className="min-w-full border-collapse">
        <thead className="bg-gray-100">
          <tr>
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-4 py-2 border text-left text-sm font-semibold"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-gray-50">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-4 py-2 border text-sm">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
