import React from 'react';
import BrandLogo, { APP_NAME } from '@/components/ui/BrandLogo';

const AppFooter = () => {
    return (
        <div className="layout-footer flex-wrap gap-2 text-600 text-sm">
            <BrandLogo size="sm" />
            <span>
                <span className="font-medium text-900">{APP_NAME}</span> · Universidad de Caldas · {new Date().getFullYear()}
            </span>
        </div>
    );
};

export default AppFooter;
