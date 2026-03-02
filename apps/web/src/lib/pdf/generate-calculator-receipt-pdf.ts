import PDFDocument from "pdfkit";
import type { CalculatorReceipt } from "@leadlah/core";

type BrandAssets = {
  leadlahMarkBuffer?: Buffer;
};

type ExternalAssets = {
  agencyLogoUrl?: string;
};

type GenerateCalculatorReceiptPdfOptions = BrandAssets & ExternalAssets;

const currencyFormatter = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
  minimumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-MY", {
  maximumFractionDigits: 2,
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-MY", {
  dateStyle: "medium",
  timeStyle: "short",
});

const friendlyDateFormatter = new Intl.DateTimeFormat("en-MY", {
  dateStyle: "full",
});

const currencyKeyPattern =
  /(amount|fee|price|cost|rent|loan|stamp|installment|gdv|total|duty|payment)/i;
const percentKeyPattern = /(percent|percentage|yield|margin|rate)/i;

const allowedRemoteLogoProtocols = /^https?:\/\//i;
const maxRemoteLogoBytes = 512 * 1024; // 512 KB
const remoteLogoTimeoutMs = 5_000;

const palette = {
  primaryStart: "#f43f5e",
  primaryMid: "#e11d48",
  primaryEnd: "#be123c",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  surfaceWarm: "#fff1f2",
  textPrimary: "#0f172a",
  textSecondary: "#475569",
  textMuted: "#94a3b8",
  borderSubtle: "#e2e8f0",
};

const layout = {
  pagePaddingX: 40,
  pagePaddingTop: 34,
  pagePaddingBottom: 72,
  sectionGap: 16,
  cardRadius: 12,
  accentBarHeight: 5,
  sideAccentWidth: 3,
  footerHeight: 56,
};

export async function generateCalculatorReceiptPdfBuffer(
  receipt: CalculatorReceipt,
  options: GenerateCalculatorReceiptPdfOptions = {},
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    bufferPages: true,
    info: {
      Title: `${receipt.calculationType} • LeadLah Receipt`,
      Author: "LeadLah",
      Subject: "Calculator receipt",
      Keywords: "leadlah, receipt, calculator, pdf",
    },
  });

  const pdfBufferPromise = streamToBuffer(doc);

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const contentLeft = layout.pagePaddingX;
  const contentTop = layout.pagePaddingTop;
  const contentRight = pageWidth - layout.pagePaddingX;
  const contentWidth = contentRight - contentLeft;
  const contentBottom = pageHeight - layout.pagePaddingBottom;

  const reference = buildReference(receipt);
  const agencyLogoBuffer = await loadAgencyLogoBuffer(options.agencyLogoUrl);

  drawPageChrome(doc);

  let cursorTop = contentTop;

  cursorTop = renderHeader(doc, receipt, {
    contentLeft,
    cursorTop,
    contentWidth,
    reference,
    leadlahMarkBuffer: options.leadlahMarkBuffer,
  });

  cursorTop += 14;
  cursorTop = renderDivider(doc, { contentLeft, cursorTop, contentWidth });
  cursorTop += 14;

  cursorTop = renderParties(doc, receipt, {
    contentLeft,
    cursorTop,
    contentWidth,
    agencyLogoBuffer,
  });

  cursorTop += layout.sectionGap;

  const highlights = buildHighlights(receipt.outputs);
  if (highlights.length > 0) {
    cursorTop = renderHighlights(doc, {
      contentLeft,
      cursorTop,
      contentWidth,
      highlights,
      contentBottom,
      receipt,
      reference,
    });
    cursorTop += layout.sectionGap;
  }

  cursorTop = renderKeyValueSection(doc, {
    title: "Inputs",
    record: receipt.inputs,
    emptyCopy: "No calculator inputs were provided.",
    contentLeft,
    cursorTop,
    contentWidth,
    contentBottom,
    receipt,
    reference,
  });

  cursorTop += layout.sectionGap;

  renderKeyValueSection(doc, {
    title: "Outputs",
    record: receipt.outputs,
    emptyCopy: "No calculation results were provided.",
    contentLeft,
    cursorTop,
    contentWidth,
    contentBottom,
    receipt,
    reference,
  });

  addFooters(doc, { reference });

  doc.end();

  return pdfBufferPromise;
}

