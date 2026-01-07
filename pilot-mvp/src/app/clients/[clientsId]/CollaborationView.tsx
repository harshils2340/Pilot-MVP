// import { MessageSquare, AtSign, Lock, User, Send, MoreVertical } from 'lucide-react';
// import { useState } from 'react';

// interface Comment {
//   id: string;
//   fieldId: string;
//   fieldLabel: string;
//   author: {
//     name: string;
//     role: 'consultant' | 'client';
//     initials: string;
//   };
//   message: string;
//   timestamp: string;
//   mentions?: string[];
// }

// interface FormField {
//   id: string;
//   label: string;
//   value: string;
//   section: string;
//   locked: boolean;
//   commentCount: number;
// }

// const mockFields: FormField[] = [
//   {
//     id: 'business_name',
//     label: 'Legal Business Name',
//     value: 'Urban Eats Restaurant Group LLC',
//     section: 'Business Information',
//     locked: false,
//     commentCount: 0,
//   },
//   {
//     id: 'business_address',
//     label: 'Business Physical Address',
//     value: '425 Market Street, San Francisco, CA 94105',
//     section: 'Business Information',
//     locked: false,
//     commentCount: 3,
//   },
//   {
//     id: 'mailing_address',
//     label: 'Mailing Address',
//     value: '',
//     section: 'Business Information',
//     locked: false,
//     commentCount: 2,
//   },
//   {
//     id: 'seating_capacity',
//     label: 'Indoor Seating Capacity',
//     value: '85',
//     section: 'Facility Details',
//     locked: false,
//     commentCount: 1,
//   },
//   {
//     id: 'equipment_list',
//     label: 'Kitchen Equipment List',
//     value: 'Commercial range, refrigeration units, dish washer',
//     section: 'Facility Details',
//     locked: true,
//     commentCount: 0,
//   },
// ];

// const mockComments: Comment[] = [
//   {
//     id: 'c1',
//     fieldId: 'business_address',
//     fieldLabel: 'Business Physical Address',
//     author: { name: 'John Doe', role: 'consultant', initials: 'JD' },
//     message: 'Updated to match the new lease amendment. Can you confirm this is correct?',
//     timestamp: '2 hours ago',
//     mentions: ['Sarah Chen'],
//   },
//   {
//     id: 'c2',
//     fieldId: 'business_address',
//     fieldLabel: 'Business Physical Address',
//     author: { name: 'Sarah Chen', role: 'client', initials: 'SC' },
//     message: 'Yes, that\'s correct. The unit number changed when we expanded.',
//     timestamp: '1 hour ago',
//   },
//   {
//     id: 'c3',
//     fieldId: 'business_address',
//     fieldLabel: 'Business Physical Address',
//     author: { name: 'John Doe', role: 'consultant', initials: 'JD' },
//     message: 'Perfect, I\'ll update the other forms accordingly.',
//     timestamp: '45 minutes ago',
//   },
//   {
//     id: 'c4',
//     fieldId: 'mailing_address',
//     fieldLabel: 'Mailing Address',
//     author: { name: 'John Doe', role: 'consultant', initials: 'JD' },
//     message: '@Sarah Chen - Do you want to use the same address for mailing, or should we use your corporate office?',
//     timestamp: '3 hours ago',
//     mentions: ['Sarah Chen'],
//   },
//   {
//     id: 'c5',
//     fieldId: 'mailing_address',
//     fieldLabel: 'Mailing Address',
//     author: { name: 'Sarah Chen', role: 'client', initials: 'SC' },
//     message: 'Let\'s use the corporate office: 1200 Valencia St, San Francisco, CA 94110',
//     timestamp: '2 hours ago',
//   },
//   {
//     id: 'c6',
//     fieldId: 'seating_capacity',
//     fieldLabel: 'Indoor Seating Capacity',
//     author: { name: 'Sarah Chen', role: 'client', initials: 'SC' },
//     message: 'Should this include bar seating? We have 12 bar seats.',
//     timestamp: '4 hours ago',
//   },
// ];

// interface CollaborationViewProps {
//   permitId: string | null;
// }

// export function CollaborationView({ permitId }: CollaborationViewProps) {
//   const [selectedField, setSelectedField] = useState<string | null>('business_address');
//   const [newComment, setNewComment] = useState('');

//   const selectedFieldComments = mockComments.filter(
//     (comment) => comment.fieldId === selectedField
//   );

//   const sections = Array.from(new Set(mockFields.map((f) => f.section)));

