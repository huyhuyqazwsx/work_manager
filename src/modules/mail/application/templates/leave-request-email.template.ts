export function buildLeaveRequestTemplate(params: {
  employeeName: string;
  employeeId: string;
  leaveTypeName: string;
  fromDate: string;
  fromTime?: string;
  toDate: string;
  toTime?: string;
  totalDays: number;
  reason?: string | null;
  note?: string | null;
  managerName: string;
  actionLink: string;
}): string {
  const {
    employeeName,
    employeeId,
    leaveTypeName,
    fromDate,
    fromTime,
    toDate,
    toTime,
    totalDays,
    reason,
    note,
    managerName,
    actionLink,
  } = params;

  const fromDisplay = fromTime ? `${fromDate}, ${fromTime}` : fromDate;
  const toDisplay = toTime ? `${toDate}, ${toTime}` : toDate;

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f0f2f5;
      margin: 0;
      padding: 30px 20px;
      color: #333333;
    }
    .wrapper {
      max-width: 620px;
      margin: auto;
    }
    .header {
      background-color: #1d4ed8;
      padding: 20px 28px;
      border-radius: 8px 8px 0 0;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header-logo {
      font-size: 18px;
      font-weight: bold;
      color: #ffffff;
      letter-spacing: 1px;
    }
    .header-subtitle {
      font-size: 13px;
      color: #bfdbfe;
      margin-top: 2px;
    }
    .body {
      background: #ffffff;
      padding: 28px;
      border-left: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
    }
    .greeting {
      font-size: 15px;
      margin-bottom: 16px;
    }
    .intro {
      font-size: 14px;
      color: #555;
      margin-bottom: 20px;
      line-height: 1.6;
    }
    .section-title {
      font-size: 13px;
      font-weight: bold;
      color: #1d4ed8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
      margin-bottom: 24px;
    }
    .info-table tr {
      border-bottom: 1px solid #f1f5f9;
    }
    .info-table td {
      padding: 10px 8px;
      vertical-align: top;
    }
    .info-table td:first-child {
      color: #64748b;
      width: 40%;
      font-weight: 500;
    }
    .info-table td:last-child {
      color: #1e293b;
      font-weight: 600;
    }
    .reason-box {
      background: #f8fafc;
      border-left: 3px solid #1d4ed8;
      padding: 12px 16px;
      border-radius: 0 6px 6px 0;
      font-size: 14px;
      color: #334155;
      margin-bottom: 28px;
      line-height: 1.6;
    }
    .reason-box .reason-label {
      font-weight: bold;
      color: #1d4ed8;
      margin-bottom: 4px;
    }
    .cta-wrapper {
      text-align: center;
      margin-bottom: 28px;
    }
    .cta-button {
      display: inline-block;
      background-color: #1d4ed8;
      color: #ffffff !important;
      text-decoration: none;
      padding: 13px 32px;
      border-radius: 6px;
      font-size: 15px;
      font-weight: bold;
      letter-spacing: 0.3px;
    }
    .cta-button:hover {
      background-color: #1e40af;
    }
    .cta-sub {
      margin-top: 10px;
      font-size: 12px;
      color: #94a3b8;
    }
    .footer {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-top: none;
      border-radius: 0 0 8px 8px;
      padding: 16px 28px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.8;
    }
  </style>
</head>
<body>
  <div class="wrapper">

    <div class="header">
      <div>
        <div class="header-logo">☁ SkyCorp HRM</div>
        <div class="header-subtitle">Hệ thống Quản trị Nhân sự</div>
      </div>
    </div>

    <div class="body">
      <p class="greeting">Kính gửi anh/chị <strong>${managerName}</strong>,</p>
      <p class="intro">
        Hệ thống vừa nhận được một <strong>yêu cầu xin nghỉ phép</strong> cần anh/chị xem xét và phê duyệt.
        Thông tin chi tiết như sau:
      </p>

      <div class="section-title">Chi tiết yêu cầu</div>

      <table class="info-table">
        <tr>
          <td>Nhân viên</td>
          <td>${employeeName}</td>
        </tr>
        <tr>
          <td>Mã nhân viên</td>
          <td>${employeeId}</td>
        </tr>
        <tr>
          <td>Loại nghỉ phép</td>
          <td>${leaveTypeName}</td>
        </tr>
        <tr>
          <td>Từ ngày</td>
          <td>${fromDisplay}</td>
        </tr>
        <tr>
          <td>Đến hết ngày</td>
          <td>${toDisplay}</td>
        </tr>
        <tr>
          <td>Tổng thời lượng</td>
          <td>${totalDays} ngày</td>
        </tr>
      </table>

      ${
        reason || note
          ? `
      <div class="reason-box">
        ${reason ? `<div class="reason-label">Lý do</div><div>${reason}</div>` : ''}
        ${note ? `<div style="margin-top:8px"><span style="font-weight:bold">Ghi chú:</span> ${note}</div>` : ''}
      </div>
      `
          : ''
      }

      <div class="cta-wrapper">
        <a href="${actionLink}" class="cta-button">XEM &amp; XỬ LÝ YÊU CẦU</a>
        <div class="cta-sub">Nhấn để Phê duyệt (Approve) hoặc Từ chối (Reject)</div>
      </div>

      <p style="font-size:14px; color:#555; line-height:1.6;">
        Trân trọng,<br/>
        <strong>Hệ thống Quản trị Nhân sự SkyCorp HRM</strong>
      </p>
    </div>

    <div class="footer">
      Đây là email tự động từ hệ thống. Vui lòng không trả lời trực tiếp email này.<br/>
      © ${new Date().getFullYear()} SkyCorp HRM — All rights reserved.
    </div>

  </div>
</body>
</html>
  `;
}