function streamToBuffer(doc: PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

function drawPageChrome(doc: PDFDocument) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  const backgroundGradient = doc.linearGradient(0, 0, 0, pageHeight);
  backgroundGradient.stop(0, "#ffffff").stop(1, palette.surfaceWarm);
  doc.rect(0, 0, pageWidth, pageHeight).fill(backgroundGradient);

  const accentGradient = doc.linearGradient(0, 0, pageWidth, layout.accentBarHeight);
  accentGradient
    .stop(0, palette.primaryStart)
    .stop(0.5, palette.primaryMid)
    .stop(1, palette.primaryEnd);
  doc.rect(0, 0, pageWidth, layout.accentBarHeight).fill(accentGradient);

  const sideGradient = doc.linearGradient(0, 0, 0, pageHeight);
  sideGradient
    .stop(0, palette.primaryStart)
    .stop(0.6, palette.primaryMid)
    .stop(1, palette.primaryEnd);
  doc.rect(0, 0, layout.sideAccentWidth, pageHeight).fill(sideGradient);

  doc.save();
  doc.fillOpacity(0.04);
  doc.fillColor(palette.primaryStart);
  doc.circle(pageWidth - 20, 20, 180).fill();
  doc.restore();
}

function addFooters(doc: PDFDocument, { reference }: { reference: string }) {
  const range = doc.bufferedPageRange();
  const totalPages = range.count;

  for (let index = 0; index < totalPages; index++) {
    doc.switchToPage(range.start + index);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const contentLeft = layout.pagePaddingX;
    const contentRight = pageWidth - layout.pagePaddingX;
    const footerTop = pageHeight - layout.footerHeight;

    doc.save();
    doc.strokeOpacity(1);
    doc.lineWidth(1);
    doc.strokeColor(palette.borderSubtle);
    doc
      .moveTo(contentLeft, footerTop)
      .lineTo(contentRight, footerTop)
      .stroke();

    const footerTextTop = footerTop + 14;

    doc.font("Helvetica-Bold").fontSize(8).fillColor(palette.textSecondary);
    doc.text("LeadLah", contentLeft, footerTextTop, { continued: true });
    doc.font("Helvetica").fontSize(8).fillColor(palette.textMuted);
    doc.text(" · support@leadlah.com", { continued: false });

    const pageLabel = `Page ${index + 1} of ${totalPages}`;
    doc.font("Helvetica").fontSize(8).fillColor(palette.textMuted);
    doc.text(pageLabel, contentLeft, footerTextTop + 12, {
      width: contentRight - contentLeft,
      align: "left",
    });

    const rightLines = [`Ref: ${reference}`, `© ${new Date().getFullYear()} LeadLah`];
    doc.font("Helvetica").fontSize(8).fillColor(palette.textMuted);
    doc.text(rightLines.join("\n"), contentLeft, footerTextTop, {
      width: contentRight - contentLeft,
      align: "right",
    });

    doc.restore();
  }
}

