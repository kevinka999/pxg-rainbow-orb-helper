export interface OrbCoordinates {
  x: number;
  y: number;
  z: number;
}

export interface OrbLocation {
  id: number;
  coordinates: OrbCoordinates | null;
  description?: string;
}

export interface OrbGroup {
  name: string;
  locations: OrbLocation[];
}

export type OrbsData = OrbGroup[];
