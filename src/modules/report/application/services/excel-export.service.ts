import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { LeaveMonthlyReportDto } from '../dto/leave-monthly-report';
import { Response } from 'express';
import { LeaveYearlyReportDto } from '@modules/report/application/dto/leave-yearly-report';
import { OTMonthlyReportDto } from '@modules/report/application/dto/ot-monthly-report.dto';

@Injectable()
export class ExcelExportService {
  async exportLeaveMonthly(
    report: LeaveMonthlyReportDto,
    res: Response,
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();

    const sheet = workbook.addWorksheet(`Phep T${report.month}-${report.year}`);

    // ===== Style helpers =====
    const headerFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    const weekendFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFBDD7EE' },
    };
    const deptFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E1F2' },
    };
    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
    const headerFont: Partial<ExcelJS.Font> = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
      name: 'Arial',
      size: 10,
    };
    const bodyFont: Partial<ExcelJS.Font> = {
      name: 'Arial',
      size: 10,
    };
    const centerAlign: Partial<ExcelJS.Alignment> = {
      horizontal: 'center',
      vertical: 'middle',
    };

    // ===== Tiêu đề =====
    sheet.mergeCells('A1:C1');
    sheet.getCell('A1').value =
      'Công ty Cổ phần đầu tư phát triển Sky Corporation';
    sheet.getCell('A1').font = { bold: true, name: 'Arial', size: 10 };

    sheet.mergeCells('A2:C2');
    sheet.getCell('A2').value =
      `THEO DÕI PHÉP THÁNG ${String(report.month).padStart(2, '0')} NĂM ${report.year}`;
    sheet.getCell('A2').font = { bold: true, name: 'Arial', size: 10 };

    // ===== Header =====
    const fixedHeaders = [
      'STT',
      'Mã NV',
      'Họ và tên',
      'Loại HĐ',
      'Ngày vào công ty',
      'Ngày ký HĐ chính thức',
    ];
    const FIXED_COLS = fixedHeaders.length;
    const daysInMonth = report.rows[0]?.days.length ?? 0;
    const totalCols = ['Phép tháng', 'Nghỉ lễ', 'Nghỉ không lương'];
    const totalStartCol = FIXED_COLS + daysInMonth + 1;
    const deptColSpan = FIXED_COLS + daysInMonth + totalCols.length;

    // Row 4: header cố định
    const headerRow4 = sheet.getRow(4);
    fixedHeaders.forEach((h, i) => {
      const cell = headerRow4.getCell(i + 1);
      cell.value = h;
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = centerAlign;
      cell.border = borderStyle;
    });

    // Merge row 4-5 cho cột cố định
    for (let i = 1; i <= FIXED_COLS; i++) {
      sheet.mergeCells(4, i, 5, i);
    }

    // Cột ngày — row 4
    for (let d = 0; d < daysInMonth; d++) {
      const col = FIXED_COLS + d + 1;
      const dayInfo = report.rows[0]?.days[d];
      const cell4 = headerRow4.getCell(col);
      cell4.value = d + 1;
      cell4.font = headerFont;
      cell4.alignment = centerAlign;
      cell4.border = borderStyle;
      cell4.fill = dayInfo?.isWeekend ? weekendFill : headerFill;
    }

    // Row 5: thứ trong tuần
    const headerRow5 = sheet.getRow(5);
    for (let d = 0; d < daysInMonth; d++) {
      const col = FIXED_COLS + d + 1;
      const dayInfo = report.rows[0]?.days[d];
      const cell5 = headerRow5.getCell(col);
      cell5.value = dayInfo?.dayOfWeek ?? '';
      cell5.font = headerFont;
      cell5.alignment = centerAlign;
      cell5.border = borderStyle;
      cell5.fill = dayInfo?.isWeekend ? weekendFill : headerFill;
    }

    // Cột tổng — merge row 4-5
    totalCols.forEach((t, i) => {
      const col = totalStartCol + i;
      sheet.mergeCells(4, col, 5, col);
      const cell = sheet.getRow(4).getCell(col);
      cell.value = t;
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = centerAlign;
      cell.border = borderStyle;
    });

    // ===== Data rows =====
    let currentRow = 6;
    let stt = 1;

    // Group rows theo departmentName
    const groupedByDept = new Map<string, typeof report.rows>();
    for (const row of report.rows) {
      const list = groupedByDept.get(row.departmentName) ?? [];
      list.push(row);
      groupedByDept.set(row.departmentName, list);
    }

    for (const [deptName, deptRows] of groupedByDept) {
      // Department header
      sheet.mergeCells(currentRow, 1, currentRow, deptColSpan);
      const deptCell = sheet.getRow(currentRow).getCell(1);
      deptCell.value = deptName.toUpperCase();
      deptCell.font = { bold: true, name: 'Arial', size: 10 };
      deptCell.fill = deptFill;
      deptCell.border = borderStyle;
      currentRow++;

      // Data rows
      deptRows.forEach((row) => {
        const dataRow = sheet.getRow(currentRow);

        const fixedValues = [
          stt++,
          row.userCode,
          row.fullName,
          row.contractType,
          row.joinDate
            ? new Date(row.joinDate).toLocaleDateString('vi-VN')
            : '',
          row.contractSignedDate
            ? new Date(row.contractSignedDate).toLocaleDateString('vi-VN')
            : '',
        ];

        fixedValues.forEach((v, i) => {
          const cell = dataRow.getCell(i + 1);
          cell.value = v;
          cell.font = bodyFont;
          cell.border = borderStyle;
          cell.alignment = i >= 3 ? centerAlign : { vertical: 'middle' };
        });

        row.days.forEach((day, d) => {
          const col = FIXED_COLS + d + 1;
          const cell = dataRow.getCell(col);
          cell.value = day.symbol ?? '';
          cell.font = bodyFont;
          cell.alignment = centerAlign;
          cell.border = borderStyle;
          if (day.isWeekend) cell.fill = weekendFill;
        });

        dataRow.getCell(totalStartCol).value = row.totalLeave;
        dataRow.getCell(totalStartCol + 1).value = row.totalHoliday;
        dataRow.getCell(totalStartCol + 2).value = row.totalUnpaid;

        [totalStartCol, totalStartCol + 1, totalStartCol + 2].forEach((col) => {
          const cell = dataRow.getCell(col);
          cell.font = bodyFont;
          cell.alignment = centerAlign;
          cell.border = borderStyle;
        });

        currentRow++;
      });
    }

    // ===== Chú thích =====
    currentRow++;
    const legends = [
      'P — Nghỉ phép',
      'P/2 — Nghỉ phép nửa ngày',
      'KL — Nghỉ không lương',
      'NL — Nghỉ lễ',
      'NCD — Nghỉ chế độ',
      'KL/2 — Nửa ngày không lương',
    ];
    legends.forEach((legend) => {
      sheet.getRow(currentRow).getCell(1).value = legend;
      sheet.getRow(currentRow).getCell(1).font = bodyFont;
      currentRow++;
    });

    // ===== Column widths =====
    sheet.getColumn(1).width = 5;
    sheet.getColumn(2).width = 10;
    sheet.getColumn(3).width = 20;
    sheet.getColumn(4).width = 12;
    sheet.getColumn(5).width = 16;
    sheet.getColumn(6).width = 18;
    for (let d = 0; d < daysInMonth; d++) {
      sheet.getColumn(FIXED_COLS + d + 1).width = 4;
    }
    totalCols.forEach((_, i) => {
      sheet.getColumn(totalStartCol + i).width = 14;
    });

    sheet.getRow(4).height = 20;
    sheet.getRow(5).height = 20;

    // ===== Stream về client =====
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Leave-report-monthly-${report.month}-${report.year}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  async exportLeaveYearly(
    report: LeaveYearlyReportDto,
    res: Response,
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Phep Nam ${report.year}`);

    // ===== Style helpers =====
    const headerFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    const deptFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E1F2' },
    };
    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
    const headerFont: Partial<ExcelJS.Font> = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
      name: 'Arial',
      size: 10,
    };
    const bodyFont: Partial<ExcelJS.Font> = { name: 'Arial', size: 10 };
    const centerAlign: Partial<ExcelJS.Alignment> = {
      horizontal: 'center',
      vertical: 'middle',
    };

    // ===== Tiêu đề =====
    sheet.mergeCells('A1:C1');
    sheet.getCell('A1').value =
      'Công ty Cổ phần đầu tư phát triển Sky Corporation';
    sheet.getCell('A1').font = { bold: true, name: 'Arial', size: 10 };

    sheet.mergeCells('A2:C2');
    sheet.getCell('A2').value = `THEO DÕI PHÉP NĂM ${report.year}`;
    sheet.getCell('A2').font = { bold: true, name: 'Arial', size: 10 };

    // Lấy tháng hiện tại để hiển thị "TÍNH ĐẾN THÁNG XX/YYYY"
    const now = new Date();
    sheet.mergeCells('A3:C3');
    sheet.getCell('A3').value =
      `TÍNH ĐẾN THÁNG ${String(now.getMonth() + 1).padStart(2, '0')}/${report.year}`;
    sheet.getCell('A3').font = { name: 'Arial', size: 10 };

    // ===== Cấu trúc cột =====
    const fixedHeaders = [
      'STT',
      'Mã NV',
      'Họ và tên',
      'Loại HĐ',
      'Ngày vào công ty',
      'Ngày ký HĐ chính thức',
      'Tình trạng HĐ',
      'Tổng phép năm',
    ];
    const FIXED_COLS = fixedHeaders.length; // 8
    const MONTH_COUNT = 12;
    const totalColHeaders = [
      `P ${report.year} đã dùng`,
      `Còn lại trong năm ${report.year}`,
    ];
    const totalStartCol = FIXED_COLS + MONTH_COUNT + 1;
    const totalColSpan = FIXED_COLS + MONTH_COUNT + totalColHeaders.length;

    // ===== Row 4: header cố định + tháng + tổng =====
    const headerRow4 = sheet.getRow(4);

    // Cột cố định — merge row 4-5
    fixedHeaders.forEach((h, i) => {
      sheet.mergeCells(4, i + 1, 5, i + 1);
      const cell = headerRow4.getCell(i + 1);
      cell.value = h;
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = centerAlign;
      cell.border = borderStyle;
    });

    // Cột tháng — row 4: "Tháng X", row 5: "P"
    for (let m = 1; m <= MONTH_COUNT; m++) {
      const col = FIXED_COLS + m;
      const cell4 = headerRow4.getCell(col);
      cell4.value = `Tháng ${m}`;
      cell4.fill = headerFill;
      cell4.font = headerFont;
      cell4.alignment = centerAlign;
      cell4.border = borderStyle;
    }

    // Row 5: sub-header "P" cho từng tháng
    const headerRow5 = sheet.getRow(5);
    for (let m = 1; m <= MONTH_COUNT; m++) {
      const col = FIXED_COLS + m;
      const cell5 = headerRow5.getCell(col);
      cell5.value = 'P';
      cell5.fill = headerFill;
      cell5.font = headerFont;
      cell5.alignment = centerAlign;
      cell5.border = borderStyle;
    }

    // Cột tổng — merge row 4-5
    totalColHeaders.forEach((t, i) => {
      const col = totalStartCol + i;
      sheet.mergeCells(4, col, 5, col);
      const cell = headerRow4.getCell(col);
      cell.value = t;
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = centerAlign;
      cell.border = borderStyle;
    });

    // ===== Data rows =====
    let currentRow = 6;

    // Group theo departmentName
    const groupedByDept = new Map<string, typeof report.rows>();
    for (const row of report.rows) {
      const list = groupedByDept.get(row.departmentName) ?? [];
      list.push(row);
      groupedByDept.set(row.departmentName, list);
    }

    for (const [deptName, deptRows] of groupedByDept) {
      // Department header
      sheet.mergeCells(currentRow, 1, currentRow, totalColSpan);
      const deptCell = sheet.getRow(currentRow).getCell(1);
      deptCell.value = deptName.toUpperCase();
      deptCell.font = { bold: true, name: 'Arial', size: 10 };
      deptCell.fill = deptFill;
      deptCell.border = borderStyle;
      currentRow++;

      // Data rows
      deptRows.forEach((row) => {
        const dataRow = sheet.getRow(currentRow);

        const fixedValues = [
          row.stt,
          row.userCode,
          row.fullName,
          row.contractType,
          row.joinDate
            ? new Date(row.joinDate).toLocaleDateString('vi-VN')
            : '',
          row.contractSignedDate
            ? new Date(row.contractSignedDate).toLocaleDateString('vi-VN')
            : '',
          row.employmentStatus,
          row.totalAllowedDays,
        ];

        fixedValues.forEach((v, i) => {
          const cell = dataRow.getCell(i + 1);
          cell.value = v;
          cell.font = bodyFont;
          cell.border = borderStyle;
          cell.alignment = i >= 3 ? centerAlign : { vertical: 'middle' };
        });

        // Cột tháng
        for (let m = 1; m <= MONTH_COUNT; m++) {
          const col = FIXED_COLS + m;
          const cell = dataRow.getCell(col);
          const val = row.monthlyUsed[m] ?? 0;
          cell.value = val > 0 ? val : '';
          cell.font = bodyFont;
          cell.alignment = centerAlign;
          cell.border = borderStyle;
        }

        // Cột tổng
        dataRow.getCell(totalStartCol).value = row.totalUsed;
        dataRow.getCell(totalStartCol + 1).value = row.remaining;

        [totalStartCol, totalStartCol + 1].forEach((col) => {
          const cell = dataRow.getCell(col);
          cell.font = bodyFont;
          cell.alignment = centerAlign;
          cell.border = borderStyle;
        });

        currentRow++;
      });
    }

    // ===== Column widths =====
    sheet.getColumn(1).width = 5; // STT
    sheet.getColumn(2).width = 10; // Mã NV
    sheet.getColumn(3).width = 20; // Họ tên
    sheet.getColumn(4).width = 12; // Loại HĐ
    sheet.getColumn(5).width = 16; // Ngày vào
    sheet.getColumn(6).width = 18; // Ngày ký
    sheet.getColumn(7).width = 12; // Tình trạng HĐ
    sheet.getColumn(8).width = 14; // Tổng phép năm
    for (let m = 1; m <= MONTH_COUNT; m++) {
      sheet.getColumn(FIXED_COLS + m).width = 9;
    }
    sheet.getColumn(totalStartCol).width = 16;
    sheet.getColumn(totalStartCol + 1).width = 20;

    sheet.getRow(4).height = 20;
    sheet.getRow(5).height = 20;

    // ===== Stream về client =====
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Leave-report-yearly-${report.year}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  async exportOTMonthly(
    report: OTMonthlyReportDto,
    res: Response,
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();

    // ===== Style helpers =====
    const headerFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
    const headerFont: Partial<ExcelJS.Font> = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
      name: 'Arial',
      size: 10,
    };
    const bodyFont: Partial<ExcelJS.Font> = { name: 'Arial', size: 10 };
    const centerAlign: Partial<ExcelJS.Alignment> = {
      horizontal: 'center',
      vertical: 'middle',
    };

    // ===== Sheet 1: Chi tiết =====
    const detailSheet = workbook.addWorksheet(
      `Chi tiet OT T${report.month}-${report.year}`,
    );

    detailSheet.mergeCells('A1:I1');
    detailSheet.getCell('A1').value =
      'Công ty Cổ phần đầu tư phát triển Sky Corporation';
    detailSheet.getCell('A1').font = { bold: true, name: 'Arial', size: 10 };

    detailSheet.mergeCells('A2:I2');
    detailSheet.getCell('A2').value =
      `CHI TIẾT OT THÁNG ${String(report.month).padStart(2, '0')} NĂM ${report.year} - ${report.departmentName.toUpperCase()}`;
    detailSheet.getCell('A2').font = { bold: true, name: 'Arial', size: 10 };

    const detailHeaders = [
      'STT',
      'Mã NV',
      'Họ và tên',
      'Phòng ban',
      'Ngày tháng',
      'Giờ bắt đầu',
      'Giờ kết thúc',
      'Check In',
      'Check Out',
      'Tổng số giờ',
    ];

    const detailHeaderRow = detailSheet.getRow(4);
    detailHeaders.forEach((h, i) => {
      const cell = detailHeaderRow.getCell(i + 1);
      cell.value = h;
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = centerAlign;
      cell.border = borderStyle;
    });
    detailSheet.getRow(4).height = 20;

    report.detailRows.forEach((row, idx) => {
      const dataRow = detailSheet.getRow(5 + idx);
      const values = [
        idx + 1,
        row.userCode,
        row.fullName,
        row.departmentName,
        new Date(row.workDate).toLocaleDateString('vi-VN'),
        new Date(row.startTime).toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        new Date(row.endTime).toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        row.checkIn
          ? new Date(row.checkIn).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '',
        row.checkOut
          ? new Date(row.checkOut).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '',
        row.actualHours,
      ];

      values.forEach((v, i) => {
        const cell = dataRow.getCell(i + 1);
        cell.value = v;
        cell.font = bodyFont;
        cell.border = borderStyle;
        cell.alignment = i >= 4 ? centerAlign : { vertical: 'middle' };
      });
    });

    detailSheet.getColumn(1).width = 5;
    detailSheet.getColumn(2).width = 10;
    detailSheet.getColumn(3).width = 20;
    detailSheet.getColumn(4).width = 22;
    detailSheet.getColumn(5).width = 14;
    detailSheet.getColumn(6).width = 12;
    detailSheet.getColumn(7).width = 12;
    detailSheet.getColumn(8).width = 12;
    detailSheet.getColumn(9).width = 12;
    detailSheet.getColumn(10).width = 14;

    // ===== Sheet 2: Tổng hợp =====
    const summarySheet = workbook.addWorksheet(
      `Tong hop OT T${report.month}-${report.year}`,
    );

    summarySheet.mergeCells('A1:E1');
    summarySheet.getCell('A1').value =
      'Công ty Cổ phần đầu tư phát triển Sky Corporation';
    summarySheet.getCell('A1').font = { bold: true, name: 'Arial', size: 10 };

    summarySheet.mergeCells('A2:E2');
    summarySheet.getCell('A2').value =
      `TỔNG HỢP GIỜ LÀM THÊM THÁNG ${String(report.month).padStart(2, '0')} NĂM ${report.year} - ${report.departmentName.toUpperCase()}`;
    summarySheet.getCell('A2').font = { bold: true, name: 'Arial', size: 10 };

    const summaryHeaders = ['STT', 'Mã NV', 'Họ và tên', 'Tổng số giờ', 'Tổng'];

    const summaryHeaderRow = summarySheet.getRow(4);
    summaryHeaders.forEach((h, i) => {
      const cell = summaryHeaderRow.getCell(i + 1);
      cell.value = h;
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = centerAlign;
      cell.border = borderStyle;
    });
    summarySheet.getRow(4).height = 20;

    report.summaryRows.forEach((row, idx) => {
      const dataRow = summarySheet.getRow(5 + idx);
      const values = [
        idx + 1,
        row.userCode,
        row.fullName,
        row.totalHours,
        row.total,
      ];

      values.forEach((v, i) => {
        const cell = dataRow.getCell(i + 1);
        cell.value = v;
        cell.font = bodyFont;
        cell.border = borderStyle;
        cell.alignment = i >= 3 ? centerAlign : { vertical: 'middle' };
      });
    });

    summarySheet.getColumn(1).width = 5;
    summarySheet.getColumn(2).width = 10;
    summarySheet.getColumn(3).width = 20;
    summarySheet.getColumn(4).width = 14;
    summarySheet.getColumn(5).width = 10;

    // ===== Stream về client =====
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=OT-report-${report.month}-${report.year}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  async exportOTMonthlyAll(
    reports: OTMonthlyReportDto[],
    res: Response,
  ): Promise<void> {
    if (!reports.length) {
      res.status(204).end();
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const month = reports[0].month;
    const year = reports[0].year;

    const headerFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    const deptFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E1F2' },
    };
    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
    const headerFont: Partial<ExcelJS.Font> = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
      name: 'Arial',
      size: 10,
    };
    const bodyFont: Partial<ExcelJS.Font> = { name: 'Arial', size: 10 };
    const centerAlign: Partial<ExcelJS.Alignment> = {
      horizontal: 'center',
      vertical: 'middle',
    };

    // ===== Sheet Chi tiết =====
    const detailSheet = workbook.addWorksheet(`Chi tiet OT T${month}-${year}`);

    detailSheet.mergeCells('A1:J1');
    detailSheet.getCell('A1').value =
      'Công ty Cổ phần đầu tư phát triển Sky Corporation';
    detailSheet.getCell('A1').font = { bold: true, name: 'Arial', size: 10 };

    detailSheet.mergeCells('A2:J2');
    detailSheet.getCell('A2').value =
      `CHI TIẾT OT THÁNG ${String(month).padStart(2, '0')} NĂM ${year}`;
    detailSheet.getCell('A2').font = { bold: true, name: 'Arial', size: 10 };

    const detailHeaders = [
      'STT',
      'Mã NV',
      'Họ và tên',
      'Phòng ban',
      'Ngày tháng',
      'Giờ bắt đầu',
      'Giờ kết thúc',
      'Check In',
      'Check Out',
      'Tổng số giờ',
    ];

    const detailHeaderRow = detailSheet.getRow(4);
    detailHeaders.forEach((h, i) => {
      const cell = detailHeaderRow.getCell(i + 1);
      cell.value = h;
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = centerAlign;
      cell.border = borderStyle;
    });
    detailSheet.getRow(4).height = 20;

    let detailCurrentRow = 5;
    let detailStt = 1;

    for (const report of reports) {
      // Department header
      detailSheet.mergeCells(detailCurrentRow, 1, detailCurrentRow, 10);
      const deptCell = detailSheet.getRow(detailCurrentRow).getCell(1);
      deptCell.value = report.departmentName.toUpperCase();
      deptCell.font = { bold: true, name: 'Arial', size: 10 };
      deptCell.fill = deptFill;
      deptCell.border = borderStyle;
      detailCurrentRow++;

      report.detailRows.forEach((row) => {
        const dataRow = detailSheet.getRow(detailCurrentRow);
        const values = [
          detailStt++,
          row.userCode,
          row.fullName,
          row.departmentName,
          new Date(row.workDate).toLocaleDateString('vi-VN'),
          new Date(row.startTime).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          new Date(row.endTime).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          row.checkIn
            ? new Date(row.checkIn).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '',
          row.checkOut
            ? new Date(row.checkOut).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '',
          row.actualHours,
        ];

        values.forEach((v, i) => {
          const cell = dataRow.getCell(i + 1);
          cell.value = v;
          cell.font = bodyFont;
          cell.border = borderStyle;
          cell.alignment = i >= 4 ? centerAlign : { vertical: 'middle' };
        });

        detailCurrentRow++;
      });
    }

    [5, 10, 20, 22, 14, 12, 12, 12, 12, 14].forEach((w, i) => {
      detailSheet.getColumn(i + 1).width = w;
    });

    // ===== Sheet Tổng hợp =====
    const summarySheet = workbook.addWorksheet(`Tong hop OT T${month}-${year}`);

    summarySheet.mergeCells('A1:E1');
    summarySheet.getCell('A1').value =
      'Công ty Cổ phần đầu tư phát triển Sky Corporation';
    summarySheet.getCell('A1').font = { bold: true, name: 'Arial', size: 10 };

    summarySheet.mergeCells('A2:E2');
    summarySheet.getCell('A2').value =
      `TỔNG HỢP GIỜ LÀM THÊM THÁNG ${String(month).padStart(2, '0')} NĂM ${year}`;
    summarySheet.getCell('A2').font = { bold: true, name: 'Arial', size: 10 };

    const summaryHeaders = ['STT', 'Mã NV', 'Họ và tên', 'Tổng số giờ', 'Tổng'];

    const summaryHeaderRow = summarySheet.getRow(4);
    summaryHeaders.forEach((h, i) => {
      const cell = summaryHeaderRow.getCell(i + 1);
      cell.value = h;
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = centerAlign;
      cell.border = borderStyle;
    });
    summarySheet.getRow(4).height = 20;

    let summaryCurrentRow = 5;
    let summaryStt = 1;

    for (const report of reports) {
      // Department header
      summarySheet.mergeCells(summaryCurrentRow, 1, summaryCurrentRow, 5);
      const deptCell = summarySheet.getRow(summaryCurrentRow).getCell(1);
      deptCell.value = report.departmentName.toUpperCase();
      deptCell.font = { bold: true, name: 'Arial', size: 10 };
      deptCell.fill = deptFill;
      deptCell.border = borderStyle;
      summaryCurrentRow++;

      report.summaryRows.forEach((row) => {
        const dataRow = summarySheet.getRow(summaryCurrentRow);
        const values = [
          summaryStt++,
          row.userCode,
          row.fullName,
          row.totalHours,
          row.total,
        ];

        values.forEach((v, i) => {
          const cell = dataRow.getCell(i + 1);
          cell.value = v;
          cell.font = bodyFont;
          cell.border = borderStyle;
          cell.alignment = i >= 3 ? centerAlign : { vertical: 'middle' };
        });

        summaryCurrentRow++;
      });
    }

    [5, 10, 20, 14, 10].forEach((w, i) => {
      summarySheet.getColumn(i + 1).width = w;
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=OT-report-all-${month}-${year}.xlsx`,
    );
    await workbook.xlsx.write(res);
    res.end();
  }
}
