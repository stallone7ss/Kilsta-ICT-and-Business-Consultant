import React, { useId } from 'react';
import { Printer, Copy, Check } from 'lucide-react';

interface BarcodeProps {
  value: string;
  sku?: string;
  name?: string;
  serialNumber?: string;
  showPrintBtn?: boolean;
}

// Generate pseudo-code128 barcode bars deterministically from string
function generateBarcodeBars(code: string): boolean[] {
  const bars: boolean[] = [];
  // Guard quiet zones
  bars.push(true, false, true, true, false, false);
  
  for (let i = 0; i < code.length; i++) {
    const charCode = code.charCodeAt(i);
    // 7 bar-spaces per character
    const pattern = [
      (charCode % 2) === 0,
      ((charCode >> 1) % 2) === 1,
      ((charCode >> 2) % 2) === 0,
      ((charCode >> 3) % 2) === 1,
      ((charCode >> 4) % 2) === 1,
      ((charCode + i) % 3) !== 0,
      ((charCode * 3) % 2) === 0,
    ];
    bars.push(...pattern);
    bars.push(false); // spacer
  }
  // Stop guard pattern
  bars.push(true, true, false, false, true, false, true, true);
  return bars;
}

export const BarcodeBadge: React.FC<BarcodeProps> = ({
  value,
  sku,
  name,
  serialNumber,
  showPrintBtn = true
}) => {
  const [copied, setCopied] = React.useState(false);
  const bars = React.useMemo(() => generateBarcodeBars(value || 'KICT0000'), [value]);
  const barWidth = 2.4;
  const height = 48;
  const totalWidth = bars.length * barWidth;

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=600,height=400');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Asset Tag - ${sku || value}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 20px; }
            .tag { border: 2px solid #0f172a; border-radius: 8px; padding: 16px; width: 340px; margin: 0 auto; text-align: center; }
            .brand { font-size: 13px; font-weight: 800; color: #0284c7; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
            .name { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 8px; line-height: 1.2; }
            .sku { font-size: 16px; font-weight: 900; letter-spacing: 0.5px; font-family: monospace; color: #1e293b; margin: 6px 0; }
            .sn { font-size: 11px; color: #475569; font-family: monospace; margin-bottom: 8px; }
            .code-text { font-family: monospace; font-size: 12px; letter-spacing: 2px; margin-top: 4px; }
          </style>
        </head>
        <body>
          <div class="tag">
            <div class="brand">Kilsta Business ICT</div>
            <div class="name">${name || 'Enterprise Asset'}</div>
            <div class="sku">${sku || value}</div>
            ${serialNumber ? `<div class="sn">S/N: ${serialNumber}</div>` : ''}
            <div>
              <svg width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}">
                ${bars
                  .map((isBar, idx) =>
                    isBar
                      ? `<rect x="${idx * barWidth}" y="0" width="${barWidth - 0.2}" height="${height}" fill="#000" />`
                      : ''
                  )
                  .join('')}
              </svg>
            </div>
            <div class="code-text">${value}</div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="bg-slate-900/90 border border-slate-750 rounded-xl p-3 inline-flex flex-col items-center select-none shadow-sm">
      <div className="flex items-center justify-between w-full mb-1.5 px-1">
        <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-semibold">
          Asset Code128
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            title="Copy barcode string"
            className="text-slate-400 hover:text-white p-1 rounded transition-colors text-xs flex items-center gap-1"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
          {showPrintBtn && (
            <button
              type="button"
              onClick={handlePrint}
              title="Print Asset Label"
              className="text-slate-400 hover:text-cyan-400 p-1 rounded transition-colors text-xs flex items-center gap-1"
            >
              <Printer className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-2 rounded-lg flex flex-col items-center shadow-inner">
        <svg
          width={Math.min(totalWidth, 240)}
          height={38}
          viewBox={`0 0 ${totalWidth} ${height}`}
          className="w-full max-w-[240px]"
        >
          {bars.map((isBar, idx) =>
            isBar ? (
              <rect
                key={idx}
                x={idx * barWidth}
                y="0"
                width={barWidth - 0.2}
                height={height}
                fill="#0f172a"
              />
            ) : null
          )}
        </svg>
        <span className="font-mono text-[11px] tracking-widest text-slate-800 font-bold mt-1">
          {value}
        </span>
      </div>
    </div>
  );
};
