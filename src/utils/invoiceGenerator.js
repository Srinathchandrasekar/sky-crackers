// Professional Structured Invoice Bill Generator for Sky Fire Crackers Sivakasi

export function generateStructuredInvoiceHtml(order) {
  const isPaid =
    order.paymentStatus?.toLowerCase() === 'completed' ||
    order.paymentStatus?.toLowerCase() === 'paid' ||
    order.paymentStatus?.toLowerCase() === 'success'

  const items = order.items || order.Items || order.orderItems || order.OrderItems || []
  const subtotal = order.subTotal || order.subtotal || order.totalAmount || order.total || 0
  const discount = order.discountAmount || order.discount || 0
  const grandTotal = order.totalAmount || order.total || 0

  let customerName = order.customerName || order.customer?.name || order.customer?.fullName || 'Valued Customer'
  if (typeof customerName === 'string' && (customerName.startsWith('Razorpay Payment ID:') || customerName.startsWith('Online Payment Pending'))) {
    customerName = order.customer?.fullName || order.customer?.name || 'Valued Customer'
  }
  const customerPhone = order.customerPhone || order.customer?.phone || order.customer?.mobileNumber || 'N/A'
  let customerAddress = order.deliveryAddress || order.customer?.address || ''
  if (!customerAddress || customerAddress === 'Direct Sivakasi Transport' || customerAddress === 'Tamil Nadu, India') {
    if (order.customer?.address) {
      customerAddress = order.customer.address
    } else if (order.customer?.doorNumber || order.customer?.streetName) {
      customerAddress = [order.customer.doorNumber, order.customer.streetName, order.customer.area, order.customer.city, order.customer.district, order.customer.pinCode].filter(Boolean).join(', ')
    }
  }
  if (!customerAddress) customerAddress = 'Tamil Nadu, India'
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
    .invoice-card { max-width: 820px; margin: 0 auto; background: #ffffff; border-radius: 14px; box-shadow: 0 6px 30px rgba(0,0,0,0.08); overflow: hidden; border: 1.5px solid #e2e8f0; }
    .header-bar { background: linear-gradient(135deg, #0b132b 0%, #1c2541 100%); color: #ffffff; padding: 28px 30px; border-bottom: 4px solid #ffa000; position: relative; }
    .brand-title { font-size: 26px; font-weight: 900; letter-spacing: 0.5px; color: #ffa000; display: flex; align-items: center; gap: 8px; }
    .brand-sub { font-size: 13.5px; color: #e2e8f0; margin-top: 4px; font-weight: 700; letter-spacing: 0.3px; }
    .brand-addr { font-size: 12.5px; color: #cbd5e1; margin-top: 6px; line-height: 1.4; }
    .brand-contact { font-size: 12px; color: #fcd34d; margin-top: 4px; font-weight: 600; }
    .invoice-badge-title { position: absolute; right: 30px; top: 28px; text-align: right; }
    .invoice-badge-title h2 { font-size: 22px; color: #ffffff; font-weight: 900; letter-spacing: 1px; }
    .invoice-badge-title p { font-size: 12px; color: #cbd5e1; margin-top: 2px; }
    
    .status-banner { padding: 13px 30px; font-weight: 800; font-size: 13.5px; display: flex; justify-content: space-between; align-items: center; }
    .status-pending { background-color: #fef3c7; color: #92400e; border-bottom: 2px solid #fcd34d; }
    .status-completed { background-color: #dcfce7; color: #166534; border-bottom: 2px solid #86efac; }
    .status-tag { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 900; text-transform: uppercase; }
    .tag-pending { background-color: #b45309; color: #ffffff; }
    .tag-completed { background-color: #15803d; color: #ffffff; }

    .content-body { padding: 28px 30px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 22px; padding-bottom: 18px; border-bottom: 1.5px dashed #e2e8f0; }
    .meta-box h4 { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 800; margin-bottom: 6px; letter-spacing: 0.5px; }
    .meta-box p { font-size: 13.5px; color: #1e293b; line-height: 1.5; }
    .meta-box .strong-name { font-size: 16px; font-weight: 800; color: #0b132b; }

    table.items-table { width: 100%; border-collapse: collapse; margin-bottom: 22px; }
    table.items-table th { background-color: #f8fafc; color: #475569; font-weight: 800; font-size: 11.5px; text-transform: uppercase; padding: 11px 14px; text-align: left; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #cbd5e1; }
    table.items-table td { padding: 11px 14px; font-size: 13px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
    table.items-table tr:nth-child(even) { background-color: #fafbfc; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .qty-chip { background-color: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 12px; font-weight: 800; font-size: 12px; display: inline-block; }

    .summary-section { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 24px; }
    .terms-box { flex: 1; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px; color: #475569; line-height: 1.6; }
    .terms-box strong { color: #0b132b; display: block; margin-bottom: 6px; font-size: 12.5px; }
    .calc-table { width: 330px; }
    .calc-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13.5px; color: #475569; }
    .calc-row.discount { color: #16a34a; font-weight: 700; }
    .calc-row.grand-total { border-top: 2px solid #0b132b; margin-top: 8px; padding-top: 10px; font-size: 18px; font-weight: 900; color: #0b132b; }

    /* 3D Festive Greeting Banner */
    .festive-3d-card {
      margin-top: 20px;
      padding: 18px 24px;
      background: linear-gradient(135deg, #ffa000 0%, #ff6f00 50%, #d84315 100%);
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(255, 111, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.4), inset 0 -3px 6px rgba(0, 0, 0, 0.2);
      border: 1px solid #ffcc80;
      text-align: center;
      color: #ffffff;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
    }
    .festive-title {
      font-size: 19px;
      font-weight: 900;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .festive-sub {
      font-size: 13.5px;
      font-weight: 700;
      color: #fff9c4;
      margin-bottom: 8px;
    }
    .festive-helpdesk {
      font-size: 12.5px;
      color: #ffffff;
      background: rgba(0, 0, 0, 0.2);
      padding: 6px 14px;
      border-radius: 20px;
      display: inline-block;
      font-weight: 800;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .footer-bar { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 30px; text-align: center; font-size: 12px; color: #64748b; }
    .actions-bar { max-width: 820px; margin: 15px auto 0 auto; display: flex; justify-content: flex-end; gap: 12px; }
    .btn { padding: 9px 20px; border-radius: 6px; font-weight: 800; font-size: 13px; cursor: pointer; border: none; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
    .btn-print { background-color: #0b132b; color: #ffa000; }
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
        ✨ SKY FIRE CRACKERS
      </div>
      <div class="brand-sub">
        Direct Wholesale Fire Crackers
      </div>
      <div class="brand-addr">
        📍 No 68, Virudhunagar Road, Anaikottam, Sivakasi - 626 130, Tamil Nadu
      </div>
      <div class="brand-contact">
        📞 +91 95971 67401 / +91 80567 04353 &nbsp;|&nbsp; ✉️ skyfirecrackers@gmail.com
      </div>

      <div class="invoice-badge-title">
        <h2>ORDER INVOICE</h2>
        <p>Booking Ref: <strong>#${orderNumber}</strong></p>
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
          <h4>Customer Delivery Details:</h4>
          <p class="strong-name">${customerName}</p>
          <p>📞 +91 ${customerPhone}</p>
          <p>📍 ${customerAddress}</p>
        </div>

        <div class="meta-box">
          <h4>Booking Information:</h4>
          <p><strong>Booking Ref:</strong> #${orderNumber}</p>
          <p><strong>Payment Option:</strong> ${order.paymentMethod || 'Online Payment'}</p>
          <p><strong>Order Status:</strong> ${order.orderStatus || 'Confirmed & Packing'}</p>
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
            const name = item.product?.name || item.productName || item.ProductName || 'Crackers Item'
            const qty = item.quantity || item.Quantity || 1
            const price = item.product?.discountPrice || item.unitPrice || item.UnitPrice || 0
            const total = item.totalPrice || item.TotalPrice || (price * qty)
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

      <!-- FINANCIAL SUMMARY & INSTRUCTIONS -->
      <div class="summary-section">
        <div class="terms-box">
          <strong>Important Instructions & Transport Policy:</strong>
          <p>• <strong>Transport Dispatch:</strong> Products dispatched to customer door / nearest transport parcel office (Transport charges To-Pay upon collecting parcel).</p>
          <p>• <strong>Tracking:</strong> You will receive Lorry Receipt (LR) tracking copy via SMS/WhatsApp once booked with transport carrier.</p>
          <p>• <strong>Safety:</strong> Store fireworks in a cool, dry place. All crackers are 100% certified green crackers.</p>
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
            <span>Delivery Charges:</span>
            <span style="color: #d97706; font-weight: 700; font-size: 11.5px;">To Pay at Delivery (Transport)</span>
          </div>
          <div class="calc-row grand-total">
            <span>BOOKING TOTAL:</span>
            <span>₹${grandTotal}</span>
          </div>
        </div>
      </div>

      <!-- 3D FESTIVE CELEBRATION & HELPDESK BANNER -->
      <div class="festive-3d-card">
        <div class="festive-title">
          🎉 பாதுகாப்பா தீபாவளி என்ஜாய் பண்ணுங்க! 🪔
        </div>
        <div class="festive-sub">
          ✨ Advance Happy & Safe Diwali Wishes from Sky Fire Crackers Sivakasi! ✨
        </div>
        <div class="festive-helpdesk">
          📞 Any doubts / inquiries? Call our Support Helpdesk: +91 95971 67401 / +91 80567 04353
        </div>
      </div>
    </div>

    <div class="footer-bar">
      © 2026 all rights sky fire crackers • Sivakasi, Tamil Nadu
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
