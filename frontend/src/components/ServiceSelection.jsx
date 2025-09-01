import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Button,
  Grid,
  Divider,
  Alert,
  Paper,
  Radio,
  RadioGroup,
  Chip,
  Container
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}));

const PriceChip = styled(Chip)(({ theme }) => ({
  fontWeight: 'bold',
  fontSize: '0.875rem',
}));

const TotalCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  position: 'sticky',
  top: theme.spacing(2),
}));

// Pricing data structure based on Excel file
const PRICING_DATA = {
  Individual: {
    Training: 5900,
    Exam: 1500,
    Govt_fees: 11121,
    Registration_Professional: {
      only_training_exam: 2500,
      only_rera: 4000,
      with_training_exam: 7000
    },
    Renewal: {
      only_rera: 4000,
      with_training_exam: 7000
    },
    Scrutiny_Assistance: 3000,
    HPR: {
      nil: 1500,
      upto_50: 2500
    },
    Deregistration: 3000,
    Correction: 2500
  },
  Proprietary: {
    Training: 5900,
    Exam: 1500,
    Govt_fees: 11121,
    Registration_Professional: {
      only_training_exam: 2500,
      only_rera: 5000,
      with_training_exam: 7000
    },
    Renewal: {
      only_rera: 5000,
      with_training_exam: 7000
    },
    Scrutiny_Assistance: 3000,
    HPR: {
      nil: 1500,
      upto_50: 2500
    },
    Deregistration: 3000,
    Correction: 2500
  },
  'Private Ltd': {
    Training: 5900,
    Exam: 1500,
    Govt_fees: 101121,
    Registration_Professional: {
      only_training_exam: 2500,
      only_rera: 10000,
      with_training_exam: 15000
    },
    Renewal: {
      only_rera: 10000,
      with_training_exam: 15000
    },
    Scrutiny_Assistance: 7000,
    HPR: {
      nil: 1500,
      upto_50: 2500
    },
    Deregistration: 5000,
    Correction: 5000
  },
  LLP: {
    Training: 5900,
    Exam: 1500,
    Govt_fees: 101121,
    Registration_Professional: {
      only_training_exam: 2500,
      only_rera: 10000,
      with_training_exam: 15000
    },
    Renewal: {
      only_rera: 10000,
      with_training_exam: 15000
    },
    Scrutiny_Assistance: 7000,
    HPR: {
      nil: 1500,
      upto_50: 2500
    },
    Deregistration: 5000,
    Correction: 5000
  },
  Partnership: {
    Training: 5900,
    Exam: 1500,
    Govt_fees: 101121,
    Registration_Professional: {
      only_training_exam: 2500,
      only_rera: 10000,
      with_training_exam: 15000
    },
    Renewal: {
      only_rera: 10000,
      with_training_exam: 15000
    },
    Scrutiny_Assistance: 7000,
    HPR: {
      nil: 1500,
      upto_50: 2500
    },
    Deregistration: 5000,
    Correction: 5000
  },
  Others: {
    Training: 5900,
    Exam: 1500,
    Govt_fees: 101121,
    Registration_Professional: {
      only_training_exam: 2500,
      only_rera: 10000,
      with_training_exam: 15000
    },
    Renewal: {
      only_rera: 10000,
      with_training_exam: 15000
    },
    Scrutiny_Assistance: 7000,
    HPR: {
      nil: 1500,
      upto_50: 2500
    },
    Deregistration: 5000,
    Correction: 5000
  }
};

