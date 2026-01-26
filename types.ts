
export interface DeliveryData {
  nome: string;
  endereco: string;
  bairro: string;
  cidade: string;
  pais: string;
  cep: string;
  telefone: string;
  passo_a_passo?: string;
  id?: string;
  timestamp?: number;
  lat?: number;
  lng?: number;
  distance?: number;
  status?: 'pending' | 'on_way' | 'delivered';
  completedAt?: number;
}

export enum AppState {
  LANDING = 'LANDING',
  LOGIN = 'LOGIN',
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT',
  HISTORY = 'HISTORY',
  MANUAL = 'MANUAL',
  REPORT = 'REPORT',
  SUBSCRIPTION = 'SUBSCRIPTION',
  IMPORT = 'IMPORT',
  ADMIN = 'ADMIN'
}

export interface UserProfile {
  uid: string;
  email: string;
  signupDate: number;
  isSubscribed: boolean;
  trialEndsAt: number;
  role: 'driver' | 'admin';
  stripeCustomerId?: string;
  subscriptionId?: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'expired';
}
