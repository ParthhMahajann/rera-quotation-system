import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  TextField,
  Typography,
  FormHelperText,
  Container,
  ListSubheader,
} from "@mui/material";
import { createQuotation } from "../services/quotations";

// Constants
const DEVELOPER_TYPE_OPTIONS = [
  { value: "cat1", label: "Category 1" },
  { value: "cat2", label: "Category 2" },
  { value: "cat3", label: "Category 3" },
  { value: "agent", label: "Agent Registration" },
];

const REGION_GROUPS = [
  {
    label: "Mumbai Metropolitan Region",
    options: ["Mumbai Suburban", "Mumbai City", "Thane", "Palghar"],
  },
  { label: "Navi/KDMC/Raigad", options: ["KDMC", "Navi Mumbai", "Raigad"] },
  {
    label: "Pune & ROM",
    options: [
      "Pune - City",
      "Pune - PCMC",
      "Pune - PMRDA",
      "Pune - Rural",
      "ROM (Rest of Maharashtra)",
    ],
  },
];

const VALIDITY_OPTIONS = ["7 days", "15 days", "30 days"];
const PAYMENT_SCHEDULE_OPTIONS = ["50%", "70%", "100%"];

const INITIAL_FORM_STATE = {
  developerType: "",
  projectRegion: "",
  projectLocation: "",
  plotArea: "",
  developerName: "",
  projectName: "",
  validity: "7 days",
  paymentSchedule: "50%",
  reraNumber: "",
  serviceSummary: "",
};

