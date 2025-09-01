import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Box,
  Button,
  Divider,
  Alert,
  Grid,
  Paper,
  Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const TotalRow = styled(TableRow)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  '& td': {
    color: theme.palette.primary.contrastText,
    fontWeight: 'bold',
    fontSize: '1.1rem',
  },
}));

const SummaryPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: theme.palette.grey[50],
}));

export default function QuotationSummary() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { agentData, selectedServices, totalCost } = location.state || {
    agentData: {},
    selectedServices: [],
    totalCost: 0
  };

  // If no data, redirect back
  if (!agentData.agentName || selectedServices.length === 0) {
    navigate('/');
    return null;
  }

  const handleConfirm = async () => {
    try {
      // Here you would typically save the complete quotation
      // await saveQuotation({
      //   agentData,
      //   selectedServices,
      //   totalCost,
      //   quotationDate: new Date().toISOString(),
      //   status: 'pending'
      // });

      alert('Quotation created successfully! We will contact you shortly.');
      navigate('/');
    } catch (error) {
      console.error('Failed to save quotation:', error);
      alert('Failed to save quotation. Please try again.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Quotation Summary
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {/* Agent Details */}
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Agent Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Agent Name
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {agentData.agentName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Agent Type
                  </Typography>
                  <Chip label={agentData.agentType} color="primary" variant="outlined" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Mobile Number
                  </Typography>
                  <Typography variant="body1">
                    {agentData.mobile}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Email Address
                  </Typography>
                  <Typography variant="body1">
                    {agentData.email || 'Not provided'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </StyledCard>

          {/* Selected Services */}
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Selected Services
              </Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Service</strong></TableCell>
                    <TableCell align="right"><strong>Price (₹)</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedServices.map((service, index) => (
                    <TableRow key={index}>
                      <TableCell>{service.name}</TableCell>
                      <TableCell align="right">
                        {service.price.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TotalRow>
                    <TableCell><strong>Total Amount</strong></TableCell>
                    <TableCell align="right">
                      <strong>₹{totalCost.toLocaleString()}</strong>
                    </TableCell>
                  </TotalRow>
                </TableBody>
              </Table>
            </CardContent>
          </StyledCard>
        </Grid>

        <Grid item xs={12} md={4}>
          {/* Summary Card */}
          <SummaryPaper elevation={2}>
            <Typography variant="h6" gutterBottom color="primary">
              Quotation Summary
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Date
              </Typography>
              <Typography variant="body1">
                {getCurrentDate()}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Services Count
              </Typography>
              <Typography variant="body1">
                {selectedServices.length} service(s)
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Total Amount
              </Typography>
              <Typography variant="h5" color="primary" fontWeight="bold">
                ₹{totalCost.toLocaleString()}
              </Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Alert severity="info" sx={{ mb: 3 }}>
              This quotation is valid for 30 days from the date of issue.
            </Alert>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleConfirm}
              >
                Confirm Quotation
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={handlePrint}
              >
                Print/Save as PDF
              </Button>
              
              <Button
                variant="text"
                size="large"
                fullWidth
                onClick={() => navigate(-1)}
              >
                Back to Services
              </Button>
            </Box>
          </SummaryPaper>
        </Grid>
      </Grid>

      {/* Terms and Conditions */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            Terms & Conditions
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              All prices are inclusive of applicable taxes unless specified otherwise.
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Government fees are subject to change as per official notifications.
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Service delivery timelines may vary based on government processing times.
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Additional charges may apply for expedited processing or additional documentation.
            </Typography>
            <Typography component="li" variant="body2">
              This quotation is valid for 30 days from the date of issue.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}