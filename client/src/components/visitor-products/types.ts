/**
 * Shared types for visitor product modules.
 * All sub-products receive birth data + computed chart through this interface.
 */
import type { ChartData } from '../../lib/astrology';
import type { HourWindow, ServiceId } from '../../types';
import type { SwotServiceSummary, SwotMatrix } from '../free-cards/types';

/** Birth data collected from the /app form */
export interface BirthData {
  dob: string;            // YYYY-MM-DD
  tob: string;            // HH:MM
  lat: number;
  lng: number;
  locationName: string;
}

/** Computed data passed to all sub-products */
export interface VisitorComputedData {
  chart: ChartData;
  weeklyWindows: HourWindow[];
  selectedService: ServiceId;
  swotServices: SwotServiceSummary[];
  swotMatrix: SwotMatrix | null;
  birthPlanetName: string;
}

/** Props every sub-product component receives */
export interface SubProductProps {
  birth: BirthData;
  computed: VisitorComputedData;
}

/** Product card definition for the results grid */
export interface ProductCardDef {
  id: string;
  title: string;
  icon: string;
  description: string;
  category: 'timeceptor' | 'astro';
  /** If true, show a "free for limited time" badge */
  freePromo?: boolean;
}
