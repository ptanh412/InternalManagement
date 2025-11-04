import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

class ReportingService {
  constructor() {
    this.reportQueue = [];
    this.isProcessing = false;
  }

  // Generate PDF report with charts and data
  async generatePDFReport(config = {}) {
    const {
      title = 'Dashboard Report',
      charts = [],
      tables = [],
      metadata = {},
      orientation = 'portrait',
      includeCharts = true,
      includeData = true,
      customSections = []
    } = config;

    try {
      const pdf = new jsPDF(orientation, 'pt', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 40;
      let yPosition = margin;

      // Add header
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, margin, yPosition);
      yPosition += 40;

      // Add metadata
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
      yPosition += 20;

      if (metadata.dateRange) {
        pdf.text(`Date Range: ${metadata.dateRange.startDate} to ${metadata.dateRange.endDate}`, margin, yPosition);
        yPosition += 20;
      }

      if (metadata.filters && Object.keys(metadata.filters).length > 0) {
        pdf.text(`Filters Applied: ${JSON.stringify(metadata.filters)}`, margin, yPosition);
        yPosition += 20;
      }

      yPosition += 20; // Extra spacing

      // Add charts if requested
      if (includeCharts && charts.length > 0) {
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Charts & Visualizations', margin, yPosition);
        yPosition += 30;

        for (const chart of charts) {
          // Check if we need a new page
          if (yPosition + 300 > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }

          try {
            // Capture chart as image
            const chartCanvas = await this.captureChartAsImage(chart.ref);
            if (chartCanvas) {
              const imgData = chartCanvas.toDataURL('image/png');
              const imgWidth = Math.min(pageWidth - 2 * margin, 500);
              const imgHeight = (chartCanvas.height / chartCanvas.width) * imgWidth;

              pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
              yPosition += imgHeight + 20;

              // Add chart title
              if (chart.title) {
                pdf.setFontSize(12);
                pdf.setFont('helvetica', 'bold');
                pdf.text(chart.title, margin, yPosition);
                yPosition += 20;
              }
            }
          } catch (error) {
            console.error('Error adding chart to PDF:', error);
            // Add error message instead of chart
            pdf.setFontSize(10);
            pdf.setTextColor(255, 0, 0);
            pdf.text(`Error loading chart: ${chart.title || 'Unknown'}`, margin, yPosition);
            pdf.setTextColor(0, 0, 0);
            yPosition += 20;
          }

          yPosition += 20; // Extra spacing between charts
        }
      }

      // Add data tables if requested
      if (includeData && tables.length > 0) {
        // Check if we need a new page
        if (yPosition + 100 > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Data Tables', margin, yPosition);
        yPosition += 30;

        for (const table of tables) {
          // Check if we need a new page
          if (yPosition + 200 > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }

          if (table.title) {
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text(table.title, margin, yPosition);
            yPosition += 25;
          }

          // Add table using autoTable plugin
          pdf.autoTable({
            startY: yPosition,
            head: [table.headers || []],
            body: table.data || [],
            margin: { left: margin, right: margin },
            styles: {
              fontSize: 9,
              cellPadding: 3,
            },
            headStyles: {
              fillColor: [59, 130, 246], // Blue header
              textColor: 255,
              fontStyle: 'bold'
            },
            alternateRowStyles: {
              fillColor: [249, 250, 251] // Light gray alternate rows
            }
          });

          yPosition = pdf.lastAutoTable.finalY + 20;
        }
      }

      // Add custom sections
      for (const section of customSections) {
        if (yPosition + 100 > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }

        if (section.title) {
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(section.title, margin, yPosition);
          yPosition += 25;
        }

        if (section.content) {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          const lines = pdf.splitTextToSize(section.content, pageWidth - 2 * margin);
          pdf.text(lines, margin, yPosition);
          yPosition += lines.length * 12 + 20;
        }
      }

      return pdf;
    } catch (error) {
      console.error('Error generating PDF report:', error);
      throw new Error('Failed to generate PDF report: ' + error.message);
    }
  }

  // Export to Excel/CSV
  async exportToExcel(data, config = {}) {
    const {
      filename = 'dashboard-data',
      sheets = [],
      includeCharts = false,
      format = 'xlsx' // 'xlsx' or 'csv'
    } = config;

    try {
      const workbook = XLSX.utils.book_new();

      // Add data sheets
      for (const sheet of sheets) {
        const worksheet = XLSX.utils.json_to_sheet(sheet.data || []);
        
        // Add headers if provided
        if (sheet.headers) {
          XLSX.utils.sheet_add_aoa(worksheet, [sheet.headers], { origin: 'A1' });
        }

        // Set column widths
        if (sheet.columnWidths) {
          worksheet['!cols'] = sheet.columnWidths.map(width => ({ wch: width }));
        }

        XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name || 'Data');
      }

      // Add summary sheet if multiple sheets exist
      if (sheets.length > 1) {
        const summaryData = sheets.map(sheet => ({
          'Sheet Name': sheet.name,
          'Records': sheet.data?.length || 0,
          'Generated': new Date().toISOString()
        }));
        
        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      }

      // Generate file
      const fileExtension = format === 'csv' ? 'csv' : 'xlsx';
      const fileName = `${filename}-${new Date().toISOString().split('T')[0]}.${fileExtension}`;

      if (format === 'csv' && sheets.length === 1) {
        // Export single sheet as CSV
        const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheets[0].name || 'Data']);
        this.downloadFile(csv, fileName, 'text/csv');
      } else {
        // Export as Excel
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        this.downloadFile(excelBuffer, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      }

      return { success: true, filename: fileName };
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw new Error('Failed to export data: ' + error.message);
    }
  }

  // Capture chart as image
  async captureChartAsImage(chartRef) {
    if (!chartRef || !chartRef.current) {
      return null;
    }

    try {
      // If it's a Chart.js canvas, use the canvas directly
      if (chartRef.current.canvas) {
        return chartRef.current.canvas;
      }

      // Otherwise, use html2canvas to capture the element
      const element = chartRef.current;
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true
      });

      return canvas;
    } catch (error) {
      console.error('Error capturing chart:', error);
      return null;
    }
  }

  // Schedule automated reports
  scheduleReport(config = {}) {
    const {
      frequency = 'weekly', // 'daily', 'weekly', 'monthly'
      recipients = [],
      reportConfig = {},
      startDate = new Date(),
      enabled = true
    } = config;

    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const scheduledReport = {
      id: reportId,
      frequency,
      recipients,
      reportConfig,
      startDate,
      enabled,
      lastGenerated: null,
      nextScheduled: this.calculateNextSchedule(frequency, startDate),
      createdAt: new Date()
    };

    // Store in localStorage for now (in production, this would be in a database)
    const existingReports = JSON.parse(localStorage.getItem('scheduledReports') || '[]');
    existingReports.push(scheduledReport);
    localStorage.setItem('scheduledReports', JSON.stringify(existingReports));

    // Set up the schedule (in production, this would be handled by a backend service)
    this.setupReportSchedule(scheduledReport);

    return { success: true, reportId, nextScheduled: scheduledReport.nextScheduled };
  }

  // Calculate next schedule date
  calculateNextSchedule(frequency, fromDate = new Date()) {
    const date = new Date(fromDate);
    
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      default:
        date.setDate(date.getDate() + 7); // Default to weekly
    }
    
    return date;
  }

  // Set up report schedule (simplified version)
  setupReportSchedule(scheduledReport) {
    const now = new Date();
    const nextScheduled = new Date(scheduledReport.nextScheduled);
    const timeUntilNext = nextScheduled.getTime() - now.getTime();

    if (timeUntilNext > 0 && scheduledReport.enabled) {
      setTimeout(async () => {
        try {
          await this.generateScheduledReport(scheduledReport);
          
          // Schedule next report
          const updatedReport = {
            ...scheduledReport,
            lastGenerated: new Date(),
            nextScheduled: this.calculateNextSchedule(scheduledReport.frequency, new Date())
          };
          
          this.setupReportSchedule(updatedReport);
        } catch (error) {
          console.error('Error generating scheduled report:', error);
        }
      }, timeUntilNext);
    }
  }

  // Generate scheduled report
  async generateScheduledReport(scheduledReport) {
    try {
      console.log('Generating scheduled report:', scheduledReport.id);
      
      // In a real application, you would:
      // 1. Fetch the latest data
      // 2. Generate the report
      // 3. Send it to recipients
      
      // For now, just log the action
      const reportData = await this.generatePDFReport(scheduledReport.reportConfig);
      
      // Simulate sending email (in production, call your email service)
      console.log(`Report sent to: ${scheduledReport.recipients.join(', ')}`);
      
      return { success: true };
    } catch (error) {
      console.error('Error in scheduled report generation:', error);
      throw error;
    }
  }

  // Get scheduled reports
  getScheduledReports() {
    return JSON.parse(localStorage.getItem('scheduledReports') || '[]');
  }

  // Update scheduled report
  updateScheduledReport(reportId, updates) {
    const reports = this.getScheduledReports();
    const reportIndex = reports.findIndex(r => r.id === reportId);
    
    if (reportIndex !== -1) {
      reports[reportIndex] = { ...reports[reportIndex], ...updates };
      localStorage.setItem('scheduledReports', JSON.stringify(reports));
      return { success: true };
    }
    
    return { success: false, error: 'Report not found' };
  }

  // Delete scheduled report
  deleteScheduledReport(reportId) {
    const reports = this.getScheduledReports();
    const filteredReports = reports.filter(r => r.id !== reportId);
    localStorage.setItem('scheduledReports', JSON.stringify(filteredReports));
    return { success: true };
  }

  // Download file helper
  downloadFile(data, filename, mimeType) {
    const blob = new Blob([data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Batch export multiple charts and data
  async batchExport(items = [], format = 'pdf') {
    const timestamp = new Date().toISOString().split('T')[0];
    
    try {
      if (format === 'pdf') {
        const pdfConfig = {
          title: 'Dashboard Export',
          charts: items.filter(item => item.type === 'chart'),
          tables: items.filter(item => item.type === 'table'),
          metadata: {
            exportDate: new Date().toISOString(),
            itemCount: items.length
          }
        };
        
        const pdf = await this.generatePDFReport(pdfConfig);
        pdf.save(`dashboard-export-${timestamp}.pdf`);
        
      } else if (format === 'excel') {
        const sheets = items
          .filter(item => item.type === 'table' && item.data)
          .map(item => ({
            name: item.name || 'Data',
            data: item.data,
            headers: item.headers
          }));
        
        await this.exportToExcel(null, {
          filename: `dashboard-export-${timestamp}`,
          sheets
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error in batch export:', error);
      throw error;
    }
  }
}

// Create singleton instance
const reportingService = new ReportingService();

export default reportingService;