function renderHeader(
  doc: PDFDocument,
  receipt: CalculatorReceipt,
  params: {
    contentLeft: number;
    cursorTop: number;
    contentWidth: number;
    reference: string;
    leadlahMarkBuffer?: Buffer;
  },
): number {
  const { contentLeft, cursorTop, contentWidth, reference, leadlahMarkBuffer } =
    params;

  const issuedAtDisplay = dateTimeFormatter.format(receipt.issuedAt);
  const issuedAtFriendly = friendlyDateFormatter.format(receipt.issuedAt);

  const gap = 18;
  const leftColumnWidth = Math.min(240, Math.floor(contentWidth * 0.48));
  const rightColumnWidth = contentWidth - leftColumnWidth - gap;
  const leftColumnLeft = contentLeft;
  const rightColumnLeft = contentLeft + leftColumnWidth + gap;

  const markSize = 36;
  const markRadius = 10;

  doc.save();
  const markGradient = doc.linearGradient(
    leftColumnLeft,
    cursorTop,
    leftColumnLeft + markSize,
    cursorTop + markSize,
  );
  markGradient
    .stop(0, palette.primaryStart)
    .stop(0.5, palette.primaryMid)
    .stop(1, palette.primaryEnd);

  drawSoftShadow(doc, leftColumnLeft, cursorTop, markSize, markSize, markRadius);
  doc.roundedRect(leftColumnLeft, cursorTop, markSize, markSize, markRadius).fill(markGradient);

  if (leadlahMarkBuffer) {
    const iconPadding = 7;
    const iconSize = markSize - iconPadding * 2;
    doc.save();
    doc.roundedRect(leftColumnLeft, cursorTop, markSize, markSize, markRadius).clip();
    doc.image(
      leadlahMarkBuffer,
      leftColumnLeft + iconPadding,
      cursorTop + iconPadding,
      {
        fit: [iconSize, iconSize],
        align: "center",
        valign: "center",
      },
    );
    doc.restore();
  } else {
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#ffffff");
    doc.text("LL", leftColumnLeft, cursorTop + 12, {
      width: markSize,
      align: "center",
    });
  }

  const brandTextLeft = leftColumnLeft + markSize + 10;
  doc.font("Helvetica-Bold").fontSize(14).fillColor(palette.textPrimary);
  doc.text("LeadLah", brandTextLeft, cursorTop + 2, {
    width: leftColumnWidth - (markSize + 10),
  });
  doc.font("Helvetica").fontSize(8).fillColor(palette.textSecondary);
  doc.text("Property Agent OS for Malaysia", brandTextLeft, cursorTop + 20, {
    width: leftColumnWidth - (markSize + 10),
  });
  doc.restore();

  const badgeText = "OFFICIAL RECEIPT";
  doc.font("Helvetica-Bold").fontSize(7);
  const badgePaddingX = 10;
  const badgePaddingY = 4;
  const badgeTextWidth = doc.widthOfString(badgeText);
  const badgeWidth = badgeTextWidth + badgePaddingX * 2;
  const badgeHeight = 16;
  const badgeLeft = rightColumnLeft + rightColumnWidth - badgeWidth;
  const badgeTop = cursorTop;

  const badgeGradient = doc.linearGradient(badgeLeft, badgeTop, badgeLeft + badgeWidth, badgeTop + badgeHeight);
  badgeGradient
    .stop(0, palette.primaryStart)
    .stop(0.5, palette.primaryMid)
    .stop(1, palette.primaryEnd);

  drawSoftShadow(doc, badgeLeft, badgeTop, badgeWidth, badgeHeight, 10);
  doc.roundedRect(badgeLeft, badgeTop, badgeWidth, badgeHeight, 10).fill(badgeGradient);
  doc.fillColor("#ffffff");
  doc.text(badgeText, badgeLeft, badgeTop + badgePaddingY, {
    width: badgeWidth,
    align: "center",
  });

  const titleTop = badgeTop + badgeHeight + 8;
  doc.font("Helvetica-Bold").fontSize(18).fillColor(palette.textPrimary);
  doc.text("Calculator Receipt", rightColumnLeft, titleTop, {
    width: rightColumnWidth,
    align: "right",
  });

  const subtitleTop = titleTop + 22;
  doc.font("Helvetica-Bold").fontSize(10).fillColor(palette.textSecondary);
  doc.text(receipt.calculationType, rightColumnLeft, subtitleTop, {
    width: rightColumnWidth,
    align: "right",
  });

  const metaCardTop = subtitleTop + 16;
  const metaCardHeight = 54;
  const metaCardWidth = rightColumnWidth;
  const metaCardLeft = rightColumnLeft;

  drawCard(doc, metaCardLeft, metaCardTop, metaCardWidth, metaCardHeight, {
    fill: palette.surfaceWarm,
    border: palette.primaryStart,
    borderOpacity: 0.12,
    radius: 10,
    shadow: true,
  });

  const metaKeyWidth = 52;
  const metaValueWidth = metaCardWidth - 18 - metaKeyWidth;
  const metaRowLeft = metaCardLeft + 10;
  const metaRowRight = metaCardLeft + metaCardWidth - 10;

  doc.font("Helvetica").fontSize(8).fillColor(palette.textMuted);
  doc.text("Reference", metaRowLeft, metaCardTop + 10, {
    width: metaKeyWidth,
    align: "left",
  });
  doc.font("Helvetica-Bold").fontSize(8).fillColor(palette.textPrimary);
  doc.text(reference, metaRowRight - metaValueWidth, metaCardTop + 10, {
    width: metaValueWidth,
    align: "right",
  });

  doc.font("Helvetica").fontSize(8).fillColor(palette.textMuted);
  doc.text("Issued", metaRowLeft, metaCardTop + 24, {
    width: metaKeyWidth,
    align: "left",
  });
  doc.font("Helvetica-Bold").fontSize(8).fillColor(palette.textPrimary);
  doc.text(issuedAtDisplay, metaRowRight - metaValueWidth, metaCardTop + 24, {
    width: metaValueWidth,
    align: "right",
  });

  doc.font("Helvetica").fontSize(8).fillColor(palette.textMuted);
  doc.text("Date", metaRowLeft, metaCardTop + 38, {
    width: metaKeyWidth,
    align: "left",
  });
  doc.font("Helvetica-Bold").fontSize(8).fillColor(palette.textPrimary);
  doc.text(issuedAtFriendly, metaRowRight - metaValueWidth, metaCardTop + 38, {
    width: metaValueWidth,
    align: "right",
  });

  const headerBottom = Math.max(cursorTop + markSize, metaCardTop + metaCardHeight);
  return headerBottom;
}

