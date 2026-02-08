/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
import { useState, useRef } from 'react';
import { ChevronLeft, ChevronDown, ChevronUp, Shield, FileText, Home, MoreHorizontal, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTranslation } from './translations.js';
import { useLanguage } from './LanguageContext.jsx';
import SharedBottomBar from './components/SharedBottomBar.jsx';

// Bottom navigation bar component - removed, now using SharedBottomBar

const Policies = () => {
    const navigate = useNavigate();
    const { selectedLanguage } = useLanguage();
    const [activeTab, setActiveTab] = useState('privacy');
    const [expandedSections, setExpandedSections] = useState({});

    const toggleSection = (id) => {
        setExpandedSections(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const privacySections = [
        {
            id: 'data-collection',
            title: 'Data Collection and Use',
            content: 'Regaarder collects information you provide directly (profile, contact details) and automatically (IP address, device information, usage patterns). We use this data to operate the platform, improve services, process payments, and comply with legal obligations. Your data is essential for creator-fan interactions, content recommendations, and fraud prevention.'
        },
        {
            id: 'video-content',
            title: 'Video Content and Storage',
            content: 'Videos uploaded to Regaarder are stored securely on our servers. You retain ownership of your content but grant us a license to display, distribute, and analyze it on our platform. Videos may be accessed by creators you interact with and users you share content with. We use automated systems to detect prohibited content.'
        },
        {
            id: 'payment-info',
            title: 'Payment Information',
            content: 'Payment processing is handled by secure third-party payment providers. We do not store full credit card information on our servers. Payment data is encrypted and processed according to PCI DSS standards. Creators receive earnings through verified payment methods. All transactions are logged for accounting and dispute resolution.'
        },
        {
            id: 'user-data-sharing',
            title: 'Data Sharing and Third Parties',
            content: 'We share data with payment processors, analytics providers, and hosting services necessary to operate Regaarder. We do not sell personal data to advertisers or brokers. Creator profiles may be publicly visible depending on privacy settings. Shared profile links may expose certain profile information to recipients.'
        },
        {
            id: 'cookies',
            title: 'Cookies and Tracking',
            content: 'Regaarder uses cookies and similar technologies to authenticate users, remember preferences, and analyze platform usage. You can control cookie settings in your browser. Some features may not work properly if cookies are disabled. We use analytics to understand user behavior and improve the platform.'
        },
        {
            id: 'data-security',
            title: 'Data Security',
            content: 'We implement industry-standard security measures including encryption, firewalls, and secure data centers. However, no system is completely secure. We maintain backups and have incident response procedures. Users are responsible for keeping their passwords confidential. Report security vulnerabilities responsibly to our security team.'
        },
        {
            id: 'data-retention',
            title: 'Data Retention',
            content: 'We retain user data as long as your account is active and as needed for legal compliance. Deleted account data is removed within 30 days, though backups may be retained longer. Videos may persist in shared links or archived copies. You can request data deletion subject to legal obligations.'
        },
        {
            id: 'user-rights',
            title: 'Your Rights',
            content: 'You have the right to access, correct, and delete your personal data. You can export your data in standard formats. You may opt-out of marketing communications. For GDPR/CCPA compliance, submit requests through your account settings. Response time is typically 30 days.'
        },
        {
            id: 'children',
            title: 'Children\'s Privacy',
            content: 'Regaarder is not intended for users under 13 years old. We do not knowingly collect data from children. If we discover a child is using the platform, we will delete their account and associated data. Parents concerned about their child\'s usage should contact us immediately. Age verification is required for creator accounts.'
        },
        {
            id: 'policy-changes',
            title: 'Policy Changes',
            content: 'We may update this Privacy Policy periodically. Significant changes will be notified via email or prominent notice on the platform. Continued use after changes constitutes acceptance. Policy history is available on request. We recommend reviewing this policy regularly for updates.'
        }
    ];

    const termsSections = [
        {
            id: 'agreement',
            title: 'Agreement to Terms',
            content: 'By accessing and using Regaarder, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree with any part, do not use the platform. We reserve the right to refuse service to anyone. Use of Regaarder indicates acceptance of all terms.'
        },
        {
            id: 'account',
            title: 'Account Creation and Responsibility',
            content: 'You must be at least 13 years old to create an account. Provide accurate, complete information. You are responsible for maintaining password confidentiality and all activities under your account. Notify us immediately of unauthorized access. Do not share your account with others. One person per account.'
        },
        {
            id: 'content-rules',
            title: 'Content Guidelines',
            content: 'Prohibited content includes: illegal material, violence, harassment, hate speech, explicit sexual content, spam, malware, and intellectual property violations. You must own or have rights to all content you upload. Violating content will be removed. Repeated violations may result in account suspension or termination.'
        },
        {
            id: 'creator-conduct',
            title: 'Creator and Fan Conduct',
            content: 'Creators must deliver promised content in good faith and fulfill requests timely. Do not engage in fraud, harassment, or abuse. Fans must respect creator\'s content and terms. Do not misrepresent yourself or your intentions. Any unethical conduct may result in account penalties.'
        },
        {
            id: 'payments',
            title: 'Payments and Refunds',
            content: 'Payments are processed through our payment partners. Creators receive 85% of revenue; 15% covers platform fees and payment processing. Refunds are available within 14 days for cancelled requests. Disputes must be raised within 30 days. Payment holds may be placed for fraud investigation.'
        },
        {
            id: 'intellectual-property',
            title: 'Intellectual Property Rights',
            content: 'You retain rights to content you create. By uploading, you grant Regaarder a non-exclusive license to display, distribute, and promote your content. Third-party content must have proper licensing. Unauthorized use of copyrighted material will result in removal and account action. Report IP infringement via our process.'
        },
        {
            id: 'limitations',
            title: 'Limitation of Liability',
            content: 'Regaarder is provided "as is" without warranties. We are not liable for indirect, incidental, or consequential damages. Our total liability is limited to the amount you paid in the last 12 months. Some jurisdictions limit liability disclaimers. Users assume all risk for platform use.'
        },
        {
            id: 'service-availability',
            title: 'Service Availability',
            content: 'We strive for continuous service but do not guarantee uninterrupted availability. Maintenance, updates, or technical issues may cause downtime. We are not liable for data loss during outages. Critical features are backed up. Emergency notifications will be posted on our status page.'
        },
        {
            id: 'termination',
            title: 'Termination of Service',
            content: 'We may terminate or suspend your account for violation of these terms, illegal activity, or non-use. You may delete your account anytime. Upon termination, you lose access to content and services. Outstanding payments remain due. Account deletion is permanent after 30 days.'
        },
        {
            id: 'disputes',
            title: 'Dispute Resolution',
            content: 'Disputes are governed by the laws of [Jurisdiction]. You agree to attempt resolution through good-faith negotiation first. If unresolved, disputes may proceed to binding arbitration. Class action waivers may apply. Legal fees may be awarded to prevailing parties.'
        }
    ];

    const SectionItem = ({ section }) => (
        <div className="border-b border-gray-200 last:border-b-0">
            <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition"
            >
                <h3 className="text-lg font-semibold text-gray-900 text-left flex-1">
                    {getTranslation(section.title, selectedLanguage)}
                </h3>
                {expandedSections[section.id] ? (
                    <ChevronUp size={24} className="text-gray-500 flex-shrink-0 ml-2" />
                ) : (
                    <ChevronDown size={24} className="text-gray-500 flex-shrink-0 ml-2" />
                )}
            </button>
            {expandedSections[section.id] && (
                <div className="px-4 pb-4 text-gray-700 leading-relaxed max-w-4xl">
                    {getTranslation(section.content, selectedLanguage)}
                </div>
            )}
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto min-h-screen bg-gray-50 font-sans">
            {/* Header */}
                        <header
                            className="bg-white border-b border-gray-100 p-4 sticky top-0 z-20"
                            style={{ paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}
                        >
                <div className="flex items-center space-x-4">
                    <ChevronLeft
                        className="w-6 h-6 text-gray-700 cursor-pointer transition hover:text-gray-900"
                        onClick={() => {
                            try { if (typeof window !== 'undefined' && typeof window.setFooterTab === 'function') window.setFooterTab('home'); } catch (e) { }
                            try { navigate('/home', { replace: true }); } catch (e) { }
                        }}
                    />
                    <h1 className="text-2xl font-semibold text-gray-800">{getTranslation('Policies', selectedLanguage)}</h1>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-t border-gray-200 mt-4">
                    <button
                        onClick={() => setActiveTab('privacy')}
                        className={`flex-1 px-4 py-3 font-semibold text-center transition ${
                            activeTab === 'privacy'
                                ? 'text-[var(--color-gold)] border-b-2 border-[var(--color-gold)]'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Shield size={20} />
                            {getTranslation('Privacy Policy', selectedLanguage)}
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('terms')}
                        className={`flex-1 px-2 py-3 font-semibold text-center transition ${
                            activeTab === 'terms'
                                ? 'text-[var(--color-gold)] border-b-2 border-[var(--color-gold)]'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                            <FileText size={20} />
                            <span className="text-sm">{getTranslation('T&C', selectedLanguage)}</span>
                        </div>
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="pb-32">
                {/* Privacy Policy */}
                {activeTab === 'privacy' && (
                    <div className="max-w-4xl mx-auto">
                        {/* Intro Section */}
                        <div className="bg-white m-4 rounded-lg p-6 shadow-sm">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">{getTranslation('Privacy Policy', selectedLanguage)}</h2>
                            <p className="text-gray-700 mb-4">
                                {getTranslation('Last Updated: January 15, 2026', selectedLanguage)}
                            </p>
                            <p className="text-gray-600 leading-relaxed">
                                {getTranslation('At Regaarder, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. Please read this policy carefully to understand our practices regarding your personal data.', selectedLanguage)}
                            </p>
                        </div>

                        {/* Expandable Sections */}
                        <div className="bg-white m-4 rounded-lg shadow-sm">
                            {privacySections.map(section => (
                                <SectionItem key={section.id} section={section} />
                            ))}
                        </div>

                        {/* Contact Section */}
                        <div className="bg-white m-4 rounded-lg p-6 shadow-sm">
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">{getTranslation('Contact Us', selectedLanguage)}</h3>
                            <p className="text-gray-700">
                                {getTranslation('If you have questions about this Privacy Policy or our practices, contact us at:', selectedLanguage)}
                            </p>
                            <p className="mt-3 text-gray-700">
                                <strong>{getTranslation('Email:', selectedLanguage)}</strong> regaarder@gmail.com<br />
                                <strong>{getTranslation('Address:', selectedLanguage)}</strong> {getTranslation('Regaarder, Inc.', selectedLanguage)}<br />
                                <strong>{getTranslation('Response Time:', selectedLanguage)}</strong> {getTranslation('24 hours', selectedLanguage)}
                            </p>
                        </div>
                    </div>
                )}

                {/* Terms & Conditions */}
                {activeTab === 'terms' && (
                    <div className="max-w-4xl mx-auto">
                        {/* Intro Section */}
                        <div className="bg-white m-4 rounded-lg p-6 shadow-sm">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">{getTranslation('Terms & Conditions', selectedLanguage)}</h2>
                            <p className="text-gray-700 mb-4">
                                {getTranslation('Last Updated: January 15, 2026', selectedLanguage)}
                            </p>
                            <p className="text-gray-600 leading-relaxed">
                                {getTranslation('Welcome to Regaarder. These Terms and Conditions govern your use of our platform and services. By accessing or using Regaarder, you agree to be bound by these terms. If you do not accept these terms, please do not use the platform.', selectedLanguage)}
                            </p>
                        </div>

                        {/* Expandable Sections */}
                        <div className="bg-white m-4 rounded-lg shadow-sm">
                            {termsSections.map(section => (
                                <SectionItem key={section.id} section={section} />
                            ))}
                        </div>

                        {/* Disclaimer Section */}
                        <div className="bg-amber-50 m-4 rounded-lg p-6 border border-amber-200">
                            <h3 className="text-lg font-semibold text-amber-900 mb-3">Important Disclaimer</h3>
                            <p className="text-amber-800">
                                Regaarder is a community platform. While we take precautions to protect users, we are not responsible for creator conduct or content quality. Users engage at their own risk. Report violations immediately through our moderation system. We reserve the right to modify these terms at any time with notice.
                            </p>
                        </div>

                        {/* Contact Section */}
                        <div className="bg-white m-4 rounded-lg p-6 shadow-sm">
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">{getTranslation('Contact Us', selectedLanguage)}</h3>
                            <p className="text-gray-700">
                                {getTranslation('For questions about these Terms & Conditions, contact us at:', selectedLanguage)}
                            </p>
                            <p className="mt-3 text-gray-700">
                                <strong>{getTranslation('Email:', selectedLanguage)}</strong> regaarder@gmail.com<br />
                                <strong>{getTranslation('Address:', selectedLanguage)}</strong> {getTranslation('Regaarder, Inc.', selectedLanguage)}<br />
                                <strong>{getTranslation('Response Time:', selectedLanguage)}</strong> {getTranslation('24 hours', selectedLanguage)}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <SharedBottomBar selectedLanguage={selectedLanguage} />
        </div>
    );
};

export default Policies;