export default function CreateQuotation() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM_STATE);

  // Plot area validation
  const plotAreaNum = useMemo(() => Number(form.plotArea), [form.plotArea]);
  const plotAreaValid = useMemo(
    () => Number.isFinite(plotAreaNum) && plotAreaNum >= 0,
    [plotAreaNum]
  );

  const plotAreaBand = useMemo(() => {
    if (!plotAreaValid) return "";
    if (plotAreaNum <= 500) return "0 - 500 sq units";
    if (plotAreaNum <= 1000) return "501 - 1000 sq units";
    if (plotAreaNum <= 1500) return "1001 - 1500 sq units";
    if (plotAreaNum <= 2500) return "1501 - 2500 sq units";
    if (plotAreaNum <= 4000) return "2501 - 4000 sq units";
    if (plotAreaNum <= 6500) return "4001 - 6500 sq units";
    return "6500+ sq units";
  }, [plotAreaValid, plotAreaNum]);

  const handleChange = (field, value) => {
    setForm((prevForm) => ({ ...prevForm, [field]: value }));
  };

  const validateReraNumber = (value) => {
    if (!value) return true;
    return /^[A-Z0-9]{3,5}-[A-Z0-9]{6,10}$/i.test(value);
  };
  const reraValid = validateReraNumber(form.reraNumber);

  const canSubmit = useMemo(
    () =>
      !!form.developerType &&
      !!form.projectRegion &&
      form.developerName.trim().length > 0 &&
      plotAreaValid &&
      reraValid,
    [form, plotAreaValid, reraValid]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      const created = await createQuotation({
        ...form,
        plotArea: Number(form.plotArea),
        projectName: form.projectName || null,
        reraNumber: form.reraNumber || null,
        serviceSummary: form.serviceSummary || null,
        createdBy: form.developerName,
      });

      if (form.developerType !== "agent" && created?.id) {
        navigate(`/quotations/${encodeURIComponent(created.id)}/services`);
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save quotation");
    }
  };

  useEffect(() => {
    if (form.developerType === "agent") {
      navigate("/quotations/new/agent", { replace: true });
    }
  }, [form.developerType, navigate]);

  const developerDependentDisabled = form.developerType === "agent";

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        minHeight: "100vh",
        bgcolor: "#f8f9fa",
        py: 3,
        px: 2,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 1000 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="600" color="#2c3e50" gutterBottom>
            Create Quotation
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Enter project, developer, and scope details
          </Typography>
        </Box>

        <Card sx={{ width: "100%", borderRadius: 2, boxShadow: 2 }}>
          <CardContent component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
            {/* Developer & Project Information */}
            <Typography
              variant="h6"
              fontWeight="600"
              color="#2c3e50"
              gutterBottom
              mb={2}
            >
              Developer & Project Information
            </Typography>

            <Grid container spacing={2} mb={3}>
              {/* Developer Type */}
              <Grid item xs={12} md={12}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Developer Type"
                  value={form.developerType}
                  onChange={(e) => handleChange("developerType", e.target.value)}
                >
                  {DEVELOPER_TYPE_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
                {form.developerType === "agent" && (
                  <FormHelperText sx={{ color: "info.main", fontStyle: "italic" }}>
                    Some fields are disabled for Agent Registration.
                  </FormHelperText>
                )}
              </Grid>

              {/* Project Region */}
              <Grid item xs={12} md={12}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Project Region"
                  value={form.projectRegion}
                  onChange={(e) => handleChange("projectRegion", e.target.value)}
                >
                  {REGION_GROUPS.map((g) => [
                    <ListSubheader key={`${g.label}-header`} sx={{ fontWeight: 600 }}>
                      {g.label}
                    </ListSubheader>,
                    g.options.map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    )),
                  ])}
                </TextField>
              </Grid>

              {/* Project Location */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Project Location (optional)"
                  value={form.projectLocation}
                  onChange={(e) =>
                    handleChange("projectLocation", e.target.value)
                  }
                  disabled={developerDependentDisabled}
                />
              </Grid>

              {/* Developer Name */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Developer Name"
                  value={form.developerName}
                  onChange={(e) => handleChange("developerName", e.target.value)}
                  required
                  disabled={developerDependentDisabled}
                />
              </Grid>

              {/* Project Name */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Project Name (optional)"
                  value={form.projectName}
                  onChange={(e) => handleChange("projectName", e.target.value)}
                  disabled={developerDependentDisabled}
                />
              </Grid>

              {/* Plot Area */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Plot Area"
                  value={form.plotArea}
                  onChange={(e) => handleChange("plotArea", e.target.value)}
                  required
                  error={!plotAreaValid && form.plotArea !== ""}
                  helperText={
                    !plotAreaValid && form.plotArea !== ""
                      ? "Enter a valid non-negative number."
                      : plotAreaValid
                      ? `Detected range: ${plotAreaBand}`
                      : ""
                  }
                />
              </Grid>
            </Grid>

            {/* Quotation Settings */}
            <Typography
              variant="h6"
              fontWeight="600"
              color="#2c3e50"
              gutterBottom
              mb={2}
            >
              Quotation Settings
            </Typography>

            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Validity"
                  value={form.validity}
                  onChange={(e) => handleChange("validity", e.target.value)}
                >
                  {VALIDITY_OPTIONS.map((v) => (
                    <MenuItem key={v} value={v}>
                      {v}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Payment Schedule"
                  value={form.paymentSchedule}
                  onChange={(e) => handleChange("paymentSchedule", e.target.value)}
                >
                  {PAYMENT_SCHEDULE_OPTIONS.map((v) => (
                    <MenuItem key={v} value={v}>
                      {v}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="RERA Compliance Number (optional)"
                  value={form.reraNumber}
                  onChange={(e) =>
                    handleChange("reraNumber", e.target.value.toUpperCase())
                  }
                  error={!reraValid}
                  helperText={
                    !reraValid
                      ? "Format should be like ABC-123456 or P517-201234."
                      : ""
                  }
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Service Summary (optional)"
              value={form.serviceSummary}
              onChange={(e) => handleChange("serviceSummary", e.target.value)}
              sx={{ mb: 3 }}
            />

            {/* Actions */}
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => navigate(-1)}
                sx={{
                  px: 3,
                  borderRadius: 1,
                  fontWeight: 600,
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={!canSubmit}
                sx={{
                  px: 4,
                  borderRadius: 1,
                  fontWeight: 600,
                  bgcolor: "#2c3e50",
                  "&:hover": {
                    bgcolor: "#1a252f",
                  },
                }}
              >
                Next Step
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