function renderDivider(
  doc: PDFDocument,
  params: { contentLeft: number; cursorTop: number; contentWidth: number },
): number {
  const { contentLeft, cursorTop, contentWidth } = params;
  const lineY = cursorTop + 4;

  doc.save();
  doc.strokeOpacity(1);
  doc.strokeColor(palette.borderSubtle);
  doc.lineWidth(1);
  doc.moveTo(contentLeft, lineY).lineTo(contentLeft + contentWidth, lineY).stroke();

  const dotGradient = doc.linearGradient(contentLeft, lineY - 3, contentLeft + contentWidth, lineY + 3);
  dotGradient.stop(0, palette.primaryStart).stop(1, palette.primaryEnd);
  doc.circle(contentLeft + contentWidth / 2, lineY, 3).fill(dotGradient);
  doc.restore();

  return cursorTop + 8;
}

function renderParties(
  doc: PDFDocument,
  receipt: CalculatorReceipt,
  params: {
    contentLeft: number;
    cursorTop: number;
    contentWidth: number;
    agencyLogoBuffer?: Buffer;
  },
): number {
  const { contentLeft, cursorTop, contentWidth, agencyLogoBuffer } = params;

  const gap = 10;
  const cardWidth = (contentWidth - gap) / 2;
  const cardHeight = 88;

  const customerName = receipt.customerName?.trim() || "Valued Client";
  const initials = buildInitials(receipt.agentName);

  renderPartyCard(doc, {
    left: contentLeft,
    top: cursorTop,
    width: cardWidth,
    height: cardHeight,
    title: "Prepared For",
    value: customerName,
    sub: "Client / Purchaser",
  });

  renderPartyCard(doc, {
    left: contentLeft + cardWidth + gap,
    top: cursorTop,
    width: cardWidth,
    height: cardHeight,
    title: "Prepared By",
    value: receipt.agentName,
    sub: receipt.renNumber,
    agentRow: {
      initials,
      name: receipt.agentName,
      logo: agencyLogoBuffer,
    },
  });

  return cursorTop + cardHeight;
}

function renderPartyCard(
  doc: PDFDocument,
  params: {
    left: number;
    top: number;
    width: number;
    height: number;
    title: string;
    value: string;
    sub: string;
    agentRow?: { initials: string; name: string; logo?: Buffer };
  },
) {
  const { left, top, width, height, title, value, sub, agentRow } = params;

  drawCard(doc, left, top, width, height, {
    fill: palette.surface,
    border: palette.borderSubtle,
    borderOpacity: 1,
    radius: 14,
    shadow: true,
  });

  const pillText = title.toUpperCase();
  doc.font("Helvetica-Bold").fontSize(8);
  const pillPaddingX = 8;
  const pillPaddingY = 3;
  const pillTextWidth = doc.widthOfString(pillText);
  const pillWidth = pillTextWidth + pillPaddingX * 2;
  const pillHeight = 14;

  doc.save();
  doc.fillOpacity(1);
  doc.fillColor(palette.surfaceWarm);
  doc.roundedRect(left + 12, top + 12, pillWidth, pillHeight, 4).fill();
  doc.fillColor(palette.textMuted);
  doc.text(pillText, left + 12, top + 12 + pillPaddingY, {
    width: pillWidth,
    align: "center",
  });
  doc.restore();

  doc.font("Helvetica-Bold").fontSize(12).fillColor(palette.textPrimary);
  doc.text(value, left + 12, top + 34, { width: width - 24 });

  doc.font("Helvetica").fontSize(9).fillColor(palette.textSecondary);
  doc.text(sub, left + 12, top + 50, { width: width - 24 });

  if (!agentRow) {
    return;
  }

  const rowTop = top + 62;
  const separatorY = rowTop - 2;

  doc.save();
  doc.strokeOpacity(1);
  doc.strokeColor(palette.borderSubtle);
  doc.lineWidth(1);
  doc.dash(2, { space: 2 });
  doc.moveTo(left + 12, separatorY).lineTo(left + width - 12, separatorY).stroke();
  doc.undash();
  doc.restore();

  const avatarSize = 18;
  const avatarLeft = left + 12;
  const avatarTop = rowTop + 4;

  if (agentRow.logo) {
    doc.save();
    doc.roundedRect(avatarLeft, avatarTop, avatarSize, avatarSize, 5).clip();
    doc.image(agentRow.logo, avatarLeft, avatarTop, {
      cover: [avatarSize, avatarSize],
      align: "center",
      valign: "center",
    });
    doc.restore();

    doc.save();
    doc.strokeOpacity(1);
    doc.strokeColor(palette.primaryStart);
    doc.lineWidth(0.8);
    doc.roundedRect(avatarLeft, avatarTop, avatarSize, avatarSize, 5).stroke();
    doc.restore();
  } else {
    const avatarGradient = doc.linearGradient(avatarLeft, avatarTop, avatarLeft + avatarSize, avatarTop + avatarSize);
    avatarGradient
      .stop(0, palette.primaryStart)
      .stop(0.6, palette.primaryMid)
      .stop(1, palette.primaryEnd);
    doc.roundedRect(avatarLeft, avatarTop, avatarSize, avatarSize, 5).fill(avatarGradient);

    doc.font("Helvetica-Bold").fontSize(8).fillColor("#ffffff");
    doc.text(agentRow.initials, avatarLeft, avatarTop + 5, {
      width: avatarSize,
      align: "center",
    });
  }

  doc.font("Helvetica-Bold").fontSize(9).fillColor(palette.textPrimary);
  doc.text(agentRow.name, avatarLeft + avatarSize + 8, avatarTop + 4, {
    width: width - 24 - avatarSize - 8,
  });
}

