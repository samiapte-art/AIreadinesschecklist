import React from 'react';
import { ClipboardCheck, Clock, AlertOctagon, Users, CheckCircle, Circle, ArrowRight, X } from 'lucide-react';

/**
 * KickoffReadinessPanel — Aggregated checklist of outstanding items,
 * internal actions, blockers, and suggested timeline for approved opportunities.
 */
export default function KickoffReadinessPanel({ 
  kickoffReadiness, 
  dataRequirements, 
  documentRequirements, 
  accessRequirements, 
  documentChecklist,
  isEditing,
  onUpdate
}) {
  if (!kickoffReadiness && !dataRequirements?.length && !documentRequirements?.length && !accessRequirements?.length && !documentChecklist?.length) {
    return null;
  }

  const updateSection = (key, value) => {
    if (onUpdate) onUpdate({ [key]: value });
  };

  const StatusIcon = ({ status }) => (
    status === 'Complete' || status === 'Done'
      ? <CheckCircle size={14} className="text-green-500" />
      : <Circle size={14} className="text-gray-300" />
  );

  const PriorityBadge = ({ priority }) => (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
      priority === 'Critical' ? 'bg-red-100 text-red-600' :
      priority === 'High' ? 'bg-orange-100 text-orange-600' :
      'bg-blue-100 text-blue-600'
    }`}>
      {priority}
    </span>
  );

  const SeverityBadge = ({ severity }) => (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
      severity === 'High' ? 'bg-red-100 text-red-600' :
      severity === 'Medium' ? 'bg-amber-100 text-amber-600' :
      'bg-green-100 text-green-600'
    }`}>
      {severity}
    </span>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-finivis-blue/10 flex items-center justify-center">
          <ClipboardCheck size={20} className="text-finivis-blue" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Kickoff Readiness</h3>
          <p className="text-xs text-gray-400 font-medium">Complete all items before project commencement</p>
        </div>
      </div>

      {/* Document Checklist — Exact documents required from client */}
      {documentChecklist?.length > 0 && (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 bg-gradient-to-r from-finivis-blue/5 to-indigo-50 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xs font-black text-finivis-blue uppercase tracking-widest flex items-center gap-2">
                  <ClipboardCheck size={14} /> Exact Documents Required From Client
                </h4>
                <p className="text-[11px] text-gray-500 mt-1 font-medium">The following specific documents must be collected before project kickoff</p>
              </div>
              {isEditing && (
                <button
                  onClick={() => {
                    const newDocs = [...(documentChecklist || []), { documentName: 'New Document', priority: 'High', format: 'PDF', reason: 'Describe why this is needed...' }];
                    updateSection('documentChecklist', newDocs);
                  }}
                  className="text-xs font-bold text-finivis-blue hover:underline"
                >
                  + Add Document
                </button>
              )}
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {(documentChecklist || []).map((doc, idx) => (
              <div key={idx} className="p-4 hover:bg-gray-50/50 transition-colors group relative">
                {isEditing && (
                  <button
                    onClick={() => {
                      const newDocs = documentChecklist.filter((_, i) => i !== idx);
                      updateSection('documentChecklist', newDocs);
                    }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <X size={14} />
                  </button>
                )}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-finivis-blue/10 flex items-center justify-center text-xs font-black text-finivis-blue shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            className="flex-1 font-bold text-gray-900 text-sm bg-white border border-gray-200 rounded px-1 outline-none focus:border-finivis-blue"
                            value={doc.documentName}
                            onChange={(e) => {
                              const newDocs = [...documentChecklist];
                              newDocs[idx].documentName = e.target.value;
                              updateSection('documentChecklist', newDocs);
                            }}
                          />
                          <select
                            className="text-[9px] font-bold uppercase rounded border border-gray-200 px-1 outline-none bg-white"
                            value={doc.priority}
                            onChange={(e) => {
                              const newDocs = [...documentChecklist];
                              newDocs[idx].priority = e.target.value;
                              updateSection('documentChecklist', newDocs);
                            }}
                          >
                            <option value="Critical">Critical</option>
                            <option value="High">High</option>
                            <option value="Standard">Standard</option>
                          </select>
                        </div>
                        <div className="flex gap-2 text-[11px]">
                          <input
                            className="bg-white border border-gray-200 rounded px-1 outline-none focus:border-finivis-blue"
                            placeholder="Format (e.g. PDF)"
                            value={doc.format}
                            onChange={(e) => {
                              const newDocs = [...documentChecklist];
                              newDocs[idx].format = e.target.value;
                              updateSection('documentChecklist', newDocs);
                            }}
                          />
                          <input
                            className="bg-white border border-gray-200 rounded px-1 outline-none focus:border-finivis-blue"
                            placeholder="Quantity"
                            value={doc.quantity}
                            onChange={(e) => {
                              const newDocs = [...documentChecklist];
                              newDocs[idx].quantity = e.target.value;
                              updateSection('documentChecklist', newDocs);
                            }}
                          />
                        </div>
                        <textarea
                          className="w-full text-xs text-gray-600 bg-white border border-gray-200 rounded p-1 outline-none focus:border-finivis-blue"
                          rows={2}
                          value={doc.reason}
                          onChange={(e) => {
                            const newDocs = [...documentChecklist];
                            newDocs[idx].reason = e.target.value;
                            updateSection('documentChecklist', newDocs);
                          }}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h5 className="font-bold text-gray-900 text-sm">{doc.documentName}</h5>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${doc.priority === 'Critical' ? 'bg-red-100 text-red-600' : doc.priority === 'High' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                            }`}>{doc.priority}</span>
                          {doc.category && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-bold uppercase">
                              {doc.category}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] mb-1.5">
                          <span className="text-gray-500">
                            <span className="font-bold text-gray-600">Format:</span> {doc.format}
                          </span>
                          {doc.quantity && (
                            <span className="text-gray-500">
                              <span className="font-bold text-gray-600">Qty:</span> {doc.quantity}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">{doc.reason}</p>
                        {doc.exampleDescription && (
                          <p className="text-[11px] text-gray-400 italic mt-1">{doc.exampleDescription}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Requirements Grid */}
      {(dataRequirements?.length > 0 || documentRequirements?.length > 0 || accessRequirements?.length > 0) && (
        <div className="flex flex-col gap-4">
          {/* Data Requirements */}
          {dataRequirements?.length > 0 && (
            <RequirementCard
              title="Data Requirements"
              items={dataRequirements}
              color="purple"
              isEditing={isEditing}
              onUpdate={(newItems) => updateSection('dataRequirements', newItems)}
            />
          )}

          {/* Access & Infrastructure */}
          {(accessRequirements?.length > 0 || isEditing) && (
            <RequirementCard
              title="Access & Infrastructure"
              items={accessRequirements || []}
              color="orange"
              isEditing={isEditing}
              onUpdate={(newItems) => updateSection('accessRequirements', newItems)}
            />
          )}
        </div>
      )}

      {/* Kickoff Readiness Details */}
      {kickoffReadiness && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Outstanding Client Items */}
          {((kickoffReadiness?.outstandingClientItems?.length > 0) || isEditing) && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all group/items relative">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Users size={14} /> Outstanding Client Items
                </h4>
                {isEditing && (
                  <button
                    onClick={() => {
                      const newItems = [...(kickoffReadiness?.outstandingClientItems || []), { item: 'New Client Item', owner: 'Client Team', status: 'Pending' }];
                      updateSection('kickoffReadiness', { ...kickoffReadiness, outstandingClientItems: newItems });
                    }}
                    className="text-[10px] font-bold text-finivis-blue hover:underline"
                  >
                    + Add
                  </button>
                )}
              </div>
              <div className="space-y-2.5">
                {(kickoffReadiness?.outstandingClientItems || []).map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 group/item relative">
                    {isEditing && (
                      <button
                        onClick={() => {
                          const newItems = kickoffReadiness.outstandingClientItems.filter((_, i) => i !== idx);
                          updateSection('kickoffReadiness', { ...kickoffReadiness, outstandingClientItems: newItems });
                        }}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-400 text-white flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity z-10"
                      >
                        <X size={10} />
                      </button>
                    )}
                    <StatusIcon status={item.status} />
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-1">
                          <input
                            className="w-full text-sm font-medium text-gray-800 bg-white border border-gray-100 rounded px-1 outline-none"
                            value={item.item}
                            onChange={(e) => {
                              const newItems = [...kickoffReadiness.outstandingClientItems];
                              newItems[idx].item = e.target.value;
                              updateSection('kickoffReadiness', { ...kickoffReadiness, outstandingClientItems: newItems });
                            }}
                          />
                          <input
                            className="w-full text-[10px] text-gray-400 font-bold bg-white border border-gray-100 rounded px-1 outline-none"
                            value={item.owner}
                            onChange={(e) => {
                              const newItems = [...kickoffReadiness.outstandingClientItems];
                              newItems[idx].owner = e.target.value;
                              updateSection('kickoffReadiness', { ...kickoffReadiness, outstandingClientItems: newItems });
                            }}
                          />
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-gray-800">{item.item}</p>
                          <p className="text-[10px] text-gray-400 font-bold mt-0.5">Owner: {item.owner}</p>
                        </>
                      )}
                    </div>
                    {isEditing ? (
                      <select
                        className="text-[10px] px-1 py-0.5 rounded border border-gray-200 outline-none bg-white font-bold h-fit"
                        value={item.status}
                        onChange={(e) => {
                          const newItems = [...kickoffReadiness.outstandingClientItems];
                          newItems[idx].status = e.target.value;
                          updateSection('kickoffReadiness', { ...kickoffReadiness, outstandingClientItems: newItems });
                        }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Complete">Complete</option>
                      </select>
                    ) : (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${item.status === 'Complete' || item.status === 'Done'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-100 text-gray-500'
                        }`}>
                        {item.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Internal Actions */}
          {((kickoffReadiness?.internalActions?.length > 0) || isEditing) && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all group/items relative">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <ArrowRight size={14} className="text-finivis-blue" /> Internal Actions
                </h4>
                {isEditing && (
                  <button
                    onClick={() => {
                      const newItems = [...(kickoffReadiness?.internalActions || []), { item: 'New Internal Action', owner: 'Finivis Team', status: 'In Progress' }];
                      updateSection('kickoffReadiness', { ...kickoffReadiness, internalActions: newItems });
                    }}
                    className="text-[10px] font-bold text-finivis-blue hover:underline"
                  >
                    + Add
                  </button>
                )}
              </div>
              <div className="space-y-2.5">
                {(kickoffReadiness?.internalActions || []).map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50/30 rounded-xl border border-blue-100/50 group/item relative">
                    {isEditing && (
                      <button
                        onClick={() => {
                          const newItems = kickoffReadiness.internalActions.filter((_, i) => i !== idx);
                          updateSection('kickoffReadiness', { ...kickoffReadiness, internalActions: newItems });
                        }}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-400 text-white flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity z-10"
                      >
                        <X size={10} />
                      </button>
                    )}
                    <StatusIcon status={item.status} />
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-1">
                          <input
                            className="w-full text-sm font-medium text-gray-800 bg-white border border-gray-100 rounded px-1 outline-none"
                            value={item.item}
                            onChange={(e) => {
                              const newItems = [...kickoffReadiness.internalActions];
                              newItems[idx].item = e.target.value;
                              updateSection('kickoffReadiness', { ...kickoffReadiness, internalActions: newItems });
                            }}
                          />
                          <input
                            className="w-full text-[10px] text-gray-400 font-bold bg-white border border-gray-100 rounded px-1 outline-none"
                            value={item.owner}
                            onChange={(e) => {
                              const newItems = [...kickoffReadiness.internalActions];
                              newItems[idx].owner = e.target.value;
                              updateSection('kickoffReadiness', { ...kickoffReadiness, internalActions: newItems });
                            }}
                          />
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-gray-800">{item.item}</p>
                          <p className="text-[10px] text-gray-400 font-bold mt-0.5">Owner: {item.owner}</p>
                        </>
                      )}
                    </div>
                    {isEditing ? (
                      <select
                        className="text-[10px] px-1 py-0.5 rounded border border-gray-200 outline-none bg-white font-bold h-fit"
                        value={item.status}
                        onChange={(e) => {
                          const newItems = [...kickoffReadiness.internalActions];
                          newItems[idx].status = e.target.value;
                          updateSection('kickoffReadiness', { ...kickoffReadiness, internalActions: newItems });
                        }}
                      >
                        <option value="Complete">Complete</option>
                        <option value="In Progress">In Progress</option>
                      </select>
                    ) : (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${item.status === 'Complete' || item.status === 'Done'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-blue-50 text-blue-500 border border-blue-100'
                        }`}>
                        {item.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Blockers */}
      {((kickoffReadiness?.blockers?.length > 0) || isEditing) && (
        <div className="bg-red-50/30 p-6 rounded-2xl border border-red-100 shadow-sm group/items relative">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
              <AlertOctagon size={14} /> Identified Blockers & Risks
            </h4>
            {isEditing && (
              <button
                onClick={() => {
                  const newItems = [...(kickoffReadiness?.blockers || []), { blocker: 'Potential data silo', severity: 'Medium', mitigation: 'Request access to raw SQL dumps early' }];
                  updateSection('kickoffReadiness', { ...kickoffReadiness, blockers: newItems });
                }}
                className="text-[10px] font-bold text-red-600 hover:underline"
              >
                + Add Blocker
              </button>
            )}
          </div>
          <div className="space-y-3">
            {(kickoffReadiness?.blockers || []).map((b, idx) => (
              <div key={idx} className="p-4 bg-white rounded-2xl border border-red-100/50 group/item relative">
                {isEditing && (
                  <button
                    onClick={() => {
                      const newItems = kickoffReadiness.blockers.filter((_, i) => i !== idx);
                      updateSection('kickoffReadiness', { ...kickoffReadiness, blockers: newItems });
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-400 text-white flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity z-10"
                  >
                    <X size={10} />
                  </button>
                )}
                <div className="flex items-center gap-2 mb-1">
                  {isEditing ? (
                    <div className="flex-1 flex gap-2">
                      <select
                        className="text-[10px] font-bold uppercase rounded border border-gray-200 px-1 outline-none bg-white"
                        value={b.severity}
                        onChange={(e) => {
                          const newItems = [...kickoffReadiness.blockers];
                          newItems[idx].severity = e.target.value;
                          updateSection('kickoffReadiness', { ...kickoffReadiness, blockers: newItems });
                        }}
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                      <input
                        className="flex-1 text-sm font-bold text-gray-900 bg-white border border-gray-100 rounded px-1 outline-none"
                        value={b.blocker}
                        onChange={(e) => {
                          const newItems = [...kickoffReadiness.blockers];
                          newItems[idx].blocker = e.target.value;
                          updateSection('kickoffReadiness', { ...kickoffReadiness, blockers: newItems });
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <SeverityBadge severity={b.severity} />
                      <p className="text-sm font-bold text-gray-900">{b.blocker}</p>
                    </>
                  )}
                </div>
                {isEditing ? (
                  <textarea
                    className="w-full text-xs text-gray-500 bg-white border border-gray-100 rounded px-1 outline-none mt-1"
                    rows={1}
                    value={b.mitigation}
                    placeholder="Mitigation strategy..."
                    onChange={(e) => {
                      const newItems = [...kickoffReadiness.blockers];
                      newItems[idx].mitigation = e.target.value;
                      updateSection('kickoffReadiness', { ...kickoffReadiness, blockers: newItems });
                    }}
                  />
                ) : (
                  <p className="text-xs text-gray-500 pl-0.5">
                    <span className="font-bold text-gray-600">Mitigation:</span> {b.mitigation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Timeline */}
      <div className="bg-gradient-to-r from-finivis-blue/5 to-indigo-50 p-5 rounded-2xl border border-finivis-blue/10 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-finivis-blue/10 flex items-center justify-center shrink-0">
          <Clock size={20} className="text-finivis-blue" />
        </div>
        <div>
          <p className="text-[10px] font-black text-finivis-blue uppercase tracking-widest mb-0.5">Suggested Timeline</p>
          {isEditing ? (
            <input
              className="text-sm font-medium text-gray-800 bg-white border border-gray-200 rounded px-2 py-0.5 outline-none focus:border-finivis-blue w-full"
              value={kickoffReadiness?.suggestedTimeline || ''}
              onChange={(e) => updateSection('kickoffReadiness', { ...kickoffReadiness, suggestedTimeline: e.target.value })}
            />
          ) : (
            <p className="text-sm font-medium text-gray-800">{kickoffReadiness?.suggestedTimeline}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function RequirementCard({ title, items, color, isEditing, onUpdate }) {
  const colorMap = {
    purple: { bg: 'bg-purple-50/50', border: 'border-purple-100', dot: 'bg-purple-400', title: 'text-purple-700' },
    blue: { bg: 'bg-blue-50/50', border: 'border-blue-100', dot: 'bg-blue-400', title: 'text-blue-700' },
    orange: { bg: 'bg-orange-50/50', border: 'border-orange-100', dot: 'bg-orange-400', title: 'text-orange-700' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className={`p-5 rounded-2xl border ${c.border} ${c.bg}`}>
      <div className="flex justify-between items-center mb-3">
        <h5 className={`text-[10px] font-black uppercase tracking-widest ${c.title}`}>{title}</h5>
        {isEditing && (
          <button
            onClick={() => onUpdate([...items, { item: 'New requirement...', reason: '', priority: 'High' }])}
            className={`text-[9px] font-bold ${c.title} hover:underline`}
          >
            + Add
          </button>
        )}
      </div>
      <ul className="space-y-2.5">
        {items.map((req, idx) => {
          const item = typeof req === 'string' ? { item: req, reason: null, priority: null } : req;
          return (
            <li key={idx} className="group relative">
              {isEditing && (
                <button
                  onClick={() => onUpdate(items.filter((_, i) => i !== idx))}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-400 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <X size={10} />
                </button>
              )}
              <div className="flex items-start gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${c.dot} mt-1.5 shrink-0`}></div>
                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-1">
                      <input
                        className="w-full text-xs font-medium text-gray-800 bg-white border border-gray-100 rounded px-1 outline-none focus:border-finivis-blue"
                        value={item.item}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[idx] = { ...item, item: e.target.value };
                          onUpdate(newItems);
                        }}
                      />
                      <input
                        className="w-full text-[10px] text-gray-500 bg-white border border-gray-100 rounded px-1 outline-none focus:border-finivis-blue italic"
                        value={item.reason || ''}
                        placeholder="Reason..."
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[idx] = { ...item, reason: e.target.value };
                          onUpdate(newItems);
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <p className="font-medium text-gray-800 text-xs">{item.item}</p>
                      {item.reason && (
                        <p className="text-gray-500 mt-0.5 italic text-[11px]">{item.reason}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
              {!isEditing && item.priority && (
                <span className={`ml-3.5 mt-1 inline-block text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${item.priority === 'Critical' ? 'bg-red-100 text-red-600' :
                    item.priority === 'High' ? 'bg-orange-100 text-orange-600' :
                      'bg-gray-100 text-gray-500'
                  }`}>
                  {item.priority}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