export default function ServiceSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get agent data from previous page
  const agentData = location.state?.agentData || {
    agentName: '',
    agentType: 'Individual',
    mobile: '',
    email: ''
  };

  const [selectedServices, setSelectedServices] = useState({
    training: false,
    exam: false,
    govt_fees: false,
    registration_professional: '',
    renewal: '',
    scrutiny_assistance: false,
    hpr: '',
    deregistration: false,
    correction: false
  });

  // Get pricing for current agent type
  const currentPricing = PRICING_DATA[agentData.agentType] || PRICING_DATA.Individual;

  // Calculate total cost
  const totalCost = useMemo(() => {
    let total = 0;
    
    if (selectedServices.training) total += currentPricing.Training;
    if (selectedServices.exam) total += currentPricing.Exam;
    if (selectedServices.govt_fees) total += currentPricing.Govt_fees;
    if (selectedServices.scrutiny_assistance) total += currentPricing.Scrutiny_Assistance;
    if (selectedServices.deregistration) total += currentPricing.Deregistration;
    if (selectedServices.correction) total += currentPricing.Correction;
    
    if (selectedServices.registration_professional) {
      total += currentPricing.Registration_Professional[selectedServices.registration_professional];
    }
    
    if (selectedServices.renewal) {
      total += currentPricing.Renewal[selectedServices.renewal];
    }
    
    if (selectedServices.hpr) {
      total += currentPricing.HPR[selectedServices.hpr];
    }
    
    return total;
  }, [selectedServices, currentPricing]);

  const handleServiceChange = (service) => (event) => {
    setSelectedServices(prev => ({
      ...prev,
      [service]: event.target.checked
    }));
  };

  const handleRadioChange = (service) => (event) => {
    setSelectedServices(prev => ({
      ...prev,
      [service]: event.target.value
    }));
  };

  const handleSubmit = () => {
    const selectedServicesList = [];
    
    if (selectedServices.training) selectedServicesList.push({ name: 'Training', price: currentPricing.Training });
    if (selectedServices.exam) selectedServicesList.push({ name: 'Exam', price: currentPricing.Exam });
    if (selectedServices.govt_fees) selectedServicesList.push({ name: 'Government Fees', price: currentPricing.Govt_fees });
    if (selectedServices.scrutiny_assistance) selectedServicesList.push({ name: 'Scrutiny Assistance', price: currentPricing.Scrutiny_Assistance });
    if (selectedServices.deregistration) selectedServicesList.push({ name: 'Deregistration', price: currentPricing.Deregistration });
    if (selectedServices.correction) selectedServicesList.push({ name: 'Correction', price: currentPricing.Correction });
    
    if (selectedServices.registration_professional) {
      const regPrice = currentPricing.Registration_Professional[selectedServices.registration_professional];
      const regLabel = selectedServices.registration_professional.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      selectedServicesList.push({ name: `Registration & Professional (${regLabel})`, price: regPrice });
    }
    
    if (selectedServices.renewal) {
      const renewalPrice = currentPricing.Renewal[selectedServices.renewal];
      const renewalLabel = selectedServices.renewal.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      selectedServicesList.push({ name: `Renewal (${renewalLabel})`, price: renewalPrice });
    }
    
    if (selectedServices.hpr) {
      const hprPrice = currentPricing.HPR[selectedServices.hpr];
      const hprLabel = selectedServices.hpr === 'nil' ? 'NIL' : 'Up to 50';
      selectedServicesList.push({ name: `HPR (${hprLabel})`, price: hprPrice });
    }

    // Navigate to next page with complete data
    navigate('/quotation-summary', {
      state: {
        agentData,
        selectedServices: selectedServicesList,
        totalCost
      }
    });
  };

  const canSubmit = Object.values(selectedServices).some(value => 
    typeof value === 'boolean' ? value : value !== ''
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Service Selection
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Agent: <strong>{agentData.agentName}</strong> | Type: <strong>{agentData.agentType}</strong>
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {/* Basic Services */}
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Basic Services
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedServices.training}
                      onChange={handleServiceChange('training')}
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <span>Training</span>
                      <PriceChip label={`₹${currentPricing.Training.toLocaleString()}`} color="primary" />
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedServices.exam}
                      onChange={handleServiceChange('exam')}
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <span>Exam</span>
                      <PriceChip label={`₹${currentPricing.Exam.toLocaleString()}`} color="primary" />
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedServices.govt_fees}
                      onChange={handleServiceChange('govt_fees')}
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <span>Government Fees</span>
                      <PriceChip label={`₹${currentPricing.Govt_fees.toLocaleString()}`} color="primary" />
                    </Box>
                  }
                />
              </FormGroup>
            </CardContent>
          </StyledCard>

          {/* Registration & Professional Fees */}
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Registration & Professional Fees
              </Typography>
              <RadioGroup
                value={selectedServices.registration_professional}
                onChange={handleRadioChange('registration_professional')}
              >
                <FormControlLabel
                  value="only_training_exam"
                  control={<Radio />}
                  label={
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <span>Only Training & Exam</span>
                      <PriceChip label={`₹${currentPricing.Registration_Professional.only_training_exam.toLocaleString()}`} />
                    </Box>
                  }
                />
                <FormControlLabel
                  value="only_rera"
                  control={<Radio />}
                  label={
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <span>Only RERA</span>
                      <PriceChip label={`₹${currentPricing.Registration_Professional.only_rera.toLocaleString()}`} />
                    </Box>
                  }
                />
                <FormControlLabel
                  value="with_training_exam"
                  control={<Radio />}
                  label={
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <span>With Training & Exam</span>
                      <PriceChip label={`₹${currentPricing.Registration_Professional.with_training_exam.toLocaleString()}`} />
                    </Box>
                  }
                />
              </RadioGroup>
            </CardContent>
          </StyledCard>

          {/* Renewal Services */}
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Renewal Services
              </Typography>
              <RadioGroup
                value={selectedServices.renewal}
                onChange={handleRadioChange('renewal')}
              >
                <FormControlLabel
                  value="only_rera"
                  control={<Radio />}
                  label={
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <span>Only RERA</span>
                      <PriceChip label={`₹${currentPricing.Renewal.only_rera.toLocaleString()}`} />
                    </Box>
                  }
                />
                <FormControlLabel
                  value="with_training_exam"
                  control={<Radio />}
                  label={
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <span>With Training & Exam</span>
                      <PriceChip label={`₹${currentPricing.Renewal.with_training_exam.toLocaleString()}`} />
                    </Box>
                  }
                />
              </RadioGroup>
            </CardContent>
          </StyledCard>

          {/* HPR Services */}
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                HPR Services
              </Typography>
              <RadioGroup
                value={selectedServices.hpr}
                onChange={handleRadioChange('hpr')}
              >
                <FormControlLabel
                  value="nil"
                  control={<Radio />}
                  label={
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <span>NIL</span>
                      <PriceChip label={`₹${currentPricing.HPR.nil.toLocaleString()}`} />
                    </Box>
                  }
                />
                <FormControlLabel
                  value="upto_50"
                  control={<Radio />}
                  label={
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <span>Up to 50</span>
                      <PriceChip label={`₹${currentPricing.HPR.upto_50.toLocaleString()}`} />
                    </Box>
                  }
                />
              </RadioGroup>
            </CardContent>
          </StyledCard>

          {/* Additional Services */}
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Additional Services
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedServices.scrutiny_assistance}
                      onChange={handleServiceChange('scrutiny_assistance')}
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <span>Scrutiny Assistance</span>
                      <PriceChip label={`₹${currentPricing.Scrutiny_Assistance.toLocaleString()}`} />
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedServices.deregistration}
                      onChange={handleServiceChange('deregistration')}
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <span>Deregistration</span>
                      <PriceChip label={`₹${currentPricing.Deregistration.toLocaleString()}`} />
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedServices.correction}
                      onChange={handleServiceChange('correction')}
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <span>Correction</span>
                      <PriceChip label={`₹${currentPricing.Correction.toLocaleString()}`} />
                    </Box>
                  }
                />
              </FormGroup>
            </CardContent>
          </StyledCard>
        </Grid>

        {/* Total Cost Summary */}
        <Grid item xs={12} md={4}>
          <TotalCard elevation={3}>
            <Typography variant="h5" gutterBottom align="center">
              Total Cost
            </Typography>
            <Divider sx={{ my: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
            <Typography variant="h3" align="center" sx={{ fontWeight: 'bold', mb: 3 }}>
              ₹{totalCost.toLocaleString()}
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Agent Type: {agentData.agentType}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Services Selected: {Object.values(selectedServices).filter(v => 
                  typeof v === 'boolean' ? v : v !== ''
                ).length}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleSubmit}
                disabled={!canSubmit}
                sx={{
                  backgroundColor: 'white',
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'grey.100',
                  }
                }}
              >
                Continue to Summary
              </Button>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={() => navigate(-1)}
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  }
                }}
              >
                Back
              </Button>
            </Box>
          </TotalCard>
        </Grid>
      </Grid>
    </Container>
  );
}