function renderSectionTitle(
  doc: PDFDocument,
  params: { title: string; left: number; top: number; width: number },
): number {
  const { title, left, top, width } = params;

  const barWidth = 3;
  const barHeight = 14;
  const barGradient = doc.linearGradient(left, top, left, top + barHeight);
  barGradient
    .stop(0, palette.primaryStart)
    .stop(0.6, palette.primaryMid)
    .stop(1, palette.primaryEnd);

  doc.roundedRect(left, top + 1, barWidth, barHeight, 1.5).fill(barGradient);

  doc.font("Helvetica-Bold").fontSize(9).fillColor(palette.textPrimary);
  doc.text(title.toUpperCase(), left + barWidth + 8, top, { width: width - (barWidth + 8) });

  return top + 16;
}

function renderHighlights(
  doc: PDFDocument,
  params: {
    contentLeft: number;
    cursorTop: number;
    contentWidth: number;
    highlights: Array<{ label: string; value: string }>;
    contentBottom: number;
    receipt: CalculatorReceipt;
    reference: string;
  },
): number {
  const {
    contentLeft,
    cursorTop,
    contentWidth,
    highlights,
    contentBottom,
    receipt,
    reference,
  } = params;

  const gap = 10;
  const columns = Math.min(3, highlights.length);
  const cardWidth = (contentWidth - gap * (columns - 1)) / columns;
  const cardHeight = 54;

  const requiredHeight = 16 + cardHeight;
  let cursor = ensureVerticalSpace(doc, {
    cursorTop,
    requiredHeight,
    contentBottom,
    receipt,
    reference,
  });

  cursor = renderSectionTitle(doc, {
    title: "Summary",
    left: contentLeft,
    top: cursor,
    width: contentWidth,
  });

  highlights.slice(0, 3).forEach((item, index) => {
    const left = contentLeft + (cardWidth + gap) * index;
    const top = cursor;

    if (index === 0) {
      const gradient = doc.linearGradient(left, top, left + cardWidth, top + cardHeight);
      gradient
        .stop(0, palette.primaryStart)
        .stop(0.5, palette.primaryMid)
        .stop(1, palette.primaryEnd);
      drawSoftShadow(doc, left, top, cardWidth, cardHeight, 12);
      doc.roundedRect(left, top, cardWidth, cardHeight, 12).fill(gradient);

      doc.font("Helvetica-Bold").fontSize(7).fillColor("#ffffff");
      doc.text(item.label.toUpperCase(), left + 12, top + 12, {
        width: cardWidth - 24,
      });

      doc.font("Helvetica-Bold").fontSize(14).fillColor("#ffffff");
      doc.text(item.value, left + 12, top + 26, {
        width: cardWidth - 24,
      });
      return;
    }

    drawCard(doc, left, top, cardWidth, cardHeight, {
      fill: palette.surface,
      border: palette.primaryStart,
      borderOpacity: 0.12,
      radius: 12,
      shadow: true,
    });

    doc.font("Helvetica-Bold").fontSize(7).fillColor(palette.textMuted);
    doc.text(item.label.toUpperCase(), left + 12, top + 12, {
      width: cardWidth - 24,
    });

    doc.font("Helvetica-Bold").fontSize(14).fillColor(palette.textPrimary);
    doc.text(item.value, left + 12, top + 26, {
      width: cardWidth - 24,
    });
  });

  return cursor + cardHeight;
}

