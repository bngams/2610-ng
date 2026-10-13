export interface Guarantor {
  name: string;
  income: number;
}

export interface Application {
  id?: number;
  locationId: number;
  identity: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  situation: {
    monthlyIncome: number;
    moveInDate: string;
    guarantors: Guarantor[];
  };
}
