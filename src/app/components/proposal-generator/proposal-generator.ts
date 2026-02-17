import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ProposalFormComponent } from './proposal-form/proposal-form';
import { ProposalPreviewComponent } from './proposal-preview/proposal-preview';

@Component({
  selector: 'app-proposal-generator',
  standalone: true,
  imports: [CommonModule, ProposalFormComponent, ProposalPreviewComponent],
  templateUrl: './proposal-generator.html',
  styleUrls: ['./proposal-generator.css'],
})
export class ProposalGeneratorComponent {
  proposalData: any = null;
  formCollapsed = false;

  onFormChange(data: any) {
    this.proposalData = data;
  }

  toggleForm() {
    this.formCollapsed = !this.formCollapsed;
  }

  exportPreviewPdf() {
    const element = document.getElementById('proposal-preview');
    if (!element) return;
  
    const logo = new Image();
    logo.src = 'assets/img/masirat-logo.png';
  
    logo.onload = () => {
      html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      }).then((canvas) => {
        const pdf = new jsPDF('p', 'mm', 'a4');
  
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
  
        const margin = 8;
        const headerHeight = 28;
        const footerHeight = 15;
  
        const usableWidth = pageWidth - margin * 2;
        const usableHeight = pageHeight - headerHeight - footerHeight;
  
        const scale = usableWidth / canvas.width;
        const totalHeightMm = canvas.height * scale;
  
        let renderedHeightMm = 0;
        let sourceY = 0;
  
        // ===== Header drawer =====
        const drawHeader = () => {
          const maxLogoWidth = 20;
          const ratio = logo.height / logo.width;
          const logoWidth = maxLogoWidth;
          const logoHeight = maxLogoWidth * ratio;
  
          pdf.addImage(logo, 'PNG', margin, 6, logoWidth, logoHeight);
  
          const titleX = margin + logoWidth + 5;
          const logoCenterY = 6 + logoHeight / 2;
  
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Masirat', titleX, logoCenterY + 2);
  
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'normal');
          pdf.text('Technology', titleX, logoCenterY + 8);
        };
  
        const pageCanvas = document.createElement('canvas');
        const pageCtx = pageCanvas.getContext('2d')!;
  
        pageCanvas.width = canvas.width;
  
        let pageIndex = 0;
  
        while (renderedHeightMm < totalHeightMm) {
          if (pageIndex > 0) pdf.addPage();
  
          drawHeader();
  
          // How much height we can draw this page (in mm)
          const remainingMm = totalHeightMm - renderedHeightMm;
          const drawHeightMm = Math.min(usableHeight, remainingMm);
  
          // Convert that to source canvas pixels
          const drawHeightPx = drawHeightMm / scale;
  
          // Resize slice canvas to EXACT needed height (prevents black area)
          pageCanvas.height = Math.ceil(drawHeightPx);
  
          pageCtx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
  
          pageCtx.drawImage(
            canvas,
            0,
            sourceY,
            canvas.width,
            drawHeightPx,
            0,
            0,
            canvas.width,
            drawHeightPx
          );
  
          const imgData = pageCanvas.toDataURL('image/png'); // PNG avoids black fill
  
          pdf.addImage(
            imgData,
            'PNG',
            margin,
            headerHeight + 4,
            usableWidth,
            drawHeightMm
          );
  
          // Move down
          sourceY += drawHeightPx;
          renderedHeightMm += drawHeightMm;
          pageIndex++;
        }
  
        // ===== Footer =====
        const totalPages = pdf.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.setFontSize(9);
          pdf.setTextColor(128, 128, 128);
  
          pdf.setDrawColor(200, 200, 200);
          pdf.setLineWidth(0.3);
          pdf.line(
            margin,
            pageHeight - 12,
            pageWidth - margin,
            pageHeight - 12
          );
  
          pdf.text('Masirat Technology', margin, pageHeight - 6);
  
          const text = `Page ${i} of ${totalPages}`;
          pdf.text(
            text,
            pageWidth - margin - pdf.getTextWidth(text),
            pageHeight - 6
          );
        }
  
        pdf.save('Masirat-Technology-Proposal.pdf');
      });
    };
  }
  
}