function renderKeyValueSection(
  doc: PDFDocument,
  params: {
    title: string;
    record: Record<string, number | string | boolean>;
    emptyCopy: string;
    contentLeft: number;
    cursorTop: number;
    contentWidth: number;
    contentBottom: number;
    receipt: CalculatorReceipt;
    reference: string;
  },
): number {
  const {
    title,
    record,
    emptyCopy,
    contentLeft,
    cursorTop,
    contentWidth,
    contentBottom,
    receipt,
    reference,
  } = params;

  const rows = Object.entries(record ?? {});
  const headerHeight = 24;
  const rowPaddingX = 14;
  const rowPaddingY = 7;

  const labelColumnWidth = Math.floor(contentWidth * 0.64);
  const valueColumnWidth = contentWidth - labelColumnWidth;

  const requiredHeight =
    rows.length === 0
      ? 16 + 46
      : (() => {
        const [key, rawValue] = rows[0];
        const label = formatLabel(key);
        const formattedValue = formatValue(key, rawValue);

        doc.font("Helvetica-Bold").fontSize(9);
        const labelTextHeight = doc.heightOfString(label, {
          width: labelColumnWidth - rowPaddingX * 2,
        });

        doc.font("Helvetica-Bold").fontSize(9);
        const valueTextHeight = doc.heightOfString(formattedValue, {
          width: valueColumnWidth - rowPaddingX * 2,
          align: "right",
        });

        const firstRowHeight =
          Math.max(labelTextHeight, valueTextHeight) + rowPaddingY * 2;

        return 16 + headerHeight + firstRowHeight + 8;
      })();

  let cursor = ensureVerticalSpace(doc, {
    cursorTop,
    requiredHeight,
    contentBottom,
    receipt,
    reference,
  });

  cursor = renderSectionTitle(doc, {
    title,
    left: contentLeft,
    top: cursor,
    width: contentWidth,
  });

  if (rows.length === 0) {
    drawCard(doc, contentLeft, cursor, contentWidth, 46, {
      fill: palette.surface,
      border: palette.borderSubtle,
      borderOpacity: 1,
      radius: layout.cardRadius,
      shadow: true,
    });
    doc.font("Helvetica").fontSize(9).fillColor(palette.textMuted);
    doc.text(emptyCopy, contentLeft, cursor + 16, {
      width: contentWidth,
      align: "center",
    });

    return cursor + 46;
  }

  // ── Pre-compute every row height so we can size the card ──────────
  const rowHeights: number[] = [];
  for (const [key, rawValue] of rows) {
    const label = formatLabel(key);
    const formattedValue = formatValue(key, rawValue);

    doc.font("Helvetica-Bold").fontSize(9);
    const lh = doc.heightOfString(label, {
      width: labelColumnWidth - rowPaddingX * 2,
    });

    doc.font("Helvetica-Bold").fontSize(9);
    const vh = doc.heightOfString(formattedValue, {
      width: valueColumnWidth - rowPaddingX * 2,
      align: "right",
    });

    rowHeights.push(Math.max(lh, vh) + rowPaddingY * 2);
  }

  // ── Helper: draw the full table card for a batch of rows ─────────
  const renderTableCard = (
    startIndex: number,
    endIndex: number,
    cardTop: number,
  ): number => {
    const batchHeights = rowHeights.slice(startIndex, endIndex);
    const bodyHeight = batchHeights.reduce((s, h) => s + h, 0);
    const totalHeight = headerHeight + bodyHeight;
    const radius = layout.cardRadius;

    // 1. Soft shadow behind the card
    drawSoftShadow(doc, contentLeft, cardTop, contentWidth, totalHeight, radius);

    // 2. White base fill for the entire card (prevents page bg bleed)
    doc.save();
    doc.fillOpacity(1);
    doc.fillColor(palette.surface);
    doc.roundedRect(contentLeft, cardTop, contentWidth, totalHeight, radius).fill();
    doc.restore();

    // 3. Header gradient fill — clip to the card so it respects top corners
    doc.save();
    doc.roundedRect(contentLeft, cardTop, contentWidth, totalHeight, radius).clip();
    const hdrGrad = doc.linearGradient(
      contentLeft, cardTop,
      contentLeft + contentWidth, cardTop + headerHeight,
    );
    hdrGrad.stop(0, "#f8fafc").stop(1, "#f1f5f9");
    doc.rect(contentLeft, cardTop, contentWidth, headerHeight).fill(hdrGrad);
    doc.restore();

    // 4. Alternating row fills — clip to the card so last row respects bottom corners
    let rowY = cardTop + headerHeight;
    doc.save();
    doc.roundedRect(contentLeft, cardTop, contentWidth, totalHeight, radius).clip();
    for (let i = startIndex; i < endIndex; i++) {
      const rh = rowHeights[i];
      const isAlt = (i - startIndex) % 2 === 1;
      if (isAlt) {
        doc.fillOpacity(1);
        doc.fillColor(palette.surfaceMuted);
        doc.rect(contentLeft, rowY, contentWidth, rh).fill();
      }
      rowY += rh;
    }
    doc.restore();

    // 5. Outer border — single rounded rect
    doc.save();
    doc.strokeOpacity(1);
    doc.strokeColor(palette.borderSubtle);
    doc.lineWidth(1);
    doc.roundedRect(contentLeft, cardTop, contentWidth, totalHeight, radius).stroke();
    doc.restore();

    // 6. Internal horizontal separators (header separator + between rows)
    doc.save();
    doc.strokeOpacity(1);
    doc.strokeColor(palette.borderSubtle);
    doc.lineWidth(0.5);
    let sepY = cardTop + headerHeight;
    // separator below header
    doc.moveTo(contentLeft, sepY).lineTo(contentLeft + contentWidth, sepY).stroke();
    for (let i = startIndex; i < endIndex - 1; i++) {
      sepY += rowHeights[i];
      doc.moveTo(contentLeft, sepY).lineTo(contentLeft + contentWidth, sepY).stroke();
    }
    doc.restore();

    // 7. Header text
    doc.font("Helvetica-Bold").fontSize(8).fillColor(palette.textPrimary);
    doc.text("ITEM", contentLeft + rowPaddingX, cardTop + 8, {
      width: labelColumnWidth - rowPaddingX * 2,
    });
    doc.text("VALUE", contentLeft + labelColumnWidth, cardTop + 8, {
      width: valueColumnWidth - rowPaddingX,
      align: "right",
    });

    // 8. Row text
    let textY = cardTop + headerHeight;
    for (let i = startIndex; i < endIndex; i++) {
      const [key, rawValue] = rows[i];
      const label = formatLabel(key);
      const formattedValue = formatValue(key, rawValue);

      doc.font("Helvetica-Bold").fontSize(9).fillColor(palette.textSecondary);
      doc.text(label, contentLeft + rowPaddingX, textY + rowPaddingY, {
        width: labelColumnWidth - rowPaddingX * 2,
      });

      doc.font("Helvetica-Bold").fontSize(9).fillColor(palette.textPrimary);
      doc.text(formattedValue, contentLeft + labelColumnWidth + rowPaddingX / 2, textY + rowPaddingY, {
        width: valueColumnWidth - rowPaddingX,
        align: "right",
      });

      textY += rowHeights[i];
    }

    return cardTop + totalHeight;
  };

  // ── Batch rows by page, then render each batch as one card ───────
  let batchStart = 0;
  while (batchStart < rows.length) {
    // Determine how many rows fit on the current page
    let available = contentBottom - cursor - headerHeight;
    let batchEnd = batchStart;
    while (batchEnd < rows.length && available >= rowHeights[batchEnd]) {
      available -= rowHeights[batchEnd];
      batchEnd++;
    }

    // If we can't even fit one row, add a new page
    if (batchEnd === batchStart) {
      cursor = ensureVerticalSpace(doc, {
        cursorTop: cursor,
        requiredHeight: headerHeight + rowHeights[batchStart] + 4,
        contentBottom,
        receipt,
        reference,
      });
      batchEnd = batchStart + 1;
    }

    cursor = renderTableCard(batchStart, batchEnd, cursor);
    batchStart = batchEnd;

    // If there are remaining rows, move to the next page
    if (batchStart < rows.length) {
      cursor = ensureVerticalSpace(doc, {
        cursorTop: cursor + 4,
        requiredHeight: headerHeight + rowHeights[batchStart] + 4,
        contentBottom,
        receipt,
        reference,
      });
    }
  }

  return cursor;
}

