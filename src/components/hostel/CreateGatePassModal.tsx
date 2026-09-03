import React, { useState, useEffect } from 'react';
import { 
  X, 
  AlertCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  ShieldAlert, 
  FileText, 
  Paperclip, 
  CheckCircle2, 
  Building2,
  Navigation,
  Phone
} from 'lucide-react';
import { StudentGatePass, GatePassType, GatePassTravelMode, GatePassTravelingWith } from '../../types';
import { studentGatePassService } from '../../services/studentGatePassService';
import { Badge } from '../common/Badge';

interface CreateGatePassModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  allotment: any;
  onSuccess: (newPass: StudentGatePass) => void;
}

export const CreateGatePassModal: React.FC<CreateGatePassModalProps> = ({
  isOpen,
  onClose,
  student,
  allotment,
  onSuccess
}) => {
  // Form State
  const [passType, setPassType] = useState<GatePassType>('Day Out');
  const [reason, setReason] = useState('');
  const [leavingDate, setLeavingDate] = useState(new Date().toISOString().split('T')[0]);
  const [leavingTime, setLeavingTime] = useState('17:00');
  const [expectedReturnDate, setExpectedReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedReturnTime, setExpectedReturnTime] = useState('21:00');
  const [destination, setDestination] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [travelMode, setTravelMode] = useState<GatePassTravelMode>('Public Transport');
  const [travelingWith, setTravelingWith] = useState<GatePassTravelingWith>('Alone');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check active pass
  const { hasActive, activePass } = studentGatePassService.hasActiveOrOverlappingPass(student?.enrollmentNo || '26SSIU001');

  useEffect(() => {
    if (student) {
      setEmergencyContact(student.parentMobile || student.fatherMobile || student.mobile || '+91 98250 11223');
    }
  }, [student]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
      // Create a mock local file reference for UI demonstration
      setAttachment(`DOC_${Date.now()}_${file.name}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (hasActive) {
      setErrorMsg(`You already have an active or overlapping Gate Pass (${activePass?.requestNo} - ${activePass?.status}).`);
      return;
    }

    if (!reason.trim()) {
      setErrorMsg('Please state the specific reason for requesting this gate pass.');
      return;
    }

    if (!destination.trim()) {
      setErrorMsg('Please specify the destination location.');
      return;
    }

    if (!declarationAccepted) {
      setErrorMsg('You must confirm that the information provided in this request is correct.');
      return;
    }

    const startDateTime = new Date(`${leavingDate}T${leavingTime}:00`);
    const endDateTime = new Date(`${expectedReturnDate}T${expectedReturnTime}:00`);

    if (endDateTime.getTime() <= startDateTime.getTime()) {
      setErrorMsg('Expected Return Date & Time must be strictly after Leaving Date & Time.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = studentGatePassService.createGatePass(
        {
          studentId: student.id,
          studentName: student.name,
          enrollmentNo: student.enrollmentNo,
          studentPhoto: student.photo,
          programName: student.programName || student.programId || 'B.Tech CSE',
          departmentName: student.departmentName || student.branchName || student.branch || 'Computer Science & Engineering',
          semester: student.semester || 4,
          hostelId: allotment?.hostelId || 'hst-1',
          hostelName: allotment?.hostelName || 'Vivekananda Boys Hostel (Block A)',
          block: allotment?.block || 'Block A',
          roomNo: allotment?.roomNumber || 'A-204',
          bedNo: allotment?.bedNumber || 'Bed-1',
          parentGuardianName: student.parentName || student.fatherName || 'Mr. Rameshchandra Sharma',
          parentGuardianMobile: emergencyContact,
          passType,
          purpose: passType,
          reason: reason.trim(),
          destination: destination.trim(),
          destinationAddress: destinationAddress.trim() || destination.trim(),
          leavingDate,
          leavingTime,
          expectedReturnDate,
          expectedReturnTime,
          outingDate: leavingDate,
          expectedOutTime: leavingTime,
          travelMode,
          modeOfTravel: travelMode,
          travelingWith,
          emergencyContact: emergencyContact.trim(),
          attachment: attachment || undefined,
          declarationAccepted: true,
          isEmergency: passType === 'Emergency',
          priority: passType === 'Emergency' ? 'EMERGENCY' : 'NORMAL'
        },
        student
      );

      onSuccess(created);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit Gate Pass request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 bg-slate-900 border border-slate-700/70 rounded-2xl shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-850 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-indigo-500/20 border border-orange-500/30 text-orange-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">New Hostel Gate Pass Request</h2>
              <p className="text-xs text-slate-400 font-mono">Official University Campus Leave Application</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Active Pass Warning */}
          {hasActive && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-200">
                <strong className="font-semibold block text-rose-300">You already have an active Gate Pass!</strong>
                Request <span className="font-mono font-bold text-white">{activePass?.requestNo}</span> is currently in state{' '}
                <span className="font-semibold text-rose-400">{activePass?.status}</span>. You cannot submit another request until your current Gate Pass cycle is closed.
              </div>
            </div>
          )}

          {/* Error Message Banner */}
          {errorMsg && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Read-Only Student Identity Section */}
          <div className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700/50">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-orange-400" />
                Student Identity (Official Record)
              </span>
              <span className="text-[11px] font-mono text-emerald-400 font-medium">✓ Verified Active Enrollment</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-medium">Enrollment No</span>
                <p className="font-mono font-bold text-white text-sm tracking-wide">{student?.enrollmentNo}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-medium">Student Name</span>
                <p className="font-semibold text-slate-200 truncate">{student?.name}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-medium">Program &amp; Sem</span>
                <p className="text-slate-300 truncate">{student?.programName || 'B.Tech CSE'} (Sem {student?.semester || 4})</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-medium">Hostel &amp; Room</span>
                <p className="text-orange-300 font-medium truncate">{allotment?.roomNumber || 'A-204'} ({allotment?.block || 'Block A'})</p>
              </div>
            </div>
          </div>

          {/* Request Inputs */}
          <div className="space-y-4">
            
            {/* Gate Pass Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Gate Pass Type <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['Day Out', 'Night Out', 'Home Visit', 'Medical', 'Emergency', 'Personal', 'Other'] as GatePassType[]).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPassType(type)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-left flex items-center justify-between ${
                      passType === type 
                        ? type === 'Emergency'
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold shadow-sm shadow-rose-500/20'
                          : 'bg-orange-500/20 border-orange-500 text-orange-300 font-bold shadow-sm shadow-orange-500/20'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <span>{type}</span>
                    {type === 'Emergency' && <span className="text-[10px] text-rose-400 uppercase font-bold">Urgent</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reason / Purpose <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={2}
                placeholder="State the detailed reason for leaving campus..."
                className="w-full px-3 py-2 text-xs bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                required
              />
            </div>

            {/* Timing Schedule Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-xl">
              
              {/* Leaving Schedule */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Leaving Schedule
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Date *</label>
                    <input
                      type="date"
                      value={leavingDate}
                      onChange={e => setLeavingDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Time *</label>
                    <input
                      type="time"
                      value={leavingTime}
                      onChange={e => setLeavingTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Expected Return Schedule */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wide flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Expected Return Schedule
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Date *</label>
                    <input
                      type="date"
                      value={expectedReturnDate}
                      onChange={e => setExpectedReturnDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Time *</label>
                    <input
                      type="time"
                      value={expectedReturnTime}
                      onChange={e => setExpectedReturnTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Destination Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Destination City / Area <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    placeholder="e.g. Gandhinagar Sector 21"
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Destination Full Address
                </label>
                <input
                  type="text"
                  value={destinationAddress}
                  onChange={e => setDestinationAddress(e.target.value)}
                  placeholder="Street / Landmark / Apartment (Optional)"
                  className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Travel Details & Emergency Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Traveling With
                </label>
                <select
                  value={travelingWith}
                  onChange={e => setTravelingWith(e.target.value as GatePassTravelingWith)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="Alone">Alone</option>
                  <option value="Parent / Guardian">Parent / Guardian</option>
                  <option value="Friend">Friend / Peer</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Transportation Mode
                </label>
                <select
                  value={travelMode}
                  onChange={e => setTravelMode(e.target.value as GatePassTravelMode)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="Public Transport">Public Transport / Bus</option>
                  <option value="Two Wheeler">Two Wheeler (Bike/Scooter)</option>
                  <option value="Four Wheeler">Four Wheeler / Cab</option>
                  <option value="Walking">Walking</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Emergency Contact <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="tel"
                    value={emergencyContact}
                    onChange={e => setEmergencyContact(e.target.value)}
                    placeholder="+91 98250 12345"
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500 font-mono"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Optional Attachment */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Supporting Attachment (Optional / Required for Medical/Emergency)
              </label>
              <div className="flex items-center gap-3">
                <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 cursor-pointer flex items-center gap-2 transition-colors">
                  <Paperclip className="w-3.5 h-3.5 text-orange-400" />
                  <span>Choose File (PDF/Image)</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {attachmentName && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {attachmentName}
                  </span>
                )}
              </div>
            </div>

            {/* Declaration Checkbox */}
            <div className="pt-2 border-t border-slate-800">
              <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={declarationAccepted}
                  onChange={e => setDeclarationAccepted(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-orange-500 focus:ring-orange-500 focus:ring-offset-slate-900"
                  required
                />
                <span>
                  I confirm that the information provided in this Gate Pass request is correct and I will strictly adhere to university hostel curfew regulations.
                </span>
              </label>
            </div>

          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || hasActive}
              className={`px-5 py-2 text-xs font-bold rounded-lg transition-all shadow-md flex items-center gap-2 ${
                hasActive
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : passType === 'Emergency'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                  : 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-600/30'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Gate Pass Request'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
