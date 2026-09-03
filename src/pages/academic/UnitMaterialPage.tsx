import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Badge } from '../../components/common/Badge';
import { UnitMaterial } from '../../types';
import { FileText, Download, Plus, Trash2, BookOpen, Filter, Search, Eye, Edit2, Archive, CheckCircle2, Globe, Lock } from 'lucide-react';
import { fileStorage } from '../../services/fileStorage';
import { can } from '../../services/userAccountManagementService';
import { sessionPlanService } from '../../services/sessionPlanService';

export const UnitMaterialPage: React.FC = () => {
  const { user, role } = useAuth();
  const isStudent = role === 'STUDENT';
  const isMentor = role === 'MENTOR';
  const canCreate = can(user, 'STUDY_MATERIAL', 'CREATE') && !isStudent && !isMentor;
  const canEdit = can(user, 'STUDY_MATERIAL', 'EDIT') && !isStudent && !isMentor;
  const canDelete = can(user, 'STUDY_MATERIAL', 'DELETE') && !isStudent && !isMentor;
  const isReadOnly = isStudent || isMentor || (!canCreate && !canEdit);

  const subjects = useMemo(() => {
    return sessionPlanService.getFacultySubjects(user, role || undefined);
  }, [user, role]);

  const [materials, setMaterials] = useState<UnitMaterial[]>(() => db.getUnitMaterials());

  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || 'ALL');
  const [selectedUnitNo, setSelectedUnitNo] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<UnitMaterial | null>(null);

  // Upload/Edit Form State
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [unitNo, setUnitNo] = useState(1);
  const [unitTitle, setUnitTitle] = useState('Unit 1: Fundamentals & Concepts');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [materialStatus, setMaterialStatus] = useState<'PUBLISHED' | 'ARCHIVED' | 'DRAFT'>('PUBLISHED');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const refreshMaterials = () => {
    setMaterials([...db.getUnitMaterials()]);
  };

  const filteredMaterials = materials.filter(m => {
    // Students only see PUBLISHED materials
    if (isStudent && m.status && m.status !== 'PUBLISHED') return false;
    
    const matchesSubject = selectedSubjectId === 'ALL' || m.subjectId === selectedSubjectId;
    const matchesUnit = selectedUnitNo === 'ALL' || String(m.unitNo) === selectedUnitNo;
    const matchesStatus = selectedStatusFilter === 'ALL' || (m.status || 'PUBLISHED') === selectedStatusFilter;
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) || m.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSubject && matchesUnit && matchesStatus && matchesSearch;
  });

  const handleOpenUpload = () => {
    setEditingMaterial(null);
    setSubjectId(subjects[0]?.id || '');
    setUnitNo(1);
    setUnitTitle('Unit 1: Fundamentals & Architecture');
    setTitle('');
    setDescription('');
    setMaterialStatus('PUBLISHED');
    setUploadFile(null);
    setIsUploadModalOpen(true);
  };

  const handleOpenEdit = (item: UnitMaterial) => {
    setEditingMaterial(item);
    setSubjectId(item.subjectId);
    setUnitNo(item.unitNo);
    setUnitTitle(item.unitTitle);
    setTitle(item.title);
    setDescription(item.description);
    setMaterialStatus(item.status || 'PUBLISHED');
    setUploadFile(null);
    setIsUploadModalOpen(true);
  };

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      if (editingMaterial) {
        let fileUrl = editingMaterial.fileUrl;
        let fileType = editingMaterial.fileType;
        let fileSize = editingMaterial.fileSize;

        if (uploadFile) {
          fileUrl = await fileStorage.saveFile(uploadFile);
          let fileExt = uploadFile.name.split('.').pop()?.toUpperCase() || 'FILE';
          if (fileExt.length > 4) fileExt = 'FILE';
          fileType = fileExt as any;
          fileSize = (uploadFile.size / (1024 * 1024)).toFixed(2) + ' MB';
        }

        db.updateEntity<UnitMaterial>('unitMaterials', editingMaterial.id, {
          subjectId,
          unitNo: Number(unitNo),
          unitTitle,
          title,
          description,
          fileType,
          fileSize,
          fileUrl,
          status: materialStatus
        }, `Updated study material: ${title}`);

        refreshMaterials();
        setIsUploadModalOpen(false);
      } else {
        if (!uploadFile) {
          alert('Please select a file to upload.');
          setIsUploading(false);
          return;
        }

        const fileId = await fileStorage.saveFile(uploadFile);
        let fileExt = uploadFile.name.split('.').pop()?.toUpperCase() || 'FILE';
        if (fileExt.length > 4) fileExt = 'FILE';

        const newMaterial: Omit<UnitMaterial, 'id'> = {
          subjectId,
          unitNo: Number(unitNo),
          unitTitle,
          title,
          description,
          fileType: fileExt as any,
          fileSize: (uploadFile.size / (1024 * 1024)).toFixed(2) + ' MB',
          fileUrl: fileId,
          uploadedByFacultyId: user?.id || 'fac-1',
          uploadedByFacultyName: user?.name || 'Prof. Faculty Member',
          uploadedDate: new Date().toISOString().split('T')[0],
          status: materialStatus
        };

        db.addEntity<UnitMaterial>('unitMaterials', newMaterial, `Uploaded study material: ${title}`);
        
        if (materialStatus === 'PUBLISHED') {
          db.addNotification({
            title: `New Study Material Published: ${title}`,
            message: `Unit ${unitNo}: ${unitTitle} reference material published by ${user?.name || 'Faculty'}.`,
            module: 'MATERIAL',
            timestamp: 'Just now',
            targetRole: 'STUDENT',
            linkTab: 'materials'
          });
        }

        refreshMaterials();
        setIsUploadModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save study material file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTogglePublish = (mat: UnitMaterial) => {
    const nextStatus = mat.status === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED';
    db.updateEntity<UnitMaterial>('unitMaterials', mat.id, {
      status: nextStatus
    }, `Changed study material status to ${nextStatus}`);
    refreshMaterials();
  };

  const handleDeleteMaterial = async (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this study material entry?')) {
      const material = materials.find(m => m.id === id);
      if (material && material.fileUrl.startsWith('idb://')) {
        await fileStorage.deleteFile(material.fileUrl);
      }
      db.deleteEntity('unitMaterials', id, 'Deleted study material');
      refreshMaterials();
    }
  };

  const handleDownload = (fileUrl: string, title: string) => {
    fileStorage.downloadFile(fileUrl, title);
  };

  const handleView = (fileUrl: string) => {
    fileStorage.viewFile(fileUrl);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
            Unit Study Material &amp; Course Repository
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {isStudent 
              ? 'Access, preview, and download official published curriculum lecture notes & resources' 
              : 'Upload, publish, update, and archive unit study notes, presentations, and lab reference materials'}
          </p>
        </div>

        {canCreate && (
          <button className="btn btn-primary" onClick={handleOpenUpload} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> Upload Study Material
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: !isStudent ? 'repeat(auto-fit, minmax(200px, 1fr))' : 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Subject</label>
            <select className="form-select" value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)}>
              <option value="ALL">All Subjects</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Unit Number</label>
            <select className="form-select" value={selectedUnitNo} onChange={e => setSelectedUnitNo(e.target.value)}>
              <option value="ALL">All Units</option>
              <option value="1">Unit 1</option>
              <option value="2">Unit 2</option>
              <option value="3">Unit 3</option>
              <option value="4">Unit 4</option>
              <option value="5">Unit 5</option>
            </select>
          </div>

          {!isStudent && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Publication Status</label>
              <select className="form-select" value={selectedStatusFilter} onChange={e => setSelectedStatusFilter(e.target.value)}>
                <option value="ALL">All Statuses</option>
                <option value="PUBLISHED">Published (Student Visible)</option>
                <option value="ARCHIVED">Archived</option>
                <option value="DRAFT">Draft (Unpublished)</option>
              </select>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Search Material</label>
            <div style={{ position: 'relative' }}>
              <input type="text" className="form-input" placeholder="Search title or topic..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ paddingLeft: '2.2rem' }} />
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Materials Cards Grid */}
      <div className="grid-2">
        {filteredMaterials.length === 0 ? (
          <div className="card" style={{ gridColumn: 'span 2', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={48} color="var(--brand-gold)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h4 style={{ fontSize: '1.125rem', fontWeight: 700 }}>No Study Materials Found</h4>
            <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Try clearing your filters or check back after faculty uploads.</p>
          </div>
        ) : (
          filteredMaterials.map(mat => {
            const subj = db.getSubjectById(mat.subjectId);
            const status = mat.status || 'PUBLISHED';

            return (
              <div key={mat.id} className="card card-hover" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: status === 'PUBLISHED' ? '4px solid #10B981' : (status === 'ARCHIVED' ? '4px solid #64748B' : '4px solid #F59E0B') }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <Badge variant="orange">Unit {mat.unitNo}</Badge>
                      {!isStudent && (
                        <Badge variant={status === 'PUBLISHED' ? 'active' : (status === 'ARCHIVED' ? 'inactive' : 'gold')}>
                          {status}
                        </Badge>
                      )}
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: 'var(--brand-navy-subtle)', color: 'var(--brand-navy)' }}>
                      {mat.fileType} • {mat.fileSize || '2.8 MB'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.35rem' }}>
                    {mat.title}
                  </h3>

                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--brand-orange)', marginBottom: '0.5rem' }}>
                    {subj?.name} ({subj?.code})
                  </div>

                  <p style={{ fontSize: '0.84375rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
                    {mat.description || mat.unitTitle}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Uploaded by <strong>{mat.uploadedByFacultyName}</strong> on {mat.uploadedDate}
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {!isReadOnly && canEdit && (
                      <>
                        <button
                          className={`btn btn-sm ${status === 'PUBLISHED' ? 'btn-secondary' : 'btn-primary'}`}
                          onClick={() => handleTogglePublish(mat)}
                          title={status === 'PUBLISHED' ? 'Archive Material' : 'Publish to Students'}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          {status === 'PUBLISHED' ? <Archive size={13} /> : <Globe size={13} />}
                          {status === 'PUBLISHED' ? 'Archive' : 'Publish'}
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(mat)} title="Edit metadata">
                          <Edit2 size={13} />
                        </button>
                        {canDelete && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteMaterial(mat.id)} title="Delete material">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </>
                    )}
                    <button className="btn btn-secondary btn-sm" onClick={() => handleView(mat.fileUrl)} title="View Document">
                      <Eye size={13} /> View
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => handleDownload(mat.fileUrl, mat.title)} title="Download Document">
                      <Download size={13} /> Download
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Upload / Edit Material Modal */}
      {isUploadModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '540px', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1.25rem' }}>
              {editingMaterial ? 'Edit Study Material' : 'Upload Unit Study Material'}
            </h3>

            <form onSubmit={handleSaveMaterial} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Subject *</label>
                <select className="form-select" value={subjectId} onChange={e => setSubjectId(e.target.value)} required>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Unit Number *</label>
                  <input type="number" className="form-input" min={1} max={10} value={unitNo} onChange={e => setUnitNo(Number(e.target.value))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Publication Status *</label>
                  <select className="form-select" value={materialStatus} onChange={e => setMaterialStatus(e.target.value as any)}>
                    <option value="PUBLISHED">PUBLISHED (Live to Students)</option>
                    <option value="DRAFT">DRAFT (Saved Privately)</option>
                    <option value="ARCHIVED">ARCHIVED (Inactive)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Unit Title / Module Name *</label>
                <input type="text" className="form-input" placeholder="e.g. Unit 1: Introduction & System Architecture" value={unitTitle} onChange={e => setUnitTitle(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Resource Title *</label>
                <input type="text" className="form-input" placeholder="e.g. Module 1 Lecture Notes & Tutorial Sheet" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Short Description</label>
                <textarea className="form-input" rows={2} placeholder="Brief summary of concepts covered..." value={description} onChange={e => setDescription(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">{editingMaterial ? 'Replace File (Optional)' : 'Upload File *'}</label>
                <input type="file" className="form-input" onChange={e => setUploadFile(e.target.files?.[0] || null)} required={!editingMaterial} accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,image/*" />
                {editingMaterial && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                    Leave empty to keep existing file.
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsUploadModalOpen(false)} disabled={isUploading}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isUploading}>
                  {isUploading ? 'Saving...' : (editingMaterial ? 'Update Material' : 'Upload & Publish')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
