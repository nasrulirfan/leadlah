"use client";

import { useEffect, useMemo, useState } from "react";
import {
  calculateLoanEligibility,
  calculateSpaMot,
  calculateLoanAgreement,
  calculateRoi,
  calculateSellability,
  calculateLandFeasibility,
  calculateTenancyStampDuty,
  buildReceipt
} from "@leadlah/core";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { CalculatorReceipt } from "@leadlah/core";
import {
  Calculator,
  FileText,
  TrendingUp,
  Building2,
  Landmark,
  Home,
  Receipt,
  Download,
  ArrowLeft,
  CheckCircle2
} from "lucide-react";

type CalculatorType =
  | "loan"
  | "spa"
  | "loanAgreement"
  | "roi"
  | "sellability"
  | "land"
  | "tenancy"
  | null;

type CalculatorSlug = Exclude<CalculatorType, null>;

type CalculatorConfig = {
  id: CalculatorSlug;
  title: string;
  description: string;
  icon: typeof Calculator;
  color: string;
  category: string;
  receiptLabel: CalculatorReceipt["calculationType"];
};

type CalculatorsClientProps = {
  agent: {
    name: string;
    renNumber?: string;
    agencyLogoUrl?: string;
  };
  defaultCustomerName?: string;
};

export default function CalculatorsClient({ agent, defaultCustomerName }: CalculatorsClientProps) {
  const agentDisplayName = agent.name || "LeadLah Agent";
  const agentInitials =
    agentDisplayName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "LL";
  const [selectedCalculator, setSelectedCalculator] = useState<CalculatorType>(null);
  const [loanInput, setLoanInput] = useState({
    income: 12000,
    commitments: 2000,
    dsrPercent: 60,
    interestRate: 4.2,
    tenureYears: 30
  });

  const [spaInput, setSpaInput] = useState({
    propertyPrice: 900000,
    isForeigner: false,
    requiresConsent: false,
    contractDate: new Date().toISOString().slice(0, 10)
  });

  const [roiInput, setRoiInput] = useState({ price: 900000, monthlyRent: 3500, annualCosts: 12000 });
  const [sellInput, setSellInput] = useState({ belowMarketPct: 10, competitionScore: 3, liquidityScore: 7 });
  const [landInput, setLandInput] = useState({ gdv: 50000000, landCost: 25000000 });
  const [tenancyInput, setTenancyInput] = useState({ monthlyRent: 2500, years: 2 });
  const [receipt, setReceipt] = useState<CalculatorReceipt | null>(null);
  const [customerName, setCustomerName] = useState(defaultCustomerName ?? "");
  const [agentRenNumber, setAgentRenNumber] = useState(agent.renNumber ?? "REN 00000");
  const [brandingLogoUrl, setBrandingLogoUrl] = useState(agent.agencyLogoUrl ?? "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  useEffect(() => {
    setError(null);
  }, [selectedCalculator]);

  const loan = useMemo(() => calculateLoanEligibility(loanInput), [loanInput]);
  const spa = useMemo(
    () =>
      calculateSpaMot({
        ...spaInput,
        contractDate: new Date(spaInput.contractDate)
      }),
    [spaInput]
  );
  const loanAgreement = useMemo(
    () => calculateLoanAgreement({ loanAmount: loan.maxLoanAmount || 500000 }),
    [loan]
  );
  const roi = useMemo(() => calculateRoi(roiInput), [roiInput]);
  const sell = useMemo(() => calculateSellability(sellInput), [sellInput]);
  const land = useMemo(() => calculateLandFeasibility(landInput), [landInput]);
  const tenancy = useMemo(() => calculateTenancyStampDuty(tenancyInput), [tenancyInput]);

  const calculators: CalculatorConfig[] = [
    {
      id: "loan",
      title: "Loan Eligibility",
      description: "Reverse DSR calculation to find maximum loan amount",
      icon: Calculator,
      color: "bg-blue-500",
      category: "Financing",
      receiptLabel: "Loan Eligibility"
    },
    {
      id: "spa",
      title: "Legal Fee & Stamp Duty",
      description: "SPA/MOT legal fees with foreigner rules",
      icon: FileText,
      color: "bg-purple-500",
      category: "Legal",
      receiptLabel: "SPA/MOT"
    },
    {
      id: "loanAgreement",
      title: "Loan Agreement",
      description: "Calculate loan agreement fees and stamp duty",
      icon: Landmark,
      color: "bg-indigo-500",
      category: "Legal",
      receiptLabel: "Loan Agreement"
    },
    {
      id: "roi",
      title: "ROI Calculator",
      description: "Gross and net rental yield analysis",
      icon: TrendingUp,
      color: "bg-green-500",
      category: "Investment",
      receiptLabel: "ROI"
    },
    {
      id: "sellability",
      title: "Property Sellability",
      description: "MFS score and market feasibility grading",
      icon: Home,
      color: "bg-orange-500",
      category: "Analysis",
      receiptLabel: "Sellability"
    },
    {
      id: "land",
      title: "Land Feasibility",
      description: "Developer pitching with GDV analysis",
      icon: Building2,
      color: "bg-amber-500",
      category: "Development",
      receiptLabel: "Land Feasibility"
    },
    {
      id: "tenancy",
      title: "Tenancy Stamp Duty",
      description: "Rental agreement stamp duty calculation",
      icon: Receipt,
      color: "bg-teal-500",
      category: "Legal",
      receiptLabel: "Tenancy Stamp Duty"
    }
  ];

  const calculatorsById = calculators.reduce<Record<CalculatorSlug, CalculatorConfig>>(
    (acc, calculator) => {
      acc[calculator.id] = calculator;
      return acc;
    },
    {} as Record<CalculatorSlug, CalculatorConfig>
  );

  const resolveReceiptSnapshot = (
    calculatorType: CalculatorSlug
  ):
    | {
        inputs: Record<string, number | string | boolean>;
        outputs: Record<string, number | string | boolean>;
      }
    | null => {
    switch (calculatorType) {
      case "loan":
        return {
          inputs: {
            "Monthly Income (RM)": loanInput.income,
            "Monthly Commitments (RM)": loanInput.commitments,
            "DSR (%)": loanInput.dsrPercent,
            "Interest Rate (%)": loanInput.interestRate,
            "Loan Tenure (Years)": loanInput.tenureYears
          },
          outputs: {
            "Max Monthly Installment (RM)": loan.maxInstallment,
            "Max Loan Amount (RM)": loan.maxLoanAmount,
            "Max Property Price (RM)": loan.maxPropertyPrice
          }
        };
      case "spa":
        return {
          inputs: {
            "Property Price (RM)": spaInput.propertyPrice,
            "Buyer Profile": spaInput.isForeigner ? "Foreigner" : "Malaysian",
            "State Consent Required": spaInput.requiresConsent,
            "Contract Date": spaInput.contractDate
          },
          outputs: {
            "Legal Fee (RM)": spa.legalFee,
            "Disbursement (RM)": spa.disbursement,
            "Stamp Duty (RM)": spa.stampDuty,
            "Foreigner Rate Applied (%)": spa.foreignerRateApplied * 100,
            "Total Legal & Duty (RM)": spa.total
          }
        };
      case "loanAgreement":
        return {
          inputs: {
            "Loan Amount (RM)": loan.maxLoanAmount,
            "Stamp Duty Rate (%)": 0.5
          },
          outputs: {
            "Legal Fee (RM)": loanAgreement.legalFee,
            "Stamp Duty (RM)": loanAgreement.stampDuty,
            "Agreement Total (RM)": loanAgreement.total
          }
        };
      case "roi": {
        const annualRent = roiInput.monthlyRent * 12;
        return {
          inputs: {
            "Property Price (RM)": roiInput.price,
            "Monthly Rent (RM)": roiInput.monthlyRent,
            "Annual Operating Costs (RM)": roiInput.annualCosts
          },
          outputs: {
            "Gross Rental Yield (%)": roi.grossYield * 100,
            "Net Rental Yield (%)": roi.netYield * 100,
            "Annual Rent (RM)": annualRent,
            "Net Cash Flow (RM)": annualRent - roiInput.annualCosts
          }
        };
      }
      case "sellability":
        return {
          inputs: {
            "Pricing Advantage (%)": sellInput.belowMarketPct,
            "Competition Score (0-10)": sellInput.competitionScore,
            "Market Liquidity Score (0-10)": sellInput.liquidityScore
          },
          outputs: {
            "Sellability Score (/100)": sell.score,
            "Grade": sell.grade,
            "Market Commentary": sell.commentary
          }
        };
      case "land":
        return {
          inputs: {
            "Gross Development Value (RM)": landInput.gdv,
            "Land Cost (RM)": landInput.landCost
          },
          outputs: {
            "Developer Cost (RM)": land.developerCost,
            "Profit Margin (%)": land.margin * 100,
            "Feasibility Grade": land.grade
          }
        };
      case "tenancy": {
        const annualRent = tenancyInput.monthlyRent * 12;
        return {
          inputs: {
            "Monthly Rent (RM)": tenancyInput.monthlyRent,
            "Tenancy Period (Years)": tenancyInput.years
          },
          outputs: {
            "Annual Rent (RM)": annualRent,
            "Rounded Annual Rent (RM)": tenancy.roundedAnnualRent,
            "Duty Blocks": tenancy.blocks,
            "Duty per Block (RM)": tenancy.rate,
            "Total Stamp Duty (RM)": tenancy.stampDuty
          }
        };
      }
      default:
        return null;
    }
  };

  const handleExportPDF = async () => {
    if (!selectedCalculator) {
      return;
    }

    const config = calculatorsById[selectedCalculator];
    const snapshot = resolveReceiptSnapshot(selectedCalculator);

    if (!config || !snapshot) {
      setError("Unable to prepare receipt for this calculator.");
      return;
    }

    const payload = buildReceipt({
      agentName: agentDisplayName,
      customerName: customerName.trim() || undefined,
      renNumber: agentRenNumber.trim() || "REN 00000",
      agencyLogoUrl: brandingLogoUrl.trim() || undefined,
      calculationType: config.receiptLabel,
      inputs: snapshot.inputs,
      outputs: snapshot.outputs,
      issuedAt: new Date()
    });

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/calculators/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const rawMessage = await response.text();
        let message = "Unable to generate PDF receipt.";

        if (rawMessage) {
          try {
            const data = JSON.parse(rawMessage);
            if (data?.error) {
              message = data.error;
            } else {
              message = rawMessage;
            }
          } catch {
            message = rawMessage;
          }
        }

        throw new Error(message);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const fileName = `${config.receiptLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-receipt.pdf`;

      setReceipt(payload);
      setDownloadFileName(fileName);
      setDownloadUrl(blobUrl);
    } catch (err) {
      console.error("Failed to generate calculator PDF", err);
      setError(err instanceof Error ? err.message : "Unable to generate PDF receipt.");
    } finally {
      setIsGenerating(false);
    }
  };

  const receiptBanner =
    receipt && downloadUrl ? (
      <Card className="border-primary/20 bg-primary/5">
        <div className="flex flex-wrap items-start gap-4">
          <div className="rounded-full bg-primary/10 p-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">PDF Receipt Ready</h3>
            <p className="mt-1 text-sm text-slate-600">
              {receipt.calculationType} • {receipt.agentName} ({receipt.renNumber}) · Prepared for{" "}
              {receipt.customerName ?? "Client"}
            </p>
            <p className="mt-1 text-xs text-slate-500">Issued: {receipt.issuedAt.toLocaleString()}</p>
          </div>
          <Button asChild size="sm" variant="outline">
            <a href={downloadUrl} download={downloadFileName ?? "calculator-receipt.pdf"} className="flex items-center">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </a>
          </Button>
        </div>
      </Card>
    ) : null;

  if (!selectedCalculator) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Professional Calculators</h1>
            <p className="mt-2 text-slate-600">
              Choose a calculator to get started with instant, accurate financial estimates
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {calculators.map((calc) => {
            const Icon = calc.icon;
            return (
              <Card
                key={calc.id}
                className="group cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
                onClick={() => setSelectedCalculator(calc.id)}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className={`${calc.color} rounded-lg p-3 text-white transition-transform group-hover:scale-110`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {calc.category}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-primary">
                      {calc.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">{calc.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {receiptBanner}
      </div>
    );
  }

  const currentCalculator = selectedCalculator ? calculatorsById[selectedCalculator] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedCalculator(null)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Calculators
        </Button>
      </div>

      {receiptBanner}

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {currentCalculator && (
              <>
                <div className={`${currentCalculator.color} rounded-lg p-3 text-white`}>
                  <currentCalculator.icon className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{currentCalculator.title}</h1>
                  <p className="text-sm text-muted-foreground">{currentCalculator.description}</p>
                </div>
              </>
            )}
          </div>
          <Button onClick={handleExportPDF} className="gap-2" disabled={isGenerating}>
            <Download className="h-4 w-4" />
            {isGenerating ? "Generating..." : "Export PDF"}
          </Button>
        </div>
        {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      </div>

      <Card className="border-dashed border-border">
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="space-y-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/40">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Registered Agent</p>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-600 shadow-sm dark:bg-slate-900/60 dark:text-white">
                {agentInitials}
              </div>
              <div>
                <p className="font-semibold text-foreground">{agentDisplayName}</p>
                <p className="text-sm text-muted-foreground">{agentRenNumber || "REN 00000"}</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name (Receipt)</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="e.g., Tan Family"
            />
            <p className="text-xs text-muted-foreground">Appears on the PDF as the recipient.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="agentRenNumber">REN Number</Label>
            <Input
              id="agentRenNumber"
              value={agentRenNumber}
              onChange={(event) => setAgentRenNumber(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logoUrl">Agency Logo URL</Label>
            <Input
              id="logoUrl"
              value={brandingLogoUrl}
              onChange={(event) => setBrandingLogoUrl(event.target.value)}
              placeholder="https://logo.cdn/brand.png"
            />
            <p className="text-xs text-slate-500">Optional. Used to brand the PDF header.</p>
          </div>
        </div>
      </Card>

      {selectedCalculator === "loan" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-slate-900">Input Parameters</h3>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="income">Monthly Income (RM)</Label>
                <Input
                  id="income"
                  type="number"
                  value={loanInput.income}
                  onChange={(e) => setLoanInput({ ...loanInput, income: Number(e.target.value) })}
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commitments">Monthly Commitments (RM)</Label>
                <Input
                  id="commitments"
                  type="number"
                  value={loanInput.commitments}
                  onChange={(e) => setLoanInput({ ...loanInput, commitments: Number(e.target.value) })}
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dsr">DSR Percentage (%)</Label>
                <Input
                  id="dsr"
                  type="number"
                  value={loanInput.dsrPercent}
                  onChange={(e) => setLoanInput({ ...loanInput, dsrPercent: Number(e.target.value) })}
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interest">Interest Rate (%)</Label>
                <Input
                  id="interest"
                  type="number"
                  step="0.1"
                  value={loanInput.interestRate}
                  onChange={(e) => setLoanInput({ ...loanInput, interestRate: Number(e.target.value) })}
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenure">Loan Tenure (Years)</Label>
                <Input
                  id="tenure"
                  type="number"
                  value={loanInput.tenureYears}
                  onChange={(e) => setLoanInput({ ...loanInput, tenureYears: Number(e.target.value) })}
                  className="text-lg"
                />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
            <h3 className="text-lg font-semibold text-slate-900">Results</h3>
            <div className="mt-6 space-y-4">
              <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-slate-900/60">
                <p className="text-sm text-slate-600">Max Monthly Installment</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  RM {loan.maxInstallment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-slate-900/60">
                <p className="text-sm text-slate-600">Max Loan Amount</p>
                <p className="mt-1 text-2xl font-bold text-primary">
                  RM {loan.maxLoanAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-slate-900/60">
                <p className="text-sm text-slate-600">Max Property Price</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  RM {loan.maxPropertyPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {selectedCalculator === "spa" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-slate-900">Input Parameters</h3>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="propertyPrice">Property Price (RM)</Label>
                <Input
                  id="propertyPrice"
                  type="number"
                  value={spaInput.propertyPrice}
                  onChange={(e) => setSpaInput({ ...spaInput, propertyPrice: Number(e.target.value) })}
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">Buyer Nationality</Label>
                <Select
                  value={spaInput.isForeigner ? "yes" : "no"}
                  onValueChange={(value) => setSpaInput({ ...spaInput, isForeigner: value === "yes" })}
                >
                  <SelectTrigger id="nationality">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">Malaysian</SelectItem>
                    <SelectItem value="yes">Foreigner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="consent">State Consent Required</Label>
                <Select
                  value={spaInput.requiresConsent ? "yes" : "no"}
                  onValueChange={(value) => setSpaInput({ ...spaInput, requiresConsent: value === "yes" })}
                >
                  <SelectTrigger id="consent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No Consent</SelectItem>
                    <SelectItem value="yes">Consent Required</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="contractDate">Contract Date</Label>
                <Input
                  id="contractDate"
                  type="date"
                  value={spaInput.contractDate}
                  onChange={(e) => setSpaInput({ ...spaInput, contractDate: e.target.value })}
                />
                {spaInput.isForeigner && (
                  <p className="text-xs text-amber-600">
                    {new Date(spaInput.contractDate) >= new Date("2026-01-01")
                      ? "⚠️ 8% flat rate applies (after Jan 1, 2026)"
                      : "4% flat rate applies (before Jan 1, 2026)"}
                  </p>
                )}
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
            <h3 className="text-lg font-semibold text-slate-900">Cost Breakdown</h3>
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm dark:bg-slate-900/60">
                <span className="text-sm text-slate-600">Legal Fee</span>
                <span className="font-semibold text-slate-900">
                  RM {spa.legalFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm dark:bg-slate-900/60">
                <span className="text-sm text-slate-600">Disbursement</span>
                <span className="font-semibold text-slate-900">
                  RM {spa.disbursement.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm dark:bg-slate-900/60">
                <span className="text-sm text-slate-600">Stamp Duty</span>
                <span className="font-semibold text-slate-900">
                  RM {spa.stampDuty.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-4 rounded-lg bg-primary p-4 text-white shadow-md">
                <p className="text-sm opacity-90">Total Cost</p>
                <p className="mt-1 text-3xl font-bold">
                  RM {spa.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {selectedCalculator === "loanAgreement" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-slate-900">Loan Amount</h3>
            <div className="mt-6">
              <div className="space-y-2">
                <Label htmlFor="loanAmount">Loan Amount (RM)</Label>
                <Input
                  id="loanAmount"
                  type="number"
                  value={loan.maxLoanAmount.toFixed(0)}
                  readOnly
                  className="text-lg bg-slate-50"
                />
                <p className="text-xs text-slate-500">
                  Based on loan eligibility calculation. Switch to Loan Eligibility calculator to adjust.
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-blue-50">
            <h3 className="text-lg font-semibold text-slate-900">Agreement Costs</h3>
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm dark:bg-slate-900/60">
                <span className="text-sm text-slate-600">Legal Fee</span>
                <span className="font-semibold text-slate-900">
                  RM {loanAgreement.legalFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm dark:bg-slate-900/60">
                <span className="text-sm text-slate-600">Stamp Duty (0.5%)</span>
                <span className="font-semibold text-slate-900">
                  RM {loanAgreement.stampDuty.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-4 rounded-lg bg-primary p-4 text-white shadow-md">
                <p className="text-sm opacity-90">Total Cost</p>
                <p className="mt-1 text-3xl font-bold">
                  RM {loanAgreement.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {selectedCalculator === "roi" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-slate-900">Investment Details</h3>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="price">Property Price (RM)</Label>
                <Input
                  id="price"
                  type="number"
                  value={roiInput.price}
                  onChange={(e) => setRoiInput({ ...roiInput, price: Number(e.target.value) })}
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyRent">Monthly Rental Income (RM)</Label>
                <Input
                  id="monthlyRent"
                  type="number"
                  value={roiInput.monthlyRent}
                  onChange={(e) => setRoiInput({ ...roiInput, monthlyRent: Number(e.target.value) })}
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="annualCosts">Annual Costs (RM)</Label>
                <Input
                  id="annualCosts"
                  type="number"
                  value={roiInput.annualCosts}
                  onChange={(e) => setRoiInput({ ...roiInput, annualCosts: Number(e.target.value) })}
                  className="text-lg"
                />
                <p className="text-xs text-slate-500">Maintenance, quit rent, assessment, etc.</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
            <h3 className="text-lg font-semibold text-slate-900">Yield Analysis</h3>
            <div className="mt-6 space-y-4">
              <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-slate-900/60">
                <p className="text-sm text-slate-600">Gross Rental Yield</p>
                <p className="mt-2 text-3xl font-bold text-green-600">
                  {(roi.grossYield * 100).toFixed(2)}%
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Annual rent: RM {(roiInput.monthlyRent * 12).toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-slate-900/60">
                <p className="text-sm text-slate-600">Net Rental Yield</p>
                <p className="mt-2 text-3xl font-bold text-primary">
                  {(roi.netYield * 100).toFixed(2)}%
                </p>
                <p className="mt-1 text-xs text-slate-500">After deducting annual costs</p>
              </div>
              <div className="rounded-lg bg-slate-100 p-3">
                <p className="text-xs text-slate-600">
                  {roi.netYield >= 0.05
                    ? "✅ Strong investment potential"
                    : roi.netYield >= 0.03
                    ? "⚠️ Moderate returns"
                    : "❌ Low yield - review pricing"}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {selectedCalculator === "sellability" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-slate-900">Market Factors</h3>
            <div className="mt-6 grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="belowMarket">Price Below Market Value (%)</Label>
                <Input
                  id="belowMarket"
                  type="number"
                  value={sellInput.belowMarketPct}
                  onChange={(e) => setSellInput({ ...sellInput, belowMarketPct: Number(e.target.value) })}
                  className="text-lg"
                />
                <p className="text-xs text-slate-500">Higher percentage = more attractive pricing</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="competition">Competition Score (0-10)</Label>
                <Input
                  id="competition"
                  type="number"
                  min="0"
                  max="10"
                  value={sellInput.competitionScore}
                  onChange={(e) => setSellInput({ ...sellInput, competitionScore: Number(e.target.value) })}
                  className="text-lg"
                />
                <p className="text-xs text-slate-500">0 = High competition, 10 = Low competition</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="liquidity">Market Liquidity Score (0-10)</Label>
                <Input
                  id="liquidity"
                  type="number"
                  min="0"
                  max="10"
                  value={sellInput.liquidityScore}
                  onChange={(e) => setSellInput({ ...sellInput, liquidityScore: Number(e.target.value) })}
                  className="text-lg"
                />
                <p className="text-xs text-slate-500">0 = Illiquid market, 10 = Highly liquid</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-amber-50">
            <h3 className="text-lg font-semibold text-slate-900">MFS Assessment</h3>
            <div className="mt-6 space-y-4">
              <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-slate-900/60">
                <p className="text-sm text-slate-600">Sellability Score</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-slate-900">{sell.score.toFixed(0)}</p>
                  <p className="text-lg text-slate-500">/ 100</p>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all"
                    style={{ width: `${sell.score}%` }}
                  />
                </div>
              </div>
              <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-slate-900/60">
                <p className="text-sm text-slate-600">Grade</p>
                <p className="mt-2 text-5xl font-bold text-primary">{sell.grade}</p>
              </div>
              <div className="rounded-lg bg-slate-100 p-4">
                <p className="text-sm leading-relaxed text-slate-700">{sell.commentary}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {selectedCalculator === "land" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-slate-900">Development Parameters</h3>
            <div className="mt-6 grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="gdv">Gross Development Value - GDV (RM)</Label>
                <Input
                  id="gdv"
                  type="number"
                  value={landInput.gdv}
                  onChange={(e) => setLandInput({ ...landInput, gdv: Number(e.target.value) })}
                  className="text-lg"
                />
                <p className="text-xs text-slate-500">Total estimated sales value of completed project</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="landCost">Land Acquisition Cost (RM)</Label>
                <Input
                  id="landCost"
                  type="number"
                  value={landInput.landCost}
                  onChange={(e) => setLandInput({ ...landInput, landCost: Number(e.target.value) })}
                  className="text-lg"
                />
                <p className="text-xs text-slate-500">Purchase price of the land</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-900">Development Cost Formula</p>
                <p className="mt-1 text-xs text-blue-700">Fixed at 45% of GDV (construction, professional fees, etc.)</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50">
            <h3 className="text-lg font-semibold text-slate-900">Feasibility Analysis</h3>
            <div className="mt-6 space-y-4">
              <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-slate-900/60">
                <p className="text-sm text-slate-600">Developer Cost (45%)</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  RM {land.developerCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-slate-900/60">
                <p className="text-sm text-slate-600">Profit Margin</p>
                <p className="mt-1 text-3xl font-bold text-primary">
                  {(land.margin * 100).toFixed(2)}%
                </p>
              </div>
              <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-slate-900/60">
                <p className="text-sm text-slate-600">Feasibility Grade</p>
                <p className="mt-1 text-5xl font-bold text-slate-900">{land.grade}</p>
              </div>
              <div className="rounded-lg bg-slate-100 p-3">
                <p className="text-xs text-slate-600">
                  {land.grade === "A"
                    ? "✅ Excellent - Strong profit potential"
                    : land.grade === "B"
                    ? "✅ Good - Viable development"
                    : land.grade === "C"
                    ? "⚠️ Fair - Marginal returns"
                    : land.grade === "D"
                    ? "⚠️ Poor - High risk"
                    : "❌ Not feasible"}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {selectedCalculator === "tenancy" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-slate-900">Tenancy Agreement Details</h3>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="monthlyRent">Monthly Rental (RM)</Label>
                <Input
                  id="monthlyRent"
                  type="number"
                  value={tenancyInput.monthlyRent}
                  onChange={(e) => setTenancyInput({ ...tenancyInput, monthlyRent: Number(e.target.value) })}
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="years">Tenancy Period (Years)</Label>
                <Input
                  id="years"
                  type="number"
                  value={tenancyInput.years}
                  onChange={(e) => setTenancyInput({ ...tenancyInput, years: Number(e.target.value) })}
                  className="text-lg"
                />
              </div>
              <div className="sm:col-span-2 rounded-lg bg-teal-50 p-4">
                <p className="text-sm font-medium text-teal-900">Calculation Method</p>
                <p className="mt-1 text-xs text-teal-700">
                  Annual rent is rounded to nearest RM 250, then divided into blocks for rate calculation
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-teal-50 to-cyan-50">
            <h3 className="text-lg font-semibold text-slate-900">Stamp Duty Breakdown</h3>
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm dark:bg-slate-900/60">
                <span className="text-sm text-slate-600">Annual Rent</span>
                <span className="font-semibold text-slate-900">
                  RM {(tenancyInput.monthlyRent * 12).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm dark:bg-slate-900/60">
                <span className="text-sm text-slate-600">Rounded Amount</span>
                <span className="font-semibold text-slate-900">
                  RM {tenancy.roundedAnnualRent.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm dark:bg-slate-900/60">
                <span className="text-sm text-slate-600">Blocks</span>
                <span className="font-semibold text-slate-900">{tenancy.blocks}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm dark:bg-slate-900/60">
                <span className="text-sm text-slate-600">Rate Applied</span>
                <span className="font-semibold text-slate-900">{tenancy.rate}%</span>
              </div>
              <div className="mt-4 rounded-lg bg-primary p-4 text-white shadow-md">
                <p className="text-sm opacity-90">Total Stamp Duty</p>
                <p className="mt-1 text-3xl font-bold">
                  RM {tenancy.stampDuty.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
