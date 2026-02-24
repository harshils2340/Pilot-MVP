import { CheckCircle, Circle, Upload, FileText, Download, AlertCircle, Clock, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface RequiredItem {
  id: string;
  title: string;
  completed: boolean;
  uploadedFile?: {
    name: string;
    size: string;
    uploadedBy: string;
    uploadedAt: string;
  };
}

interface CityFeedbackItem {
  id: string;
  date: string;
  time: string;
  author: string;
  department: string;
  subject: string;
  message: string;
  attachments: { name: string; size: string }[];
  requiredItems: RequiredItem[];
  consultantNotes: string;
  status: 'not_started' | 'in_progress' | 'complete';
}

export function CityFeedbackSection() {
  const [activeItem, setActiveItem] = useState<string>('1');
  const [feedbackItems, setFeedbackItems] = useState<CityFeedbackItem[]>([
    {
      id: '1',
      date: 'Dec 18, 2024',
      time: '10:34 AM',
      author: 'Inspector J. Martinez',
      department: 'Plan Review Department',
      subject: 'Floor Plan Revisions Required',
      message: 'Floor plan does not show required 3-compartment sink dimensions. Please revise to include precise measurements (minimum 18"x18" per compartment) and resubmit.\n\nAdditionally, please provide:\n- Updated equipment schedule\n- Sink specifications from manufacturer\n- Water supply calculations',
      attachments: [
        { name: 'rejection_notice_121824.pdf', size: '245 KB' },
        { name: 'marked_up_floor_plan.pdf', size: '1.2 MB' },
      ],
      requiredItems: [
        {
          id: 'item-1',
          title: 'Updated floor plan with 3-compartment sink dimensions (18"x18" minimum)',
          completed: true,
          uploadedFile: {
            name: 'floor_plan_revised_v2.pdf',
            size: '1.8 MB',
            uploadedBy: 'Sarah Chen',
            uploadedAt: 'Jan 11 at 9:15 AM',
          },
        },
        {
          id: 'item-2',
          title: 'Equipment schedule showing all kitchen equipment',
          completed: false,
        },
        {
          id: 'item-3',
          title: 'Sink specifications from manufacturer',
          completed: true,
          uploadedFile: {
            name: 'sink_specs_acme_industrial.pdf',
            size: '450 KB',
            uploadedBy: 'Sarah Chen',
            uploadedAt: 'Jan 11 at 10:22 AM',
          },
        },
        {
          id: 'item-4',
          title: 'Water supply calculations',
          completed: false,
        },
      ],
      consultantNotes: 'Updated floor plan uploaded with correct sink dimensions. Waiting on Michael to finish water supply calculations by EOD Thursday. Equipment schedule will be ready once calculations are complete.',
      status: 'in_progress',
    },
    {
      id: '2',
      date: 'Dec 16, 2024',
      time: '2:15 PM',
      author: 'Plan Review Department',
      department: 'SF Dept. of Public Health',
      subject: 'Initial Review Complete',
      message: 'Initial review complete. Equipment layout meets spacing requirements. Minor revisions needed for sink specifications. Overall plan looks good - should be straightforward once sink details are added.',
      attachments: [],
      requiredItems: [],
      consultantNotes: '',
      status: 'complete',
    },
  ]);

  const toggleItemComplete = (feedbackId: string, itemId: string) => {
    setFeedbackItems(feedbackItems.map(feedback => {
      if (feedback.id === feedbackId) {
        const updatedItems = feedback.requiredItems.map(item =>
          item.id === itemId ? { ...item, completed: !item.completed } : item
        );
        const allComplete = updatedItems.every(item => item.completed);
        return {
          ...feedback,
          requiredItems: updatedItems,
          status: allComplete ? 'complete' as const : 'in_progress' as const,
        };
      }
      return feedback;
    }));
  };

  const updateNotes = (feedbackId: string, notes: string) => {
    setFeedbackItems(feedbackItems.map(feedback =>
      feedback.id === feedbackId ? { ...feedback, consultantNotes: notes } : feedback
    ));
  };

  const getStatusConfig = (status: CityFeedbackItem['status']) => {
    switch (status) {
      case 'complete':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          label: 'Complete',
          color: 'text-green-700',
          bg: 'bg-green-50',
          border: 'border-green-200',
        };
      case 'in_progress':
        return {
          icon: <Clock className="w-4 h-4" />,
          label: 'In Progress',
          color: 'text-blue-700',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
        };
      default:
        return {
          icon: <Circle className="w-4 h-4" />,
          label: 'Not Started',
          color: 'text-neutral-500',
          bg: 'bg-neutral-50',
          border: 'border-neutral-200',
        };
    }
  };

  const allComplete = feedbackItems.every(item => item.status === 'complete');
  const totalItems = feedbackItems.reduce((sum, feedback) => sum + feedback.requiredItems.length, 0);
  const completedItems = feedbackItems.reduce((sum, feedback) => 
    sum + feedback.requiredItems.filter(item => item.completed).length, 0
  );

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="bg-white border border-neutral-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">City Feedback Progress</h3>
            <p className="text-xs text-neutral-500">
              {completedItems} of {totalItems} items completed across {feedbackItems.length} feedback items
            </p>
          </div>
          {allComplete ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Ready to Resubmit</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted border border-border rounded-lg">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">{totalItems - completedItems} items remaining</span>
            </div>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${(completedItems / totalItems) * 100}%` }}
          />
        </div>
      </div>

      {/* Feedback Items */}
      <div className="space-y-3">
        {feedbackItems.map((feedback) => {
          const statusConfig = getStatusConfig(feedback.status);
          const isActive = activeItem === feedback.id;
          const itemsComplete = feedback.requiredItems.filter(item => item.completed).length;
          
          return (
            <div key={feedback.id} className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
              {/* Header - Always Visible */}
              <div 
                className={`p-4 cursor-pointer transition-colors ${
                  feedback.status === 'complete' ? 'bg-green-50/50' : 'hover:bg-neutral-50'
                }`}
                onClick={() => setActiveItem(isActive ? '' : feedback.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`mt-0.5 ${statusConfig.color}`}>
                      {isActive ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronUp className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-neutral-900">{feedback.subject}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} border`}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-600 mb-2">
                        <span className="font-medium">{feedback.author}</span>
                        <span className="text-neutral-400">•</span>
                        <span>{feedback.date} at {feedback.time}</span>
                      </div>
                      {feedback.requiredItems.length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-32 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${
                                feedback.status === 'complete' ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${(itemsComplete / feedback.requiredItems.length) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-neutral-500">
                            {itemsComplete}/{feedback.requiredItems.length} items
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isActive && (
                <div className="border-t border-neutral-200">
                  {/* City's Message */}
                  <div className="p-4 bg-red-50/30">
                    <p className="text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-2">
                      What the City Said:
                    </p>
                    <p className="text-sm text-neutral-900 leading-relaxed whitespace-pre-line mb-3">
                      {feedback.message}
                    </p>
                    
                    {/* City Attachments */}
                    {feedback.attachments.length > 0 && (
                      <div className="space-y-1.5">
                        {feedback.attachments.map((attachment, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 bg-white border border-neutral-200 rounded group hover:bg-neutral-50 cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-neutral-500" />
                              <span className="text-xs font-medium text-neutral-900">{attachment.name}</span>
                              <span className="text-xs text-neutral-500">{attachment.size}</span>
                            </div>
                            <Download className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Required Items Checklist */}
                  {feedback.requiredItems.length > 0 && (
                    <div className="p-4 border-t border-neutral-200">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                          What You Need to Provide:
                        </p>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded hover:bg-neutral-800 transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          Upload File
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        {feedback.requiredItems.map((item) => (
                          <div 
                            key={item.id} 
                            className={`border-2 rounded-lg p-3 transition-all ${
                              item.completed 
                                ? 'border-green-200 bg-green-50' 
                                : 'border-neutral-200 bg-white hover:border-neutral-300'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() => toggleItemComplete(feedback.id, item.id)}
                                className="mt-0.5 flex-shrink-0"
                              >
                                {item.completed ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <Circle className="w-5 h-5 text-neutral-300 hover:text-neutral-500 transition-colors" />
                                )}
                              </button>
                              <div className="flex-1">
                                <p className={`text-sm font-medium mb-1 ${
                                  item.completed ? 'text-green-900' : 'text-neutral-900'
                                }`}>
                                  {item.title}
                                </p>
                                {item.uploadedFile ? (
                                  <div className="flex items-center justify-between p-2 bg-white border border-green-200 rounded">
                                    <div className="flex items-center gap-2">
                                      <FileText className="w-4 h-4 text-green-600" />
                                      <div>
                                        <p className="text-xs font-medium text-neutral-900">{item.uploadedFile.name}</p>
                                        <p className="text-xs text-neutral-500">
                                          {item.uploadedFile.uploadedBy} • {item.uploadedFile.uploadedAt}
                                        </p>
                                      </div>
                                    </div>
                                    <span className="text-xs text-neutral-500">{item.uploadedFile.size}</span>
                                  </div>
                                ) : (
                                  <button className="flex items-center gap-1.5 px-2 py-1 bg-neutral-100 hover:bg-muted rounded text-xs font-medium text-neutral-700 transition-colors">
                                    <Upload className="w-3 h-3" />
                                    Upload Document
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Your Response Notes */}
                  <div className="p-4 border-t border-neutral-200 bg-blue-50/30">
                    <p className="text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-2">
                      Your Response to City:
                    </p>
                    <textarea
                      value={feedback.consultantNotes}
                      onChange={(e) => updateNotes(feedback.id, e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none"
                      placeholder="Explain what you've done to address the city's concerns. This will be sent when you resubmit..."
                    />
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-neutral-500">
                        This response will be included in your resubmission
                      </p>
                      <button className="px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded hover:bg-neutral-800 transition-colors">
                        Save Notes
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
