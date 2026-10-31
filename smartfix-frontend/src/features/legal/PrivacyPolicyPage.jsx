// src/features/legal/PrivacyPolicyPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export const PrivacyPolicyPage = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: '1. Introduction',
      content: `Corex Ltd ("we", "our", "us") is committed to protecting the privacy and security of personal data processed through our AI-Powered Device Management System ("the System"). This Privacy Policy explains what data we collect, how we use it, how we protect it, and your rights as a data subject. This policy applies to all registered users of the System.`
    },
    {
      title: '2. Data We Collect',
      content: `We collect the following categories of data when you register and use the System:

Personal Identification Data:
• Full name, email address, phone number
• Role and department within Corex Ltd

System Activity Data:
• Login timestamps and session durations
• Actions performed within the System (e.g. inventory updates, repair entries, sales records)
• Error logs and system events

Operational Data:
• Inventory stock entries and adjustments
• Repair task records and diagnostic outputs
• Sales transactions and customer records
• Spare part requests and supplier interactions`
    },
    {
      title: '3. How We Use Your Data',
      content: `Your data is used solely for legitimate operational purposes within Corex Ltd, including:
• Granting and managing role-based access to the System
• Processing inventory, repair, and sales operations
• Generating reports and analytics for management oversight
• Detecting security threats or unauthorised access
• Complying with applicable laws and regulations
• Improving system performance and user experience

We do not use your personal data for advertising, profiling, or any purpose unrelated to the core operations of Corex Ltd.`
    },
    {
      title: '4. Data Sharing & Disclosure',
      content: `We do not sell, rent, or trade your personal data to any third parties. Data may be disclosed only in the following limited circumstances:
• To authorised Corex Ltd management and IT administrators for operational purposes
• To third-party service providers under strict data processing agreements (e.g. cloud hosting)
• When required by law, court order, or regulatory authority
• In connection with a business transfer, merger, or acquisition of Corex Ltd

All third parties engaged by Corex Ltd are required to handle your data in compliance with applicable data protection laws.`
    },
    {
      title: '5. Data Retention',
      content: `We retain personal data only for as long as necessary to fulfil the purposes for which it was collected. Specifically:
• Account data is retained for the duration of your employment and a reasonable period thereafter for audit purposes.
• Operational records (repair logs, sales, inventory) are retained for a minimum of 5 years for compliance and business continuity.
• Log and audit data is retained for 2 years.

Upon expiry of retention periods, data is securely deleted or anonymised.`
    },
    {
      title: '6. Data Security',
      content: `Corex Ltd implements appropriate technical and organisational measures to protect your data against unauthorised access, alteration, disclosure, or destruction. These measures include:
• Role-based access controls limiting data visibility to authorised personnel
• Encrypted transmission of data over secure connections (HTTPS)
• Regular system audits and security assessments
• Session management and automatic logout for inactive sessions

No data transmission over the internet is 100% secure. While we take all reasonable precautions, we cannot guarantee absolute security.`
    },
    {
      title: '7. Your Rights',
      content: `As a data subject, you have the following rights with respect to your personal data:
• Right of Access — You may request a copy of the personal data held about you.
• Right to Rectification — You may request correction of inaccurate or incomplete data.
• Right to Erasure — You may request deletion of your data where it is no longer necessary.
• Right to Restriction — You may request restriction of processing in certain circumstances.
• Right to Object — You may object to processing based on legitimate interests.

To exercise any of these rights, please contact the Corex Ltd system administrator or IT department.`
    },
    {
      title: '8. Cookies & Local Storage',
      content: `The System may use browser local storage to retain session tokens and user preferences for a better user experience. No tracking cookies or third-party advertising cookies are used. You may clear your browser storage at any time; however, this will log you out of the System.`
    },
    {
      title: '9. Changes to this Policy',
      content: `Corex Ltd may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. Users will be notified of significant changes via the System or by email. Continued use of the System after any changes constitutes acceptance of the updated policy.`
    },
    {
      title: '10. Contact Us',
      content: `If you have any questions, concerns, or requests regarding this Privacy Policy or how your personal data is handled, please contact:

Corex Ltd — IT Administration & Data Protection
Email: admin@corexltd.com
System: Use the internal support channel within the Corex Ltd Device Management System.`
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
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
              <p className="text-sm text-gray-500">Corex Ltd — AI-Powered Device Management System</p>
            </div>
          </div>

          <div className="mt-2 mb-8 pb-6 border-b border-gray-100">
            <p className="text-xs text-gray-400">Last updated: April 2026 &nbsp;|&nbsp; Version 1.0</p>
          </div>

          <p className="text-sm text-gray-600 mb-8 leading-relaxed">
            This Privacy Policy describes how Corex Ltd collects, uses, stores, and protects your personal
            information when you use our AI-Powered Device Management System. Your privacy is important to us.
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
