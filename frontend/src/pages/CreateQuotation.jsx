import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createQuotation } from '../services/quotations';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Select } from '../components/UI/Select';

const developerTypeOptions = [
  { value: 'cat1', label: 'Category 1' },
  { value: 'cat2', label: 'Category 2' },
  { value: 'cat3', label: 'Category 3' },
  { value: 'agent', label: 'Agent Registration' }
];

const regionGroups = [
  { 
    label: 'Mumbai Metropolitan Region', 
    options: ['Mumbai Suburban', 'Mumbai City', 'Thane', 'Palghar'] 
  },
  { 
    label: 'Navi/KDMC/Raigad', 
    options: ['KDMC', 'Navi Mumbai', 'Raigad'] 
  },
  { 
    label: 'Pune & ROM', 
    options: ['Pune - City', 'Pune - PCMC', 'Pune - PMRDA', 'Pune - Rural', 'ROM (Rest of Maharashtra)'] 
  }
];

const validityOptions = ['7 days', '15 days', '30 days'];
const paymentScheduleOptions = ['50%', '70%', '100%'];

export default function CreateQuotation() {
  const navigate = useNavigate();
  
  // Form state
  const [form, setForm] = useState({
    developerType: '',
    projectRegion: '',
    projectLocation: '',
    plotArea: '',
    developerName: '',
    projectName: '',
    validity: '7 days',
    paymentSchedule: '50%',
    reraNumber: '',
    serviceSummary: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({});

  // Computed values
  const plotAreaNum = useMemo(() => Number(form.plotArea), [form.plotArea]);
  const plotAreaValid = useMemo(() => Number.isFinite(plotAreaNum) && plotAreaNum >= 0, [plotAreaNum]);
  
  const plotAreaBand = useMemo(() => {
    if (!plotAreaValid) return '';
    const v = plotAreaNum;
    if (v <= 500) return '0 - 500 sq units';
    if (v <= 1000) return '501 - 1000 sq units';
    if (v <= 1500) return '1001 - 1500 sq units';
    if (v <= 2500) return '1501 - 2500 sq units';
    if (v <= 4000) return '2501 - 4000 sq units';
    if (v <= 6500) return '4001 - 6500 sq units';
    return '6500+ sq units';
  }, [plotAreaValid, plotAreaNum]);

  // Form handlers
  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }

  function handleBlur(field) {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field);
  }

  function validateReraNumber(value) {
    if (!value) return true; // optional
    return /^[A-Z0-9]{3,5}-[A-Z0-9]{6,10}$/i.test(value);
  }

  const validateField = (field) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'developerType':
        if (!form.developerType) {
          newErrors.developerType = 'Developer type is required';
        } else {
          delete newErrors.developerType;
        }
        break;
        
      case 'projectRegion':
        if (!form.projectRegion) {
          newErrors.projectRegion = 'Project region is required';
        } else {
          delete newErrors.projectRegion;
        }
        break;
        
      case 'developerName':
        if (!form.developerName.trim()) {
          newErrors.developerName = 'Developer name is required';
        } else if (form.developerName.trim().length < 2) {
          newErrors.developerName = 'Developer name must be at least 2 characters';
        } else {
          delete newErrors.developerName;
        }
        break;
        
      case 'plotArea':
        if (!form.plotArea) {
          newErrors.plotArea = 'Plot area is required';
        } else if (!plotAreaValid) {
          newErrors.plotArea = 'Please enter a valid plot area';
        } else if (plotAreaNum <= 0) {
          newErrors.plotArea = 'Plot area must be greater than 0';
        } else {
          delete newErrors.plotArea;
        }
        break;
        
      case 'reraNumber':
        if (form.reraNumber && !validateReraNumber(form.reraNumber)) {
          newErrors.reraNumber = 'Invalid RERA number format (e.g., P52100012345)';
        } else {
          delete newErrors.reraNumber;
        }
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAllFields = () => {
    const fields = ['developerType', 'projectRegion', 'developerName', 'plotArea', 'reraNumber'];
    let isValid = true;
    
    fields.forEach(field => {
      if (!validateField(field)) {
        isValid = false;
      }
    });
    
    return isValid;
  };

  const canSubmit = form.developerType && 
                   form.projectRegion && 
                   form.developerName.trim().length > 0 && 
                   plotAreaValid && 
                   validateReraNumber(form.reraNumber);

  async function handleSubmit(e) {
    e.preventDefault();
    
    // Mark all fields as touched
    const allFields = ['developerType', 'projectRegion', 'developerName', 'plotArea', 'reraNumber'];
    setTouched(Object.fromEntries(allFields.map(field => [field, true])));
    
    if (!validateAllFields()) return;
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const quotationData = {
        developerType: form.developerType,
        projectRegion: form.projectRegion,
        projectLocation: form.projectLocation,
        plotArea: Number(form.plotArea),
        developerName: form.developerName,
        projectName: form.projectName || null,
        validity: form.validity,
        paymentSchedule: form.paymentSchedule,
        reraNumber: form.reraNumber || null,
        serviceSummary: form.serviceSummary || null,
        createdBy: form.developerName
      };

      const created = await createQuotation(quotationData);

      // Navigate to step 2 for categories 1-3
      if (form.developerType !== 'agent' && created?.id) {
        navigate(`/quotations/${encodeURIComponent(created.id)}/services`);
      } else {
        navigate('/');
      }
    } catch (err) {
      setErrors({ submit: 'Failed to save quotation. Please try again.' });
      console.error('Error creating quotation:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  const developerDependentDisabled = form.developerType === 'agent';

  // Redirect to agent registration if agent type is selected
  useEffect(() => {
    if (form.developerType === 'agent') {
      navigate('/quotations/new/agent', { replace: true });
    }
  }, [form.developerType, navigate]);

  // Auto-save draft functionality
  useEffect(() => {
    if (canSubmit) {
      const timer = setTimeout(() => {
        // Auto-save logic here if needed
        console.log('Auto-saving draft...');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [form, canSubmit]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-slate-100"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Create New Quotation</h1>
              <p className="text-slate-600 mt-1">Enter project, developer, and scope details</p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <span className="ml-3 text-sm font-medium text-slate-900">Basic Information</span>
            </div>
            <div className="flex-1 h-px bg-slate-200 mx-4"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-sm">
                2
              </div>
              <span className="ml-3 text-sm text-slate-600">Services & Pricing</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Developer Information Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Developer Information</h2>
                <p className="text-sm text-slate-600">Choose developer category and enter details</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Developer Type *"
                value={form.developerType}
                onChange={(e) => handleChange('developerType', e.target.value)}
                onBlur={() => handleBlur('developerType')}
                error={touched.developerType ? errors.developerType : ''}
                placeholder="Select developer category"
              >
                {developerTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>

              <Input
                label="Developer Name *"
                placeholder="Enter developer or company name"
                value={form.developerName}
                onChange={(e) => handleChange('developerName', e.target.value)}
                onBlur={() => handleBlur('developerName')}
                error={touched.developerName ? errors.developerName : ''}
                disabled={developerDependentDisabled}
              />
            </div>
          </div>

          {/* Project Information Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h1a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Project Information</h2>
                <p className="text-sm text-slate-600">Enter project details and location</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Project Name"
                placeholder="Enter project name"
                value={form.projectName}
                onChange={(e) => handleChange('projectName', e.target.value)}
                disabled={developerDependentDisabled}
              />

              <Select
                label="Project Region *"
                value={form.projectRegion}
                onChange={(e) => handleChange('projectRegion', e.target.value)}
                onBlur={() => handleBlur('projectRegion')}
                error={touched.projectRegion ? errors.projectRegion : ''}
                disabled={developerDependentDisabled}
                placeholder="Select project region"
              >
                {regionGroups.map(group => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>

              <Input
                label="Project Location"
                placeholder="Specific location within region"
                value={form.projectLocation}
                onChange={(e) => handleChange('projectLocation', e.target.value)}
                disabled={developerDependentDisabled}
              />

              <div>
                <Input
                  label="Plot Area (sq units) *"
                  type="number"
                  placeholder="Enter plot area"
                  value={form.plotArea}
                  onChange={(e) => handleChange('plotArea', e.target.value)}
                  onBlur={() => handleBlur('plotArea')}
                  error={touched.plotArea ? errors.plotArea : ''}
                  disabled={developerDependentDisabled}
                  min="1"
                  step="1"
                />
                {plotAreaBand && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Area Band:</span> {plotAreaBand}
                    </p>
                  </div>
                )}
              </div>

              <Input
                label="RERA Number"
                placeholder="e.g., P52100012345"
                value={form.reraNumber}
                onChange={(e) => handleChange('reraNumber', e.target.value.toUpperCase())}
                onBlur={() => handleBlur('reraNumber')}
                error={touched.reraNumber ? errors.reraNumber : ''}
                disabled={developerDependentDisabled}
              />
            </div>
          </div>

          {/* Terms & Conditions Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Terms & Conditions</h2>
                <p className="text-sm text-slate-600">Set validity period and payment terms</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Validity Period"
                value={form.validity}
                onChange={(e) => handleChange('validity', e.target.value)}
              >
                {validityOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>

              <Select
                label="Payment Schedule"
                value={form.paymentSchedule}
                onChange={(e) => handleChange('paymentSchedule', e.target.value)}
              >
                {paymentScheduleOptions.map(option => (
                  <option key={option} value={option}>
                    {option} advance payment
                  </option>
                ))}
              </Select>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Service Summary
              </label>
              <textarea
                className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                rows={4}
                placeholder="Brief description of services to be provided (optional)..."
                value={form.serviceSummary}
                onChange={(e) => handleChange('serviceSummary', e.target.value)}
                maxLength={500}
              />
              <div className="mt-1 text-xs text-slate-500 text-right">
                {form.serviceSummary.length}/500 characters
              </div>
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-slide-down">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-800 font-medium">{errors.submit}</p>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-slate-600">All required fields must be completed</span>
              </div>
              
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                >
                  Cancel
                </Button>
                
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!canSubmit || isSubmitting}
                  onClick={() => {
                    // Save as draft logic
                    console.log('Saving as draft...');
                  }}
                >
                  Save as Draft
                </Button>
                
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="min-w-[140px]"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Continue to Services'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}