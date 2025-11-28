"use client";

import { useMemo, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CalculatorReceipt } from "@leadlah/core";

export default function CalculatorsClient() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Professional Calculators</h1>
        <p className="text-sm text-slate-600">
          Reverse DSR, legal fees, stamp duty, ROI, sellability, land feasibility, and tenancy stamp duty with branded-ready outputs.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Loan Eligibility (Reverse DSR)</h3>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Input
              type="number"
              value={loanInput.income}
              onChange={(e) => setLoanInput({ ...loanInput, income: Number(e.target.value) })}
              placeholder="Income"
            />
            <Input
              type="number"
              value={loanInput.commitments}
              onChange={(e) => setLoanInput({ ...loanInput, commitments: Number(e.target.value) })}
              placeholder="Commitments"
            />
            <Input
              type="number"
              value={loanInput.dsrPercent}
              onChange={(e) => setLoanInput({ ...loanInput, dsrPercent: Number(e.target.value) })}
              placeholder="DSR %"
            />
            <Input
              type="number"
              value={loanInput.interestRate}
              onChange={(e) => setLoanInput({ ...loanInput, interestRate: Number(e.target.value) })}
              placeholder="Interest Rate"
            />
            <Input
              type="number"
              value={loanInput.tenureYears}
              onChange={(e) => setLoanInput({ ...loanInput, tenureYears: Number(e.target.value) })}
              placeholder="Tenure (years)"
            />
          </div>
          <div className="mt-4 grid gap-2 text-sm">
            <div className="flex items-center justify-between font-semibold">
              <span>Max Installment</span>
              <span>RM {loan.maxInstallment.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span>Max Loan Amount</span>
              <span>RM {loan.maxLoanAmount.toFixed(0)}</span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span>Max Property Price</span>
              <span>RM {loan.maxPropertyPrice.toFixed(0)}</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Legal Fee & Stamp Duty (SPA / MOT)</h3>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Input
              type="number"
              value={spaInput.propertyPrice}
              onChange={(e) => setSpaInput({ ...spaInput, propertyPrice: Number(e.target.value) })}
              placeholder="Property Price"
            />
            <Select
              value={spaInput.isForeigner ? "yes" : "no"}
              onValueChange={(value) => setSpaInput({ ...spaInput, isForeigner: value === "yes" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Nationality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">Malaysian</SelectItem>
                <SelectItem value="yes">Foreigner</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={spaInput.requiresConsent ? "yes" : "no"}
              onValueChange={(value) => setSpaInput({ ...spaInput, requiresConsent: value === "yes" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Consent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No Consent</SelectItem>
                <SelectItem value="yes">Consent Required</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={spaInput.contractDate}
              onChange={(e) => setSpaInput({ ...spaInput, contractDate: e.target.value })}
            />
          </div>
          <div className="mt-4 grid gap-2 text-sm">
            <div className="flex items-center justify-between font-semibold">
              <span>Legal Fee</span>
              <span>RM {spa.legalFee.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span>Disbursement</span>
              <span>RM {spa.disbursement.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span>Stamp Duty</span>
              <span>RM {spa.stampDuty.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span>Total</span>
              <span>RM {spa.total.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Loan Agreement Calculator</h3>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Input type="number" value={loan.maxLoanAmount.toFixed(0)} readOnly placeholder="Loan Amount" />
          </div>
          <div className="mt-4 grid gap-2 text-sm">
            <div className="flex items-center justify-between font-semibold">
              <span>Legal Fee</span>
              <span>RM {loanAgreement.legalFee.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span>Stamp Duty</span>
              <span>RM {loanAgreement.stampDuty.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span>Total</span>
              <span>RM {loanAgreement.total.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">ROI Calculator</h3>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Input
              type="number"
              value={roiInput.price}
              onChange={(e) => setRoiInput({ ...roiInput, price: Number(e.target.value) })}
              placeholder="Price"
            />
            <Input
              type="number"
              value={roiInput.monthlyRent}
              onChange={(e) => setRoiInput({ ...roiInput, monthlyRent: Number(e.target.value) })}
              placeholder="Monthly Rent"
            />
            <Input
              type="number"
              value={roiInput.annualCosts}
              onChange={(e) => setRoiInput({ ...roiInput, annualCosts: Number(e.target.value) })}
              placeholder="Annual Costs"
            />
          </div>
          <div className="mt-4 grid gap-2 text-sm">
            <div className="flex items-center justify-between font-semibold">
              <span>Gross Yield</span>
              <span>{(roi.grossYield * 100).toFixed(2)}%</span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span>Net Yield</span>
              <span>{(roi.netYield * 100).toFixed(2)}%</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Property Sellability (MFS)</h3>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Input
              type="number"
              value={sellInput.belowMarketPct}
              onChange={(e) => setSellInput({ ...sellInput, belowMarketPct: Number(e.target.value) })}
              placeholder="% Below Market"
            />
            <Input
              type="number"
              value={sellInput.competitionScore}
              onChange={(e) => setSellInput({ ...sellInput, competitionScore: Number(e.target.value) })}
              placeholder="Competition (0-10)"
            />
            <Input
              type="number"
              value={sellInput.liquidityScore}
              onChange={(e) => setSellInput({ ...sellInput, liquidityScore: Number(e.target.value) })}
              placeholder="Liquidity (0-10)"
            />
          </div>
          <div className="mt-4 grid gap-2 text-sm">
            <div className="flex items-center justify-between font-semibold">
              <span>Score</span>
              <span>{sell.score.toFixed(0)} / 100</span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span>Grade</span>
              <span>{sell.grade}</span>
            </div>
            <p className="text-sm text-slate-600">{sell.commentary}</p>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Land Feasibility (Developer Pitching)</h3>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Input
              type="number"
              value={landInput.gdv}
              onChange={(e) => setLandInput({ ...landInput, gdv: Number(e.target.value) })}
              placeholder="GDV"
            />
            <Input
              type="number"
              value={landInput.landCost}
              onChange={(e) => setLandInput({ ...landInput, landCost: Number(e.target.value) })}
              placeholder="Land Cost"
            />
          </div>
          <div className="mt-4 grid gap-2 text-sm">
            <div className="flex items-center justify-between font-semibold">
              <span>Developer Cost (45% of GDV)</span>
              <span>RM {land.developerCost.toFixed(0)}</span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span>Margin</span>
              <span>{(land.margin * 100).toFixed(2)}%</span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span>Grade</span>
              <span>{land.grade}</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Tenancy Stamp Duty</h3>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Input
              type="number"
              value={tenancyInput.monthlyRent}
              onChange={(e) => setTenancyInput({ ...tenancyInput, monthlyRent: Number(e.target.value) })}
              placeholder="Monthly Rent"
            />
            <Input
              type="number"
              value={tenancyInput.years}
              onChange={(e) => setTenancyInput({ ...tenancyInput, years: Number(e.target.value) })}
              placeholder="Tenure (years)"
            />
          </div>
          <div className="mt-4 grid gap-2 text-sm">
            <div className="flex items-center justify-between font-semibold">
              <span>Rounded Annual Rent</span>
              <span>RM {tenancy.roundedAnnualRent.toFixed(0)}</span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span>Blocks</span>
              <span>{tenancy.blocks.toFixed(0)}</span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span>Rate</span>
              <span>{tenancy.rate}%</span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span>Stamp Duty</span>
              <span>RM {tenancy.stampDuty.toFixed(2)}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Branded PDF Receipt</h3>
            <p className="text-sm text-slate-600">
              Capture agent name, REN number, agency logo, and the calculation outputs for client-facing PDFs.
            </p>
          </div>
          <Button
            onClick={() =>
              setReceipt(
                buildReceipt({
                  agentName: "Alicia Tan",
                  renNumber: "REN 12345",
                  agencyLogoUrl: "https://dummyimage.com/60x60/1d67ff/ffffff&text=LL",
                  calculationType: "Loan Eligibility",
                  inputs: loanInput,
                  outputs: {
                    maxInstallment: loan.maxInstallment.toFixed(2),
                    maxLoanAmount: loan.maxLoanAmount.toFixed(0),
                    maxPropertyPrice: loan.maxPropertyPrice.toFixed(0)
                  },
                  issuedAt: new Date()
                })
              )
            }
          >
            Generate PDF Payload
          </Button>
        </div>
        {receipt && (
          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">
              {receipt.calculationType} • {receipt.agentName} ({receipt.renNumber})
            </p>
            <p>Issued: {receipt.issuedAt.toLocaleString()}</p>
            <p>Outputs: Max Loan RM {receipt.outputs.maxLoanAmount}</p>
            <p className="text-xs text-slate-500">Pass this payload to Puppeteer / React-PDF to render the branded receipt.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
