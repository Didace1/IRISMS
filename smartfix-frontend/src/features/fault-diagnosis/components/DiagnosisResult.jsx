// src/features/fault-diagnosis/components/DiagnosisResult.jsx
import React, { useState } from 'react';
import {
  Download, AlertTriangle, Wrench, ShieldAlert, Clock,
  DollarSign, CheckCircle2, ChevronRight, Cpu, Laptop, Smartphone, Monitor
} from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/formatters';

const SEVERITY_STYLES = {
  high:    { bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-200',    label: 'High' },
  medium:  { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', label: 'Medium' },
  low:     { bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-200',  label: 'Low' },
  unknown: { bg: 'bg-gray-100',   text: 'text-gray-600',   border: 'border-gray-200',   label: 'Unknown' },
};

const DEVICE_ICONS = {
  laptop: Laptop,
  smartphone: Smartphone,
  tablet: Monitor,
};

export const DiagnosisResult = ({ diagnosis, repairRecommendations, onGenerateReport, onAskFollowUp, onNewDiagnosis, deviceInfo }) => {
  const [chatInput, setChatInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);

  const confidence = Math.round((diagnosis?.confidence || 0) * 100);
  const severityKey = (diagnosis?.severityLevel || 'unknown').toLowerCase();
  const severity = SEVERITY_STYLES[severityKey] || SEVERITY_STYLES.unknown;
  const altFaults = (diagnosis?.alternativeFaults || []).filter(f => f?.fault && f?.probability > 0).slice(0, 3);
  const components = (diagnosis?.affectedComponents || []).filter(Boolean);
  const rec = repairRecommendations;

  const handleFollowUpSubmit = async (event) => {
    event.preventDefault();
    const trimmedQuestion = chatInput.trim();
    if (!trimmedQuestion || isAsking) return;

    const typingId = `typing-${Date.now()}`;
    setChatMessages((prev) => [
      ...prev,
      { role: 'user', text: trimmedQuestion },
      { id: typingId, role: 'assistant', isTyping: true }
    ]);
    setChatInput('');
    setIsAsking(true);

    try {
      const waitMs = new Promise((resolve) => setTimeout(resolve, 3000));
      if (onAskFollowUp) {
        const [answer] = await Promise.all([onAskFollowUp(trimmedQuestion), waitMs]);
        setChatMessages((prev) => prev.map((m) =>
          m.id === typingId ? { role: 'assistant', text: answer || 'No answer returned.' } : m
        ));
      } else {
        await waitMs;
        setChatMessages((prev) => prev.map((m) =>
          m.id === typingId ? { role: 'assistant', text: 'Follow-up chat is not connected.' } : m
        ));
      }
    } catch (err) {
      setChatMessages((prev) => prev.map((m) =>
        m.id === typingId ? { role: 'assistant', text: err?.message || 'Unable to get answer.' } : m
      ));
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">AI Diagnosis Report</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onNewDiagnosis}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
          >
            <Wrench className="w-4 h-4" /> New Diagnosis
          </button>
          <button
            onClick={onGenerateReport}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" /> Download Report
          </button>
        </div>
      </div>

      {/* ── Device Info Banner ── */}
      {deviceInfo && (deviceInfo.type || deviceInfo.brand || deviceInfo.model) && (() => {
        const DeviceIcon = DEVICE_ICONS[(deviceInfo.type || '').toLowerCase()] || Monitor;
        return (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <DeviceIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-indigo-500 font-medium uppercase tracking-wide">Diagnosed Device</p>
              <p className="text-base font-semibold text-indigo-900 truncate">
                {deviceInfo.brand} {deviceInfo.model}
              </p>
              <p className="text-xs text-indigo-400 capitalize">{deviceInfo.type}</p>
            </div>
          </div>
        );
      })()}

      {/* ── 1. Diagnosis Summary ── */}
      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-5">
        {diagnosis?.personalizedGreeting && (
          <p className="text-blue-200 text-sm mb-2">{diagnosis.personalizedGreeting}</p>
        )}
        <p className="text-xs text-blue-300 uppercase tracking-wide mb-1">Primary Diagnosis</p>
        <p className="text-2xl font-bold leading-tight">{diagnosis?.primaryFault || 'Unknown fault'}</p>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-sm">
            <span className="font-semibold">{confidence}%</span>
            <span className="text-blue-200">confidence</span>
          </div>
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${severity.bg} ${severity.text}`}>
            <AlertTriangle className="w-3.5 h-3.5" />
            {severity.label} severity
          </div>
          {diagnosis?.urgency && diagnosis.urgency !== 'normal' && (
            <div className="bg-red-500/80 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              {diagnosis.urgency}
            </div>
          )}
        </div>
        {diagnosis?.reportedSymptoms && (
          <div className="mt-4 bg-white/10 rounded-lg p-3">
            <p className="text-xs text-blue-300 mb-1">Reported symptoms</p>
            <p className="text-sm text-white">{diagnosis.reportedSymptoms}</p>
          </div>
        )}
      </div>

      {/* ── 2. Component Failure Prediction ── */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-orange-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Component Failure Prediction</h3>
        </div>

        {components.length > 0 ? (
          <div className="mb-4">
            <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">Components at risk</p>
            <div className="flex flex-wrap gap-2">
              {components.map((c, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 text-orange-700 text-sm rounded-lg font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                  {c}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic mb-4">No specific components identified.</p>
        )}

        {altFaults.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 font-medium mb-3 uppercase tracking-wide">Other possible faults</p>
            <div className="space-y-2.5">
              {altFaults.map((f, i) => {
                const pct = Math.round((f.probability || 0) * 100);
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{f.fault}</span>
                      <span className="text-gray-500 font-medium">{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {diagnosis?.recommendedActions?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">Recommended actions</p>
            <ul className="space-y-1.5">
              {diagnosis.recommendedActions.filter(Boolean).map((action, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <ChevronRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── 3. Repair Recommendation ── */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Wrench className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Repair Recommendation</h3>
          {rec?.faultType && (
            <span className="ml-auto text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
              {rec.faultType}
            </span>
          )}
        </div>

        {rec ? (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { icon: Clock,        label: 'Est. Time',    value: rec.estimatedTime ? `${rec.estimatedTime} min` : 'N/A' },
                { icon: DollarSign,   label: 'Est. Cost',    value: rec.estimatedCost ? formatCurrency(rec.estimatedCost) : 'N/A' },
                { icon: CheckCircle2, label: 'Success Rate', value: rec.successRate   ? `${rec.successRate}%`  : 'N/A' },
                { icon: AlertTriangle,label: 'Skill Level',  value: rec.skillLevel    || 'N/A' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                  <Icon className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {/* Repair steps */}
            {rec.repairProcedure?.filter(Boolean).length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">Repair Procedure</p>
                <ol className="space-y-2">
                  {rec.repairProcedure.filter(Boolean).map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Tools */}
            {rec.requiredTools?.filter(Boolean).length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">Required Tools</p>
                <div className="flex flex-wrap gap-2">
                  {rec.requiredTools.filter(Boolean).map((tool, i) => (
                    <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Parts */}
            {rec.requiredParts?.filter(p => p && p !== 'To be determined').length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">Spare Parts Needed</p>
                <div className="flex flex-wrap gap-2">
                  {rec.requiredParts.filter(Boolean).map((part, i) => (
                    <span key={i} className="px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-700 text-xs rounded-lg">
                      {part}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Safety precautions */}
            {rec.safetyPrecautions?.filter(Boolean).length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <p className="text-sm font-semibold text-red-700">Safety Precautions</p>
                </div>
                <ul className="space-y-1">
                  {rec.safetyPrecautions.filter(Boolean).map((s, i) => (
                    <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                      <span className="mt-1 w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            Loading repair recommendations from AI…
          </div>
        )}
      </div>

      {/* ── 4. Follow-up Chat ── */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-1">Ask a Follow-up Question</h3>
        <p className="text-sm text-gray-500 mb-4">
          If the diagnosis didn't solve the issue, describe what's still happening and the AI will re-analyse.
        </p>

        {chatMessages.length > 0 && (
          <div className="mb-4 max-h-72 overflow-y-auto space-y-3 pr-1">
            {chatMessages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-lg px-4 py-3 text-sm ${
                  message.role === 'user'
                    ? 'bg-blue-50 border border-blue-100 text-blue-900'
                    : 'bg-gray-50 border border-gray-200 text-gray-800'
                }`}
              >
                <p className="text-xs font-semibold mb-1 opacity-60 uppercase tracking-wide">
                  {message.role === 'user' ? 'You' : 'AI'}
                </p>
                {message.isTyping ? (
                  <div className="flex items-center gap-1 h-5">
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
                  </div>
                ) : (
                  <div className="space-y-1">
                    {String(message.text || '').split('\n').map((line, li) => {
                      const t = line.trim();
                      if (!t) return <div key={li} className="h-1.5" />;
                      if (t.endsWith(':') && !t.startsWith('-'))
                        return <p key={li} className="font-semibold text-gray-900 mt-1">{t}</p>;
                      if (t.startsWith('-'))
                        return <p key={li} className="pl-3 text-gray-700">{t}</p>;
                      return <p key={li}>{t}</p>;
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleFollowUpSubmit} className="space-y-3">
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="e.g. The fix didn't work — device still won't charge. What should I check next?"
            rows={3}
            className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <button
            type="submit"
            disabled={isAsking || !chatInput.trim()}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {isAsking ? 'AI is thinking…' : 'Send to AI'}
          </button>
        </form>
      </div>

    </div>
  );
};
