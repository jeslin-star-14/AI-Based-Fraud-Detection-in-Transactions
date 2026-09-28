import { MapPin, Monitor, Mail, Package, CreditCard, ChevronRight, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

const TransactionDetail = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [orderReviewExpanded, setOrderReviewExpanded] = useState(true);
  const [caseNotesExpanded, setCaseNotesExpanded] = useState(true);
  const [newNote, setNewNote] = useState('');

  const caseNotes = [
    {
      title: 'Case Submitted for Quarantine',
      author: "Harry's Living • Production",
      date: '24-10-19',
    },
    {
      title: 'Case Approval for Quarantine',
      author: 'Signifyd',
      date: '3h-10-19',
    },
  ];

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">Jeff Henry</h1>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                $234.22
              </span>
              <div className="flex items-center space-x-1 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span className="text-sm font-bold text-green-600">987</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-2 text-sm text-gray-500">
              <span className="font-mono">#3G327H</span>
              <span>•</span>
              <span>Updated at 11-10-2020</span>
            </div>
          </div>
          
          <button className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
            UPDATE ADDRESS
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-8 mt-6 border-b border-gray-200 -mb-px">
          {['OVERVIEW', 'SUMMARY', 'DETAILS', 'HISTORY'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.toLowerCase()
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
              {activeTab === tab.toLowerCase() && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Overview */}
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Overview</h2>
              
              <div className="grid grid-cols-3 gap-6">
                {/* Address */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <h3 className="text-sm font-semibold text-gray-900 uppercase">Address</h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Shipping and Billing<br />
                    Address confirmed
                  </p>
                  <div className="flex items-center space-x-2 mt-3">
                    <div className="flex items-center space-x-1 px-2 py-1 bg-blue-50 rounded">
                      <Package className="w-3 h-3 text-blue-600" />
                      <span className="text-xs font-medium text-blue-600">3</span>
                    </div>
                    <div className="flex items-center space-x-1 px-2 py-1 bg-blue-50 rounded">
                      <CreditCard className="w-3 h-3 text-blue-600" />
                      <span className="text-xs font-medium text-blue-600">3</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-3">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* Device */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Monitor className="w-5 h-5 text-gray-400" />
                    <h3 className="text-sm font-semibold text-gray-900 uppercase">Device</h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Uses Multiple devices,<br />
                    Evidence is of 3 Macs
                  </p>
                  <div className="flex items-center space-x-1 mt-3 px-2 py-1 bg-blue-50 rounded inline-flex">
                    <Monitor className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-600">3</span>
                  </div>
                  <div className="mt-3">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <h3 className="text-sm font-semibold text-gray-900 uppercase">Email</h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Across all merchant<br />
                    Signifyd has found of total<br />
                    23 orders from this account
                  </p>
                  <div className="flex items-center space-x-1 mt-3 px-2 py-1 bg-blue-50 rounded inline-flex">
                    <Mail className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-600">4</span>
                  </div>
                  <div className="flex items-center space-x-3 mt-3">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Account Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Account Summary</h2>
              
              <div className="grid grid-cols-2 gap-8">
                {/* Account Info */}
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 uppercase font-medium">Account</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Number</span>
                      <span className="text-sm font-medium text-gray-900">130942</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Order Count</span>
                      <span className="text-sm font-medium text-gray-900">23</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Order Amount</span>
                      <span className="text-sm font-medium text-gray-900">$233.2</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Creation</span>
                      <span className="text-sm font-medium text-gray-900">05-27-2020</span>
                    </div>
                  </div>
                </div>

                {/* Shipping Address with Map */}
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 uppercase font-medium">Shipping</span>
                    <a href="#" className="text-blue-600 hover:underline text-xs">23 Street</a>
                  </div>
                  
                  {/* Mini Map */}
                  <div className="relative h-32 bg-gray-100 rounded-lg overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-full h-full opacity-20" viewBox="0 0 200 150">
                        <path d="M10,80 Q50,20 100,80 T190,80" stroke="#3b82f6" strokeWidth="2" fill="none" />
                        <path d="M20,100 Q60,60 100,100 T180,100" stroke="#93c5fd" strokeWidth="1" fill="none" />
                        <circle cx="100" cy="75" r="8" fill="#3b82f6" />
                      </svg>
                    </div>
                    <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded text-xs font-medium text-gray-600">
                      Trader Joe's
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-600 leading-relaxed">
                    2471 Henry, OH Island Extensions Suite 766
                    102209<br />
                    USA
                  </p>
                </div>
              </div>

              {/* Order Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-gray-600 uppercase font-medium">Order</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-600">Product</span>
                    </div>
                    <div className="flex items-center space-x-8">
                      <span className="text-sm font-medium text-gray-900 uppercase">Price</span>
                      <span className="text-sm font-medium text-gray-900 uppercase w-8 text-center">Qty</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <span className="text-sm text-gray-900">Nike Jordan A50 - 676278</span>
                    <div className="flex items-center space-x-8">
                      <span className="text-sm font-medium text-gray-900">$233.2</span>
                      <span className="text-sm text-gray-600 w-8 text-center">02</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <span className="text-sm text-gray-900">AirPod - Black Matte - 643278</span>
                    <div className="flex items-center space-x-8">
                      <span className="text-sm font-medium text-gray-900">$143.3</span>
                      <span className="text-sm text-gray-600 w-8 text-center">01</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Team & Customer */}
              <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-600 uppercase">Team</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">Howesville</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-600 uppercase">Customer</span>
                  <span className="text-sm text-gray-900">Jerry's Livins</span>
                </div>
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">APPROVED</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Review Panel */}
          <div className="space-y-6">
            {/* Model Approved */}
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl p-6 text-white">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold">Model Approved</h3>
              </div>
              <p className="text-sm text-white/90 leading-relaxed">
                Case is approved on the basis of Model Analysis and Historical transactin.
              </p>
            </div>

            {/* Order Review Checklist */}
            <div className="bg-white rounded-xl border border-gray-200">
              <button
                onClick={() => setOrderReviewExpanded(!orderReviewExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-gray-900">ORDER REVIEW CHECKLIST</h3>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded">3</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${orderReviewExpanded ? '' : '-rotate-90'}`} />
              </button>
              {orderReviewExpanded && (
                <div className="px-4 pb-4">
                  <p className="text-xs text-gray-500">Checklist content here</p>
                </div>
              )}
            </div>

            {/* Case Notes */}
            <div className="bg-white rounded-xl border border-gray-200">
              <button
                onClick={() => setCaseNotesExpanded(!caseNotesExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-gray-900">CASE NOTES</h3>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded">2</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${caseNotesExpanded ? '' : '-rotate-90'}`} />
              </button>
              
              {caseNotesExpanded && (
                <div className="p-4 space-y-4">
                  {/* Existing Notes */}
                  {caseNotes.map((note, index) => (
                    <div key={index} className="pb-4 border-b border-gray-100 last:border-0">
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">{note.title}</h4>
                      <p className="text-xs text-gray-500">{note.author}</p>
                      <p className="text-xs text-gray-400 mt-1">{note.date}</p>
                    </div>
                  ))}
                  
                  {/* Add Note */}
                  <div>
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a new note..."
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button className="mt-2 w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                      ADD NOTE
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetail;