//   return (
//     <div className="h-full flex">
//       {/* Fields List - Left Side */}
//       <div className="w-96 bg-white border-r border-neutral-200 flex flex-col">
//         <div className="p-6 border-b border-neutral-200">
//           <h2 className="text-neutral-900 mb-1">Form Fields</h2>
//           <p className="text-neutral-600 text-sm">Food Service Establishment Permit</p>
//         </div>

//         <div className="flex-1 overflow-auto">
//           {sections.map((section) => (
//             <div key={section} className="border-b border-neutral-200">
//               <div className="px-6 py-3 bg-neutral-50">
//                 <h3 className="text-sm font-medium text-neutral-700">{section}</h3>
//               </div>
//               <div className="divide-y divide-neutral-100">
//                 {mockFields
//                   .filter((field) => field.section === section)
//                   .map((field) => (
//                     <button
//                       key={field.id}
//                       onClick={() => setSelectedField(field.id)}
//                       className={`w-full px-6 py-3 text-left hover:bg-neutral-50 transition-colors ${
//                         selectedField === field.id ? 'bg-blue-50 border-l-2 border-blue-600' : ''
//                       }`}
//                     >
//                       <div className="flex items-start justify-between gap-2">
//                         <div className="flex-1 min-w-0">
//                           <div className="flex items-center gap-2 mb-1">
//                             <p className="text-sm font-medium text-neutral-900 truncate">
//                               {field.label}
//                             </p>
//                             {field.locked && (
//                               <Lock className="w-3 h-3 text-neutral-400 flex-shrink-0" />
//                             )}
//                           </div>
//                           {field.value ? (
//                             <p className="text-xs text-neutral-500 truncate">{field.value}</p>
//                           ) : (
//                             <p className="text-xs text-neutral-400 italic">Empty</p>
//                           )}
//                         </div>
//                         {field.commentCount > 0 && (
//                           <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex-shrink-0">
//                             <MessageSquare className="w-3 h-3" />
//                             {field.commentCount}
//                           </div>
//                         )}
//                       </div>
//                     </button>
//                   ))}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Conversation - Right Side */}
//       <div className="flex-1 flex flex-col">
//         <div className="bg-white border-b border-neutral-200 px-8 py-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <h2 className="text-neutral-900 mb-1">
//                 {mockFields.find((f) => f.id === selectedField)?.label || 'Select a field'}
//               </h2>
//               <p className="text-neutral-600 text-sm">Comments and discussions</p>
//             </div>
//             {mockFields.find((f) => f.id === selectedField)?.locked && (
//               <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg">
//                 <Lock className="w-4 h-4" />
//                 <span className="text-sm font-medium">Locked - Form Submitted</span>
//               </div>
//             )}
//           </div>
//         </div>

//         {selectedField ? (
//           <>
//             {/* Comments Thread */}
//             <div className="flex-1 overflow-auto p-8">
//               <div className="max-w-3xl mx-auto space-y-4">
//                 {selectedFieldComments.length === 0 ? (
//                   <div className="text-center py-12">
//                     <MessageSquare className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
//                     <p className="text-neutral-500">No comments yet</p>
//                     <p className="text-sm text-neutral-400">
//                       Start a conversation about this field
//                     </p>
//                   </div>
//                 ) : (
//                   selectedFieldComments.map((comment) => (
//                     <div key={comment.id} className="flex gap-3">
//                       <div
//                         className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
//                           comment.author.role === 'consultant'
//                             ? 'bg-neutral-900 text-white'
//                             : 'bg-blue-100 text-blue-700'
//                         }`}
//                       >
//                         {comment.author.initials}
//                       </div>
//                       <div className="flex-1">
//                         <div className="bg-white rounded-lg border border-neutral-200 p-4">
//                           <div className="flex items-center gap-2 mb-2">
//                             <span className="font-medium text-neutral-900 text-sm">
//                               {comment.author.name}
//                             </span>
//                             <span
//                               className={`px-2 py-0.5 rounded text-xs font-medium ${
//                                 comment.author.role === 'consultant'
//                                   ? 'bg-neutral-100 text-neutral-700'
//                                   : 'bg-blue-100 text-blue-700'
//                               }`}
//                             >
//                               {comment.author.role === 'consultant' ? 'Consultant' : 'Client'}
//                             </span>
//                             <span className="text-xs text-neutral-500">{comment.timestamp}</span>
//                           </div>
//                           <p className="text-sm text-neutral-900">{comment.message}</p>
//                         </div>
//                       </div>
//                       <button className="p-1 hover:bg-neutral-100 rounded h-fit">
//                         <MoreVertical className="w-4 h-4 text-neutral-400" />
//                       </button>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </div>

