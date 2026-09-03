import React, { useState } from 'react';
import { 
  X, User, Mail, Phone, MapPin, Building2, Briefcase, GraduationCap, 
  Calendar, ShieldCheck, DollarSign, CheckCircle2, AlertCircle, Sparkles
} from 'lucide-react';
import { db } from '../../services/db';
import { hrmsService } from '../../services/hrmsService';
import { EmployeeType, EmploymentType, User as UserType } from '../../types';
import { useModalScrollLock } from '../../utils/modalScrollLock';

interface OnboardEmployeeModalProps {
  currentUser: UserType;
  onClose: () => void;
  onSuccess: (empId: string) => void;
}

export const OnboardEmployeeModal: React.FC<OnboardEmployeeModalProps> = ({
  currentUser,
  onClose,
  onSuccess
}) => {
  useModalScrollLock(true, onClose);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Step 1: Personal & Contact
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('1990-01-01');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [address, setAddress] = useState('Campus Quarters, Gandhinagar, Gujarat');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Step 2: Organizational Placement
  const [employeeType, setEmployeeType] = useState<EmployeeType>('FACULTY');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('PERMANENT');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [instituteId, setInstituteId] = useState('inst-1');
  const [departmentId, setDepartmentId] = useState('dept-1');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportingManagerName, setReportingManagerName] = useState('Dr. Head of Department');
  const [workLocation, setWorkLocation] = useState('Main Academic Block A');

  // Step 3: Academic & Experience
  const [qualification, setQualification] = useState('Ph.D Computer Science & Engineering');
  const [highestDegree, setHighestDegree] = useState('Doctor of Philosophy (Ph.D)');
  const [specialization, setSpecialization] = useState('Cloud Computing & Machine Learning');
  const [experienceYears, setExperienceYears] = useState<number>(5);
  const [previousInstitute, setPreviousInstitute] = useState('Gujarat Technological University');

  // Step 4: Compensation, Bank & Statutory
  const [salary, setSalary] = useState<number>(75000);
  const [panNo, setPanNo] = useState('ABCDE1234F');
  const [aadhaarNo, setAadhaarNo] = useState('1234-5678-9012');
  const [bankName, setBankName] = useState('State Bank of India');
  const [bankAccountNo, setBankAccountNo] = useState(`309100${Math.floor(100000 + Math.random() * 900000)}`);
  const [ifscCode, setIfscCode] = useState('SBIN0001234');
  const [password, setPassword] = useState('Employee@123');
  const [activateLogin, setActivateLogin] = useState(true);

  const institutes = db.getInstitutes();
  const departments = db.getDepartments();

  const handleNext = () => {
    setErrorMsg('');
    if (step === 1) {
      if (!name.trim() || !email.trim() || !phone.trim()) {
        setErrorMsg('Please provide candidate name, email, and phone.');
        return;
      }
      const dup = hrmsService.checkDuplicates({ email, phone });
      if (dup.hasDuplicate) {
        setErrorMsg(dup.message || 'Duplicate email or phone detected.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!designation.trim()) {
        setErrorMsg('Please specify designation.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!qualification.trim()) {
        setErrorMsg('Please specify highest qualification.');
        return;
      }
      setStep(4);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!panNo.trim() || !aadhaarNo.trim()) {
      setErrorMsg('PAN and Aadhaar numbers are required for payroll & compliance.');
      return;
    }

    const dup = hrmsService.checkDuplicates({ email, phone, panNo, aadhaarNo });
    if (dup.hasDuplicate) {
      setErrorMsg(dup.message || 'Duplicate identity documents detected.');
      return;
    }

    const result = hrmsService.onboardEmployee({
      name,
      email,
      phone,
      dob,
      gender,
      bloodGroup,
      address,
      emergencyContactName,
      emergencyContactPhone,
      employeeType,
      employmentType,
      designation,
      instituteId,
      departmentId,
      joiningDate,
      reportingManagerName,
      workLocation,
      qualification,
      highestDegree,
      specialization,
      experienceYears: Number(experienceYears),
      previousInstitute,
      salary: Number(salary),
      panNo: panNo.toUpperCase().trim(),
      aadhaarNo: aadhaarNo.trim(),
      bankName,
      bankAccountNo,
      ifscCode,
      password,
      activateLogin
    }, currentUser);

    if (result.success && result.employee) {
      onSuccess(result.employee.id);
    } else {
      setErrorMsg(result.message || 'Failed to onboard employee.');
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1050, padding: '1rem'
    }}>
      <div className="modal-container bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Onboard New University Employee</h3>
              <p className="text-xs text-blue-100">Step {step} of 4 • Create Master Record & Auto-Provision Credentials</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold">
          <div className={`p-3 text-center border-r border-slate-200 dark:border-slate-800 ${step === 1 ? 'text-blue-600 bg-blue-50/50 dark:bg-blue-950/20' : 'text-slate-500'}`}>
            1. Personal & Contact
          </div>
          <div className={`p-3 text-center border-r border-slate-200 dark:border-slate-800 ${step === 2 ? 'text-blue-600 bg-blue-50/50 dark:bg-blue-950/20' : 'text-slate-500'}`}>
            2. Role & Department
          </div>
          <div className={`p-3 text-center border-r border-slate-200 dark:border-slate-800 ${step === 3 ? 'text-blue-600 bg-blue-50/50 dark:bg-blue-950/20' : 'text-slate-500'}`}>
            3. Academic & Experience
          </div>
          <div className={`p-3 text-center ${step === 4 ? 'text-blue-600 bg-blue-50/50 dark:bg-blue-950/20' : 'text-slate-500'}`}>
            4. Salary & Statutory
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs text-slate-800 dark:text-slate-200">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: PERSONAL & CONTACT */}
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block font-semibold mb-1">Full Legal Name *</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="e.g. Dr. Ramesh C. Sharma" 
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" 
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Gender *</label>
                <select value={gender} onChange={e => setGender(e.target.value as any)} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Official Email *</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="ramesh.sharma@ssiu.edu.in" 
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" 
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Mobile Phone *</label>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  placeholder="+91 98765 43210" 
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" 
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Date of Birth *</label>
                <input 
                  type="date" 
                  value={dob} 
                  onChange={e => setDob(e.target.value)} 
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-semibold mb-1">Residential Address</label>
                <input 
                  type="text" 
                  value={address} 
                  onChange={e => setAddress(e.target.value)} 
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" 
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Blood Group</label>
                <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs">
                  <option value="A+">A+</option>
                  <option value="B+">B+</option>
                  <option value="O+">O+</option>
                  <option value="AB+">AB+</option>
                  <option value="A-">A-</option>
                  <option value="B-">B-</option>
                  <option value="O-">O-</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 2: ROLE & DEPARTMENT */}
          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold mb-1">Employee Type *</label>
                <select value={employeeType} onChange={e => setEmployeeType(e.target.value as any)} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs">
                  <option value="FACULTY">Faculty / Teaching</option>
                  <option value="ADMINISTRATIVE">Administrative Staff</option>
                  <option value="TECHNICAL">Technical Staff</option>
                  <option value="LAB_STAFF">Laboratory Staff</option>
                  <option value="LIBRARY">Library Staff</option>
                  <option value="IT">IT & Networking</option>
                  <option value="SUPPORT">Support Staff</option>
                  <option value="SECURITY">Campus Security</option>
                  <option value="HOUSEKEEPING">Housekeeping</option>
                  <option value="MAINTENANCE">Estate / Maintenance</option>
                  <option value="DRIVER">Transportation / Driver</option>
                  <option value="OTHER">Other University Employee</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Employment Type *</label>
                <select value={employmentType} onChange={e => setEmploymentType(e.target.value as any)} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs">
                  <option value="PERMANENT">Permanent</option>
                  <option value="PROBATION">Probation</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="TEMPORARY">Temporary</option>
                  <option value="PART_TIME">Part-Time</option>
                  <option value="VISITING">Visiting Faculty</option>
                  <option value="GUEST">Guest Lecturer</option>
                  <option value="CONSULTANT">Consultant</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Designation *</label>
                <input 
                  type="text" 
                  value={designation} 
                  onChange={e => setDesignation(e.target.value)} 
                  placeholder="e.g. Associate Professor" 
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" 
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Institute *</label>
                <select value={instituteId} onChange={e => setInstituteId(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs">
                  {institutes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Department *</label>
                <select value={departmentId} onChange={e => setDepartmentId(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs">
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Joining Date *</label>
                <input 
                  type="date" 
                  value={joiningDate} 
                  onChange={e => setJoiningDate(e.target.value)} 
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" 
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Reporting Authority</label>
                <input 
                  type="text" 
                  value={reportingManagerName} 
                  onChange={e => setReportingManagerName(e.target.value)} 
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-semibold mb-1">Work Location / Cabin</label>
                <input 
                  type="text" 
                  value={workLocation} 
                  onChange={e => setWorkLocation(e.target.value)} 
                  placeholder="e.g. Block A, Room 204" 
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" 
                />
              </div>
            </div>
          )}

          {/* STEP 3: ACADEMIC & EXPERIENCE */}
          {step === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">Highest Degree / Qualification *</label>
                <input 
                  type="text" 
                  value={qualification} 
                  onChange={e => setQualification(e.target.value)} 
                  placeholder="e.g. Ph.D Computer Science" 
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" 
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Degree Title</label>
                <input 
                  type="text" 
                  value={highestDegree} 
                  onChange={e => setHighestDegree(e.target.value)} 
                  placeholder="e.g. Doctor of Philosophy (Ph.D)" 
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" 
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Field of Specialization</label>
                <input 
                  type="text" 
                  value={specialization} 
                  onChange={e => setSpecialization(e.target.value)} 
                  placeholder="e.g. Artificial Intelligence, VLSI" 
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" 
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Total Experience (Years)</label>
                <input 
                  type="number" 
                  value={experienceYears} 
                  onChange={e => setExperienceYears(Number(e.target.value))} 
                  min={0}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-semibold mb-1">Previous University / Employer</label>
                <input 
                  type="text" 
                  value={previousInstitute} 
                  onChange={e => setPreviousInstitute(e.target.value)} 
                  placeholder="e.g. Indian Institute of Technology Bombay" 
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" 
                />
              </div>
            </div>
          )}

          {/* STEP 4: SALARY & STATUTORY */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Monthly Gross Salary (INR) *</label>
                  <input 
                    type="number" 
                    value={salary} 
                    onChange={e => setSalary(Number(e.target.value))} 
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-blue-600" 
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">PAN Card Number *</label>
                  <input 
                    type="text" 
                    value={panNo} 
                    onChange={e => setPanNo(e.target.value.toUpperCase())} 
                    placeholder="ABCDE1234F" 
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono" 
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Aadhaar Card Number *</label>
                  <input 
                    type="text" 
                    value={aadhaarNo} 
                    onChange={e => setAadhaarNo(e.target.value)} 
                    placeholder="1234-5678-9012" 
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono" 
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Bank Name</label>
                  <input 
                    type="text" 
                    value={bankName} 
                    onChange={e => setBankName(e.target.value)} 
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" 
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Bank Account Number</label>
                  <input 
                    type="text" 
                    value={bankAccountNo} 
                    onChange={e => setBankAccountNo(e.target.value)} 
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono" 
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">IFSC Code</label>
                  <input 
                    type="text" 
                    value={ifscCode} 
                    onChange={e => setIfscCode(e.target.value.toUpperCase())} 
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono" 
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="activateLoginCheck" 
                    checked={activateLogin} 
                    onChange={e => setActivateLogin(e.target.checked)} 
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <label htmlFor="activateLoginCheck" className="font-bold text-slate-900 dark:text-white cursor-pointer">
                    Automatically Activate Employee Portal Login Account
                  </label>
                </div>
                {activateLogin && (
                  <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-slate-500">Auto Username:</span>
                      <p className="font-mono font-bold">{email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Initial Password:</span>
                      <input 
                        type="text" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        className="w-full p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono" 
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as any)}
              className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-300 transition"
            >
              Back
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-md shadow-blue-500/20 transition"
              >
                Continue to Step {step + 1}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="px-6 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Complete Onboarding
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
