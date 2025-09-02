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
  CircularProgress
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
    agentType: '',
    projectRegion: 'Maharashtra'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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

    const token = localStorage.getItem('token');
    if (!token) {
      setErrors({ general: 'Please login to create agent registration' });
      return;
    }

    setLoading(true);
    try {
      // ✅ CORRECT API CALL - Using the agent registration endpoint
      const response = await fetch('http://localhost:3001/api/agent-registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          agentName: form.agentName,
          mobile: form.mobile,
          email: form.email || null,
          agentType: form.agentType,
          projectRegion: form.projectRegion
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        setErrors({ general: result.error || 'Failed to create agent registration' });
        return;
      }

      // ✅ Navigate to agent summary with sample services data
      navigate('/agent-summary', {
        state: {
          agentData: form,
          quotationId: result.quotationId,
          selectedServices: [
            { name: 'RERA Agent Registration', price: 50000 },
            { name: 'Document Processing', price: 15000 },
            { name: 'Legal Compliance', price: 10000 }
          ],
          totalCost: 75000
        }
      });
    } catch (error) {
      console.error('Failed to create agent registration:', error);
      setErrors({ general: 'Network error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <StyledCard>
        <CardContent>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Agent Registration Quotation
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" align="center" gutterBottom>
            Step 1: Provide Agent Details
          </Typography>

          {errors.general && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.general}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Agent Name"
                  value={form.agentName}
                  onChange={(e) => handleChange('agentName', e.target.value)}
                  error={!!errors.agentName}
                  helperText={errors.agentName}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Mobile Number"
                  value={form.mobile}
                  onChange={(e) => {
                    // Only allow digits and max 10 characters
                    if (/^\d{0,10}$/.test(e.target.value)) {
                      handleChange('mobile', e.target.value);
                    }
                  }}
                  error={!!errors.mobile}
                  helperText={errors.mobile || 'Enter 10-digit mobile number'}
                  inputProps={{ maxLength: 10, pattern: '[0-9]*' }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  error={!!errors.email}
                  helperText={errors.email || 'Optional'}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Agent Type"
                  value={form.agentType}
                  onChange={(e) => handleChange('agentType', e.target.value)}
                  error={!!errors.agentType}
                  helperText={errors.agentType || 'Select your business entity type'}
                  required
                >
                  {agentTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Project Region"
                  value={form.projectRegion}
                  onChange={(e) => handleChange('projectRegion', e.target.value)}
                  helperText="Select the region for RERA registration"
                >
                  <MenuItem value="Maharashtra">Maharashtra</MenuItem>
                  <MenuItem value="Gujarat">Gujarat</MenuItem>
                  <MenuItem value="Karnataka">Karnataka</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            {!canSubmit && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Please fill all required fields correctly to continue.
              </Alert>
            )}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={!canSubmit || loading}
                sx={{ minWidth: 200 }}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Creating...
                  </>
                ) : (
                  'Continue to Service Selection'
                )}
              </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
              Next: Select the services you need for your agent registration
            </Typography>
          </Box>
        </CardContent>
      </StyledCard>
    </Container>
  );
}
