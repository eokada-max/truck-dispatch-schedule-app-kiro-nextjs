export interface Location {
  id: string;
  name: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocationFormData {
  name: string;
  address: string;
}
