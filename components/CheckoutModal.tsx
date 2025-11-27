
import React, { useState, useRef, useEffect } from 'react';
import { X, MapPin, CreditCard, CheckCircle, Loader2, Lock, FileText, Phone, Search, Truck, QrCode, Barcode, Copy, Tag } from 'lucide-react';
import { CartItem, Address, SiteSettings, ShippingOption, Coupon } from '../types';
import { createOrder } from '../services/orderService';
import { calculateShipping } from '../services/frenetService';
import { processPayment, isValidCardNumber, PaymentMethod } from '../services/pagarmeService';
import { sendOrderConfirmationEmail, sendAdminNewOrderEmail } from '../services/notificationService';
import { validateCoupon, incrementCouponUsage } from '../services/couponService';
import { getUserProfile } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  total: number; 
  onSuccess: () => void;
  siteSettings?: SiteSettings;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, cartItems, onSuccess, siteSettings }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false); 
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [step, setStep] = useState<'address' | 'payment' | 'success'>('address');
  
  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [paymentResultData, setPaymentResultData] = useState<any>(null);

  // Shipping State
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [shippingCost, setShippingCost] = useState(0);

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  // Total Final: Subtotal + Frete - Desconto
  const finalTotal = Math.max(0, subtotal + shippingCost - discountAmount);

  // Refs for focus management
  const numberInputRef = useRef<HTMLInputElement>(null);

  // Contact Data
  const [document, setDocument] = useState(''); // CPF
  const [phone, setPhone] = useState('');

  // Credit Card Data
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  const [address, setAddress] = useState<Address>({
    zip: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  });

  // Reset state when modal opens
  useEffect(() => {
      if (isOpen) {
          setStep('address');
          setShippingCost(0);
          setShippingOptions([]);
          setSelectedShipping(null);
          setPaymentMethod('credit_card');
          setPaymentResultData(null);
          setCardNumber('');
          setCardExpiry('');
          setCardCvv('');
          setCardName('');
          
          // Reset Coupon
          setCouponCode('');
          setAppliedCoupon(null);
          setDiscountAmount(0);
          
          // Load User Profile Data
          if (user) {
              getUserProfile(user.uid).then(profile => {
                  if (profile) {
                      if (profile.phone) setPhone(profile.phone);
                      if (profile.defaultAddress) {
                          setAddress(profile.defaultAddress);
                          // Trigger shipping calculation if zip exists
                          if (profile.defaultAddress.zip.length >= 8) {
                              handleCalculateShipping(profile.defaultAddress.zip.replace(/\D/g, ''));
                          }
                      }
                  }
              });
          }
      }
  }, [isOpen, user]);

  const handleApplyCoupon = async () => {
      if (!couponCode) return;
      setCouponLoading(true);
      try {
          const result = await validateCoupon(couponCode.toUpperCase(), subtotal);
          if (result.isValid && result.coupon) {
              setAppliedCoupon(result.coupon);
              setDiscountAmount(result.discount);
              addToast(`Cupom ${result.coupon.code} aplicado!`, 'success');
          } else {
              setAppliedCoupon(null);
              setDiscountAmount(0);
              addToast(result.message, 'error');
          }
      } catch (error) {
          addToast("Erro ao validar cupom.", 'error');
      } finally {
          setCouponLoading(false);
      }
  };

  const handleRemoveCoupon = () => {
      setAppliedCoupon(null);
      setDiscountAmount(0);
      setCouponCode('');
  };

  if (!isOpen || !user) return null;

  const handleCreateOrder = async () => {
    // Validate Card if selected
    if (paymentMethod === 'credit_card') {
        if (!cardNumber || !cardExpiry || !cardCvv || !cardName) {
            addToast("Preencha todos os dados do cartão.", "error");
            return;
        }
    }

    setLoading(true);
    try {
      // 0. Process Payment
      const paymentResult = await processPayment(
          finalTotal,
          paymentMethod,
          {
              name: user.displayName || 'Cliente',
              email: user.email || '',
              document: document,
              type: 'individual',
              phones: {
                  mobile_phone: {
                      country_code: '55',
                      area_code: phone.substring(1, 3),
                      number: phone.substring(5).replace('-', '')
                  }
              }
          },
          cartItems,
          address,
          siteSettings?.pagarmePublicKey || '',
          paymentMethod === 'credit_card' ? {
              number: cardNumber,
              holderName: cardName,
              expirationDate: cardExpiry,
              cvv: cardCvv
          } : undefined
      );

      if (!paymentResult.success) {
          throw new Error(paymentResult.error || "Pagamento recusado.");
      }

      setPaymentResultData(paymentResult);

      // 1. Create Order in Database
      const orderId = await createOrder(
        user.uid,
        user.displayName || 'Cliente',
        user.email || '',
        cartItems,
        finalTotal,
        subtotal,
        discountAmount,
        appliedCoupon?.code,
        address,
        document,
        phone
      );

      // 2. Increment Coupon Usage if applicable
      if (appliedCoupon?.id) {
          await incrementCouponUsage(appliedCoupon.id);
      }

      // 3. Send Notifications
      const fullOrderObj = {
        id: orderId,
        userId: user.uid,
        customerName: user.displayName || 'Cliente',
        customerEmail: user.email || '',
        customerDocument: document,
        customerPhone: phone,
        items: cartItems,
        total: finalTotal,
        subtotal: subtotal,
        discount: discountAmount,
        couponCode: appliedCoupon?.code,
        status: 'pending',
        createdAt: new Date().toISOString(),
        shippingAddress: address,
        shippingOption: selectedShipping?.name,
        shippingCost: shippingCost,
        paymentMethod: paymentMethod
      };

      try {
        await Promise.all([
           sendOrderConfirmationEmail(fullOrderObj as any),
           sendAdminNewOrderEmail(fullOrderObj as any)
        ]);
      } catch (emailErr) {
        console.error("Failed to queue emails", emailErr);
      }

      setStep('success');
      addToast('Pedido realizado com sucesso!', 'success');
      
      if (paymentMethod === 'credit_card') {
          setTimeout(() => {
            onSuccess();
          }, 3000);
      }
    } catch (error: any) {
      console.error(error);
      addToast(error.message || 'Erro ao processar pedido. Tente novamente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.street || !address.number || !address.city || !address.state || !address.zip) {
        addToast('Preencha todos os campos de endereço.', 'error');
        return;
    }
    if (!document || !phone) {
        addToast('CPF e Telefone são obrigatórios para emissão da nota.', 'error');
        return;
    }
    if (!selectedShipping) {
        addToast('Selecione uma opção de frete.', 'error');
        return;
    }
    setStep('payment');
  };

  const handleCalculateShipping = async (destZip: string) => {
    const originZip = siteSettings?.originZip || '01001-000';
    const frenetToken = siteSettings?.frenetToken;
    const threshold = siteSettings?.freeShippingThreshold || 0; // Default to 0 if not set

    setIsLoadingShipping(true);
    setShippingOptions([]);
    setSelectedShipping(null);
    setShippingCost(0);
    try {
      const options = await calculateShipping(originZip, destZip, cartItems, subtotal, frenetToken, threshold);
      setShippingOptions(options);
      if (options.length > 0) {
        const cheapest = options.reduce((prev, curr) => prev.price < curr.price ? prev : curr);
        setSelectedShipping(cheapest);
        setShippingCost(cheapest.price);
      } else if (frenetToken) {
         addToast('Não foi possível calcular o frete para este CEP.', 'error');
      }
    } catch (error) {
      console.error(error);
      addToast('Erro ao calcular frete.', 'error');
    } finally {
      setIsLoadingShipping(false);
    }
  };

  const handleFetchAddress = async () => {
    const cleanCep = address.zip.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      addToast('CEP inválido.', 'error');
      return;
    }
    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      if (data.erro) {
        addToast('CEP não encontrado.', 'error');
        return;
      }
      setAddress(prev => ({ ...prev, street: data.logradouro, neighborhood: data.bairro, city: data.localidade, state: data.uf }));
      addToast('Endereço encontrado!', 'success');
      await handleCalculateShipping(cleanCep);
      setTimeout(() => { numberInputRef.current?.focus(); }, 100);
    } catch (error) {
      addToast('Erro ao buscar endereço.', 'error');
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 8) val = val.slice(0, 8);
    if (val.length > 5) val = val.replace(/^(\d{5})(\d)/, '$1-$2');
    setAddress({...address, zip: val});
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value.replace(/\D/g, '');
      if (val.length > 11) val = val.slice(0, 11);
      if (val.length > 2) val = val.replace(/^(\d{2})(\d)/, '($1) $2');
      if (val.length > 7) val = val.replace(/(\d{5})(\d)/, '$1-$2');
      setPhone(val);
  };
  
  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value.replace(/\D/g, '');
      if (val.length > 14) val = val.slice(0, 14);
      if (val.length <= 11) {
        val = val.replace(/(\d{3})(\d)/, '$1.$2'); val = val.replace(/(\d{3})(\d)/, '$1.$2'); val = val.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      } else {
        val = val.replace(/^(\d{2})(\d)/, '$1.$2'); val = val.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3'); val = val.replace(/\.(\d{3})(\d)/, '.$1/$2'); val = val.replace(/(\d{4})(\d)/, '$1-$2');
      }
      setDocument(val);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 16) val = val.slice(0, 16);
    val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(val);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.slice(0, 4);
    if (val.length > 2) val = val.replace(/^(\d{2})(\d)/, '$1/$2');
    setCardExpiry(val);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
        {step !== 'success' && (
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10">
            <X size={24} />
          </button>
        )}

        <div className="p-8 overflow-y-auto custom-scrollbar">
          <h2 className="font-serif text-2xl font-bold text-primary mb-6 text-center">
            {step === 'address' && 'Dados de Entrega'}
            {step === 'payment' && 'Pagamento'}
            {step === 'success' && 'Pedido Confirmado!'}
          </h2>

          {step === 'address' && (
            <form onSubmit={handleAddressSubmit} className="space-y-4">
              {/* Copied Address Form Fields from previous version for brevity */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-3 mb-4 border border-gray-100">
                  <h4 className="font-bold text-sm text-gray-600 uppercase tracking-wider">Dados Pessoais</h4>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input required type="text" placeholder="CPF / CNPJ" value={document} onChange={handleDocumentChange} className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-accent-gold outline-none" />
                      </div>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input required type="tel" placeholder="(DDD) Celular" value={phone} onChange={handlePhoneChange} className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-accent-gold outline-none" />
                      </div>
                  </div>
              </div>
              <h4 className="font-bold text-sm text-gray-600 uppercase tracking-wider">Endereço</h4>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">CEP</label>
                    <input required type="text" placeholder="00000-000" value={address.zip} onChange={handleZipChange} maxLength={9} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-accent-gold outline-none" />
                  </div>
                  <div className="flex items-end">
                      <button type="button" onClick={handleFetchAddress} disabled={isLoadingCep || address.zip.length < 8} className="mb-[2px] h-[42px] w-full text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isLoadingCep ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Buscar
                      </button>
                  </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Logradouro</label>
                <input required type="text" placeholder="Rua..." value={address.street} onChange={e => setAddress({...address, street: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-accent-gold outline-none" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Número</label>
                    <input required ref={numberInputRef} type="text" value={address.number} onChange={e => setAddress({...address, number: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-accent-gold outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Complemento</label>
                    <input type="text" placeholder="Opcional" value={address.complement} onChange={e => setAddress({...address, complement: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-accent-gold outline-none" />
                  </div>
              </div>
              <div>
                 <label className="block text-xs font-medium text-gray-700 mb-1">Bairro</label>
                 <input required type="text" value={address.neighborhood} onChange={e => setAddress({...address, neighborhood: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-accent-gold outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cidade</label>
                  <input required type="text" value={address.city} onChange={e => setAddress({...address, city: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-accent-gold outline-none bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
                  <input required type="text" placeholder="UF" maxLength={2} value={address.state} onChange={e => setAddress({...address, state: e.target.value.toUpperCase()})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-accent-gold outline-none bg-gray-50" />
                </div>
              </div>

              {isLoadingShipping ? (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 flex flex-col items-center justify-center gap-2">
                   <Loader2 className="animate-spin text-accent-gold" />
                   <span className="text-xs font-bold text-gray-500">Calculando frete...</span>
                </div>
              ) : shippingOptions.length > 0 && (
                <div className="mt-4">
                   <h4 className="font-bold text-sm text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-2"><Truck size={16} /> Opções de Envio</h4>
                   <div className="space-y-2">
                      {shippingOptions.map((opt, idx) => (
                        <label key={idx} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${selectedShipping?.name === opt.name ? 'border-accent-gold bg-accent-gold/5 ring-1 ring-accent-gold' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                          <div className="flex items-center gap-3">
                            <input type="radio" name="shipping" className="accent-accent-gold" checked={selectedShipping?.name === opt.name} onChange={() => { setSelectedShipping(opt); setShippingCost(opt.price); }} />
                            <div>
                              <p className="text-sm font-bold text-gray-800">{opt.name} <span className="text-xs font-normal text-gray-500">({opt.carrier})</span></p>
                              <p className="text-xs text-gray-500">{opt.deadline}</p>
                            </div>
                          </div>
                          <span className={`font-bold text-sm ${opt.price === 0 ? 'text-green-600' : 'text-primary'}`}>
                              {opt.price === 0 ? 'GRÁTIS' : `R$ ${opt.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                          </span>
                        </label>
                      ))}
                   </div>
                </div>
              )}
              <button type="submit" disabled={!selectedShipping} className="w-full mt-4 bg-primary text-white py-3 rounded-lg font-bold hover:bg-accent-gold transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">Ir para Pagamento</button>
            </form>
          )}

          {step === 'payment' && (
            <div className="space-y-6">
              {/* Order Summary with Coupon */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between mb-2 text-sm">
                   <span>Subtotal</span>
                   <span>R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between mb-2 text-sm">
                   <span>Frete ({selectedShipping?.name})</span>
                   <span className={`font-medium ${shippingCost === 0 ? 'text-green-600 font-bold' : 'text-primary'}`}>
                       {shippingCost === 0 ? 'GRÁTIS' : `R$ ${shippingCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                   </span>
                </div>
                
                {/* Coupon Field */}
                <div className="py-3 border-t border-gray-200 mt-2">
                    {appliedCoupon ? (
                        <div className="flex justify-between items-center bg-green-50 border border-green-100 p-2 rounded-lg">
                            <span className="text-xs font-bold text-green-700 flex items-center gap-1">
                                <Tag size={12} /> Cupom {appliedCoupon.code}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-green-700">- R$ {discountAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                <button onClick={handleRemoveCoupon} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="Cupom de desconto" 
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                className="flex-1 p-2 text-sm border border-gray-300 rounded-lg focus:border-accent-gold outline-none uppercase"
                            />
                            <button 
                                onClick={handleApplyCoupon}
                                disabled={!couponCode || couponLoading}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
                            >
                                {couponLoading ? <Loader2 size={14} className="animate-spin" /> : 'Aplicar'}
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex justify-between font-bold text-lg pt-3 border-t border-gray-200 mt-2">
                   <span>Total Final</span>
                   <span className="text-accent-gold">R$ {finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="flex gap-2 mb-4">
                  {[
                      { id: 'credit_card', label: 'Cartão', icon: CreditCard },
                      { id: 'pix', label: 'Pix', icon: QrCode },
                      { id: 'boleto', label: 'Boleto', icon: Barcode },
                  ].map(method => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                        className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                            paymentMethod === method.id 
                            ? 'border-accent-gold bg-accent-gold text-white shadow-md' 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                          <method.icon size={20} className="mb-1" />
                          <span className="text-xs font-bold">{method.label}</span>
                      </button>
                  ))}
              </div>

              {/* Credit Card Form */}
              {paymentMethod === 'credit_card' && (
                <div className="space-y-4 animate-fade-in">
                    <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="Número do Cartão" value={cardNumber} onChange={handleCardNumberChange} className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:border-accent-gold outline-none ${isValidCardNumber(cardNumber) ? 'border-green-300 bg-green-50' : 'border-gray-300'}`} />
                        {cardNumber.length > 10 && isValidCardNumber(cardNumber) && (<CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" size={18} />)}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="MM/AA" value={cardExpiry} onChange={handleExpiryChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-accent-gold outline-none" />
                        <input type="text" placeholder="CVC" value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0,4))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-accent-gold outline-none" />
                    </div>
                    <input type="text" placeholder="Nome no Cartão" value={cardName} onChange={e => setCardName(e.target.value.toUpperCase())} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-accent-gold outline-none uppercase" />
                </div>
              )}

              {/* Pix Instructions */}
              {paymentMethod === 'pix' && (
                  <div className="text-center p-6 bg-green-50 rounded-xl border border-green-100 animate-fade-in">
                      <QrCode className="mx-auto text-green-600 mb-3" size={48} />
                      <h4 className="font-bold text-green-800 mb-2">Pagamento Instantâneo</h4>
                      <p className="text-sm text-green-700 mb-4">
                          Ao finalizar o pedido, um QR Code será gerado para você escanear no app do seu banco.
                          A aprovação é imediata.
                      </p>
                  </div>
              )}

              {/* Boleto Instructions */}
              {paymentMethod === 'boleto' && (
                  <div className="text-center p-6 bg-yellow-50 rounded-xl border border-yellow-100 animate-fade-in">
                      <Barcode className="mx-auto text-yellow-600 mb-3" size={48} />
                      <h4 className="font-bold text-yellow-800 mb-2">Boleto Bancário</h4>
                      <p className="text-sm text-yellow-700 mb-4">
                          O boleto será gerado na próxima tela. Você poderá imprimir ou copiar o código de barras.
                          O prazo de compensação é de até 3 dias úteis.
                      </p>
                  </div>
              )}

              <div className="flex items-center gap-2 text-xs text-gray-500 justify-center mt-4">
                  <Lock size={12} />
                  Ambiente Seguro. Processado via Pagar.me V5.
              </div>

              <div className="flex gap-3 pt-4">
                  <button onClick={() => setStep('address')} className="flex-1 py-3 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50">Voltar</button>
                  <button 
                    onClick={handleCreateOrder}
                    disabled={loading || (paymentMethod === 'credit_card' && (!isValidCardNumber(cardNumber) || !cardExpiry || !cardCvv || !cardName))}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors flex justify-center items-center gap-2 shadow-lg shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : `Pagar R$ ${finalTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
                  </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8 animate-fade-in">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                <CheckCircle size={48} />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">Pedido Realizado!</h3>
              <p className="text-gray-500 mb-6 text-sm">Obrigado por comprar na Vision Perfumes.</p>

              {/* Success Info based on Payment Method */}
              {paymentMethod === 'pix' && paymentResultData?.pixCode && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                      <p className="text-sm font-bold text-gray-700 mb-3">Escaneie o QR Code ou Copie o código abaixo:</p>
                      <div className="flex justify-center mb-4">
                          <img src={paymentResultData.pixQrCodeUrl} alt="Pix QR Code" className="w-40 h-40 mix-blend-multiply" />
                      </div>
                      <div className="flex gap-2">
                          <input readOnly value={paymentResultData.pixCode} className="flex-1 p-2 text-xs bg-white border rounded text-gray-500 font-mono truncate" />
                          <button onClick={() => { navigator.clipboard.writeText(paymentResultData.pixCode); addToast('Código copiado!', 'success'); }} className="bg-accent-gold text-white p-2 rounded hover:bg-[#c49b2d]"><Copy size={16} /></button>
                      </div>
                  </div>
              )}

              {paymentMethod === 'boleto' && paymentResultData?.boletoBarcode && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                      <p className="text-sm font-bold text-gray-700 mb-3">Código de Barras do Boleto:</p>
                      <div className="flex gap-2 mb-4">
                          <input readOnly value={paymentResultData.boletoBarcode} className="flex-1 p-2 text-xs bg-white border rounded text-gray-500 font-mono" />
                          <button onClick={() => { navigator.clipboard.writeText(paymentResultData.boletoBarcode); addToast('Código copiado!', 'success'); }} className="bg-accent-gold text-white p-2 rounded hover:bg-[#c49b2d]"><Copy size={16} /></button>
                      </div>
                      <a href={paymentResultData.boletoUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline font-bold">Visualizar Boleto (PDF)</a>
                  </div>
              )}

              <button onClick={() => onSuccess()} className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-accent-gold transition-colors shadow-lg">
                {paymentMethod === 'credit_card' ? 'Continuar Comprando' : 'Finalizar'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
