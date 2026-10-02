// Professional Structured Invoice Bill Generator for Sky Fire Crackers Sivakasi

export function generateStructuredInvoiceHtml(order) {
  const isPaid =
    order.paymentStatus?.toLowerCase() === 'completed' ||
    order.paymentStatus?.toLowerCase() === 'paid' ||
    order.paymentStatus?.toLowerCase() === 'success'

  const items = order.items || []
  const subtotal = order.subTotal || order.subtotal || order.totalAmount || order.total || 0
  const discount = order.discountAmount || order.discount || 0
  const delivery = order.deliveryFee || order.delivery || 0
  const grandTotal = order.totalAmount || order.total || 0

  const customerName = order.customerName || order.customer?.name || 'Valued Customer'
  const customerPhone = order.customerPhone || order.customer?.phone || 'N/A'
  const customerAddress = order.deliveryAddress || order.customer?.address || 'Tamil Nadu, India'
  const orderNumber = order.orderNumber || order.orderId || 'SFC-' + Date.now()
  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${orderNumber} - Sky Fire Crackers</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: #f1f5f9; padding: 20px; color: #0f172a; }
    .invoice-card { max-width: 820px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 25px rgba(0,0,0,0.08); overflow: hidden; border: 1px solid #e2e8f0; }
    .header-bar { background: linear-gradient(135deg, #0b132b 0%, #1c2541 100%); color: #ffffff; padding: 30px; border-bottom: 4px solid #ffa000; position: relative; }
    .brand-title { font-size: 26px; font-weight: 900; letter-spacing: 0.5px; color: #ffa000; display: flex; align-items: center; gap: 8px; }
    .brand-sub { font-size: 13px; color: #94a3b8; margin-top: 4px; }
    .invoice-badge-title { position: absolute; right: 30px; top: 30px; text-align: right; }
    .invoice-badge-title h2 { font-size: 20px; color: #ffffff; font-weight: 800; letter-spacing: 1px; }
    .invoice-badge-title p { font-size: 12px; color: #cbd5e1; }
    
    .status-banner { padding: 14px 30px; font-weight: 800; font-size: 14px; display: flex; justify-content: space-between; align-items: center; }
    .status-pending { background-color: #fef3c7; color: #92400e; border-bottom: 2px solid #fcd34d; }
    .status-completed { background-color: #dcfce7; color: #166534; border-bottom: 2px solid #86efac; }
    .status-tag { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 900; text-transform: uppercase; }
    .tag-pending { background-color: #b45309; color: #ffffff; }
    .tag-completed { background-color: #15803d; color: #ffffff; }

    .content-body { padding: 30px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1.5px dashed #e2e8f0; }
    .meta-box h4 { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 800; margin-bottom: 6px; letter-spacing: 0.5px; }
    .meta-box p { font-size: 14px; color: #1e293b; line-height: 1.5; }
    .meta-box .strong-name { font-size: 16px; font-weight: 800; color: #0b132b; }

    table.items-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
    table.items-table th { background-color: #f8fafc; color: #475569; font-weight: 800; font-size: 12px; text-transform: uppercase; padding: 12px 14px; text-align: left; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #cbd5e1; }
    table.items-table td { padding: 12px 14px; font-size: 13.5px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
    table.items-table tr:nth-child(even) { background-color: #fafbfc; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .qty-chip { background-color: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 12px; font-weight: 800; font-size: 12px; display: inline-block; }

    .summary-section { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 25px; }
    .terms-box { flex: 1; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 11.5px; color: #64748b; line-height: 1.6; }
    .terms-box strong { color: #0f172a; }
    .calc-table { width: 300px; }
    .calc-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13.5px; color: #475569; }
    .calc-row.discount { color: #16a34a; font-weight: 700; }
    .calc-row.grand-total { border-top: 2px solid #0b132b; margin-top: 8px; padding-top: 10px; font-size: 18px; font-weight: 900; color: #0b132b; }

    .footer-bar { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 30px; text-align: center; font-size: 12px; color: #64748b; }
    .actions-bar { max-width: 820px; margin: 15px auto 0 auto; display: flex; justify-content: flex-end; gap: 12px; }
    .btn { padding: 9px 20px; border-radius: 6px; font-weight: 800; font-size: 13px; cursor: pointer; border: none; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
    .btn-print { background-color: #0b132b; color: #ffa000; }
    .btn-close { background-color: #cbd5e1; color: #0f172a; }
    @media print {
      body { background-color: #ffffff; padding: 0; }
      .invoice-card { box-shadow: none; border: none; }
      .actions-bar { display: none !important; }
    }
  </style>
</head>
<body>

  <div class="actions-bar">
    <button class="btn btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>

  <div class="invoice-card">
    <div class="header-bar">
      <div class="brand-title">
        ✨ SKY FIRE CRACKERS SIVAKASI
      </div>
      <div class="brand-sub">
        Direct Wholesale Fireworks • Sivakasi Factories Outlet • Tamil Nadu, India
      </div>
      <div class="brand-sub">
        GST Reg: 33AAACF1234D1Z5 | Transport Parcel Dispatch Division
      </div>

      <div class="invoice-badge-title">
        <h2>TAX INVOICE</h2>
        <p>Booking ID: <strong>#${orderNumber}</strong></p>
        <p>Date: ${orderDate}</p>
      </div>
    </div>

    <!-- PAYMENT STATUS BANNER -->
    <div class="status-banner ${isPaid ? 'status-completed' : 'status-pending'}">
      <div>
        ${isPaid 
          ? '✔ PAYMENT STATUS: COMPLETED (PAID ONLINE VIA RAZORPAY / UPI)' 
          : '⚠️ PAYMENT STATUS: PENDING (ONLINE PAYMENT DUE / PAY LATER)'}
      </div>
      <div class="status-tag ${isPaid ? 'tag-completed' : 'tag-pending'}">
        ${isPaid ? 'PAID' : 'PAYMENT PENDING'}
      </div>
    </div>

    <div class="content-body">
      <!-- CUSTOMER & ORDER META -->
      <div class="meta-grid">
        <div class="meta-box">
          <h4>Billed & Dispatched To:</h4>
          <p class="strong-name">${customerName}</p>
          <p>📞 +91 ${customerPhone}</p>
          <p>📍 ${customerAddress}</p>
        </div>

        <div class="meta-box">
          <h4>Booking & Delivery Info:</h4>
          <p><strong>Booking Ref:</strong> #${orderNumber}</p>
          <p><strong>Payment Option:</strong> ${order.paymentMethod || 'Online Payment'}</p>
          <p><strong>Dispatched Via:</strong> Direct Sivakasi Transport Hub</p>
          <p><strong>Dispatch Status:</strong> ${order.orderStatus || 'Confirmed & Packing'}</p>
        </div>
      </div>

      <!-- CRACKER ITEMS TABLE -->
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 40px;" class="text-center">#</th>
            <th>Cracker Product Description</th>
            <th class="text-center" style="width: 120px;">Quantity</th>
            <th class="text-right" style="width: 120px;">Unit Rate (₹)</th>
            <th class="text-right" style="width: 130px;">Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item, idx) => {
            const name = item.product?.name || item.productName || 'Crackers Item'
            const qty = item.quantity || 1
            const price = item.product?.discountPrice || item.unitPrice || 0
            const total = item.totalPrice || (price * qty)
            return `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td><strong>${name}</strong></td>
                <td class="text-center"><span class="qty-chip">${qty} Box(es)</span></td>
                <td class="text-right">₹${price}</td>
                <td class="text-right"><strong>₹${total}</strong></td>
              </tr>
            `
          }).join('')}
        </tbody>
      </table>

      <!-- FINANCIAL SUMMARY & TERMS -->
      <div class="summary-section">
        <div class="terms-box">
          <strong>Important Instructions & Sivakasi Wholesale Terms:</strong>
          <p>1. Store fireworks in a cool, dry place away from flame sources.</p>
          <p>2. Direct Sivakasi wholesale transport dispatch to customer door/nearest transport parcel office.</p>
          <p>3. Online payment reference must be preserved for transport parcel collection.</p>
          <p>4. All crackers are 100% certified green crackers adhering to environmental safety norms.</p>
        </div>

        <div class="calc-table">
          <div class="calc-row">
            <span>Items Subtotal:</span>
            <span>₹${subtotal}</span>
          </div>
          ${discount > 0 ? `
          <div class="calc-row discount">
            <span>Wholesale Discount:</span>
            <span>-₹${discount}</span>
          </div>` : ''}
          <div class="calc-row">
            <span>Transport Booking:</span>
            <span style="color: #16a34a; font-weight: 700;">FREE (₹0)</span>
          </div>
          <div class="calc-row grand-total">
            <span>FINAL TOTAL:</span>
            <span>₹${grandTotal}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      ✨ <strong>Thank you for choosing Sky Fire Crackers Sivakasi! Wishing you a Safe, Sparkling & Prosperous Diwali!</strong> ✨
    </div>
  </div>
</body>
</html>`
}

export function downloadStructuredInvoice(order) {
  const htmlContent = generateStructuredInvoiceHtml(order)
  const orderNumber = order.orderNumber || order.orderId || 'SFC-' + Date.now()

  // 1. Download HTML file
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Invoice_${orderNumber}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // 2. Open printable invoice window directly for immediate view & print
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }
}
