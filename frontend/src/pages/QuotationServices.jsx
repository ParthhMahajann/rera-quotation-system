// src/pages/QuotationServices.jsx
import React, { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  Chip,
  Alert,
  CircularProgress,
} from "@mui/material";
import { QuotationProvider } from "../context/QuotationContext";
import QuotationBuilder from "../components/QuotationBuilder";
import { updateQuotation } from "../services/quotations";

export default function QuotationServices() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleQuotationComplete = useCallback(
    async (selectedHeaders) => {
      try {
        setLoading(true);
        setError("");
        
        // Transform the selected headers to the expected format
        const headers = selectedHeaders.map(({ name, services = [] }) => ({
          header: name,
          services: services.map(({ id, name, label, subServices = {} }) => ({
            id: id || name,
            label: label || name,
            subServices: Object.keys(subServices).map((ss) => ({
              id: ss,
              text: ss,
            })),
          })),
        }));

        console.log("Saving headers:", headers); // Debug log
        
        // ✅ Use the fixed updateQuotation function with authentication
        await updateQuotation(id, { headers });
        
        // Navigate to pricing step
        navigate(`/quotations/${id}/pricing`);
      } catch (err) {
        console.error("Failed to save services:", err);
        setError(err.message || "Failed to save services");
      } finally {
        setLoading(false);
      }
    },
    [id, navigate]
  );

  return (
    <QuotationProvider>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Services Selection
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Select the services you need for this quotation
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate("/quotations/new")}
            sx={{ fontWeight: 600, px: 3 }}
          >
            ← Back to Project Details
          </Button>
        </Box>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Saving services...</Typography>
          </Box>
        )}

        {/* Quotation Builder */}
        <Card>
          <CardContent>
            <QuotationBuilder 
              onComplete={handleQuotationComplete}
              loading={loading}
            />
          </CardContent>
        </Card>
      </Container>
    </QuotationProvider>
  );
}
