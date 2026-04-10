/**
 * visitor-products — Modular sub-product components for /results-main-visitor.
 *
 * Architecture:
 *   - Each product is in its own file for independent debugging & expansion
 *   - Products render inside ProductModal (popup/overlay)
 *   - All receive the same SubProductProps (birth data + computed results)
 *   - Adding a new product = create file + add to PRODUCT_CARDS in the page
 */
export { ProductModal } from './ProductModal';

// Astro category
export { HoroscopeChartProduct } from './HoroscopeChartProduct';
export { DashaProduct } from './DashaProduct';
export { PredictionProduct } from './PredictionProduct';
export { HealthProduct } from './HealthProduct';
export { RemediesProduct } from './RemediesProduct';

// Timeceptor category
export { GoldenHourProduct } from './GoldenHourProduct';
export { SwotProduct } from './SwotProduct';
export { PhotoCardProduct } from './PhotoCardProduct';
export { ReelProduct } from './reel/ReelProduct';

// Types
export type { BirthData, VisitorComputedData, SubProductProps, ProductCardDef } from './types';
