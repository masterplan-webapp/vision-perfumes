import { Order } from '../types';
import { UserProfile } from '../types';

const downloadCSV = (rows: string[][], filename: string) => {
  const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = rows.map(row => row.map(escape).join(',')).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportOrdersCSV = (orders: Order[]) => {
  const headers = ['ID', 'Data', 'Cliente', 'Email', 'CPF/CNPJ', 'Total (R$)', 'Frete (R$)', 'Desconto (R$)', 'Cupom', 'Pagamento', 'Status', 'Rastreio'];
  const rows = orders.map(o => [
    o.id,
    new Date(o.createdAt).toLocaleDateString('pt-BR'),
    o.customerName,
    o.customerEmail,
    o.customerDocument || '',
    o.total.toFixed(2),
    (o.shippingCost ?? 0).toFixed(2),
    (o.discount ?? 0).toFixed(2),
    o.couponCode || '',
    o.paymentMethod || '',
    o.status,
    o.trackingCode || '',
  ]);
  downloadCSV([headers, ...rows], `pedidos_${new Date().toISOString().slice(0, 10)}.csv`);
};

export const exportClientsCSV = (clients: UserProfile[]) => {
  const headers = ['UID', 'Nome', 'Email', 'Telefone', 'Cidade', 'Estado'];
  const rows = clients.map(c => [
    c.uid,
    c.displayName || '',
    c.email,
    c.phone || '',
    c.defaultAddress?.city || '',
    c.defaultAddress?.state || '',
  ]);
  downloadCSV([headers, ...rows], `clientes_${new Date().toISOString().slice(0, 10)}.csv`);
};
