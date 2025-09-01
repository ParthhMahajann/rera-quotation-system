// src/pages/QuotationServices.jsx
import React, { useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  Chip,
} from "@mui/material";
import { QuotationProvider } from "../context/QuotationContext";
import QuotationBuilder from "../components/QuotationBuilder";
import { updateQuotation } from "../services/quotations";

export default function QuotationServices() {
  const navigate = useNavigate();
  const { id } = useParams();

  const handleQuotationComplete = useCallback(
    async (selectedHeaders) => {
      try {
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

        await updateQuotation(id, { headers });
        navigate(`/quotations/${id}/pricing`);
      } catch (err) {
        console.error("Failed to save services:", err);
        alert("Failed to save services: " + (err.message || err));
      }
    },
    [id, navigate]
  );

  return (
    <QuotationProvider>
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          minHeight: "100vh",
          bgcolor: "grey.50",
          py: 3,
          px: 2,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 1200 }}>
          <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
            <CardContent sx={{ p: 4 }}>
              {/* Header */}
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={3}
              >
                <Box>
                  <Chip
                    label="STEP 2 OF 3"
                    color="primary"
                    size="small"
                    sx={{ fontWeight: 600, mb: 1 }}
                  />
                  <Typography variant="h4" fontWeight="600" color="text.primary">
                    Services Selection
                  </Typography>

                </Box>

                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => navigate("/quotations/new")}
                  sx={{ fontWeight: 600, px: 3 }}
                >
                  Back to Step 1
                </Button>
              </Box>

              {/* Quotation Builder */}
              <QuotationBuilder onComplete={handleQuotationComplete} />
            </CardContent>
          </Card>
        </Box>
      </Container>
    </QuotationProvider>
  );
}
