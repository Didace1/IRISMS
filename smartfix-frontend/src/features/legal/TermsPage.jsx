// src/features/legal/TermsPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export const TermsPage = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: `By creating an account or accessing the Corex Ltd AI-Powered Device Management System ("the System"), you agree to be bound by these Terms and Conditions. If you do not agree, you must not access or use the System. These terms apply to all staff members, operators, and administrators registered under Corex Ltd.`
    },
    {
      title: '2. Use of the System',
      content: `The System is provided exclusively for authorised employees of Corex Ltd for the purpose of device diagnostics, repair management, inventory control, and sales processing. Access is granted on a role-specific basis. You must not:
• Use the System for any purpose outside your assigned role.
• Share your login credentials with any other person.
• Attempt to access features or data beyond your permitted access level.
• Introduce malicious software, scripts, or automated bots into the System.`
    },
    {
      title: '3. User Accounts & Responsibilities',
      content: `Each user is responsible for maintaining the confidentiality of their account credentials. You are fully responsible for all activities that occur under your account. You must notify the system administrator immediately if you suspect any unauthorised access or breach of your account. Corex Ltd reserves the right to suspend or terminate any account that violates these terms.`
    },
    {
      title: '4. Data Entry & Accuracy',
      content: `Users are responsible for the accuracy of all data entered into the System, including inventory records, repair logs, customer details, and sales transactions. Deliberate entry of false or misleading data may result in disciplinary action in accordance with Corex Ltd's internal policies.`
    },
    {
      title: '5. Intellectual Property',
      content: `All software, algorithms, AI models, interfaces, and content forming part of the Corex Ltd Device Management System are the exclusive intellectual property of Corex Ltd or its licensors. You may not copy, modify, distribute, sell, or reverse-engineer any part of the System without explicit written consent from Corex Ltd management.`
    },
    {
      title: '6. Confidentiality',
      content: `All data accessible through the System — including customer records, financial figures, inventory details, repair histories, and employee information — is strictly confidential. Users must not disclose, share, or export this data to unauthorised parties inside or outside the organisation. Obligations of confidentiality continue after termination of employment.`
    },
    {
      title: '7. System Availability',
      content: `Corex Ltd will endeavour to keep the System operational at all times, but does not guarantee uninterrupted availability. Scheduled maintenance, upgrades, or unforeseen technical issues may temporarily affect access. Corex Ltd shall not be liable for any loss arising from System downtime.`
    },
    {
      title: '8. Monitoring & Audit',
      content: `Corex Ltd reserves the right to monitor, log, and audit all activities performed within the System for security, compliance, and performance purposes. By using the System, you consent to this monitoring. Audit logs may be used in disciplinary or legal proceedings where appropriate.`
    },
    {
      title: '9. Termination of Access',
      content: `Corex Ltd may terminate or suspend your access to the System at any time, with or without notice, for conduct that violates these Terms or is otherwise harmful to the organisation, other users, or third parties. Upon termination of employment, all System access will be revoked immediately.`
    },
    {
      title: '10. Changes to Terms',
      content: `Corex Ltd reserves the right to modify these Terms and Conditions at any time. Users will be notified of material changes. Continued use of the System after changes are posted constitutes acceptance of the revised terms.`
    },
    {
      title: '11. Governing Law',
      content: `These Terms and Conditions are governed by and construed in accordance with the applicable laws of the jurisdiction in which Corex Ltd operates. Any disputes arising from the use of this System shall be subject to the exclusive jurisdiction of the competent courts of that jurisdiction.`
    },
    {
      title: '12. Contact',
      content: `For questions regarding these Terms and Conditions, please contact the Corex Ltd IT Administration team or your designated system administrator.`
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Terms and Conditions</h1>
              <p className="text-sm text-gray-500">Corex Ltd — AI-Powered Device Management System</p>
            </div>
          </div>

          <div className="mt-2 mb-8 pb-6 border-b border-gray-100">
            <p className="text-xs text-gray-400">Last updated: April 2026 &nbsp;|&nbsp; Version 1.0</p>
          </div>

          <p className="text-sm text-gray-600 mb-8 leading-relaxed">
            Please read these Terms and Conditions carefully before using the Corex Ltd Device Management System.
            These terms govern your use of the System and form a binding agreement between you and Corex Ltd.
          </p>

          <div className="space-y-8">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-base font-semibold text-gray-900 mb-2">{section.title}</h2>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{section.content}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} Corex Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
