import { Share, Platform } from 'react-native';
import { TransactionRecord } from '@/constants/mockData';

export function generateElectricityReceiptHtml(receipt: TransactionRecord): string {
  const discoName = receipt.billerName || receipt.network || 'Prepaid Electricity';
  const meterNo = receipt.recipient;
  const token = receipt.token || 'N/A';
  const units = receipt.units || 'N/A';
  const amount = `₦${receipt.amount.toLocaleString()}`;
  const ref = receipt.reference;
  const date = receipt.date || new Date().toLocaleString();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Electricity Receipt - ${ref}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 24px;
      color: #1E293B;
      background-color: #F8FAFC;
    }
    .receipt-card {
      max-width: 480px;
      margin: 0 auto;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .header {
      text-align: center;
      border-bottom: 2px dashed #E2E8F0;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .logo-text {
      font-size: 20px;
      font-weight: 800;
      color: #2563EB;
      letter-spacing: -0.5px;
    }
    .subhead {
      font-size: 13px;
      color: #64748B;
      margin-top: 4px;
    }
    .status-badge {
      display: inline-block;
      background: #DCFCE7;
      color: #15803D;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 999px;
      margin-top: 8px;
    }
    .amount-box {
      text-align: center;
      background: #EFF6FF;
      border-radius: 12px;
      padding: 14px;
      margin-bottom: 20px;
    }
    .amount-label {
      font-size: 11px;
      font-weight: 700;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .amount-val {
      font-size: 28px;
      font-weight: 800;
      color: #1E293B;
      margin-top: 4px;
    }
    .token-box {
      background: #0F172A;
      color: #FFFFFF;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
      text-align: center;
    }
    .token-label {
      font-size: 11px;
      font-weight: 700;
      color: #94A3B8;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    .token-code {
      font-family: monospace;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 2px;
      color: #38BDF8;
      word-break: break-all;
    }
    .token-units {
      font-size: 13px;
      font-weight: 600;
      color: #F8FAFC;
      margin-top: 8px;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .table td {
      padding: 8px 0;
      font-size: 13px;
      border-bottom: 1px solid #F1F5F9;
    }
    .table td:first-child {
      color: #64748B;
    }
    .table td:last-child {
      text-align: right;
      font-weight: 600;
      color: #1E293B;
    }
    .footer {
      text-align: center;
      border-top: 2px dashed #E2E8F0;
      padding-top: 16px;
      font-size: 11px;
      color: #94A3B8;
    }
  </style>
</head>
<body>
  <div class="receipt-card">
    <div class="header">
      <div class="logo-text">ABBA KANO INVESTMENTS</div>
      <div class="subhead">Prepaid Electricity Token Voucher</div>
      <div class="status-badge">PAYMENT COMPLETED</div>
    </div>

    <div class="amount-box">
      <div class="amount-label">Amount Paid</div>
      <div class="amount-val">${amount}</div>
    </div>

    <div class="token-box">
      <div class="token-label">PREPAID METER TOKEN</div>
      <div class="token-code">${token}</div>
      <div class="token-units">Purchased Energy: ${units}</div>
    </div>

    <table class="table">
      <tr>
        <td>Service Provider</td>
        <td>${discoName}</td>
      </tr>
      <tr>
        <td>Meter Number</td>
        <td>${meterNo}</td>
      </tr>
      <tr>
        <td>Transaction Reference</td>
        <td>${ref}</td>
      </tr>
      <tr>
        <td>Date & Time</td>
        <td>${date}</td>
      </tr>
      <tr>
        <td>Payment Method</td>
        <td>AbbaKano Wallet</td>
      </tr>
    </table>

    <div class="footer">
      Please punch the 20-digit token into your Customer Interface Unit (CIU) keypad.<br/>
      Thank you for choosing AbbaKano Data Sub!
    </div>
  </div>
</body>
</html>
  `;
}

export async function shareOrDownloadElectricityReceipt(receipt: TransactionRecord): Promise<void> {
  const discoName = receipt.billerName || receipt.network || 'Prepaid Electricity';
  const token = receipt.token || 'N/A';
  const units = receipt.units || 'N/A';
  const amount = `₦${receipt.amount.toLocaleString()}`;
  const ref = receipt.reference;
  const date = receipt.date || 'Just now';

  const textSummary = `⚡ ABBA KANO ELECTRICITY RECEIPT ⚡\n` +
    `--------------------------------------\n` +
    `Service: ${discoName}\n` +
    `Meter Number: ${receipt.recipient}\n` +
    `Amount Paid: ${amount}\n` +
    `Units: ${units}\n` +
    `--------------------------------------\n` +
    `TOKEN: ${token}\n` +
    `--------------------------------------\n` +
    `Reference ID: ${ref}\n` +
    `Date: ${date}\n` +
    `Status: SUCCESSFUL / COMPLETED\n\n` +
    `Punch the 20-digit token into your CIU keypad. Thank you!`;

  try {
    await Share.share({
      title: `Electricity Token Receipt - ${receipt.recipient}`,
      message: textSummary,
    });
  } catch {
    // share cancelled
  }
}
