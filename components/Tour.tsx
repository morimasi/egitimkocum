import { useEffect, useRef } from 'react';
import { useUI } from '../contexts/UIContext';
import { useDataContext } from '../contexts/DataContext';
import { UserRole } from '../types';

interface TourStep {
    id: string;
    title: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    action?: () => void;
}

const Tour = () => {
    const { isTourActive, tourStep, nextTourStep, endTour, setActivePage } = useUI();
    const { currentUser } = useDataContext();
    const tooltipRef = useRef<HTMLDivElement>(null);

    const isCoach = currentUser?.role === UserRole.Coach;
    
    // Refactored to an imperative style for better readability and TypeScript inference.
    const getTourSteps = (): TourStep[] => {
        const baseSteps: TourStep[] = [
            {
                id: 'tour-step-0',
                title: 'Hoş Geldiniz!',
                content: 'Mahmut Hoca platformuna hoş geldiniz! Hızlı bir turla temel özellikleri tanıyalım.',
                position: 'bottom',
            },
            {
                id: 'tour-step-1',
                title: 'Navigasyon Menüsü',
                content: 'Uygulamanın tüm sayfalarına buradan kolayca erişebilirsiniz.',
                position: 'right',
            },
            {
                id: 'tour-step-3',
                title: 'Genel Bakış Kartları',
                content: isCoach ? 'Öğrenci sayısı ve bekleyen ödevler gibi önemli bilgilere buradan hızlıca göz atın.' : 'Bekleyen ödevlerin ve not ortalaman gibi önemli bilgilere buradan hızlıca göz atın.',
                position: 'bottom',
                action: () => setActivePage('dashboard'),
            },
        ];

        if (isCoach) {
            baseSteps.push({
                id: 'nav-assignments', // Changed ID to target correct element
                title: 'Ödev Yönetimi',
                content: 'Öğrencilerinize yeni bir ödev atamak veya mevcut ödevleri yönetmek için bu sekmeyi kullanabilirsiniz.',
                position: 'right',
                action: () => setActivePage('assignments'),
            });
        }
        
        return baseSteps;
    };

    const tourSteps = getTourSteps();

    useEffect(() => {
        if (isTourActive && tourStep < tourSteps.length) {
            const step = tourSteps[tourStep];
            if (step.action) {
                step.action();
            }

            // A small delay to allow the page to re-render if action changes it
            setTimeout(() => {
                const targetElement = document.getElementById(step.id);
                if (targetElement && tooltipRef.current) {
                    const targetRect = targetElement.getBoundingClientRect();
                    const tooltip = tooltipRef.current;
                    
                    tooltip.style.display = 'block';

                    switch (step.position) {
                        case 'top':
                            tooltip.style.left = `${targetRect.left + targetRect.width / 2 - tooltip.offsetWidth / 2}px`;
                            tooltip.style.top = `${targetRect.top - tooltip.offsetHeight - 10}px`;
                            break;
                        case 'bottom':
                            tooltip.style.left = `${targetRect.left + targetRect.width / 2 - tooltip.offsetWidth / 2}px`;
                            tooltip.style.top = `${targetRect.bottom + 10}px`;
                            break;
                        case 'left':
                            tooltip.style.left = `${targetRect.left - tooltip.offsetWidth - 10}px`;
                            tooltip.style.top = `${targetRect.top + targetRect.height / 2 - tooltip.offsetHeight / 2}px`;
                            break;
                        case 'right':
                            tooltip.style.left = `${targetRect.right + 10}px`;
                            tooltip.style.top = `${targetRect.top + targetRect.height / 2 - tooltip.offsetHeight / 2}px`;
                            break;
                        default:
                            tooltip.style.left = `${window.innerWidth / 2 - tooltip.offsetWidth / 2}px`;
                            tooltip.style.top = `${window.innerHeight / 2 - tooltip.offsetHeight / 2}px`;
                    }

                    targetElement.classList.add('tour-highlight');

                    // Cleanup previous highlight
                    const prevStep = tourSteps[tourStep - 1];
                    if(prevStep) {
                        const prevTarget = document.getElementById(prevStep.id);
                        prevTarget?.classList.remove('tour-highlight');
                    }
                }
            }, 100);

        } else if (isTourActive) {
            endTour();
        }
    }, [isTourActive, tourStep]);

     useEffect(() => {
        // Cleanup all highlights when tour ends
        if (!isTourActive) {
            tourSteps.forEach(step => {
                const targetElement = document.getElementById(step.id);
                targetElement?.classList.remove('tour-highlight');
            });
        }
    }, [isTourActive]);


    if (!isTourActive || tourStep >= tourSteps.length) {
        return null;
    }

    const currentStep = tourSteps[tourStep];

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"></div>
            <div
                ref={tooltipRef}
                className="fixed bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl z-[9999] w-72 transition-all duration-300 animate-fade-in"
                style={{ display: 'none' }}
            >
                <h4 className="font-bold text-lg mb-2 text-primary-600 dark:text-primary-400">{currentStep.title}</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">{currentStep.content}</p>
                <div className="flex justify-between items-center mt-4">
                    <span className="text-xs text-gray-400">{tourStep + 1} / {tourSteps.length}</span>
                    <div>
                        <button onClick={endTour} className="text-sm text-gray-500 hover:text-gray-700 mr-4">Atla</button>
                        <button onClick={nextTourStep} className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700">
                            {tourStep === tourSteps.length - 1 ? 'Bitir' : 'İleri'}
                        </button>
                    </div>
                </div>
                 <style>{`
                    .tour-highlight {
                        position: relative;
                        z-index: 9999;
                        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.7);
                        border-radius: 6px;
                        transition: box-shadow 0.3s;
                    }
                `}</style>
            </div>
        </>
    );
};

export default Tour;