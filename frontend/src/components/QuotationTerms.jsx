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
  ArrowForward as ArrowForwardIcon 
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

        // Fetch quotation data
        const response = await fetch(`/api/quotations/${id}`);
        if (!response.ok) throw new Error('Failed to fetch quotation');
        const quotation = await response.json();
        setQuotationData(quotation.data);

        // Determine applicable terms based on selected services
        const applicableTermsSets = new Set(['General T&C']); // Always include general terms

        quotation.data.headers?.forEach(header => {
          header.services?.forEach(service => {
            const termCategory = serviceTermsMapping[service.label] || 'General T&C';
            applicableTermsSets.add(termCategory);

            // Debug: Log which services are being mapped to which terms
            console.log(`Service: ${service.label} -> Term Category: ${termCategory}`);
          });
        });

        // Build applicable terms object
        const terms = {};
        Array.from(applicableTermsSets).forEach(category => {
          if (termsData[category] && termsData[category].length > 0) {
            terms[category] = termsData[category];
          } else if (category === 'Legal' || category === 'Compliance') {
            // Legal and Compliance use General T&C terms
            terms[category] = termsData['General T&C'];
          }
        });

        // Debug: Log the final applicable terms
        console.log('Applicable Terms:', terms);
        console.log('Terms Sets:', Array.from(applicableTermsSets));

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
    if (termsAccepted) {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          termsAccepted: true,
          applicableTerms: Object.keys(applicableTerms),
          customTerms: validCustomTerms
        }),
      });

      // Navigate to summary
      navigate(`/quotations/${id}/summary`);
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Error: {error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box textAlign="center" mb={4}>
        <Chip 
          label="STEP 3 OF 4" 
          color="primary" 
          size="small" 
          sx={{ mb: 2, fontWeight: 600 }}
        />
        <Typography variant="h3" component="h1" fontWeight={700} color="text.primary" gutterBottom>
          Terms & Conditions
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Please review and accept the terms and conditions applicable to your selected services
        </Typography>
      </Box>

      {/* Quotation Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" component="h3" fontWeight={600} gutterBottom>
            Quotation Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Box display="flex" justifyContent="space-between" py={1} borderBottom="1px solid" borderColor="divider">
                <Typography variant="body2" fontWeight={500}>Quotation ID:</Typography>
                <Typography variant="body2" fontWeight={600}>{quotationData?.id}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box display="flex" justifyContent="space-between" py={1} borderBottom="1px solid" borderColor="divider">
                <Typography variant="body2" fontWeight={500}>Developer:</Typography>
                <Typography variant="body2" fontWeight={600}>{quotationData?.developerName}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box display="flex" justifyContent="space-between" py={1} borderBottom="1px solid" borderColor="divider">
                <Typography variant="body2" fontWeight={500}>Project:</Typography>
                <Typography variant="body2" fontWeight={600}>{quotationData?.projectName || 'N/A'}</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Selected Services */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" component="h3" fontWeight={600} gutterBottom>
            Selected Services
          </Typography>
          <Grid container spacing={2}>
            {quotationData?.headers?.map((header, index) => (
              <Grid item xs={12} key={index}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {header.header}
                  </Typography>
                  <List dense>
                    {header.services?.map((service, sIndex) => (
                      <ListItem key={sIndex} sx={{ py: 0.5, pl: 0 }}>
                        <Box 
                          sx={{ 
                            width: 3, 
                            height: '100%', 
                            bgcolor: 'primary.main', 
                            mr: 1.5,
                            minHeight: 20
                          }} 
                        />
                        <ListItemText primary={service.label} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Applicable Terms */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" component="h3" fontWeight={600} gutterBottom>
            Applicable Terms & Conditions
          </Typography>

          {Object.keys(applicableTerms).length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              No specific terms found for selected services. Only general terms will apply.
            </Alert>
          ) : null}

          {Object.entries(applicableTerms).map(([category, terms]) => (
            <Box key={category} sx={{ mb: 3 }}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
                  {getCategoryTitle(category)}
                </Typography>
                <List dense>
                  {terms.map((term, index) => (
                    <ListItem key={index} sx={{ py: 0.5, pl: 0 }}>
                      <Typography 
                        variant="body2" 
                        component="div" 
                        sx={{ 
                          '&::before': {
                            content: `"${index + 1}. "`,
                            fontWeight: 600,
                            color: 'primary.main'
                          }
                        }}
                      >
                        {term}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* Custom Terms */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5" component="h3" fontWeight={600}>
              Custom Terms & Conditions
            </Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddCustomTerm}
              variant="outlined"
              size="small"
            >
              Add Term
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Add any additional terms and conditions specific to your project or requirements.
          </Typography>

          {customTerms.map((term, index) => (
            <Box key={index} sx={{ mb: 2, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Typography variant="body2" sx={{ mt: 2, minWidth: '20px', fontWeight: 600, color: 'primary.main' }}>
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
          ))}
        </CardContent>
      </Card>


      {/* Navigation Buttons */}
      <Box display="flex" justifyContent="space-between" gap={2} mt={4}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/quotations/${id}/pricing`)}
          variant="outlined"
          size="large"
          color="inherit"
        >
          Previous
        </Button>
        <Button
          endIcon={<ArrowForwardIcon />}
          onClick={handleSaveAndContinue}

          variant="contained"
          size="large"
        >
          {loading ? 'Saving...' : 'Accept & Continue'}
        </Button>
      </Box>
    </Container>
  );
};

export default QuotationTerms;