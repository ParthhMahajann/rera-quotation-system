// src/pages/QuotationTerms.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  FormControlLabel,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  TextField,
  IconButton,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const QuotationTerms = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [quotationData, setQuotationData] = useState(null);
  const [applicableTerms, setApplicableTerms] = useState({});
  const [customTerms, setCustomTerms] = useState(['']);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [showApprovalWarning, setShowApprovalWarning] = useState(false);
  
  const token = localStorage.getItem("token");

  // Fetch current user info
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (token) {
        try {
          const res = await fetch("/api/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const userData = await res.json();
            setCurrentUser(userData);
          }
        } catch (err) {
          console.error("Failed to fetch user profile");
        }
      }
    };
    fetchUserProfile();
  }, [token]);

  // Terms data structure
  const termsData = {
    "General T&C": [
      "The above quotation is subject to this project only.",
      "The prices mentioned above are in particular to One Project per year.",
      "The services outlined above are included within the project scope. Any additional services not specified are excluded from this scope.",
      "The prices mentioned above are applicable to One Project only for the duration of the services obtained.",
      "The prices mentioned above DO NOT include Government Fees.",
      "The prices mentioned above DO NOT include Edit Fees.",
      "*18% GST Applicable on above mentioned charges.",
      "The prices listed above do not include any applicable statutory taxes.",
      "Any and all services not mentioned in the above scope of services are not applicable",
      "All Out-of-pocket expenses incurred for completion of the work shall be re-imbursed to RERA Easy"
    ],
    "Package A,B,C": [
      "Payment is due at the initiation of services, followed by annual payments thereafter.",
      "Any kind of drafting of legal documents or contracts are not applicable.",
      "The quoted fee covers annual MahaRERA compliance services, with billing on a Yearly basis for convenience and predictable financial planning.",
      "Invoices will be generated at a predetermined interval for each year in advance.",
      "The initial invoice will be issued from the date of issuance or a start date as specified in the Work Order."
    ],
    "Package D": [
      "All Out-of-pocket expenses incurred for the explicit purpose of Commuting, Refreshment meals of RERA Easy's personnel shall be re-imbursed to RERA Easy, subject to submission of relevant invoices, bills and records submitted."
    ],
  };

  // Service to terms mapping
  const serviceTermsMapping = {
    "Package A": "Package A,B,C",
    "Package B": "Package A,B,C",
    "Package C": "Package A,B,C",
    "Package D": "Package D",
    "Project Registration": "General T&C",
    "Drafting of Legal Documents": "General T&C",
    "Vetting of Legal Documents": "General T&C",
    "Drafting of Title Report in Format A": "General T&C",
    "Liasioning": "General T&C",
    "SRO Membership": "General T&C",
    "Project Extension - Section 7.3": "General T&C",
    "Project Correction - Change of FSI/ Plan": "General T&C",
    "Project Closure": "General T&C",
    "Removal of Abeyance - QPR, Lapsed": "General T&C",
    "Deregistration": "General T&C",
    "Change of Promoter (section 15)": "General T&C",
    "Profile Migration": "General T&C",
    "Profile Updation": "General T&C",
    "Form 1": "General T&C",
    "Form 2": "General T&C",
    "Form 3": "General T&C",
    "Form 5": "General T&C",
    "Title Certificate": "General T&C"
  };

  useEffect(() => {
    const fetchQuotationData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/quotations/${id}`);
        if (!response.ok) throw new Error('Failed to fetch quotation');

        const quotation = await response.json();
        setQuotationData(quotation.data);

        // Determine applicable terms based on selected services
        const applicableTermsSets = new Set(['General T&C']);
        quotation.data.headers?.forEach(header => {
          header.services?.forEach(service => {
            const termCategory = serviceTermsMapping[service.label] || 'General T&C';
            applicableTermsSets.add(termCategory);
          });
        });

        // Build applicable terms object
        const terms = {};
        Array.from(applicableTermsSets).forEach(category => {
          if (termsData[category] && termsData[category].length > 0) {
            terms[category] = termsData[category];
          } else if (category === 'Legal' || category === 'Compliance') {
            terms[category] = termsData['General T&C'];
          }
        });

        setApplicableTerms(terms);

        // Load existing terms acceptance status and custom terms
        if (quotation.data.termsAccepted) {
          setTermsAccepted(true);
        }

        if (quotation.data.customTerms && quotation.data.customTerms.length > 0) {
          setCustomTerms(quotation.data.customTerms);
        }

      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchQuotationData();
    }
  }, [id]);

  // ✅ Check if custom terms require approval
  useEffect(() => {
    const hasNonEmptyCustomTerms = customTerms.some(term => term.trim() !== '');
    setShowApprovalWarning(hasNonEmptyCustomTerms);
  }, [customTerms]);

  const handleAcceptTerms = (accepted) => {
    setTermsAccepted(accepted);
  };

  const handleAddCustomTerm = () => {
    setCustomTerms([...customTerms, '']);
  };

  const handleRemoveCustomTerm = (index) => {
    if (customTerms.length > 1) {
      const newTerms = customTerms.filter((_, i) => i !== index);
      setCustomTerms(newTerms);
    }
  };

  const handleCustomTermChange = (index, value) => {
    const newTerms = [...customTerms];
    newTerms[index] = value;
    setCustomTerms(newTerms);
  };

  const handleSaveAndContinue = async () => {
    if (!termsAccepted) {
      alert('Please accept the terms and conditions to proceed.');
      return;
    }

    try {
      setLoading(true);
      
      // Filter out empty custom terms
      const validCustomTerms = customTerms.filter(term => term.trim() !== '');

      // Save terms acceptance status
      await fetch(`/api/quotations/${id}/terms`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          termsAccepted: true,
          applicableTerms: Object.keys(applicableTerms),
          customTerms: validCustomTerms
        }),
      });

      // Navigate to summary or dashboard based on approval status
      if (validCustomTerms.length > 0) {
        // Has custom terms - will require approval
        alert('Quotation submitted for approval due to custom terms. You will be notified once approved.');
        navigate('/dashboard');
      } else {
        // No custom terms - proceed normally
        navigate(`/quotations/${id}/summary`);
      }

    } catch (err) {
      console.error('Error saving terms:', err);
      setError('Failed to save terms acceptance');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryTitle = (category) => {
    switch(category) {
      case 'General T&C': return 'General Terms & Conditions';
      case 'Package A,B,C': return 'Package A, B, C Terms';
      case 'Package D': return 'Package D Terms';
      default: return category;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" mt={4}>
        <CircularProgress />
        <Typography ml={2}>Loading...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">Error: {error}</Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom color="primary">
          Terms & Conditions
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Please review and accept the terms and conditions applicable to your selected services
        </Typography>
      </Box>

      {/* Quotation Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quotation Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                Quotation ID:
              </Typography>
              <Typography variant="body1" fontFamily="monospace">
                {quotationData?.id}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                Developer:
              </Typography>
              <Typography variant="body1">
                {quotationData?.developerName}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                Project:
              </Typography>
              <Typography variant="body1">
                {quotationData?.projectName || 'N/A'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Selected Services */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Selected Services
          </Typography>
          {quotationData?.headers?.map((header, index) => (
            <Box key={index} mb={2}>
              <Typography variant="subtitle1" color="primary" fontWeight={600}>
                {header.header}
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                {header.services?.map((service, sIndex) => (
                  <Chip
                    key={sIndex}
                    label={service.label}
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* Applicable Terms */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Applicable Terms & Conditions
          </Typography>
          
          {Object.keys(applicableTerms).length === 0 ? (
            <Alert severity="info">
              No specific terms found for selected services. Only general terms will apply.
            </Alert>
          ) : null}

          {Object.entries(applicableTerms).map(([category, terms]) => (
            <Box key={category} mb={3}>
              <Typography variant="subtitle1" color="primary" fontWeight={600} gutterBottom>
                {getCategoryTitle(category)}
              </Typography>
              <List dense>
                {terms.map((term, index) => (
                  <ListItem key={index} sx={{ pl: 0 }}>
                    <ListItemText
                      primary={`${index + 1}. ${term}`}
                      sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem' } }}
                    />
                  </ListItem>
                ))}
              </List>
              {Object.keys(applicableTerms).length > 1 && <Divider sx={{ my: 2 }} />}
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* Custom Terms */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Custom Terms & Conditions
            </Typography>
            <Button
              onClick={handleAddCustomTerm}
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
            >
              Add Term
            </Button>
          </Box>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Add any additional terms and conditions specific to your project or requirements.
          </Typography>

          {/* ✅ Approval Warning for Custom Terms */}
          {showApprovalWarning && (
            <Alert 
              severity="warning" 
              icon={<WarningIcon />}
              sx={{ mb: 2 }}
            >
              <Typography variant="body2">
                <strong>Approval Required:</strong> Adding custom terms will send this quotation for manager/admin approval, regardless of discount amount.
              </Typography>
            </Alert>
          )}

          {customTerms.map((term, index) => (
            <Paper key={index} sx={{ p: 2, mb: 2, backgroundColor: '#f9f9f9' }}>
              <Box display="flex" alignItems="flex-start" gap={2}>
                <Typography variant="body2" sx={{ mt: 1, minWidth: '30px' }}>
                  {index + 1}.
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  value={term}
                  onChange={(e) => handleCustomTermChange(index, e.target.value)}
                  placeholder={`Enter custom term ${index + 1}...`}
                  variant="outlined"
                  size="small"
                />
                {customTerms.length > 1 && (
                  <IconButton
                    onClick={() => handleRemoveCustomTerm(index)}
                    color="error"
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            </Paper>
          ))}
        </CardContent>
      </Card>

      {/* Terms Acceptance */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <FormControlLabel
            control={
              <Checkbox
                checked={termsAccepted}
                onChange={(e) => handleAcceptTerms(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Typography variant="body1">
                I have read, understood, and agree to all the above terms and conditions
                {showApprovalWarning && (
                  <Typography variant="body2" color="warning.main" component="div" sx={{ mt: 1 }}>
                    * This quotation will require approval due to custom terms
                  </Typography>
                )}
              </Typography>
            }
          />
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <Box display="flex" justifyContent="space-between" mt={4}>
        <Button
          onClick={() => navigate(`/quotations/${id}/pricing`)}
          variant="outlined"
          size="large"
          color="inherit"
          startIcon={<ArrowBackIcon />}
        >
          Previous
        </Button>
        
        <Button
          onClick={handleSaveAndContinue}
          variant="contained"
          size="large"
          disabled={!termsAccepted || loading}
          endIcon={<ArrowForwardIcon />}
        >
          {loading ? 'Saving...' : 'Accept & Continue'}
        </Button>
      </Box>
    </Container>
  );
};

export default QuotationTerms;