function ensureVerticalSpace(
  doc: PDFDocument,
  params: {
    cursorTop: number;
    requiredHeight: number;
    contentBottom: number;
    receipt: CalculatorReceipt;
    reference: string;
  },
): number {
  const { cursorTop, requiredHeight, contentBottom, receipt, reference } = params;
  if (cursorTop + requiredHeight <= contentBottom) {
    return cursorTop;
  }

  doc.addPage({
    size: "A4",
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  });
  drawPageChrome(doc);

  const contentLeft = layout.pagePaddingX;
  const contentWidth = doc.page.width - layout.pagePaddingX * 2;
  const newTop = layout.pagePaddingTop;

  const barHeight = 18;
  const barGradient = doc.linearGradient(contentLeft, newTop, contentLeft + contentWidth, newTop + barHeight);
  barGradient.stop(0, "#ffffff").stop(1, "#fff1f2");
  drawCard(doc, contentLeft, newTop, contentWidth, barHeight, {
    fill: barGradient,
    border: palette.borderSubtle,
    borderOpacity: 1,
    radius: 10,
    shadow: true,
  });

  doc.font("Helvetica-Bold").fontSize(9).fillColor(palette.textPrimary);
  doc.text(`${receipt.calculationType} Receipt`, contentLeft + 10, newTop + 5, {
    width: contentWidth - 20,
    align: "left",
  });
  doc.font("Helvetica").fontSize(8).fillColor(palette.textMuted);
  doc.text(`Ref: ${reference}`, contentLeft + 10, newTop + 5, {
    width: contentWidth - 20,
    align: "right",
  });

  return newTop + barHeight + 12;
}

