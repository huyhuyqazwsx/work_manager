import { LeaveRequestEmailPayload } from '@domain/type/mail.types';

function formatSession(session?: string) {
  switch (session) {
    case 'MORNING':
      return 'Buổi sáng';
    case 'AFTERNOON':
      return 'Buổi chiều';
    case 'FULL':
      return 'Cả ngày';
    default:
      return '';
  }
}

export function buildLeaveRequestTemplate(
  params: LeaveRequestEmailPayload,
): string {
  const {
    employeeName,
    employeeCode,
    departmentName,
    leaveTypeCode,
    fromDate,
    toDate,
    fromSession,
    toSession,
    totalDays,
    reason,
    managerName,
    actionLink,
  } = params;

  const fromDisplay = `${fromDate} (${formatSession(fromSession)})`;
  const toDisplay = `${toDate} (${formatSession(toSession)})`;

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8"/>
<style>
body{
  font-family:Arial,serif;
  background:#f3f4f6;
  padding:24px;
}

.container{
  max-width:560px;
  margin:auto;
  background:white;
  border-radius:8px;
  overflow:hidden;
}

.header{
  background:#1d4ed8;
  color:white;
  padding:16px 20px;
  font-weight:bold;
}

.content{
  padding:24px;
  font-size:14px;
  line-height:1.6;
}

.info{
  margin:16px 0;
}

.info div{
  margin-bottom:6px;
}

.button{
  display:inline-block;
  margin-top:18px;
  background:#1d4ed8;
  color:white;
  padding:10px 22px;
  border-radius:6px;
  text-decoration:none;
}

.footer{
  font-size:12px;
  color:#94a3b8;
  text-align:center;
  padding:16px;
}
</style>
</head>

<body>

<div class="container">

<div class="header">
SkyCorp HRM — Thông báo yêu cầu nghỉ phép
</div>

<div class="content">

<p>Kính gửi <strong>${managerName}</strong>,</p>

<p>
Hệ thống ghi nhận một <strong>yêu cầu nghỉ phép mới</strong> cần anh/chị xem xét.
</p>

<div class="info">
<div><strong>Nhân viên:</strong> ${employeeName}</div>
<div><strong>Mã nhân viên:</strong> ${employeeCode}</div>
<div><strong>Phòng ban:</strong> ${departmentName}</div>
<div><strong>Loại nghỉ:</strong> ${leaveTypeCode ?? '-'}</div>
<div><strong>Thời gian:</strong> ${fromDisplay} → ${toDisplay}</div>
<div><strong>Tổng số ngày:</strong> ${totalDays}</div>
</div>

${reason ? `<p><strong>Lý do:</strong> ${reason}</p>` : ''}

<p>
Vui lòng đăng nhập hệ thống để xem chi tiết và xử lý yêu cầu.
</p>

<div style="text-align:center">
<a class="button" href="${actionLink}">
Mở hệ thống quản lý
</a>
</div>

</div>

<div class="footer">
Email này được gửi tự động từ hệ thống SkyCorp HRM.
</div>

</div>

</body>
</html>
`;
}
