"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  calculateLoanEligibility,
  calculateSpaMot,
  calculateLoanAgreement,
  calculateRoi,
  calculateSellability,
  calculateLandFeasibility,
  calculateTenancyStampDuty,
  buildReceipt,
} from "@leadlah/core";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { CalculatorReceipt } from "@leadlah/core";
import { PageHero } from "@/components/app/PageHero";
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
  CheckCircle2,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    avatarUrl?: string;
  };
  defaultCustomerName?: string;
};

export default function CalculatorsClient({
  agent,
  defaultCustomerName,
}: CalculatorsClientProps) {
  const agentDisplayName = agent.name || "LeadLah Agent";
  const agentInitials =
    agentDisplayName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "LL";
  const [selectedCalculator, setSelectedCalculator] =
    useState<CalculatorType>(null);
  const [loanInput, setLoanInput] = useState({
    income: 12000,
    commitments: 2000,
    dsrPercent: 60,
    interestRate: 4.2,
    tenureYears: 30,
  });

  const [spaInput, setSpaInput] = useState({
    propertyPrice: 900000,
    isForeigner: false,
    requiresConsent: false,
    contractDate: new Date().toISOString().slice(0, 10),
  });

  const [roiInput, setRoiInput] = useState({
    price: 900000,
    monthlyRent: 3500,
    annualCosts: 12000,
  });
  const [sellInput, setSellInput] = useState({
    belowMarketPct: 10,
    competitionScore: 3,
    liquidityScore: 7,
  });
  const [landInput, setLandInput] = useState({
    gdv: 50000000,
    landCost: 25000000,
  });
  const [tenancyInput, setTenancyInput] = useState({
    monthlyRent: 2500,
    years: 2,
  });
  const [receipt, setReceipt] = useState<CalculatorReceipt | null>(null);
  const [customerName, setCustomerName] = useState(defaultCustomerName ?? "");
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
  const currentDsrPercent = useMemo(() => {
    if (loanInput.income <= 0) return 0;
    return (loanInput.commitments / loanInput.income) * 100;
  }, [loanInput.commitments, loanInput.income]);
  const spa = useMemo(
    () =>
      calculateSpaMot({
        ...spaInput,
        contractDate: new Date(spaInput.contractDate),
      }),
    [spaInput],
  );
  const loanAgreement = useMemo(
    () => calculateLoanAgreement({ loanAmount: loan.maxLoanAmount || 500000 }),
    [loan],
  );
  const roi = useMemo(() => calculateRoi(roiInput), [roiInput]);
  const sell = useMemo(() => calculateSellability(sellInput), [sellInput]);
  const land = useMemo(() => calculateLandFeasibility(landInput), [landInput]);
  const tenancy = useMemo(
    () => calculateTenancyStampDuty(tenancyInput),
    [tenancyInput],
  );

  const calculators: CalculatorConfig[] = [
    {
      id: "loan",
      title: "Loan Eligibility",
      description: "Reverse DSR calculation to find maximum loan amount",
      icon: Calculator,
      color: "bg-blue-500",
      category: "Financing",
      receiptLabel: "Loan Eligibility",
    },
    {
      id: "spa",
      title: "Legal Fee & Stamp Duty",
      description: "SPA/MOT legal fees with foreigner rules",
      icon: FileText,
      color: "bg-purple-500",
      category: "Legal",
      receiptLabel: "SPA/MOT",
    },
    {
      id: "loanAgreement",
      title: "Loan Agreement",
      description: "Calculate loan agreement fees and stamp duty",
      icon: Landmark,
      color: "bg-indigo-500",
      category: "Legal",
      receiptLabel: "Loan Agreement",
    },
    {
      id: "roi",
      title: "ROI Calculator",
      description: "Gross and net rental yield analysis",
      icon: TrendingUp,
      color: "bg-green-500",
      category: "Investment",
      receiptLabel: "ROI",
    },
    {
      id: "sellability",
      title: "Property Sellability",
      description: "MFS score and market feasibility grading",
      icon: Home,
      color: "bg-orange-500",
      category: "Analysis",
      receiptLabel: "Sellability",
    },
    {
      id: "land",
      title: "Land Feasibility",
      description: "Developer pitching with GDV analysis",
      icon: Building2,
      color: "bg-amber-500",
      category: "Development",
      receiptLabel: "Land Feasibility",
    },
    {
      id: "tenancy",
      title: "Tenancy Stamp Duty",
      description: "Rental agreement stamp duty calculation",
      icon: Receipt,
      color: "bg-teal-500",
      category: "Legal",
      receiptLabel: "Tenancy Stamp Duty",
    },
  ];

  const calculatorsById = calculators.reduce<
    Record<CalculatorSlug, CalculatorConfig>
  >(
    (acc, calculator) => {
      acc[calculator.id] = calculator;
      return acc;
    },
    {} as Record<CalculatorSlug, CalculatorConfig>,
  );

  const resolveReceiptSnapshot = (
    calculatorType: CalculatorSlug,
  ): {
    inputs: Record<string, number | string | boolean>;
    outputs: Record<string, number | string>;
  } | null => {
    switch (calculatorType) {
      case "loan":
        return {
          inputs: {
            "Monthly Income (RM)": loanInput.income,
            "Monthly Commitments (RM)": loanInput.commitments,
            "DSR (%)": loanInput.dsrPercent,
            "Interest Rate (%)": loanInput.interestRate,
            "Loan Tenure (Years)": loanInput.tenureYears,
          },
          outputs: {
            "Max Monthly Installment (RM)": loan.maxInstallment,
            "Max Loan Amount (RM)": loan.maxLoanAmount,
            "Max Property Price (RM)": loan.maxPropertyPrice,
          },
        };
      case "spa":
        return {
          inputs: {
            "Property Price (RM)": spaInput.propertyPrice,
            "Buyer Profile": spaInput.isForeigner ? "Foreigner" : "Malaysian",
            "State Consent Required": spaInput.requiresConsent,
            "Contract Date": spaInput.contractDate,
          },
          outputs: {
            "Legal Fee (RM)": spa.legalFee,
            "Disbursement (RM)": spa.disbursement,
            "Stamp Duty (RM)": spa.stampDuty,
            "Foreigner Rate Applied (%)": spa.foreignerRateApplied * 100,
            "Total Legal & Duty (RM)": spa.total,
          },
        };
      case "loanAgreement":
        return {
          inputs: {
            "Loan Amount (RM)": loan.maxLoanAmount,
            "Stamp Duty Rate (%)": 0.5,
          },
          outputs: {
            "Legal Fee (RM)": loanAgreement.legalFee,
            "Stamp Duty (RM)": loanAgreement.stampDuty,
            "Agreement Total (RM)": loanAgreement.total,
          },
        };
      case "roi": {
        const annualRent = roiInput.monthlyRent * 12;
        return {
          inputs: {
            "Property Price (RM)": roiInput.price,
            "Monthly Rent (RM)": roiInput.monthlyRent,
            "Annual Operating Costs (RM)": roiInput.annualCosts,
          },
          outputs: {
            "Gross Rental Yield (%)": roi.grossYield * 100,
            "Net Rental Yield (%)": roi.netYield * 100,
            "Annual Rent (RM)": annualRent,
            "Net Cash Flow (RM)": annualRent - roiInput.annualCosts,
          },
        };
      }
      case "sellability":
        return {
          inputs: {
            "Pricing Advantage (%)": sellInput.belowMarketPct,
            "Competition Score (0-10)": sellInput.competitionScore,
            "Market Liquidity Score (0-10)": sellInput.liquidityScore,
          },
          outputs: {
            "Sellability Score (/100)": sell.score,
            Grade: sell.grade,
            "Market Commentary": sell.commentary,
          },
        };
      case "land":
        return {
          inputs: {
            "Gross Development Value (RM)": landInput.gdv,
            "Land Cost (RM)": landInput.landCost,
          },
          outputs: {
            "Developer Cost (RM)": land.developerCost,
            "Profit Margin (%)": land.margin * 100,
            "Feasibility Grade": land.grade,
          },
        };
      case "tenancy": {
        const annualRent = tenancyInput.monthlyRent * 12;
        return {
          inputs: {
            "Monthly Rent (RM)": tenancyInput.monthlyRent,
            "Tenancy Period (Years)": tenancyInput.years,
          },
          outputs: {
            "Annual Rent (RM)": annualRent,
            "Rounded Annual Rent (RM)": tenancy.roundedAnnualRent,
            "Duty Blocks": tenancy.blocks,
            "Duty per Block (RM)": tenancy.rate,
            "Total Stamp Duty (RM)": tenancy.stampDuty,
          },
        };
      }
      default:
        return null;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.35,
        ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number],
      },
    },
    exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } },
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
      renNumber: agent.renNumber?.trim() || "REN 00000",
      agencyLogoUrl: agent.agencyLogoUrl?.trim() || undefined,
      calculationType: config.receiptLabel,
      inputs: snapshot.inputs,
      outputs: snapshot.outputs,
      issuedAt: new Date(),
    });

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/calculators/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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
      setError(
        err instanceof Error ? err.message : "Unable to generate PDF receipt.",
      );
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
            <h3 className="font-semibold text-foreground">PDF Receipt Ready</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {receipt.calculationType} • {receipt.agentName} (
              {receipt.renNumber}) · Prepared for{" "}
              {receipt.customerName ?? "Client"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Issued: {receipt.issuedAt.toLocaleString()}
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <a
              href={downloadUrl}
              download={downloadFileName ?? "calculator-receipt.pdf"}
              className="flex items-center"
            >
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
        <PageHero
          title="Professional Calculators"
          description="Choose a calculator to get started with instant, accurate financial estimates."
          icon={<Calculator />}
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence initial={false}>
            {calculators.map((calc) => {
              const Icon = calc.icon;
              return (
                <motion.div key={calc.id} variants={cardVariants} layout>
                  <Card
                    className="group cursor-pointer border-border/70 bg-card/90 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md dark:bg-slate-900/40"
                    onClick={() => setSelectedCalculator(calc.id)}
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div
                          className={cn(
                            "rounded-2xl p-3 text-white shadow-sm transition-transform group-hover:scale-105",
                            calc.color,
                          )}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {calc.category}
                        </Badge>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                          {calc.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {calc.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {receiptBanner}
      </div>
    );
  }

  const currentCalculator = selectedCalculator
    ? calculatorsById[selectedCalculator]
    : null;
  const HeroIcon = currentCalculator?.icon ?? Calculator;

  return (
    <div className="space-y-6">
      <PageHero
        title={currentCalculator?.title ?? "Calculator"}
        description={currentCalculator?.description}
        icon={<HeroIcon />}
        actions={
          <>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setSelectedCalculator(null)}
              className="gap-2 bg-white text-slate-900 shadow-lg hover:bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </Button>
            <Button
              onClick={handleExportPDF}
              size="lg"
              className="gap-2"
              disabled={isGenerating || !customerName.trim()}
              title={
                !customerName.trim()
                  ? "Customer Name is required to export PDF"
                  : ""
              }
            >
              <Download className="h-5 w-5" />
              {isGenerating ? "Generating..." : "Export PDF"}
            </Button>
          </>
        }
      />

      {receiptBanner}
      {error && (
        <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
      )}

      <Card className="border-dashed border-border">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-2xl bg-muted/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Registered Agent
            </p>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-background text-sm font-semibold text-muted-foreground shadow-sm">
                {agent.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={agent.avatarUrl}
                    alt="Agent avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  agentInitials
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {agentDisplayName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {agent.renNumber?.trim() || "REN 00000"}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Branding is managed in{" "}
              <Link className="underline" href="/profile">
                Profile
              </Link>
              .
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerName">
              Customer Name (Receipt){" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="e.g., Tan Family"
              required
            />
            <p className="text-xs text-muted-foreground">
              Appears on the PDF as the recipient.
            </p>
          </div>
        </div>
      </Card>

      {selectedCalculator === "loan" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-foreground">
              Input Parameters
            </h3>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="income">Monthly Income (RM)</Label>
                <Input
                  id="income"
                  type="number"
                  value={loanInput.income}
                  onChange={(e) =>
                    setLoanInput({
                      ...loanInput,
                      income: Number(e.target.value),
                    })
                  }
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commitments">Monthly Commitments (RM)</Label>
                <Input
                  id="commitments"
                  type="number"
                  value={loanInput.commitments}
                  onChange={(e) =>
                    setLoanInput({
                      ...loanInput,
                      commitments: Number(e.target.value),
                    })
                  }
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dsr" className="flex items-center gap-2">
                  DSR Percentage (%)
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center rounded-sm text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        aria-label="View DSR formula"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-80 p-4">
                      <div className="space-y-3 text-sm">
                        <div className="space-y-1">
                          <p className="font-semibold text-foreground">
                            DSR formulas
                          </p>
                          <p className="text-muted-foreground">
                            Current DSR = Monthly Commitments ÷ Monthly Income
                            <span className="block">
                              (Komitmen Bulanan ÷ Gaji Bersih)
                            </span>
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground">
                            Max new installment = (Monthly Income × DSR%) −
                            Monthly Commitments
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground">
                            Common bank guide:
                          </p>
                          <ul className="list-disc pl-5 text-muted-foreground">
                            <li>Income &lt; RM3,000 → 60%</li>
                            <li>RM3,000–RM5,000 → 70%</li>
                            <li>Income &gt; RM5,000 → 75%</li>
                          </ul>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </Label>
                <Input
                  id="dsr"
                  type="number"
                  value={loanInput.dsrPercent}
                  onChange={(e) =>
                    setLoanInput({
                      ...loanInput,
                      dsrPercent: Number(e.target.value),
                    })
                  }
                  className="text-lg"
                />
                <p className="text-xs text-muted-foreground tabular-nums">
                  Current DSR:{" "}
                  {Number.isFinite(currentDsrPercent)
                    ? `${currentDsrPercent.toFixed(0)}%`
                    : "—"}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="interest">Interest Rate (%)</Label>
                <Input
                  id="interest"
                  type="number"
                  step="0.1"
                  value={loanInput.interestRate}
                  onChange={(e) =>
                    setLoanInput({
                      ...loanInput,
                      interestRate: Number(e.target.value),
                    })
                  }
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenure">Loan Tenure (Years)</Label>
                <Input
                  id="tenure"
                  type="number"
                  value={loanInput.tenureYears}
                  onChange={(e) =>
                    setLoanInput({
                      ...loanInput,
                      tenureYears: Number(e.target.value),
                    })
                  }
                  className="text-lg"
                />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40">
            <h3 className="text-lg font-semibold text-foreground">Results</h3>
            <div className="mt-6 space-y-4">
              <div className="rounded-lg bg-card p-4 shadow-sm border border-border">
                <p className="text-sm text-muted-foreground">
                  Max Monthly Installment
                </p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  RM{" "}
                  {loan.maxInstallment.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="rounded-lg bg-card p-4 shadow-sm border border-border">
                <p className="text-sm text-muted-foreground">Max Loan Amount</p>
                <p className="mt-1 text-2xl font-bold text-primary">
                  RM{" "}
                  {loan.maxLoanAmount.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
              <div className="rounded-lg bg-card p-4 shadow-sm border border-border">
                <p className="text-sm text-muted-foreground">
                  Max Property Price
                </p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  RM{" "}
                  {loan.maxPropertyPrice.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {selectedCalculator === "spa" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-foreground">
              Input Parameters
            </h3>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="propertyPrice">Property Price (RM)</Label>
                <Input
                  id="propertyPrice"
                  type="number"
                  value={spaInput.propertyPrice}
                  onChange={(e) =>
                    setSpaInput({
                      ...spaInput,
                      propertyPrice: Number(e.target.value),
                    })
                  }
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">Buyer Nationality</Label>
                <Select
                  value={spaInput.isForeigner ? "yes" : "no"}
                  onValueChange={(value) =>
                    setSpaInput({ ...spaInput, isForeigner: value === "yes" })
                  }
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
                  onValueChange={(value) =>
                    setSpaInput({
                      ...spaInput,
                      requiresConsent: value === "yes",
                    })
                  }
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
                <DatePicker
                  value={spaInput.contractDate}
                  onChange={(val) =>
                    setSpaInput({ ...spaInput, contractDate: val })
                  }
                  placeholder="Select contract date"
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

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/40 dark:to-pink-900/40">
            <h3 className="text-lg font-semibold text-foreground">
              Cost Breakdown
            </h3>
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-card p-3 shadow-sm border border-border">
                <span className="text-sm text-muted-foreground">Legal Fee</span>
                <span className="font-semibold text-foreground">
                  RM{" "}
                  {spa.legalFee.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-card p-3 shadow-sm border border-border">
                <span className="text-sm text-muted-foreground">
                  Disbursement
                </span>
                <span className="font-semibold text-foreground">
                  RM{" "}
                  {spa.disbursement.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-card p-3 shadow-sm border border-border">
                <span className="text-sm text-muted-foreground">
                  Stamp Duty
                </span>
                <span className="font-semibold text-foreground">
                  RM{" "}
                  {spa.stampDuty.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="mt-4 rounded-lg bg-primary p-4 text-white shadow-md">
                <p className="text-sm opacity-90">Total Cost</p>
                <p className="mt-1 text-3xl font-bold">
                  RM{" "}
                  {spa.total.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {selectedCalculator === "loanAgreement" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-foreground">
              Loan Amount
            </h3>
            <div className="mt-6">
              <div className="space-y-2">
                <Label htmlFor="loanAmount">Loan Amount (RM)</Label>
                <Input
                  id="loanAmount"
                  type="number"
                  value={loan.maxLoanAmount.toFixed(0)}
                  readOnly
                  className="text-lg bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Based on loan eligibility calculation. Switch to Loan
                  Eligibility calculator to adjust.
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/40 dark:to-blue-900/40">
            <h3 className="text-lg font-semibold text-foreground">
              Agreement Costs
            </h3>
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-card p-3 shadow-sm border border-border">
                <span className="text-sm text-muted-foreground">Legal Fee</span>
                <span className="font-semibold text-foreground">
                  RM{" "}
                  {loanAgreement.legalFee.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-card p-3 shadow-sm border border-border">
                <span className="text-sm text-muted-foreground">
                  Stamp Duty (0.5%)
                </span>
                <span className="font-semibold text-foreground">
                  RM{" "}
                  {loanAgreement.stampDuty.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="mt-4 rounded-lg bg-primary p-4 text-white shadow-md">
                <p className="text-sm opacity-90">Total Cost</p>
                <p className="mt-1 text-3xl font-bold">
                  RM{" "}
                  {loanAgreement.total.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {selectedCalculator === "roi" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-foreground">
              Investment Details
            </h3>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="price">Property Price (RM)</Label>
                <Input
                  id="price"
                  type="number"
                  value={roiInput.price}
                  onChange={(e) =>
                    setRoiInput({ ...roiInput, price: Number(e.target.value) })
                  }
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyRent">Monthly Rental Income (RM)</Label>
                <Input
                  id="monthlyRent"
                  type="number"
                  value={roiInput.monthlyRent}
                  onChange={(e) =>
                    setRoiInput({
                      ...roiInput,
                      monthlyRent: Number(e.target.value),
                    })
                  }
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="annualCosts">Annual Costs (RM)</Label>
                <Input
                  id="annualCosts"
                  type="number"
                  value={roiInput.annualCosts}
                  onChange={(e) =>
                    setRoiInput({
                      ...roiInput,
                      annualCosts: Number(e.target.value),
                    })
                  }
                  className="text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  Maintenance, quit rent, assessment, etc.
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/40 dark:to-emerald-900/40">
            <h3 className="text-lg font-semibold text-foreground">
              Yield Analysis
            </h3>
            <div className="mt-6 space-y-4">
              <div className="rounded-lg bg-card p-4 shadow-sm border border-border">
                <p className="text-sm text-muted-foreground">
                  Gross Rental Yield
                </p>
                <p className="mt-2 text-3xl font-bold text-green-600">
                  {(roi.grossYield * 100).toFixed(2)}%
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Annual rent: RM {(roiInput.monthlyRent * 12).toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-card p-4 shadow-sm border border-border">
                <p className="text-sm text-muted-foreground">
                  Net Rental Yield
                </p>
                <p className="mt-2 text-3xl font-bold text-primary">
                  {(roi.netYield * 100).toFixed(2)}%
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  After deducting annual costs
                </p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">
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
            <h3 className="text-lg font-semibold text-foreground">
              Market Factors
            </h3>
            <div className="mt-6 grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="belowMarket">
                  Price Below Market Value (%)
                </Label>
                <Input
                  id="belowMarket"
                  type="number"
                  value={sellInput.belowMarketPct}
                  onChange={(e) =>
                    setSellInput({
                      ...sellInput,
                      belowMarketPct: Number(e.target.value),
                    })
                  }
                  className="text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  Higher percentage = more attractive pricing
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="competition">Competition Score (0-10)</Label>
                <Input
                  id="competition"
                  type="number"
                  min="0"
                  max="10"
                  value={sellInput.competitionScore}
                  onChange={(e) =>
                    setSellInput({
                      ...sellInput,
                      competitionScore: Number(e.target.value),
                    })
                  }
                  className="text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  0 = High competition, 10 = Low competition
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="liquidity">Market Liquidity Score (0-10)</Label>
                <Input
                  id="liquidity"
                  type="number"
                  min="0"
                  max="10"
                  value={sellInput.liquidityScore}
                  onChange={(e) =>
                    setSellInput({
                      ...sellInput,
                      liquidityScore: Number(e.target.value),
                    })
                  }
                  className="text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  0 = Illiquid market, 10 = Highly liquid
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/40 dark:to-amber-900/40">
            <h3 className="text-lg font-semibold text-foreground">
              MFS Assessment
            </h3>
            <div className="mt-6 space-y-4">
              <div className="rounded-lg bg-card p-4 shadow-sm border border-border">
                <p className="text-sm text-muted-foreground">
                  Sellability Score
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-foreground">
                    {sell.score.toFixed(0)}
                  </p>
                  <p className="text-lg text-muted-foreground">/ 100</p>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all"
                    style={{ width: `${sell.score}%` }}
                  />
                </div>
              </div>
              <div className="rounded-lg bg-card p-4 shadow-sm border border-border">
                <p className="text-sm text-muted-foreground">Grade</p>
                <p className="mt-2 text-5xl font-bold text-primary">
                  {sell.grade}
                </p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {sell.commentary}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {selectedCalculator === "land" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-foreground">
              Development Parameters
            </h3>
            <div className="mt-6 grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="gdv">Gross Development Value - GDV (RM)</Label>
                <Input
                  id="gdv"
                  type="number"
                  value={landInput.gdv}
                  onChange={(e) =>
                    setLandInput({ ...landInput, gdv: Number(e.target.value) })
                  }
                  className="text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  Total estimated sales value of completed project
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="landCost">Land Acquisition Cost (RM)</Label>
                <Input
                  id="landCost"
                  type="number"
                  value={landInput.landCost}
                  onChange={(e) =>
                    setLandInput({
                      ...landInput,
                      landCost: Number(e.target.value),
                    })
                  }
                  className="text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  Purchase price of the land
                </p>
              </div>
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-900">
                  Development Cost Formula
                </p>
                <p className="mt-1 text-xs text-blue-700">
                  Fixed at 45% of GDV (construction, professional fees, etc.)
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/40 dark:to-yellow-900/40">
            <h3 className="text-lg font-semibold text-foreground">
              Feasibility Analysis
            </h3>
            <div className="mt-6 space-y-4">
              <div className="rounded-lg bg-card p-4 shadow-sm border border-border">
                <p className="text-sm text-muted-foreground">
                  Developer Cost (45%)
                </p>
                <p className="mt-1 text-xl font-bold text-foreground">
                  RM{" "}
                  {land.developerCost.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
              <div className="rounded-lg bg-card p-4 shadow-sm border border-border">
                <p className="text-sm text-muted-foreground">Profit Margin</p>
                <p className="mt-1 text-3xl font-bold text-primary">
                  {(land.margin * 100).toFixed(2)}%
                </p>
              </div>
              <div className="rounded-lg bg-card p-4 shadow-sm border border-border">
                <p className="text-sm text-muted-foreground">
                  Feasibility Grade
                </p>
                <p className="mt-1 text-5xl font-bold text-foreground">
                  {land.grade}
                </p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">
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
            <h3 className="text-lg font-semibold text-foreground">
              Tenancy Agreement Details
            </h3>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="monthlyRent">Monthly Rental (RM)</Label>
                <Input
                  id="monthlyRent"
                  type="number"
                  value={tenancyInput.monthlyRent}
                  onChange={(e) =>
                    setTenancyInput({
                      ...tenancyInput,
                      monthlyRent: Number(e.target.value),
                    })
                  }
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="years">Tenancy Period (Years)</Label>
                <Input
                  id="years"
                  type="number"
                  value={tenancyInput.years}
                  onChange={(e) =>
                    setTenancyInput({
                      ...tenancyInput,
                      years: Number(e.target.value),
                    })
                  }
                  className="text-lg"
                />
              </div>
              <div className="sm:col-span-2 rounded-lg bg-teal-50 p-4">
                <p className="text-sm font-medium text-teal-900">
                  Calculation Method
                </p>
                <p className="mt-1 text-xs text-teal-700">
                  Annual rent is rounded to nearest RM 250, then divided into
                  blocks for rate calculation
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/40 dark:to-cyan-900/40">
            <h3 className="text-lg font-semibold text-foreground">
              Stamp Duty Breakdown
            </h3>
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-card p-3 shadow-sm border border-border">
                <span className="text-sm text-muted-foreground">
                  Annual Rent
                </span>
                <span className="font-semibold text-foreground">
                  RM {(tenancyInput.monthlyRent * 12).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-card p-3 shadow-sm border border-border">
                <span className="text-sm text-muted-foreground">
                  Rounded Amount
                </span>
                <span className="font-semibold text-foreground">
                  RM {tenancy.roundedAnnualRent.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-card p-3 shadow-sm border border-border">
                <span className="text-sm text-muted-foreground">Blocks</span>
                <span className="font-semibold text-foreground">
                  {tenancy.blocks}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-card p-3 shadow-sm border border-border">
                <span className="text-sm text-muted-foreground">
                  Rate Applied
                </span>
                <span className="font-semibold text-foreground">
                  {tenancy.rate}%
                </span>
              </div>
              <div className="mt-4 rounded-lg bg-primary p-4 text-white shadow-md">
                <p className="text-sm opacity-90">Total Stamp Duty</p>
                <p className="mt-1 text-3xl font-bold">
                  RM{" "}
                  {tenancy.stampDuty.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