//             {/* Comment Input */}
//             {!mockFields.find((f) => f.id === selectedField)?.locked && (
//               <div className="bg-white border-t border-neutral-200 p-6">
//                 <div className="max-w-3xl mx-auto">
//                   <div className="flex gap-3">
//                     <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-sm font-medium flex-shrink-0">
//                       JD
//                     </div>
//                     <div className="flex-1">
//                       <textarea
//                         value={newComment}
//                         onChange={(e) => setNewComment(e.target.value)}
//                         placeholder="Add a comment... Use @ to mention collaborators"
//                         rows={3}
//                         className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none"
//                       />
//                       <div className="flex items-center justify-between mt-2">
//                         <button className="flex items-center gap-1 px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-100 rounded transition-colors">
//                           <AtSign className="w-4 h-4" />
//                           Mention
//                         </button>
//                         <button className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors">
//                           <Send className="w-4 h-4" />
//                           Comment
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </>
//         ) : (
//           <div className="flex-1 flex items-center justify-center text-neutral-400">
//             <div className="text-center">
//               <User className="w-16 h-16 mx-auto mb-3 text-neutral-300" />
//               <p>Select a field to view or add comments</p>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }





import { MessageSquare, AtSign, Lock, User, Send, MoreVertical } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface Comment {
  id: string;
  fieldId: string;
  fieldLabel: string;
  author: {
    name: string;
    role: 'consultant' | 'client';
    initials: string;
  };
  message: string;
  timestamp: string;
  mentions?: string[];
}

interface FormField {
  id: string;
  label: string;
  value: string;
  section: string;
  locked: boolean;
  commentCount: number;
}

const mockFields: FormField[] = [
  { id: 'business_name', label: 'Legal Business Name', value: 'Urban Eats Restaurant Group LLC', section: 'Business Information', locked: false, commentCount: 0 },
  { id: 'business_address', label: 'Business Physical Address', value: '425 Market Street, San Francisco, CA 94105', section: 'Business Information', locked: false, commentCount: 3 },
  { id: 'mailing_address', label: 'Mailing Address', value: '', section: 'Business Information', locked: false, commentCount: 2 },
  { id: 'seating_capacity', label: 'Indoor Seating Capacity', value: '85', section: 'Facility Details', locked: false, commentCount: 1 },
  { id: 'equipment_list', label: 'Kitchen Equipment List', value: 'Commercial range, refrigeration units, dish washer', section: 'Facility Details', locked: true, commentCount: 0 },
];

const mockComments: Comment[] = [
  { id: 'c1', fieldId: 'business_address', fieldLabel: 'Business Physical Address', author: { name: 'John Doe', role: 'consultant', initials: 'JD' }, message: 'Updated to match the new lease amendment. Can you confirm this is correct?', timestamp: '2 hours ago', mentions: ['Sarah Chen'] },
  { id: 'c2', fieldId: 'business_address', fieldLabel: 'Business Physical Address', author: { name: 'Sarah Chen', role: 'client', initials: 'SC' }, message: 'Yes, that\'s correct. The unit number changed when we expanded.', timestamp: '1 hour ago' },
  { id: 'c3', fieldId: 'business_address', fieldLabel: 'Business Physical Address', author: { name: 'John Doe', role: 'consultant', initials: 'JD' }, message: 'Perfect, I\'ll update the other forms accordingly.', timestamp: '45 minutes ago' },
  { id: 'c4', fieldId: 'mailing_address', fieldLabel: 'Mailing Address', author: { name: 'John Doe', role: 'consultant', initials: 'JD' }, message: '@Sarah Chen - Do you want to use the same address for mailing, or should we use your corporate office?', timestamp: '3 hours ago', mentions: ['Sarah Chen'] },
  { id: 'c5', fieldId: 'mailing_address', fieldLabel: 'Mailing Address', author: { name: 'Sarah Chen', role: 'client', initials: 'SC' }, message: 'Let\'s use the corporate office: 1200 Valencia St, San Francisco, CA 94110', timestamp: '2 hours ago' },
  { id: 'c6', fieldId: 'seating_capacity', fieldLabel: 'Indoor Seating Capacity', author: { name: 'Sarah Chen', role: 'client', initials: 'SC' }, message: 'Should this include bar seating? We have 12 bar seats.', timestamp: '4 hours ago' },
];

interface CollaborationViewProps {
  permitId?: string; // required
  clientId?: string; // optional
}

