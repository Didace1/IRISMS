import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { PackageSearch, Check, X, Clock, AlertCircle } from 'lucide-react';
import { PageHeader } from '../../shared/components/Common/PageHeader';
import { LoadingState } from '../../shared/components/Common/LoadingState';

export const SalesSparePartRequestsPage = () => {
  const SYSTEM_BACKEND_BASE_URL = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';
  const { user } = useSelector((state) => state.auth);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadRequests();
  }, [SYSTEM_BACKEND_BASE_URL]);

  const loadRequests = async () => {
    try {
      const response = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/spare-part-requests`);
      if (response.ok) {
        const data = await response.json();
        // The technician assigned the salesman name to the 'supplier' field.
        // We can show all requests, or filter by this salesman.
        // For visibility, we'll show all requests but highlight ones assigned to this salesman.
        // Let's sort pending first, then by date descending.
        const sortedData = (Array.isArray(data) ? data : []).sort((a, b) => {
          if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
          if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        setRequests(sortedData);
      }
    } catch (error) {
      toast.error('Failed to load spare part requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      const response = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/spare-part-requests/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvedBy: user ? user.fullName : 'Salesman'
        })
      });

      if (response.ok) {
        toast.success('Request approved successfully');
        loadRequests();
      } else {
        throw new Error('Failed to approve');
      }
    } catch (error) {
      toast.error('Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Reason for rejection:");
    if (reason === null) return; // cancelled

    setProcessingId(id);
    try {
      const response = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/spare-part-requests/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rejectedBy: user ? user.fullName : 'Salesman',
          rejectionReason: reason || 'No reason provided'
        })
      });

      if (response.ok) {
        toast.success('Request rejected');
        loadRequests();
      } else {
        throw new Error('Failed to reject');
      }
    } catch (error) {
      toast.error('Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3"/> Pending</span>;
      case 'APPROVED':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1"><Check className="w-3 h-3"/> Approved</span>;
      case 'REJECTED':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center gap-1"><X className="w-3 h-3"/> Rejected</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  if (loading) {
    return <LoadingState message="Loading requests..." />;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeader
        title="Spare Part Requests"
        subtitle="Review and approve parts requested by technicians"
      />

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-12 text-center">
            <PackageSearch className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Requests Found</h3>
            <p className="text-gray-500">There are currently no spare part requests from technicians.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salesman Assigned</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString()}
                      <div className="text-xs text-gray-400">{new Date(request.createdAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{request.partName}</div>
                      <div className="text-sm text-gray-500">Qty: {request.quantity} | {request.deviceType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.requestedBy || 'Technician'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.supplier || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                      {request.notes && request.status === 'REJECTED' && (
                        <div className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {request.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {request.status === 'PENDING' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApprove(request.id)}
                            disabled={processingId === request.id}
                            className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded-md transition-colors disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            disabled={processingId === request.id}
                            className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Processed by {request.approvedBy || 'System'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
