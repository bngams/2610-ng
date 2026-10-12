export interface HousingLocationInfo {
  id: number;
  name: string;
  city: string;
  state: string;
  photo: string;
  availableUnits: number;
  wifi: boolean;
  laundry: boolean;
  /** Loyer mensuel (ajouté pour ce lab : les filtres). */
  price: number;
  /** 'apartment' | 'studio' | 'house' (ajouté pour ce lab). */
  type: 'apartment' | 'studio' | 'house';
  /** Référence vers /agents/:id (ajouté pour ce lab : la fiche détail). */
  agentId: number;
}

export interface Review {
  id: number;
  locationId: number;
  author: string;
  rating: number;
  text: string;
  date: string;
}

export interface Agent {
  id: number;
  name: string;
  phone: string;
  email: string;
  agency: string;
}

export interface Availability {
  id: number;
  locationId: number;
  available: boolean;
  updatedAt: string;
}

export interface Booking {
  id?: number;
  locationId: number;
  at: string;
}
