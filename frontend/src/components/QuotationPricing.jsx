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
  const [currentUser, setCurrentUser] = useState(null);
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
    let discount = 0;

    // Calculate discount based on type
    if (discountType === "percent") {
      discount = (subtotal * discountPercent) / 100;
    } else if (discountType === "amount") {
      discount = discountAmount;
    }

    const subtotalAfterDiscount = subtotal - discount;
    const tax = Math.round(subtotalAfterDiscount * 0.18);
    const total = subtotalAfterDiscount + tax;

    return {
      subtotal,
      discount,
      subtotalAfterDiscount,
      tax,
      total,
      isGlobalDiscount: discountType !== "none",
      discountPercent: discountType === "percent" ? discountPercent : (discount / subtotal) * 100
    };
  }, [discountType, discountAmount, discountPercent, baseTotals.subtotal]);

  const handleSavePricing = async () => {
    try {
      setLoading(true);

      const payload = {
        totalAmount: finalTotals.total,
        discountAmount: finalTotals.discount,
        discountPercent: finalTotals.discountPercent,
        pricingBreakdown,
      };

      await fetch(`/api/quotations/${id}/pricing`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
      <Box display="flex" justifyContent="center" alignItems="center" mt={4}>
        <CircularProgress />
        <Typography ml={2}>Loading...</Typography>
      </Box>
    );

  if (error)
    return (
      <Box p={3}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );

  return (
    <Box p={4} maxWidth="1200px" mx="auto">
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom color="primary">
          Project: {quotationData?.projectName || quotationData?.developerName}
        </Typography>
        <Typography variant="h5" color="text.secondary">
          Service Pricing
        </Typography>
      </Box>

      {/* Service Breakdown */}
      {pricingBreakdown.map((header, hi) => (
        <Box
          key={hi}
          mb={3}
          p={3}
          sx={{
            border: "1px solid #e0e0e0",
            borderRadius: 2,
            backgroundColor: "#fafafa"
          }}
        >
          <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 600 }}>
            {header.header}
          </Typography>

          {header.services.map((service, si) => (
            <Box
              key={si}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
              p={2}
              sx={{
                backgroundColor: "white",
                border: "1px solid #e9ecef",
                borderRadius: 1
              }}
            >
              <Typography sx={{ fontWeight: 500, minWidth: "200px" }}>
                {service.name}
              </Typography>
              
              <Typography sx={{ fontWeight: 600, color: "#28a745", minWidth: "100px" }}>
                ₹{service.totalAmount?.toLocaleString()}
              </Typography>

              <Select
                value={service.discountType}
                onChange={(e) => console.log("Service discount change:", e.target.value)}
                size="small"
                sx={{ minWidth: 150 }}
                disabled={discountType !== "none"}
              >
                <MenuItem value="none">No Discount</MenuItem>
                <MenuItem value="percent">Percentage</MenuItem>
                <MenuItem value="amount">Amount</MenuItem>
              </Select>

              {service.discountType !== "none" && (
                <Box display="flex" alignItems="center" gap={1}>
                  <TextField
                    size="small"
                    type="number"
                    sx={{ width: 80 }}
                    onChange={(e) => console.log("Service discount value:", e.target.value)}
                    disabled={discountType !== "none"}
                  />
                  <Typography sx={{ fontWeight: 500 }}>
                    Final: ₹{service.finalAmount?.toLocaleString()}
                  </Typography>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      ))}

      {/* Global Discount Section */}
      <Box
        mt={4}
        p={3}
        sx={{
          border: "2px solid #007bff",
          borderRadius: 2,
          backgroundColor: "#f8f9fa"
        }}
      >
        <Typography variant="h6" gutterBottom color="primary">
          Global Discount (Optional)
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Applying a global discount will override individual service discounts.
        </Typography>

        <FormControl component="fieldset" sx={{ mt: 2 }}>
          <RadioGroup
            value={discountType}
            onChange={(e) => {
              setDiscountType(e.target.value);
              if (e.target.value === "none") {
                setDiscountAmount(0);
                setDiscountPercent(0);
              }
            }}
            row
          >
            <FormControlLabel value="none" control={<Radio />} label="No Discount" />
            <FormControlLabel value="percent" control={<Radio />} label="Percentage" />
            <FormControlLabel value="amount" control={<Radio />} label="Amount" />
          </RadioGroup>
        </FormControl>

        {discountType === "percent" && (
          <TextField
            label="Discount Percentage"
            type="number"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
            sx={{ mt: 2, width: 150 }}
            InputProps={{ endAdornment: "%" }}
            inputProps={{ min: 0, max: 100 }}
          />
        )}

        {discountType === "amount" && (
          <TextField
            label="Discount Amount"
            type="number"
            value={discountAmount}
            onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
            sx={{ mt: 2, width: 150 }}
            InputProps={{ endAdornment: "₹" }}
            inputProps={{ min: 0 }}
          />
        )}

        {/* Discount Preview */}
        {discountType !== "none" && (
          <Box mt={2} p={2} sx={{ backgroundColor: "#fff3cd", borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Preview:</strong> {finalTotals.discountPercent.toFixed(2)}% discount 
              = ₹{finalTotals.discount.toLocaleString()} off
              {currentUser && finalTotals.discountPercent > currentUser.threshold && (
                <span style={{ color: "#dc3545", marginLeft: "10px" }}>
                  ⚠️ Exceeds your threshold ({currentUser.threshold}%) - requires approval
                </span>
              )}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Pricing Summary */}
      <Box
        mt={4}
        p={3}
        sx={{
          border: "1px solid #dee2e6",
          borderRadius: 2,
          backgroundColor: "white",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}
      >
        <Typography variant="h6" gutterBottom color="primary">
          Pricing Summary
        </Typography>

        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography>Subtotal:</Typography>
          <Typography fontWeight={600}>₹{finalTotals.subtotal.toLocaleString()}</Typography>
        </Box>

        {finalTotals.discount > 0 && (
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography color="error">
              Discount ({finalTotals.isGlobalDiscount ? "Global" : "Services"}):
            </Typography>
            <Typography fontWeight={600} color="error">
              -₹{finalTotals.discount.toLocaleString()}
            </Typography>
          </Box>
        )}

        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography>After Discount:</Typography>
          <Typography fontWeight={600}>₹{finalTotals.subtotalAfterDiscount.toLocaleString()}</Typography>
        </Box>

        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography>Tax (18%):</Typography>
          <Typography fontWeight={600}>₹{finalTotals.tax.toLocaleString()}</Typography>
        </Box>

        <Box
          display="flex"
          justifyContent="space-between"
          pt={2}
          sx={{ borderTop: "2px solid #007bff" }}
        >
          <Typography variant="h6" fontWeight="bold">Total:</Typography>
          <Typography variant="h6" fontWeight="bold" color="primary">
            ₹{finalTotals.total.toLocaleString()}
          </Typography>
        </Box>
      </Box>

      {/* Action Buttons */}
      <Box mt={4} display="flex" gap={2}>
        <Button
          variant="outlined"
          onClick={() => navigate(`/quotations/${id}/services`)}
          sx={{ minWidth: 120 }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleSavePricing}
          disabled={loading}
          sx={{ minWidth: 120 }}
        >
          {loading ? "Saving..." : "Save & Continue"}
        </Button>
      </Box>
    </Box>
  );
};

export default QuotationPricing;
