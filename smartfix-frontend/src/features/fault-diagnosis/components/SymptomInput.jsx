// src/features/fault-diagnosis/components/SymptomInput.jsx
import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

const looksLikeGibberish = (text) => {
  if (!text || text.trim().length < 5) return false;
  const t = text.trim();
  if (/^(.)\1{4,}$/.test(t)) return true;
  const clean = t.replace(/\s/g, '').toLowerCase();
  const uniqueChars = new Set(clean.split(''));
  if (uniqueChars.size < 3 && clean.length > 8) return true;
  const words = t.split(/\s+/);
  if (words.length > 3) {
    const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
    if (uniqueWords < 2) return true;
  }
  if (clean.length > 10 && !/[aeiou]/i.test(clean)) return true;
  return false;
};

export const SymptomInput = ({ onSubmit, serverError }) => {
  const [symptomText, setSymptomText] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [localError, setLocalError] = useState('');

  const commonSymptoms = {
    'No Power': 'Device does not turn on or respond to power button',
    'Overheating': 'Device gets unusually hot during normal use',
    'Slow Performance': 'Device runs slowly, lags, or freezes frequently',
    'Screen Issues': 'Display problems, flickering, dead pixels, or cracks',
    'Battery Drain': 'Battery discharges quickly or doesn\'t hold charge',
    'No Sound': 'No audio output from speakers or headphone jack',
    'Connectivity': 'WiFi, Bluetooth, or other connection problems',
    'Blue Screen': 'System crashes with blue screen error'
  };

  const handleSymptomToggle = (symptom) => {
    setLocalError('');
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');
    const additionalNotes = symptomText.trim();

    if (selectedSymptoms.length === 0 && !additionalNotes) {
      setLocalError('Please select at least one symptom or describe the issue.');
      return;
    }

    if (selectedSymptoms.length === 0 && looksLikeGibberish(additionalNotes)) {
      setLocalError(
        'Your input looks like random characters. Please describe the actual fault — e.g. "screen is cracked" or "won\'t turn on".'
      );
      return;
    }

    onSubmit({ selectedSymptoms, additionalNotes });
  };

  const displayError = serverError || localError;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Common Symptoms
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(commonSymptoms).map(([symptom, description]) => (
            <button
              key={symptom}
              type="button"
              onClick={() => handleSymptomToggle(symptom)}
              className={`p-3 text-left rounded-lg border transition-all ${
                selectedSymptoms.includes(symptom)
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                  : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium">{symptom}</div>
              <div className="text-xs text-gray-500 mt-1">{description}</div>
            </button>
          ))}
        </div>
      </div>

      {selectedSymptoms.length > 0 && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-800">
            Selected: {selectedSymptoms.join(', ')}
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Describe Additional Symptoms
        </label>
        <textarea
          value={symptomText}
          onChange={(e) => { setSymptomText(e.target.value); setLocalError(''); }}
          placeholder="e.g. The screen flickers and the battery drains in 2 hours..."
          rows="4"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            displayError ? 'border-red-400' : 'border-gray-300'
          }`}
        />
      </div>

      {displayError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>{displayError}</p>
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        Analyze Symptoms →
      </button>
    </form>
  );
};