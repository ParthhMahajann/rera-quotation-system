import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  MenuItem,
  Box,
  Alert,
  Grid,
  Paper
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  maxWidth: 600,
  margin: '0 auto',
}));

const agentTypes = ['Individual', 'Proprietary', 'Private Ltd', 'LLP', 'Partnership', 'Others'];

export default function CreateAgentQuotation() {
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    agentName: '',
    mobile: '',
    email: '',
    agentType: ''
  });

  const [errors, setErrors] = useState({});

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }

  const mobileValid = useMemo(() => /^\d{10}$/.test(form.mobile || ''), [form.mobile]);
  const emailValid = useMemo(() => !form.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email), [form.email]);
  
  const canSubmit = form.agentName.trim().length > 0 && 
                   mobileValid && 
                   emailValid && 
                   !!form.agentType;

  function validateForm() {
    const newErrors = {};
    
    if (!form.agentName.trim()) {
      newErrors.agentName = 'Agent name is required';
    }
    
    if (!form.mobile) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!mobileValid) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number';
    }
    
    if (form.email && !emailValid) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!form.agentType) {
      newErrors.agentType = 'Agent type is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Save agent data to your backend (keeping your existing API call)
       await createQuotation({
         developerType: 'agent',
         developerName: form.agentName,
         serviceSummary: `Agent Registration - ${form.agentType}`,
          createdBy: form.agentName,
          contactMobile: form.mobile,
         contactEmail: form.email
      });

      // Navigate to service selection page with agent data
      navigate('/service-selection', {
        state: {
          agentData: {
            agentName: form.agentName,
            mobile: form.mobile,
            email: form.email,
            agentType: form.agentType
          }
        }
      });
    } catch (error) {
      console.error('Failed to save agent quotation:', error);
      alert('Failed to save agent quotation. Please try again.');
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Agent Registration Quotation
      </Typography>
      
      <StyledCard elevation={3}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 3 }}>
            Step 1: Provide Agent Details
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Agent Name"
                  variant="outlined"
                  fullWidth
                  required
                  value={form.agentName}
                  onChange={(e) => handleChange('agentName', e.target.value)}
                  error={!!errors.agentName}
                  helperText={errors.agentName}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Mobile Number"
                  variant="outlined"
                  fullWidth
                  required
                  value={form.mobile}
                  onChange={(e) => handleChange('mobile', e.target.value)}
                  error={!!errors.mobile}
                  helperText={errors.mobile || 'Enter 10-digit mobile number'}
                  inputProps={{ maxLength: 10, pattern: '[0-9]*' }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email Address"
                  variant="outlined"
                  fullWidth
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  error={!!errors.email}
                  helperText={errors.email || 'Optional'}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  select
                  label="Agent Type"
                  variant="outlined"
                  fullWidth
                  required
                  value={form.agentType}
                  onChange={(e) => handleChange('agentType', e.target.value)}
                  error={!!errors.agentType}
                  helperText={errors.agentType || 'Select your business entity type'}
                >
                  {agentTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
            
            {!canSubmit && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Please fill all required fields correctly to continue.
              </Alert>
            )}
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={!canSubmit}
                sx={{ minWidth: 200 }}
              >
                Continue to Service Selection
              </Button>
            </Box>
          </Box>
        </CardContent>
      </StyledCard>
      
      <Paper sx={{ p: 2, mt: 3, backgroundColor: 'grey.50' }}>
        <Typography variant="body2" color="text.secondary" align="center">
          Next: Select the services you need for your agent registration
        </Typography>
      </Paper>
    </Container>
  );
}