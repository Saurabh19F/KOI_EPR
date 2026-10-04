'use client';

import { useState } from 'react';
import { Book, Video, MessageCircle, Mail, Phone, ChevronRight, Search, ExternalLink, FileText, HelpCircle, Zap, Users, ShoppingCart, Package, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface HelpTopic {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: string;
  articles: { title: string; readTime: string }[];
}

const helpTopics: HelpTopic[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics of KOI ERP',
    icon: Zap,
    category: 'Basics',
    articles: [
      { title: 'Quick Start Guide', readTime: '5 min' },
      { title: 'Dashboard Overview', readTime: '3 min' },
      { title: 'Setting Up Your Profile', readTime: '2 min' },
      { title: 'Understanding the Navigation', readTime: '3 min' },
    ],
  },
  {
    id: 'masters',
    title: 'Masters & Setup',
    description: 'Configure your master data',
    icon: Package,
    category: 'Configuration',
    articles: [
      { title: 'Creating Products', readTime: '4 min' },
      { title: 'Adding Customers & Vendors', readTime: '5 min' },
      { title: 'Setting Up GST Rates', readTime: '3 min' },
      { title: 'Configuring Currencies', readTime: '4 min' },
    ],
  },
  {
    id: 'sales',
    title: 'Sales & Enquiries',
    description: 'Manage your sales pipeline',
    icon: ShoppingCart,
    category: 'Sales',
    articles: [
      { title: 'Creating a New Enquiry', readTime: '5 min' },
      { title: 'Tracking Enquiry Status', readTime: '3 min' },
      { title: 'Generating Quotes', readTime: '4 min' },
      { title: 'Approval Workflows', readTime: '6 min' },
    ],
  },
  {
    id: 'reports',
    title: 'Reports & Analytics',
    description: 'Generate business reports',
    icon: TrendingUp,
    category: 'Reports',
    articles: [
      { title: 'Dashboard Analytics', readTime: '4 min' },
      { title: 'GST Reports (GSTR-1, GSTR-3B)', readTime: '7 min' },
      { title: 'Sales & Purchase Reports', readTime: '5 min' },
      { title: 'Exporting Reports', readTime: '2 min' },
    ],
  },
];

const faqs = [
  {
    q: 'How do I reset my password?',
    a: 'Click on your profile picture in the top-right corner, select "Settings", then navigate to "Security" tab. Click "Change Password" and follow the prompts.',
  },
  {
    q: 'Can I add multiple users to my account?',
    a: 'Yes! Navigate to Administration > Users to add team members. You can assign different roles and permissions to each user.',
  },
  {
    q: 'How does multi-currency work?',
    a: 'Go to Masters > Currencies to add currencies and their exchange rates. When creating enquiries or quotes, you can select the currency for each transaction.',
  },
  {
    q: 'What is the approval workflow?',
    a: 'Approval workflows allow you to set up multi-level hierarchies for quote approvals. Configure this in FMS > Workflows based on your business requirements.',
  },
  {
    q: 'How do I generate GST reports?',
    a: 'Navigate to Reports > GST Reports. Select the financial period and the report type (GSTR-1, GSTR-3B, or Tax Liability).',
  },
  {
    q: 'Can I track inventory batches?',
    a: 'Yes! Enable batch tracking in Settings, then use the Inventory > Batch Tracking module to manage batch numbers, expiry dates, and stock movements.',
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const filteredTopics = helpTopics.filter(topic =>
    topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        {/* Page Header */}
        <div className="text-center space-y-4 py-8 bg-gradient-to-b from-amber-50 to-transparent rounded-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
            <HelpCircle className="h-4 w-4" />
            Help Center
          </div>
          <h1 className="text-3xl font-bold text-slate-900">How can we help you?</h1>
          <p className="text-slate-500 max-w-lg mx-auto">
            Search our knowledge base or browse categories below to find answers
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-sm"
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Book, label: 'Documentation', desc: 'Full documentation', color: 'bg-blue-50 text-blue-600' },
            { icon: Video, label: 'Video Tutorials', desc: 'Step-by-step guides', color: 'bg-purple-50 text-purple-600' },
            { icon: MessageCircle, label: 'Community', desc: 'Ask questions', color: 'bg-emerald-50 text-emerald-600' },
          ].map((link, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${link.color}`}>
                  <link.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{link.label}</p>
                  <p className="text-xs text-slate-500">{link.desc}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 ml-auto" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Help Topics */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Browse by Topic</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTopics.map(topic => {
              const Icon = topic.icon;
              const isExpanded = expandedTopic === topic.id;
              return (
                <Card key={topic.id} className="overflow-hidden">
                  <button
                    onClick={() => setExpandedTopic(isExpanded ? null : topic.id)}
                    className="w-full text-left"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-amber-50 rounded-xl">
                          <Icon className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <Badge variant="outline" className="text-xs mb-1">{topic.category}</Badge>
                              <h3 className="font-semibold text-slate-900">{topic.title}</h3>
                              <p className="text-sm text-slate-500 mt-0.5">{topic.description}</p>
                            </div>
                            <ChevronRight className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-2">
                      {topic.articles.map((article, i) => (
                        <a
                          key={i}
                          href="#"
                          className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-amber-50 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-slate-400 group-hover:text-amber-500" />
                            <span className="text-sm text-slate-700">{article.title}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400">{article.readTime}</span>
                            <ExternalLink className="h-3 w-3 text-slate-300" />
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* FAQs */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
          <Card>
            <CardContent className="p-0 divide-y divide-slate-100">
              {faqs.map((faq, i) => (
                <div key={i}>
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
                  >
                    <span className="font-medium text-slate-900 pr-4">{faq.q}</span>
                    <ChevronRight className={`h-5 w-5 text-slate-400 flex-shrink-0 transition-transform ${expandedFaq === i ? 'rotate-90' : ''}`} />
                  </button>
                  {expandedFaq === i && (
                    <div className="px-5 pb-5">
                      <p className="text-sm text-slate-600 leading-relaxed pl-4 border-l-2 border-amber-200">
                        {faq.a}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Contact Support */}
        <Card className="bg-gradient-to-r from-amber-500 to-orange-500 border-0 text-white">
          <CardContent className="p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold">Still need help?</h3>
              <p className="text-amber-100 mt-1">Our support team is available Mon-Sat, 9 AM - 7 PM IST</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-amber-600 rounded-xl font-medium hover:bg-amber-50 transition-colors">
                <Mail className="h-4 w-4" />
                Email Support
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-white/20 text-white rounded-xl font-medium hover:bg-white/30 transition-colors">
                <Phone className="h-4 w-4" />
                Request Call
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