export function CollaborationView({ permitId, clientId }: CollaborationViewProps) {
  const [selectedField, setSelectedField] = useState<string | null>('business_address');
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const commentEndRef = useRef<HTMLDivElement | null>(null);

  const currentUser: Comment['author'] = { name: 'John Doe', role: 'consultant', initials: 'JD' };

  const selectedFieldComments = comments.filter(c => c.fieldId === selectedField);
  const sections = Array.from(new Set(mockFields.map(f => f.section)));

  useEffect(() => {
    commentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedFieldComments]);

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedField) return;
    const newC: Comment = {
      id: `c${comments.length + 1}`,
      fieldId: selectedField,
      fieldLabel: mockFields.find(f => f.id === selectedField)?.label || '',
      author: currentUser,
      message: newComment,
      timestamp: 'Just now',
    };
    setComments([...comments, newC]);
    setNewComment('');
  };

  console.log('Permit ID:', permitId);
  console.log('Client ID:', clientId);

  return (
    <div className="h-full flex">
      {/* Fields List */}
      <div className="w-96 bg-white border-r border-neutral-200 flex flex-col">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-neutral-900 mb-1">Form Fields</h2>
          <p className="text-neutral-600 text-sm">Food Service Establishment Permit</p>
        </div>
        <div className="flex-1 overflow-auto">
          {sections.map(section => (
            <div key={section} className="border-b border-neutral-200">
              <div className="px-6 py-3 bg-neutral-50">
                <h3 className="text-sm font-medium text-neutral-700">{section}</h3>
              </div>
              <div className="divide-y divide-neutral-100">
                {mockFields.filter(f => f.section === section).map(field => (
                  <button
                    key={field.id}
                    onClick={() => setSelectedField(field.id)}
                    className={`w-full px-6 py-3 text-left hover:bg-neutral-50 transition-colors ${
                      selectedField === field.id ? 'bg-blue-50 border-l-2 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-neutral-900 truncate">{field.label}</p>
                          {field.locked && <Lock className="w-3 h-3 text-neutral-400 flex-shrink-0" />}
                        </div>
                        <p className={`text-xs truncate ${field.value ? 'text-neutral-500' : 'text-neutral-400 italic'}`}>
                          {field.value || 'Empty'}
                        </p>
                      </div>
                      {field.commentCount > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex-shrink-0">
                          <MessageSquare className="w-3 h-3" />
                          {field.commentCount}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comments */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-neutral-200 px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-neutral-900 mb-1">{mockFields.find(f => f.id === selectedField)?.label || 'Select a field'}</h2>
            <p className="text-neutral-600 text-sm">Comments and discussions</p>
          </div>
          {mockFields.find(f => f.id === selectedField)?.locked && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg">
              <Lock className="w-4 h-4" />
              <span className="text-sm font-medium">Locked - Form Submitted</span>
            </div>
          )}
        </div>

        {selectedField ? (
          <>
            <div className="flex-1 overflow-auto p-8">
              <div className="max-w-3xl mx-auto space-y-4">
                {selectedFieldComments.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-500">No comments yet</p>
                    <p className="text-sm text-neutral-400">Start a conversation about this field</p>
                  </div>
                ) : (
                  selectedFieldComments.map(comment => (
                    <div key={comment.id} className="flex gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                          comment.author.role === 'consultant' ? 'bg-neutral-900 text-white' : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {comment.author.initials}
                      </div>
                      <div className="flex-1">
                        <div className="bg-white rounded-lg border border-neutral-200 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-neutral-900 text-sm">{comment.author.name}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              comment.author.role === 'consultant' ? 'bg-neutral-100 text-neutral-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {comment.author.role === 'consultant' ? 'Consultant' : 'Client'}
                            </span>
                            <span className="text-xs text-neutral-500">{comment.timestamp}</span>
                          </div>
                          <p className="text-sm text-neutral-900">{comment.message}</p>
                        </div>
                      </div>
                      <button className="p-1 hover:bg-neutral-100 rounded h-fit">
                        <MoreVertical className="w-4 h-4 text-neutral-400" />
                      </button>
                    </div>
                  ))
                )}
                <div ref={commentEndRef} />
              </div>
            </div>

            {!mockFields.find(f => f.id === selectedField)?.locked && (
              <div className="bg-white border-t border-neutral-200 p-6">
                <div className="max-w-3xl mx-auto flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-sm font-medium flex-shrink-0">{currentUser.initials}</div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment... Use @ to mention collaborators"
                      rows={3}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <button className="flex items-center gap-1 px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-100 rounded transition-colors">
                        <AtSign className="w-4 h-4" />
                        Mention
                      </button>
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-4 h-4" />
                        Comment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-neutral-400">
            <div className="text-center">
              <User className="w-16 h-16 mx-auto mb-3 text-neutral-300" />
              <p>Select a field to view or add comments</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