function drawSoftShadow(
  doc: PDFDocument,
  left: number,
  top: number,
  width: number,
  height: number,
  radius: number,
) {
  doc.save();
  doc.fillOpacity(0.06);
  doc.fillColor(palette.textPrimary);
  doc.roundedRect(left, top + 2, width, height, radius).fill();
  doc.restore();
}

function drawCard(
  doc: PDFDocument,
  left: number,
  top: number,
  width: number,
  height: number,
  styles: {
    fill: unknown;
    border: string;
    borderOpacity: number;
    radius: number;
    shadow: boolean;
  },
) {
  if (styles.shadow) {
    drawSoftShadow(doc, left, top, width, height, styles.radius);
  }

  doc.save();
  doc.fillOpacity(1);
  doc.roundedRect(left, top, width, height, styles.radius).fill(styles.fill as any);
  doc.strokeOpacity(styles.borderOpacity);
  doc.strokeColor(styles.border);
  doc.lineWidth(1);
  doc.roundedRect(left, top, width, height, styles.radius).stroke();
  doc.restore();
}

function buildHighlights(
  record: Record<string, number | string | boolean>,
): Array<{ label: string; value: string }> {
  const entries = Object.entries(record ?? {});
  const scored = entries
    .map(([key, value]) => {
      let score = 0;
      if (/(total|grand|nett|net|sum)/i.test(key)) score += 5;
      if (/(monthly|installment|payment)/i.test(key)) score += 3;
      if (currencyKeyPattern.test(key)) score += 3;
      if (percentKeyPattern.test(key)) score += 2;
      if (typeof value === "number") score += 1;
      return { key, value, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 3).map((item) => ({
    label: formatLabel(item.key),
    value: formatValue(item.key, item.value),
  }));
}

function formatLabel(value: string): string {
  return value
    .replace(/[_-]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatValue(key: string, value: number | string | boolean): string {
  if (typeof value === "number") {
    if (percentKeyPattern.test(key)) {
      return `${numberFormatter.format(value)}%`;
    }
    if (currencyKeyPattern.test(key)) {
      return currencyFormatter.format(value);
    }
    return numberFormatter.format(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

function buildReference(receipt: CalculatorReceipt): string {
  const date = receipt.issuedAt;
  const prefix =
    receipt.calculationType
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 4)
      .toUpperCase() || "LL";
  const timestamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
  ].join("");
  return `${prefix}-${timestamp}`;
}

function buildInitials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase())
      .join("")
      .slice(0, 2) || "LL"
  );
}

async function loadAgencyLogoBuffer(url: string | undefined): Promise<Buffer | undefined> {
  if (!url || !allowedRemoteLogoProtocols.test(url)) {
    return undefined;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }

  if (!isAllowedRemoteHostname(parsed.hostname)) {
    return undefined;
  }

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(remoteLogoTimeoutMs),
      redirect: "follow",
    });

    if (!response.ok) {
      return undefined;
    }

    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    const isSupportedImage =
      contentType.startsWith("image/png") ||
      contentType.startsWith("image/jpeg") ||
      contentType.startsWith("image/jpg");
    if (!isSupportedImage) {
      return undefined;
    }

    const contentLength = Number(response.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > maxRemoteLogoBytes) {
      return undefined;
    }

    const buffer = await readResponseBodyWithLimit(response, maxRemoteLogoBytes);
    if (buffer.byteLength === 0) {
      return undefined;
    }

    return buffer;
  } catch {
    return undefined;
  }
}

function isAllowedRemoteHostname(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();
  if (!normalized || normalized === "localhost") {
    return false;
  }

  if (isPrivateIpv4(normalized) || isPrivateIpv6(normalized)) {
    return false;
  }

  return true;
}

function isPrivateIpv4(hostname: string): boolean {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname);
  if (!match) {
    return false;
  }

  const parts = match.slice(1).map((part) => Number(part));
  if (parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;

  return false;
}

function isPrivateIpv6(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  if (normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (normalized.startsWith("fe80")) return true;
  return false;
}

async function readResponseBodyWithLimit(
  response: Response,
  maxBytes: number,
): Promise<Buffer> {
  if (!response.body) {
    return Buffer.alloc(0);
  }

  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    const chunk = Buffer.from(value);
    totalBytes += chunk.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      return Buffer.alloc(0);
    }

    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}
