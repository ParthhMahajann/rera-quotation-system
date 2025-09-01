import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  TextField,
  CircularProgress,
} from "@mui/material";

const QuotationPricing = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [quotationData, setQuotationData] = useState(null);
  const [pricingBreakdown, setPricingBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [discountType, setDiscountType] = useState("none");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);

  useEffect(() => {
    const fetchQuotationAndPricing = async () => {
      try {
        setLoading(true);
        const quotationResponse = await fetch(`/api/quotations/${id}`);
        if (!quotationResponse.ok) throw new Error("Failed to fetch quotation");
        const quotation = await quotationResponse.json();
        setQuotationData(quotation.data);

        const pricingResponse = await fetch(
          "/api/quotations/calculate-pricing",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              developerType: quotation.data.developerType,
              projectRegion: quotation.data.projectRegion,
              plotArea: quotation.data.plotArea,
              headers: quotation.data.headers || [],
            }),
          }
        );

        if (!pricingResponse.ok) throw new Error("Failed to calculate pricing");
        const pricingData = await pricingResponse.json();

        const initialPricingBreakdown = pricingData.breakdown.map((header) => ({
          ...header,
          services: header.services.map((service) => ({
            ...service,
            discountType: "none",
            discountAmount: 0,
            discountPercent: 0,
            finalAmount: service.totalAmount,
          })),
        }));

        setPricingBreakdown(initialPricingBreakdown);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchQuotationAndPricing();
  }, [id]);

  const baseTotals = useMemo(() => {
    const subtotal = pricingBreakdown.reduce(
      (acc, header) =>
        acc +
        header.services.reduce(
          (sum, service) => sum + (service.totalAmount || 0),
          0
        ),
      0
    );
    return { subtotal };
  }, [pricingBreakdown]);

  const finalTotals = useMemo(() => {
    let subtotal = baseTotals.subtotal;
    let discount = discountAmount;
    const subtotalAfterDiscount = subtotal - discount;
    const tax = Math.round(subtotalAfterDiscount * 0.18);
    const total = subtotalAfterDiscount + tax;

    return {
      subtotal,
      discount,
      subtotalAfterDiscount,
      total,
      isGlobalDiscount: discountType !== "none",
    };
  }, [discountType, discountAmount, baseTotals.subtotal]);

  const handleSavePricing = async () => {
    try {
      setLoading(true);
      const payload = {
        totalAmount: finalTotals.total,
        discountAmount: finalTotals.discount,
        discountType: discountType === "none" ? "individual" : "global",
        pricingBreakdown,
      };
      await fetch(`/api/quotations/${id}/pricing`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      navigate(`/quotations/${id}/terms`);
    } catch (err) {
      setError("Failed to save pricing");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <Box sx={{ textAlign: "center", p: 5 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading...</Typography>
      </Box>
    );
  if (error)
    return (
      <Box sx={{ textAlign: "center", p: 5, color: "error.main" }}>
        <Typography>Error: {error}</Typography>
      </Box>
    );

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Project: {quotationData?.projectName || quotationData?.developerName}
      </Typography>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6">Service Pricing</Typography>

        {pricingBreakdown.map((header, hi) => (
          <Box
            key={hi}
            sx={{
              mb: 3,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              p: 2,
            }}
          >
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              {header.header}
            </Typography>
            {header.services.map((service, si) => (
              <Box
                key={si}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  py: 1.5,
                  borderBottom:
                    si === header.services.length - 1
                      ? "none"
                      : "1px solid #eee",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "40%",
                  }}
                >
                  <Typography>{service.name}</Typography>
                  <Typography>₹{service.totalAmount}</Typography>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Select
                    value={service.discountType}
                    onChange={(e) =>
                      console.log("handleServiceDiscountTypeChange", e.target.value)
                    }
                    size="small"
                    sx={{ minWidth: 180 }}
                    disabled={discountType !== "none"}
                  >
                    <MenuItem value="none">No Discount</MenuItem>
                    <MenuItem value="percent">Percentage</MenuItem>
                    <MenuItem value="amount">Amount</MenuItem>
                  </Select>
                  {service.discountType !== "none" && (
                    <>
                      <TextField
                        type="number"
                        size="small"
                        sx={{ width: 120 }}
                        value={
                          service.discountType === "percent"
                            ? service.discountPercent
                            : service.discountAmount
                        }
                        onChange={(e) =>
                          console.log("handleServiceDiscountChange", e.target.value)
                        }
                        disabled={discountType !== "none"}
                      />
                      <Typography sx={{ fontWeight: "bold", color: "primary.main" }}>
                        Final: ₹{service.finalAmount}
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          my: 4,
          p: 3,
          border: "2px solid",
          borderColor: "primary.main",
          borderRadius: 2,
          bgcolor: "#f8f9ff",
        }}
      >
        <Typography variant="h6" gutterBottom>
          Global Discount (Optional)
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, fontStyle: "italic" }}>
          Applying a global discount will override individual service discounts.
        </Typography>
        <FormControl>
          <RadioGroup
            row
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value)}
          >
            <FormControlLabel value="none" control={<Radio />} label="No Discount" />
            <FormControlLabel value="percent" control={<Radio />} label="Percentage" />
            <FormControlLabel value="amount" control={<Radio />} label="Amount" />
          </RadioGroup>
        </FormControl>
        {discountType === "percent" && (
          <TextField
            type="number"
            size="small"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
            sx={{ mt: 2, width: 120 }}
            InputProps={{ endAdornment: <Typography>%</Typography> }}
          />
        )}
        {discountType === "amount" && (
          <TextField
            type="number"
            size="small"
            value={discountAmount}
            onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
            sx={{ mt: 2, width: 120 }}
            InputProps={{ endAdornment: <Typography>₹</Typography> }}
          />
        )}
      </Box>

      <Box
        sx={{
          p: 3,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          bgcolor: "#f9f9f9",
          mb: 3,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Pricing Summary
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "space-between", py: 1 }}>
          <span>Subtotal:</span>
          <span>₹{finalTotals.subtotal}</span>
        </Box>
        {finalTotals.discount > 0 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              py: 1,
              color: "error.main",
            }}
          >
            <span>
              Discount ({finalTotals.isGlobalDiscount ? "Global" : "Services"}):
            </span>
            <span>-₹{finalTotals.discount}</span>
          </Box>
        )}
        <Box sx={{ display: "flex", justifyContent: "space-between", py: 1 }}>
          <span>After Discount:</span>
          <span>₹{finalTotals.subtotalAfterDiscount}</span>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            py: 2,
            borderTop: "2px solid",
            borderColor: "text.primary",
            fontWeight: "bold",
          }}
        >
          <span>Total:</span>
          <span>₹{finalTotals.total}</span>
        </Box>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => navigate(`/quotations/${id}/services`)}
        >
          Back
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSavePricing}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save & Continue"}
        </Button>
      </Box>
    </Box>
  );
};

export default QuotationPricing;
