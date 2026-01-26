
import React, { useState } from 'react';
import { Edit3, X, Zap, Save, Phone, MapPin, MessageCircle, CheckCircle } from 'lucide-react';
import { DeliveryData } from '../types';

interface DeliveryCardProps {
  data: DeliveryData;
  index?: number;
  distanceText?: string;
  onClear: () => void;
  onSave?: (updated: DeliveryData) => void;
  onConfirm?: () => void;
  onComplete?: () => void;
  onStartNavigation?: () => void;
  isListItem?: boolean;
}

const DeliveryCard: React.FC<DeliveryCardProps> = ({ data, index, distanceText, onClear, onSave, onConfirm, onComplete, onStartNavigation, isListItem = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<DeliveryData>(data);

  const openNavigation = (type: 'google' | 'waze') => {
    const fullAddress = `${editedData.endereco}, ${editedData.bairro || ''}, ${editedData.cidade || ''}, ${editedData.pais || ''}, ${editedData.cep || ''}`;
    const address = encodeURIComponent(fullAddress);
    
    // Dispara atualização de status para 'A caminho'
    if (onStartNavigation) onStartNavigation();

    if (type === 'google') {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, '_blank');
    } else {
      window.open(`https://waze.com/ul?q=${address}&navigate=yes`, '_blank');
    }
  };

  const handleWhatsApp = () => {
    if (!editedData.telefone) return;
    const cleanPhone = editedData.telefone.replace(/\D/g, '');
    const message = encodeURIComponent("Olá, estou a caminho da sua entrega.");
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const handleCall = () => {
    if (!editedData.telefone) return;
    window.location.href = `tel:${editedData.telefone}`;
  };

  const styles = {
    previewCard: {
      backgroundColor: '#FFFFFF',
      padding: '20px',
      margin: '10px',
      borderRadius: '24px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
    },
    deliveryCard: {
      backgroundColor: data.status === 'delivered' ? '#F8FAFC' : '#FFFFFF',
      padding: '16px',
      margin: '8px 12px',
      borderRadius: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      opacity: data.status === 'delivered' ? 0.7 : 1,
    },
    deliveryName: {
      fontSize: '16px',
      fontWeight: '700' as const,
      color: '#1a1a1a',
      marginBottom: '4px'
    },
    deliveryAddress: {
      fontSize: '14px',
      color: '#4a4a4a',
      lineHeight: '1.4',
    },
    sendButton: {
      marginTop: '16px',
      backgroundColor: '#2E7D32',
      height: '48px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      cursor: 'pointer',
      border: 'none'
    },
    completeButton: {
      backgroundColor: '#059669',
      height: '48px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      cursor: 'pointer',
      border: 'none',
      marginTop: '12px'
    },
    actionBtn: {
      flex: 1,
      height: '44px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontSize: '13px',
      fontWeight: '700' as const,
      border: 'none',
      cursor: 'pointer'
    },
    gpsRow: {
      display: 'flex',
      flexDirection: 'row' as const,
      marginTop: '12px',
      gap: '10px'
    },
    gpsButton: {
      flex: 1,
      height: '48px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      border: 'none',
      transition: 'all 0.2s ease'
    },
    googleBtn: {
      backgroundColor: '#4285F4',
    },
    wazeBtn: {
      backgroundColor: '#33CCFF',
    },
    gpsText: {
      color: '#FFFFFF',
      fontSize: '14px',
      fontWeight: '700' as const,
    }
  };

  if (isEditing) {
    return (
      <div className="w-full bg-white rounded-t-[2rem] p-8 shadow-2xl space-y-6 animate-in slide-in-from-bottom">
        <div className="flex justify-between items-center border-b pb-4 border-slate-100">
           <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">Editor LogiFlow</h3>
           <button onClick={() => setIsEditing(false)} className="p-2 bg-slate-50 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Nome do Cliente</label>
            <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm" value={editedData.nome} onChange={e => setEditedData({...editedData, nome: e.target.value})} placeholder="Nome" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Endereço Completo</label>
            <textarea className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm" value={editedData.endereco} rows={2} onChange={e => setEditedData({...editedData, endereco: e.target.value})} placeholder="Rua, Número, Bairro" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Telefone</label>
              <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm" value={editedData.telefone} onChange={e => setEditedData({...editedData, telefone: e.target.value})} placeholder="Telefone" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">CEP</label>
              <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm" value={editedData.cep} onChange={e => setEditedData({...editedData, cep: e.target.value})} placeholder="CEP" />
            </div>
          </div>
        </div>
        <button onClick={() => { onSave?.(editedData); setIsEditing(false); }} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 active:scale-95 transition-all border-none">
          <Save className="w-5 h-5" /> Salvar Alterações
        </button>
      </div>
    );
  }

  const cardStyle = isListItem ? styles.deliveryCard : styles.previewCard;

  return (
    <div 
      style={{
        ...cardStyle,
        width: isListItem ? 'auto' : 'calc(100% - 24px)'
      }}
      className={`flex flex-col relative transition-all ${!isListItem && 'animate-in slide-in-from-bottom duration-300'}`}
    >
      {!isListItem && <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4" />}

      {index && (
        <div className={`absolute -top-2 -left-2 text-white text-[10px] font-black w-8 h-8 rounded-full flex items-center justify-center border-4 border-slate-50 z-20 shadow-lg ${data.status === 'delivered' ? 'bg-emerald-500' : data.status === 'on_way' ? 'bg-amber-500' : 'bg-slate-900'}`}>
          {data.status === 'delivered' ? <CheckCircle className="w-4 h-4" /> : index}
        </div>
      )}

      {distanceText && isListItem && data.status !== 'delivered' && (
        <div className="absolute top-2 right-12 bg-blue-50 text-blue-700 text-[10px] font-black px-2 py-1 rounded-lg border border-blue-100">
          {distanceText}
        </div>
      )}

      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 style={styles.deliveryName}>{editedData.nome}</h3>
            {data.status === 'delivered' && <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Entregue</span>}
            {data.status === 'on_way' && <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">A Caminho</span>}
          </div>
          
          <div className="flex items-start gap-1.5 mt-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <div style={styles.deliveryAddress}>
              <p className="font-medium text-slate-900">{editedData.endereco}</p>
              <p className="text-slate-500">{editedData.bairro ? `${editedData.bairro}, ` : ''}{editedData.cidade} - {editedData.pais}</p>
              <p className="text-blue-600 font-bold mt-0.5">CEP: {editedData.cep}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-2 text-slate-700">
            <Phone className="w-3.5 h-3.5" />
            <span className="text-sm font-bold">{editedData.telefone || 'Sem telefone'}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
           <button onClick={() => setIsEditing(true)} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 active:scale-90"><Edit3 className="w-4 h-4 text-slate-500" /></button>
           <button onClick={onClear} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 active:scale-90"><X className="w-4 h-4 text-slate-500" /></button>
        </div>
      </div>

      {isListItem && data.status !== 'delivered' && editedData.telefone && (
        <div className="flex gap-2 mt-4">
           <button onClick={handleWhatsApp} style={{...styles.actionBtn, backgroundColor: '#DCF8C6', color: '#075E54'}} className="active:scale-95 transition-all">
             <MessageCircle className="w-4 h-4" /> WhatsApp
           </button>
           <button onClick={handleCall} style={{...styles.actionBtn, backgroundColor: '#E0F2F1', color: '#00695C'}} className="active:scale-95 transition-all">
             <Phone className="w-4 h-4" /> Ligar
           </button>
        </div>
      )}

      {!isListItem && editedData.passo_a_passo && (
        <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 my-4 flex gap-2">
           <Zap className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
           <p className="text-slate-600 text-[12px] italic leading-snug">"{editedData.passo_a_passo}"</p>
        </div>
      )}

      {data.status !== 'delivered' && (
        <div className="space-y-1 mt-4">
          {!isListItem && (
            <button
              onClick={onConfirm}
              style={styles.sendButton}
              className="active:scale-[0.98] transition-all hover:brightness-105"
            >
              <span className="text-white font-bold text-[15px]">Enviar para Lista</span>
            </button>
          )}

          <div style={styles.gpsRow}>
            <button 
              onClick={() => openNavigation('google')}
              style={{ ...styles.gpsButton, ...styles.googleBtn }}
              className="active:scale-95 transition-all shadow-sm hover:brightness-110"
            >
              <span style={styles.gpsText}>Google Maps</span>
            </button>
            <button 
              onClick={() => openNavigation('waze')}
              style={{ ...styles.gpsButton, ...styles.wazeBtn }}
              className="active:scale-95 transition-all shadow-sm hover:brightness-110"
            >
              <span style={styles.gpsText}>Waze</span>
            </button>
          </div>

          {isListItem && (
            <button
              onClick={onComplete}
              style={styles.completeButton}
              className="active:scale-[0.98] transition-all hover:brightness-105"
            >
              <CheckCircle className="w-5 h-5 text-white mr-2" />
              <span className="text-white font-bold text-[15px]">Concluir Entrega</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DeliveryCard;
