export type ProductMode = 'HEARING' | 'GLOBAL';

interface ProductDefinition {
    id: ProductMode;
    name: string;
    version: string;
    themeColor: string;
    description: string;
    allowedTabs: string[];
}

export const PRODUCTS: Record<ProductMode, ProductDefinition> = {
    HEARING: {
        id: 'HEARING',
        name: 'Echo Hearing',
        version: 'v1.5 Assist',
        themeColor: '#3b82f6', // Blue
        description: '잔존 청력 최적화 및 청능 재활 시스템',
        allowedTabs: ['transcribe', 'sound', 'rehab']
    },
    GLOBAL: {
        id: 'GLOBAL',
        name: 'Echo Global',
        version: 'v1.5 Pro',
        themeColor: '#10b981', // Green
        description: '실시간 AI 통역 및 커뮤니케이션 플랫폼',
        allowedTabs: ['transcribe', 'translate']
    }
};

// Read from environment variable or default to HEARING
export const CURRENT_PRODUCT: ProductMode = (import.meta.env.VITE_PRODUCT_MODE as ProductMode) || 'HEARING';
