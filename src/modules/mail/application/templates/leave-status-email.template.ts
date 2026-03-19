import { LeaveStatusEmailPayload } from '@domain/type/mail.types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN');
}

function infoBlock(params: LeaveStatusEmailPayload): string {
  return `
    <div class="info">
      <div><strong>Loại nghỉ:</strong> ${params.leaveTypeCode ?? '-'}</div>
      <div><strong>Từ ngày:</strong> ${formatDate(params.fromDate)}</div>
      <div><strong>Đến ngày:</strong> ${formatDate(params.toDate)}</div>
      <div><strong>Tổng số ngày:</strong> ${params.totalDays}</div>
    </div>`;
}

function buildBaseTemplate(
  headerColor: string,
  headerText: string,
  badgeColor: string,
  badgeBg: string,
  content: string,
): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8"/>
<style>
  body { font-family: Arial, sans-serif; background: #f3f4f6; padding: 24px; margin: 0; }
  .container { max-width: 560px; margin: auto; background: white; border-radius: 8px; overflow: hidden; }
  .header { background: ${headerColor}; color: white; padding: 16px 20px; font-weight: bold; }
  .content { padding: 24px; font-size: 14px; line-height: 1.6; color: #1e293b; }
  .badge { display: inline-block; background: ${badgeBg}; color: ${badgeColor}; padding: 4px 12px; border-radius: 20px; font-weight: bold; margin: 12px 0; }
  .info { margin: 16px 0; }
  .info div { margin-bottom: 6px; }
  .reason-box { background: #fef2f2; border-left: 3px solid #dc2626; padding: 12px 16px; border-radius: 0 6px 6px 0; margin: 16px 0; }
  .footer { font-size: 12px; color: #94a3b8; text-align: center; padding: 16px; }
</style>
</head>
<body>
<div class="container">
  <div class="header">${headerText}</div>
  <div class="content">${content}</div>
  <div class="footer">Email này được gửi tự động từ hệ thống SkyCorp HRM.</div>
</div>
</body>
</html>`;
}

export function buildLeaveApprovedTemplate(
  params: LeaveStatusEmailPayload,
): string {
  const content = `
    <p>Xin chào <strong>${params.employeeName}</strong>,</p>
    <p>Yêu cầu nghỉ phép của bạn đã được <strong>${params.managerName ?? 'quản lý'}</strong> phê duyệt.</p>
    <div class="badge">✓ Đã phê duyệt</div>
    ${infoBlock(params)}
    <p>Chúc bạn có kỳ nghỉ vui vẻ!</p>`;

  return buildBaseTemplate(
    '#16a34a',
    'SkyCorp HRM — Yêu cầu nghỉ phép đã được phê duyệt',
    '#16a34a',
    '#dcfce7',
    content,
  );
}

export function buildLeaveRejectedTemplate(
  params: LeaveStatusEmailPayload,
): string {
  const content = `
    <p>Xin chào <strong>${params.employeeName}</strong>,</p>
    <p>Yêu cầu nghỉ phép của bạn đã bị <strong>${params.managerName ?? 'quản lý'}</strong> từ chối.</p>
    <div class="badge">✗ Bị từ chối</div>
    ${infoBlock(params)}
    ${params.rejectReason ? `<div class="reason-box"><strong>Lý do từ chối:</strong><br/>${params.rejectReason}</div>` : ''}
    <p>Nếu có thắc mắc, vui lòng liên hệ trực tiếp với quản lý của bạn.</p>`;

  return buildBaseTemplate(
    '#dc2626',
    'SkyCorp HRM — Yêu cầu nghỉ phép bị từ chối',
    '#dc2626',
    '#fee2e2',
    content,
  );
}

export function buildLeaveCancelledTemplate(
  params: LeaveStatusEmailPayload,
): string {
  const content = `
    <p>Xin chào <strong>${params.employeeName}</strong>,</p>
    <p>Yêu cầu nghỉ phép của bạn đã được hủy thành công.</p>
    <div class="badge">— Đã hủy</div>
    ${infoBlock(params)}
    <p>Nếu bạn không thực hiện hủy này, vui lòng liên hệ HR ngay.</p>`;

  return buildBaseTemplate(
    '#64748b',
    'SkyCorp HRM — Yêu cầu nghỉ phép đã bị hủy',
    '#64748b',
    '#f1f5f9',
    content,
  );
}
