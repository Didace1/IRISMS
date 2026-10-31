import React from 'react';
import { Eye, Edit, Trash2, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Table component for displaying repair case history
 */
const RepairHistoryTable = ({ cases, onView, onEdit, onDelete }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status) => {
    const styles = {
      COMPLETED: 'bg-green-100 text-green-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Case ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Device
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Symptoms
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fault Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Duration
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Returned
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {cases.map((caseItem) => (
            <tr key={caseItem.caseId} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                #{caseItem.caseId}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {caseItem.deviceType}
                </div>
                <div className="text-sm text-gray-500">
                  {caseItem.brand} {caseItem.model}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 max-w-xs truncate">
                  {caseItem.symptomsText}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900">
                  {caseItem.faultCategory?.replace('_', ' ') || 'N/A'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(caseItem.repairStatus)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {caseItem.repairDurationMinutes ? `${caseItem.repairDurationMinutes} min` : 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {caseItem.returnedAfterRepair ? (
                  <AlertCircle className="w-5 h-5 text-red-600" title="Returned" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600" title="Successful" />
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(caseItem.repairDate)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onView(caseItem)}
                    className="text-blue-600 hover:text-blue-900"
                    title="View Details"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onEdit(caseItem)}
                    className="text-green-600 hover:text-green-900"
                    title="Edit"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onDelete(caseItem.caseId)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RepairHistoryTable;
