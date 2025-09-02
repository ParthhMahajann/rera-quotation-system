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

// Pricing data for agent services
const AGENT_PRICING_DATA = {
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

export default function AgentServiceSelection() {
  const navigate = useNavigate();
  const location = useLocation();

  const { agentData, quotationId } = location.state || {};

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

  useEffect(() => {
    if (!agentData || !quotationId) {
      navigate('/quotations/new/agent');
    }
  }, [agentData, quotationId, navigate]);

  const currentPricing = AGENT_PRICING_DATA[agentData?.agentType] || AGENT_PRICING_DATA.Individual;

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

    // Navigate to agent summary page
    navigate('/agent-quotation-summary', {
      state: {
        agentData,
        selectedServices: selectedServicesList,
        totalCost,
        quotationId
      }
    });
  };

  const canSubmit = Object.values(selectedServices).some(value =>
    typeof value === 'boolean' ? value : value !== ''
  );

  if (!agentData) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Agent Service Selection
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Agent: {agentData.agentName} | Type: {agentData.agentType}
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {/* Basic Services */}
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      Training
                      <PriceChip label={`₹${currentPricing.Training.toLocaleString()}`} color="primary" size="small" />
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      Exam
                      <PriceChip label={`₹${currentPricing.Exam.toLocaleString()}`} color="primary" size="small" />
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      Government Fees
                      <PriceChip label={`₹${currentPricing.Govt_fees.toLocaleString()}`} color="primary" size="small" />
                    </Box>
                  }
                />
              </FormGroup>
            </CardContent>
          </StyledCard>

          {/* Registration & Professional Fees */}
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      Only Training & Exam
                      <PriceChip label={`₹${currentPricing.Registration_Professional.only_training_exam.toLocaleString()}`} color="secondary" size="small" />
                    </Box>
                  }
                />
                <FormControlLabel
                  value="only_rera"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      Only RERA
                      <PriceChip label={`₹${currentPricing.Registration_Professional.only_rera.toLocaleString()}`} color="secondary" size="small" />
                    </Box>
                  }
                />
                <FormControlLabel
                  value="with_training_exam"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      With Training & Exam
                      <PriceChip label={`₹${currentPricing.Registration_Professional.with_training_exam.toLocaleString()}`} color="secondary" size="small" />
                    </Box>
                  }
                />
              </RadioGroup>
            </CardContent>
          </StyledCard>

          {/* Renewal Services */}
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      Only RERA
                      <PriceChip label={`₹${currentPricing.Renewal.only_rera.toLocaleString()}`} color="secondary" size="small" />
                    </Box>
                  }
                />
                <FormControlLabel
                  value="with_training_exam"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      With Training & Exam
                      <PriceChip label={`₹${currentPricing.Renewal.with_training_exam.toLocaleString()}`} color="secondary" size="small" />
                    </Box>
                  }
                />
              </RadioGroup>
            </CardContent>
          </StyledCard>

          {/* HPR Services */}
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      NIL
                      <PriceChip label={`₹${currentPricing.HPR.nil.toLocaleString()}`} color="secondary" size="small" />
                    </Box>
                  }
                />
                <FormControlLabel
                  value="upto_50"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      Up to 50
                      <PriceChip label={`₹${currentPricing.HPR.upto_50.toLocaleString()}`} color="secondary" size="small" />
                    </Box>
                  }
                />
              </RadioGroup>
            </CardContent>
          </StyledCard>

          {/* Additional Services */}
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      Scrutiny Assistance
                      <PriceChip label={`₹${currentPricing.Scrutiny_Assistance.toLocaleString()}`} color="primary" size="small" />
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      Deregistration
                      <PriceChip label={`₹${currentPricing.Deregistration.toLocaleString()}`} color="primary" size="small" />
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      Correction
                      <PriceChip label={`₹${currentPricing.Correction.toLocaleString()}`} color="primary" size="small" />
                    </Box>
                  }
                />
              </FormGroup>
            </CardContent>
          </StyledCard>
        </Grid>

        {/* Total Cost Summary */}
        <Grid item xs={12} md={4}>
          <TotalCard>
            <Typography variant="h5" gutterBottom>
              Total Cost
            </Typography>
            <Typography variant="h3" gutterBottom>
              ₹{totalCost.toLocaleString()}
            </Typography>
            <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.3)' }} />
            <Typography variant="body2" sx={{ mb: 1 }}>
              Agent Type: {agentData.agentType}
            </Typography>
            <Typography variant="body2" sx={{ mb: 3 }}>
              Services Selected: {Object.values(selectedServices).filter(v =>
                typeof v === 'boolean' ? v : v !== ''
              ).length}
            </Typography>
            
            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={!canSubmit}
              onClick={handleSubmit}
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'grey.100',
                },
                mb: 2
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
                },
              }}
            >
              Back
            </Button>
          </TotalCard>
        </Grid>
      </Grid>
    </Container>
  );
}
